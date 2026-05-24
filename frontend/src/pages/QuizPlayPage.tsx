import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, Trophy, RotateCcw } from 'lucide-react';
import { quizService } from '../services/quizService';
import type { Quiz, Question } from '../types';
import './QuizPlayPage.css';

const QuizPlayPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (!id) return;
    quizService.getById(Number(id)).then(data => {
      setQuiz(data);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [id]);

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
        <h2>Không tìm thấy bài Quiz hoặc bài Quiz chưa có câu hỏi</h2>
        <Link to="/explore" className="btn btn-primary">Quay lại Khám phá</Link>
      </div>
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
