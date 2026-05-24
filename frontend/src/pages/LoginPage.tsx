import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { authService } from '../services/quizService';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const from = (location.state as { from?: string })?.from || '/';

  useEffect(() => {
    const lockMsg = sessionStorage.getItem('accountLockMessage');
    if (lockMsg) {
      setError(lockMsg);
      sessionStorage.removeItem('accountLockMessage');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authService.login(email, password);
      login(data.token, data.user);
      navigate(from, { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Email hoặc mật khẩu không đúng.';
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

        <h1 className="auth-title">Chào mừng trở lại!</h1>
        <p className="auth-subtitle">Đăng nhập để tiếp tục học tập</p>

        {from !== '/' && (
          <div className="auth-info">
            🔒 Bạn cần đăng nhập để truy cập trang này.
          </div>
        )}

        {error && (
          <div className="auth-error">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="login-email" className="form-label">Email</label>
            <input
              id="login-email"
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
            <div className="form-label-row">
              <label htmlFor="login-password" className="form-label">Mật khẩu</label>
              <a href="#" className="form-forgot">Quên mật khẩu?</a>
            </div>
            <div className="form-input-wrap">
              <input
                id="login-password"
                type={showPass ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="form-eye-btn"
                onClick={() => setShowPass(!showPass)}
                aria-label="Toggle password visibility"
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Quick fill demo */}
          <button
            type="button"
            className="auth-demo-btn"
            onClick={() => { setEmail('thao@example.com'); setPassword('password123'); }}
          >
            🧪 Dùng tài khoản demo
          </button>

          <button
            id="login-submit-btn"
            type="submit"
            className="btn btn-primary auth-submit-btn"
            disabled={loading}
          >
            {loading && <Loader2 size={18} className="spin" />}
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <p className="auth-switch">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="auth-link">Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
