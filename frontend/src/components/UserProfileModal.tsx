import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, MessageSquare, UserPlus, UserCheck, UserMinus, Loader2, CheckCircle, BookOpen, FileText } from 'lucide-react';
import { userService, type UserProfile } from '../services/userService';
import { chatService } from '../services/chatService';
import { useAuth } from '../context/AuthContext';
import './UserProfileModal.css';

interface UserProfileModalProps {
  userId: number;
  onClose: () => void;
}

const AVATAR_COLORS = ['#7C3AED', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ userId, onClose }) => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [friendshipStatus, setFriendshipStatus] = useState<string>('NONE');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isSelf = currentUser?.id === userId;

  const getInitials = (name: string) =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      if (isSelf) {
        const data = await userService.getMyProfile();
        setProfile(data);
        setFriendshipStatus('SELF');
      } else {
        const [data, statusRes] = await Promise.all([
          userService.getUserProfile(userId),
          chatService.getFriendshipStatus(userId),
        ]);
        setProfile(data);
        setFriendshipStatus(statusRes.status);
      }
    } catch (err) {
      console.error('Lỗi khi tải thông tin user:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [userId]);

  const handleFriendAction = async (action: 'request' | 'accept' | 'decline' | 'remove') => {
    if (!profile || isSelf) return;
    try {
      setActionLoading(true);
      if (action === 'request') {
        await chatService.sendRequest(profile.id);
        setFriendshipStatus('PENDING_SENT');
        setSuccessMsg('Đã gửi lời mời kết bạn!');
      } else if (action === 'accept') {
        await chatService.acceptRequest(profile.id);
        setFriendshipStatus('ACCEPTED');
        setSuccessMsg('Đã kết bạn thành công! Bạn có thể nhắn tin ngay bây giờ.');
      } else if (action === 'decline') {
        await chatService.declineRequest(profile.id);
        setFriendshipStatus('NONE');
      } else if (action === 'remove') {
        if (window.confirm('Bạn có chắc chắn muốn hủy kết bạn không?')) {
          await chatService.removeFriend(profile.id);
          setFriendshipStatus('NONE');
        } else {
          return;
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi thực hiện thao tác.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMessage = () => {
    onClose();
    navigate(`/chat/${userId}`);
  };

  const avatarColor = profile ? AVATAR_COLORS[profile.id % AVATAR_COLORS.length] : AVATAR_COLORS[0];

  return (
    <div className="upm-overlay" onClick={onClose}>
      <div className="upm-box" onClick={(e) => e.stopPropagation()}>
        {/* Close */}
        <button className="upm-close" onClick={onClose} aria-label="Đóng">
          <X size={16} />
        </button>

        {loading ? (
          <div className="upm-loading">
            <Loader2 size={36} className="upm-spinner" />
            <p>Đang tải thông tin...</p>
          </div>
        ) : !profile ? (
          <div className="upm-error">
            <p>Không thể tải thông tin người dùng.</p>
          </div>
        ) : (
          <>
            {/* Header gradient banner */}
            <div className="upm-banner" style={{ background: `linear-gradient(135deg, ${avatarColor}cc, ${avatarColor}66)` }} />

            <div className="upm-body">
              {/* Avatar */}
              <div className="upm-avatar-wrap">
                {profile.avatar ? (
                  <img src={profile.avatar} alt={profile.name} className="upm-avatar-img" />
                ) : (
                  <div className="upm-avatar-placeholder" style={{ background: avatarColor }}>
                    {getInitials(profile.name)}
                  </div>
                )}
                {friendshipStatus === 'ACCEPTED' && (
                  <div className="upm-friend-badge" title="Bạn bè">
                    <UserCheck size={12} />
                  </div>
                )}
              </div>

              {/* Info */}
              <h2 className="upm-name">{profile.name}</h2>
              <p className="upm-email">{profile.email}</p>

              {/* Stats */}
              <div className="upm-stats">
                <div className="upm-stat">
                  <BookOpen size={16} className="upm-stat-icon" />
                  <span className="upm-stat-value">{profile.totalQuizzes}</span>
                  <span className="upm-stat-label">Quiz đã tạo</span>
                </div>
                <div className="upm-stat-divider" />
                <div className="upm-stat">
                  <FileText size={16} className="upm-stat-icon" />
                  <span className="upm-stat-value">{profile.totalPosts}</span>
                  <span className="upm-stat-label">Bài đăng</span>
                </div>
              </div>

              {/* Success message */}
              {successMsg && (
                <div className="upm-success-msg">
                  <CheckCircle size={16} />
                  {successMsg}
                </div>
              )}

              {/* Actions */}
              <div className="upm-actions">
                {friendshipStatus === 'SELF' && (
                  <p className="upm-self-badge">Đây là tài khoản của bạn</p>
                )}

                {friendshipStatus === 'NONE' && (
                  <button
                    className="upm-btn upm-btn-primary"
                    onClick={() => handleFriendAction('request')}
                    disabled={actionLoading}
                  >
                    {actionLoading ? <Loader2 size={15} className="upm-spinner-sm" /> : <UserPlus size={15} />}
                    {actionLoading ? 'Đang gửi...' : 'Kết bạn'}
                  </button>
                )}

                {friendshipStatus === 'PENDING_SENT' && (
                  <button
                    className="upm-btn upm-btn-outline-muted"
                    onClick={() => handleFriendAction('decline')}
                    disabled={actionLoading}
                  >
                    <UserMinus size={15} />
                    Hủy lời mời
                  </button>
                )}

                {friendshipStatus === 'PENDING_RECEIVED' && (
                  <div className="upm-btn-row">
                    <button
                      className="upm-btn upm-btn-primary"
                      onClick={() => handleFriendAction('accept')}
                      disabled={actionLoading}
                    >
                      {actionLoading ? <Loader2 size={15} className="upm-spinner-sm" /> : <UserCheck size={15} />}
                      {actionLoading ? '...' : 'Đồng ý'}
                    </button>
                    <button
                      className="upm-btn upm-btn-danger-outline"
                      onClick={() => handleFriendAction('decline')}
                      disabled={actionLoading}
                    >
                      Từ chối
                    </button>
                  </div>
                )}

                {friendshipStatus === 'ACCEPTED' && (
                  <div className="upm-btn-row">
                    <button className="upm-btn upm-btn-primary" onClick={handleMessage}>
                      <MessageSquare size={15} />
                      Nhắn tin
                    </button>
                    <button
                      className="upm-btn upm-btn-danger-outline"
                      onClick={() => handleFriendAction('remove')}
                      disabled={actionLoading}
                    >
                      Hủy kết bạn
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
