import { useState, useEffect } from 'react';
import { Megaphone, X, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './NotificationModal.css';

const NotificationModal = () => {
  const { isAuthenticated, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Chỉ hiển thị khi người dùng đã đăng nhập và chưa tắt thông báo trong phiên này
    if (isAuthenticated && user) {
      const hasSeen = sessionStorage.getItem('hasSeenFeedbackModal');
      if (!hasSeen) {
        // Trì hoãn nhẹ 800ms để tăng hiệu ứng chuyển động mượt mà
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [isAuthenticated, user]);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('hasSeenFeedbackModal', 'true');
  };

  if (!isOpen) return null;

  return (
    <div className="notif-overlay" onClick={handleClose}>
      <div className="notif-box" onClick={e => e.stopPropagation()}>
        <button className="notif-close-btn" onClick={handleClose} aria-label="Đóng">
          <X size={18} />
        </button>
        
        <div className="notif-header-icon">
          <Megaphone className="pulse-icon" size={32} />
        </div>

        <h3 className="notif-title">Thông báo hệ thống</h3>
        
        <p className="notif-content">
          Chào mọi người, web đang trong quá trình hoàn thiện do mọi thứ làm chưa hoàn chỉnh, mọi người sử dụng và gửi feedback về cho Chiến nhé. Cảm ơn mọi người!
        </p>

        <button className="notif-btn" onClick={handleClose}>
          <Check size={16} /> Bắt đầu ngay
        </button>
      </div>
    </div>
  );
};

export default NotificationModal;
