// frontend/src/pages/admin/UsersPage.tsx
import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { getAllUsersApi, updateUserRoleApi, deleteUserApi } from '@/api/adminApi';
import { useAuthStore } from '@/store/authStore';

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
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes dataStream {
    0%,100% { opacity:.4; }
    50%     { opacity:1;  }
  }
  @keyframes avatarGlow {
    0%,100% { box-shadow: 0 0 10px rgba(0,245,255,.2); }
    50%     { box-shadow: 0 0 22px rgba(0,245,255,.45); }
  }
  @keyframes popIn {
    from { opacity:0; transform:scale(.88); }
    to   { opacity:1; transform:scale(1);   }
  }

  .up-root {
    font-family: 'Rajdhani', sans-serif;
    background: var(--dark);
    min-height: 100vh;
    color: #e0f7fa;
    position: relative;
    overflow: hidden;
  }
  .up-root::before {
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
  .up-wrap {
    position:relative; z-index:2;
    padding:2rem;
    max-width:1100px;
    margin:0 auto;
  }

  /* ── Header ── */
  .up-title {
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
  .up-sub {
    font-size:.78rem;
    letter-spacing:.22em;
    text-transform:uppercase;
    color:rgba(0,245,255,.45);
    margin-top:.25rem;
    display:flex; align-items:center; gap:.5rem;
  }
  .status-dot {
    display:inline-block; width:7px; height:7px;
    border-radius:50%; background:var(--cyan);
    position:relative; flex-shrink:0;
  }
  .status-dot::after {
    content:'';
    position:absolute; inset:-4px;
    border-radius:50%;
    border:1px solid var(--cyan);
    animation:pulse-ring 1.5s ease-out infinite;
  }

  /* ── Search Bar ── */
  .search-row {
    display:flex; gap:.65rem; flex-wrap:wrap;
    animation:fadeSlideUp .4s ease both;
    animation-delay:.08s;
  }
  .search-input-wrap {
    flex:1; min-width:200px;
    position:relative;
  }
  .search-icon {
    position:absolute; left:.9rem; top:50%;
    transform:translateY(-50%);
    font-size:.85rem;
    opacity:.45;
    pointer-events:none;
  }
  .cyber-input {
    width:100%;
    font-family:'Rajdhani',sans-serif;
    font-size:.88rem;
    font-weight:600;
    letter-spacing:.06em;
    background:var(--panel);
    border:1px solid var(--border);
    border-radius:8px;
    padding:.6rem 1rem .6rem 2.4rem;
    color:#c0e8ff;
    outline:none;
    transition:border-color .2s, box-shadow .2s;
  }
  .cyber-input::placeholder { color:rgba(0,245,255,.25); }
  .cyber-input:focus {
    border-color:rgba(0,245,255,.45);
    box-shadow:0 0 14px rgba(0,245,255,.12);
  }

  .search-btn {
    font-family:'Rajdhani',sans-serif;
    font-weight:700;
    font-size:.82rem;
    letter-spacing:.12em;
    text-transform:uppercase;
    border:none; cursor:pointer;
    border-radius:8px;
    padding:.6rem 1.2rem;
    background:linear-gradient(135deg,var(--cyan),var(--violet));
    color:#fff;
    box-shadow:0 0 16px rgba(0,245,255,.18);
    transition:transform .2s, box-shadow .2s;
    position:relative; overflow:hidden;
  }
  .search-btn::before {
    content:'';
    position:absolute; inset:0;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,.15),transparent);
    transform:translateX(-100%);
    transition:transform .4s;
  }
  .search-btn:hover::before { transform:translateX(100%); }
  .search-btn:hover {
    transform:translateY(-2px);
    box-shadow:0 6px 22px rgba(0,245,255,.25);
  }

  .clear-btn {
    font-family:'Rajdhani',sans-serif;
    font-weight:700;
    font-size:.82rem;
    letter-spacing:.1em;
    text-transform:uppercase;
    background:rgba(255,255,255,.05);
    border:1px solid rgba(255,255,255,.12);
    color:rgba(200,220,240,.6);
    border-radius:8px;
    padding:.6rem 1rem;
    cursor:pointer;
    transition:background .2s, color .2s;
  }
  .clear-btn:hover {
    background:rgba(255,255,255,.1);
    color:rgba(200,220,255,.9);
  }

  /* ── User Cards ── */
  .user-list { display:flex; flex-direction:column; gap:.75rem; }

  .user-card {
    background:var(--panel);
    border:1px solid var(--border);
    border-radius:12px;
    padding:1.1rem 1.4rem;
    display:flex;
    align-items:center;
    justify-content:space-between;
    flex-wrap:wrap;
    gap:1rem;
    position:relative;
    overflow:hidden;
    animation:rowIn .4s ease both;
    transition:transform .2s, box-shadow .2s, border-color .2s;
  }
  .user-card:hover {
    transform:translateY(-3px);
    border-color:rgba(0,245,255,.28);
    box-shadow:0 0 28px rgba(0,245,255,.07), 0 4px 20px rgba(0,0,0,.4);
  }
  .user-card::before {
    content:'';
    position:absolute; left:0; top:0; bottom:0; width:3px;
    background:linear-gradient(180deg,var(--cyan),var(--violet));
    border-radius:3px 0 0 3px;
    opacity:0;
    transition:opacity .25s;
  }
  .user-card:hover::before { opacity:1; }
  /* self highlight */
  .user-card.is-self {
    border-color:rgba(124,58,237,.3);
    background:rgba(124,58,237,.05);
  }
  .user-card.is-self::before { opacity:1; background:linear-gradient(180deg,var(--violet),var(--magenta)); }

  /* stagger */
  .user-list > .user-card:nth-child(1)  { animation-delay:.04s; }
  .user-list > .user-card:nth-child(2)  { animation-delay:.08s; }
  .user-list > .user-card:nth-child(3)  { animation-delay:.12s; }
  .user-list > .user-card:nth-child(4)  { animation-delay:.16s; }
  .user-list > .user-card:nth-child(5)  { animation-delay:.20s; }
  .user-list > .user-card:nth-child(6)  { animation-delay:.24s; }
  .user-list > .user-card:nth-child(7)  { animation-delay:.28s; }
  .user-list > .user-card:nth-child(8)  { animation-delay:.32s; }
  .user-list > .user-card:nth-child(9)  { animation-delay:.36s; }
  .user-list > .user-card:nth-child(10) { animation-delay:.40s; }

  /* avatar */
  .avatar {
    width:42px; height:42px;
    border-radius:50%;
    border:1.5px solid rgba(0,245,255,.25);
    display:flex; align-items:center; justify-content:center;
    font-family:'Orbitron',monospace;
    font-size:1rem;
    font-weight:900;
    flex-shrink:0;
    transition:border-color .2s;
    background:linear-gradient(135deg,rgba(0,245,255,.08),rgba(124,58,237,.12));
  }
  .user-card:hover .avatar {
    border-color:rgba(0,245,255,.55);
    animation:avatarGlow 1.8s ease-in-out infinite;
  }
  .avatar.admin-av {
    border-color:rgba(240,0,184,.35);
    background:linear-gradient(135deg,rgba(240,0,184,.08),rgba(124,58,237,.14));
    color:#f000b8;
  }
  .avatar.student-av { color:var(--cyan); }

  /* user info */
  .user-name {
    font-size:1rem;
    font-weight:700;
    color:#d8eeff;
    letter-spacing:.04em;
    display:flex; align-items:center; gap:.5rem; flex-wrap:wrap;
  }
  .user-email {
    font-size:.78rem;
    color:rgba(0,245,255,.4);
    letter-spacing:.06em;
    margin-top:.15rem;
  }
  .user-joined {
    font-size:.7rem;
    color:rgba(255,255,255,.2);
    letter-spacing:.08em;
    margin-top:.1rem;
    font-family:'Orbitron',monospace;
  }

  /* badges */
  .badge {
    display:inline-block;
    font-size:.65rem;
    font-weight:700;
    letter-spacing:.12em;
    text-transform:uppercase;
    padding:.15rem .6rem;
    border-radius:999px;
    border:1px solid;
  }
  .badge-you    { color:#818cf8; border-color:rgba(129,140,248,.4); background:rgba(129,140,248,.1); }
  .badge-admin  { color:#f000b8; border-color:rgba(240,0,184,.35);  background:rgba(240,0,184,.07); }
  .badge-student{ color:var(--cyan); border-color:rgba(0,245,255,.25); background:rgba(0,245,255,.05); }

  /* action buttons */
  .action-row { display:flex; gap:.55rem; flex-wrap:wrap; }

  .role-btn {
    font-family:'Rajdhani',sans-serif;
    font-weight:700;
    font-size:.75rem;
    letter-spacing:.1em;
    text-transform:uppercase;
    background:rgba(124,58,237,.1);
    border:1px solid rgba(124,58,237,.3);
    color:#c084fc;
    border-radius:7px;
    padding:.45rem .95rem;
    cursor:pointer;
    transition:background .2s, box-shadow .2s, transform .15s;
    white-space:nowrap;
  }
  .role-btn:hover:not(:disabled) {
    background:rgba(124,58,237,.22);
    box-shadow:0 0 14px rgba(124,58,237,.25);
    transform:translateY(-2px);
  }
  .role-btn:disabled { opacity:.35; cursor:not-allowed; }

  .del-btn {
    font-family:'Rajdhani',sans-serif;
    font-weight:700;
    font-size:.75rem;
    letter-spacing:.1em;
    text-transform:uppercase;
    background:rgba(255,61,107,.07);
    border:1px solid rgba(255,61,107,.25);
    color:#ff3d6b;
    border-radius:7px;
    padding:.45rem .95rem;
    cursor:pointer;
    transition:background .2s, box-shadow .2s, transform .15s;
    white-space:nowrap;
  }
  .del-btn:hover:not(:disabled) {
    background:rgba(255,61,107,.16);
    box-shadow:0 0 14px rgba(255,61,107,.2);
    transform:translateY(-2px);
  }
  .del-btn:disabled { opacity:.35; cursor:not-allowed; }

  .btn-spin {
    display:inline-block;
    width:13px; height:13px;
    border:2px solid rgba(255,255,255,.25);
    border-top-color:currentColor;
    border-radius:50%;
    animation:rotateHex .7s linear infinite;
    vertical-align:middle;
    margin-right:.3rem;
  }

  /* ── Empty ── */
  .empty-state {
    background:var(--panel);
    border:1px dashed var(--border);
    border-radius:14px;
    padding:3.5rem;
    text-align:center;
    animation:fadeSlideUp .4s ease;
  }
  .empty-icon { font-size:3rem; margin-bottom:1rem; opacity:.4; }
  .empty-text {
    font-family:'Orbitron',monospace;
    font-size:.72rem;
    letter-spacing:.25em;
    color:rgba(0,245,255,.3);
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
    font-size:.82rem; font-weight:700;
    letter-spacing:.1em; text-transform:uppercase;
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
    font-size:.7rem; letter-spacing:.2em;
    color:rgba(0,245,255,.4);
    padding:0 .4rem;
  }
`;

/* ─── Component ───────────────────────────────────────────────── */
const UsersPage = () => {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers]           = useState<any[]>([]);
  const [isLoading, setLoading]     = useState(true);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]           = useState(0);
  const [search, setSearch]         = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getAllUsersApi(page, 10, search);
      if (r.success && r.data) {
        setUsers(r.data.users);
        setTotal(r.data.pagination.totalUsers);
        setTotalPages(r.data.pagination.totalPages);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleRoleChange = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'student' : 'admin';
    if (!confirm(`Change role: "${currentRole}" → "${newRole}"?`)) return;
    setActionLoading(userId + '_role');
    try {
      await updateUserRoleApi(userId, newRole);
      fetchUsers();
    } catch (e) { console.error(e); }
    finally { setActionLoading(null); }
  };

  const handleDelete = async (userId: string, name: string) => {
    if (!confirm(`Permanently delete "${name}" from the system?`)) return;
    setActionLoading(userId + '_del');
    try {
      await deleteUserApi(userId);
      fetchUsers();
    } catch (e) { console.error(e); }
    finally { setActionLoading(null); }
  };

  return (
    <>
      <style>{STYLES}</style>
      <AdminLayout>
        <div className="up-root">
          <div className="scanline" />
          <div className="up-wrap">

            {/* ── Header ── */}
            <div style={{ marginBottom:'1.75rem', animation:'fadeSlideUp .35s ease' }}>
              <div className="up-title">Users Manager</div>
              <div className="up-sub">
                <span className="status-dot" />
                {total} Registered Entities in System
              </div>
            </div>

            {/* ── Search ── */}
            <div className="search-row" style={{ marginBottom:'1.5rem' }}>
              <div className="search-input-wrap">
                <span className="search-icon">⌕</span>
                <input
                  type="text"
                  className="cyber-input"
                  placeholder="Search by name or email…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { setSearch(searchInput); setPage(1); }
                  }}
                />
              </div>
              <button className="search-btn" onClick={() => { setSearch(searchInput); setPage(1); }}>
                🔍 Scan
              </button>
              {search && (
                <button className="clear-btn" onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}>
                  ✕ Clear
                </button>
              )}
            </div>

            {/* ── Content ── */}
            {isLoading ? (
              <div className="load-wrap">
                <div className="hex-spin" />
                <div className="load-text">Scanning User Records…</div>
              </div>
            ) : users.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <div className="empty-text">No Users Found</div>
              </div>
            ) : (
              <div className="user-list">
                {users.map((user) => {
                  const isSelf    = user._id === currentUser?._id;
                  const isAdmin   = user.role === 'admin';
                  const initials  = user.name?.[0]?.toUpperCase() || '?';
                  const roleLoading = actionLoading === user._id + '_role';
                  const delLoading  = actionLoading === user._id + '_del';

                  return (
                    <div key={user._id} className={`user-card${isSelf ? ' is-self' : ''}`}>

                      {/* Left: avatar + info */}
                      <div style={{ display:'flex', alignItems:'center', gap:'1rem', minWidth:0 }}>
                        <div className={`avatar ${isAdmin ? 'admin-av' : 'student-av'}`}>
                          {initials}
                        </div>
                        <div style={{ minWidth:0 }}>
                          <div className="user-name">
                            {user.name}
                            {isSelf && <span className="badge badge-you">You</span>}
                            <span className={`badge ${isAdmin ? 'badge-admin' : 'badge-student'}`}>
                              {isAdmin ? '👑 Admin' : '🎓 Student'}
                            </span>
                          </div>
                          <div className="user-email">{user.email}</div>
                          <div className="user-joined">
                            {new Date(user.createdAt).toLocaleDateString('en-GB', {
                              day:'2-digit', month:'short', year:'numeric'
                            }).toUpperCase()}
                          </div>
                        </div>
                      </div>

                      {/* Right: actions */}
                      {!isSelf && (
                        <div className="action-row">
                          <button
                            className="role-btn"
                            onClick={() => handleRoleChange(user._id, user.role)}
                            disabled={!!roleLoading}
                          >
                            {roleLoading
                              ? <><span className="btn-spin" />Processing</>
                              : isAdmin ? '→ Student' : '→ Admin'
                            }
                          </button>
                          <button
                            className="del-btn"
                            onClick={() => handleDelete(user._id, user.name)}
                            disabled={!!delLoading}
                          >
                            {delLoading
                              ? <><span className="btn-spin" />Deleting</>
                              : '🗑 Delete'
                            }
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Pagination ── */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="page-btn"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  ← Prev
                </button>
                <span className="page-info">{page} / {totalPages}</span>
                <button
                  className="page-btn"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
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

export default UsersPage;