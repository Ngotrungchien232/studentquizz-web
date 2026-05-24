import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { userService } from '../services/userService';
import { quizService, forumService } from '../services/quizService';
import type { UserProfile } from '../services/userService';
import AppealModal from '../components/AppealModal';
import './ProfilePage.css';

type AppealTarget = {
  type: 'quiz' | 'post';
  id: number;
  title: string;
  rejectReason?: string;
};

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [appealTarget, setAppealTarget] = useState<AppealTarget | null>(null);
  const [appealSuccess, setAppealSuccess] = useState('');

  const refreshProfile = async () => {
    const data = await userService.getMyProfile();
    setProfile(data);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        await refreshProfile();
      } catch (error) {
        console.error('Lỗi khi tải hồ sơ:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleAppealSubmit = async (message: string) => {
    if (!appealTarget) return;
    if (appealTarget.type === 'quiz') {
      await quizService.appeal(appealTarget.id, message);
    } else {
      await forumService.appeal(appealTarget.id, message);
    }
    await refreshProfile();
    setAppealSuccess('Đã gửi khiếu nại thành công! Admin sẽ xem xét lại trong thời gian sớm nhất.');
    setTimeout(() => setAppealSuccess(''), 5000);
  };

  if (loading) {
    return <div className="loading-state">Đang tải hồ sơ...</div>;
  }

  if (!profile) {
    return <div className="error-state">Không thể tải thông tin hồ sơ.</div>;
  }

  return (
    <div className="profile-container">
      {appealTarget && (
        <AppealModal
          title={appealTarget.title}
          rejectReason={appealTarget.rejectReason}
          onClose={() => setAppealTarget(null)}
          onSubmit={handleAppealSubmit}
        />
      )}

      {appealSuccess && (
        <div className="profile-alert profile-alert--success">{appealSuccess}</div>
      )}

      <div className="profile-header">
        {profile.avatar ? (
          <img src={profile.avatar} alt={profile.name} className="profile-avatar" />
        ) : (
          <div className="profile-avatar-placeholder">
            {profile.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="profile-info">
          <h1>{profile.name}</h1>
          <p>{profile.email}</p>
          <div className="profile-stats">
            <div className="stat-item">
              <span className="stat-value">{profile.totalQuizzes}</span>
              <span className="stat-label">Quiz đã tạo</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{profile.totalPosts}</span>
              <span className="stat-label">Bài viết diễn đàn</span>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-content">
        <h2>Quiz của tôi</h2>
        {profile.quizzes && profile.quizzes.length > 0 ? (
          <div className="quizzes-grid">
            {profile.quizzes.map((quiz) => {
              const stColors: Record<string, { bg: string, color: string, label: string }> = {
                'PENDING': { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', label: '⏳ Chờ duyệt' },
                'APPROVED': { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', label: '✅ Đã duyệt' },
                'REJECTED': { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', label: '❌ Từ chối' },
              };
              const st = stColors[quiz.status || 'PENDING'] || stColors['PENDING'];

              return (
              <div key={quiz.id} className="quiz-card">
                <Link to={`/quiz/${quiz.id}`} className="quiz-card-content" style={{ textDecoration: 'none', display: 'block' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span className="category-badge">{quiz.category}</span>
                    <span style={{
                      padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
                      background: st.bg, color: st.color
                    }}>
                      {st.label}
                    </span>
                  </div>
                  <h3>{quiz.title}</h3>
                  <div className="quiz-meta">
                    <span>📝 {quiz.questionCount} câu hỏi</span>
                    <span>▶️ {quiz.playCount} lượt chơi</span>
                  </div>
                </Link>

                {quiz.status === 'PENDING' && quiz.appealMessage && (
                  <div className="profile-moderation-box profile-moderation-box--pending">
                    <strong>Đã gửi khiếu nại</strong>
                    <p>{quiz.appealMessage}</p>
                    <span className="profile-moderation-hint">Admin đang xem xét lại.</span>
                  </div>
                )}

                {quiz.status === 'REJECTED' && (
                  <div className="profile-moderation-box profile-moderation-box--rejected">
                    <strong>Lý do admin từ chối:</strong>
                    <p>{quiz.rejectReason || 'Không có lý do cụ thể.'}</p>
                    <button
                      type="button"
                      className="profile-appeal-btn"
                      onClick={() => setAppealTarget({
                        type: 'quiz',
                        id: quiz.id,
                        title: quiz.title,
                        rejectReason: quiz.rejectReason,
                      })}
                    >
                      Gửi khiếu nại
                    </button>
                  </div>
                )}
              </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <p>Bạn chưa tạo bài quiz nào.</p>
            <Link to="/create" className="primary-btn" style={{ display: 'inline-block', marginTop: '10px' }}>Tạo Quiz Ngay</Link>
          </div>
        )}
      </div>

      <div className="profile-content" style={{ marginTop: '30px' }}>
        <h2>Bài viết diễn đàn của tôi</h2>
        {profile.posts && profile.posts.length > 0 ? (
          <div className="quizzes-grid">
            {profile.posts.map((post) => {
              const stColors: Record<string, { bg: string, color: string, label: string }> = {
                'PENDING': { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', label: '⏳ Chờ duyệt' },
                'APPROVED': { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', label: '✅ Đã duyệt' },
                'REJECTED': { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', label: '❌ Từ chối' },
              };
              const st = stColors[post.status || 'PENDING'] || stColors['PENDING'];

              return (
              <div key={`post-${post.id}`} className="quiz-card">
                <Link to={`/forum/${post.id}`} className="quiz-card-content" style={{ textDecoration: 'none', display: 'block' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span className="category-badge" style={{ background: '#eef2ff', color: '#4f46e5' }}>Diễn đàn</span>
                    <span style={{
                      padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
                      background: st.bg, color: st.color
                    }}>
                      {st.label}
                    </span>
                  </div>
                  <h3>{post.title}</h3>
                  <div className="quiz-meta">
                    <span>👍 {post.likeCount} Thích</span>
                    <span>💬 {post.commentCount} Bình luận</span>
                  </div>
                </Link>

                {post.status === 'PENDING' && post.appealMessage && (
                  <div className="profile-moderation-box profile-moderation-box--pending">
                    <strong>Đã gửi khiếu nại</strong>
                    <p>{post.appealMessage}</p>
                    <span className="profile-moderation-hint">Admin đang xem xét lại.</span>
                  </div>
                )}

                {post.status === 'REJECTED' && (
                  <div className="profile-moderation-box profile-moderation-box--rejected">
                    <strong>Lý do admin từ chối:</strong>
                    <p>{post.rejectReason || 'Không có lý do cụ thể.'}</p>
                    <button
                      type="button"
                      className="profile-appeal-btn"
                      onClick={() => setAppealTarget({
                        type: 'post',
                        id: post.id,
                        title: post.title,
                        rejectReason: post.rejectReason,
                      })}
                    >
                      Gửi khiếu nại
                    </button>
                  </div>
                )}
              </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <p>Bạn chưa đăng bài viết nào trên diễn đàn.</p>
            <Link to="/forum" className="primary-btn" style={{ display: 'inline-block', marginTop: '10px' }}>Khám phá Diễn đàn</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
