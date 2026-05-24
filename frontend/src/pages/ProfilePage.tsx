import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { userService } from '../services/userService';
import { quizService, forumService } from '../services/quizService';
import type { UserProfile } from '../services/userService';
import './ProfilePage.css';

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await userService.getMyProfile();
        setProfile(data);
      } catch (error) {
        console.error('Lỗi khi tải hồ sơ:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleQuizAppeal = async (e: React.MouseEvent, quizId: number) => {
    e.preventDefault(); // prevent navigation
    const message = window.prompt("Nhập nội dung khiếu nại cho bài Quiz này:");
    if (!message) return;
    try {
      await quizService.appeal(quizId, message);
      alert("Đã gửi khiếu nại thành công! Bài Quiz sẽ được Admin xem xét lại.");
      const data = await userService.getMyProfile();
      setProfile(data);
    } catch (error) {
      alert("Lỗi khi gửi khiếu nại.");
    }
  };

  const handlePostAppeal = async (e: React.MouseEvent, postId: number) => {
    e.preventDefault(); // prevent navigation
    const message = window.prompt("Nhập nội dung khiếu nại cho bài viết này:");
    if (!message) return;
    try {
      await forumService.appeal(postId, message);
      alert("Đã gửi khiếu nại thành công! Bài viết sẽ được Admin xem xét lại.");
      const data = await userService.getMyProfile();
      setProfile(data);
    } catch (error) {
      alert("Lỗi khi gửi khiếu nại.");
    }
  };

  if (loading) {
    return <div className="loading-state">Đang tải hồ sơ...</div>;
  }

  if (!profile) {
    return <div className="error-state">Không thể tải thông tin hồ sơ.</div>;
  }

  return (
    <div className="profile-container">
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
              <Link to={`/quiz/${quiz.id}`} key={quiz.id} className="quiz-card" style={{textDecoration: 'none'}}>
                <div className="quiz-card-content">
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

                  {quiz.status === 'REJECTED' && (
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                      <p style={{ color: '#b91c1c', marginBottom: '8px' }}>
                        <strong>Lý do từ chối:</strong> {quiz.rejectReason || 'Không có lý do.'}
                      </p>
                      <button 
                        onClick={(e) => handleQuizAppeal(e, quiz.id)}
                        style={{ background: '#ef4444', color: 'white', padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600, width: '100%' }}
                      >
                        Gửi Khiếu Nại
                      </button>
                    </div>
                  )}
                </div>
              </Link>
              );
            })}

          </div>
        ) : (
          <div className="empty-state">
            <p>Bạn chưa tạo bài quiz nào.</p>
            <Link to="/create-quiz" className="primary-btn" style={{display: 'inline-block', marginTop: '10px'}}>Tạo Quiz Ngay</Link>
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
              <Link to={`/forum/${post.id}`} key={`post-${post.id}`} className="quiz-card" style={{textDecoration: 'none'}}>
                <div className="quiz-card-content">
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

                  {post.status === 'REJECTED' && (
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                      <p style={{ color: '#b91c1c', marginBottom: '8px' }}>
                        <strong>Lý do từ chối:</strong> {post.rejectReason || 'Không có lý do.'}
                      </p>
                      <button 
                        onClick={(e) => handlePostAppeal(e, post.id)}
                        style={{ background: '#ef4444', color: 'white', padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600, width: '100%' }}
                      >
                        Gửi Khiếu Nại
                      </button>
                    </div>
                  )}
                </div>
              </Link>
              );
            })}

          </div>
        ) : (
          <div className="empty-state">
            <p>Bạn chưa đăng bài viết nào trên diễn đàn.</p>
            <Link to="/forum" className="primary-btn" style={{display: 'inline-block', marginTop: '10px'}}>Khám phá Diễn đàn</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
