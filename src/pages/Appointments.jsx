import { useState, useEffect, useCallback } from 'react';
import { appointmentService, doctorService, patientService, specialtyService } from '../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiCalendar, FiSearch, FiFilter } from 'react-icons/fi';
import { format } from 'date-fns';

const STATUS = {
  scheduled: { label: 'Programado', cls: 'badge-scheduled' },
  confirmed: { label: 'Confirmado', cls: 'badge-confirmed' },
  'in-progress': { label: 'En curso', cls: 'badge-in-progress' },
  completed: { label: 'Completado', cls: 'badge-completed' },
  cancelled: { label: 'Cancelado', cls: 'badge-cancelled' },
  'no-show': { label: 'Ausente', cls: 'badge-no-show' },
};

const STATUS_ACTIONS = {
  scheduled: ['confirmed', 'cancelled'],
  confirmed: ['in-progress', 'cancelled', 'no-show'],
  'in-progress': ['completed'],
};

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterDate, setFilterDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [filterDoctor, setFilterDoctor] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // New appointment form
  const [patients, setPatients] = useState([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [newApt, setNewApt] = useState({ patient: '', doctor: '', specialty: '', date: format(new Date(), 'yyyy-MM-dd'), startTime: '', endTime: '', reason: '' });

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterDate) params.date = filterDate;
      if (filterDoctor) params.doctor = filterDoctor;
      if (filterStatus) params.status = filterStatus;
      const { data } = await appointmentService.getAll(params);
      setAppointments(data.data);
    } catch { toast.error('Error cargando turnos'); }
    finally { setLoading(false); }
  }, [filterDate, filterDoctor, filterStatus]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  useEffect(() => {
    Promise.all([doctorService.getAll({ active: 'true' }), specialtyService.getAll({ active: 'true' })])
      .then(([dRes, sRes]) => { setDoctors(dRes.data.data); setSpecialties(sRes.data.data); });
  }, []);

  // Search patients for modal
  useEffect(() => {
    if (patientSearch.length < 2) return;
    const t = setTimeout(() => {
      patientService.getAll({ search: patientSearch, limit: 8 }).then(r => setPatients(r.data.data));
    }, 300);
    return () => clearTimeout(t);
  }, [patientSearch]);

  // Fetch available slots when doctor + date selected
  useEffect(() => {
    if (!newApt.doctor || !newApt.date) return;
    appointmentService.getAvailableSlots({ doctorId: newApt.doctor, date: newApt.date })
      .then(r => setAvailableSlots(r.data.data))
      .catch(() => setAvailableSlots([]));
  }, [newApt.doctor, newApt.date]);

  const changeStatus = async (id, status) => {
    try {
      await appointmentService.updateStatus(id, status);
      toast.success(`Estado: ${STATUS[status]?.label}`);
      fetchAppointments();
    } catch { toast.error('Error actualizando estado'); }
  };

  const openCreate = () => {
    setNewApt({ patient: '', doctor: '', specialty: '', date: filterDate || format(new Date(), 'yyyy-MM-dd'), startTime: '', endTime: '', reason: '' });
    setPatients([]); setPatientSearch(''); setAvailableSlots([]);
    setShowModal(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newApt.patient || !newApt.doctor || !newApt.startTime) return toast.error('Complete paciente, médico y horario');
    try {
      await appointmentService.create(newApt);
      toast.success('Turno creado');
      setShowModal(false); fetchAppointments();
    } catch (err) { toast.error(err.response?.data?.message || 'Error creando turno'); }
  };

  const filteredDoctors = newApt.specialty ? doctors.filter(d => d.specialty?._id === newApt.specialty) : doctors;

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Turnos</h1><p className="page-subtitle">Gestión de turnos médicos</p></div>
        <button className="btn btn-primary" onClick={openCreate} id="new-appointment-btn"><FiPlus /> Nuevo Turno</button>
      </div>

      <div className="filters">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.85rem' }}><FiFilter /> Filtros:</div>
        <input className="form-input" type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={{ width: 170, minWidth: 'auto' }} id="filter-date" />
        <select className="form-select" value={filterDoctor} onChange={e => setFilterDoctor(e.target.value)} id="filter-doctor">
          <option value="">Todos los médicos</option>
          {doctors.map(d => <option key={d._id} value={d._id}>{d.user?.name}</option>)}
        </select>
        <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} id="filter-status">
          <option value="">Todos los estados</option>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {loading ? <div className="loading-container"><div className="spinner" /></div> : appointments.length === 0 ? (
        <div className="card"><div className="empty-state"><div className="empty-state-icon"><FiCalendar /></div><p className="empty-state-text">No hay turnos para los filtros seleccionados</p></div></div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead><tr><th>Hora</th><th>Paciente</th><th>Médico</th><th>Especialidad</th><th>Motivo</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              {appointments.map(a => (
                <tr key={a._id}>
                  <td style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{a.startTime} - {a.endTime}</td>
                  <td>{a.patient?.firstName} {a.patient?.lastName}<br /><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>DNI: {a.patient?.dni}</span></td>
                  <td>{a.doctor?.user?.name}</td>
                  <td>{a.doctor?.specialty?.name}</td>
                  <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>{a.reason || '—'}</td>
                  <td><span className={`badge ${STATUS[a.status]?.cls}`}>{STATUS[a.status]?.label}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {(STATUS_ACTIONS[a.status] || []).map(s => (
                        <button key={s} className={`btn btn-sm ${s === 'cancelled' || s === 'no-show' ? 'btn-ghost' : 'btn-ghost'}`}
                          onClick={() => changeStatus(a._id, s)}
                          style={s === 'cancelled' ? { color: 'var(--danger)', fontSize: '0.75rem' } : s === 'completed' ? { color: 'var(--success)', fontSize: '0.75rem' } : { fontSize: '0.75rem' }}>
                          {STATUS[s]?.label}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 580 }}>
            <div className="modal-header">
              <h2 className="modal-title">Nuevo Turno</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              {/* Patient search */}
              <div className="form-group">
                <label className="form-label">Paciente *</label>
                <div className="search-bar"><FiSearch className="search-bar-icon" /><input className="form-input" style={{ paddingLeft: 40 }} placeholder="Buscar por nombre o DNI..." value={patientSearch} onChange={e => { setPatientSearch(e.target.value); setNewApt(f => ({ ...f, patient: '' })); }} /></div>
                {patients.length > 0 && !newApt.patient && (
                  <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', marginTop: 4, maxHeight: 160, overflowY: 'auto' }}>
                    {patients.map(p => (
                      <div key={p._id} onClick={() => { setNewApt(f => ({ ...f, patient: p._id })); setPatientSearch(`${p.firstName} ${p.lastName} (${p.dni})`); setPatients([]); }}
                        style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '0.85rem', borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                        onMouseOver={e => e.currentTarget.style.background = 'var(--bg-tertiary)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                        <strong>{p.firstName} {p.lastName}</strong> — DNI: {p.dni}
                      </div>
                    ))}
                  </div>
                )}
                {newApt.patient && <p style={{ fontSize: '0.8rem', color: 'var(--success)', marginTop: 4 }}>✓ Paciente seleccionado</p>}
              </div>

              {/* Specialty + Doctor */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Especialidad</label>
                  <select className="form-select" value={newApt.specialty} onChange={e => setNewApt(f => ({ ...f, specialty: e.target.value, doctor: '' }))}>
                    <option value="">Todas</option>
                    {specialties.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Médico *</label>
                  <select className="form-select" value={newApt.doctor} onChange={e => setNewApt(f => ({ ...f, doctor: e.target.value }))}>
                    <option value="">Seleccionar...</option>
                    {filteredDoctors.map(d => <option key={d._id} value={d._id}>{d.user?.name} — {d.specialty?.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Date + Slot */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Fecha *</label>
                  <input className="form-input" type="date" value={newApt.date} onChange={e => setNewApt(f => ({ ...f, date: e.target.value, startTime: '', endTime: '' }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Horario * {availableSlots.length > 0 && `(${availableSlots.length} disponibles)`}</label>
                  <select className="form-select" value={newApt.startTime} onChange={e => {
                    const slot = availableSlots.find(s => s.startTime === e.target.value);
                    if (slot) setNewApt(f => ({ ...f, startTime: slot.startTime, endTime: slot.endTime }));
                  }}>
                    <option value="">Seleccionar horario...</option>
                    {availableSlots.map(s => <option key={s.startTime} value={s.startTime}>{s.startTime} - {s.endTime}</option>)}
                  </select>
                  {newApt.doctor && newApt.date && availableSlots.length === 0 && <p style={{ fontSize: '0.8rem', color: 'var(--warning)', marginTop: 4 }}>No hay horarios disponibles</p>}
                </div>
              </div>

              <div className="form-group"><label className="form-label">Motivo de consulta</label><input className="form-input" value={newApt.reason} onChange={e => setNewApt(f => ({ ...f, reason: e.target.value }))} placeholder="Ej: Control de rutina" /></div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Crear Turno</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
