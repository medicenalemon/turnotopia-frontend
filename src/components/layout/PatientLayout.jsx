import { Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FiLogOut } from 'react-icons/fi';

export default function PatientLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="patient-layout">
      <header className="patient-header">
        <div className="patient-header-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ position: 'relative', width: '32px', height: '32px', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '50%', backgroundColor: '#00CFE8' }}></div>
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: '50%', height: '50%', backgroundColor: '#84FF00', borderBottomLeftRadius: '100%' }}></div>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-1px', lineHeight: 1 }}>
              <span style={{ color: '#00CFE8' }}>turno</span><span style={{ color: '#84FF00' }}>topia</span>
            </div>
          </div>
          
          <div className="patient-header-right">
            <span className="patient-greeting">Hola, {user?.name.split(' ')[0]}</span>
            <button className="btn btn-ghost" onClick={logout} title="Cerrar sesión">
              <FiLogOut />
            </button>
          </div>
        </div>
      </header>

      <main className="patient-main">
        <div className="patient-content-wrapper">
          <Outlet />
        </div>
      </main>

      <style>{`
        .patient-layout { min-height: 100vh; display: flex; flex-direction: column; }
        .patient-header { background: var(--bg-card); border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 100; backdrop-filter: blur(12px); }
        .patient-header-container { max-width: 1000px; margin: 0 auto; padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; }
        .patient-header-right { display: flex; align-items: center; gap: 16px; }
        .patient-greeting { font-weight: 600; color: var(--text-secondary); }
        .patient-main { flex: 1; padding: 32px 24px; }
        .patient-content-wrapper { max-width: 1000px; margin: 0 auto; width: 100%; }
        
        @media (max-width: 640px) {
          .patient-main { padding: 24px 16px; }
          .patient-header-container { padding: 12px 16px; }
          .patient-greeting { display: none; }
        }
      `}</style>
    </div>
  );
}
