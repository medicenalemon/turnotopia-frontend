import { useState, useEffect, useCallback } from 'react';
import { patientService, medicalRecordService, doctorService } from '../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiFileText, FiArrowLeft, FiActivity, FiCalendar, FiUser, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const typeLabels = {
  'consultation': 'Consulta',
  'follow-up': 'Seguimiento',
  'emergency': 'Urgencia',
  'lab-results': 'Resultados Lab.',
  'prescription': 'Receta',
  'other': 'Otro'
};

const typeColors = {
  'consultation': '#06b6d4',
  'follow-up': '#8b5cf6',
  'emergency': '#ef4444',
  'lab-results': '#f59e0b',
  'prescription': '#10b981',
  'other': '#6b7280'
};

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function MedicalRecords() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingPatients, setLoadingPatients] = useState(true);

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [records, setRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  const [doctors, setDoctors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ doctor: '', date: new Date().toISOString().split('T')[0], type: 'consultation', diagnosis: '', symptoms: '', treatment: '', prescriptions: '', notes: '', bloodPressure: '', temperature: '', weight: '', height: '', heartRate: '' });

  const fetchPatients = useCallback(async () => {
    setLoadingPatients(true);
    try {
      const { data } = await patientService.getAll({ search, page, limit: 10 });
      setPatients(data.data);
      setTotalPages(data.pages || 1);
    } catch { toast.error('Error cargando pacientes'); }
    finally { setLoadingPatients(false); }
  }, [search, page]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);
  useEffect(() => { setPage(1); }, [search]);

  const fetchRecords = async (patientId) => {
    setLoadingRecords(true);
    try {
      const { data } = await medicalRecordService.getByPatient(patientId);
      setRecords(data.data);
      setSelectedPatient(data.patient);
    } catch { toast.error('Error cargando historia clínica'); }
    finally { setLoadingRecords(false); }
  };

  const selectPatient = (p) => {
    fetchRecords(p._id);
    fetchDoctors();
  };

  const fetchDoctors = async () => {
    try {
      const { data } = await doctorService.getAll({ limit: 100 });
      setDoctors(data.data);
    } catch { /* silent */ }
  };

  const goBack = () => { setSelectedPatient(null); setRecords([]); };

  const resetForm = () => setForm({ doctor: '', date: new Date().toISOString().split('T')[0], type: 'consultation', diagnosis: '', symptoms: '', treatment: '', prescriptions: '', notes: '', bloodPressure: '', temperature: '', weight: '', height: '', heartRate: '' });

  const openCreate = () => { setEditing(null); resetForm(); setShowModal(true); };
  const openEdit = (r) => {
    setEditing(r);
    setForm({
      doctor: r.doctor?._id || '',
      date: r.date ? r.date.split('T')[0] : '',
      type: r.type || 'consultation',
      diagnosis: r.diagnosis || '',
      symptoms: r.symptoms || '',
      treatment: r.treatment || '',
      prescriptions: r.prescriptions || '',
      notes: r.notes || '',
      bloodPressure: r.vitalSigns?.bloodPressure || '',
      temperature: r.vitalSigns?.temperature || '',
      weight: r.vitalSigns?.weight || '',
      height: r.vitalSigns?.height || '',
      heartRate: r.vitalSigns?.heartRate || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.doctor) return toast.error('Debe seleccionar un médico');
    const payload = {
      patient: selectedPatient._id,
      doctor: form.doctor,
      date: form.date,
      type: form.type,
      diagnosis: form.diagnosis,
      symptoms: form.symptoms,
      treatment: form.treatment,
      prescriptions: form.prescriptions,
      notes: form.notes,
      vitalSigns: {
        bloodPressure: form.bloodPressure || undefined,
        temperature: form.temperature ? Number(form.temperature) : undefined,
        weight: form.weight ? Number(form.weight) : undefined,
        height: form.height ? Number(form.height) : undefined,
        heartRate: form.heartRate ? Number(form.heartRate) : undefined
      }
    };
    try {
      if (editing) { await medicalRecordService.update(editing._id, payload); toast.success('Registro actualizado'); }
      else { await medicalRecordService.create(payload); toast.success('Registro creado'); }
      setShowModal(false);
      fetchRecords(selectedPatient._id);
    } catch (err) { toast.error(err.response?.data?.message || 'Error guardando registro'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este registro clínico?')) return;
    try { await medicalRecordService.delete(id); toast.success('Registro eliminado'); fetchRecords(selectedPatient._id); }
    catch { toast.error('Error eliminando registro'); }
  };

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const getDoctorName = (doc) => doc?.user?.name || 'Médico';
  const getSpecialtyName = (doc) => doc?.specialty?.name || '';

  // ── Patient list view ──
  if (!selectedPatient) {
    return (
      <div className="page fade-in">
        <div className="page-header">
          <div><h1 className="page-title">Historias Clínicas</h1><p className="page-subtitle">Seleccione un paciente para ver su historia clínica</p></div>
        </div>
        <div className="filters">
          <div className="search-bar">
            <FiSearch className="search-bar-icon" />
            <input className="form-input" placeholder="Buscar paciente por nombre o DNI..." value={search} onChange={e => setSearch(e.target.value)} id="mr-patient-search" />
          </div>
        </div>

        {loadingPatients ? <div className="loading-container"><div className="spinner" /></div> : patients.length === 0 ? (
          <div className="card"><div className="empty-state"><div className="empty-state-icon"><FiUser /></div><p className="empty-state-text">No se encontraron pacientes</p></div></div>
        ) : (
          <>
            <div className="table-container">
              <table className="table">
                <thead><tr><th>Paciente</th><th>DNI</th><th>Obra Social</th><th>Teléfono</th><th>Acción</th></tr></thead>
                <tbody>
                  {patients.map(p => (
                    <tr key={p._id}>
                      <td style={{ fontWeight: 600 }}>{p.firstName} {p.lastName}</td>
                      <td>{p.dni}</td>
                      <td>{p.medicalInsurance || '—'}</td>
                      <td>{p.phone || '—'}</td>
                      <td><button className="btn btn-primary btn-sm" onClick={() => selectPatient(p)} id={`view-history-${p._id}`}><FiFileText style={{ marginRight: 4 }} /> Ver Historia</button></td>
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
      </div>
    );
  }

  // ── Patient timeline view ──
  return (
    <div className="page fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost" onClick={goBack} title="Volver"><FiArrowLeft /></button>
          <div>
            <h1 className="page-title">{selectedPatient.firstName} {selectedPatient.lastName}</h1>
            <p className="page-subtitle">DNI: {selectedPatient.dni} {selectedPatient.medicalInsurance ? `· ${selectedPatient.medicalInsurance}` : ''}</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={openCreate} id="new-record-btn"><FiPlus /> Nueva Entrada</button>
      </div>

      {loadingRecords ? <div className="loading-container"><div className="spinner" /></div> : records.length === 0 ? (
        <div className="card"><div className="empty-state"><div className="empty-state-icon"><FiFileText /></div><p className="empty-state-text">No hay registros clínicos para este paciente</p><button className="btn btn-primary" onClick={openCreate} style={{ marginTop: 16 }}><FiPlus /> Crear primer registro</button></div></div>
      ) : (
        <div className="mr-timeline">
          {records.map((r, i) => (
            <div className="mr-timeline-item" key={r._id} style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="mr-timeline-dot" style={{ background: typeColors[r.type] || '#6b7280' }} />
              <div className="mr-timeline-card card">
                <div className="mr-timeline-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span className="mr-type-badge" style={{ background: `${typeColors[r.type]}22`, color: typeColors[r.type], border: `1px solid ${typeColors[r.type]}44` }}>{typeLabels[r.type] || r.type}</span>
                    <span className="mr-date"><FiCalendar style={{ marginRight: 4 }} />{formatDate(r.date)}</span>
                    <span className="mr-doctor"><FiUser style={{ marginRight: 4 }} />{getDoctorName(r.doctor)}{getSpecialtyName(r.doctor) ? ` · ${getSpecialtyName(r.doctor)}` : ''}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(r)} title="Editar"><FiEdit2 /></button>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(r._id)} title="Eliminar" style={{ color: 'var(--danger)' }}><FiTrash2 /></button>
                  </div>
                </div>

                <div className="mr-timeline-body">
                  {r.diagnosis && <div className="mr-field"><strong>Diagnóstico:</strong> {r.diagnosis}</div>}
                  {r.symptoms && <div className="mr-field"><strong>Síntomas:</strong> {r.symptoms}</div>}
                  {r.treatment && <div className="mr-field"><strong>Tratamiento:</strong> {r.treatment}</div>}
                  {r.prescriptions && <div className="mr-field"><strong>Prescripciones:</strong> {r.prescriptions}</div>}
                  {r.notes && <div className="mr-field mr-notes"><strong>Notas:</strong> {r.notes}</div>}
                  {r.vitalSigns && (r.vitalSigns.bloodPressure || r.vitalSigns.temperature || r.vitalSigns.weight || r.vitalSigns.height || r.vitalSigns.heartRate) && (
                    <div className="mr-vitals">
                      <FiActivity style={{ color: 'var(--primary-light)', marginRight: 6 }} /><strong>Signos vitales:</strong>
                      <div className="mr-vitals-grid">
                        {r.vitalSigns.bloodPressure && <span>🩸 PA: {r.vitalSigns.bloodPressure}</span>}
                        {r.vitalSigns.temperature && <span>🌡️ Temp: {r.vitalSigns.temperature}°C</span>}
                        {r.vitalSigns.weight && <span>⚖️ Peso: {r.vitalSigns.weight} kg</span>}
                        {r.vitalSigns.height && <span>📏 Altura: {r.vitalSigns.height} cm</span>}
                        {r.vitalSigns.heartRate && <span>💓 FC: {r.vitalSigns.heartRate} bpm</span>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h2 className="modal-title">{editing ? 'Editar Registro' : 'Nuevo Registro Clínico'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} style={{ maxHeight: '70vh', overflowY: 'auto', padding: '0 24px 24px' }}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Médico *</label>
                  <select className="form-input" value={form.doctor} onChange={e => setField('doctor', e.target.value)}>
                    <option value="">Seleccionar médico...</option>
                    {doctors.map(d => <option key={d._id} value={d._id}>{d.user?.name} — {d.specialty?.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Tipo *</label>
                  <select className="form-input" value={form.type} onChange={e => setField('type', e.target.value)}>
                    {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Fecha *</label>
                <input className="form-input" type="date" value={form.date} onChange={e => setField('date', e.target.value)} />
              </div>
              <div className="form-group"><label className="form-label">Diagnóstico</label><textarea className="form-textarea" value={form.diagnosis} onChange={e => setField('diagnosis', e.target.value)} rows={2} /></div>
              <div className="form-group"><label className="form-label">Síntomas</label><textarea className="form-textarea" value={form.symptoms} onChange={e => setField('symptoms', e.target.value)} rows={2} /></div>
              <div className="form-group"><label className="form-label">Tratamiento</label><textarea className="form-textarea" value={form.treatment} onChange={e => setField('treatment', e.target.value)} rows={2} /></div>
              <div className="form-group"><label className="form-label">Prescripciones</label><textarea className="form-textarea" value={form.prescriptions} onChange={e => setField('prescriptions', e.target.value)} rows={2} /></div>
              <div className="form-group"><label className="form-label">Notas</label><textarea className="form-textarea" value={form.notes} onChange={e => setField('notes', e.target.value)} rows={2} /></div>

              <div style={{ borderTop: '1px solid var(--border)', marginTop: 16, paddingTop: 16 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}><FiActivity /> Signos Vitales</label>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Presión Arterial</label><input className="form-input" placeholder="120/80" value={form.bloodPressure} onChange={e => setField('bloodPressure', e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Temperatura (°C)</label><input className="form-input" type="number" step="0.1" value={form.temperature} onChange={e => setField('temperature', e.target.value)} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Peso (kg)</label><input className="form-input" type="number" step="0.1" value={form.weight} onChange={e => setField('weight', e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Altura (cm)</label><input className="form-input" type="number" value={form.height} onChange={e => setField('height', e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Frec. Cardíaca</label><input className="form-input" type="number" value={form.heartRate} onChange={e => setField('heartRate', e.target.value)} /></div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Guardar Cambios' : 'Crear Registro'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .mr-timeline { position: relative; padding-left: 32px; }
        .mr-timeline::before { content: ''; position: absolute; left: 11px; top: 0; bottom: 0; width: 2px; background: linear-gradient(to bottom, var(--primary), var(--accent), transparent); border-radius: 1px; }
        .mr-timeline-item { position: relative; margin-bottom: 20px; animation: fadeInUp 0.4s ease both; }
        .mr-timeline-dot { position: absolute; left: -27px; top: 20px; width: 14px; height: 14px; border-radius: 50%; border: 3px solid var(--bg-primary); box-shadow: 0 0 0 2px var(--border); z-index: 1; }
        .mr-timeline-card { padding: 20px; }
        .mr-timeline-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; gap: 8px; }
        .mr-type-badge { font-size: 0.75rem; font-weight: 600; padding: 3px 10px; border-radius: var(--radius-full); text-transform: uppercase; letter-spacing: 0.5px; }
        .mr-date, .mr-doctor { font-size: 0.8rem; color: var(--text-muted); display: flex; align-items: center; }
        .mr-timeline-body { display: flex; flex-direction: column; gap: 6px; }
        .mr-field { font-size: 0.88rem; color: var(--text-secondary); line-height: 1.5; }
        .mr-field strong { color: var(--text-primary); margin-right: 4px; }
        .mr-notes { padding: 8px 12px; background: rgba(6,182,212,0.05); border-radius: var(--radius-sm); border-left: 3px solid var(--primary); margin-top: 4px; }
        .mr-vitals { font-size: 0.85rem; color: var(--text-secondary); margin-top: 8px; padding: 10px 12px; background: rgba(139,92,246,0.06); border-radius: var(--radius-sm); display: flex; flex-wrap: wrap; align-items: center; gap: 4px; }
        .mr-vitals strong { color: var(--text-primary); margin-right: 8px; }
        .mr-vitals-grid { display: flex; flex-wrap: wrap; gap: 12px; margin-left: 4px; }
        .mr-vitals-grid span { font-size: 0.82rem; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 640px) { .mr-timeline { padding-left: 24px; } .mr-timeline-dot { left: -20px; width: 10px; height: 10px; } .mr-timeline-header { flex-direction: column; } }
      `}</style>
    </div>
  );
}
