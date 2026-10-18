import { type FormEvent, type ReactNode, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Link, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import {
  BookOpen, Bookmark, Check, CheckCircle2, ChevronDown, ChevronRight, CircleHelp,
  Clock3, ExternalLink, FileText, Flame, FolderOpen, GraduationCap, Home, Library,
  ListChecks, NotebookPen, Plus, Search, Settings2, Sparkles, Target, Trash2,
  TrendingUp, Trophy, X, RotateCcw, CalendarDays, ShieldCheck,
} from 'lucide-react';

const queryClient = new QueryClient();
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
const store = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(`hpas:${key}`);
      if (!raw) return fallback;
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(fallback) && !Array.isArray(parsed)) return fallback;
      if (fallback !== null && typeof fallback === 'object' && !Array.isArray(fallback) && (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed))) return fallback;
      if (typeof fallback === 'number' && (typeof parsed !== 'number' || !Number.isFinite(parsed))) return fallback;
      if (isRecord(fallback) && isRecord(parsed) && Object.values(fallback).every((value) => typeof value === 'boolean') && !Object.values(parsed).every((value) => typeof value === 'boolean')) return fallback;
      if (key === 'attempts' && Array.isArray(parsed)) {
        return parsed.filter((item) => isRecord(item) && typeof item.id === 'string' && typeof item.date === 'string' && typeof item.score === 'number' && typeof item.total === 'number' && isRecord(item.answers) && Array.isArray(item.incorrect)) as T;
      }
      if (key === 'affairs' && Array.isArray(parsed)) {
        return parsed.filter((item) => isRecord(item) && typeof item.id === 'string' && typeof item.date === 'string' && typeof item.title === 'string' && typeof item.summary === 'string' && typeof item.source === 'string') as T;
      }
      if (key === 'pyq-items' && Array.isArray(parsed)) {
        return parsed.filter((item) => isRecord(item) && typeof item.id === 'string' && typeof item.title === 'string' && typeof item.subject === 'string' && typeof item.year === 'string' && typeof item.url === 'string') as T;
      }
      if (key === 'bookmarks' && Array.isArray(parsed)) return parsed.filter((item) => typeof item === 'string') as T;
      return parsed as T;
    } catch {
      return fallback;
    }
  },
  set<T>(key: string, value: T) {
    try { localStorage.setItem(`hpas:${key}`, JSON.stringify(value)); } catch { /* storage can be unavailable */ }
  },
};

const navigation = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/syllabus', label: 'Syllabus', icon: ListChecks },
  { href: '/study-room', label: 'Study Room', icon: BookOpen },
  { href: '/pyq-library', label: 'PYQ Library', icon: FileText },
  { href: '/mock-tests', label: 'Mock Tests', icon: Target },
  { href: '/current-affairs', label: 'Current Affairs', icon: CalendarDays },
  { href: '/my-library', label: 'My Library', icon: Library },
  { href: '/performance', label: 'Performance', icon: TrendingUp },
];

const syllabus = [
  { subject: 'Indian Polity & Governance', topics: ['Constitution: making and features', 'Fundamental Rights and Duties', 'Parliament and state legislature', 'Local self-government', 'Constitutional bodies'] },
  { subject: 'History of India', topics: ['Ancient India: society and culture', 'Medieval India: key developments', 'Modern India and freedom movement', 'Post-independence consolidation'] },
  { subject: 'Himachal Pradesh', topics: ['Geography, rivers and climate', 'History and cultural heritage', 'Economy, agriculture and tourism', 'Administration and local institutions'] },
  { subject: 'Geography & Environment', topics: ['Physical geography of India', 'Resources and agriculture', 'Biodiversity and conservation', 'Climate change and disasters'] },
  { subject: 'Economy', topics: ['Basic economic concepts', 'Planning and inclusive growth', 'Public finance and budget', 'Himachal economy: key sectors'] },
  { subject: 'Science & Technology', topics: ['Everyday science foundations', 'Digital technology and space', 'Health, biotechnology and energy'] },
  { subject: 'Current Events', topics: ['National and international events', 'Himachal government initiatives', 'Reports, awards and important days'] },
];

const sampleNotes = [
  { id: 'federalism', subject: 'Polity', title: 'Federalism, in plain language', text: 'India shares governing power between the Union and the states. The Constitution lists areas of responsibility, while some subjects are shared. In a pinch, the Union has stronger powers than in a classic federation.', mnemonic: 'Three lists: Union, State, Concurrent. Concurrent means both can make laws.' },
  { id: 'monsoon', subject: 'Geography', title: 'Why the monsoon reaches Himachal', text: 'Moisture-bearing south-west monsoon winds rise against the Himalaya. Relief lifts the air, cools it, and encourages rain. Amount and timing vary with altitude and local topography.', mnemonic: 'Mountains make moist air rise; rising air cools and releases rain.' },
  { id: 'panchayat', subject: 'Governance', title: 'The three levels of Panchayati Raj', text: 'The 73rd Constitutional Amendment gave constitutional status to rural local government. The familiar three tiers are village, block, and district levels.', mnemonic: 'Village → Block → District: picture a ladder from local to wider.' },
  { id: 'budget', subject: 'Economy', title: 'A budget is a yearly plan', text: 'A government budget estimates receipts and spending for a financial year. Revenue receipts do not create liabilities; borrowings are capital receipts and do create a repayment obligation.', mnemonic: 'Revenue keeps the lights on; capital builds or borrows.' },
];
const flashcards = [
  { front: 'Which part of the Constitution contains Fundamental Rights?', back: 'Part III. Fundamental Rights are mainly covered in Articles 12–35.' },
  { front: 'What is the capital of Himachal Pradesh?', back: 'Shimla is the state capital. Dharamshala is the winter capital.' },
  { front: 'Name the three tiers of Panchayati Raj.', back: 'Gram Panchayat at village level, Panchayat Samiti at block level, and Zila Parishad at district level.' },
];
const questions = [
  { id: 'q1', subject: 'Polity', prompt: 'Which part of the Indian Constitution deals with Fundamental Rights?', options: ['Part II', 'Part III', 'Part IV', 'Part V'], answer: 1, explanation: 'Part III (Articles 12–35) sets out Fundamental Rights.' },
  { id: 'q2', subject: 'Himachal Pradesh', prompt: 'Which river is also known as the Chandrabhaga in its upper course?', options: ['Beas', 'Ravi', 'Chenab', 'Sutlej'], answer: 2, explanation: 'The Chandra and Bhaga meet at Tandi; the river is known as Chenab downstream.' },
  { id: 'q3', subject: 'Environment', prompt: 'The Ramsar Convention is primarily associated with the conservation of:', options: ['Wetlands', 'Deserts', 'Mountain glaciers', 'Coral reefs'], answer: 0, explanation: 'The Ramsar Convention provides a framework for conserving wetlands and their wise use.' },
  { id: 'q4', subject: 'History', prompt: 'The Indian National Congress was founded in which year?', options: ['1857', '1885', '1905', '1919'], answer: 1, explanation: 'The Indian National Congress was founded in 1885.' },
  { id: 'q5', subject: 'Economy', prompt: 'Which body replaced the Planning Commission?', options: ['Finance Commission', 'NITI Aayog', 'GST Council', 'National Development Council'], answer: 1, explanation: 'NITI Aayog was established in 2015 to replace the Planning Commission.' },
];
type Attempt = { id: string; date: string; score: number; total: number; answers: Record<string, number>; incorrect: string[]; duration: number };
type Entry = { id: string; date: string; title: string; summary: string; source: string };

