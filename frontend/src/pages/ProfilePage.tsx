import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { BookOpen, MessageSquare, Trophy, Edit3, UserPlus, UserCheck, UserX, MessageCircle, Clock, Play, ThumbsUp } from 'lucide-react';
import { userService } from '../services/userService';
import { quizService, forumService } from '../services/quizService';
import { chatService } from '../services/chatService';
import { useAuth } from '../context/AuthContext';
import type { UserProfile } from '../services/userService';
import AppealModal from '../components/AppealModal';
import { formatDateTime, timeAgo } from '../utils/dateUtils';
import './ProfilePage.css';

type AppealTarget = {
  type: 'quiz' | 'post';
  id: number;
  title: string;
  rejectReason?: string;
};

type Tab = 'quizzes' | 'posts' | 'history';

const STATUS_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  PENDING:  { bg: 'rgba(245,158,11,0.12)',  color: '#D97706', label: '⏳ Chờ duyệt' },
  APPROVED: { bg: 'rgba(16,185,129,0.12)',  color: '#059669', label: '✅ Đã duyệt'  },
  REJECTED: { bg: 'rgba(239,68,68,0.12)',   color: '#DC2626', label: '❌ Từ chối'   },
};

const ProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId?: string }>();
  const navigate = useNavigate();
  const { user: currentUser, updateUser } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('quizzes');
  const [appealTarget, setAppealTarget] = useState<AppealTarget | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const [friendshipStatus, setFriendshipStatus] = useState<string>('NONE');
  const [friendActionLoading, setFriendActionLoading] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [attempts, setAttempts] = useState<any[]>([]);

  const isOwnProfile = !userId || parseInt(userId, 10) === currentUser?.id;

  const getInitials = (name: string) =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const refreshProfile = async () => {
    if (isOwnProfile) {
      const data = await userService.getMyProfile();
      setProfile(data);
      setFriendshipStatus('SELF');
      try {
        const attemptData = await quizService.getMyAttempts();
        setAttempts(attemptData);
      } catch { /* ignore */ }
    } else {
      const idNum = parseInt(userId!, 10);
      const [data, statusRes] = await Promise.all([
        userService.getUserProfile(idNum),
        chatService.getFriendshipStatus(idNum),
      ]);
      setProfile(data);
      setFriendshipStatus(statusRes.status);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try { await refreshProfile(); } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleFriendAction = async (action: 'request' | 'accept' | 'decline' | 'remove') => {
    if (!profile || isOwnProfile) return;
    try {
      setFriendActionLoading(true);
      if (action === 'request')  await chatService.sendRequest(profile.id);
      if (action === 'accept')   await chatService.acceptRequest(profile.id);
      if (action === 'decline')  await chatService.declineRequest(profile.id);
      if (action === 'remove') {
        if (!window.confirm('Bạn có chắc muốn hủy kết bạn?')) return;
        await chatService.removeFriend(profile.id);
      }
      await refreshProfile();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra.');
    } finally {
      setFriendActionLoading(false);
    }
  };

  const handleOpenEdit = () => {
    if (!profile) return;
    setEditName(profile.name);
    setAvatarPreview(profile.avatar || '');
    setAvatarFile(null);
    setEditPassword('');
    setShowEditModal(true);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setAvatarFile(file); setAvatarPreview(URL.createObjectURL(file)); }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    try {
      setUpdatingProfile(true);
      let updated;
      if (avatarFile) {
        // Bước 1: Upload avatar lên Cloudinary qua endpoint riêng (tự động cập nhật profile)
        updated = await userService.uploadAvatar(avatarFile);
        // Bước 2: Nếu có thay đổi tên hoặc mật khẩu thêm nữa thì cập nhật tiếp
        if (editName !== profile?.name || editPassword) {
          updated = await userService.updateProfile({
            name: editName,
            password: editPassword || undefined,
          });
        }
      } else {
        // Không có ảnh mới — chỉ cập nhật tên/mật khẩu
        updated = await userService.updateProfile({
          name: editName,
          password: editPassword || undefined,
          avatar: profile?.avatar,
        });
      }
      setProfile(updated);
      updateUser({ id: updated.id, name: updated.name, email: updated.email, avatar: updated.avatar });
      setShowEditModal(false);
      showSuccess('✅ Cập nhật hồ sơ thành công!');
    } catch (err: any) {
      alert(err.response?.data?.message || err.response?.data?.error || 'Không thể cập nhật hồ sơ.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleAppealSubmit = async (message: string) => {
    if (!appealTarget) return;
    if (appealTarget.type === 'quiz') await quizService.appeal(appealTarget.id, message);
    else await forumService.appeal(appealTarget.id, message);
    await refreshProfile();
    showSuccess('✅ Đã gửi khiếu nại thành công!');
  };

  if (loading) {
    return (
      <div className="pf-loading">
        <div className="spinner" />
        <p>Đang tải hồ sơ...</p>
      </div>
    );
  }
  if (!profile) {
    return <div className="pf-error">Không thể tải thông tin hồ sơ.</div>;
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'quizzes', label: 'Quiz', icon: <BookOpen size={15} />, count: profile.quizzes?.length },
    { key: 'posts',   label: 'Bài viết', icon: <MessageSquare size={15} />, count: profile.posts?.length },
    ...(isOwnProfile ? [{ key: 'history' as Tab, label: 'Lịch sử', icon: <Trophy size={15} />, count: attempts?.length }] : []),
  ];

  return (
    <div className="pf-page">
      {appealTarget && (
        <AppealModal
          title={appealTarget.title}
          rejectReason={appealTarget.rejectReason}
          onClose={() => setAppealTarget(null)}
          onSubmit={handleAppealSubmit}
        />
      )}

      {successMsg && <div className="pf-toast">{successMsg}</div>}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="pf-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="pf-modal" onClick={e => e.stopPropagation()}>
            <div className="pf-modal__header">
              <h3>Chỉnh sửa hồ sơ</h3>
              <button className="pf-modal__close" onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <form onSubmit={handleUpdateProfile} className="pf-modal__body">
              {/* Avatar picker */}
              <div className="pf-modal__avatar-row">
                <label className="pf-modal__avatar-wrap" htmlFor="avatar-upload">
                  {avatarPreview
                    ? <img src={avatarPreview} alt="preview" className="pf-modal__avatar-img" />
                    : <div className="pf-modal__avatar-placeholder">{getInitials(editName)}</div>
                  }
                  <div className="pf-modal__avatar-overlay"><Edit3 size={16} /></div>
                </label>
                <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarChange} className="pf-hidden-input" />
                <div className="pf-modal__avatar-hint">
                  <p className="pf-modal__avatar-name">{editName}</p>
                  <p className="pf-modal__avatar-sub">Nhấn ảnh để thay đổi</p>
                </div>
              </div>

              <div className="pf-modal__field">
                <label>Tên hiển thị</label>
                <input
                  type="text" required value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="Nhập tên hiển thị"
                />
              </div>

              <div className="pf-modal__field">
                <label>Mật khẩu mới <span className="pf-optional">(bỏ trống nếu không đổi)</span></label>
                <input
                  type="password" value={editPassword} minLength={6}
                  onChange={e => setEditPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                />
              </div>

              <div className="pf-modal__footer">
                <button type="button" className="pf-btn pf-btn--ghost" onClick={() => setShowEditModal(false)}>Hủy</button>
                <button type="submit" className="pf-btn pf-btn--primary" disabled={updatingProfile || !editName.trim()}>
                  {updatingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Hero Header ─── */}
      <div className="pf-hero">
        <div className="pf-hero__banner" />
        <div className="pf-hero__content">
          <div className="pf-hero__avatar-wrap">
            {profile.avatar
              ? <img src={profile.avatar} alt={profile.name} className="pf-hero__avatar" />
              : <div className="pf-hero__avatar-placeholder">{getInitials(profile.name)}</div>
            }
            {friendshipStatus === 'ACCEPTED' && <div className="pf-hero__badge">✓</div>}
          </div>

          <div className="pf-hero__info">
            <h1 className="pf-hero__name">{profile.name}</h1>
            {isOwnProfile && <p className="pf-hero__email">{profile.email}</p>}

            {/* Stats pills */}
            <div className="pf-stats">
              <div className="pf-stat">
                <BookOpen size={14} />
                <span><strong>{profile.totalQuizzes}</strong> Quiz</span>
              </div>
              <div className="pf-stat">
                <MessageSquare size={14} />
                <span><strong>{profile.totalPosts}</strong> Bài viết</span>
              </div>
              {isOwnProfile && (
                <div className="pf-stat">
                  <Trophy size={14} />
                  <span><strong>{attempts.length}</strong> Đã làm</span>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="pf-hero__actions">
            {friendshipStatus === 'SELF' && (
              <button className="pf-btn pf-btn--outline" onClick={handleOpenEdit}>
                <Edit3 size={15} /> Chỉnh sửa
              </button>
            )}
            {friendshipStatus === 'NONE' && (
              <button className="pf-btn pf-btn--primary" onClick={() => handleFriendAction('request')} disabled={friendActionLoading}>
                <UserPlus size={15} /> {friendActionLoading ? '...' : 'Kết bạn'}
              </button>
            )}
            {friendshipStatus === 'PENDING_SENT' && (
              <button className="pf-btn pf-btn--ghost-red" onClick={() => handleFriendAction('decline')} disabled={friendActionLoading}>
                <UserX size={15} /> {friendActionLoading ? '...' : 'Hủy lời mời'}
              </button>
            )}
            {friendshipStatus === 'PENDING_RECEIVED' && (
              <>
                <button className="pf-btn pf-btn--primary" onClick={() => handleFriendAction('accept')} disabled={friendActionLoading}>
                  <UserCheck size={15} /> Đồng ý
                </button>
                <button className="pf-btn pf-btn--ghost-red" onClick={() => handleFriendAction('decline')} disabled={friendActionLoading}>
                  Từ chối
                </button>
              </>
            )}
            {friendshipStatus === 'ACCEPTED' && (
              <>
                <button className="pf-btn pf-btn--primary" onClick={() => navigate(`/chat/${profile.id}`)}>
                  <MessageCircle size={15} /> Nhắn tin
                </button>
                <button className="pf-btn pf-btn--ghost-red" onClick={() => handleFriendAction('remove')} disabled={friendActionLoading}>
                  <UserX size={15} /> Hủy bạn
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ─── Tab Navigation ─── */}
      <div className="pf-tabs">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`pf-tab ${activeTab === tab.key ? 'pf-tab--active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && <span className="pf-tab__badge">{tab.count}</span>}
          </button>
        ))}
      </div>

      {/* ─── Tab Content ─── */}
      <div className="pf-content">

        {/* QUIZZES TAB */}
        {activeTab === 'quizzes' && (
          profile.quizzes?.length ? (
            <div className="pf-grid">
              {profile.quizzes.map(quiz => {
                const st = STATUS_CONFIG[quiz.status || 'PENDING'];
                return (
                  <div key={quiz.id} className="pf-card">
                    <Link to={`/quiz/${quiz.id}`} className="pf-card__link">
                      <div className="pf-card__top">
                        <span className="pf-badge pf-badge--category">{quiz.category}</span>
                        {isOwnProfile && <span className="pf-badge" style={{ background: st.bg, color: st.color }}>{st.label}</span>}
                      </div>
                      <h3 className="pf-card__title">{quiz.title}</h3>
                      <div className="pf-card__meta">
                        <span><BookOpen size={12} /> {quiz.questionCount} câu</span>
                        <span><Play size={12} /> {quiz.playCount} lượt</span>
                      </div>
                    </Link>
                    {isOwnProfile && quiz.status === 'REJECTED' && (
                      <div className="pf-card__alert pf-card__alert--red">
                        <p className="pf-card__alert-reason">{quiz.rejectReason || 'Không có lý do.'}</p>
                        <button className="pf-appeal-btn" onClick={() => setAppealTarget({ type: 'quiz', id: quiz.id, title: quiz.title, rejectReason: quiz.rejectReason })}>
                          Gửi khiếu nại →
                        </button>
                      </div>
                    )}
                    {isOwnProfile && quiz.status === 'PENDING' && quiz.appealMessage && (
                      <div className="pf-card__alert pf-card__alert--amber">
                        <p>Đã gửi khiếu nại · Admin đang xem xét</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="pf-empty">
              <BookOpen size={40} strokeWidth={1.2} />
              <p>{isOwnProfile ? 'Bạn chưa tạo quiz nào' : 'Chưa có quiz nào'}</p>
              {isOwnProfile && <Link to="/create" className="pf-btn pf-btn--primary">Tạo quiz ngay</Link>}
            </div>
          )
        )}

        {/* POSTS TAB */}
        {activeTab === 'posts' && (
          profile.posts?.length ? (
            <div className="pf-grid">
              {profile.posts.map(post => {
                const st = STATUS_CONFIG[post.status || 'PENDING'];
                return (
                  <div key={post.id} className="pf-card">
                    <Link to={`/forum/${post.id}`} className="pf-card__link">
                      <div className="pf-card__top">
                        <span className="pf-badge pf-badge--forum">Diễn đàn</span>
                        {isOwnProfile && <span className="pf-badge" style={{ background: st.bg, color: st.color }}>{st.label}</span>}
                      </div>
                      <h3 className="pf-card__title">{post.title}</h3>
                      <div className="pf-card__meta">
                        <span><ThumbsUp size={12} /> {post.likeCount}</span>
                        <span><MessageSquare size={12} /> {post.commentCount}</span>
                        <span><Clock size={12} /> {timeAgo(post.createdAt)}</span>
                      </div>
                    </Link>
                    {isOwnProfile && post.status === 'REJECTED' && (
                      <div className="pf-card__alert pf-card__alert--red">
                        <p className="pf-card__alert-reason">{post.rejectReason || 'Không có lý do.'}</p>
                        <button className="pf-appeal-btn" onClick={() => setAppealTarget({ type: 'post', id: post.id, title: post.title, rejectReason: post.rejectReason })}>
                          Gửi khiếu nại →
                        </button>
                      </div>
                    )}
                    {isOwnProfile && post.status === 'PENDING' && post.appealMessage && (
                      <div className="pf-card__alert pf-card__alert--amber">
                        <p>Đã gửi khiếu nại · Admin đang xem xét</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="pf-empty">
              <MessageSquare size={40} strokeWidth={1.2} />
              <p>{isOwnProfile ? 'Bạn chưa đăng bài viết nào' : 'Chưa có bài viết nào'}</p>
              {isOwnProfile && <Link to="/forum" className="pf-btn pf-btn--primary">Khám phá diễn đàn</Link>}
            </div>
          )
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && isOwnProfile && (
          attempts.length ? (
            <div className="pf-history">
              {attempts.map(att => {
                const pct = att.totalQuestions > 0 ? (att.score / att.totalQuestions) * 100 : 0;
                const scoreClass = pct >= 80 ? 'green' : pct >= 50 ? 'amber' : 'red';
                return (
                  <div key={att.id} className="pf-attempt">
                    <div className="pf-attempt__left">
                      <Link to={`/quiz/${att.quizId}`} className="pf-attempt__title">{att.quizTitle}</Link>
                      <div className="pf-attempt__meta">
                        <span className="pf-badge pf-badge--category" style={{ fontSize: '0.72rem' }}>{att.quizCategory}</span>
                        <span className="pf-attempt__time"><Clock size={11} /> {formatDateTime(att.completedAt)}</span>
                      </div>
                      <div className="pf-attempt__bar-wrap">
                        <div className="pf-attempt__bar">
                          <div className={`pf-attempt__bar-fill pf-attempt__bar-fill--${scoreClass}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="pf-attempt__pct">{pct.toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className={`pf-attempt__score pf-attempt__score--${scoreClass}`}>
                      <span className="pf-attempt__score-num">{att.score}/{att.totalQuestions}</span>
                      <span className="pf-attempt__score-label">Đúng</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="pf-empty">
              <Trophy size={40} strokeWidth={1.2} />
              <p>Bạn chưa hoàn thành bài quiz nào</p>
              <Link to="/explore" className="pf-btn pf-btn--primary">Luyện tập ngay</Link>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
