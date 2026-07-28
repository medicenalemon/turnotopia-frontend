import { useState, useEffect, useCallback } from 'react';
import { invoiceService, patientService, doctorService } from '../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiDollarSign, FiSearch, FiFilter, FiCreditCard, FiTrendingUp, FiAlertCircle, FiCheckCircle, FiTrash2, FiEye } from 'react-icons/fi';
import { format } from 'date-fns';

const STATUS_MAP = {
  pending: { label: 'Pendiente', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  partial: { label: 'Parcial', color: '#fb923c', bg: 'rgba(251,146,60,0.15)' },
  paid: { label: 'Pagado', color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  cancelled: { label: 'Cancelado', color: '#94a3b8', bg: 'rgba(148,163,184,0.15)' },
};

const METHODS = {
  cash: 'Efectivo', debit: 'Débito', credit: 'Crédito', transfer: 'Transferencia', insurance: 'Obra Social'
};

export default function Billing() {
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Create form
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [newInv, setNewInv] = useState({ patient: '', doctor: '', items: [{ description: '', amount: '' }], tax: 0, notes: '' });

  // Payment form
  const [payment, setPayment] = useState({ amount: '', method: 'cash', reference: '' });

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterDateFrom) params.dateFrom = filterDateFrom;
      if (filterDateTo) params.dateTo = filterDateTo;
      const { data } = await invoiceService.getAll(params);
      setInvoices(data.data);
    } catch { toast.error('Error cargando facturas'); }
    finally { setLoading(false); }
  }, [filterStatus, filterDateFrom, filterDateTo]);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await invoiceService.getStats();
      setStats(data.data);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchInvoices(); fetchStats(); }, [fetchInvoices, fetchStats]);

  useEffect(() => {
    doctorService.getAll({ active: 'true' }).then(r => setDoctors(r.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (patientSearch.length < 2) return;
    const t = setTimeout(() => {
      patientService.getAll({ search: patientSearch, limit: 8 }).then(r => setPatients(r.data.data));
    }, 300);
    return () => clearTimeout(t);
  }, [patientSearch]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newInv.patient) return toast.error('Seleccione un paciente');
    const validItems = newInv.items.filter(i => i.description && i.amount > 0);
    if (validItems.length === 0) return toast.error('Agregue al menos un ítem');
    try {
      await invoiceService.create({ ...newInv, items: validItems.map(i => ({ ...i, amount: Number(i.amount) })), tax: Number(newInv.tax) || 0 });
      toast.success('Factura creada');
      setShowCreateModal(false);
      fetchInvoices(); fetchStats();
    } catch (err) { toast.error(err.response?.data?.message || 'Error creando factura'); }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!payment.amount || Number(payment.amount) <= 0) return toast.error('Ingrese un monto válido');
    try {
      await invoiceService.addPayment(selectedInvoice._id, { ...payment, amount: Number(payment.amount) });
      toast.success('Pago registrado');
      setShowPayModal(false);
      fetchInvoices(); fetchStats();
    } catch (err) { toast.error(err.response?.data?.message || 'Error registrando pago'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta factura?')) return;
    try {
      await invoiceService.delete(id);
      toast.success('Factura eliminada');
      fetchInvoices(); fetchStats();
    } catch (err) { toast.error(err.response?.data?.message || 'Error eliminando factura'); }
  };

  const openCreate = () => {
    setNewInv({ patient: '', doctor: '', items: [{ description: '', amount: '' }], tax: 0, notes: '' });
    setPatientSearch(''); setPatients([]);
    setShowCreateModal(true);
  };

  const openPay = (inv) => {
    setSelectedInvoice(inv);
    setPayment({ amount: inv.balance, method: 'cash', reference: '' });
    setShowPayModal(true);
  };

  const openDetail = async (inv) => {
    try {
      const { data } = await invoiceService.getOne(inv._id);
      setSelectedInvoice(data.data);
      setShowDetailModal(true);
    } catch { toast.error('Error cargando detalle'); }
  };

  const addItem = () => setNewInv(f => ({ ...f, items: [...f.items, { description: '', amount: '' }] }));
  const removeItem = (i) => setNewInv(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const updateItem = (i, field, val) => setNewInv(f => ({ ...f, items: f.items.map((item, idx) => idx === i ? { ...item, [field]: val } : item) }));

  const fmt = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n || 0);

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div><h1 className="page-title">Facturación</h1><p className="page-subtitle">Gestión de cobros y pagos</p></div>
        <button className="btn btn-primary" onClick={openCreate} id="new-invoice-btn"><FiPlus /> Nueva Factura</button>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}><FiDollarSign /></div>
            <div className="stat-info"><div className="stat-label">Recaudado Hoy</div><div className="stat-value" style={{ fontSize: '1.4rem' }}>{fmt(stats.today?.paid)}</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}><FiTrendingUp /></div>
            <div className="stat-info"><div className="stat-label">Total Mes</div><div className="stat-value" style={{ fontSize: '1.4rem' }}>{fmt(stats.month?.paid)}</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}><FiAlertCircle /></div>
            <div className="stat-info"><div className="stat-label">Saldo Pendiente</div><div className="stat-value" style={{ fontSize: '1.4rem' }}>{fmt(stats.pending?.balance)}</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.15)', color: '#8b5cf6' }}><FiCreditCard /></div>
            <div className="stat-info"><div className="stat-label">Facturas del Mes</div><div className="stat-value" style={{ fontSize: '1.4rem' }}>{stats.month?.count || 0}</div></div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.85rem' }}><FiFilter /> Filtros:</div>
        <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} id="filter-inv-status">
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <input className="form-input" type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} style={{ width: 160, minWidth: 'auto' }} placeholder="Desde" />
        <input className="form-input" type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} style={{ width: 160, minWidth: 'auto' }} placeholder="Hasta" />
      </div>

      {/* Table */}
      {loading ? <div className="loading-container"><div className="spinner" /></div> : invoices.length === 0 ? (
        <div className="card"><div className="empty-state"><div className="empty-state-icon"><FiDollarSign /></div><p className="empty-state-text">No hay facturas para los filtros seleccionados</p></div></div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead><tr><th>Nº</th><th>Fecha</th><th>Paciente</th><th>Médico</th><th>Total</th><th>Pagado</th><th>Saldo</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              {invoices.map(inv => {
                const st = STATUS_MAP[inv.status] || STATUS_MAP.pending;
                return (
                  <tr key={inv._id}>
                    <td style={{ fontWeight: 700, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{inv.invoiceNumber}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{format(new Date(inv.date), 'dd/MM/yyyy')}</td>
                    <td>{inv.patient?.firstName} {inv.patient?.lastName}<br /><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>DNI: {inv.patient?.dni}</span></td>
                    <td>{inv.doctor?.user?.name || '—'}</td>
                    <td style={{ fontWeight: 600 }}>{fmt(inv.total)}</td>
                    <td style={{ color: 'var(--success)' }}>{fmt(inv.amountPaid)}</td>
                    <td style={{ color: inv.balance > 0 ? 'var(--warning)' : 'var(--success)', fontWeight: 600 }}>{fmt(inv.balance)}</td>
                    <td><span className="badge" style={{ background: st.bg, color: st.color }}>{st.label}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-sm btn-ghost" onClick={() => openDetail(inv)} title="Ver detalle"><FiEye /></button>
                        {(inv.status === 'pending' || inv.status === 'partial') && (
                          <button className="btn btn-sm btn-success" onClick={() => openPay(inv)} title="Registrar pago"><FiCreditCard /></button>
                        )}
                        <button className="btn btn-sm btn-ghost" onClick={() => handleDelete(inv._id)} title="Eliminar" style={{ color: 'var(--danger)' }}><FiTrash2 /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 620 }}>
            <div className="modal-header">
              <h2 className="modal-title">Nueva Factura</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Paciente *</label>
                <div className="search-bar"><FiSearch className="search-bar-icon" /><input className="form-input" style={{ paddingLeft: 40 }} placeholder="Buscar por nombre o DNI..." value={patientSearch} onChange={e => { setPatientSearch(e.target.value); setNewInv(f => ({ ...f, patient: '' })); }} /></div>
                {patients.length > 0 && !newInv.patient && (
                  <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', marginTop: 4, maxHeight: 140, overflowY: 'auto' }}>
                    {patients.map(p => (
                      <div key={p._id} onClick={() => { setNewInv(f => ({ ...f, patient: p._id })); setPatientSearch(`${p.firstName} ${p.lastName} (${p.dni})`); setPatients([]); }}
                        style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '0.85rem', borderBottom: '1px solid var(--border)' }}
                        onMouseOver={e => e.currentTarget.style.background = 'var(--bg-tertiary)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                        <strong>{p.firstName} {p.lastName}</strong> — DNI: {p.dni}
                      </div>
                    ))}
                  </div>
                )}
                {newInv.patient && <p style={{ fontSize: '0.8rem', color: 'var(--success)', marginTop: 4 }}>✓ Paciente seleccionado</p>}
              </div>

              <div className="form-group">
                <label className="form-label">Médico</label>
                <select className="form-select" value={newInv.doctor} onChange={e => setNewInv(f => ({ ...f, doctor: e.target.value }))}>
                  <option value="">Sin médico asociado</option>
                  {doctors.map(d => <option key={d._id} value={d._id}>{d.user?.name} — {d.specialty?.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Ítems *</label>
                {newInv.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input className="form-input" placeholder="Descripción" value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} style={{ flex: 2 }} />
                    <input className="form-input" type="number" placeholder="Monto" value={item.amount} onChange={e => updateItem(i, 'amount', e.target.value)} style={{ flex: 1 }} min="0" step="0.01" />
                    {newInv.items.length > 1 && <button type="button" className="btn btn-sm btn-ghost" onClick={() => removeItem(i)} style={{ color: 'var(--danger)', flexShrink: 0 }}>✕</button>}
                  </div>
                ))}
                <button type="button" className="btn btn-sm btn-ghost" onClick={addItem}><FiPlus /> Agregar ítem</button>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Impuestos (ARS)</label>
                  <input className="form-input" type="number" value={newInv.tax} onChange={e => setNewInv(f => ({ ...f, tax: e.target.value }))} min="0" step="0.01" />
                </div>
                <div className="form-group">
                  <label className="form-label">Total estimado</label>
                  <div style={{ padding: '10px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-light)' }}>
                    {fmt(newInv.items.reduce((s, i) => s + (Number(i.amount) || 0), 0) + (Number(newInv.tax) || 0))}
                  </div>
                </div>
              </div>

              <div className="form-group"><label className="form-label">Notas</label><textarea className="form-textarea" value={newInv.notes} onChange={e => setNewInv(f => ({ ...f, notes: e.target.value }))} placeholder="Observaciones..." rows={2} /></div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreateModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Crear Factura</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayModal && selectedInvoice && (
        <div className="modal-overlay" onClick={() => setShowPayModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h2 className="modal-title">Registrar Pago</h2>
              <button className="modal-close" onClick={() => setShowPayModal(false)}>✕</button>
            </div>
            <div style={{ padding: '12px 16px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', marginBottom: 16 }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Factura {selectedInvoice.invoiceNumber}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                <span>Total: <strong>{fmt(selectedInvoice.total)}</strong></span>
                <span>Saldo: <strong style={{ color: 'var(--warning)' }}>{fmt(selectedInvoice.balance)}</strong></span>
              </div>
            </div>
            <form onSubmit={handlePayment}>
              <div className="form-group"><label className="form-label">Monto *</label><input className="form-input" type="number" value={payment.amount} onChange={e => setPayment(f => ({ ...f, amount: e.target.value }))} min="0.01" max={selectedInvoice.balance} step="0.01" /></div>
              <div className="form-group">
                <label className="form-label">Método de pago *</label>
                <select className="form-select" value={payment.method} onChange={e => setPayment(f => ({ ...f, method: e.target.value }))}>
                  {Object.entries(METHODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">Referencia</label><input className="form-input" value={payment.reference} onChange={e => setPayment(f => ({ ...f, reference: e.target.value }))} placeholder="Nº de comprobante (opcional)" /></div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowPayModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-success"><FiCheckCircle /> Registrar Pago</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedInvoice && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h2 className="modal-title">Factura {selectedInvoice.invoiceNumber}</h2>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>✕</button>
            </div>
            <div style={{ display: 'grid', gap: 12, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Fecha</span>
                <span>{format(new Date(selectedInvoice.date), 'dd/MM/yyyy')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Paciente</span>
                <span>{selectedInvoice.patient?.firstName} {selectedInvoice.patient?.lastName}</span>
              </div>
              {selectedInvoice.doctor && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Médico</span>
                  <span>{selectedInvoice.doctor?.user?.name}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Estado</span>
                <span className="badge" style={{ background: STATUS_MAP[selectedInvoice.status]?.bg, color: STATUS_MAP[selectedInvoice.status]?.color }}>{STATUS_MAP[selectedInvoice.status]?.label}</span>
              </div>
            </div>

            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>Ítems</h3>
            <div style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: 16 }}>
              {selectedInvoice.items?.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: i < selectedInvoice.items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <span>{item.description}</span>
                  <span style={{ fontWeight: 600 }}>{fmt(item.amount)}</span>
                </div>
              ))}
              {selectedInvoice.tax > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderTop: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  <span>Impuestos</span><span>{fmt(selectedInvoice.tax)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', borderTop: '1px solid var(--border)', fontWeight: 700, fontSize: '1.05rem' }}>
                <span>Total</span><span style={{ color: 'var(--primary-light)' }}>{fmt(selectedInvoice.total)}</span>
              </div>
            </div>

            {selectedInvoice.payments?.length > 0 && (
              <>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>Historial de Pagos</h3>
                <div style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: 16 }}>
                  {selectedInvoice.payments.map((p, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: i < selectedInvoice.payments.length - 1 ? '1px solid var(--border)' : 'none', fontSize: '0.85rem' }}>
                      <div>
                        <div style={{ fontWeight: 500 }}>{METHODS[p.method] || p.method}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{format(new Date(p.date), 'dd/MM/yyyy HH:mm')}{p.reference ? ` • ${p.reference}` : ''}</div>
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--success)' }}>{fmt(p.amount)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(6,182,212,0.06)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pagado</div><div style={{ fontWeight: 700, color: 'var(--success)' }}>{fmt(selectedInvoice.amountPaid)}</div></div>
              <div style={{ textAlign: 'right' }}><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Saldo</div><div style={{ fontWeight: 700, color: selectedInvoice.balance > 0 ? 'var(--warning)' : 'var(--success)' }}>{fmt(selectedInvoice.balance)}</div></div>
            </div>

            {selectedInvoice.notes && <p style={{ marginTop: 12, fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{selectedInvoice.notes}</p>}

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowDetailModal(false)}>Cerrar</button>
              {(selectedInvoice.status === 'pending' || selectedInvoice.status === 'partial') && (
                <button className="btn btn-success" onClick={() => { setShowDetailModal(false); openPay(selectedInvoice); }}><FiCreditCard /> Registrar Pago</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
