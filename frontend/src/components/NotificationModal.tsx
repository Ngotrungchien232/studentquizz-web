import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './NotificationModal.css';

const AUTO_CLOSE_SEC = 5;

const WelcomeModal = () => {
  const { isAuthenticated, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [countdown, setCountdown] = useState(AUTO_CLOSE_SEC);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const closeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      const hasSeen = sessionStorage.getItem('hasSeenWelcomeModal');
      if (!hasSeen) {
        const openTimer = setTimeout(() => {
          setIsOpen(true);
          setCountdown(AUTO_CLOSE_SEC);

          // Countdown tick
          timerRef.current = setInterval(() => {
            setCountdown(prev => {
              if (prev <= 1) {
                clearInterval(timerRef.current!);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);

          // Auto close after N seconds
          closeRef.current = setTimeout(() => {
            handleClose();
          }, AUTO_CLOSE_SEC * 1000);
        }, 600);

        return () => clearTimeout(openTimer);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]);

  const handleClose = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (closeRef.current) clearTimeout(closeRef.current);
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
      sessionStorage.setItem('hasSeenWelcomeModal', 'true');
    }, 350);
  };

  if (!isOpen) return null;

  const progress = ((AUTO_CLOSE_SEC - countdown) / AUTO_CLOSE_SEC) * 100;

  return (
    <div className={`wm-overlay ${isClosing ? 'wm-overlay--out' : ''}`} onClick={handleClose}>
      <div
        className={`wm-box ${isClosing ? 'wm-box--out' : ''}`}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Thông báo chào mừng"
      >
        {/* Gradient header banner */}
        <div className="wm-banner">
          <div className="wm-banner__rings">
            <span className="wm-ring wm-ring--1" />
            <span className="wm-ring wm-ring--2" />
            <span className="wm-ring wm-ring--3" />
          </div>
          <span className="wm-banner__emoji">📢</span>
          <h2 className="wm-banner__title">THÔNG BÁO</h2>
        </div>

        {/* Progress bar auto-close */}
        <div className="wm-progress-track">
          <div
            className="wm-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="wm-countdown">Tự đóng sau {countdown}s</p>

        {/* Close button */}
        <button className="wm-close" onClick={handleClose} aria-label="Đóng thông báo">
          <X size={16} />
        </button>

        {/* Content */}
        <div className="wm-body">
          <div className="wm-line">
            <span className="wm-emoji">👋</span>
            <p><strong>Chào mọi người!</strong></p>
          </div>

          <div className="wm-line">
            <span className="wm-emoji">💖</span>
            <p>Cảm ơn tất cả các bạn đã đăng ký và sử dụng website trong thời gian qua.</p>
          </div>

          <div className="wm-line wm-line--highlight">
            <span className="wm-emoji">🚧</span>
            <p>
              Hiện tại website vẫn đang trong quá trình hoàn thiện và phát triển thêm nhiều tính năng mới.
              Vì vậy, nếu trong quá trình sử dụng các bạn có bất kỳ <strong>góp ý, báo lỗi</strong> hoặc <strong>đề xuất tính năng</strong> nào,
              hãy đăng bài lên{' '}
              <a href="/forum" className="wm-link" onClick={handleClose}>
                Diễn đàn
              </a>{' '}
              để Chiến có thể tiếp nhận và cải thiện website ngày càng tốt hơn nhé!
            </p>
          </div>

          <div className="wm-line">
            <span className="wm-emoji">📝</span>
            <p>Mọi ý kiến đóng góp của các bạn đều rất quý giá và là động lực để website phát triển tốt hơn mỗi ngày.</p>
          </div>

          <div className="wm-line">
            <span className="wm-emoji">🙏</span>
            <p>Một lần nữa, xin chân thành cảm ơn sự đồng hành và ủng hộ của mọi người!</p>
          </div>

          <div className="wm-line wm-line--closing">
            <span className="wm-emoji">💙</span>
            <p>Chúc mọi người có những trải nghiệm thật tuyệt vời trên website!</p>
          </div>
        </div>

        {/* CTA */}
        <div className="wm-footer">
          <button className="wm-btn wm-btn--primary" onClick={handleClose}>
            ✨ Bắt đầu khám phá
          </button>
          <a href="/forum" className="wm-btn wm-btn--outline" onClick={handleClose}>
            📝 Gửi góp ý
          </a>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;
