import { useState, useEffect } from 'react';
import { dashboardService } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FiCalendar, FiCheckCircle, FiTrendingUp, FiXCircle, FiClock } from 'react-icons/fi';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

const statusLabels = { scheduled: 'Programado', confirmed: 'Confirmado', 'in-progress': 'En curso', completed: 'Completado', cancelled: 'Cancelado', 'no-show': 'Ausente' };

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Efecto que carga las estadísticas globales al montar el componente
  useEffect(() => {
    dashboardService.getStats()
      .then(res => setStats(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-container"><div className="spinner" /><p style={{ color: 'var(--text-muted)' }}>Cargando dashboard...</p></div>;

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">{format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es })}</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(6,182,212,0.15)', color: 'var(--primary)' }}><FiCalendar /></div>
          <div className="stat-info"><div className="stat-label">Turnos hoy</div><div className="stat-value">{stats?.todayTotal || 0}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--success)' }}><FiCheckCircle /></div>
          <div className="stat-info"><div className="stat-label">Atendidos hoy</div><div className="stat-value">{stats?.todayCompleted || 0}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.15)', color: 'var(--accent)' }}><FiTrendingUp /></div>
          <div className="stat-info"><div className="stat-label">Esta semana</div><div className="stat-value">{stats?.weekTotal || 0}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--danger)' }}><FiXCircle /></div>
          <div className="stat-info"><div className="stat-label">Cancelaciones</div><div className="stat-value">{stats?.cancelledThisWeek || 0}<span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: 4 }}>({stats?.cancellationRate}%)</span></div></div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="card">
          <h3 style={{ marginBottom: 20, fontSize: '1rem', fontWeight: 700 }}>Turnos por día</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats?.weekByDay || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(148,163,184,0.15)', borderRadius: 12, color: '#f1f5f9' }} />
              <Bar dataKey="turnos" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
              <defs><linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#06b6d4" /><stop offset="100%" stopColor="#8b5cf6" /></linearGradient></defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 20, fontSize: '1rem', fontWeight: 700 }}>Top especialidades</h3>
          {stats?.topSpecialties?.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={stats.topSpecialties} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="count" nameKey="_id" label={({ _id, count }) => `${_id}: ${count}`} labelLine={false}>
                  {stats.topSpecialties.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(148,163,184,0.15)', borderRadius: 12, color: '#f1f5f9' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="empty-state"><p className="empty-state-text">Sin datos aún</p></div>}
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ marginBottom: 16, fontSize: '1rem', fontWeight: 700 }}>
          <FiClock style={{ marginRight: 8, verticalAlign: 'middle' }} />Próximos turnos de hoy
        </h3>
        {stats?.upcomingToday?.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead><tr><th>Hora</th><th>Paciente</th><th>Médico</th><th>Especialidad</th><th>Estado</th></tr></thead>
              <tbody>
                {stats.upcomingToday.map(apt => (
                  <tr key={apt._id}>
                    <td style={{ fontWeight: 600 }}>{apt.startTime} - {apt.endTime}</td>
                    <td>{apt.patient?.firstName} {apt.patient?.lastName}</td>
                    <td>{apt.doctor?.user?.name}</td>
                    <td>{apt.doctor?.specialty?.name}</td>
                    <td><span className={`badge badge-${apt.status}`}>{statusLabels[apt.status]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="empty-state"><div className="empty-state-icon">📅</div><p className="empty-state-text">No hay turnos pendientes para hoy</p></div>}
      </div>

      <style>{`
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px; }
        .charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        @media (max-width: 900px) { .charts-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
