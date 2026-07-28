import { useState, useEffect } from 'react';
import { authService } from '../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiPower, FiUserPlus } from 'react-icons/fi';

const ROLE_LABELS = {
  admin: 'Administrador',
  doctor: 'Médico',
  receptionist: 'Recepción'
};

const ROLE_COLORS = {
  admin: '#8b5cf6',
  doctor: '#3b82f6',
  receptionist: '#10b981'
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'receptionist' });
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await authService.getUsers();
      setUsers(res.data.data);
    } catch {
      toast.error('Error cargando usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', email: '', password: '', role: 'receptionist' });
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditing(user);
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.role) {
      return toast.error('Complete los campos obligatorios');
    }

    try {
      if (editing) {
        const updateData = { name: form.name, email: form.email, role: form.role };
        await authService.updateUser(editing._id, updateData);
        toast.success('Usuario actualizado');
      } else {
        if (!form.password) {
          return toast.error('Ingrese una contraseña');
        }
        await authService.register({ ...form });
        toast.success('Usuario creado');
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error guardando usuario');
    }
  };

  const handleToggle = async (id) => {
    try {
      await authService.toggleUser(id);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al cambiar estado');
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestión de Usuarios</h1>
          <p className="page-subtitle">Administra los usuarios del sistema</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate} id="new-user-btn">
          <FiPlus /> Nuevo Usuario
        </button>
      </div>

      <div className="filters">
        <input
          type="text"
          className="form-input"
          placeholder="Buscar por nombre o email..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          id="user-search"
        />
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><FiUserPlus /></div>
            <p className="empty-state-text">No hay usuarios registrados</p>
          </div>
        </div>
      ) : (
        <div className="card">
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user._id}>
                    <td>
                      <strong>{user.name}</strong>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: ROLE_COLORS[user.role],
                          color: 'white'
                        }}
                      >
                        {ROLE_LABELS[user.role]}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${user.isActive ? 'badge-completed' : 'badge-cancelled'}`}
                      >
                        {user.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => openEdit(user)}
                          id={`edit-user-${user._id}`}
                        >
                          <FiEdit2 /> Editar
                        </button>
                        <button
                          className={`btn btn-ghost btn-sm`}
                          onClick={() => handleToggle(user._id)}
                          style={{
                            color: user.isActive ? 'var(--danger)' : 'var(--success)'
                          }}
                          id={`toggle-user-${user._id}`}
                        >
                          <FiPower /> {user.isActive ? 'Desactivar' : 'Activar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h2 className="modal-title">{editing ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nombre completo *</label>
                <input
                  className="form-input"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  id="user-name-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email *</label>
                <input
                  className="form-input"
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  disabled={!!editing}
                  id="user-email-input"
                />
              </div>

              {!editing && (
                <div className="form-group">
                  <label className="form-label">Contraseña *</label>
                  <input
                    className="form-input"
                    type="password"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    id="user-password-input"
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Rol *</label>
                <select
                  className="form-select"
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                  id="user-role-select"
                >
                  <option value="receptionist">Recepción</option>
                  <option value="doctor">Médico</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowModal(false)}
                  id="user-modal-cancel"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" id="user-modal-submit">
                  {editing ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
