// frontend/src/pages/admin/QuestionsPage.tsx
import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { getQuestionsAdminApi, deleteQuestionApi } from '@/api/adminApi';
import { useNavigate } from 'react-router-dom';

const TOPICS = ['', 'Quantitative Aptitude', 'Verbal Ability', 'Logical Reasoning'];
const DIFFICULTIES = ['', 'easy', 'medium', 'hard'];

/* ─── Styles ──────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;400;600;700&display=swap');

  :root {
    --cyan:    #00f5ff;
    --violet:  #7c3aed;
    --magenta: #f000b8;
    --dark:    #050b18;
    --panel:   rgba(0,245,255,0.04);
    --border:  rgba(0,245,255,0.13);
  }

  @keyframes scanline {
    0%   { transform: translateY(-100%); }
    100% { transform: translateY(100vh); }
  }
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes fadeSlideUp {
    from { opacity:0; transform:translateY(24px); }
    to   { opacity:1; transform:translateY(0);    }
  }
  @keyframes rowIn {
    from { opacity:0; transform:translateX(-16px); }
    to   { opacity:1; transform:translateX(0);     }
  }
  @keyframes pulse-ring {
    0%   { transform:scale(1);   opacity:.6; }
    70%  { transform:scale(1.6); opacity:0;  }
    100% { transform:scale(1);   opacity:0;  }
  }
  @keyframes rotateHex {
    from { transform: rotate(0deg);   }
    to   { transform: rotate(360deg); }
  }
  @keyframes dataStream {
    0%,100% { opacity:.3; }
    50%     { opacity:1;  }
  }
  @keyframes deletePop {
    0%   { transform:scale(1);    }
    40%  { transform:scale(1.15); }
    100% { transform:scale(1);    }
  }

  .qp-root {
    font-family: 'Rajdhani', sans-serif;
    background: var(--dark);
    min-height: 100vh;
    color: #e0f7fa;
    position: relative;
    overflow: hidden;
  }
  .qp-root::before {
    content:'';
    position:fixed; inset:0;
    background-image:
      linear-gradient(rgba(0,245,255,.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,245,255,.03) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events:none; z-index:0;
  }
  .scanline {
    position:fixed; left:0; right:0; height:2px;
    background:linear-gradient(90deg,transparent,var(--cyan),transparent);
    opacity:.12;
    animation: scanline 4s linear infinite;
    z-index:1; pointer-events:none;
  }
  .qp-wrap {
    position:relative; z-index:2;
    padding:2rem;
    max-width:1200px;
    margin:0 auto;
  }

  /* ── Header ── */
  .qp-title {
    font-family:'Orbitron',monospace;
    font-weight:900;
    font-size:clamp(1.4rem,3.5vw,2rem);
    letter-spacing:.1em;
    background:linear-gradient(90deg,var(--cyan),var(--magenta),var(--cyan));
    background-size:200% auto;
    -webkit-background-clip:text;
    -webkit-text-fill-color:transparent;
    animation:shimmer 3s linear infinite;
  }
  .qp-sub {
    font-size:.78rem;
    letter-spacing:.22em;
    text-transform:uppercase;
    color:rgba(0,245,255,.5);
    margin-top:.2rem;
    display:flex; align-items:center; gap:.5rem;
  }
  .status-dot {
    display:inline-block;
    width:7px; height:7px;
    border-radius:50%;
    background:var(--cyan);
    position:relative;
    flex-shrink:0;
  }
  .status-dot::after {
    content:'';
    position:absolute; inset:-4px;
    border-radius:50%;
    border:1px solid var(--cyan);
    animation:pulse-ring 1.5s ease-out infinite;
  }

  /* ── Upload Button ── */
  .upload-btn {
    font-family:'Rajdhani',sans-serif;
    font-weight:700;
    font-size:.85rem;
    letter-spacing:.12em;
    text-transform:uppercase;
    border:none; cursor:pointer;
    border-radius:8px;
    padding:.65rem 1.4rem;
    background:linear-gradient(135deg,var(--cyan),var(--violet));
    color:#fff;
    box-shadow:0 0 20px rgba(0,245,255,.2);
    position:relative; overflow:hidden;
    transition:transform .2s, box-shadow .2s;
  }
  .upload-btn::before {
    content:'';
    position:absolute; inset:0;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,.15),transparent);
    transform:translateX(-100%);
    transition:transform .4s;
  }
  .upload-btn:hover::before { transform:translateX(100%); }
  .upload-btn:hover {
    transform:translateY(-3px);
    box-shadow:0 8px 28px rgba(0,245,255,.3);
  }
  .upload-btn:active { transform:scale(.96); }

  /* ── Filters ── */
  .filter-row {
    display:flex; flex-wrap:wrap; gap:.75rem;
    animation:fadeSlideUp .4s ease both;
    animation-delay:.1s;
  }
  .cyber-select {
    font-family:'Rajdhani',sans-serif;
    font-size:.85rem;
    font-weight:600;
    letter-spacing:.08em;
    background:var(--panel);
    border:1px solid var(--border);
    border-radius:8px;
    padding:.55rem 1rem;
    color:#c0e8ff;
    cursor:pointer;
    appearance:none;
    -webkit-appearance:none;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='rgba(0,245,255,0.4)'/%3E%3C/svg%3E");
    background-repeat:no-repeat;
    background-position:right .75rem center;
    padding-right:2.2rem;
    transition:border-color .2s, box-shadow .2s;
  }
  .cyber-select:focus {
    outline:none;
    border-color:var(--cyan);
    box-shadow:0 0 12px rgba(0,245,255,.15);
  }
  .cyber-select option {
    background:#0d1a2e;
    color:#c0e8ff;
  }

  /* ── Question Cards ── */
  .q-card {
    background:var(--panel);
    border:1px solid var(--border);
    border-radius:12px;
    padding:1.25rem 1.4rem;
    position:relative;
    overflow:hidden;
    animation:rowIn .4s ease both;
    transition:transform .2s, box-shadow .2s, border-color .2s;
  }
  .q-card:hover {
    transform:translateY(-3px);
    border-color:rgba(0,245,255,.3);
    box-shadow:0 0 28px rgba(0,245,255,.08), 0 4px 20px rgba(0,0,0,.4);
  }
  /* left accent bar */
  .q-card::before {
    content:'';
    position:absolute; left:0; top:0; bottom:0; width:3px;
    background:linear-gradient(180deg,var(--cyan),var(--violet));
    border-radius:3px 0 0 3px;
    opacity:0;
    transition:opacity .25s;
  }
  .q-card:hover::before { opacity:1; }

  .q-index {
    font-family:'Orbitron',monospace;
    font-size:.65rem;
    color:rgba(0,245,255,.35);
    letter-spacing:.15em;
    margin-right:.5rem;
  }

  /* badges */
  .badge {
    display:inline-block;
    font-size:.7rem;
    font-weight:700;
    letter-spacing:.1em;
    text-transform:uppercase;
    padding:.18rem .65rem;
    border-radius:999px;
    border:1px solid;
  }
  .badge-topic {
    color:#818cf8;
    border-color:rgba(129,140,248,.3);
    background:rgba(129,140,248,.08);
  }
  .badge-subtopic {
    color:rgba(0,245,255,.6);
    border-color:rgba(0,245,255,.2);
    background:rgba(0,245,255,.04);
  }
  .badge-easy   { color:#00f5aa; border-color:rgba(0,245,170,.35); background:rgba(0,245,170,.07); }
  .badge-medium { color:#f5b800; border-color:rgba(245,184,0,.35);  background:rgba(245,184,0,.07); }
  .badge-hard   { color:#ff3d6b; border-color:rgba(255,61,107,.35); background:rgba(255,61,107,.07); }

  .q-text {
    font-size:.95rem;
    font-weight:600;
    color:#d0eeff;
    line-height:1.55;
    margin:.55rem 0;
  }

  /* options */
  .options-row { display:flex; flex-wrap:wrap; gap:.5rem; margin-top:.4rem; }
  .opt {
    font-size:.78rem;
    padding:.22rem .7rem;
    border-radius:999px;
    border:1px solid rgba(0,245,255,.1);
    background:rgba(255,255,255,.03);
    color:rgba(180,210,230,.7);
    font-weight:600;
    letter-spacing:.04em;
    transition:background .2s;
  }
  .opt-correct {
    border-color:rgba(0,245,170,.4);
    background:rgba(0,245,170,.1);
    color:#00f5aa;
  }

  /* delete button */
  .del-btn {
    font-family:'Rajdhani',sans-serif;
    font-size:.8rem;
    font-weight:700;
    letter-spacing:.1em;
    text-transform:uppercase;
    background:rgba(255,61,107,.08);
    border:1px solid rgba(255,61,107,.25);
    color:#ff3d6b;
    border-radius:8px;
    padding:.5rem .9rem;
    cursor:pointer;
    flex-shrink:0;
    transition:background .2s, box-shadow .2s, transform .15s;
    white-space:nowrap;
  }
  .del-btn:hover:not(:disabled) {
    background:rgba(255,61,107,.16);
    box-shadow:0 0 14px rgba(255,61,107,.2);
    animation:deletePop .3s ease;
  }
  .del-btn:disabled { opacity:.45; cursor:not-allowed; }

  /* ── Empty State ── */
  .empty-state {
    background:var(--panel);
    border:1px dashed var(--border);
    border-radius:14px;
    padding:3.5rem;
    text-align:center;
    animation:fadeSlideUp .4s ease;
  }
  .empty-icon { font-size:3rem; margin-bottom:1rem; opacity:.5; }
  .empty-text {
    font-family:'Orbitron',monospace;
    font-size:.75rem;
    letter-spacing:.25em;
    color:rgba(0,245,255,.35);
    text-transform:uppercase;
  }

  /* ── Loading ── */
  .load-wrap {
    display:flex; flex-direction:column;
    align-items:center; justify-content:center;
    padding:5rem 0; gap:1.2rem;
  }
  .hex-spin {
    width:52px; height:52px;
    border:3px solid transparent;
    border-top-color:var(--cyan);
    border-right-color:var(--magenta);
    border-radius:50%;
    animation:rotateHex 1s linear infinite;
    box-shadow:0 0 18px rgba(0,245,255,.25);
  }
  .load-text {
    font-family:'Orbitron',monospace;
    font-size:.7rem;
    letter-spacing:.3em;
    color:var(--cyan);
    text-transform:uppercase;
    animation:dataStream 1.5s ease-in-out infinite;
  }

  /* ── Pagination ── */
  .pagination {
    display:flex; align-items:center; justify-content:center; gap:.75rem;
    padding-top:1.5rem;
    animation:fadeSlideUp .5s ease;
  }
  .page-btn {
    font-family:'Rajdhani',sans-serif;
    font-size:.82rem;
    font-weight:700;
    letter-spacing:.1em;
    text-transform:uppercase;
    background:var(--panel);
    border:1px solid var(--border);
    color:rgba(0,245,255,.7);
    border-radius:8px;
    padding:.5rem 1.1rem;
    cursor:pointer;
    transition:all .2s;
  }
  .page-btn:hover:not(:disabled) {
    border-color:rgba(0,245,255,.4);
    color:var(--cyan);
    box-shadow:0 0 14px rgba(0,245,255,.12);
    transform:translateY(-2px);
  }
  .page-btn:disabled { opacity:.3; cursor:not-allowed; }
  .page-info {
    font-family:'Orbitron',monospace;
    font-size:.7rem;
    letter-spacing:.2em;
    color:rgba(0,245,255,.45);
    padding:0 .5rem;
  }

  /* stagger rows */
  .q-list > .q-card:nth-child(1)  { animation-delay:.04s; }
  .q-list > .q-card:nth-child(2)  { animation-delay:.08s; }
  .q-list > .q-card:nth-child(3)  { animation-delay:.12s; }
  .q-list > .q-card:nth-child(4)  { animation-delay:.16s; }
  .q-list > .q-card:nth-child(5)  { animation-delay:.20s; }
  .q-list > .q-card:nth-child(6)  { animation-delay:.24s; }
  .q-list > .q-card:nth-child(7)  { animation-delay:.28s; }
  .q-list > .q-card:nth-child(8)  { animation-delay:.32s; }
  .q-list > .q-card:nth-child(9)  { animation-delay:.36s; }
  .q-list > .q-card:nth-child(10) { animation-delay:.40s; }
`;

const DIFF_CLASS: Record<string, string> = {
  easy: 'badge-easy',
  medium: 'badge-medium',
  hard: 'badge-hard',
};

const QuestionsPage = () => {
  const navigate = useNavigate();
  const [questions, setQuestions]   = useState<any[]>([]);
  const [isLoading, setLoading]     = useState(true);
  const [page, setPage]             = useState(1);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [topic, setTopic]           = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [deleting, setDeleting]     = useState<string | null>(null);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const r = await getQuestionsAdminApi(page, 10, topic, difficulty);
      if (r.success && r.data) {
        setQuestions(r.data.questions);
        setTotal(r.data.pagination?.totalQuestions || 0);
        setTotalPages(r.data.pagination?.totalPages || 1);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchQuestions(); }, [page, topic, difficulty]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this question from the system?')) return;
    setDeleting(id);
    try {
      await deleteQuestionApi(id);
      fetchQuestions();
    } catch (e) { console.error(e); }
    finally { setDeleting(null); }
  };

  return (
    <>
      <style>{STYLES}</style>
      <AdminLayout>
        <div className="qp-root">
          <div className="scanline" />
          <div className="qp-wrap">

            {/* ── Header ── */}
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem', marginBottom:'1.75rem', animation:'fadeSlideUp .4s ease' }}>
              <div>
                <div className="qp-title">Questions Manager</div>
                <div className="qp-sub">
                  <span className="status-dot" />
                  {total} Records in Database
                </div>
              </div>
              <button className="upload-btn" onClick={() => navigate('/admin/upload')}>
                📤 Upload More
              </button>
            </div>

            {/* ── Filters ── */}
            <div className="filter-row" style={{ marginBottom:'1.5rem' }}>
              <select
                className="cyber-select"
                value={topic}
                onChange={(e) => { setTopic(e.target.value); setPage(1); }}
              >
                <option value="">All Topics</option>
                {TOPICS.filter(Boolean).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <select
                className="cyber-select"
                value={difficulty}
                onChange={(e) => { setDifficulty(e.target.value); setPage(1); }}
              >
                <option value="">All Difficulties</option>
                {DIFFICULTIES.filter(Boolean).map((d) => (
                  <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                ))}
              </select>
            </div>

            {/* ── Content ── */}
            {isLoading ? (
              <div className="load-wrap">
                <div className="hex-spin" />
                <div className="load-text">Fetching Questions…</div>
              </div>
            ) : questions.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <div className="empty-text">No Questions Found</div>
              </div>
            ) : (
              <div className="q-list" style={{ display:'flex', flexDirection:'column', gap:'.75rem' }}>
                {questions.map((q, idx) => (
                  <div key={q._id} className="q-card">
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'1rem' }}>
                      <div style={{ flex:1, minWidth:0 }}>

                        {/* badges row */}
                        <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap:'.4rem', marginBottom:'.5rem' }}>
                          <span className="q-index">#{(page - 1) * 10 + idx + 1}</span>
                          <span className="badge badge-topic">{q.topic}</span>
                          {q.subtopic && (
                            <span className="badge badge-subtopic">{q.subtopic}</span>
                          )}
                          <span className={`badge ${DIFF_CLASS[q.difficulty] || 'badge-topic'}`}>
                            {q.difficulty}
                          </span>
                        </div>

                        {/* question text */}
                        <p className="q-text">{q.questionText}</p>

                        {/* options */}
                        <div className="options-row">
                          {q.options.map((opt: string, i: number) => (
                            <span
                              key={i}
                              className={`opt ${opt === q.correctAnswer ? 'opt-correct' : ''}`}
                            >
                              {['A','B','C','D'][i]}) {opt}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* delete */}
                      <button
                        className="del-btn"
                        onClick={() => handleDelete(q._id)}
                        disabled={deleting === q._id}
                      >
                        {deleting === q._id ? '⏳' : '🗑 Delete'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Pagination ── */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="page-btn"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  ← Prev
                </button>
                <span className="page-info">
                  {page} / {totalPages}
                </span>
                <button
                  className="page-btn"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next →
                </button>
              </div>
            )}

          </div>
        </div>
      </AdminLayout>
    </>
  );
};

export default QuestionsPage;