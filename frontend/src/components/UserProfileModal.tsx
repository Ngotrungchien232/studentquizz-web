import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, MessageSquare, UserPlus, UserCheck, UserMinus, Loader2 } from 'lucide-react';
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
  const [friendshipStatus, setFriendshipStatus] = useState<string>('NONE'); // SELF, NONE, ACCEPTED, PENDING_SENT, PENDING_RECEIVED
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

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
        const data = await userService.getUserProfile(userId);
        setProfile(data);
        const statusRes = await chatService.getFriendshipStatus(userId);
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
      // Re-fetch status
      if (action === 'remove') {
        setFriendshipStatus('NONE');
      } else if (action === 'request') {
        setFriendshipStatus('PENDING_SENT');
      } else if (action === 'accept') {
        setFriendshipStatus('ACCEPTED');
      } else if (action === 'decline') {
        setFriendshipStatus('NONE');
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

  return (
    <div className="user-modal-overlay" onClick={onClose}>
      <div className="user-modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="user-modal-close" onClick={onClose} aria-label="Đóng">
          <X size={18} />
        </button>

        {loading ? (
          <div className="user-modal-loading">
            <Loader2 className="spinner spin" size={32} />
            <p>Đang tải thông tin...</p>
          </div>
        ) : !profile ? (
          <div className="user-modal-error">
            <p>Không thể tải thông tin người dùng này.</p>
          </div>
        ) : (
          <div className="user-modal-content">
            {/* Header / Avatar */}
            <div className="user-modal-profile-header">
              {profile.avatar ? (
                <img src={profile.avatar} alt={profile.name} className="user-modal-avatar" />
              ) : (
                <div 
                  className="user-modal-avatar-placeholder" 
                  style={{ background: AVATAR_COLORS[profile.id % AVATAR_COLORS.length] }}
                >
                  {getInitials(profile.name)}
                </div>
              )}
              <h2 className="user-modal-name">{profile.name}</h2>
              <p className="user-modal-email">{profile.email}</p>
            </div>

            {/* Stats */}
            <div className="user-modal-stats">
              <div className="user-modal-stat-item">
                <span className="user-modal-stat-value">{profile.totalQuizzes}</span>
                <span className="user-modal-stat-label">Quiz đã tạo</span>
              </div>
              <div className="user-modal-stat-item">
                <span className="user-modal-stat-value">{profile.totalPosts}</span>
                <span className="user-modal-stat-label">Bài diễn đàn</span>
              </div>
            </div>

            {/* Actions */}
            <div className="user-modal-actions">
              {friendshipStatus === 'SELF' && (
                <p className="user-modal-self-badge">Đây là tài khoản của bạn</p>
              )}

              {friendshipStatus === 'NONE' && (
                <button 
                  className="btn btn-primary user-modal-btn" 
                  onClick={() => handleFriendAction('request')}
                  disabled={actionLoading}
                >
                  <UserPlus size={16} />
                  {actionLoading ? 'Đang xử lý...' : 'Kết bạn'}
                </button>
              )}

              {friendshipStatus === 'PENDING_SENT' && (
                <button 
                  className="btn btn-outline btn-danger user-modal-btn" 
                  onClick={() => handleFriendAction('decline')}
                  disabled={actionLoading}
                >
                  <UserMinus size={16} />
                  {actionLoading ? 'Đang xử lý...' : 'Hủy lời mời kết bạn'}
                </button>
              )}

              {friendshipStatus === 'PENDING_RECEIVED' && (
                <div className="user-modal-btn-group">
                  <button 
                    className="btn btn-primary" 
                    onClick={() => handleFriendAction('accept')}
                    disabled={actionLoading}
                  >
                    <UserCheck size={16} />
                    {actionLoading ? '...' : 'Đồng ý kết bạn'}
                  </button>
                  <button 
                    className="btn btn-outline btn-danger" 
                    onClick={() => handleFriendAction('decline')}
                    disabled={actionLoading}
                  >
                     Từ chối
                  </button>
                </div>
              )}

              {friendshipStatus === 'ACCEPTED' && (
                <div className="user-modal-btn-group">
                  <button 
                    className="btn btn-primary" 
                    onClick={handleMessage}
                  >
                    <MessageSquare size={16} />
                    Nhắn tin
                  </button>
                  <button 
                    className="btn btn-outline btn-danger" 
                    onClick={() => handleFriendAction('remove')}
                    disabled={actionLoading}
                  >
                    Hủy kết bạn
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
