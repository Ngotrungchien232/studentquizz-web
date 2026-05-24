import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ThumbsUp, MessageCircle, Send, Loader2 } from 'lucide-react';
import { forumService } from '../services/quizService';
import { useAuth } from '../context/AuthContext';
import type { ForumPost, ForumComment } from '../types';
import './ForumPostPage.css';

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Vừa xong';
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  return `${Math.floor(h / 24)} ngày trước`;
};

const AVATAR_COLORS = ['#7C3AED', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];

const getInitials = (name: string) =>
  name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

const ForumPostPage = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<ForumPost | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (!id) return;
    Promise.all([
      forumService.getPostById(Number(id)),
      forumService.getComments(Number(id)),
    ]).then(([p, c]) => {
      setPost(p);
      setComments(c);
      setLoading(false);
    });
  }, [id]);

  const handleLike = async () => {
    if (!isAuthenticated || !post) return;
    setPost(prev => prev ? {
      ...prev,
      liked: !prev.liked,
      likeCount: prev.liked ? prev.likeCount - 1 : prev.likeCount + 1
    } : null);
    await forumService.toggleLike(post.id).catch(() => {
      setPost(prev => prev ? {
        ...prev,
        liked: !prev.liked,
        likeCount: prev.liked ? prev.likeCount - 1 : prev.likeCount + 1
      } : null);
    });
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !isAuthenticated) return;
    setSubmitting(true);
    try {
      const newComment = await forumService.addComment(Number(id), commentText.trim());
      setComments(prev => [...prev, newComment]);
      setPost(prev => prev ? { ...prev, commentCount: prev.commentCount + 1 } : null);
      setCommentText('');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="forum-post-page">
        <div className="container">
          <div className="forum-post-skeleton" />
        </div>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="forum-post-page">
        <div className="container" style={{ textAlign: 'center', padding: '80px 0' }}>
          <p>Bài viết không tồn tại.</p>
          <Link to="/forum" className="btn btn-primary" style={{ marginTop: 16 }}>
            Quay lại diễn đàn
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="forum-post-page">
      <div className="container">
        <Link to="/forum" className="back-link">
          <ArrowLeft size={16} /> Diễn đàn
        </Link>

        <div className="forum-post-layout">
          {/* Main post */}
          <article className="forum-post-article card">
            {/* Author */}
            <div className="fpa-author">
              <div
                className="fpa-avatar"
                style={{ background: AVATAR_COLORS[post.author.id % AVATAR_COLORS.length] }}
              >
                {getInitials(post.author.name)}
              </div>
              <div>
                <div className="fpa-name">{post.author.name}</div>
                <div className="fpa-time">{timeAgo(post.createdAt)}</div>
              </div>
            </div>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="fpa-tags">
                {post.tags.map(tag => (
                  <span key={tag} className="fpc-tag"># {tag}</span>
                ))}
              </div>
            )}

            {/* Title + content */}
            <h1 className="fpa-title">{post.title}</h1>
            <div className="fpa-content">{post.content}</div>

            {/* Actions */}
            <div className="fpa-actions">
              <button
                className={`fpc-action-btn ${post.liked ? 'liked' : ''}`}
                onClick={handleLike}
                disabled={!isAuthenticated}
                title={!isAuthenticated ? 'Đăng nhập để thích' : ''}
              >
                <ThumbsUp size={16} />
                <span>{post.likeCount} thích</span>
              </button>
              <span className="fpc-action-btn">
                <MessageCircle size={16} />
                <span>{comments.length} bình luận</span>
              </span>
            </div>
          </article>

          {/* Comments */}
          <section className="forum-comments">
            <h2 className="comments-title">Bình luận ({comments.length})</h2>

            {/* Comment form */}
            {isAuthenticated ? (
              <form onSubmit={handleComment} className="comment-form">
                <div
                  className="comment-form__avatar"
                  style={{ background: AVATAR_COLORS[(user?.id || 0) % AVATAR_COLORS.length] }}
                >
                  {user ? getInitials(user.name) : '?'}
                </div>
                <div className="comment-form__input-wrap">
                  <textarea
                    id="comment-input"
                    className="comment-form__input"
                    placeholder="Viết bình luận của bạn..."
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    rows={3}
                    maxLength={500}
                  />
                  <div className="comment-form__footer">
                    <span className="form-char-count">{commentText.length}/500</span>
                    <button
                      id="submit-comment-btn"
                      type="submit"
                      className="btn btn-primary"
                      disabled={!commentText.trim() || submitting}
                    >
                      {submitting ? <Loader2 size={15} className="spin" /> : <Send size={15} />}
                      Gửi
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="comment-login-prompt">
                <Link to="/login" className="auth-link">Đăng nhập</Link> để tham gia bình luận
              </div>
            )}

            {/* Comment list */}
            <div className="comment-list">
              {comments.map(comment => (
                <div key={comment.id} className="comment-item">
                  <div
                    className="comment-avatar"
                    style={{ background: AVATAR_COLORS[(comment.author.id || 0) % AVATAR_COLORS.length] }}
                  >
                    {getInitials(comment.author.name)}
                  </div>
                  <div className="comment-body">
                    <div className="comment-header">
                      <span className="comment-author">{comment.author.name}</span>
                      <span className="comment-time">{timeAgo(comment.createdAt)}</span>
                    </div>
                    <p className="comment-content">{comment.content}</p>
                  </div>
                </div>
              ))}
              {comments.length === 0 && (
                <div className="comments-empty">Chưa có bình luận. Hãy là người đầu tiên!</div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default ForumPostPage;