function useStored<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => store.get(key, fallback));
  useEffect(() => store.set(key, value), [key, value]);
  return [value, setValue] as const;
}

function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const current = navigation.find((item) => item.href === location);
  return <div className="app-shell">
    <aside className="sidebar" aria-label="Main navigation">
      <Link href="/" className="brand" data-testid="link-brand">
        <span className="brand-mark"><GraduationCap size={22} /></span><span><span className="brand-name">Pahāṛi Prep</span><span className="brand-caption">HPAS study companion</span></span>
      </Link>
      <div className="nav-label">Your workspace</div>
      <nav className="nav-list">
        {navigation.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`nav-link ${location === href ? 'active' : ''}`} aria-current={location === href ? 'page' : undefined} data-testid={`nav-${label.toLowerCase().replaceAll(' ', '-')}`}><Icon size={17} strokeWidth={1.8} /><span>{label}</span></Link>)}
      </nav>
      <div className="sidebar-bottom"><ShieldCheck size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />Your progress stays on this device.<br />No account needed to get started.</div>
    </aside>
    <main className="main-area">
      <div className="mobile-header"><Link href="/" className="mobile-brand" data-testid="link-mobile-brand"><span className="brand-mark"><GraduationCap size={18} /></span>Pahāṛi Prep</Link><span className="topbar-note"><Sparkles size={14} /> One step at a time</span></div>
      <header className="topbar"><div className="breadcrumb">Workspace <span style={{ margin: '0 8px' }}>›</span> {current?.label || 'Page'}</div><div className="topbar-note"><Flame size={15} /> A steady start is a strong start</div></header>
      {children}
    </main>
  </div>;
}

