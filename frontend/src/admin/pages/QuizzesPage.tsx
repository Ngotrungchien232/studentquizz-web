import React, { useEffect, useState } from 'react';
import { adminService } from '../adminService';

interface Quiz {
  id: number;
  title: string;
  category: string;
  questionCount: number;
  playCount: number;
  featured: boolean;
  status: string;
  rejectReason?: string;
  appealMessage?: string;
  author?: { name: string };
}


const QuizzesPage: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = async (p = 0) => {
    setLoading(true);
    try {
      const data = await adminService.getQuizzes(p, 10);
      setQuizzes(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
      setPage(p);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(0); }, []);

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Xóa bài kiểm tra "${title}"?`)) return;
    setDeleting(id);
    try {
      await adminService.deleteQuiz(id);
      setQuizzes(quizzes.filter(q => q.id !== id));
      setTotalElements(t => t - 1);
    } catch {
      alert('Lỗi khi xóa quiz!');
    } finally {
      setDeleting(null);
    }
  };

  const handleStatusUpdate = async (id: number, status: string, title: string) => {
    if (!confirm(`Xác nhận chuyển bài kiểm tra "${title}" sang trạng thái ${status}?`)) return;
    try {
      await adminService.updateQuizStatus(id, status);
      setQuizzes(quizzes.map(q => q.id === id ? { ...q, status } : q));
    } catch {
      alert('Lỗi khi cập nhật trạng thái!');
    }
  };

  const handleReject = async (id: number, title: string) => {
    const reason = window.prompt(`Nhập lý do từ chối bài kiểm tra "${title}":`);
    if (reason === null) return;
    if (!reason.trim()) {
      alert("Bạn phải nhập lý do từ chối.");
      return;
    }
    try {
      await adminService.updateQuizStatus(id, 'REJECTED', reason);
      setQuizzes(quizzes.map(q => q.id === id ? { ...q, status: 'REJECTED' } : q));
    } catch {
      alert('Lỗi khi từ chối!');
    }
  };

  const categoryColors: Record<string, string> = {
    'Lịch sử': '#f59e0b', 'Hóa học': '#06d6a0', 'Ngoại ngữ': '#3b82f6',
    'Toán học': '#8b5cf6', 'Sinh học': '#10b981', 'Vật lý': '#f97316',
    'Địa lý': '#06b6d4', 'Văn học': '#ec4899',
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
            📝 Danh sách bài kiểm tra
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 400, marginLeft: 8 }}>
              ({totalElements} bài)
            </span>
          </h2>
        </div>

        {loading ? (
          <div className="admin-loading">
            <div className="admin-spinner" /> Đang tải...
          </div>
        ) : quizzes.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty-icon">📝</div>
            <div className="admin-empty-text">Chưa có bài kiểm tra nào</div>
          </div>
        ) : (
          <>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Tiêu đề</th>
                    <th>Danh mục</th>
                    <th>Trạng thái</th>
                    <th>Số câu</th>
                    <th>Lượt chơi</th>
                    <th>Tác giả</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {quizzes.map(quiz => {
                    const st = statusColors[quiz.status || 'PENDING'] || statusColors['PENDING'];
                    return (
                    <tr key={quiz.id}>
                      <td style={{ fontWeight: 600, maxWidth: 220 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {quiz.title}
                        </div>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: 20,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: `${categoryColors[quiz.category] || '#94a3b8'}20`,
                          color: categoryColors[quiz.category] || '#94a3b8',
                          border: `1px solid ${categoryColors[quiz.category] || '#94a3b8'}40`,
                        }}>
                          {quiz.category}
                        </span>
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
                      <td style={{ color: '#94a3b8' }}>{quiz.questionCount} câu</td>
                      <td>
                        <span style={{ color: '#06d6a0', fontWeight: 600 }}>
                          {quiz.playCount.toLocaleString('vi-VN')}
                        </span>
                      </td>
                      <td style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                        {quiz.author?.name || '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {quiz.status === 'PENDING' && (
                            <>
                              <button
                                className="admin-btn"
                                style={{ background: '#10b981', color: 'white' }}
                                onClick={() => handleStatusUpdate(quiz.id, 'APPROVED', quiz.title)}
                              >
                                Duyệt
                              </button>
                                <button
                                  className="admin-btn"
                                  style={{ background: '#ef4444', color: 'white' }}
                                  onClick={() => handleReject(quiz.id, quiz.title)}
                                >
                                  Từ chối
                                </button>
                              </>
                            )}
                            <button
                              className="admin-btn admin-btn-danger"
                              onClick={() => handleDelete(quiz.id, quiz.title)}
                              disabled={deleting === quiz.id}
                            >
                              {deleting === quiz.id ? '⏳' : '🗑️'} Xóa
                            </button>
                          </div>
                          {quiz.appealMessage && quiz.status === 'PENDING' && (
                            <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#b91c1c', background: '#fee2e2', padding: '4px 8px', borderRadius: '4px' }}>
                              <strong>🚨 Khiếu nại:</strong> {quiz.appealMessage}
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

export default QuizzesPage;
