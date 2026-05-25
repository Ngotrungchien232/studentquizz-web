import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, Trophy, RotateCcw, Send, Play, HelpCircle, UserCheck, Loader2 } from 'lucide-react';
import { quizService } from '../services/quizService';
import { useAuth } from '../context/AuthContext';
import CommentThread from '../components/Forum/CommentThread';
import type { Quiz, Question, QuizComment } from '../types';
import './QuizPlayPage.css';

const QuizPlayPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [hasStarted, setHasStarted] = useState(false);
  const [comments, setComments] = useState<QuizComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [playRecorded, setPlayRecorded] = useState(false);

  useEffect(() => {
    if (!id) return;
    quizService.getById(Number(id)).then(data => {
      setQuiz(data);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    quizService.getComments(Number(id))
      .then(setComments)
      .catch(console.error);
  }, [id]);

  const handleAddComment = async (e: React.FormEvent, parentId?: number) => {
    e.preventDefault();
    if (!id) return;
    const content = newComment.trim();
    if (!content) return;

    setSubmittingComment(true);
    try {
      await quizService.addComment(Number(id), content, parentId);
      setNewComment('');
      const freshComments = await quizService.getComments(Number(id));
      setComments(freshComments);
    } catch (err) {
      console.error('Lỗi khi thêm bình luận:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  useEffect(() => {
    if (!isFinished || playRecorded || !id) return;
    quizService.recordPlay(Number(id))
      .then(() => setPlayRecorded(true))
      .catch(() => setPlayRecorded(true));
  }, [isFinished, playRecorded, id]);

  if (loading) {
    return (
      <div className="quiz-play-page loading-state">
        <div className="spinner" />
        <p>Đang tải câu hỏi...</p>
      </div>
    );
  }

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <div className="quiz-play-page error-state">
        <h2>
          {!quiz
            ? 'Không tìm thấy bài Quiz hoặc bài Quiz chưa được duyệt'
            : 'Bài Quiz chưa có câu hỏi'}
        </h2>
        <Link to="/explore" className="btn btn-primary">Quay lại Khám phá</Link>
      </div>
    );
  }

  // Render landing page if not started
  if (!hasStarted) {
    const totalCommentsCount = comments.reduce((sum, c) => sum + 1 + (c.replies?.length || 0), 0);
    const getInitials = (name: string) =>
      name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const AVATAR_COLORS = ['#7C3AED', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];
    const handleReply = async (parentId: number, content: string) => {
      await quizService.addComment(Number(id), content, parentId);
      const freshComments = await quizService.getComments(Number(id));
      setComments(freshComments);
    };

    return (
      <main className="quiz-landing-page">
        <div className="container">
          <Link to="/explore" className="back-link">
            <ArrowLeft size={16} /> Khám phá Quiz
          </Link>

          <div className="quiz-landing-layout">
            {/* Quiz Info Card */}
            <div className="quiz-info-card card">
              <span className="quiz-category-tag">{quiz.category}</span>
              <h1 className="quiz-landing-title">{quiz.title}</h1>
              {quiz.description && <p className="quiz-landing-description">{quiz.description}</p>}
              
              <div className="quiz-landing-stats">
                <div className="stat-item">
                  <HelpCircle size={18} className="stat-icon" />
                  <div>
                    <span className="stat-value">{quiz.questions.length}</span>
                    <span className="stat-label">câu hỏi</span>
                  </div>
                </div>
                <div className="stat-item">
                  <Play size={18} className="stat-icon" />
                  <div>
                    <span className="stat-value">{quiz.playCount}</span>
                    <span className="stat-label">lượt chơi</span>
                  </div>
                </div>
                {quiz.author && (
                  <div className="stat-item">
                    <UserCheck size={18} className="stat-icon" />
                    <div>
                      <span className="stat-value">{quiz.author.name}</span>
                      <span className="stat-label">người tạo</span>
                    </div>
                  </div>
                )}
              </div>

              <button className="btn btn-primary btn-start-play-quiz" onClick={() => setHasStarted(true)}>
                <Play size={18} fill="currentColor" /> Bắt đầu làm bài
              </button>
            </div>

            {/* Quiz Comments Section */}
            <section className="quiz-comments-section">
              <h2 className="comments-title">Thảo luận & Đánh giá ({totalCommentsCount})</h2>

              {isAuthenticated ? (
                <form onSubmit={(e) => handleAddComment(e)} className="comment-form">
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
                      placeholder="Viết bình luận hoặc câu hỏi của bạn về bài quiz này..."
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      rows={3}
                      maxLength={500}
                    />
                    <div className="comment-form__footer">
                      <span className="form-char-count">{newComment.length}/500</span>
                      <button
                        id="submit-comment-btn"
                        type="submit"
                        className="btn btn-primary"
                        disabled={!newComment.trim() || submittingComment}
                      >
                        {submittingComment ? <Loader2 size={15} className="spin" /> : <Send size={15} />}
                        Gửi bình luận
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="comment-login-prompt">
                  <Link to="/login" className="auth-link">Đăng nhập</Link> để tham gia thảo luận về bài quiz.
                </div>
              )}

              <div className="comment-list" style={{ marginTop: '24px' }}>
                {comments.map(comment => (
                  <CommentThread
                    key={comment.id}
                    comment={comment}
                    isAuthenticated={isAuthenticated}
                    onReply={handleReply}
                  />
                ))}
                {comments.length === 0 && (
                  <div className="comments-empty">Chưa có bình luận nào cho bài Quiz này. Hãy là người đầu tiên thảo luận!</div>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    );
  }

  const questions: Question[] = quiz.questions;
  const currentQuestion = questions[currentQIndex];

  const handleSelectOption = (index: number) => {
    if (isAnswered) return;
    setSelectedAnswer(index);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;
    
    setIsAnswered(true);
    if (selectedAnswer === currentQuestion.correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
    }
  };

  const handleRetry = () => {
    setCurrentQIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setScore(0);
    setIsFinished(false);
  };

  if (isFinished) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="quiz-play-page">
        <div className="container quiz-result-container">
          <div className="card quiz-result-card">
            <Trophy size={64} className="result-icon" />
            <h1 className="result-title">Hoàn thành!</h1>
            <p className="result-subtitle">Bạn đã hoàn thành bài quiz <strong>{quiz.title}</strong></p>
            
            <div className="result-score-box">
              <span className="result-score">{score} / {questions.length}</span>
              <span className="result-percentage">({percentage}%)</span>
            </div>

            <div className="result-actions">
              <button className="btn btn-primary" onClick={handleRetry}>
                <RotateCcw size={16} /> Làm lại
              </button>
              <button className="btn btn-outline" onClick={() => navigate('/explore')}>
                Khám phá quiz khác
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-play-page">
      <div className="container quiz-play-container">
        {/* Header */}
        <div className="quiz-play-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} /> Thoát
          </button>
          <div className="quiz-progress-text">
            Câu {currentQIndex + 1} / {questions.length}
          </div>
        </div>

        {/* Progress bar */}
        <div className="quiz-progress-bar">
          <div 
            className="quiz-progress-fill" 
            style={{ width: `${((currentQIndex + 1) / questions.length) * 100}%` }}
          />
        </div>

        {/* Question Area */}
        <div className="quiz-question-area card">
          <h2 className="question-text">{currentQuestion.content}</h2>
          
          <div className="options-grid">
            {currentQuestion.options.map((opt, index) => {
              let btnClass = "option-btn";
              if (isAnswered) {
                if (index === currentQuestion.correctAnswer) btnClass += " correct";
                else if (index === selectedAnswer) btnClass += " incorrect";
                else btnClass += " disabled";
              } else if (selectedAnswer === index) {
                btnClass += " selected";
              }

              return (
                <button 
                  key={index}
                  className={btnClass}
                  onClick={() => handleSelectOption(index)}
                  disabled={isAnswered}
                >
                  <span className="option-label">{String.fromCharCode(65 + index)}</span>
                  <span className="option-text">{opt}</span>
                  {isAnswered && index === currentQuestion.correctAnswer && <CheckCircle2 className="option-icon" size={18} />}
                  {isAnswered && index === selectedAnswer && index !== currentQuestion.correctAnswer && <XCircle className="option-icon" size={18} />}
                </button>
              );
            })}
          </div>

          {/* Explanation Area */}
          {isAnswered && currentQuestion.explanation && (
            <div className={`explanation-box ${selectedAnswer === currentQuestion.correctAnswer ? 'correct-bg' : 'incorrect-bg'}`}>
              <strong>Giải thích:</strong> {currentQuestion.explanation}
            </div>
          )}

          {/* Actions */}
          <div className="quiz-actions">
            {!isAnswered ? (
              <button 
                className="btn btn-primary submit-ans-btn" 
                onClick={handleSubmitAnswer}
                disabled={selectedAnswer === null}
              >
                Kiểm tra đáp án
              </button>
            ) : (
              <button 
                className="btn btn-primary next-ans-btn" 
                onClick={handleNext}
              >
                {currentQIndex < questions.length - 1 ? 'Câu tiếp theo' : 'Xem kết quả'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizPlayPage;
