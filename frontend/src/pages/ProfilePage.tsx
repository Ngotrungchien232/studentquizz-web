import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { userService } from '../services/userService';
import { quizService, forumService } from '../services/quizService';
import { chatService } from '../services/chatService';
import { useAuth } from '../context/AuthContext';
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
  const { userId } = useParams<{ userId?: string }>();
  const navigate = useNavigate();
  const { user: currentUser, updateUser } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [appealTarget, setAppealTarget] = useState<AppealTarget | null>(null);
  const [appealSuccess, setAppealSuccess] = useState('');

  // Friendship state
  const [friendshipStatus, setFriendshipStatus] = useState<string>('NONE'); // SELF, NONE, ACCEPTED, PENDING_SENT, PENDING_RECEIVED
  const [friendActionLoading, setFriendActionLoading] = useState(false);

  // Edit profile state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const isOwnProfile = !userId || parseInt(userId, 10) === currentUser?.id;

  const getInitials = (name: string) =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const refreshProfile = async () => {
    try {
      if (isOwnProfile) {
        const data = await userService.getMyProfile();
        setProfile(data);
        setFriendshipStatus('SELF');
      } else {
        const idNum = parseInt(userId!, 10);
        const data = await userService.getUserProfile(idNum);
        setProfile(data);
        const statusRes = await chatService.getFriendshipStatus(idNum);
        setFriendshipStatus(statusRes.status);
      }
    } catch (error) {
      console.error('Lỗi khi tải hồ sơ:', error);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        await refreshProfile();
      } catch (error) {
        console.error('Lỗi khi tải hồ sơ:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  const handleFriendAction = async (action: 'request' | 'accept' | 'decline' | 'remove') => {
    if (!profile || isOwnProfile) return;
    try {
      setFriendActionLoading(true);
      if (action === 'request') {
        await chatService.sendRequest(profile.id);
      } else if (action === 'accept') {
        await chatService.acceptRequest(profile.id);
      } else if (action === 'decline') {
        await chatService.declineRequest(profile.id);
      } else if (action === 'remove') {
        if (window.confirm('Bạn có chắc chắn muốn hủy kết bạn không?')) {
          await chatService.removeFriend(profile.id);
        } else {
          return;
        }
      }
      // Refresh status and list after action
      await refreshProfile();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi thực hiện kết bạn.');
    } finally {
      setFriendActionLoading(false);
    }
  };

  const handleOpenEdit = () => {
    if (!profile) return;
    setEditName(profile.name);
    setEditAvatar(profile.avatar || '');
    setAvatarPreview(profile.avatar || '');
    setEditPassword('');
    setAvatarFile(null);
    setShowEditModal(true);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleUpdateProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;

    try {
      setUpdatingProfile(true);
      let finalAvatarUrl = editAvatar;

      if (avatarFile) {
        const uploadRes = await forumService.uploadAttachment(avatarFile);
        finalAvatarUrl = uploadRes.url;
      }

      const updated = await userService.updateProfile({
        name: editName,
        password: editPassword || undefined,
        avatar: finalAvatarUrl
      });

      setProfile(updated);
      updateUser({
        id: updated.id,
        name: updated.name,
        email: updated.email,
        avatar: updated.avatar
      });

      setShowEditModal(false);
      setAppealSuccess('Cập nhật hồ sơ thành công!');
      setTimeout(() => setAppealSuccess(''), 3000);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Không thể cập nhật hồ sơ.');
    } finally {
      setUpdatingProfile(false);
    }
  };

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

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="profile-modal-backdrop">
          <div className="profile-modal">
            <div className="profile-modal-header">
              <h3>Chỉnh sửa thông tin cá nhân</h3>
              <button className="profile-modal-close" onClick={() => setShowEditModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleUpdateProfileSubmit} className="profile-modal-form">
              <div className="profile-modal-avatar-section">
                <div className="profile-modal-avatar-preview">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar Preview" />
                  ) : (
                    <div className="profile-avatar-placeholder">
                      {getInitials(editName)}
                    </div>
                  )}
                </div>
                <label className="profile-modal-avatar-btn">
                  Chọn ảnh đại diện
                  <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
                </label>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.9rem' }}>Tên hiển thị</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--card-border)', borderRadius: '8px' }}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Nhập tên hiển thị"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.9rem' }}>Mật khẩu mới (bỏ trống nếu không đổi)</label>
                <input
                  type="password"
                  className="form-control"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--card-border)', borderRadius: '8px' }}
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                  minLength={6}
                />
              </div>

              <div className="profile-modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowEditModal(false)} disabled={updatingProfile}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={updatingProfile || !editName.trim()}>
                  {updatingProfile ? 'Đang cập nhật...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="profile-header">
        {profile.avatar ? (
          <img src={profile.avatar} alt={profile.name} className="profile-avatar" />
        ) : (
          <div className="profile-avatar-placeholder">
            {getInitials(profile.name)}
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

        {/* Dynamic Friend Actions Area */}
        <div className="profile-actions">
          {friendshipStatus === 'SELF' && (
            <button className="btn btn-outline" onClick={handleOpenEdit}>
              ⚙️ Chỉnh sửa thông tin
            </button>
          )}

          {friendshipStatus === 'NONE' && (
            <button 
              className="btn btn-primary" 
              onClick={() => handleFriendAction('request')}
              disabled={friendActionLoading}
            >
              {friendActionLoading ? 'Đang xử lý...' : '➕ Kết bạn'}
            </button>
          )}

          {friendshipStatus === 'PENDING_SENT' && (
            <button 
              className="btn btn-outline btn-danger" 
              onClick={() => handleFriendAction('decline')}
              disabled={friendActionLoading}
            >
              {friendActionLoading ? 'Đang xử lý...' : '❌ Hủy lời mời'}
            </button>
          )}

          {friendshipStatus === 'PENDING_RECEIVED' && (
            <div className="profile-actions__button-group">
              <button 
                className="btn btn-primary btn-sm" 
                onClick={() => handleFriendAction('accept')}
                disabled={friendActionLoading}
              >
                {friendActionLoading ? '...' : '✅ Đồng ý'}
              </button>
              <button 
                className="btn btn-outline btn-danger btn-sm" 
                onClick={() => handleFriendAction('decline')}
                disabled={friendActionLoading}
              >
                {friendActionLoading ? '...' : 'Từ chối'}
              </button>
            </div>
          )}

          {friendshipStatus === 'ACCEPTED' && (
            <div className="profile-actions__button-group">
              <button 
                className="btn btn-primary" 
                onClick={() => navigate(`/chat/${profile.id}`)}
              >
                💬 Nhắn tin
              </button>
              <button 
                className="btn btn-outline btn-danger" 
                onClick={() => handleFriendAction('remove')}
                disabled={friendActionLoading}
              >
                {friendActionLoading ? '...' : 'Hủy kết bạn'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="profile-content">
        <h2>{isOwnProfile ? 'Quiz của tôi' : `Quiz của ${profile.name}`}</h2>
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
                    {isOwnProfile && (
                      <span style={{
                        padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
                        background: st.bg, color: st.color
                      }}>
                        {st.label}
                      </span>
                    )}
                  </div>
                  <h3>{quiz.title}</h3>
                  <div className="quiz-meta">
                    <span>📝 {quiz.questionCount} câu hỏi</span>
                    <span>▶️ {quiz.playCount} lượt chơi</span>
                  </div>
                </Link>

                {isOwnProfile && quiz.status === 'PENDING' && quiz.appealMessage && (
                  <div className="profile-moderation-box profile-moderation-box--pending">
                    <strong>Đã gửi khiếu nại</strong>
                    <p>{quiz.appealMessage}</p>
                    <span className="profile-moderation-hint">Admin đang xem xét lại.</span>
                  </div>
                )}

                {isOwnProfile && quiz.status === 'REJECTED' && (
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
            <p>{isOwnProfile ? 'Bạn chưa tạo bài quiz nào.' : 'Người dùng này chưa công khai bài quiz nào.'}</p>
            {isOwnProfile && (
              <Link to="/create" className="primary-btn" style={{ display: 'inline-block', marginTop: '10px' }}>Tạo Quiz Ngay</Link>
            )}
          </div>
        )}
      </div>

      <div className="profile-content" style={{ marginTop: '30px' }}>
        <h2>{isOwnProfile ? 'Bài viết diễn đàn của tôi' : `Bài viết của ${profile.name}`}</h2>
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
                    {isOwnProfile && (
                      <span style={{
                        padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
                        background: st.bg, color: st.color
                      }}>
                        {st.label}
                      </span>
                    )}
                  </div>
                  <h3>{post.title}</h3>
                  <div className="quiz-meta">
                    <span>👍 {post.likeCount} Thích</span>
                    <span>💬 {post.commentCount} Bình luận</span>
                  </div>
                </Link>

                {isOwnProfile && post.status === 'PENDING' && post.appealMessage && (
                  <div className="profile-moderation-box profile-moderation-box--pending">
                    <strong>Đã gửi khiếu nại</strong>
                    <p>{post.appealMessage}</p>
                    <span className="profile-moderation-hint">Admin đang xem xét lại.</span>
                  </div>
                )}

                {isOwnProfile && post.status === 'REJECTED' && (
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
            <p>{isOwnProfile ? 'Bạn chưa đăng bài viết nào trên diễn đàn.' : 'Người dùng này chưa đăng bài viết nào.'}</p>
            {isOwnProfile && (
              <Link to="/forum" className="primary-btn" style={{ display: 'inline-block', marginTop: '10px' }}>Khám phá Diễn đàn</Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
