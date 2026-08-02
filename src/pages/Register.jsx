import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiUser, FiUserPlus } from 'react-icons/fi';

/**
 * Página de registro público para nuevos pacientes/usuarios.
 */
export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  // Maneja el envío del formulario de registro
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) return toast.error('Complete todos los campos');
    setLoading(true);
    try {
      // Llama a la función register del AuthContext
      await register(name, email, password);
      toast.success('¡Registro exitoso! Bienvenido a Turnotopia.');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al registrarse');
    } finally { setLoading(false); }
  };

  return (
    <div className="login-page">
      <div className="login-bg" />
      <div className="login-card fade-in">
        <div className="login-logo" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '72px', height: '72px', marginBottom: '16px' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '50%', backgroundColor: '#00CFE8' }}></div>
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: '50%', height: '50%', backgroundColor: '#84FF00', borderBottomLeftRadius: '100%' }}></div>
          </div>
          <h1 className="login-title" style={{ display: 'flex', gap: '0', background: 'none', WebkitTextFillColor: 'initial', fontSize: '2.2rem', letterSpacing: '-1px', margin: '0 0 8px 0' }}>
            <span style={{ color: '#00CFE8' }}>turno</span><span style={{ color: '#84FF00' }}>topia</span>
          </h1>
          <p className="login-subtitle">Crear una nueva cuenta</p>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label">Nombre Completo</label>
            <div style={{ position: 'relative' }}>
              <FiUser style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" className="form-input" style={{ paddingLeft: 40 }} placeholder="Tu nombre" value={name} onChange={e => setName(e.target.value)} id="register-name" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <div style={{ position: 'relative' }}>
              <FiMail style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="email" className="form-input" style={{ paddingLeft: 40 }} placeholder="correo@ejemplo.com" value={email} onChange={e => setEmail(e.target.value)} id="register-email" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <div style={{ position: 'relative' }}>
              <FiLock style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="password" className="form-input" style={{ paddingLeft: 40 }} placeholder="Mínimo 6 caracteres" value={password} onChange={e => setPassword(e.target.value)} id="register-password" />
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 8 }} disabled={loading} id="register-submit">
            {loading ? <span className="spinner spinner-sm" /> : <><FiUserPlus /> Registrarse</>}
          </button>
        </form>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 24 }}>
          ¿Ya tienes cuenta? <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>Ingresa aquí</Link>
        </p>
      </div>

      <style>{`
        .login-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; position: relative; overflow: hidden; }
        .login-bg { position: absolute; inset: 0; background: linear-gradient(135deg, #0f172a 0%, #1a1a2e 25%, #16213e 50%, #0f172a 100%); background-size: 400% 400%; animation: gradientShift 15s ease infinite; }
        .login-bg::before { content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle at 30% 40%, rgba(6, 182, 212, 0.08) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(139, 92, 246, 0.08) 0%, transparent 50%); }
        .login-card { position: relative; z-index: 1; background: var(--bg-card); backdrop-filter: blur(24px); border: 1px solid var(--border); border-radius: var(--radius-xl); padding: 48px 40px; width: 100%; max-width: 420px; box-shadow: var(--shadow-lg), 0 0 60px rgba(6, 182, 212, 0.05); }
        @media (max-width: 480px) { .login-card { padding: 32px 24px; } }
        .login-logo { text-align: center; margin-bottom: 32px; }
        .login-title { font-size: 1.75rem; font-weight: 800; background: linear-gradient(135deg, var(--primary-light), var(--accent-light)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 4px; }
        .login-subtitle { color: var(--text-muted); font-size: 0.85rem; }
        .login-form { display: flex; flex-direction: column; }
      `}</style>
    </div>
  );
}
