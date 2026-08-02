import { useState, useEffect } from 'react';
import { doctorService, specialtyService } from '../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiUserPlus } from 'react-icons/fi';

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

/**
 * Página de gestión de Médicos (Staff).
 * Permite listar, crear y configurar médicos y sus horarios de atención.
 */
export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', specialty: '', licenseNumber: '', phone: '', schedule: [] });
  const [filterSpec, setFilterSpec] = useState('');

  // Carga la lista de médicos y especialidades
  const fetchData = async () => {
    setLoading(true);
    try {
      const [docRes, specRes] = await Promise.all([doctorService.getAll(filterSpec ? { specialty: filterSpec } : {}), specialtyService.getAll({ active: 'true' })]);
      setDoctors(docRes.data.data);
      setSpecialties(specRes.data.data);
    } catch { toast.error('Error cargando datos'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [filterSpec]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', email: '', password: 'doctor123', specialty: specialties[0]?._id || '', licenseNumber: '', phone: '', schedule: [] });
    setShowModal(true);
  };

  const openEdit = (d) => {
    setEditing(d);
    setForm({ name: d.user?.name || '', email: d.user?.email || '', password: '', specialty: d.specialty?._id || '', licenseNumber: d.licenseNumber, phone: d.phone || '', schedule: d.schedule || [] });
    setShowModal(true);
  };

  const addScheduleDay = () => {
    setForm(f => ({ ...f, schedule: [...f.schedule, { dayOfWeek: 1, startTime: '08:00', endTime: '17:00', slotDuration: 30 }] }));
  };

  // Actualiza una propiedad de un bloque horario específico (ej. cambiar día o duración)
  const updateSchedule = (idx, field, value) => {
    setForm(f => {
      const s = [...f.schedule];
      s[idx] = { ...s[idx], [field]: field === 'dayOfWeek' || field === 'slotDuration' ? Number(value) : value };
      return { ...f, schedule: s };
    });
  };

  const removeSchedule = (idx) => { setForm(f => ({ ...f, schedule: f.schedule.filter((_, i) => i !== idx) })); };

  // Maneja la creación o actualización de un médico (CRUD)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.specialty || !form.licenseNumber) return toast.error('Complete los campos obligatorios');
    try {
      if (editing) { await doctorService.update(editing._id, form); toast.success('Médico actualizado'); }
      else {
        if (!form.email) return toast.error('El email es obligatorio');
        await doctorService.create(form); toast.success('Médico creado');
      }
      setShowModal(false); fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Error guardando médico'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Desactivar este médico?')) return;
    try { await doctorService.delete(id); toast.success('Médico desactivado'); fetchData(); }
    catch { toast.error('Error desactivando médico'); }
  };

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Médicos</h1><p className="page-subtitle">Gestión del equipo médico</p></div>
        <button className="btn btn-primary" onClick={openCreate} id="new-doctor-btn"><FiPlus /> Nuevo Médico</button>
      </div>

      <div className="filters">
        <select className="form-select" value={filterSpec} onChange={e => setFilterSpec(e.target.value)} id="doctor-specialty-filter">
          <option value="">Todas las especialidades</option>
          {specialties.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
      </div>

      {loading ? <div className="loading-container"><div className="spinner" /></div> : doctors.length === 0 ? (
        <div className="card"><div className="empty-state"><div className="empty-state-icon"><FiUserPlus /></div><p className="empty-state-text">No hay médicos registrados</p></div></div>
      ) : (
        <div className="doctors-grid">
          {doctors.map(d => (
            <div className="card card-hover" key={d._id} style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-full)', background: 'linear-gradient(135deg, var(--primary-dark), var(--accent-dark))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem', color: 'white', flexShrink: 0 }}>
                  {d.user?.name?.charAt(0)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{d.user?.name}</div>
                  <div style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 500 }}>{d.specialty?.name}</div>
                </div>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div>📋 Matrícula: <strong>{d.licenseNumber}</strong></div>
                {d.phone && <div>📱 {d.phone}</div>}
                {d.schedule?.length > 0 && <div>📅 {d.schedule.map(s => DAYS[s.dayOfWeek]?.substring(0, 3)).join(', ')}</div>}
              </div>
              {!d.isActive && <span className="badge badge-cancelled" style={{ position: 'absolute', top: 12, right: 12 }}>Inactivo</span>}
              <div style={{ display: 'flex', gap: 8, marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(d)} style={{ flex: 1 }}><FiEdit2 /> Editar</button>
                <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(d._id)} style={{ color: 'var(--danger)' }}><FiTrash2 /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 620 }}>
            <div className="modal-header">
              <h2 className="modal-title">{editing ? 'Editar Médico' : 'Nuevo Médico'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Nombre completo *</label><input className="form-input" value={form.name} onChange={e => setField('name', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Email *</label><input className="form-input" type="email" value={form.email} onChange={e => setField('email', e.target.value)} disabled={!!editing} /></div>
              </div>
              {!editing && <div className="form-group"><label className="form-label">Contraseña</label><input className="form-input" type="password" value={form.password} onChange={e => setField('password', e.target.value)} placeholder="doctor123" /></div>}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Especialidad *</label>
                  <select className="form-select" value={form.specialty} onChange={e => setField('specialty', e.target.value)}>
                    <option value="">Seleccionar...</option>
                    {specialties.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Matrícula *</label><input className="form-input" value={form.licenseNumber} onChange={e => setField('licenseNumber', e.target.value)} /></div>
              </div>
              <div className="form-group"><label className="form-label">Teléfono</label><input className="form-input" value={form.phone} onChange={e => setField('phone', e.target.value)} /></div>

              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <label className="form-label" style={{ margin: 0 }}>Horarios de atención</label>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={addScheduleDay}><FiPlus /> Agregar día</button>
                </div>
                {form.schedule.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <select className="form-select" value={s.dayOfWeek} onChange={e => updateSchedule(i, 'dayOfWeek', e.target.value)} style={{ width: 120, minWidth: 'auto' }}>
                      {DAYS.map((d, di) => <option key={di} value={di}>{d}</option>)}
                    </select>
                    <input className="form-input" type="time" value={s.startTime} onChange={e => updateSchedule(i, 'startTime', e.target.value)} style={{ width: 110 }} />
                    <span style={{ color: 'var(--text-muted)' }}>a</span>
                    <input className="form-input" type="time" value={s.endTime} onChange={e => updateSchedule(i, 'endTime', e.target.value)} style={{ width: 110 }} />
                    <input className="form-input" type="number" value={s.slotDuration} onChange={e => updateSchedule(i, 'slotDuration', e.target.value)} style={{ width: 70 }} min={10} max={120} title="Duración del turno (min)" />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>min</span>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeSchedule(i)} style={{ color: 'var(--danger)', padding: 4 }}>✕</button>
                  </div>
                ))}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Guardar' : 'Crear Médico'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .doctors-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
      `}</style>
    </div>
  );
}
