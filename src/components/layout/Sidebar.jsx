import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FiHome, FiList, FiCalendar, FiUsers, FiUserPlus, FiGrid, FiFileText, FiClock, FiDollarSign, FiLogOut, FiMenu, FiX, FiShield, FiBarChart2 } from 'react-icons/fi';
import { useState } from 'react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: FiHome },
  { path: '/appointments', label: 'Turnos', icon: FiList },
  { path: '/calendar', label: 'Calendario', icon: FiCalendar },
  { path: '/waiting-room', label: 'Sala de Espera', icon: FiClock },
  { path: '/patients', label: 'Pacientes', icon: FiUsers },
  { path: '/doctors', label: 'Médicos', icon: FiUserPlus },
  { path: '/specialties', label: 'Especialidades', icon: FiGrid },
  { path: '/medical-records', label: 'Historias Clínicas', icon: FiFileText },
  { path: '/billing', label: 'Facturación', icon: FiDollarSign },
];

const adminItems = [
  { path: '/users', label: 'Gestión de Usuarios', icon: FiShield },
  { path: '/reports', label: 'Reportes', icon: FiBarChart2 },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      <button className="sidebar-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
        {mobileOpen ? <FiX /> : <FiMenu />}
      </button>
      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div style={{ position: 'relative', width: '36px', height: '36px', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '50%', backgroundColor: '#ffffff' }}></div>
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: '50%', height: '50%', backgroundColor: '#ffffff', borderBottomLeftRadius: '100%' }}></div>
            </div>
            <div>
              <div className="logo-text" style={{ background: 'none', WebkitTextFillColor: 'initial', color: '#ffffff', fontSize: '1.25rem', letterSpacing: '-0.5px', marginTop: '6px' }}>
                turnotopia
              </div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
              end={path === '/'}
            >
              <Icon className="sidebar-link-icon" />
              <span>{label}</span>
            </NavLink>
          ))}
          {user?.role === 'admin' && (
            <>
              <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />
              {adminItems.map(({ path, label, icon: Icon }) => (
                <NavLink
                  key={path}
                  to={path}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileOpen(false)}
                  end={path === '/'}
                >
                  <Icon className="sidebar-link-icon" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{user?.name?.charAt(0)?.toUpperCase()}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name}</div>
              <div className="sidebar-user-role">{user?.role === 'admin' ? 'Administrador' : user?.role === 'doctor' ? 'Médico' : 'Recepción'}</div>
            </div>
          </div>
          <button className="sidebar-logout" onClick={logout} title="Cerrar sesión">
            <FiLogOut />
          </button>
        </div>
      </aside>
      {mobileOpen && <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />}

      <style>{`
        .sidebar-toggle { display: none; position: fixed; top: 16px; left: 16px; z-index: 1001; background: var(--bg-card); border: 1px solid var(--border); color: var(--text-primary); border-radius: var(--radius-md); padding: 10px; cursor: pointer; font-size: 1.2rem; backdrop-filter: blur(16px); }
        .sidebar { position: fixed; top: 0; left: 0; width: var(--sidebar-width); height: 100vh; background: var(--bg-card); backdrop-filter: blur(20px); border-right: 1px solid var(--border); display: flex; flex-direction: column; z-index: 1000; transition: transform var(--transition-slow); }
        .sidebar-header { padding: 24px 20px; border-bottom: 1px solid var(--border); }
        .sidebar-logo { display: flex; align-items: center; gap: 12px; }
        .logo-icon { width: 40px; height: 40px; border-radius: var(--radius-md); background: linear-gradient(135deg, var(--primary), var(--accent)); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; font-weight: 800; color: white; flex-shrink: 0; }
        .logo-text { font-size: 1.15rem; font-weight: 800; background: linear-gradient(135deg, var(--primary-light), var(--accent-light)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .logo-subtitle { font-size: 0.7rem; color: var(--text-muted); font-weight: 500; }
        .sidebar-nav { flex: 1; padding: 16px 12px; display: flex; flex-direction: column; gap: 4px; overflow-y: auto; }
        .sidebar-link { display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-radius: var(--radius-md); color: var(--text-secondary); font-size: 0.9rem; font-weight: 500; transition: all var(--transition); text-decoration: none; }
        .sidebar-link:hover { background: rgba(6, 182, 212, 0.08); color: var(--text-primary); }
        .sidebar-link.active { background: linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(139, 92, 246, 0.1)); color: var(--primary-light); border: 1px solid rgba(6, 182, 212, 0.2); }
        .sidebar-link-icon { font-size: 1.15rem; flex-shrink: 0; }
        .sidebar-footer { padding: 16px; border-top: 1px solid var(--border); display: flex; align-items: center; gap: 8px; }
        .sidebar-user { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
        .sidebar-avatar { width: 36px; height: 36px; border-radius: var(--radius-full); background: linear-gradient(135deg, var(--primary-dark), var(--accent-dark)); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.85rem; color: white; flex-shrink: 0; }
        .sidebar-user-info { min-width: 0; }
        .sidebar-user-name { font-size: 0.85rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .sidebar-user-role { font-size: 0.7rem; color: var(--text-muted); }
        .sidebar-logout { background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 8px; border-radius: var(--radius-sm); transition: all var(--transition); font-size: 1.1rem; display: flex; }
        .sidebar-logout:hover { background: rgba(239, 68, 68, 0.1); color: var(--danger); }
        .sidebar-backdrop { display: none; }
        @media (max-width: 768px) {
          .sidebar-toggle { display: flex; }
          .sidebar { transform: translateX(-100%); }
          .sidebar.sidebar-open { transform: translateX(0); }
          .sidebar-backdrop { display: block; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 999; }
        }
      `}</style>
    </>
  );
}
