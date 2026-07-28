import { useState, useEffect, useCallback } from 'react';
import { patientService } from '../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiUser, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', dni: '', email: '', phone: '', dateOfBirth: '', address: '', medicalInsurance: '', insuranceNumber: '', notes: '' });

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await patientService.getAll({ search, page, limit: 15 });
      setPatients(data.data);
      setTotalPages(data.pages || 1);
    } catch { toast.error('Error cargando pacientes'); }
    finally { setLoading(false); }
  }, [search, page]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);
  useEffect(() => { setPage(1); }, [search]);

  const openCreate = () => { setEditing(null); setForm({ firstName: '', lastName: '', dni: '', email: '', phone: '', dateOfBirth: '', address: '', medicalInsurance: '', insuranceNumber: '', notes: '' }); setShowModal(true); };
  const openEdit = (p) => { setEditing(p); setForm({ firstName: p.firstName, lastName: p.lastName, dni: p.dni, email: p.email || '', phone: p.phone || '', dateOfBirth: p.dateOfBirth ? p.dateOfBirth.split('T')[0] : '', address: p.address || '', medicalInsurance: p.medicalInsurance || '', insuranceNumber: p.insuranceNumber || '', notes: p.notes || '' }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.dni) return toast.error('Nombre, apellido y DNI son obligatorios');
    try {
      if (editing) { await patientService.update(editing._id, form); toast.success('Paciente actualizado'); }
      else { await patientService.create(form); toast.success('Paciente creado'); }
      setShowModal(false); fetchPatients();
    } catch (err) { toast.error(err.response?.data?.message || 'Error guardando paciente'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este paciente?')) return;
    try { await patientService.delete(id); toast.success('Paciente eliminado'); fetchPatients(); }
    catch { toast.error('Error eliminando paciente'); }
  };

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Pacientes</h1><p className="page-subtitle">Gestión de pacientes de la clínica</p></div>
        <button className="btn btn-primary" onClick={openCreate} id="new-patient-btn"><FiPlus /> Nuevo Paciente</button>
      </div>

      <div className="filters">
        <div className="search-bar">
          <FiSearch className="search-bar-icon" />
          <input className="form-input" placeholder="Buscar por nombre, DNI u obra social..." value={search} onChange={e => setSearch(e.target.value)} id="patient-search" />
        </div>
      </div>

      {loading ? <div className="loading-container"><div className="spinner" /></div> : patients.length === 0 ? (
        <div className="card"><div className="empty-state"><div className="empty-state-icon"><FiUser /></div><p className="empty-state-text">No se encontraron pacientes</p></div></div>
      ) : (
        <>
          <div className="table-container">
            <table className="table">
              <thead><tr><th>Paciente</th><th>DNI</th><th>Teléfono</th><th>Obra Social</th><th>Email</th><th>Acciones</th></tr></thead>
              <tbody>
                {patients.map(p => (
                  <tr key={p._id}>
                    <td style={{ fontWeight: 600 }}>{p.firstName} {p.lastName}</td>
                    <td>{p.dni}</td>
                    <td>{p.phone || '—'}</td>
                    <td>{p.medicalInsurance || '—'}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{p.email || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)} title="Editar"><FiEdit2 /></button>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(p._id)} title="Eliminar" style={{ color: 'var(--danger)' }}><FiTrash2 /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="pagination">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><FiChevronLeft /></button>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Página {page} de {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}><FiChevronRight /></button>
            </div>
          )}
        </>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editing ? 'Editar Paciente' : 'Nuevo Paciente'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Nombre *</label><input className="form-input" value={form.firstName} onChange={e => setField('firstName', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Apellido *</label><input className="form-input" value={form.lastName} onChange={e => setField('lastName', e.target.value)} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">DNI *</label><input className="form-input" value={form.dni} onChange={e => setField('dni', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Teléfono</label><input className="form-input" value={form.phone} onChange={e => setField('phone', e.target.value)} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={form.email} onChange={e => setField('email', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Fecha de Nacimiento</label><input className="form-input" type="date" value={form.dateOfBirth} onChange={e => setField('dateOfBirth', e.target.value)} /></div>
              </div>
              <div className="form-group"><label className="form-label">Dirección</label><input className="form-input" value={form.address} onChange={e => setField('address', e.target.value)} /></div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Obra Social</label><input className="form-input" value={form.medicalInsurance} onChange={e => setField('medicalInsurance', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Nº Afiliado</label><input className="form-input" value={form.insuranceNumber} onChange={e => setField('insuranceNumber', e.target.value)} /></div>
              </div>
              <div className="form-group"><label className="form-label">Notas</label><textarea className="form-textarea" value={form.notes} onChange={e => setField('notes', e.target.value)} /></div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Guardar Cambios' : 'Crear Paciente'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