function PageHead({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="page-heading animate-in"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="subheading">{description}</p></div>{action}</div>;
}
function CardTitle({ title, icon, right }: { title: string; icon?: ReactNode; right?: ReactNode }) {
  return <div className="card-title-row"><h2 style={{ display: 'flex', alignItems: 'center', gap: 9 }}>{icon}{title}</h2>{right}</div>;
}
function safePercent(n: number, total: number) { return total ? Math.round(n / total * 100) : 0; }

function Dashboard() {
  const [checked, setChecked] = useStored<Record<string, boolean>>('daily-checklist', { 'Read one syllabus topic': false, 'Revise yesterday’s notes': false, 'Attempt 10 practice questions': false });
  const [goal, setGoal] = useStored('daily-goal', 3);
  const [attempts] = useStored<Attempt[]>('attempts', []);
  const [topicProgress] = useStored<Record<string, boolean>>('syllabus-progress', {});
  const topicCount = syllabus.reduce((count, item) => count + item.topics.length, 0);
  const completed = Object.values(topicProgress).filter(Boolean).length;
  const lastAttempt = attempts[0];
  const toggle = (label: string) => setChecked({ ...checked, [label]: !checked[label] });
  return <div className="page-wrap">
    <section className="hero-card animate-in">
      <p className="eyebrow">A clear path, from day one</p><h1>Your HPAS preparation, made manageable.</h1>
      <p className="hero-copy">Build a small daily rhythm. Track the syllabus, learn the basics, and see your progress gather momentum.</p>
      <Link href="/syllabus" className="button" data-testid="link-start-syllabus">Explore the syllabus <ChevronRight size={16} /></Link>
    </section>
    <div className="grid cols-3" style={{ marginBottom: 18 }}>
      <div className="card stat-card"><span className="tag"><ListChecks size={12} /> Syllabus</span><div className="stat-number" data-testid="text-syllabus-completion">{safePercent(completed, topicCount)}%</div><div className="stat-label">{completed} of {topicCount} starter topics checked</div></div>
      <div className="card stat-card"><span className="tag warm"><Target size={12} /> Latest practice</span><div className="stat-number">{lastAttempt ? `${lastAttempt.score}/${lastAttempt.total}` : '—'}</div><div className="stat-label">{lastAttempt ? `Last attempt · ${new Date(lastAttempt.date).toLocaleDateString()}` : 'Your first score is waiting'}</div></div>
      <div className="card stat-card"><span className="tag"><Flame size={12} /> Today</span><div className="stat-number">{Object.values(checked).filter(Boolean).length}<span style={{ fontSize: 17, color: '#789084' }}>/{goal}</span></div><div className="stat-label">small study steps complete</div></div>
    </div>
    <div className="grid dashboard-grid">
      <section className="card"><CardTitle title="Today’s study plan" icon={<CheckCircle2 size={19} color="#54856a" />} right={<label className="goal-control">Daily goal <input data-testid="input-daily-goal" aria-label="Daily study goal" type="number" min="1" max="12" value={goal} onChange={(e) => setGoal(Math.max(1, Math.min(12, Number(e.target.value) || 1)))} /> steps</label>} />
        <p className="subheading" style={{ fontSize: 12, marginBottom: 8 }}>Keep it light enough to finish. You can adjust your goal any time.</p>
        {Object.keys(checked).map((label) => <label key={label} className={`check-row ${checked[label] ? 'done' : ''}`}><input type="checkbox" checked={!!checked[label]} onChange={() => toggle(label)} data-testid={`check-daily-${label.toLowerCase().replaceAll(' ', '-')}`} /><span>{label}</span></label>)}
        <div style={{ marginTop: 16 }}><div className="progress-track"><div className="progress-fill" style={{ width: `${Math.min(100, safePercent(Object.values(checked).filter(Boolean).length, goal))}%` }} /></div><div className="progress-meta"><span>Daily rhythm</span><span>{Math.min(100, safePercent(Object.values(checked).filter(Boolean).length, goal))}%</span></div></div>
      </section>
      <section className="card"><CardTitle title="A gentle nudge" icon={<Clock3 size={18} color="#ba7959" />} />
        <div className="reminder"><span className="reminder-icon"><RotateCcw size={16} /></span><span><strong>Revision works best in small returns.</strong><br />Revisit one topic you checked earlier this week.</span></div>
        <div className="reminder"><span className="reminder-icon"><BookOpen size={16} /></span><span><strong>Make Himachal familiar.</strong><br />Add a short state-geography topic to today’s reading.</span></div>
        <Link href="/study-room" className="link-row" data-testid="link-open-study-room"><BookOpen size={16} /> Open a simple study note <ChevronRight size={15} /></Link>
      </section>
    </div>
    <div className="grid cols-2" style={{ marginTop: 18 }}>
      <section className="card"><CardTitle title="Syllabus at a glance" right={<Link href="/syllabus" className="button ghost small" data-testid="link-view-syllabus">Open tracker <ChevronRight size={14} /></Link>} />
        <div className="subject-list">{syllabus.slice(0, 4).map((item) => { const done = item.topics.filter((topic) => topicProgress[`${item.subject}:${topic}`]).length; return <div className="subject-row" key={item.subject}><div><strong>{item.subject}</strong><small>{done} of {item.topics.length} topics</small></div><span style={{ color: '#63776a', fontSize: 11 }}>{safePercent(done, item.topics.length)}%</span><div className="progress-track"><div className="progress-fill" style={{ width: `${safePercent(done, item.topics.length)}%` }} /></div></div>; })}</div>
      </section>
      <section className="card soft"><CardTitle title="A note before you begin" icon={<CircleHelp size={18} color="#b66e4e" />} />
        <p style={{ fontSize: 13, color: '#586d61', lineHeight: 1.7 }}>You do not need to know everything on day one. Start with the outline, mark what you have covered, then come back for revision. This workspace is a practical companion, not an official source.</p>
        <Link href="/mock-tests" className="button secondary" data-testid="link-first-practice">Try a short practice set <ChevronRight size={15} /></Link>
      </section>
    </div>
    <p className="footer-note">Your checklist and study progress are saved in this browser only. Content here is for preparation support; verify exam details with HPPSC.</p>
  </div>;
}

function SyllabusPage() {
  const [progress, setProgress] = useStored<Record<string, boolean>>('syllabus-progress', {});
  const [open, setOpen] = useState<string[]>([syllabus[0].subject]);
  const total = syllabus.reduce((count, item) => count + item.topics.length, 0);
  const done = Object.values(progress).filter(Boolean).length;
  const toggleTopic = (subject: string, topic: string) => { const key = `${subject}:${topic}`; setProgress({ ...progress, [key]: !progress[key] }); };
  return <div className="page-wrap">
    <PageHead eyebrow="Your map through the material" title="HPAS syllabus tracker" description="A starter outline to help you organise the first steps. Mark topics as you study them." />
    <div className="card" style={{ marginBottom: 16 }}><div className="card-title-row"><div><strong style={{ fontSize: 14 }}>Your outline progress</strong><div className="subheading" style={{ fontSize: 12, marginTop: 4 }}>{done} of {total} topics marked complete</div></div><span className="stat-number" style={{ fontSize: 27, margin: 0 }}>{safePercent(done, total)}%</span></div><div className="progress-track"><div className="progress-fill" style={{ width: `${safePercent(done, total)}%` }} /></div></div>
    <div className="notice" style={{ marginBottom: 17 }}><strong>Starter outline — not official exam advice.</strong> Syllabus structure and scope may change. Verify all details against the latest official HPPSC notification before planning your preparation.</div>
    {syllabus.map((item, index) => {
      const isOpen = open.includes(item.subject);
      const subjectDone = item.topics.filter((topic) => progress[`${item.subject}:${topic}`]).length;
      return <section className="card subject-card" key={item.subject} data-testid={`section-syllabus-${index}`}>
        <div className="subject-header" onClick={() => setOpen(isOpen ? open.filter((name) => name !== item.subject) : [...open, item.subject])} role="button" tabIndex={0} aria-expanded={isOpen} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setOpen(isOpen ? open.filter((name) => name !== item.subject) : [...open, item.subject]); }} data-testid={`toggle-subject-${index}`}>
          <div><h3 style={{ marginBottom: 4 }}>{item.subject}</h3><span className="subheading" style={{ fontSize: 11 }}>{subjectDone}/{item.topics.length} topics covered</span></div><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span className="tag">{safePercent(subjectDone, item.topics.length)}%</span>{isOpen ? <ChevronDown size={17} /> : <ChevronRight size={17} />}</div>
        </div>
        {isOpen && <div style={{ marginTop: 9 }}>{item.topics.map((topic, i) => { const key = `${item.subject}:${topic}`; return <label className="topic-row" key={topic}><input type="checkbox" checked={!!progress[key]} onChange={() => toggleTopic(item.subject, topic)} data-testid={`check-topic-${index}-${i}`} /><span><strong>{topic}</strong><small>{progress[key] ? 'Marked complete — revisit during revision.' : 'A useful place to begin. Check against the current notification.'}</small></span></label>; })}</div>}
      </section>;
    })}
    <p className="footer-note">The tracker is saved locally on this device. It does not represent official coverage or syllabus weighting.</p>
  </div>;
}

