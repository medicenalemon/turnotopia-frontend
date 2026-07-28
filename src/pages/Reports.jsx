import { useState, useEffect, useRef } from 'react';
import { reportService } from '../services/api';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, Legend
} from 'recharts';
import { FiCalendar, FiTrendingUp, FiCheckCircle, FiXCircle, FiDownload } from 'react-icons/fi';
import { format, subDays, startOfWeek, startOfMonth, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import 'jspdf-autotable';

const COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];
const statusLabels = {
  scheduled: 'Programado',
  confirmed: 'Confirmado',
  'in-progress': 'En curso',
  completed: 'Completado',
  cancelled: 'Cancelado',
  'no-show': 'Ausente'
};

export default function Reports() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [customDates, setCustomDates] = useState({ from: '', to: '' });
  const [showCustom, setShowCustom] = useState(false);
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef(null);
  const chartByDayRef = useRef(null);
  const chartByStatusRef = useRef(null);
  const chartBySpecialtyRef = useRef(null);

  const getDateRange = () => {
    const today = new Date();
    let from = new Date();
    let to = new Date();

    switch (period) {
      case 'today':
        from = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        to = new Date();
        break;
      case 'week':
        from = startOfWeek(today, { weekStartsOn: 0 });
        to = new Date();
        break;
      case 'month':
        from = startOfMonth(today);
        to = new Date();
        break;
      case '3months':
        from = subMonths(today, 3);
        to = new Date();
        break;
      case 'custom':
        if (customDates.from && customDates.to) {
          from = new Date(customDates.from);
          to = new Date(customDates.to);
        } else {
          return null;
        }
        break;
      default:
        break;
    }

    return {
      dateFrom: from.toISOString().split('T')[0],
      dateTo: to.toISOString().split('T')[0]
    };
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const dateRange = getDateRange();
      if (!dateRange) {
        toast.error('Seleccione un rango de fechas válido');
        return;
      }

      const res = await reportService.getReports(dateRange);
      setReports(res.data.data);
    } catch (err) {
      toast.error('Error cargando reportes');
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = async () => {
    if (!reports) {
      toast.error('No hay datos para exportar');
      return;
    }

    setExporting(true);
    try {
      const dateRange = getDateRange();
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const availableWidth = pageWidth - 2 * margin;
      let yPosition = margin;

      // PAGE 1: Title and Summary
      pdf.setFontSize(20);
      pdf.setTextColor(6, 182, 212);
      pdf.text('Reportes y Estadísticas', margin, yPosition);
      yPosition += 8;
      pdf.setFontSize(14);
      pdf.setTextColor(100);
      pdf.text('Turnotopia - Gestión de Turnos', margin, yPosition);
      yPosition += 12;

      pdf.setFontSize(10);
      pdf.setTextColor(100);
      pdf.text(`Período: ${dateRange.dateFrom} al ${dateRange.dateTo}`, margin, yPosition);
      yPosition += 6;
      pdf.text(`Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss', { locale: es })}`, margin, yPosition);
      yPosition += 14;

      // Summary table
      pdf.setFontSize(12);
      pdf.setTextColor(0);
      pdf.text('Resumen de Métricas', margin, yPosition);
      yPosition += 8;

      const summaryData = [
        ['Total de Turnos', String(reports.summary?.total || 0)],
        ['Completados', String(reports.summary?.completed || 0)],
        ['Tasa de Completitud', `${reports.summary?.completionRate}%`],
        ['Cancelaciones', String(reports.summary?.cancelled || 0)],
        ['Total Facturado', `$${(reports.summary?.totalBilled || 0).toFixed(2)}`],
        ['Total Cobrado', `$${(reports.summary?.totalCollected || 0).toFixed(2)}`]
      ];

      // Manual table drawing (jsPDF basic, no autoTable needed)
      const cellHeight = 8;
      const col1Width = 80;
      const col2Width = availableWidth - col1Width;

      pdf.setFillColor(6, 182, 212);
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(10);
      pdf.rect(margin, yPosition, col1Width, cellHeight, 'F');
      pdf.text('Métrica', margin + 2, yPosition + 6);
      pdf.rect(margin + col1Width, yPosition, col2Width, cellHeight, 'F');
      pdf.text('Valor', margin + col1Width + 2, yPosition + 6);
      yPosition += cellHeight;

      pdf.setTextColor(0);
      pdf.setFontSize(9);
      summaryData.forEach((row, idx) => {
        if (idx % 2 === 0) {
          pdf.setFillColor(245, 245, 245);
        } else {
          pdf.setFillColor(255, 255, 255);
        }
        pdf.rect(margin, yPosition, col1Width, cellHeight, 'F');
        pdf.text(row[0], margin + 2, yPosition + 6);
        pdf.rect(margin + col1Width, yPosition, col2Width, cellHeight, 'F');
        pdf.text(row[1], margin + col1Width + 2, yPosition + 6);
        yPosition += cellHeight;
      });

      yPosition += 6;

      // Try to capture charts
      const charts = [];

      if (chartByDayRef.current) {
        try {
          const canvas = await html2canvas(chartByDayRef.current, {
            scale: 1.5,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            timeout: 5000
          });
          charts.push({ title: 'Turnos por Día', canvas });
        } catch (e) {
          console.warn('No se pudo capturar gráfico de turnos por día:', e);
        }
      }

      if (chartByStatusRef.current) {
        try {
          const canvas = await html2canvas(chartByStatusRef.current, {
            scale: 1.5,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            timeout: 5000
          });
          charts.push({ title: 'Turnos por Estado', canvas });
        } catch (e) {
          console.warn('No se pudo capturar gráfico de estados:', e);
        }
      }

      if (chartBySpecialtyRef.current) {
        try {
          const canvas = await html2canvas(chartBySpecialtyRef.current, {
            scale: 1.5,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            timeout: 5000
          });
          charts.push({ title: 'Turnos por Especialidad', canvas });
        } catch (e) {
          console.warn('No se pudo capturar gráfico de especialidades:', e);
        }
      }

      // Add charts to PDF
      for (const chart of charts) {
        if (yPosition > pageHeight - 80) {
          pdf.addPage();
          yPosition = margin;
        }

        pdf.setFontSize(12);
        pdf.setTextColor(0);
        pdf.text(chart.title, margin, yPosition);
        yPosition += 8;

        const imgData = chart.canvas.toDataURL('image/png');
        const chartWidth = availableWidth;
        const chartHeight = (chart.canvas.height / chart.canvas.width) * chartWidth;

        if (yPosition + chartHeight > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }

        pdf.addImage(imgData, 'PNG', margin, yPosition, chartWidth, chartHeight);
        yPosition += chartHeight + 10;
      }

      // PAGE: Status table
      if (reports.byStatus && reports.byStatus.length > 0) {
        pdf.addPage();
        yPosition = margin;
        pdf.setFontSize(12);
        pdf.setTextColor(0);
        pdf.text('Detalle: Turnos por Estado', margin, yPosition);
        yPosition += 8;

        pdf.setFillColor(6, 182, 212);
        pdf.setTextColor(255);
        pdf.setFontSize(10);
        pdf.rect(margin, yPosition, col1Width, cellHeight, 'F');
        pdf.text('Estado', margin + 2, yPosition + 6);
        pdf.rect(margin + col1Width, yPosition, col2Width, cellHeight, 'F');
        pdf.text('Cantidad', margin + col1Width + 2, yPosition + 6);
        yPosition += cellHeight;

        pdf.setTextColor(0);
        pdf.setFontSize(9);
        reports.byStatus.forEach((row, idx) => {
          if (idx % 2 === 0) {
            pdf.setFillColor(245, 245, 245);
          } else {
            pdf.setFillColor(255, 255, 255);
          }
          pdf.rect(margin, yPosition, col1Width, cellHeight, 'F');
          pdf.text(statusLabels[row._id] || row._id, margin + 2, yPosition + 6);
          pdf.rect(margin + col1Width, yPosition, col2Width, cellHeight, 'F');
          pdf.text(String(row.count), margin + col1Width + 2, yPosition + 6);
          yPosition += cellHeight;
        });
      }

      const fileName = `reportes_turnotopia_${dateRange.dateFrom}_al_${dateRange.dateTo}.pdf`;
      pdf.save(fileName);
      toast.success('PDF descargado exitosamente');
    } catch (err) {
      console.error('Error exportando PDF:', err);
      toast.error('Error al generar el PDF: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    if (period !== 'custom' || (customDates.from && customDates.to)) {
      fetchReports();
    }
  }, [period, customDates]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p style={{ color: 'var(--text-muted)' }}>Cargando reportes...</p>
      </div>
    );
  }

  if (!reports) {
    return <div className="page fade-in"><p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No hay datos disponibles</p></div>;
  }

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reportes y Estadísticas</h1>
          <p className="page-subtitle">Análisis detallado del rendimiento clínico</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={exportToPDF}
          disabled={exporting}
          id="export-pdf-btn"
          style={{ gap: 8 }}
        >
          <FiDownload /> {exporting ? 'Generando...' : 'Descargar PDF'}
        </button>
      </div>

      <div ref={reportRef}>

      {/* Period Selector */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Período:</label>
          {['today', 'week', 'month', '3months'].map(p => (
            <button
              key={p}
              className={`btn ${period === p ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setPeriod(p)}
              style={{ fontSize: '0.9rem' }}
            >
              {{
                today: 'Hoy',
                week: 'Esta Semana',
                month: 'Este Mes',
                '3months': 'Últimos 3 Meses'
              }[p]}
            </button>
          ))}
          <button
            className={`btn ${period === 'custom' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => {
              setPeriod('custom');
              setShowCustom(!showCustom);
            }}
          >
            Personalizado
          </button>
        </div>

        {showCustom && period === 'custom' && (
          <div style={{ marginTop: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <label className="form-label">Desde</label>
              <input
                type="date"
                className="form-input"
                value={customDates.from}
                onChange={e => setCustomDates({ ...customDates, from: e.target.value })}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="form-label">Hasta</label>
              <input
                type="date"
                className="form-input"
                value={customDates.to}
                onChange={e => setCustomDates({ ...customDates, to: e.target.value })}
              />
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(6,182,212,0.15)', color: 'var(--primary)' }}>
            <FiCalendar />
          </div>
          <div className="stat-info">
            <div className="stat-label">Total de Turnos</div>
            <div className="stat-value">{reports.summary?.total || 0}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--success)' }}>
            <FiCheckCircle />
          </div>
          <div className="stat-info">
            <div className="stat-label">Completados</div>
            <div className="stat-value">
              {reports.summary?.completed || 0}
              <span style={{ fontSize: '0.8rem', color: 'var(--success)', marginLeft: 4 }}>
                ({reports.summary?.completionRate}%)
              </span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--danger)' }}>
            <FiXCircle />
          </div>
          <div className="stat-info">
            <div className="stat-label">Cancelaciones</div>
            <div className="stat-value">
              {reports.summary?.cancelled || 0}
              <span style={{ fontSize: '0.8rem', color: 'var(--danger)', marginLeft: 4 }}>
                ({reports.summary?.cancellationRate}%)
              </span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.15)', color: 'var(--accent)' }}>
            <FiTrendingUp />
          </div>
          <div className="stat-info">
            <div className="stat-label">Ingresos Facturados</div>
            <div className="stat-value">${reports.summary?.totalBilled?.toFixed(2) || '0.00'}</div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Turnos por día */}
        <div className="card" ref={chartByDayRef}>
          <h3 style={{ marginBottom: 20, fontSize: '1rem', fontWeight: 700 }}>Turnos por Día</h3>
          {reports.byDay?.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={reports.byDay}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(148,163,184,0.15)', borderRadius: 12, color: '#f1f5f9' }} />
                <Area type="monotone" dataKey="count" stroke="#06b6d4" fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <div className="empty-state"><p className="empty-state-text">Sin datos</p></div>}
        </div>

        {/* Turnos por estado */}
        <div className="card" ref={chartByStatusRef}>
          <h3 style={{ marginBottom: 20, fontSize: '1rem', fontWeight: 700 }}>Turnos por Estado</h3>
          {reports.byStatus?.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={reports.byStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  dataKey="count"
                  nameKey="_id"
                  label={({ _id, count }) => `${statusLabels[_id] || _id}: ${count}`}
                  labelLine={false}
                >
                  {reports.byStatus.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => value}
                  labelFormatter={(label) => statusLabels[label] || label}
                  contentStyle={{ background: '#1e293b', border: '1px solid rgba(148,163,184,0.15)', borderRadius: 12, color: '#f1f5f9' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="empty-state"><p className="empty-state-text">Sin datos</p></div>}
        </div>

        {/* Turnos por especialidad */}
        <div className="card" ref={chartBySpecialtyRef}>
          <h3 style={{ marginBottom: 20, fontSize: '1rem', fontWeight: 700 }}>Turnos por Especialidad</h3>
          {reports.bySpecialty?.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={reports.bySpecialty}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                <XAxis dataKey="_id" stroke="#64748b" fontSize={12} angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(148,163,184,0.15)', borderRadius: 12, color: '#f1f5f9' }} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="empty-state"><p className="empty-state-text">Sin datos</p></div>}
        </div>

        {/* Ingresos por período */}
        <div className="card">
          <h3 style={{ marginBottom: 20, fontSize: '1rem', fontWeight: 700 }}>Ingresos Facturados vs Cobrados</h3>
          {reports.invoices?.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={reports.invoices}>
                <defs>
                  <linearGradient id="colorBilled" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  formatter={(value) => `$${value.toFixed(2)}`}
                  contentStyle={{ background: '#1e293b', border: '1px solid rgba(148,163,184,0.15)', borderRadius: 12, color: '#f1f5f9' }}
                />
                <Legend />
                <Area type="monotone" dataKey="billed" stroke="#10b981" fillOpacity={1} fill="url(#colorBilled)" name="Facturado" />
                <Area type="monotone" dataKey="collected" stroke="#f59e0b" fillOpacity={1} fill="url(#colorCollected)" name="Cobrado" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <div className="empty-state"><p className="empty-state-text">Sin datos</p></div>}
        </div>

        {/* Productividad por médico */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <h3 style={{ marginBottom: 20, fontSize: '1rem', fontWeight: 700 }}>Productividad por Médico</h3>
          {reports.byDoctor?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={reports.byDoctor}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 200, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                <XAxis type="number" stroke="#64748b" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} width={190} />
                <Tooltip
                  formatter={(value) => `${value}`}
                  contentStyle={{ background: '#1e293b', border: '1px solid rgba(148,163,184,0.15)', borderRadius: 12, color: '#f1f5f9' }}
                />
                <Legend />
                <Bar dataKey="completed" fill="#10b981" name="Completados" />
                <Bar dataKey="scheduled" fill="#06b6d4" name="Programados" />
                <Bar dataKey="cancelled" fill="#ef4444" name="Cancelados" />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="empty-state"><p className="empty-state-text">Sin datos</p></div>}
        </div>
      </div>

      {/* Summary Table */}
      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ marginBottom: 16, fontSize: '1rem', fontWeight: 700 }}>Resumen de Métricas</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Métrica</th>
                <th style={{ textAlign: 'right' }}>Valor</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Total de Turnos</td>
                <td style={{ textAlign: 'right' }}><strong>{reports.summary?.total || 0}</strong></td>
              </tr>
              <tr>
                <td>Turnos Completados</td>
                <td style={{ textAlign: 'right' }}><strong>{reports.summary?.completed || 0}</strong></td>
              </tr>
              <tr>
                <td>Tasa de Completitud</td>
                <td style={{ textAlign: 'right' }}><strong>{reports.summary?.completionRate}%</strong></td>
              </tr>
              <tr>
                <td>Cancelaciones</td>
                <td style={{ textAlign: 'right' }}><strong>{reports.summary?.cancelled || 0}</strong></td>
              </tr>
              <tr>
                <td>Tasa de Cancelación</td>
                <td style={{ textAlign: 'right' }}><strong>{reports.summary?.cancellationRate}%</strong></td>
              </tr>
              <tr>
                <td>Ausentes (No Show)</td>
                <td style={{ textAlign: 'right' }}><strong>{reports.summary?.noShow || 0}</strong></td>
              </tr>
              <tr>
                <td>Tasa de Ausentismo</td>
                <td style={{ textAlign: 'right' }}><strong>{reports.summary?.noShowRate}%</strong></td>
              </tr>
              <tr style={{ borderTop: '2px solid var(--border)' }}>
                <td>Total Facturado</td>
                <td style={{ textAlign: 'right' }}><strong>${reports.summary?.totalBilled?.toFixed(2) || '0.00'}</strong></td>
              </tr>
              <tr>
                <td>Total Cobrado</td>
                <td style={{ textAlign: 'right' }}><strong>${reports.summary?.totalCollected?.toFixed(2) || '0.00'}</strong></td>
              </tr>
              <tr>
                <td>Ingreso Promedio por Factura</td>
                <td style={{ textAlign: 'right' }}><strong>${reports.summary?.avgInvoice?.toFixed(2) || '0.00'}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  );
}
