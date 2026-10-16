import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertTriangle, Check, Copy, Film, Loader2, Trash2, Upload } from 'lucide-react'

// Creators /clip accepts (campaigns.md). Slug becomes the file name prefix.
const CREATORS = [
  { name: 'Dr. Kavi Simpson', slug: 'kavi' },
  { name: 'Alex Hormozi', slug: 'hormozi' },
  { name: 'Joe Rogan', slug: 'rogan' },
  { name: 'MrBeast', slug: 'mrbeast' },
  { name: 'TJR', slug: 'tjr' },
  { name: 'Kai Cenat', slug: 'kai' },
  { name: 'IShowSpeed', slug: 'speed' },
  { name: 'N3on', slug: 'n3on' },
]

type Meta = {
  creator?: string
  captions?: 'add' | 'has'
  hook?: string
  notes?: string
  slot?: string
}
type Clip = { name: string; size: number; meta: Meta; dims: { width: number; height: number } | null; status: 'ready' | 'converting' | 'failed' | 'not-vertical'; error?: string }
type UploadItem = { id: string; file: string; progress: number; error?: string }

const MIN_PAID_SECONDS = 61

function uploadFile(file: File, slug: string, creator: string, onProgress: (p: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const ext = (file.name.match(/\.[a-z0-9]+$/i)?.[0] ?? '.mp4').toLowerCase()
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `/api/clips?slug=${slug}&ext=${ext}&creator=${encodeURIComponent(creator)}`)
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total)
    xhr.onload = () => {
      const body = JSON.parse(xhr.responseText || '{}')
      xhr.status < 300 ? resolve(body.name) : reject(new Error(body.error ?? 'Upload failed'))
    }
    xhr.onerror = () => reject(new Error('Upload failed. Is the dev server running?'))
    xhr.send(file)
  })
}

async function saveMeta(name: string, meta: Meta) {
  await fetch(`/api/clips/${encodeURIComponent(name)}/meta`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(meta),
  })
}

