import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiUser, FiMail, FiLock } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function PatientLogin() {
  const [dni, setDni] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { patientLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await patientLogin(dni, email);
      toast.success('Bienvenido al Portal del Paciente');
      navigate('/portal');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container fade-in">
      <div className="login-card">
        <div className="login-header">
          <div style={{ position: 'relative', width: '72px', height: '72px', marginBottom: '16px' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '50%', backgroundColor: '#00CFE8' }}></div>
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: '50%', height: '50%', backgroundColor: '#84FF00', borderBottomLeftRadius: '100%' }}></div>
          </div>
          <h1 className="login-title" style={{ display: 'flex', gap: '0', background: 'none', WebkitTextFillColor: 'initial', fontSize: '2.2rem', letterSpacing: '-1px', margin: '0 0 8px 0' }}>
            <span style={{ color: '#00CFE8' }}>turno</span><span style={{ color: '#84FF00' }}>topia</span>
          </h1>
          <p className="login-subtitle">Portal del Paciente</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label">DNI</label>
            <div className="input-with-icon">
              <FiUser className="input-icon" />
              <input
                type="text"
                className="form-input"
                placeholder="Tu número de documento"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Correo Electrónico</label>
            <div className="input-with-icon">
              <FiMail className="input-icon" />
              <input
                type="email"
                className="form-input"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar a mi portal'}
          </button>
        </form>
        
        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.9rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>¿Sos parte del staff?</p>
          <Link to="/login" style={{ color: 'var(--primary-light)', textDecoration: 'none', fontWeight: 600 }}>
            Ingresar como Staff
          </Link>
        </div>
      </div>

      <style>{`
        .login-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; position: relative; overflow: hidden; }
        .login-container::before { content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(6,182,212,0.15) 0%, rgba(15,23,42,0) 50%); z-index: 0; }
        .login-card { position: relative; z-index: 1; background: var(--bg-card); backdrop-filter: blur(24px); border: 1px solid var(--border); border-radius: var(--radius-xl); padding: 48px 40px; width: 100%; max-width: 420px; box-shadow: var(--shadow-lg); }
        .login-header { text-align: center; margin-bottom: 32px; display: flex; flex-direction: column; align-items: center; }
        .login-subtitle { color: var(--text-secondary); font-size: 1.1rem; }
        .login-form { display: flex; flex-direction: column; gap: 20px; }
        .login-btn { width: 100%; justify-content: center; padding: 12px; font-size: 1rem; margin-top: 8px; }
        .input-with-icon { position: relative; }
        .input-icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 1.1rem; }
        .input-with-icon .form-input { padding-left: 44px; }
      `}</style>
    </div>
  );
}
