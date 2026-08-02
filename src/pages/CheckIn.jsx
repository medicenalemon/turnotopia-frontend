import { useState } from 'react';
import { FiCheckCircle, FiUser, FiAlertCircle } from 'react-icons/fi';
import { publicService } from '../services/api';

/**
 * Página pública de "Fila Virtual" donde el paciente ingresa su DNI para anunciarse al llegar.
 */
export default function CheckIn() {
  const [dni, setDni] = useState('');
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [error, setError] = useState(null);

  // Envía la petición de check-in utilizando el DNI ingresado
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data } = await publicService.checkin(dni);
      setSuccessData(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al procesar el check-in. Por favor, acércate a recepción.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkin-container fade-in">
      <div className="checkin-card card">
        <div className="checkin-header">
          <div style={{ position: 'relative', width: '56px', height: '56px', marginBottom: '16px' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '50%', backgroundColor: '#00CFE8' }}></div>
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: '50%', height: '50%', backgroundColor: '#84FF00', borderBottomLeftRadius: '100%' }}></div>
          </div>
          <h1 className="login-title" style={{ display: 'flex', gap: '0', background: 'none', WebkitTextFillColor: 'initial', fontSize: '1.8rem', letterSpacing: '-1px', margin: '0 0 8px 0' }}>
            <span style={{ color: '#00CFE8' }}>turno</span><span style={{ color: '#84FF00' }}>topia</span>
          </h1>
          <p className="checkin-subtitle">Fila Virtual</p>
        </div>

        {successData ? (
          <div className="checkin-success">
            <FiCheckCircle className="success-icon" />
            <h2>¡Estás en la fila!</h2>
            <p>Ya le avisamos al <strong>{successData.doctorName}</strong> que llegaste.</p>
            
            <div className="queue-info">
              <span className="queue-label">Faltan ser atendidos antes que tú:</span>
              <span className="queue-number">{successData.queuePosition}</span>
              <span className="queue-label">pacientes</span>
            </div>
            
            <p className="queue-wait-message">
              Toma asiento. Te llamaremos a la brevedad.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="checkin-form">
            <p className="checkin-instruction">Ingresa tu número de documento para anunciarte.</p>
            
            {error && (
              <div className="checkin-error">
                <FiAlertCircle /> {error}
              </div>
            )}

            <div className="form-group">
              <div className="input-with-icon">
                <FiUser className="input-icon" />
                <input
                  type="text"
                  className="form-input checkin-input"
                  placeholder="Tu DNI"
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary checkin-btn" disabled={loading}>
              {loading ? 'Procesando...' : 'Anunciarme'}
            </button>
          </form>
        )}
      </div>

      <style>{`
        .checkin-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; background: #0f172a; position: relative; overflow: hidden; }
        .checkin-container::before { content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(132,255,0,0.15) 0%, rgba(15,23,42,0) 50%); z-index: 0; }
        .checkin-card { position: relative; z-index: 1; background: var(--bg-card); backdrop-filter: blur(24px); border: 1px solid var(--border); border-radius: var(--radius-xl); padding: 40px 32px; width: 100%; max-width: 400px; box-shadow: var(--shadow-lg); text-align: center; }
        .checkin-header { margin-bottom: 32px; display: flex; flex-direction: column; align-items: center; }
        .checkin-subtitle { color: var(--text-secondary); font-size: 1rem; font-weight: 500; text-transform: uppercase; letter-spacing: 1px; }
        .checkin-instruction { color: var(--text-primary); margin-bottom: 24px; font-size: 1.05rem; }
        .checkin-input { font-size: 1.2rem; padding: 16px 16px 16px 48px; text-align: center; font-weight: 700; letter-spacing: 2px; }
        .input-icon { font-size: 1.4rem; }
        .checkin-btn { width: 100%; padding: 16px; font-size: 1.1rem; text-transform: uppercase; letter-spacing: 1px; font-weight: 800; margin-top: 16px; }
        .checkin-error { background: rgba(239, 68, 68, 0.1); color: var(--danger); padding: 12px; border-radius: var(--radius-md); margin-bottom: 20px; font-size: 0.9rem; display: flex; align-items: center; gap: 8px; text-align: left; }
        .checkin-success { display: flex; flex-direction: column; align-items: center; animation: slideUp 0.4s ease-out forwards; }
        .success-icon { font-size: 4rem; color: var(--success); margin-bottom: 16px; }
        .checkin-success h2 { font-size: 1.8rem; font-weight: 800; color: var(--text-primary); margin-bottom: 8px; }
        .checkin-success p { color: var(--text-secondary); font-size: 1.05rem; margin-bottom: 24px; }
        .queue-info { background: var(--bg-tertiary); padding: 24px; border-radius: var(--radius-lg); width: 100%; margin-bottom: 24px; display: flex; flex-direction: column; gap: 8px; border: 1px solid var(--border); }
        .queue-label { color: var(--text-muted); font-size: 0.9rem; text-transform: uppercase; font-weight: 600; letter-spacing: 1px; }
        .queue-number { font-size: 4rem; font-weight: 900; color: var(--primary-light); line-height: 1; }
        .queue-wait-message { font-weight: 600; color: var(--accent-light); }
      `}</style>
    </div>
  );
}