export default function ClipInbox() {
  const [clips, setClips] = useState<Clip[]>([])
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [creator, setCreator] = useState(CREATORS[0].name)
  const [dragging, setDragging] = useState(false)
  const [copied, setCopied] = useState(false)
  const [loadError, setLoadError] = useState('')
  const picker = useRef<HTMLInputElement>(null)
  // Edit count per clip that hasn't reached the server yet. Refreshes keep local meta for
  // these, so the 3s conversion poll can't wipe text the user is still typing.
  const unsaved = useRef(new Map<string, number>())

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/clips')
      if (res.status === 401) {
        setClips([])
        setLoadError('Locked. Open the private link printed in the terminal where you ran npm run clips.')
        return
      }
      const fresh: Clip[] = await res.json()
      setClips((prev) => fresh.map((c) => {
        const local = unsaved.current.has(c.name) && prev.find((p) => p.name === c.name)
        return local ? { ...c, meta: local.meta } : c
      }))
      setLoadError('')
    } catch {
      setLoadError('Can’t reach the clip server. Start it with npm run dev.')
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  // Poll while any clip is still being converted to 9:16.
  const busy = clips.some((c) => c.status === 'converting')
  useEffect(() => {
    if (!busy) return
    const timer = window.setInterval(() => void refresh(), 3000)
    return () => window.clearInterval(timer)
  }, [busy, refresh])

  const addFiles = async (files: FileList | File[]) => {
    const slug = CREATORS.find((c) => c.name === creator)?.slug ?? 'clip'
    for (const file of Array.from(files)) {
      const id = crypto.randomUUID()
      if (!/\.(mp4|mov|m4v|webm)$/i.test(file.name)) {
        setUploads((u) => [...u, { id, file: file.name, progress: 0, error: 'Not a video file (.mp4, .mov, .m4v, .webm)' }])
        continue
      }
      setUploads((u) => [...u, { id, file: file.name, progress: 0 }])
      try {
        await uploadFile(file, slug, creator, (p) => setUploads((u) => u.map((x) => (x.id === id ? { ...x, progress: p } : x))))
        setUploads((u) => u.filter((x) => x.id !== id))
        await refresh()
      } catch (e) {
        setUploads((u) => u.map((x) => (x.id === id ? { ...x, error: (e as Error).message } : x)))
      }
    }
  }

  const updateClip = (name: string, changes: Meta) => {
    unsaved.current.set(name, (unsaved.current.get(name) ?? 0) + 1)
    setClips((list) => list.map((c) => (c.name === name ? { ...c, meta: { ...c.meta, ...changes } } : c)))
  }

  const persist = (clip: Clip) => {
    const edits = unsaved.current.get(clip.name)
    void saveMeta(clip.name, clip.meta).then(() => {
      // Only clear if nothing new was typed while the save was in flight.
      if (unsaved.current.get(clip.name) === edits) unsaved.current.delete(clip.name)
    })
  }

  const remove = async (name: string) => {
    if (!window.confirm(`Remove ${name} from the inbox? The file is deleted.`)) return
    const res = await fetch(`/api/clips/${encodeURIComponent(name)}`, { method: 'DELETE' })
    if (!res.ok) window.alert((await res.json()).error ?? 'Could not remove the clip.')
    await refresh()
  }

  const copyCommand = async () => {
    try {
      await navigator.clipboard.writeText('/clip inbox')
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch { /* clipboard blocked */ }
  }

  return (
    <div className="ci">
      <header className="ci-head">
        <div>
          <p className="ci-eyebrow">Clip Inbox · TikTok + YouTube Shorts</p>
          <h1>Clip Inbox</h1>
          <p className="ci-sub">Drop real clips here. They save to <code>clips/inbox/</code>, then Claude captions, tags, and schedules them.</p>
        </div>
        <button className="ci-cmd" onClick={copyCommand} title="Copy command">
          {copied ? <Check size={15} /> : <Copy size={15} />}
          <span>Then run <code>/clip inbox</code></span>
        </button>
      </header>

      <section className="ci-drop-wrap">
        <label className="ci-field ci-creator">
          <span>Creator for new clips</span>
          <select value={creator} onChange={(e) => setCreator(e.target.value)}>
            {CREATORS.map((c) => <option key={c.slug}>{c.name}</option>)}
          </select>
        </label>
        <div
          className={`ci-drop ${dragging ? 'is-over' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); void addFiles(e.dataTransfer.files) }}
          onClick={() => picker.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && picker.current?.click()}
        >
          <Upload size={26} />
          <strong>Drag video clips here, or click to choose</strong>
          <span>.mp4, .mov, .m4v, .webm · auto-converted to 9:16 (1080×1920) · 61 to 90 seconds earns TikTok Creator Rewards</span>
          <input ref={picker} type="file" accept="video/*" multiple hidden onChange={(e) => e.target.files && void addFiles(e.target.files)} />
        </div>
        {uploads.map((u) => (
          <div key={u.id} className={`ci-upload ${u.error ? 'is-error' : ''}`}>
            <span className="ci-upload-name">{u.file}</span>
            {u.error
              ? <><span>{u.error}</span><button onClick={() => setUploads((x) => x.filter((y) => y.id !== u.id))}>Dismiss</button></>
              : <span className="ci-bar"><i style={{ width: `${Math.round(u.progress * 100)}%` }} /></span>}
          </div>
        ))}
      </section>

      {loadError && <p className="ci-error"><AlertTriangle size={15} /> {loadError}</p>}

      <section>
        <h2 className="ci-h2">In the inbox <span>{clips.length}</span></h2>
        {clips.length === 0
          ? <div className="ci-empty"><Film size={22} /><p>No clips yet. Dropped clips show up here.</p></div>
          : <div className="ci-grid">{clips.map((clip) => <ClipCard key={clip.name} clip={clip} onChange={updateClip} onPersist={persist} onRemove={remove} />)}</div>}
      </section>
    </div>
  )
}

function ClipCard({ clip, onChange, onPersist, onRemove }: {
  clip: Clip
  onChange: (name: string, changes: Meta) => void
  onPersist: (clip: Clip) => void
  onRemove: (name: string) => void
}) {
  const [duration, setDuration] = useState<number | null>(null)
  const latest = useRef(clip)
  latest.current = clip
  const set = (changes: Meta, saveNow = false) => {
    onChange(clip.name, changes)
    if (saveNow) onPersist({ ...clip, meta: { ...clip.meta, ...changes } })
  }
  const save = () => onPersist(latest.current)
  const hookWords = (clip.meta.hook ?? '').trim().split(/\s+/).filter(Boolean).length

  return (
    <article className="ci-card">
      <video src={`/api/clips/file/${encodeURIComponent(clip.name)}`} controls preload="metadata" playsInline onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)} />
      <div className="ci-card-body">
        <div className="ci-card-top">
          <strong>{clip.name}</strong>
          <span className="ci-meta">{duration ? `${Math.round(duration)}s` : '…'} · {(clip.size / 1_048_576).toFixed(1)} MB</span>
        </div>
        {clip.status === 'converting' && <p className="ci-badge is-busy"><Loader2 size={14} className="ci-spin" /> Converting to 9:16… the card updates when it’s done.</p>}
        {clip.status === 'ready' && clip.dims && <p className="ci-badge is-ok"><Check size={14} /> 9:16 vertical · {clip.dims.width}×{clip.dims.height}</p>}
        {clip.status === 'failed' && <p className="ci-warn"><AlertTriangle size={14} /> 9:16 conversion failed: {clip.error}</p>}
        {clip.status === 'not-vertical' && <p className="ci-warn"><AlertTriangle size={14} /> Not 9:16{clip.dims ? ` (${clip.dims.width}×${clip.dims.height})` : ''}. Restart npm run clips to convert it.</p>}
        {duration !== null && duration < MIN_PAID_SECONDS && (
          <p className="ci-warn"><AlertTriangle size={14} /> Under 61s. Won’t earn TikTok Creator Rewards.</p>
        )}
        {duration !== null && duration > 180 && (
          <p className="ci-warn"><AlertTriangle size={14} /> Over 3 min. YouTube won’t treat it as a Short.</p>
        )}

        <label className="ci-field">
          <span>Creator</span>
          <select value={clip.meta.creator ?? ''} onChange={(e) => set({ creator: e.target.value }, true)}>
            {CREATORS.map((c) => <option key={c.slug}>{c.name}</option>)}
          </select>
        </label>

        <div className="ci-field">
          <span>Captions <em>export from CapCut without subtitles; Blotato adds them + your hook</em></span>
          <div className="ci-toggle" role="radiogroup">
            <button role="radio" aria-checked={clip.meta.captions !== 'has'} className={clip.meta.captions !== 'has' ? 'on' : ''} onClick={() => set({ captions: 'add' }, true)}>Add captions (Blotato)</button>
            <button role="radio" aria-checked={clip.meta.captions === 'has'} className={clip.meta.captions === 'has' ? 'on' : ''} onClick={() => set({ captions: 'has' }, true)}>Already captioned</button>
          </div>
        </div>

        <label className="ci-field">
          <span>On-screen hook <em>{hookWords}/8 words, optional</em></span>
          <input value={clip.meta.hook ?? ''} placeholder="She blocked him… then asked to move in" onChange={(e) => set({ hook: e.target.value })} onBlur={save} />
        </label>

        <label className="ci-field">
          <span>What happens in this clip? <em>picks the hashtags</em></span>
          <textarea rows={3} value={clip.meta.notes ?? ''} placeholder="Caller’s girlfriend blocked him on Instagram but wants to move in. Kavi: writing’s on the wall." onChange={(e) => set({ notes: e.target.value })} onBlur={save} />
        </label>

        <label className="ci-field">
          <span>Post on <em>blank = next open slot</em></span>
          <input type="date" value={clip.meta.slot ?? ''} min={new Date().toISOString().slice(0, 10)} onChange={(e) => set({ slot: e.target.value }, true)} />
        </label>

        <button className="ci-remove" onClick={() => onRemove(clip.name)}><Trash2 size={14} /> Remove</button>
      </div>
    </article>
  )
}