function StudyRoom() {
  const [bookmarks, setBookmarks] = useStored<string[]>('bookmarks', []);
  const [cardIndex, setCardIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [search, setSearch] = useState('');
  const visibleNotes = sampleNotes.filter((note) => `${note.title} ${note.subject} ${note.text}`.toLowerCase().includes(search.toLowerCase()));
  const toggleBookmark = (id: string) => setBookmarks(bookmarks.includes(id) ? bookmarks.filter((x) => x !== id) : [...bookmarks, id]);
  const flash = flashcards[cardIndex];
  return <div className="page-wrap">
    <PageHead eyebrow="Read a little. Remember a little." title="Study Room" description="Plain-language starting notes and quick recall practice. Keep the ideas simple before adding detail." />
    <div className="grid dashboard-grid" style={{ marginBottom: 19 }}>
      <section><div className="card-title-row" style={{ marginBottom: 10 }}><h2 style={{ margin: 0 }}>Recall practice</h2><span className="tag"><Sparkles size={12} /> Flashcards</span></div>
        <div className="flashcard" role="button" tabIndex={0} onClick={() => setRevealed(!revealed)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setRevealed(!revealed); }} data-testid="flashcard">
          <div><p className="eyebrow">{revealed ? 'The short answer' : 'Think it through'}</p><h2>{revealed ? flash.back : flash.front}</h2></div>
          <div className="flashcard-footer"><span>{revealed ? 'Tap to see the prompt' : 'Tap the card to reveal'}</span><span>{cardIndex + 1} / {flashcards.length}</span></div>
        </div>
        <div style={{ display: 'flex', gap: 9, marginTop: 10 }}><button className="button secondary" type="button" onClick={() => setRevealed(!revealed)} data-testid="button-reveal-card">{revealed ? 'Show prompt' : 'Reveal answer'}</button><button className="button" type="button" onClick={() => { setCardIndex((cardIndex + 1) % flashcards.length); setRevealed(false); }} data-testid="button-next-card">Next card <ChevronRight size={15} /></button></div>
      </section>
      <section className="card"><CardTitle title="Bookmarked notes" icon={<Bookmark size={18} color="#b66e4e" />} /><p className="subheading" style={{ fontSize: 12, marginBottom: 12 }}>Keep your most useful explanations close.</p>
        {bookmarks.length ? sampleNotes.filter((note) => bookmarks.includes(note.id)).map((note) => <div className="link-row" key={note.id}><Bookmark size={15} /><span style={{ flex: 1 }}>{note.title}</span><button className="button ghost small" onClick={() => toggleBookmark(note.id)} aria-label={`Remove ${note.title} bookmark`} data-testid={`remove-bookmark-${note.id}`}><X size={14} /></button></div>) : <div className="empty-state" style={{ padding: '20px 4px' }}><Bookmark size={24} /><h3>No bookmarks yet</h3><p>Use the bookmark button on a note to save it here.</p></div>}
      </section>
    </div>
    <div className="card-title-row"><h2 style={{ margin: 0 }}>Starter notes</h2><div className="searchbox"><Search size={16} color="#829087" /><input type="search" placeholder="Find a topic…" value={search} onChange={(e) => setSearch(e.target.value)} data-testid="input-note-search" aria-label="Search study notes" /></div></div>
    {visibleNotes.length ? <div className="note-grid">{visibleNotes.map((note) => <article className="card note-card" key={note.id}><div className="card-title-row"><span className="tag">{note.subject}</span><button className={`button ${bookmarks.includes(note.id) ? '' : 'ghost'} small`} type="button" onClick={() => toggleBookmark(note.id)} aria-label={bookmarks.includes(note.id) ? 'Remove bookmark' : 'Bookmark note'} data-testid={`bookmark-${note.id}`}><Bookmark size={14} fill={bookmarks.includes(note.id) ? 'currentColor' : 'none'} />{bookmarks.includes(note.id) ? 'Saved' : 'Save'}</button></div><h3>{note.title}</h3><p>{note.text}</p><div className="mnemonic"><strong>Memory cue:</strong> {note.mnemonic}</div></article>)}</div> : <div className="card empty-state"><Search size={22} /><h3>No notes match that search</h3><p>Try a subject name such as Polity or Geography.</p></div>}
    <p className="footer-note">These are learning aids, not comprehensive notes. Check facts and current details against reliable sources.</p>
  </div>;
}

