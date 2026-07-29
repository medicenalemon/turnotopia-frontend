import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import MainLayout from './components/layout/MainLayout';
import PatientLayout from './components/layout/PatientLayout';
import Login from './pages/Login';
import PatientLogin from './pages/PatientLogin';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Appointments from './pages/Appointments';
import Patients from './pages/Patients';
import Doctors from './pages/Doctors';
import Specialties from './pages/Specialties';
import MedicalRecords from './pages/MedicalRecords';
import Calendar from './pages/Calendar';
import WaitingRoom from './pages/WaitingRoom';
import Billing from './pages/Billing';
import Users from './pages/Users';
import Reports from './pages/Reports';
import About from './pages/About';
import PatientPortal from './pages/PatientPortal';
import CheckIn from './pages/CheckIn';

function PrivateRoute({ children, allowedRoles }) {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return <div className="loading-container"><div className="spinner" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" />;
  
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to={user?.role === 'patient' ? '/portal' : '/'} />;
  }
  
  return children;
}

export default function App() {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) return <div className="loading-container"><div className="spinner" /></div>;

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to={user?.role === 'patient' ? '/portal' : '/'} /> : <Login />} />
      <Route path="/patient-login" element={isAuthenticated ? <Navigate to={user?.role === 'patient' ? '/portal' : '/'} /> : <PatientLogin />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to={user?.role === 'patient' ? '/portal' : '/'} /> : <Register />} />
      
      {/* Public Routes */}
      <Route path="/check-in" element={<CheckIn />} />

      {/* Admin/Staff Routes */}
      <Route element={<PrivateRoute allowedRoles={['admin', 'doctor', 'receptionist']}><MainLayout /></PrivateRoute>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/patients" element={<Patients />} />
        <Route path="/doctors" element={<Doctors />} />
        <Route path="/specialties" element={<Specialties />} />
        <Route path="/medical-records" element={<MedicalRecords />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/waiting-room" element={<WaitingRoom />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/users" element={<Users />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/about" element={<About />} />
      </Route>

      {/* Patient Routes */}
      <Route element={<PrivateRoute allowedRoles={['patient']}><PatientLayout /></PrivateRoute>}>
        <Route path="/portal" element={<PatientPortal />} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
