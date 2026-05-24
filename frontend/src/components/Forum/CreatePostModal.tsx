import { useState } from 'react';
import { X, Loader2, Tag } from 'lucide-react';
import { forumService } from '../../services/quizService';
import type { ForumPost } from '../../types';
import './CreatePostModal.css';

const ALL_TAGS = ['Toán học', 'Vật lý', 'Hóa học', 'Sinh học', 'Lịch sử', 'Ngoại ngữ', 'Tài liệu', 'Review', 'Hỏi đáp', 'TOEIC', 'Kinh nghiệm'];

interface Props {
  onClose: () => void;
  onCreated: (post: ForumPost) => void;
}

const CreatePostModal = ({ onClose, onCreated }: Props) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag].slice(0, 3)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Vui lòng điền tiêu đề và nội dung.');
      return;
    }
    setLoading(true);
    try {
      const newPost = await forumService.createPost(title.trim(), content.trim(), selectedTags);
      onCreated(newPost);
    } catch {
      setError('Đã có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <h2 className="modal-title">Đăng bài mới</h2>
          <button className="modal-close" onClick={onClose} aria-label="Đóng">
            <X size={20} />
          </button>
        </div>

        {error && <div className="modal-error">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Tiêu đề *</label>
            <input
              id="post-title"
              type="text"
              className="form-input"
              placeholder="Nhập tiêu đề bài viết..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={200}
              required
            />
            <span className="form-char-count">{title.length}/200</span>
          </div>

          <div className="form-group">
            <label className="form-label">Nội dung *</label>
            <textarea
              id="post-content"
              className="form-textarea"
              placeholder="Chia sẻ câu hỏi, kinh nghiệm hoặc tài liệu của bạn..."
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={6}
              maxLength={2000}
              required
            />
            <span className="form-char-count">{content.length}/2000</span>
          </div>

          <div className="form-group">
            <label className="form-label">
              <Tag size={14} /> Gắn thẻ (tối đa 3)
            </label>
            <div className="modal-tags">
              {ALL_TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  className={`modal-tag-btn ${selectedTags.includes(tag) ? 'selected' : ''}`}
                  onClick={() => toggleTag(tag)}
                  disabled={!selectedTags.includes(tag) && selectedTags.length >= 3}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Hủy</button>
            <button
              id="submit-post-btn"
              type="submit"
              className="btn btn-primary"
              disabled={loading || !title || !content}
            >
              {loading && <Loader2 size={16} className="spin" />}
              {loading ? 'Đang đăng...' : 'Đăng bài'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostModal;