type PyqItem = { id: string; title: string; subject: string; year: string; url: string };
function PyqLibrary() {
  const [papers, setPapers] = useStored<PyqItem[]>('pyq-items', []);
  const [subject, setSubject] = useState('All subjects');
  const [year, setYear] = useState('All years');
  const [query, setQuery] = useState('');
  const [form, setForm] = useState({ title: '', subject: syllabus[0].subject, year: '', url: '' });
  const [message, setMessage] = useState('');
  const yearOptions = [...new Set(['2025', '2024', '2023', '2022', '2021', '2020', ...papers.map((paper) => paper.year)])]
    .sort((a, b) => Number(b) - Number(a));
  const filteredPapers = papers.filter((paper) =>
    (subject === 'All subjects' || paper.subject === subject) &&
    (year === 'All years' || paper.year === year) &&
    `${paper.title} ${paper.subject} ${paper.year}`.toLowerCase().includes(query.toLowerCase())
  );
  function addPaper(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!/^https?:\/\//i.test(form.url)) { setMessage('Please use a verified http or https source link.'); return; }
    setPapers([{ ...form, id: `${Date.now()}` }, ...papers]);
    setForm({ title: '', subject: syllabus[0].subject, year: '', url: '' });
    setMessage('Your paper reference was added to this device.');
  }
  return <div className="page-wrap">
    <PageHead eyebrow="Find a trustworthy starting point" title="PYQ Library" description="Organise your own previous-year question papers and use the official commission site to locate published material." />
    <div className="notice" style={{ marginBottom: 17 }}><strong>No papers are bundled or fabricated here.</strong> The catalogue below is an empty organiser; it does not download or claim to host official papers.</div>
    <div className="card" style={{ marginBottom: 18 }}>
      <CardTitle title="Official HPPSC source" icon={<ShieldCheck size={18} color="#4e8064" />} />
      <p className="subheading" style={{ marginBottom: 15 }}>For notifications and published examination material, start with the commission’s website.</p>
      <a className="button" href="https://hppsc.hp.gov.in/Home/" target="_blank" rel="noreferrer" data-testid="link-hppsc-official">Visit HPPSC website <ExternalLink size={15} /></a>
    </div>
    <div className="grid dashboard-grid">
      <section className="card"><CardTitle title="Paper organiser" icon={<FolderOpen size={18} color="#b66e4e" />} />
        <p className="subheading" style={{ fontSize: 12, marginBottom: 14 }}>Add references you have verified yourself. This app does not host papers or claim a download.</p>
        {message && <div role="status" className="notice green" style={{ marginBottom: 13 }} data-testid="status-pyq-saved">{message}</div>}
        <form onSubmit={addPaper} className="grid cols-2" style={{ gap: 9, marginBottom: 15 }}>
          <input className="input" placeholder="Paper or exam name" aria-label="Paper or exam name" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required data-testid="input-pyq-title" />
          <select className="select" aria-label="Paper subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} data-testid="input-pyq-paper-subject">{syllabus.map((s) => <option key={s.subject}>{s.subject}</option>)}</select>
          <input className="input" type="number" min="1990" max="2100" placeholder="Year" aria-label="Paper year" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} required data-testid="input-pyq-paper-year" />
          <input className="input" type="url" pattern="https?://.+" placeholder="Verified source URL" aria-label="Verified paper source URL" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} required data-testid="input-pyq-paper-url" />
          <button className="button" type="submit" data-testid="button-add-pyq-reference"><Plus size={15} /> Add reference</button>
        </form>
         <div className="toolbar"><label className="searchbox"><Search size={15} /><input type="search" placeholder="Search your references" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search paper catalogue" data-testid="input-pyq-search" /></label><select className="select" aria-label="Filter by subject" value={subject} onChange={(e) => setSubject(e.target.value)} data-testid="select-pyq-subject"><option>All subjects</option>{syllabus.map((s) => <option key={s.subject}>{s.subject}</option>)}</select><select className="select" aria-label="Filter by year" value={year} onChange={(e) => setYear(e.target.value)} data-testid="select-pyq-year"><option>All years</option>{yearOptions.map((y) => <option key={y}>{y}</option>)}</select></div>
        {filteredPapers.length ? filteredPapers.map((paper) => <div className="link-row" key={paper.id} data-testid={`row-pyq-${paper.id}`}><FileText size={16} /><span style={{ flex: 1 }}><strong>{paper.title}</strong><small style={{ display: 'block', color: '#849087', marginTop: 3 }}>{paper.subject} · {paper.year}</small></span><a href={paper.url} target="_blank" rel="noreferrer" className="button secondary small" data-testid={`link-pyq-source-${paper.id}`}>Open source <ExternalLink size={13} /></a><button className="button ghost small" type="button" aria-label={`Remove ${paper.title}`} onClick={() => { if (window.confirm(`Remove "${paper.title}" from your organiser?`)) setPapers(papers.filter((item) => item.id !== paper.id)); }} data-testid={`delete-pyq-${paper.id}`}><Trash2 size={14} /></button></div>) : <div className="empty-state"><FileText size={27} /><h3>{papers.length ? 'No references match these filters' : 'Your paper shelf is ready'}</h3><p>{papers.length ? 'Adjust your search, subject, or year filter.' : 'No papers are listed until you add verified material yourself. Use subject and year filters to organise your study plan.'}</p></div>}
      </section>
      <aside className="card soft"><CardTitle title="How to use past papers" icon={<BookOpen size={18} />} /><div className="reminder"><span className="reminder-icon">01</span><span>Find the paper on an official or trusted source.</span></div><div className="reminder"><span className="reminder-icon">02</span><span>Note its year and subject before you practise.</span></div><div className="reminder"><span className="reminder-icon">03</span><span>Review your answers and mark weak topics in the syllabus tracker.</span></div><p className="footer-note">Filters are a planning aid only. {query || subject !== 'All subjects' || year !== 'All years' ? `Current filters: ${[subject, year, query && `“${query}”`].filter(Boolean).join(' · ')}.` : ''}</p></aside>
    </div>
  </div>;
}

