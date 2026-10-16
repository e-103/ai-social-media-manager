import { useEffect, useState } from 'react'
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Copy,
  FileText,
  Hash,
  ImagePlus,
  Inbox,
  Link2,
  Menu,
  MessageCircle,
  Plus,
  Send,
  Settings2,
  Sparkles,
  Trash2,
  WandSparkles,
  X,
} from 'lucide-react'

type Platform = 'LinkedIn' | 'Instagram' | 'X' | 'Facebook'
type QueueStatus = 'Draft' | 'Scheduled'
type Draft = { platform: Platform; text: string }
type QueueItem = Draft & { id: string; status: QueueStatus; scheduledFor?: string; createdAt: number }
type Page = 'Overview' | 'Create post' | 'Queue'

const platforms: Platform[] = ['LinkedIn', 'Instagram', 'X', 'Facebook']
const platformMarks: Record<Platform, string> = { LinkedIn: 'in', Instagram: '◎', X: '𝕏', Facebook: 'f' }
const platformLimits: Record<Platform, number> = { LinkedIn: 3000, Instagram: 2200, X: 280, Facebook: 63206 }
const goals = ['Build awareness', 'Start a conversation', 'Drive traffic', 'Share an update']
const tones = ['Clear & useful', 'Warm & personal', 'Confident', 'Playful']
const storageKey = 'social-studio-queue-v1'

function makePost(platform: Platform, subject: string, tone: string, goal: string): string {
  const topic = subject.replace(/\s+/g, ' ').trim().replace(/[.!?]+$/, '')
  const humanTone = tone === 'Warm & personal' ? 'A small thing I keep coming back to:' : tone === 'Confident' ? 'Here is what matters:' : tone === 'Playful' ? 'An idea worth a second look:' : 'A useful idea to keep in mind:'
  const endings: Record<string, string> = {
    'Build awareness': 'What are you noticing in your own work?',
    'Start a conversation': 'Curious how you would approach it. What do you think?',
    'Drive traffic': 'Explore the details and share what you learn with your team.',
    'Share an update': 'More to come soon. What would you like to see next?',
  }
  const end = endings[goal] ?? endings['Start a conversation']
  if (platform === 'X') return `${humanTone}\n\n${topic}.\n\n${end}`
  if (platform === 'Instagram') return `${humanTone}\n\n${topic}.\n\nSave this for later, or send it to someone who needs the reminder.\n\n#Ideas #CreativeWork`
  if (platform === 'Facebook') return `${humanTone}\n\n${topic}.\n\n${end}`
  return `${humanTone}\n\n${topic}.\n\nThe best ideas become useful when we put them into practice.\n\n${end}`
}

function readQueue(): QueueItem[] {
  try {
    const value = localStorage.getItem(storageKey)
    return value ? (JSON.parse(value) as QueueItem[]) : []
  } catch {
    return []
  }
}

