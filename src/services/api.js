import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('turnotopia_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('turnotopia_token');
      localStorage.removeItem('turnotopia_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: (data) => api.post('/auth/login', data),
  publicRegister: (data) => api.post('/auth/public-register', data),
  getMe: () => api.get('/auth/me'),
  register: (data) => api.post('/auth/register', data),
  updatePassword: (data) => api.put('/auth/password', data),
  getUsers: () => api.get('/auth/users'),
  updateUser: (id, data) => api.put(`/auth/users/${id}`, data),
  toggleUser: (id) => api.patch(`/auth/users/${id}/toggle`),
};

export const appointmentService = {
  getAll: (params) => api.get('/appointments', { params }),
  getOne: (id) => api.get(`/appointments/${id}`),
  create: (data) => api.post('/appointments', data),
  update: (id, data) => api.put(`/appointments/${id}`, data),
  updateStatus: (id, status) => api.patch(`/appointments/${id}/status`, { status }),
  delete: (id) => api.delete(`/appointments/${id}`),
  getAvailableSlots: (params) => api.get('/appointments/available-slots', { params }),
  getWaitingRoom: () => api.get('/appointments/waiting-room'),
  checkin: (id) => api.patch(`/appointments/${id}/checkin`),
  call: (id) => api.patch(`/appointments/${id}/call`),
  completeVisit: (id) => api.patch(`/appointments/${id}/complete-visit`),
};

export const doctorService = {
  getAll: (params) => api.get('/doctors', { params }),
  getOne: (id) => api.get(`/doctors/${id}`),
  create: (data) => api.post('/doctors', data),
  update: (id, data) => api.put(`/doctors/${id}`, data),
  delete: (id) => api.delete(`/doctors/${id}`),
};

export const patientService = {
  getAll: (params) => api.get('/patients', { params }),
  getOne: (id) => api.get(`/patients/${id}`),
  create: (data) => api.post('/patients', data),
  update: (id, data) => api.put(`/patients/${id}`, data),
  delete: (id) => api.delete(`/patients/${id}`),
  getAppointments: (id) => api.get(`/patients/${id}/appointments`),
};

export const specialtyService = {
  getAll: (params) => api.get('/specialties', { params }),
  create: (data) => api.post('/specialties', data),
  update: (id, data) => api.put(`/specialties/${id}`, data),
  delete: (id) => api.delete(`/specialties/${id}`),
};

export const dashboardService = {
  getStats: () => api.get('/dashboard'),
};

export const medicalRecordService = {
  getAll: (params) => api.get('/medical-records', { params }),
  getOne: (id) => api.get(`/medical-records/${id}`),
  getByPatient: (patientId) => api.get(`/medical-records/patient/${patientId}`),
  create: (data) => api.post('/medical-records', data),
  update: (id, data) => api.put(`/medical-records/${id}`, data),
  delete: (id) => api.delete(`/medical-records/${id}`),
};

export const invoiceService = {
  getAll: (params) => api.get('/invoices', { params }),
  getOne: (id) => api.get(`/invoices/${id}`),
  create: (data) => api.post('/invoices', data),
  addPayment: (id, data) => api.post(`/invoices/${id}/payment`, data),
  getStats: () => api.get('/invoices/stats'),
  delete: (id) => api.delete(`/invoices/${id}`),
};

export const reportService = {
  getReports: (params) => api.get('/reports', { params }),
};

export default api;
