import React, { useEffect, useState } from 'react';
import { adminService } from '../adminService';

interface Post {
  id: number;
  title: string;
  content: string;
  likeCount: number;
  commentCount: number;
  status: string;
  rejectReason?: string;
  appealMessage?: string;
  author?: { name: string };
  tags?: string[];
}


const ForumPage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = async (p = 0) => {
    setLoading(true);
    try {
      const data = await adminService.getPosts(p, 10);
      setPosts(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
      setPage(p);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(0); }, []);

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Xóa bài viết "${title}"?`)) return;
    setDeleting(id);
    try {
      await adminService.deletePost(id);
      setPosts(posts.filter(p => p.id !== id));
      setTotalElements(t => t - 1);
    } catch {
      alert('Lỗi khi xóa bài viết!');
    } finally {
      setDeleting(null);
    }
  };

  const handleStatusUpdate = async (id: number, status: string, title: string) => {
    if (!confirm(`Xác nhận chuyển bài viết "${title}" sang trạng thái ${status}?`)) return;
    try {
      await adminService.updatePostStatus(id, status);
      setPosts(posts.map(p => p.id === id ? { ...p, status } : p));
    } catch {
      alert('Lỗi khi cập nhật trạng thái!');
    }
  };

  const handleReject = async (id: number, title: string) => {
    const reason = window.prompt(`Nhập lý do từ chối bài viết "${title}":`);
    if (reason === null) return;
    if (!reason.trim()) {
      alert("Bạn phải nhập lý do từ chối.");
      return;
    }
    try {
      await adminService.updatePostStatus(id, 'REJECTED', reason);
      setPosts(posts.map(p => p.id === id ? { ...p, status: 'REJECTED' } : p));
    } catch {
      alert('Lỗi khi từ chối!');
    }
  };

  const statusColors: Record<string, { bg: string, text: string, label: string }> = {
    'PENDING': { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b', label: '⏳ Chờ duyệt' },
    'APPROVED': { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981', label: '✅ Đã duyệt' },
    'REJECTED': { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444', label: '❌ Từ chối' },
  };

  return (
    <div>
      <div className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">
            💬 Bài viết diễn đàn
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 400, marginLeft: 8 }}>
              ({totalElements} bài)
            </span>
          </h2>
        </div>

        {loading ? (
          <div className="admin-loading">
            <div className="admin-spinner" /> Đang tải...
          </div>
        ) : posts.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty-icon">💬</div>
            <div className="admin-empty-text">Chưa có bài viết nào</div>
          </div>
        ) : (
          <>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Tiêu đề</th>
                    <th>Tác giả</th>
                    <th>Trạng thái</th>
                    <th>Tags</th>
                    <th>❤️ Lượt thích</th>
                    <th>💬 Bình luận</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map(post => {
                    const st = statusColors[post.status || 'PENDING'] || statusColors['PENDING'];
                    return (
                    <tr key={post.id}>
                      <td style={{ maxWidth: 240 }}>
                        <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {post.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>
                          {post.content.slice(0, 60)}...
                        </div>
                      </td>
                      <td style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                        {post.author?.name || '—'}
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: 20,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: st.bg,
                          color: st.text,
                        }}>
                          {st.label}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {(post.tags || []).slice(0, 2).map(tag => (
                            <span key={tag} style={{
                              padding: '2px 8px', borderRadius: 12,
                              fontSize: '0.7rem', fontWeight: 600,
                              background: 'rgba(124, 58, 237, 0.15)',
                              color: '#a78bfa',
                              border: '1px solid rgba(124, 58, 237, 0.2)',
                            }}>{tag}</span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span style={{ color: '#ef4444', fontWeight: 600 }}>
                          ❤️ {post.likeCount}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: '#60a5fa', fontWeight: 600 }}>
                          💬 {post.commentCount}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {post.status === 'PENDING' && (
                            <>
                              <button
                                className="admin-btn"
                                style={{ background: '#10b981', color: 'white' }}
                                onClick={() => handleStatusUpdate(post.id, 'APPROVED', post.title)}
                              >
                                Duyệt
                              </button>
                                <button
                                  className="admin-btn"
                                  style={{ background: '#ef4444', color: 'white' }}
                                  onClick={() => handleReject(post.id, post.title)}
                                >
                                  Từ chối
                                </button>
                              </>
                            )}
                            <button
                              className="admin-btn admin-btn-danger"
                              onClick={() => handleDelete(post.id, post.title)}
                              disabled={deleting === post.id}
                            >
                              {deleting === post.id ? '⏳' : '🗑️'} Xóa
                            </button>
                          </div>
                          {post.appealMessage && post.status === 'PENDING' && (
                            <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#b91c1c', background: '#fee2e2', padding: '4px 8px', borderRadius: '4px' }}>
                              <strong>🚨 Khiếu nại:</strong> {post.appealMessage}
                            </div>
                          )}
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="admin-pagination">
                <button className="admin-page-btn" onClick={() => load(page - 1)} disabled={page === 0}>‹</button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button key={i} className={`admin-page-btn ${i === page ? 'active' : ''}`} onClick={() => load(i)}>
                    {i + 1}
                  </button>
                ))}
                <button className="admin-page-btn" onClick={() => load(page + 1)} disabled={page >= totalPages - 1}>›</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ForumPage;
