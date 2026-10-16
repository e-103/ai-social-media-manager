import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { execFile } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { promisify } from 'node:util'
import ffmpegPath from 'ffmpeg-static'
import ffprobeStatic from 'ffprobe-static'

// Local-only clip inbox API. Saves dropped videos into clips/inbox/ with a
// <name>.json sidecar that /clip reads (creator, captions, hook, notes, slot).
// Every clip that isn't 9:16 is converted to 1080x1920 (whole frame centered
// over a blurred fill) and the untouched original moves to clips/originals/.
const INBOX = path.resolve(__dirname, 'clips/inbox')
const POSTED = path.resolve(__dirname, 'clips/posted')
const ORIGINALS = path.resolve(__dirname, 'clips/originals')
const VIDEO_EXT = /\.(mp4|mov|m4v|webm)$/i
const SAFE_NAME = /^[a-z0-9-]+\.(mp4|mov|m4v|webm)$/i
// Access control: a random key per server start. Opening /?key=<KEY> sets an
// HttpOnly SameSite=Strict cookie; every /api request must carry it, come from
// this host, and (when the browser sends one) from this origin.
const PORT = 5180
const KEY = crypto.randomBytes(32).toString('hex')
const COOKIE = 'clip_inbox_key'
const ALLOWED_HOSTS = new Set([`127.0.0.1:${PORT}`, `localhost:${PORT}`])
const MAX_UPLOAD_BYTES = 4 * 1024 ** 3

function cookieKey(req: IncomingMessage) {
  const match = (req.headers.cookie ?? '').split(';').map((c) => c.trim()).find((c) => c.startsWith(COOKIE + '='))
  return match ? match.slice(COOKIE.length + 1) : ''
}

