import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../api/services/authService';
import toast from 'react-hot-toast';

const Login = () => {
  const [role, setRole] = useState('operator');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate(user.role === 'operator' ? '/operator/dashboard' : '/leader/dashboard');
    }
  }, [user, navigate]);

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setError('');
    setEmail('');
    setPassword('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result?.user) {
        navigate(result.user.role === 'operator' ? '/operator/dashboard' : '/leader/dashboard');
      }
    } catch (error) {
      setError(error.message || 'Login gagal, coba lagi');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 REGISTRASI HANYA UNTUK OPERATOR
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Paksa role = operator (leader tidak bisa daftar sendiri)
      const result = await authService.register(email, password, name, employeeId, 'operator');
      
      if (result?.user) {
        toast.success(`✅ Registrasi berhasil! Selamat datang, ${result.user.name}!`);
        setIsRegister(false);
        setEmail('');
        setPassword('');
        setName('');
        setEmployeeId('');
        
        // Auto login setelah register
        await login(email, password);
        navigate('/operator/dashboard');
      }
    } catch (error) {
      setError(error.message || 'Registrasi gagal');
      console.error('Register error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    setError('');
    setEmail('');
    setPassword('');
    setName('');
    setEmployeeId('');
    // 🔥 Saat registrasi, role otomatis operator
    if (!isRegister) {
      setRole('operator');
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-box">
        <div className="auth-logo">
          <div className="auth-logo-icon">🪡</div>
          egaaSLDV
        </div>
        <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>
          {isRegister ? 'Daftar Akun Operator' : 'Selamat Datang'}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--sub)', marginBottom: '20px' }}>
          {isRegister 
            ? 'Daftar sebagai Operator untuk mulai input produksi' 
            : 'Sistem Monitoring Produksi Finishing Embroidery'}
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label className="field-label">Login Sebagai</label>
          <div className="role-select-grid">
            <div
              className={`role-card ${role === 'operator' ? 'active' : ''}`}
              onClick={() => handleRoleSelect('operator')}
            >
              <div className="role-icon">👷</div>
              <div className="role-name">Operator</div>
              <div className="role-sub">Input produksi harian</div>
            </div>
            <div
              className={`role-card ${role === 'leader' ? 'active' : ''}`}
              onClick={() => handleRoleSelect('leader')}
            >
              <div className="role-icon">📊</div>
              <div className="role-name">Leader / Admin</div>
              <div className="role-sub">Monitoring & laporan</div>
            </div>
          </div>
        </div>

        {/* 🔥 PERINGATAN: Leader tidak bisa daftar sendiri */}
        {isRegister && (
          <div style={{ 
            background: '#e6fff8', 
            color: '#00a87a', 
            padding: '8px 12px', 
            borderRadius: '8px',
            marginBottom: '14px',
            fontSize: '12px'
          }}>
            ℹ️ Pendaftaran hanya untuk Operator. Leader dibuat oleh admin.
          </div>
        )}

        {error && (
          <div style={{ 
            background: 'var(--danger-lt)', 
            color: 'var(--danger)', 
            padding: '10px 14px', 
            borderRadius: '8px',
            marginBottom: '14px',
            fontSize: '13px',
            fontWeight: 600
          }}>
            ❌ {error}
          </div>
        )}

        <form onSubmit={isRegister ? handleRegister : handleLogin}>
          {isRegister && (
            <>
              <div className="form-group">
                <label className="field-label">Nama Lengkap</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama lengkap"
                  required
                />
              </div>
              <div className="form-group">
                <label className="field-label">Employee ID</label>
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="Contoh: OP-001"
                  required
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label className="field-label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@domain.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="field-label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isRegister ? 'Minimal 6 karakter' : '••••••••'}
              required
              minLength={6}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
            {loading ? 'Loading...' : (isRegister ? '🚀 Daftar sebagai Operator' : '🚀 Masuk ke Sistem')}
          </button>
        </form>

        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <span 
            style={{ color: 'var(--accent)', cursor: 'pointer', fontSize: '13px' }}
            onClick={toggleMode}
          >
            {isRegister ? 'Sudah punya akun? Login →' : 'Belum punya akun? Daftar sebagai Operator →'}
          </span>
        </div>

        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '18px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', color: 'var(--label)' }}>🟢 SISTEM AKTIF</span>
          <span style={{ fontSize: '11px', color: 'var(--label)' }}>🔒 AES-256 ENCRYPTED</span>
        </div>
      </div>
    </div>
  );
};

export default Login;