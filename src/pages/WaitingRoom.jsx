import { useState, useEffect, useCallback, useRef } from 'react';
import { appointmentService } from '../services/api';
import toast from 'react-hot-toast';
import { FiClock, FiLogIn, FiPhone, FiCheckCircle, FiUser, FiActivity } from 'react-icons/fi';

const WR_STATUS = {
  waiting: { label: 'Esperando', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  'in-consultation': { label: 'En Consulta', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  attended: { label: 'Atendido', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
};

function TimeElapsed({ since, until }) {
  const [elapsed, setElapsed] = useState('');
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!since) { setElapsed(''); return; }
    const update = () => {
      const end = until ? new Date(until).getTime() : Date.now();
      const diff = Math.floor((end - new Date(since).getTime()) / 1000);
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      setElapsed(h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`);
    };
    update();
    if (!until) {
      intervalRef.current = setInterval(update, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [since, until]);

  return <span>{elapsed}</span>;
}

function getWaitClass(since, until) {
  if (!since) return '';
  const end = until ? new Date(until).getTime() : Date.now();
  const mins = (end - new Date(since).getTime()) / 60000;
  if (mins > 30) return 'wr-wait-danger';
  if (mins > 15) return 'wr-wait-warning';
  return 'wr-wait-ok';
}

export default function WaitingRoom() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const { data } = await appointmentService.getWaitingRoom();
      setAppointments(data.data);
    } catch { toast.error('Error cargando sala de espera'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh every 30s
  useEffect(() => {
    const t = setInterval(fetchData, 30000);
    return () => clearInterval(t);
  }, [fetchData]);

  const handleCheckin = async (id) => {
    try { await appointmentService.checkin(id); toast.success('Check-in realizado'); fetchData(); }
    catch { toast.error('Error en check-in'); }
  };
  const handleCall = async (id) => {
    try { await appointmentService.call(id); toast.success('Paciente llamado'); fetchData(); }
    catch { toast.error('Error llamando paciente'); }
  };
  const handleComplete = async (id) => {
    try { await appointmentService.completeVisit(id); toast.success('Visita completada'); fetchData(); }
    catch { toast.error('Error completando visita'); }
  };

  const pending = appointments.filter(a => !a.waitingRoom?.status);
  const waiting = appointments.filter(a => a.waitingRoom?.status === 'waiting');
  const inConsultation = appointments.filter(a => a.waitingRoom?.status === 'in-consultation');
  const attended = appointments.filter(a => a.waitingRoom?.status === 'attended');

  const renderCard = (apt, actions) => (
    <div className="wr-card card" key={apt._id}>
      <div className="wr-card-header">
        <div>
          <div className="wr-patient-name">{apt.patient?.firstName} {apt.patient?.lastName}</div>
          <div className="wr-patient-info">DNI: {apt.patient?.dni}{apt.patient?.medicalInsurance ? ` · ${apt.patient.medicalInsurance}` : ''}</div>
        </div>
        <div className="wr-time-badge">{apt.startTime}</div>
      </div>
      <div className="wr-card-meta">
        <span><FiUser style={{ marginRight: 4 }} />{apt.doctor?.user?.name}</span>
        <span>{apt.doctor?.specialty?.name}</span>
      </div>
      {apt.waitingRoom?.checkedInAt && (
        <div className={`wr-timer ${getWaitClass(apt.waitingRoom.checkedInAt, apt.waitingRoom.calledAt)}`}>
          <FiClock style={{ marginRight: 4 }} />
          Espera: <TimeElapsed since={apt.waitingRoom.checkedInAt} until={apt.waitingRoom.calledAt} />
        </div>
      )}
      {(apt.waitingRoom?.status === 'in-consultation' || apt.waitingRoom?.status === 'attended') && apt.waitingRoom?.calledAt && (
        <div className="wr-timer" style={{ color: 'var(--accent-light)' }}>
          <FiActivity style={{ marginRight: 4 }} />
          En consulta: <TimeElapsed since={apt.waitingRoom.calledAt} until={apt.waitingRoom.completedAt} />
        </div>
      )}
      <div className="wr-card-actions">{actions}</div>
    </div>
  );

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Sala de Espera</h1>
          <p className="page-subtitle">Gestión de pacientes en tiempo real — {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <div className="wr-stats-row">
          <div className="wr-stat"><span className="wr-stat-num" style={{ color: 'var(--text-muted)' }}>{pending.length}</span><span className="wr-stat-label">Sin check-in</span></div>
          <div className="wr-stat"><span className="wr-stat-num" style={{ color: '#f59e0b' }}>{waiting.length}</span><span className="wr-stat-label">Esperando</span></div>
          <div className="wr-stat"><span className="wr-stat-num" style={{ color: '#8b5cf6' }}>{inConsultation.length}</span><span className="wr-stat-label">En consulta</span></div>
          <div className="wr-stat"><span className="wr-stat-num" style={{ color: '#10b981' }}>{attended.length}</span><span className="wr-stat-label">Atendidos</span></div>
        </div>
      </div>

      {loading ? <div className="loading-container"><div className="spinner" /></div> : (
        <div className="wr-kanban">
          {/* Pending check-in */}
          <div className="wr-column">
            <div className="wr-column-header" style={{ borderColor: 'var(--text-muted)' }}>
              <FiLogIn /> Sin Check-in <span className="wr-count">{pending.length}</span>
            </div>
            {pending.length === 0 ? <div className="wr-empty">Sin turnos pendientes</div> : pending.map(a => renderCard(a,
              <button className="btn btn-sm btn-primary" onClick={() => handleCheckin(a._id)}><FiLogIn /> Check-in</button>
            ))}
          </div>

          {/* Waiting */}
          <div className="wr-column">
            <div className="wr-column-header" style={{ borderColor: '#f59e0b' }}>
              <FiClock /> Esperando <span className="wr-count">{waiting.length}</span>
            </div>
            {waiting.length === 0 ? <div className="wr-empty">Nadie esperando</div> : waiting.map(a => renderCard(a,
              <button className="btn btn-sm btn-accent" onClick={() => handleCall(a._id)}><FiPhone /> Llamar</button>
            ))}
          </div>

          {/* In Consultation */}
          <div className="wr-column">
            <div className="wr-column-header" style={{ borderColor: '#8b5cf6' }}>
              <FiActivity /> En Consulta <span className="wr-count">{inConsultation.length}</span>
            </div>
            {inConsultation.length === 0 ? <div className="wr-empty">Nadie en consulta</div> : inConsultation.map(a => renderCard(a,
              <button className="btn btn-sm btn-success" onClick={() => handleComplete(a._id)}><FiCheckCircle /> Completar</button>
            ))}
          </div>

          {/* Attended */}
          <div className="wr-column">
            <div className="wr-column-header" style={{ borderColor: '#10b981' }}>
              <FiCheckCircle /> Atendidos <span className="wr-count">{attended.length}</span>
            </div>
            {attended.length === 0 ? <div className="wr-empty">Sin atendidos aún</div> : attended.map(a => renderCard(a, null))}
          </div>
        </div>
      )}

      <style>{`
        .wr-stats-row { display: flex; gap: 16px; }
        .wr-stat { display: flex; flex-direction: column; align-items: center; gap: 2px; }
        .wr-stat-num { font-size: 1.5rem; font-weight: 800; line-height: 1; }
        .wr-stat-label { font-size: 0.7rem; color: var(--text-muted); font-weight: 500; }
        .wr-kanban { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; align-items: flex-start; }
        .wr-column { background: rgba(15,23,42,0.4); border-radius: var(--radius-lg); padding: 12px; min-height: 200px; }
        .wr-column-header { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; font-weight: 700; padding: 8px 12px; border-bottom: 3px solid; margin-bottom: 12px; color: var(--text-primary); }
        .wr-count { background: var(--bg-tertiary); border-radius: var(--radius-full); padding: 2px 8px; font-size: 0.75rem; margin-left: auto; }
        .wr-empty { text-align: center; color: var(--text-muted); font-size: 0.82rem; padding: 24px 8px; }
        .wr-card { padding: 14px; margin-bottom: 10px; }
        .wr-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
        .wr-patient-name { font-weight: 700; font-size: 0.92rem; }
        .wr-patient-info { font-size: 0.75rem; color: var(--text-muted); margin-top: 2px; }
        .wr-time-badge { background: var(--bg-tertiary); padding: 3px 10px; border-radius: var(--radius-full); font-size: 0.78rem; font-weight: 700; color: var(--primary-light); white-space: nowrap; }
        .wr-card-meta { display: flex; gap: 12px; font-size: 0.78rem; color: var(--text-secondary); margin-bottom: 8px; align-items: center; }
        .wr-timer { font-size: 0.8rem; font-weight: 600; display: flex; align-items: center; padding: 4px 0; }
        .wr-wait-ok { color: var(--success); }
        .wr-wait-warning { color: var(--warning); }
        .wr-wait-danger { color: var(--danger); animation: pulse 2s infinite; }
        .wr-card-actions { margin-top: 10px; display: flex; gap: 6px; }
        @media (max-width: 1024px) { .wr-kanban { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) { .wr-kanban { grid-template-columns: 1fr; } .wr-stats-row { flex-wrap: wrap; } }
      `}</style>
    </div>
  );
}
