import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function MainLayout() {
  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
      <style>{`
        .layout { display: flex; min-height: 100vh; }
        .main-content { flex: 1; margin-left: var(--sidebar-width); padding: 32px; min-height: 100vh; max-width: 100%; overflow-x: hidden; }
        @media (max-width: 768px) {
          .main-content { margin-left: 0; padding: 72px 16px 24px; }
        }
      `}</style>
    </div>
  );
}
