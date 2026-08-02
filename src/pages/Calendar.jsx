import { useState, useEffect, useCallback, useRef } from 'react';
import { appointmentService, doctorService } from '../services/api';
import toast from 'react-hot-toast';
import { FiChevronLeft, FiChevronRight, FiFilter, FiCalendar, FiClock, FiUser, FiX } from 'react-icons/fi';
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, isToday } from 'date-fns';
import { es } from 'date-fns/locale';

const STATUS = {
  scheduled: { label: 'Programado', color: '#3b82f6', bg: 'rgba(59,130,246,0.18)' },
  confirmed: { label: 'Confirmado', color: '#10b981', bg: 'rgba(16,185,129,0.18)' },
  'in-progress': { label: 'En curso', color: '#f59e0b', bg: 'rgba(245,158,11,0.18)' },
  completed: { label: 'Completado', color: '#10b981', bg: 'rgba(16,185,129,0.25)' },
  cancelled: { label: 'Cancelado', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  'no-show': { label: 'Ausente', color: '#94a3b8', bg: 'rgba(100,116,139,0.18)' },
};

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 07:00 - 20:00

function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Vista de Calendario semanal.
 * Muestra los turnos en un grid de tiempo con navegación por semanas.
 */
export default function Calendar() {
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [filterDoctor, setFilterDoctor] = useState('');
  const [loading, setLoading] = useState(true);
  const [popover, setPopover] = useState(null);
  const gridRef = useRef(null);

  const days = Array.from({ length: 6 }, (_, i) => addDays(currentWeek, i)); // Lun-Sáb

  // Carga los turnos para la semana actualmente visible
  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const startDate = format(days[0], 'yyyy-MM-dd');
      const endDate = format(days[5], 'yyyy-MM-dd');
      const params = { startDate, endDate };
      if (filterDoctor) params.doctor = filterDoctor;
      const { data } = await appointmentService.getAll(params);
      setAppointments(data.data);
    } catch { toast.error('Error cargando turnos'); }
    finally { setLoading(false); }
  }, [currentWeek, filterDoctor]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  useEffect(() => {
    doctorService.getAll({ active: 'true' }).then(r => setDoctors(r.data.data)).catch(() => {});
  }, []);

  // Scroll to current hour on mount
  useEffect(() => {
    if (gridRef.current) {
      const now = new Date();
      const scrollTo = Math.max(0, (now.getHours() - 8) * 64);
      gridRef.current.scrollTop = scrollTo;
    }
  }, [loading]);

  const prevWeek = () => setCurrentWeek(w => subWeeks(w, 1));
  const nextWeek = () => setCurrentWeek(w => addWeeks(w, 1));
  const goToday = () => setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }));

  // Filtra los turnos de la semana para asignar a una columna de día específico
  const getAppointmentsForDay = (day) => {
    return appointments.filter(a => {
      // a.date comes as ISO string, e.g. "2026-07-29T00:00:00.000Z"
      // Compare the YYYY-MM-DD part directly to avoid timezone shift
      return a.date.substring(0, 10) === format(day, 'yyyy-MM-dd');
    });
  };

  const weekLabel = `${format(days[0], "d 'de' MMMM", { locale: es })} — ${format(days[5], "d 'de' MMMM, yyyy", { locale: es })}`;

  // Cambia el estado de un turno desde el popover del calendario
  const changeStatus = async (id, status) => {
    try {
      await appointmentService.updateStatus(id, status);
      toast.success(`Estado: ${STATUS[status]?.label}`);
      setPopover(null);
      fetchAppointments();
    } catch { toast.error('Error actualizando estado'); }
  };

  const STATUS_ACTIONS = {
    scheduled: ['confirmed', 'cancelled'],
    confirmed: ['in-progress', 'cancelled', 'no-show'],
    'in-progress': ['completed'],
  };

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Calendario</h1>
          <p className="page-subtitle">{weekLabel}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select className="form-select" value={filterDoctor} onChange={e => setFilterDoctor(e.target.value)} style={{ width: 'auto', minWidth: 180, padding: '8px 32px 8px 12px', fontSize: '0.85rem' }}>
            <option value="">Todos los médicos</option>
            {doctors.map(d => <option key={d._id} value={d._id}>{d.user?.name}</option>)}
          </select>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="cal-nav">
        <button className="btn btn-ghost btn-sm" onClick={prevWeek}><FiChevronLeft /></button>
        <button className="btn btn-ghost btn-sm" onClick={goToday}><FiCalendar style={{ marginRight: 4 }} /> Hoy</button>
        <button className="btn btn-ghost btn-sm" onClick={nextWeek}><FiChevronRight /></button>
      </div>

      {loading ? <div className="loading-container"><div className="spinner" /></div> : (
        <div className="cal-wrapper">
          {/* Header row with day names */}
          <div className="cal-header">
            <div className="cal-time-gutter-header" />
            {days.map(day => (
              <div key={day.toISOString()} className={`cal-day-header ${isToday(day) ? 'cal-today' : ''}`}>
                <span className="cal-day-name">{format(day, 'EEE', { locale: es })}</span>
                <span className={`cal-day-number ${isToday(day) ? 'cal-today-number' : ''}`}>{format(day, 'd')}</span>
              </div>
            ))}
          </div>

          {/* Time grid */}
          <div className="cal-grid" ref={gridRef}>
            <div className="cal-grid-inner">
              {/* Time labels */}
              <div className="cal-time-gutter">
                {HOURS.map(h => (
                  <div key={h} className="cal-time-label">
                    {String(h).padStart(2, '0')}:00
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {days.map(day => {
                const dayApts = getAppointmentsForDay(day);
                return (
                  <div key={day.toISOString()} className={`cal-day-col ${isToday(day) ? 'cal-today-col' : ''}`}>
                    {/* Hour lines */}
                    {HOURS.map(h => (
                      <div key={h} className="cal-hour-cell" />
                    ))}

                    {/* Current time indicator */}
                    {isToday(day) && (() => {
                      const now = new Date();
                      const mins = now.getHours() * 60 + now.getMinutes();
                      const top = ((mins - 7 * 60) / 60) * 64;
                      if (top < 0 || top > 14 * 64) return null;
                      return <div className="cal-now-line" style={{ top }} />;
                    })()}

                    {/* Appointment blocks */}
                    {dayApts.map(apt => {
                      const startMin = timeToMinutes(apt.startTime);
                      const endMin = timeToMinutes(apt.endTime);
                      const top = ((startMin - 7 * 60) / 60) * 64;
                      const height = Math.max(((endMin - startMin) / 60) * 64 - 2, 20);
                      const st = STATUS[apt.status] || STATUS.scheduled;

                      return (
                        <div
                          key={apt._id}
                          className="cal-event"
                          style={{ top, height, background: st.bg, borderLeft: `3px solid ${st.color}`, color: st.color }}
                          onClick={(e) => { e.stopPropagation(); setPopover(popover?._id === apt._id ? null : apt); }}
                          title={`${apt.patient?.firstName} ${apt.patient?.lastName} — ${apt.doctor?.user?.name}`}
                        >
                          <div className="cal-event-time">{apt.startTime}–{apt.endTime}</div>
                          <div className="cal-event-name">{apt.patient?.firstName} {apt.patient?.lastName}</div>
                          {height > 40 && <div className="cal-event-doctor">{apt.doctor?.user?.name}</div>}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Popover for appointment details */}
      {popover && (
        <div className="cal-popover-overlay" onClick={() => setPopover(null)}>
          <div className="cal-popover card" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <span className="badge" style={{ background: STATUS[popover.status]?.bg, color: STATUS[popover.status]?.color, marginBottom: 8 }}>{STATUS[popover.status]?.label}</span>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: 6 }}>{popover.patient?.firstName} {popover.patient?.lastName}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>DNI: {popover.patient?.dni}</p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setPopover(null)}><FiX /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FiClock />{popover.startTime} — {popover.endTime}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FiUser />{popover.doctor?.user?.name} · {popover.doctor?.specialty?.name}</div>
              {popover.reason && <div style={{ marginTop: 4, color: 'var(--text-muted)' }}>Motivo: {popover.reason}</div>}
            </div>
            {(STATUS_ACTIONS[popover.status] || []).length > 0 && (
              <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
                {(STATUS_ACTIONS[popover.status] || []).map(s => (
                  <button key={s} className="btn btn-sm" onClick={() => changeStatus(popover._id, s)}
                    style={{ background: STATUS[s]?.bg, color: STATUS[s]?.color, border: `1px solid ${STATUS[s]?.color}33`, fontSize: '0.78rem' }}>
                    {STATUS[s]?.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .cal-nav { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
        .cal-wrapper { border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; background: var(--bg-card); }
        .cal-header { display: grid; grid-template-columns: 60px repeat(6, 1fr); border-bottom: 1px solid var(--border); }
        .cal-time-gutter-header { background: var(--bg-secondary); }
        .cal-day-header { display: flex; flex-direction: column; align-items: center; padding: 10px 4px; background: var(--bg-secondary); border-left: 1px solid var(--border); gap: 2px; }
        .cal-day-name { font-size: 0.72rem; font-weight: 600; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px; }
        .cal-day-number { font-size: 1.1rem; font-weight: 700; color: var(--text-primary); }
        .cal-today .cal-day-name { color: var(--primary-light); }
        .cal-today-number { background: var(--primary); color: white !important; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.95rem; }
        .cal-grid { max-height: 520px; overflow-y: auto; }
        .cal-grid-inner { display: grid; grid-template-columns: 60px repeat(6, 1fr); position: relative; }
        .cal-time-gutter { display: flex; flex-direction: column; }
        .cal-time-label { height: 64px; display: flex; align-items: flex-start; justify-content: flex-end; padding: 0 8px; font-size: 0.72rem; color: var(--text-muted); font-weight: 500; padding-top: 2px; }
        .cal-day-col { position: relative; border-left: 1px solid var(--border); }
        .cal-today-col { background: rgba(6,182,212,0.03); }
        .cal-hour-cell { height: 64px; border-bottom: 1px solid var(--border); }
        .cal-hour-cell:last-child { border-bottom: none; }
        .cal-now-line { position: absolute; left: 0; right: 0; height: 2px; background: var(--danger); z-index: 5; pointer-events: none; }
        .cal-now-line::before { content: ''; position: absolute; left: -4px; top: -4px; width: 10px; height: 10px; background: var(--danger); border-radius: 50%; }
        .cal-event { position: absolute; left: 3px; right: 3px; border-radius: 6px; padding: 3px 6px; cursor: pointer; overflow: hidden; z-index: 2; font-size: 0.75rem; transition: all 0.15s ease; }
        .cal-event:hover { filter: brightness(1.3); transform: scale(1.02); z-index: 10; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
        .cal-event-time { font-weight: 700; font-size: 0.7rem; opacity: 0.9; }
        .cal-event-name { font-weight: 600; font-size: 0.75rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .cal-event-doctor { font-size: 0.68rem; opacity: 0.75; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .cal-popover-overlay { position: fixed; inset: 0; z-index: 100; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.4); backdrop-filter: blur(2px); animation: fadeIn 0.15s; }
        .cal-popover { min-width: 280px; max-width: 90vw; width: 100%; animation: scaleIn 0.2s ease-out; }
        @media (max-width: 768px) {
          .cal-header, .cal-grid-inner { grid-template-columns: 40px repeat(6, 1fr); }
          .cal-time-label { font-size: 0.65rem; padding-right: 4px; }
          .cal-event { font-size: 0.65rem; }
        }
      `}</style>
    </div>
  );
}
