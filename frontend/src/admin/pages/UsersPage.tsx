import React, { useEffect, useState } from 'react';
import { adminService } from '../adminService';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const load = async (p = 0) => {
    setLoading(true);
    try {
      const data = await adminService.getUsers(p, 10);
      setUsers(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
      setPage(p);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(0); }, []);

  const handleRoleChange = async (id: number, newRole: string) => {
    setActionLoading(id);
    try {
      await adminService.updateUserRole(id, newRole);
      setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u));
    } catch (e) {
      alert('Lỗi khi cập nhật role!');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Bạn có chắc muốn xóa người dùng "${name}" không?`)) return;
    setActionLoading(id);
    try {
      await adminService.deleteUser(id);
      setUsers(users.filter(u => u.id !== id));
      setTotalElements(t => t - 1);
    } catch {
      alert('Lỗi khi xóa người dùng!');
    } finally {
      setActionLoading(null);
    }
  };

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div>
      <div className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">
            👥 Danh sách người dùng
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 400, marginLeft: 8 }}>
              ({totalElements} người dùng)
            </span>
          </h2>
        </div>

        {loading ? (
          <div className="admin-loading">
            <div className="admin-spinner" /> Đang tải...
          </div>
        ) : users.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty-icon">👤</div>
            <div className="admin-empty-text">Không có người dùng nào</div>
          </div>
        ) : (
          <>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Người dùng</th>
                    <th>Email</th>
                    <th>Vai trò</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>
                        <div className="admin-user-cell">
                          <div className="admin-avatar">{getInitials(user.name)}</div>
                          <div>
                            <div className="admin-user-cell-name">{user.name}</div>
                            <div className="admin-user-cell-email">#{user.id}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{user.email}</td>
                      <td>
                        <span className={`badge ${user.role === 'ADMIN' ? 'badge-admin' : 'badge-user'}`}>
                          {user.role === 'ADMIN' ? '🛡️ Admin' : '👤 User'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <select
                            className="admin-select"
                            value={user.role}
                            onChange={e => handleRoleChange(user.id, e.target.value)}
                            disabled={actionLoading === user.id}
                          >
                            <option value="USER">USER</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                          <button
                            className="admin-btn admin-btn-danger"
                            onClick={() => handleDelete(user.id, user.name)}
                            disabled={actionLoading === user.id}
                          >
                            {actionLoading === user.id ? '⏳' : '🗑️'} Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="admin-pagination">
                <button
                  className="admin-page-btn"
                  onClick={() => load(page - 1)}
                  disabled={page === 0}
                >‹</button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    className={`admin-page-btn ${i === page ? 'active' : ''}`}
                    onClick={() => load(i)}
                  >{i + 1}</button>
                ))}
                <button
                  className="admin-page-btn"
                  onClick={() => load(page + 1)}
                  disabled={page >= totalPages - 1}
                >›</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UsersPage;
