import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { authService } from '../services/quizService';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const passwordStrength = () => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    return score;
  };

  const strengthLabel = ['', 'Yếu', 'Trung bình', 'Tốt', 'Mạnh'];
  const strengthColor = ['', '#EF4444', '#F59E0B', '#3B82F6', '#10B981'];
  const strength = passwordStrength();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    if (password.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự.');
      return;
    }
    setLoading(true);
    try {
      const data = await authService.register(name, email, password);
      login(data.token, data.user);
      navigate('/');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Đăng ký thất bại. Email có thể đã được sử dụng.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <Link to="/" className="auth-logo">
          <span className="auth-logo__icon">S</span>
          <span>StudentQuizz</span>
        </Link>

        <h1 className="auth-title">Tạo tài khoản</h1>
        <p className="auth-subtitle">Bắt đầu học thông minh hơn ngay hôm nay</p>

        {error && (
          <div className="auth-error">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="reg-name" className="form-label">Họ và tên</label>
            <input
              id="reg-name"
              type="text"
              className="form-input"
              placeholder="Nguyễn Văn A"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-email" className="form-label">Email</label>
            <input
              id="reg-email"
              type="email"
              className="form-input"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-password" className="form-label">Mật khẩu</label>
            <div className="form-input-wrap">
              <input
                id="reg-password"
                type={showPass ? 'text' : 'password'}
                className="form-input"
                placeholder="Tối thiểu 8 ký tự"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
              <button type="button" className="form-eye-btn" onClick={() => setShowPass(!showPass)}>
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {/* Password strength */}
            {password && (
              <div className="password-strength">
                <div className="password-strength__bars">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="password-strength__bar"
                      style={{ background: i <= strength ? strengthColor[strength] : '#E5E7EB' }}
                    />
                  ))}
                </div>
                <span style={{ color: strengthColor[strength], fontSize: '0.78rem', fontWeight: 600 }}>
                  {strengthLabel[strength]}
                </span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="reg-confirm" className="form-label">Xác nhận mật khẩu</label>
            <div className="form-input-wrap">
              <input
                id="reg-confirm"
                type={showPass ? 'text' : 'password'}
                className="form-input"
                placeholder="Nhập lại mật khẩu"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
              {confirm && (
                <span className="form-confirm-icon">
                  {confirm === password
                    ? <CheckCircle2 size={18} color="#10B981" />
                    : <AlertCircle size={18} color="#EF4444" />}
                </span>
              )}
            </div>
          </div>

          <button
            id="register-submit-btn"
            type="submit"
            className="btn btn-primary auth-submit-btn"
            disabled={loading}
          >
            {loading && <Loader2 size={18} className="spin" />}
            {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
          </button>
        </form>

        <p className="auth-switch">
          Đã có tài khoản?{' '}
          <Link to="/login" className="auth-link">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