function keyMatches(given: string) {
  const a = Buffer.from(given)
  const b = Buffer.from(KEY)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

function allowed(req: IncomingMessage) {
  if (!ALLOWED_HOSTS.has(req.headers.host ?? '')) return false
  const origin = req.headers.origin
  if (origin && !ALLOWED_HOSTS.has(origin.replace(/^http:\/\//, ''))) return false
  const site = req.headers['sec-fetch-site']
  if (site && site !== 'same-origin' && site !== 'none') return false
  return keyMatches(cookieKey(req))
}

const run = promisify(execFile)
const FILL_916 =
  '[0:v]split=2[bg][fg];' +
  '[bg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=20:2[bgb];' +
  '[fg]scale=1080:1920:force_original_aspect_ratio=decrease[fgs];' +
  '[bgb][fgs]overlay=(W-w)/2:(H-h)/2,setsar=1,format=yuv420p[v]'

type Dims = { width: number; height: number }
const dimsCache = new Map<string, { mtime: number; dims: Dims }>()
const converting = new Set<string>()
const failed = new Map<string, string>()
let queue: Promise<void> = Promise.resolve()

async function probe(file: string): Promise<Dims> {
  const mtime = fs.statSync(file).mtimeMs
  const hit = dimsCache.get(file)
  if (hit && hit.mtime === mtime) return hit.dims
  const { stdout } = await run(ffprobeStatic.path, ['-v', 'error', '-select_streams', 'v:0', '-show_streams', '-of', 'json', file])
  const stream = JSON.parse(stdout).streams?.[0] ?? {}
  const rotation = Math.abs(Number(stream.tags?.rotate ?? stream.side_data_list?.find((d: { rotation?: number }) => d.rotation !== undefined)?.rotation ?? 0))
  const turned = rotation === 90 || rotation === 270
  const dims = { width: turned ? stream.height : stream.width, height: turned ? stream.width : stream.height }
  dimsCache.set(file, { mtime, dims })
  return dims
}

const is916 = ({ width, height }: Dims) => width >= 720 && Math.abs(width / height - 9 / 16) < 0.02

// Queue a clip for 9:16 conversion (one at a time). Output is <base>.mp4.
function convertTo916(name: string) {
  if (converting.has(name)) return
  converting.add(name)
  failed.delete(name)
  queue = queue.then(async () => {
    const src = path.join(INBOX, name)
    const base = name.replace(VIDEO_EXT, '')
    const tmp = path.join(INBOX, `.${base}.${process.pid}-${crypto.randomBytes(4).toString('hex')}.converting.mp4`)
    try {
      if (is916(await probe(src))) return
      await run(ffmpegPath as unknown as string, ['-v', 'error', '-y', '-i', src, '-filter_complex', FILL_916, '-map', '[v]', '-map', '0:a?',
        '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', tmp], { maxBuffer: 1 << 24 })
      fs.mkdirSync(ORIGINALS, { recursive: true })
      fs.renameSync(src, path.join(ORIGINALS, name))
      fs.renameSync(tmp, path.join(INBOX, base + '.mp4'))
    } catch (e) {
      failed.set(name, String((e as Error).message ?? e).slice(0, 300))
      fs.rmSync(tmp, { force: true })
    } finally {
      converting.delete(name)
    }
  })
}

const TYPES: Record<string, string> = { '.mp4': 'video/mp4', '.m4v': 'video/mp4', '.mov': 'video/quicktime', '.webm': 'video/webm' }

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

function readJson(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => { data += chunk })
    req.on('end', () => { try { resolve(JSON.parse(data || '{}')) } catch (e) { reject(e) } })
    req.on('error', reject)
  })
}

function sidecar(name: string) {
  return path.join(INBOX, name.replace(VIDEO_EXT, '.json'))
}

function nextName(slug: string, ext: string) {
  const taken = new Set([...fs.readdirSync(INBOX), ...fs.readdirSync(POSTED)].map((f) => f.toLowerCase()))
  for (let n = 1; ; n++) {
    const base = `${slug}-${String(n).padStart(2, '0')}`
    if (![...taken].some((f) => f.startsWith(base + '.'))) return base + ext
  }
}

function inboxVideos() {
  return fs.readdirSync(INBOX).filter((f) => VIDEO_EXT.test(f) && !f.startsWith('.')).sort()
}

async function listClips() {
  return Promise.all(inboxVideos().map(async (name) => {
    const file = path.join(INBOX, name)
    let meta = {}
    try { meta = JSON.parse(fs.readFileSync(sidecar(name), 'utf8')) } catch { /* no sidecar yet */ }
    let dims: Dims | null = null
    try { dims = await probe(file) } catch { /* unreadable video */ }
    const status = converting.has(name) ? 'converting' : failed.has(name) ? 'failed' : dims && is916(dims) ? 'ready' : 'not-vertical'
    return { name, size: fs.statSync(file).size, meta, dims, status, error: failed.get(name) }
  }))
}

function streamVideo(req: IncomingMessage, res: ServerResponse, file: string) {
  const { size } = fs.statSync(file)
  res.setHeader('Content-Type', TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream')
  res.setHeader('Accept-Ranges', 'bytes')
  const range = /bytes=(\d*)-(\d*)/.exec(req.headers.range ?? '')
  if (!range) {
    res.setHeader('Content-Length', size)
    fs.createReadStream(file).pipe(res)
    return
  }
  const start = range[1] ? Number(range[1]) : 0
  const end = range[2] ? Math.min(Number(range[2]), size - 1) : size - 1
  res.statusCode = 206
  res.setHeader('Content-Range', `bytes ${start}-${end}/${size}`)
  res.setHeader('Content-Length', end - start + 1)
  fs.createReadStream(file, { start, end }).pipe(res)
}

function clipInbox(): Plugin {
  return {
    name: 'clip-inbox-api',
    configureServer(server) {
      fs.mkdirSync(INBOX, { recursive: true })
      fs.mkdirSync(POSTED, { recursive: true })
      // Convert anything already sitting in the inbox that isn't 9:16.
      for (const name of inboxVideos()) {
        probe(path.join(INBOX, name)).then((d) => { if (!is916(d)) convertTo916(name) }).catch(() => failed.set(name, 'Could not read this video.'))
      }
      server.httpServer?.once('listening', () => {
        server.config.logger.info(`\n  Clip Inbox private link (only works on this Mac, new key each start):\n  http://127.0.0.1:${PORT}/?key=${KEY}\n`)
      })

      // /?key=<KEY> → set the access cookie and drop the key from the URL.
      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://local')
        const given = url.searchParams.get('key')
        if (given === null) return next()
        if (!ALLOWED_HOSTS.has(req.headers.host ?? '') || !keyMatches(given)) return send(res, 403, { error: 'Invalid key.' })
        res.statusCode = 302
        res.setHeader('Set-Cookie', `${COOKIE}=${KEY}; HttpOnly; SameSite=Strict; Path=/`)
        res.setHeader('Location', '/')
        res.end()
      })

      server.middlewares.use('/api/clips', async (req, res) => {
        if (!allowed(req)) return send(res, 401, { error: 'Locked. Open the private link printed in the terminal (npm run clips).' })
        try {
          const url = new URL(req.url ?? '/', 'http://local')
          const parts = url.pathname.split('/').filter(Boolean).map(decodeURIComponent)

          if (req.method === 'GET' && parts.length === 0) return send(res, 200, await listClips())

          // POST /api/clips?slug=kavi&ext=.mp4&creator=... with the raw file as the body
          if (req.method === 'POST' && parts.length === 0) {
            const slug = (url.searchParams.get('slug') ?? 'clip').toLowerCase().replace(/[^a-z0-9-]/g, '') || 'clip'
            const ext = (url.searchParams.get('ext') ?? '.mp4').toLowerCase()
            if (!VIDEO_EXT.test(ext)) return send(res, 400, { error: 'Only .mp4, .mov, .m4v, or .webm files.' })
            if (Number(req.headers['content-length'] ?? 0) > MAX_UPLOAD_BYTES) return send(res, 413, { error: 'File is over 4 GB.' })
            const name = nextName(slug, ext)
            const out = fs.createWriteStream(path.join(INBOX, name))
            req.pipe(out)
            out.on('finish', () => {
              const creator = url.searchParams.get('creator')
              if (creator) fs.writeFileSync(sidecar(name), JSON.stringify({ creator, captions: 'add', updatedAt: new Date().toISOString() }, null, 2))
              send(res, 201, { name })
              convertTo916(name)
            })
            out.on('error', (e) => send(res, 500, { error: String(e) }))
            return
          }

          const name = parts[0] === 'file' ? parts[1] : parts[0]
          if (!name || !SAFE_NAME.test(name) || !fs.existsSync(path.join(INBOX, name))) return send(res, 404, { error: 'Clip not found.' })

          if (req.method === 'GET' && parts[0] === 'file') return streamVideo(req, res, path.join(INBOX, name))

          if (req.method === 'PUT' && parts[1] === 'meta') {
            const meta = await readJson(req)
            fs.writeFileSync(sidecar(name), JSON.stringify({ ...(meta as object), updatedAt: new Date().toISOString() }, null, 2))
            return send(res, 200, { ok: true })
          }

          if (req.method === 'DELETE' && parts.length === 1) {
            if (converting.has(name)) return send(res, 409, { error: 'Still converting. Try again in a moment.' })
            fs.rmSync(path.join(INBOX, name))
            fs.rmSync(sidecar(name), { force: true })
            return send(res, 200, { ok: true })
          }

          send(res, 405, { error: 'Not supported.' })
        } catch (e) {
          send(res, 500, { error: String(e) })
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), clipInbox()],
  server: { host: '127.0.0.1', port: PORT, strictPort: true, open: `/?key=${KEY}` },
})
