import React, { useEffect, useState } from 'react';
import { adminService } from '../adminService';
import RejectModal from '../components/RejectModal';
import { useDialog } from '../../context/DialogContext';
import '../components/AdminModals.css';

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
  const { confirm, alert: showAlert } = useDialog();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [rejectTarget, setRejectTarget] = useState<{ id: number; title: string } | null>(null);

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
    const ok = await confirm({
      title: 'Xóa bài kiểm tra',
      message: `Bạn có chắc muốn xóa "${title}"?\nHành động này không thể hoàn tác.`,
      confirmText: 'Xóa',
      variant: 'danger',
      theme: 'admin',
    });
    if (!ok) return;
    setDeleting(id);
    try {
      await adminService.deleteQuiz(id);
      setQuizzes(quizzes.filter(q => q.id !== id));
      setTotalElements(t => t - 1);
    } catch {
      await showAlert({ title: 'Lỗi', message: 'Không thể xóa bài kiểm tra.', variant: 'danger', theme: 'admin' });
    } finally {
      setDeleting(null);
    }
  };

  const handleStatusUpdate = async (id: number, status: string, title: string) => {
    const ok = await confirm({
      title: 'Xác nhận duyệt',
      message: `Duyệt bài kiểm tra "${title}"?`,
      confirmText: 'Duyệt',
      variant: 'success',
      theme: 'admin',
    });
    if (!ok) return;
    try {
      await adminService.updateQuizStatus(id, status);
      setQuizzes(quizzes.map(q => q.id === id ? { ...q, status } : q));
    } catch {
      await showAlert({ title: 'Lỗi', message: 'Không thể cập nhật trạng thái.', variant: 'danger', theme: 'admin' });
    }
  };

  const handleToggleFeatured = async (id: number, title: string, featured: boolean) => {
    const action = featured ? 'bỏ nổi bật' : 'đưa lên nổi bật';
    const ok = await confirm({
      title: 'Cập nhật nổi bật',
      message: `Xác nhận ${action} bài "${title}"?`,
      confirmText: 'Xác nhận',
      variant: 'primary',
      theme: 'admin',
    });
    if (!ok) return;
    try {
      const res = await adminService.toggleQuizFeatured(id);
      setQuizzes(quizzes.map(q => q.id === id ? { ...q, featured: res.featured } : q));
    } catch {
      await showAlert({ title: 'Lỗi', message: 'Không thể cập nhật nổi bật.', variant: 'danger', theme: 'admin' });
    }
  };

  const handleRejectConfirm = async (reason: string) => {
    if (!rejectTarget) return;
    const res = await adminService.updateQuizStatus(rejectTarget.id, 'REJECTED', reason);
    setQuizzes(quizzes.map(q => q.id === rejectTarget.id ? {
      ...q,
      status: 'REJECTED',
      rejectReason: res.rejectReason || reason,
      appealMessage: undefined,
    } : q));
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
      {rejectTarget && (
        <RejectModal
          title="Từ chối bài kiểm tra"
          itemLabel={rejectTarget.title}
          onClose={() => setRejectTarget(null)}
          onConfirm={handleRejectConfirm}
        />
      )}
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
                    <th>Nổi bật</th>
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
                      <td>
                        {quiz.status === 'APPROVED' ? (
                          <button
                            className="admin-btn"
                            style={{
                              background: quiz.featured ? 'rgba(124, 58, 237, 0.2)' : 'rgba(148, 163, 184, 0.15)',
                              color: quiz.featured ? '#a78bfa' : '#94a3b8',
                            }}
                            onClick={() => handleToggleFeatured(quiz.id, quiz.title, quiz.featured)}
                          >
                            {quiz.featured ? '⭐ Nổi bật' : '☆ Đánh dấu'}
                          </button>
                        ) : (
                          <span style={{ color: '#64748b', fontSize: '0.8rem' }}>—</span>
                        )}
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
                                  onClick={() => setRejectTarget({ id: quiz.id, title: quiz.title })}
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
                          {quiz.rejectReason && quiz.status === 'REJECTED' && (
                            <div className="admin-moderation-note admin-moderation-note--reject">
                              <strong>Lý do từ chối:</strong> {quiz.rejectReason}
                            </div>
                          )}
                          {quiz.appealMessage && quiz.status === 'PENDING' && (
                            <div className="admin-moderation-note admin-moderation-note--appeal">
                              <strong>🚨 Khiếu nại từ user:</strong> {quiz.appealMessage}
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