function App() {
  const [page, setPage] = useState<Page>('Create post')
  const [sourceMode, setSourceMode] = useState<'Topic' | 'Repurpose'>('Topic')
  const [source, setSource] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['LinkedIn', 'Instagram'])
  const [tone, setTone] = useState(tones[0])
  const [goal, setGoal] = useState(goals[0])
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [queue, setQueue] = useState<QueueItem[]>(readQueue)
  const [notice, setNotice] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(queue))
  }, [queue])

  const showNotice = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 2600)
  }

  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms((current) => current.includes(platform)
      ? current.filter((item) => item !== platform)
      : [...current, platform])
  }

  const generateDrafts = () => {
    const subject = source.trim()
    if (!subject || selectedPlatforms.length === 0) {
      showNotice(!subject ? 'Add a topic or source first.' : 'Choose at least one platform.')
      return
    }
    setDrafts(selectedPlatforms.map((platform) => ({ platform, text: makePost(platform, subject, tone, goal) })))
  }

  const updateDraft = (platform: Platform, text: string) => {
    setDrafts((current) => current.map((draft) => draft.platform === platform ? { ...draft, text } : draft))
  }

  const addDraftsToQueue = () => {
    if (!drafts.length) return
    const items = drafts.map((draft) => ({ ...draft, id: crypto.randomUUID(), status: 'Draft' as const, createdAt: Date.now() }))
    setQueue((current) => [...items, ...current])
    setDrafts([])
    setPage('Queue')
    showNotice(`${items.length} ${items.length === 1 ? 'draft' : 'drafts'} added to your queue.`)
  }

  const updateQueueItem = (id: string, changes: Partial<QueueItem>) => {
    setQueue((current) => current.map((item) => item.id === id ? { ...item, ...changes } : item))
  }

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      showNotice('Copied to clipboard.')
    } catch {
      showNotice('Clipboard access is unavailable in this browser.')
    }
  }

  const scheduledCount = queue.filter((item) => item.status === 'Scheduled').length
  const draftCount = queue.length - scheduledCount

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <div className="brand-row"><div className="brand-icon"><Sparkles size={17} strokeWidth={2.3} /></div><span>social<span className="brand-light">studio</span></span><button className="icon-button mobile-close" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={18} /></button></div>
        <div className="workspace-picker"><div className="workspace-avatar">S</div><div className="workspace-copy"><strong>Studio workspace</strong><span>Free plan</span></div><ChevronDown size={15} /></div>
        <div className="side-label">WORKSPACE</div>
        <nav className="main-nav" aria-label="Main navigation">
          <button className={`nav-item ${page === 'Overview' ? 'active' : ''}`} onClick={() => { setPage('Overview'); setMenuOpen(false) }}><div className="nav-glyph overview-glyph"><span /><span /><span /><span /></div>Overview</button>
          <button className={`nav-item ${page === 'Create post' ? 'active' : ''}`} onClick={() => { setPage('Create post'); setMenuOpen(false) }}><Plus size={17} />Create post<span className="nav-shortcut">N</span></button>
          <button className={`nav-item ${page === 'Queue' ? 'active' : ''}`} onClick={() => { setPage('Queue'); setMenuOpen(false) }}><CalendarDays size={17} />Content queue{queue.length > 0 && <span className="nav-count">{queue.length}</span>}</button>
        </nav>
        <div className="side-label channels-label">CHANNELS <button className="tiny-add" aria-label="Add channel" title="Channel connections are not configured"><Plus size={14} /></button></div>
        <div className="channel-list">{platforms.map((platform) => <div className="channel-row" key={platform}><span className={`platform-mark mark-${platform.toLowerCase()}`}>{platformMarks[platform]}</span><span>{platform}</span><span className="not-connected">Not connected</span></div>)}</div>
        <div className="sidebar-bottom"><div className="help-note"><div className="help-heading"><CircleHelp size={15} />Good to know</div><p>Drafts stay on this device. Connect a publishing provider to send posts to your channels.</p><button onClick={() => showNotice('Publishing integrations are not configured yet.')}>Connection settings <ArrowRight size={13} /></button></div><button className="profile-row"><div className="profile-avatar">JD</div><div className="profile-copy"><strong>Jamie Davis</strong><span>Personal workspace</span></div><Settings2 size={16} /></button></div>
      </aside>

      <main className="main-area">
        <header className="topbar"><button className="icon-button mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu size={20} /></button><div className="breadcrumbs"><span>Workspace</span><span className="crumb-slash">/</span><strong>{page}</strong></div><div className="topbar-actions"><span className="save-status"><span className="status-dot" />All changes saved</span><button className="icon-button notification-button" aria-label="Notifications" onClick={() => showNotice('You’re all caught up.')}><Bell size={17} /><i /></button><div className="top-avatar">JD</div></div></header>

        {page === 'Create post' && <section className="page-content compose-page">
          <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line" />CONTENT STUDIO</div><h1>Make something <em>worth sharing.</em></h1><p>One idea, shaped for every channel you care about.</p></div><button className="quiet-button" onClick={() => { setSource(''); setDrafts([]) }}><FileText size={15} />Start fresh</button></div>
          <div className="composer-layout">
            <section className="input-panel">
              <div className="section-topline"><span className="step-number">01</span><div><h2>Start with an idea</h2><p>Give your content a starting point.</p></div></div>
              <div className="segmented-control" role="tablist" aria-label="Content source type"><button className={sourceMode === 'Topic' ? 'selected' : ''} onClick={() => setSourceMode('Topic')}><Sparkles size={14} />A topic</button><button className={sourceMode === 'Repurpose' ? 'selected' : ''} onClick={() => setSourceMode('Repurpose')}><Link2 size={14} />Existing content</button></div>
              <label className="field-label" htmlFor="source-input">{sourceMode === 'Topic' ? 'What would you like to talk about?' : 'Paste text or a source URL'}</label>
              <textarea id="source-input" className="source-input" value={source} onChange={(event) => setSource(event.target.value)} placeholder={sourceMode === 'Topic' ? 'e.g. What small teams get wrong about customer research…' : 'Paste an article, notes, transcript, or URL…'} rows={5} />
              <div className="source-foot"><span>{source.length} characters</span><span><ImagePlus size={14} /> Add media <span className="soon-tag">SOON</span></span></div>
              {sourceMode === 'Repurpose' && <div className="local-note"><CircleHelp size={14} />Pasted text is used directly. URL fetching is not connected in this demo.</div>}
              <div className="soft-divider" />
              <div className="section-topline section-topline-small"><span className="step-number">02</span><div><h2>Choose your channels</h2><p>Each draft gets its own format.</p></div></div>
              <div className="platform-grid">{platforms.map((platform) => <button key={platform} onClick={() => togglePlatform(platform)} className={`platform-choice ${selectedPlatforms.includes(platform) ? 'chosen' : ''}`} aria-pressed={selectedPlatforms.includes(platform)}><span className={`platform-mark mark-${platform.toLowerCase()}`}>{platformMarks[platform]}</span><span>{platform}</span>{selectedPlatforms.includes(platform) && <Check size={14} className="choice-check" />}</button>)}</div>
              <div className="soft-divider" />
              <div className="controls-row"><label><span className="field-label">Tone</span><span className="select-wrap"><select value={tone} onChange={(event) => setTone(event.target.value)}>{tones.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={14} /></span></label><label><span className="field-label">Goal</span><span className="select-wrap"><select value={goal} onChange={(event) => setGoal(event.target.value)}>{goals.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={14} /></span></label></div>
              <button className="generate-button" onClick={generateDrafts}><WandSparkles size={17} />Generate drafts<span className="demo-pill">LOCAL DEMO</span><ArrowRight size={16} className="generate-arrow" /></button>
              <p className="demo-disclaimer">Uses a local template. No AI service is connected.</p>
            </section>

            <section className="drafts-area">
              <div className="drafts-heading"><div><div className="eyebrow"><span className="eyebrow-line" />YOUR WORKSPACE</div><h2>{drafts.length ? 'Drafts, ready to refine' : 'Your drafts will live here'}</h2></div>{drafts.length > 0 && <span className="draft-count">{drafts.length} {drafts.length === 1 ? 'draft' : 'drafts'}</span>}</div>
              {drafts.length === 0 ? <div className="empty-drafts"><div className="empty-illustration"><div className="paper paper-back" /><div className="paper paper-front"><span /><span /><span /></div><div className="sparkle-badge"><Sparkles size={17} /></div></div><h3>A good post starts with a good thought.</h3><p>Your tailored drafts will appear here. Edit them until they sound like you, then add them to your queue.</p><div className="empty-foot"><span><span className="mini-dot coral" />Platform-specific copy</span><span><span className="mini-dot green" />You stay in control</span></div></div> : <div className="draft-list">{drafts.map((draft, index) => <article className="draft-card" key={draft.platform}><div className="draft-card-head"><div className="draft-platform"><span className={`platform-mark mark-${draft.platform.toLowerCase()}`}>{platformMarks[draft.platform]}</span><div><strong>{draft.platform}</strong><span>{draft.platform === 'X' ? 'Short-form post' : draft.platform === 'Instagram' ? 'Caption' : 'Social post'}</span></div></div><button className="icon-button small-icon" title="Copy draft" aria-label={`Copy ${draft.platform} draft`} onClick={() => void copyText(draft.text)}><Copy size={15} /></button></div><textarea className="draft-editor" value={draft.text} onChange={(event) => updateDraft(draft.platform, event.target.value)} aria-label={`${draft.platform} draft`} rows={6} /><div className="draft-card-foot"><span className={draft.text.length > platformLimits[draft.platform] ? 'over-limit' : ''}>{draft.text.length.toLocaleString()} / {platformLimits[draft.platform].toLocaleString()}</span><span>{index === 0 ? 'Original angle' : 'Adapted for channel'}</span></div></article>)}</div>}
              {drafts.length > 0 && <div className="draft-actions"><button className="secondary-button" onClick={() => setDrafts([])}><Trash2 size={15} />Discard</button><button className="primary-button" onClick={addDraftsToQueue}><Plus size={16} />Add to queue <ArrowRight size={15} /></button></div>}
              <div className="workflow-strip"><div className="workflow-icon"><MessageCircle size={16} /></div><div><strong>Your voice, your call.</strong><span>Every draft is editable. Nothing gets published without you.</span></div><ArrowRight size={15} /></div>
            </section>
          </div>
        </section>}

        {page === 'Overview' && <section className="page-content overview-page"><div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line" />MONDAY, OCTOBER 3</div><h1>A little room to <em>make.</em></h1><p>Your ideas, drafts, and next steps in one place.</p></div><button className="primary-button" onClick={() => setPage('Create post')}><Plus size={16} />Create a post</button></div><div className="stats-row"><div className="stat-block"><span>IN YOUR QUEUE</span><strong>{queue.length.toString().padStart(2, '0')}</strong><small>posts saved locally</small></div><div className="stat-block"><span>READY TO SCHEDULE</span><strong>{draftCount.toString().padStart(2, '0')}</strong><small>drafts waiting for a date</small></div><div className="stat-block"><span>UPCOMING</span><strong>{scheduledCount.toString().padStart(2, '0')}</strong><small>scheduled on this device</small></div><div className="stat-note"><div className="note-mark"><Sparkles size={17} /></div><strong>Ideas travel better together.</strong><p>Start with one thought. Shape it for the places your people are.</p><button onClick={() => setPage('Create post')}>Open content studio <ArrowRight size={14} /></button></div></div><div className="overview-lower"><div className="overview-section-head"><div><div className="eyebrow"><span className="eyebrow-line" />IN PROGRESS</div><h2>Latest in your queue</h2></div><button className="text-button" onClick={() => setPage('Queue')}>See all <ArrowRight size={14} /></button></div>{queue.length ? <div className="recent-list">{queue.slice(0, 4).map((item) => <QueueRow key={item.id} item={item} onOpen={() => setPage('Queue')} />)}</div> : <div className="overview-empty"><div className="empty-icon"><Inbox size={20} /></div><div><strong>Nothing in the queue just yet.</strong><p>When you save a draft, it will show up here.</p></div><button className="text-button" onClick={() => setPage('Create post')}>Create your first post <ArrowRight size={14} /></button></div>}</div></section>}

        {page === 'Queue' && <section className="page-content queue-page"><div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line" />YOUR CONTENT</div><h1>The <em>queue.</em></h1><p>A calm place for everything you’re getting ready to share.</p></div><button className="primary-button" onClick={() => setPage('Create post')}><Plus size={16} />New post</button></div><div className="queue-toolbar"><div className="queue-tabs"><span className="queue-tab active">All posts <b>{queue.length}</b></span><span className="queue-tab">Drafts <b>{draftCount}</b></span><span className="queue-tab">Scheduled <b>{scheduledCount}</b></span></div><span className="local-badge"><span className="status-dot" />Saved on this device</span></div>{queue.length === 0 ? <div className="queue-empty"><div className="empty-illustration"><div className="paper paper-back" /><div className="paper paper-front"><CalendarDays size={24} /></div><div className="sparkle-badge"><Plus size={16} /></div></div><h2>Your queue is a blank page.</h2><p>Save a draft from the content studio and it will be waiting here.</p><button className="primary-button" onClick={() => setPage('Create post')}><Plus size={16} />Create a post</button></div> : <div className="queue-list">{queue.map((item) => <article className="queue-card" key={item.id}><div className="queue-card-meta"><div className="draft-platform"><span className={`platform-mark mark-${item.platform.toLowerCase()}`}>{platformMarks[item.platform]}</span><div><strong>{item.platform}</strong><span>{new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span></div></div><span className={`status-badge ${item.status.toLowerCase()}`}><span />{item.status}</span></div><textarea className="queue-editor" aria-label={`${item.platform} queued post`} value={item.text} onChange={(event) => updateQueueItem(item.id, { text: event.target.value })} rows={4} />{item.scheduledFor && <div className="scheduled-line"><Clock3 size={14} />Scheduled for {new Date(item.scheduledFor).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</div>}<div className="queue-card-actions"><button className="text-button" onClick={() => void copyText(item.text)}><Copy size={14} />Copy</button>{item.status === 'Draft' ? <label className="schedule-control"><CalendarDays size={14} /><input aria-label="Schedule date and time" type="datetime-local" min={new Date().toISOString().slice(0, 16)} onChange={(event) => { if (event.target.value) { updateQueueItem(item.id, { status: 'Scheduled', scheduledFor: event.target.value }); showNotice('Scheduled locally. Publishing is not connected.') } }} /><span>Schedule</span></label> : <button className="text-button" onClick={() => updateQueueItem(item.id, { status: 'Draft', scheduledFor: undefined })}><ArrowLeft size={14} />Back to drafts</button>}<button className="icon-button small-icon delete-button" title="Delete post" aria-label="Delete post" onClick={() => setQueue((current) => current.filter((post) => post.id !== item.id))}><Trash2 size={15} /></button></div></article>)}</div>}<div className="queue-footnote"><CircleHelp size={15} /><span>Scheduling is saved locally. Connect a publishing provider to send content to your social channels.</span></div></section>}
      </main>
      {notice && <div className="toast" role="status"><Check size={16} />{notice}<button aria-label="Dismiss notification" onClick={() => setNotice('')}><X size={14} /></button></div>}
    </div>
  )
}

function QueueRow({ item, onOpen }: { item: QueueItem; onOpen: () => void }) {
  return <button className="recent-row" onClick={onOpen}><span className={`platform-mark mark-${item.platform.toLowerCase()}`}>{platformMarks[item.platform]}</span><span className="recent-copy"><strong>{item.text.slice(0, 92)}{item.text.length > 92 ? '…' : ''}</strong><small>{item.platform} · {item.status}</small></span><ArrowRight size={15} /></button>
}

export default App
