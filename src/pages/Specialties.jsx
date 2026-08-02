import { useState, useEffect } from 'react';
import { specialtyService } from '../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiGrid } from 'react-icons/fi';

/**
 * Página de configuración de Especialidades Médicas.
 */
export default function Specialties() {
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', defaultSlotDuration: 30 });

  const fetch = async () => {
    setLoading(true);
    try { const { data } = await specialtyService.getAll(); setSpecialties(data.data); }
    catch { toast.error('Error cargando especialidades'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const openCreate = () => { setEditing(null); setForm({ name: '', description: '', defaultSlotDuration: 30 }); setShowModal(true); };
  const openEdit = (s) => { setEditing(s); setForm({ name: s.name, description: s.description || '', defaultSlotDuration: s.defaultSlotDuration }); setShowModal(true); };

  // Crear o actualizar especialidad
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return toast.error('El nombre es obligatorio');
    try {
      if (editing) { await specialtyService.update(editing._id, form); toast.success('Especialidad actualizada'); }
      else { await specialtyService.create(form); toast.success('Especialidad creada'); }
      setShowModal(false); fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Desactivar esta especialidad?')) return;
    try { await specialtyService.delete(id); toast.success('Especialidad desactivada'); fetch(); }
    catch { toast.error('Error'); }
  };

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Especialidades</h1><p className="page-subtitle">Administrar especialidades médicas</p></div>
        <button className="btn btn-primary" onClick={openCreate} id="new-specialty-btn"><FiPlus /> Nueva Especialidad</button>
      </div>

      {loading ? <div className="loading-container"><div className="spinner" /></div> : specialties.length === 0 ? (
        <div className="card"><div className="empty-state"><div className="empty-state-icon"><FiGrid /></div><p className="empty-state-text">No hay especialidades</p></div></div>
      ) : (
        <div className="spec-grid">
          {specialties.map(s => (
            <div className={`card card-hover ${!s.isActive ? 'inactive' : ''}`} key={s._id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{s.name}</h3>
                {!s.isActive && <span className="badge badge-cancelled">Inactiva</span>}
              </div>
              {s.description && <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 12 }}>{s.description}</p>}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600 }}>
                🕐 {s.defaultSlotDuration} min por turno
              </div>
              <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(s)} style={{ flex: 1 }}><FiEdit2 /> Editar</button>
                {s.isActive && <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(s._id)} style={{ color: 'var(--danger)' }}><FiTrash2 /></button>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editing ? 'Editar Especialidad' : 'Nueva Especialidad'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group"><label className="form-label">Nombre *</label><input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Descripción</label><textarea className="form-textarea" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Duración de turno (minutos)</label><input className="form-input" type="number" min={10} max={120} value={form.defaultSlotDuration} onChange={e => setForm(f => ({ ...f, defaultSlotDuration: Number(e.target.value) }))} /></div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Guardar' : 'Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .spec-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
        .inactive { opacity: 0.6; }
      `}</style>
    </div>
  );
}
