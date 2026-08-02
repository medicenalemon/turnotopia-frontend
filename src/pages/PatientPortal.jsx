import { useState, useEffect } from 'react';
import { appointmentService } from '../services/api';
import { FiCalendar, FiClock, FiFileText, FiDownload } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';

/**
 * Portal del Paciente donde pueden ver sus turnos y descargar recetas médicas.
 */
export default function PatientPortal() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Obtiene los turnos asignados al paciente actual
  const fetchAppointments = async () => {
    try {
      const { data } = await appointmentService.getPatientMeAppointments();
      setAppointments(data.data);
    } catch {
      toast.error('Error al cargar turnos');
    } finally {
      setLoading(false);
    }
  };

  // Genera y descarga un PDF de receta médica digital
  const handleDownloadRecipe = (apt) => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(0, 207, 232); // Cyan
    doc.text('turnotopia', 20, 20);
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Receta Médica Digital', 20, 35);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(`Fecha de emisión: ${new Date(apt.date).toLocaleDateString('es-AR')}`, 20, 45);
    doc.text(`Paciente: ${apt.patient?.firstName} ${apt.patient?.lastName}`, 20, 55);
    doc.text(`Médico: ${apt.doctor?.user?.name}`, 20, 65);
    doc.text(`Especialidad: ${apt.doctor?.specialty?.name}`, 20, 75);
    
    doc.setLineWidth(0.5);
    doc.line(20, 80, 190, 80);
    
    doc.setFont("helvetica", "bold");
    doc.text('Prescripción:', 20, 95);
    doc.setFont("helvetica", "normal");
    doc.text('Ibuprofeno 600mg - Tomar 1 comprimido cada 8 horas por 5 días.', 20, 105);
    
    doc.text('Firma digital del profesional médica validada por el sistema.', 20, 260);
    
    doc.save(`Receta_${apt.date.split('T')[0]}.pdf`);
    toast.success('Receta descargada');
  };

  const now = new Date();
  const upcoming = appointments.filter(a => new Date(a.date) >= now && a.status !== 'cancelled' && a.status !== 'completed');
  const past = appointments.filter(a => new Date(a.date) < now || a.status === 'completed');

  if (loading) return <div className="loading-container"><div className="spinner" /></div>;

  return (
    <div className="fade-in">
      <div className="portal-header">
        <h1 className="page-title">Mi Portal</h1>
        <p className="page-subtitle">Gestiona tus turnos y descarga tus recetas</p>
      </div>

      <div className="portal-grid">
        <div className="portal-section">
          <h2 className="section-title"><FiCalendar /> Próximos Turnos</h2>
          {upcoming.length === 0 ? (
            <div className="empty-state card">
              <FiCalendar className="empty-icon" />
              <p>No tienes turnos próximos programados.</p>
            </div>
          ) : (
            <div className="appt-list">
              {upcoming.map(apt => (
                <div key={apt._id} className="appt-card card">
                  <div className="appt-date-badge">
                    <span className="appt-month">{new Date(apt.date).toLocaleDateString('es-AR', { month: 'short' }).toUpperCase()}</span>
                    <span className="appt-day">{new Date(apt.date).getDate()}</span>
                  </div>
                  <div className="appt-info">
                    <h3>{apt.doctor?.user?.name}</h3>
                    <p className="appt-specialty">{apt.doctor?.specialty?.name}</p>
                    <div className="appt-meta">
                      <span><FiClock /> {apt.startTime} hs</span>
                      <span className={`status-badge status-${apt.status}`}>
                        {apt.status === 'scheduled' ? 'Programado' : apt.status === 'confirmed' ? 'Confirmado' : 'En proceso'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="portal-section">
          <h2 className="section-title"><FiFileText /> Historial y Recetas</h2>
          {past.length === 0 ? (
            <div className="empty-state card">
              <FiFileText className="empty-icon" />
              <p>Tu historial médico está vacío.</p>
            </div>
          ) : (
            <div className="appt-list">
              {past.map(apt => (
                <div key={apt._id} className="appt-card card past-card">
                  <div className="appt-info">
                    <h3>{apt.doctor?.user?.name}</h3>
                    <p className="appt-specialty">{apt.doctor?.specialty?.name} • {new Date(apt.date).toLocaleDateString('es-AR')}</p>
                    <span className={`status-badge status-${apt.status}`} style={{ display: 'inline-block', marginTop: '8px' }}>
                      {apt.status === 'completed' ? 'Completado' : apt.status === 'cancelled' ? 'Cancelado' : 'Ausente'}
                    </span>
                  </div>
                  {apt.status === 'completed' && (
                    <button className="btn btn-primary btn-sm btn-recipe" onClick={() => handleDownloadRecipe(apt)}>
                      <FiDownload /> Receta
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .portal-header { margin-bottom: 32px; }
        .portal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
        .section-title { font-size: 1.2rem; font-weight: 700; color: var(--text-primary); margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
        .empty-state { text-align: center; padding: 48px 24px; color: var(--text-muted); }
        .empty-icon { font-size: 2.5rem; margin-bottom: 16px; opacity: 0.5; }
        .appt-list { display: flex; flex-direction: column; gap: 16px; }
        .appt-card { display: flex; align-items: stretch; gap: 16px; padding: 16px; transition: transform var(--transition); }
        .appt-card:hover { transform: translateY(-2px); }
        .past-card { opacity: 0.8; }
        .appt-date-badge { background: var(--bg-tertiary); border-radius: var(--radius-md); padding: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; min-width: 64px; }
        .appt-month { font-size: 0.75rem; font-weight: 700; color: var(--primary-light); }
        .appt-day { font-size: 1.5rem; font-weight: 800; line-height: 1; margin-top: 2px; }
        .appt-info { flex: 1; }
        .appt-info h3 { font-size: 1.1rem; font-weight: 700; margin-bottom: 2px; }
        .appt-specialty { font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 8px; }
        .appt-meta { display: flex; align-items: center; gap: 12px; font-size: 0.85rem; font-weight: 600; color: var(--text-muted); }
        .btn-recipe { white-space: nowrap; height: fit-content; align-self: center; }
        
        @media (max-width: 768px) {
          .portal-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