function MockTests() {
  const [attempts, setAttempts] = useStored<Attempt[]>('attempts', []);
  const [started, setStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [remaining, setRemaining] = useState(8 * 60);
  const [startedAt, setStartedAt] = useState(0);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    if (!started || submitted) return;
    const interval = window.setInterval(() => setRemaining((n) => Math.max(0, n - 1)), 1000);
    return () => window.clearInterval(interval);
  }, [started, submitted]);
  useEffect(() => { if (started && remaining === 0 && !submitted) finish(); }, [remaining, started, submitted]);
  function start() { setAnswers({}); setSubmitted(false); setRemaining(8 * 60); setStartedAt(Date.now()); setStarted(true); setNotice(''); }
  function finish() {
    const score = questions.filter((q) => answers[q.id] === q.answer).length;
    const incorrect = questions.filter((q) => answers[q.id] !== q.answer).map((q) => q.id);
    const attempt: Attempt = { id: `${Date.now()}`, date: new Date().toISOString(), score, total: questions.length, answers, incorrect, duration: Math.max(0, Math.round((Date.now() - startedAt) / 1000)) };
    setAttempts([attempt, ...attempts]); setSubmitted(true); setStarted(false); setNotice('Practice attempt saved on this device.');
  }
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');
  const currentScore = questions.filter((q) => answers[q.id] === q.answer).length;
  return <div className="page-wrap">
    <PageHead eyebrow="Build exam-day familiarity" title="Mock Tests" description="A short practice set with a timer, answer review, and saved results. Learn from each attempt." action={<div className={`timer ${remaining < 60 ? 'low' : ''}`} data-testid="text-quiz-timer"><Clock3 size={17} />{mm}:{ss}</div>} />
    <div className="notice" style={{ marginBottom: 18 }}><strong>Practice questions — not official PYQs.</strong> This sample set is for learning the quiz flow and reviewing basic concepts.</div>
    {!started && !submitted && <section className="card" style={{ marginBottom: 17 }}><CardTitle title="Ready when you are" icon={<Target size={18} color="#b66e4e" />} /><p className="subheading" style={{ marginBottom: 15 }}>Five sample multiple-choice questions · 8 minutes · answers saved after submission.</p><button type="button" className="button" onClick={start} data-testid="button-start-test">Start practice test <ChevronRight size={16} /></button></section>}
    {notice && <div className="notice green" role="status" data-testid="status-attempt-saved" style={{ marginBottom: 16 }}>{notice}</div>}
    {(started || submitted) && <>
      {submitted && <div className="card" style={{ marginBottom: 17 }}><div className="card-title-row"><div><p className="eyebrow">Attempt complete</p><h2 style={{ margin: 0 }}>You scored {currentScore} of {questions.length}</h2></div><span className="tag"><CheckCircle2 size={13} /> {safePercent(currentScore, questions.length)}% correct</span></div><p className="subheading" style={{ marginBottom: 0 }}>Read each explanation and use missed topics to plan your next revision.</p></div>}
      {questions.map((q, index) => <section className="card question" key={q.id} data-testid={`question-${q.id}`}><div className="card-title-row"><span className="tag">{q.subject}</span><span className="subheading" style={{ fontSize: 11 }}>Question {index + 1} of {questions.length}</span></div><h3>{q.prompt}</h3>{q.options.map((option, optionIndex) => {
        let cls = 'option';
        if (submitted && optionIndex === q.answer) cls += ' correct';
        else if (submitted && answers[q.id] === optionIndex && optionIndex !== q.answer) cls += ' incorrect';
        return <label key={option} className={cls}><input type="radio" name={q.id} checked={answers[q.id] === optionIndex} disabled={!started} onChange={() => setAnswers({ ...answers, [q.id]: optionIndex })} data-testid={`answer-${q.id}-${optionIndex}`} /><span>{option}</span>{submitted && optionIndex === q.answer && <Check size={15} style={{ marginLeft: 'auto' }} />}</label>;
      })}{submitted && <div className="review-box"><strong>{answers[q.id] === q.answer ? 'Correct.' : 'Review this one.'}</strong> {q.explanation}</div>}</section>)}
      {started && <div className="card-title-row"><span className="subheading">{Object.keys(answers).length} of {questions.length} answered</span><button type="button" className="button" onClick={finish} data-testid="button-submit-test">Submit answers <Check size={16} /></button></div>}
      {submitted && <button type="button" className="button secondary" onClick={start} data-testid="button-retry-test"><RotateCcw size={15} /> Try again</button>}
    </>}
    <p className="footer-note">Timer runs in this page while the test is active. Completed attempts and missed answers are stored locally in this browser.</p>
  </div>;
}

