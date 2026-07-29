import { FiMail, FiGlobe, FiGithub, FiLinkedin } from 'react-icons/fi';

export default function About() {
  return (
    <div className="page fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 128px)' }}>
      <div className="about-card card">
        <div className="about-logo-container">
          <div style={{ position: 'relative', width: '72px', height: '72px', flexShrink: 0 }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '50%', backgroundColor: '#00CFE8' }}></div>
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: '50%', height: '50%', backgroundColor: '#84FF00', borderBottomLeftRadius: '100%' }}></div>
          </div>
          <h1 className="login-title" style={{ display: 'flex', gap: '0', background: 'none', WebkitTextFillColor: 'initial', fontSize: '3.5rem', letterSpacing: '-2px', margin: 0, lineHeight: 1 }}>
            <span style={{ color: '#00CFE8' }}>turno</span><span style={{ color: '#84FF00' }}>topia</span>
          </h1>
        </div>

        <p className="about-version">Versión 2.0</p>
        
        <hr className="about-divider" />
        
        <h2 className="about-author">Mauricio Alejandro Montero</h2>
        <p className="about-subtitle">Ingeniero en Sistemas de Información / Desarrollador Web Full-Stack</p>
        <p className="about-copyright">(C) 2026. Todos los derechos reservados.</p>

        <div className="about-buttons">
          <a href="#" className="btn btn-ghost about-btn"><FiMail /> Contacto</a>
          <a href="#" className="btn btn-ghost about-btn"><FiGlobe /> Portfolio</a>
          <a href="#" className="btn btn-ghost about-btn"><FiGithub /> GitHub</a>
          <a href="#" className="btn btn-ghost about-btn"><FiLinkedin /> LinkedIn</a>
        </div>
      </div>
      
      <style>{`
        .about-card { width: 100%; max-width: 600px; padding: 48px; text-align: center; display: flex; flex-direction: column; align-items: center; }
        .about-logo-container { display: flex; align-items: center; gap: 16px; margin-bottom: 40px; justify-content: center; }
        .about-version { color: var(--text-muted); font-weight: 500; font-size: 0.95rem; margin-bottom: 32px; }
        .about-divider { width: 100%; height: 1px; background: var(--border); border: none; margin-bottom: 32px; }
        .about-author { font-size: 1.5rem; font-weight: 800; color: var(--text-primary); margin-bottom: 8px; }
        .about-subtitle { color: var(--text-secondary); font-size: 0.95rem; margin-bottom: 12px; }
        .about-copyright { color: var(--text-muted); font-size: 0.85rem; margin-bottom: 32px; }
        .about-buttons { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; width: 100%; }
        .about-btn { justify-content: center; padding: 12px; font-weight: 600; }
        
        @media (max-width: 640px) {
          .about-card { padding: 32px 24px; }
          .about-logo-container { flex-direction: column; gap: 8px; }
          .about-buttons { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
