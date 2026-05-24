import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Loader2, CheckCircle2, Trash2, ArrowRight } from 'lucide-react';
import { quizService } from '../services/quizService';
import { useAuth } from '../context/AuthContext';
import './CreatePage.css';

const CATEGORIES = ['Toán học', 'Vật lý', 'Hóa học', 'Sinh học', 'Lịch sử', 'Địa lý', 'Ngoại ngữ', 'Văn học', 'Khác'];

type Step = 'form' | 'processing' | 'done';

const CreatePage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [questionCount, setQuestionCount] = useState(10);
  const [step, setStep] = useState<Step>('form');
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [createdQuizId, setCreatedQuizId] = useState<number | null>(null);
  const [processingStep, setProcessingStep] = useState(0);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) validateAndSetFile(f);
  };

  const validateAndSetFile = (f: File) => {
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(f.type) && !f.name.endsWith('.docx') && !f.name.endsWith('.pdf')) {
      setError('Chỉ hỗ trợ file PDF và DOCX.');
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      setError('File không được vượt quá 20MB.');
      return;
    }
    setError('');
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^/.]+$/, ''));
  };

  const simulateProcessing = () => {
    const delays = [1000, 2000, 1500];
    delays.forEach((_, i) => {
      setTimeout(() => setProcessingStep(i + 1), delays.slice(0, i + 1).reduce((a, b) => a + b, 0));
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/create' } });
      return;
    }
    setError('');
    setStep('processing');
    setProcessingStep(0);
    simulateProcessing();

    try {
      const quiz = await quizService.create({ title, category, description, questionCount }, file || undefined);
      setCreatedQuizId(quiz.id);
      setTimeout(() => setStep('done'), 4500);
    } catch {
      setError('Đã có lỗi xảy ra khi tạo quiz. Vui lòng thử lại.');
      setStep('form');
    }
  };

  const formatBytes = (bytes: number) =>
    bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

  const PROCESSING_STEPS = [
    { label: '📄 Đọc và phân tích tài liệu', done: processingStep >= 1, active: processingStep === 0 },
    { label: '✨ AI tạo câu hỏi trắc nghiệm', done: processingStep >= 2, active: processingStep === 1 },
    { label: '📊 Hoàn thiện và lưu quiz', done: processingStep >= 3, active: processingStep === 2 },
  ];

  return (
    <main className="create-page">
      <div className="container">
        <div className="create-header">
          <h1 className="create-title">Tạo Quiz mới</h1>
          <p className="create-subtitle">Upload tài liệu để AI tự động tạo câu hỏi trắc nghiệm</p>
        </div>

        {!isAuthenticated && step === 'form' && (
          <div className="create-auth-notice">
            🔒 Bạn cần <a href="/login" className="auth-link">đăng nhập</a> để tạo quiz và lưu vào tài khoản.
          </div>
        )}

        {step === 'form' && (
          <form onSubmit={handleSubmit} className="create-form">
            {/* Upload Zone */}
            <div
              id="upload-zone"
              className={`upload-zone ${dragOver ? 'drag-over' : ''} ${file ? 'has-file' : ''}`}
              onDrop={handleFileDrop}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
            >
              {file ? (
                <div className="upload-zone__file">
                  <FileText size={32} className="upload-zone__file-icon" />
                  <div className="upload-zone__file-info">
                    <span className="upload-zone__file-name">{file.name}</span>
                    <span className="upload-zone__file-size">{formatBytes(file.size)}</span>
                  </div>
                  <button type="button" className="upload-zone__remove" onClick={() => setFile(null)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ) : (
                <label htmlFor="file-input" className="upload-zone__label">
                  <Upload size={40} className="upload-zone__upload-icon" />
                  <span className="upload-zone__text">
                    Kéo & thả file vào đây hoặc <span className="upload-zone__link">chọn file</span>
                  </span>
                  <span className="upload-zone__hint">Hỗ trợ PDF, DOCX • Tối đa 20MB</span>
                  <input id="file-input" type="file" accept=".pdf,.docx" hidden onChange={e => e.target.files?.[0] && validateAndSetFile(e.target.files[0])} />
                </label>
              )}
            </div>

            {error && <div className="create-error">{error}</div>}

            {/* Form Fields */}
            <div className="create-fields">
              <div className="form-group">
                <label htmlFor="quiz-title" className="form-label">Tên bài Quiz *</label>
                <input
                  id="quiz-title"
                  type="text"
                  className="form-input"
                  placeholder="VD: Hóa học hữu cơ – Chương 1"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  maxLength={200}
                  required
                />
              </div>

              <div className="create-fields-row">
                <div className="form-group">
                  <label htmlFor="quiz-category" className="form-label">Danh mục *</label>
                  <select id="quiz-category" className="form-input" value={category} onChange={e => setCategory(e.target.value)} required>
                    <option value="">Chọn danh mục...</option>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="quiz-count" className="form-label">
                    Số câu hỏi: <strong style={{ color: 'var(--primary)' }}>{questionCount}</strong>
                  </label>
                  <input
                    id="quiz-count"
                    type="range"
                    min={5} max={50} step={5}
                    value={questionCount}
                    onChange={e => setQuestionCount(Number(e.target.value))}
                    className="quiz-range"
                  />
                  <div className="range-labels"><span>5</span><span>25</span><span>50</span></div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="quiz-desc" className="form-label">Mô tả (tùy chọn)</label>
                <textarea
                  id="quiz-desc"
                  className="form-input"
                  placeholder="Mô tả ngắn về nội dung bài quiz..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>

            <button
              id="create-quiz-btn"
              type="submit"
              className="btn btn-primary create-submit-btn"
            >
              {file ? <><Upload size={18} /> Tạo Quiz với AI</> : <><ArrowRight size={18} /> Tạo Quiz (không có file)</>}
            </button>

            <p className="create-note">
              💡 <strong>Tip:</strong> Upload file tài liệu để AI tạo câu hỏi chính xác hơn. Nếu không có file, AI sẽ tạo dựa trên tên và danh mục.
            </p>
          </form>
        )}

        {step === 'processing' && (
          <div className="create-processing">
            <div className="processing-animation">
              <div className="processing-ring" />
              <Loader2 size={32} className="processing-spinner" />
            </div>
            <h2>AI đang tạo quiz của bạn...</h2>
            <p>Đang tạo <strong>{questionCount}</strong> câu hỏi cho bài: <strong>"{title}"</strong></p>

            <div className="processing-steps">
              {PROCESSING_STEPS.map((s, i) => (
                <div key={i} className={`processing-step-item ${s.done ? 'done' : s.active ? 'active' : ''}`}>
                  <div className="processing-step-dot" />
                  <span>{s.label}</span>
                  {s.done && <CheckCircle2 size={16} color="#10B981" />}
                  {s.active && <Loader2 size={16} className="spin" color="var(--primary)" />}
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="create-done">
            <div className="done-circle">
              <CheckCircle2 size={48} />
            </div>
            <h2>Gửi Quiz thành công! 🎉</h2>
            <p>
              Đã tạo <strong>{questionCount}</strong> câu hỏi cho bài quiz<br />
              <strong>"{title}"</strong> trong danh mục <strong>{category}</strong>.
            </p>
            <div style={{
              background: 'rgba(245, 158, 11, 0.1)',
              color: '#f59e0b',
              padding: '12px 16px',
              borderRadius: '8px',
              marginTop: '16px',
              marginBottom: '24px',
              fontSize: '0.9rem'
            }}>
              ⏳ Bài quiz của bạn đang <strong>Chờ duyệt</strong>. Sau khi Admin duyệt, nó sẽ được hiển thị công khai.
            </div>
            <div className="create-done__actions">
              {createdQuizId && (
                <button
                  id="start-quiz-btn"
                  className="btn btn-primary"
                  onClick={() => navigate(`/quiz/${createdQuizId}`)}
                >
                  Xem trước quiz
                </button>
              )}

              <button
                className="btn btn-outline"
                onClick={() => { setStep('form'); setFile(null); setTitle(''); setCategory(''); setDescription(''); setProcessingStep(0); }}
              >
                Tạo quiz khác
              </button>
              <button className="btn btn-ghost" onClick={() => navigate('/explore')}>
                Khám phá quiz
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default CreatePage;