function CurrentAffairs() {
  const [entries, setEntries] = useStored<Entry[]>('affairs', [
    { id: 'example-1', date: '2025-01-15', title: 'Example placeholder: a state budget update', summary: 'This sample illustrates how you might record the fiscal focus, key allocations, and one question to revisit. It is not a report of live news.', source: 'https://hppsc.hp.gov.in/Home/' },
    { id: 'example-2', date: '2025-01-08', title: 'Example placeholder: a biodiversity brief', summary: 'A template note for connecting a conservation topic to a place, a policy, and a possible exam angle. Replace this placeholder with a verified item.', source: 'https://hppsc.hp.gov.in/Home/' },
  ]);
  const [editing, setEditing] = useState<Entry | null>(null);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), title: '', summary: '', source: '' });
  const [message, setMessage] = useState('');
  function resetForm() { setForm({ date: new Date().toISOString().slice(0, 10), title: '', summary: '', source: '' }); setEditing(null); }
  function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!/^https?:\/\//i.test(form.source)) { setMessage('Please use an http or https source link.'); return; }
    const id = editing?.id.startsWith('example') ? `${Date.now()}` : editing?.id || `${Date.now()}`;
    const entry = { ...form, id };
    setEntries(editing ? entries.map((item) => item.id === editing.id ? entry : item) : [entry, ...entries]);
    setMessage(editing ? 'Entry updated.' : 'Entry added to your local notebook.'); resetForm();
  }
  function edit(entry: Entry) { setEditing(entry); setForm({ date: entry.date, title: entry.title, summary: entry.summary, source: entry.source }); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  return <div className="page-wrap">
    <PageHead eyebrow="A notebook for what changes" title="Current Affairs" description="Capture dated items, a short summary, and where you found them. Your notes stay in this browser." />
    <div className="notice" style={{ marginBottom: 17 }}><strong>Example placeholders are not live news.</strong> There is no live news feed or AI connection. Verify every item and source yourself before studying it.</div>
    {message && <div role="status" className="notice green" data-testid="status-affairs-saved" style={{ marginBottom: 16 }}>{message}</div>}
    <div className="grid dashboard-grid">
      <form className="card" onSubmit={save}><CardTitle title={editing ? 'Edit your entry' : 'Add a study note'} icon={<NotebookPen size={18} color="#b66e4e" />} />
        <label className="eyebrow" htmlFor="affair-date">Date</label><input id="affair-date" className="input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required data-testid="input-affair-date" style={{ width: '100%', marginBottom: 13 }} />
        <label className="eyebrow" htmlFor="affair-title">Headline or topic</label><input id="affair-title" className="input" placeholder="What happened?" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required data-testid="input-affair-title" style={{ width: '100%', marginBottom: 13 }} />
        <label className="eyebrow" htmlFor="affair-summary">Your short summary</label><textarea id="affair-summary" className="textarea" placeholder="Write the key point in your own words…" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} required data-testid="input-affair-summary" style={{ marginBottom: 13 }} />
        <label className="eyebrow" htmlFor="affair-source">Source URL</label><input id="affair-source" className="input" type="url" pattern="https?://.+" placeholder="https://…" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} required data-testid="input-affair-source" style={{ width: '100%', marginBottom: 14 }} />
        <div style={{ display: 'flex', gap: 9 }}><button className="button" type="submit" data-testid="button-save-affair"><Plus size={15} />{editing ? 'Save changes' : 'Add entry'}</button>{editing && <button className="button secondary" type="button" onClick={resetForm} data-testid="button-cancel-affair">Cancel</button>}</div>
      </form>
      <section className="card"><CardTitle title="Your notebook" icon={<CalendarDays size={18} color="#4f8065" />} right={<span className="tag">{entries.length} entries</span>} />
        {entries.length ? [...entries].sort((a, b) => b.date.localeCompare(a.date)).map((entry) => <article className="entry" key={entry.id} data-testid={`entry-affair-${entry.id}`}><div className="card-title-row" style={{ marginBottom: 7 }}><span className="entry-meta">{new Date(`${entry.date}T12:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}{entry.id.startsWith('example') && ' · Example placeholder'}</span><div style={{ display: 'flex', gap: 3 }}><button className="button ghost small" onClick={() => edit(entry)} aria-label={`Edit ${entry.title}`} data-testid={`edit-affair-${entry.id}`}><Settings2 size={14} /></button><button className="button ghost small" onClick={() => { if (window.confirm(`Delete "${entry.title}"?`)) { setEntries(entries.filter((item) => item.id !== entry.id)); setMessage('Entry removed.'); } }} aria-label={`Delete ${entry.title}`} data-testid={`delete-affair-${entry.id}`}><Trash2 size={14} /></button></div></div><h3>{entry.title}</h3><p>{entry.summary}</p><a href={entry.source} target="_blank" rel="noreferrer" data-testid={`link-affair-source-${entry.id}`}>{entry.source} <ExternalLink size={12} style={{ verticalAlign: 'middle' }} /></a></article>) : <div className="empty-state"><NotebookPen size={24} /><h3>Your notebook is clear</h3><p>Add one dated item with a source to begin a useful current-affairs habit.</p></div>}
      </section>
    </div><p className="footer-note">Entries are stored locally in your browser. Keep source links and verify publication dates.</p>
  </div>;
}

function MyLibrary() {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [fileError, setFileError] = useState(false);
  const [page, setPage] = useState('');
  const [savedPage, setSavedPage] = useState('');
  const [pdfBookmarks, setPdfBookmarks] = useStored<Record<string, string>>('pdf-page-bookmarks', {});
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  function getFileKey(selected: File) {
    return `${selected.name}:${selected.size}:${selected.lastModified}`;
  }
  function selectFile(next: File | undefined) {
    if (url) URL.revokeObjectURL(url);
    setPage(''); setSavedPage('');
    setFileError(!!next && next.type !== 'application/pdf' && !next.name.toLowerCase().endsWith('.pdf'));
    if (next && (next.type === 'application/pdf' || next.name.toLowerCase().endsWith('.pdf'))) {
      const bookmark = pdfBookmarks[getFileKey(next)] || '';
      setFile(next); setUrl(URL.createObjectURL(next)); setPage(bookmark); setSavedPage(bookmark);
    }
    else { setFile(null); setUrl(''); }
  }
  function savePdfBookmark() {
    if (!file || !page) return;
    setSavedPage(page);
    setPdfBookmarks({ ...pdfBookmarks, [getFileKey(file)]: page });
  }
  return <div className="page-wrap">
    <PageHead eyebrow="Your own reading, in one place" title="My Library" description="Open a PDF from this device in the browser’s built-in viewer and keep a manual page reminder while it is open." />
    <div className="notice" style={{ marginBottom: 17 }}><strong>Private by design.</strong> Selected PDFs are not uploaded or persistently stored by this app. Local file URLs may not survive a reload. Install/offline behavior requires HTTPS hosting (or localhost) and an initial online visit; runtime external links still need internet.</div>
    <section className="card" style={{ marginBottom: 17 }}><CardTitle title="Choose a PDF" icon={<FolderOpen size={18} color="#b66e4e" />} />
      <div className="file-drop"><FileText size={24} color="#5d8068" /><div style={{ flex: 1 }}><strong style={{ fontSize: 13 }}>{file?.name || 'Select a study document'}</strong><div className="subheading" style={{ fontSize: 11, marginTop: 4 }}>PDF files open locally in your browser. Nothing is sent anywhere.</div></div><input type="file" accept="application/pdf,.pdf" aria-label="Choose a PDF from this device" onChange={(e) => selectFile(e.target.files?.[0])} data-testid="input-library-pdf" /></div>
      {fileError && <div role="alert" className="notice" style={{ marginTop: 12 }} data-testid="status-invalid-pdf">That file does not look like a PDF. Please choose a PDF document.</div>}
    </section>
    {url && <section className="card"><div className="card-title-row"><h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><BookOpen size={18} />{file?.name}</h2><button type="button" className="button ghost small" onClick={() => { setFile(null); setUrl(''); }} data-testid="button-close-pdf"><X size={14} /> Close</button></div>
      <div className="toolbar"><label className="goal-control">Page reminder <input className="input" style={{ width: 90, minHeight: 36 }} type="number" min="1" placeholder="Page" value={page} onChange={(e) => setPage(e.target.value)} aria-label="Page bookmark number" data-testid="input-pdf-page" /></label><button type="button" className="button secondary small" disabled={!page} onClick={savePdfBookmark} data-testid="button-save-pdf-page"><Bookmark size={14} /> Save page</button>{savedPage && <span className="tag" data-testid="text-pdf-bookmark">Remember: page {savedPage}</span>}</div>
      <object className="pdf-frame" data={url} type="application/pdf" aria-label={`PDF reader for ${file?.name}`}><iframe className="pdf-frame" src={url} title={`PDF reader for ${file?.name}`} /></object>
      <p className="footer-note">PDF display and page navigation depend on browser support. If the viewer is blank, open the file in a PDF reader on your device; the page reminder is manual.</p>
    </section>}
    {!url && <div className="card empty-state"><FileText size={28} /><h3>Your reading shelf is ready</h3><p>Choose a PDF from your phone, tablet, or computer to read it here. On Android, use the file picker to browse your device or downloads.</p></div>}
  </div>;
}

function Performance() {
  const [attempts] = useStored<Attempt[]>('attempts', []);
  const totalQuestions = attempts.reduce((n, attempt) => n + attempt.total, 0);
  const totalCorrect = attempts.reduce((n, attempt) => n + attempt.score, 0);
  const incorrectIds = [...new Set(attempts.flatMap((attempt) => attempt.incorrect))];
  const [filter, setFilter] = useState('');
  const review = questions.filter((q) => incorrectIds.includes(q.id) && `${q.subject} ${q.prompt}`.toLowerCase().includes(filter.toLowerCase()));
  return <div className="page-wrap">
    <PageHead eyebrow="Notice the progress, learn from the gaps" title="Performance" description="Your quiz history, overall accuracy, and concepts to revisit. This view is built from your saved local practice attempts." />
    <div className="grid cols-3" style={{ marginBottom: 18 }}>
      <div className="card stat-card"><span className="tag"><Trophy size={12} /> Completed attempts</span><div className="stat-number" data-testid="text-attempt-count">{attempts.length}</div><div className="stat-label">practice sets completed</div></div>
      <div className="card stat-card"><span className="tag warm"><Target size={12} /> Overall accuracy</span><div className="stat-number" data-testid="text-overall-accuracy">{totalQuestions ? `${safePercent(totalCorrect, totalQuestions)}%` : '—'}</div><div className="stat-label">{totalCorrect} correct of {totalQuestions} answered</div></div>
      <div className="card stat-card"><span className="tag"><RotateCcw size={12} /> Review list</span><div className="stat-number">{incorrectIds.length}</div><div className="stat-label">distinct concepts missed</div></div>
    </div>
    <section className="card" style={{ marginBottom: 18 }}><CardTitle title="Score history" icon={<TrendingUp size={18} color="#4f8065" />} />
      {attempts.length ? <div className="table-wrap"><table><thead><tr><th>Attempt</th><th>Date</th><th>Score</th><th>Accuracy</th><th>Missed</th></tr></thead><tbody>{attempts.map((attempt, i) => <tr key={attempt.id} data-testid={`row-attempt-${attempt.id}`}><td>Practice set {attempts.length - i}</td><td>{new Date(attempt.date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</td><td className="history-score">{attempt.score}/{attempt.total}</td><td>{safePercent(attempt.score, attempt.total)}%</td><td>{attempt.incorrect.length}</td></tr>)}</tbody></table></div> : <div className="empty-state"><TrendingUp size={25} /><h3>Your first attempt will appear here</h3><p>Complete a practice set to build a personal score history and review list.</p><Link href="/mock-tests" className="button" data-testid="link-performance-to-test">Go to Mock Tests <ChevronRight size={15} /></Link></div>}
    </section>
    <section className="card"><div className="card-title-row"><h2 style={{ display: 'flex', alignItems: 'center', gap: 9 }}><CircleHelp size={18} color="#b66e4e" />Incorrect-answer review</h2><label className="searchbox"><Search size={15} /><input type="search" placeholder="Filter review…" aria-label="Filter incorrect answers" value={filter} onChange={(e) => setFilter(e.target.value)} data-testid="input-performance-search" /></label></div>
      {review.length ? review.map((q) => <article key={q.id} className="entry"><span className="tag warm">{q.subject}</span><h3 style={{ marginTop: 9 }}>{q.prompt}</h3><p style={{ marginBottom: 0 }}>{q.explanation}</p></article>) : <div className="empty-state"><CheckCircle2 size={24} /><h3>{incorrectIds.length ? 'No review items match' : 'No incorrect answers to review'}</h3><p>{incorrectIds.length ? 'Try another search term.' : 'When you miss a practice question, its explanation will be collected here.'}</p></div>}
    </section>
    <p className="footer-note">Performance is a guide for your revision, not a prediction of exam results. All records remain in this browser.</p>
  </div>;
}

function Router() {
  return <Switch>
    <Route path="/"><Dashboard /></Route>
    <Route path="/syllabus"><SyllabusPage /></Route>
    <Route path="/study-room"><StudyRoom /></Route>
    <Route path="/pyq-library"><PyqLibrary /></Route>
    <Route path="/mock-tests"><MockTests /></Route>
    <Route path="/current-affairs"><CurrentAffairs /></Route>
    <Route path="/my-library"><MyLibrary /></Route>
    <Route path="/performance"><Performance /></Route>
    <Route component={NotFound} />
  </Switch>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}
function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Shell><RoutedErrorBoundary><Router /></RoutedErrorBoundary></Shell></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}
export default App;
