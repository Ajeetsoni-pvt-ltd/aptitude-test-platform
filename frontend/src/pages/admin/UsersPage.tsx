// frontend/src/pages/admin/UsersPage.tsx
import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { getAllUsersApi, updateUserRoleApi, deleteUserApi } from '@/api/adminApi';
import { Button } from '@/components/ui/button';
import { Badge }  from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';

const UsersPage = () => {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers]     = useState<any[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]     = useState(0);
  const [search, setSearch]   = useState('');
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
    if (!confirm(`Role change karein: "${currentRole}" → "${newRole}"?`)) return;
    setActionLoading(userId + '_role');
    try {
      await updateUserRoleApi(userId, newRole);
      fetchUsers();
    } catch (e) { console.error(e); }
    finally { setActionLoading(null); }
  };

  const handleDelete = async (userId: string, name: string) => {
    if (!confirm(`"${name}" ko permanently delete karna chahte ho?`)) return;
    setActionLoading(userId + '_del');
    try {
      await deleteUserApi(userId);
      fetchUsers();
    } catch (e) { console.error(e); }
    finally { setActionLoading(null); }
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">👥 Users Manager</h1>
          <p className="text-gray-500">Total: {total} registered users</p>
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Name ya email se search karo..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { setSearch(searchInput); setPage(1); }
            }}
            className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <Button
            onClick={() => { setSearch(searchInput); setPage(1); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            🔍
          </Button>
          {search && (
            <Button
              variant="outline"
              onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}
            >
              Clear
            </Button>
          )}
        </div>

        {/* Users List */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <span className="text-4xl animate-spin">⏳</span>
          </div>
        ) : (
          <div className="space-y-3">
            {users.length === 0 ? (
              <Card className="border-0 shadow-md">
                <CardContent className="p-10 text-center">
                  <p className="text-5xl mb-3">📭</p>
                  <p className="text-gray-500">Koi user nahi mila!</p>
                </CardContent>
              </Card>
            ) : users.map((user) => (
              <Card key={user._id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg flex-shrink-0">
                        {user.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-800">{user.name}</p>
                          {user._id === currentUser?._id && (
                            <Badge className="bg-blue-100 text-blue-600 text-xs">You</Badge>
                          )}
                          <Badge
                            className={user.role === 'admin'
                              ? 'bg-purple-100 text-purple-700 text-xs'
                              : 'bg-gray-100 text-gray-600 text-xs'}
                          >
                            {user.role === 'admin' ? '👑 Admin' : '🎓 Student'}
                          </Badge>
                        </div>
                        <p className="text-gray-400 text-sm">{user.email}</p>
                        <p className="text-gray-300 text-xs">
                          Joined: {new Date(user.createdAt).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                    </div>

                    {/* Actions — Apne aap pe nahi */}
                    {user._id !== currentUser?._id && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRoleChange(user._id, user.role)}
                          disabled={actionLoading === user._id + '_role'}
                          className="text-purple-600 border-purple-200 hover:bg-purple-50 text-xs"
                        >
                          {actionLoading === user._id + '_role'
                            ? '⏳'
                            : user.role === 'admin' ? '→ Student' : '→ Admin'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(user._id, user.name)}
                          disabled={actionLoading === user._id + '_del'}
                          className="text-red-500 border-red-200 hover:bg-red-50 text-xs"
                        >
                          {actionLoading === user._id + '_del' ? '⏳' : '🗑️'}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}>← Prev</Button>
            <span className="text-sm text-gray-600">Page {page} / {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages}>Next →</Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default UsersPage;