import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import Login from './components/auth/Login';
import Layout from './components/common/Layout';
import OPDashboard from './components/operator/OPDashboard';
import OPInput from './components/operator/OPInput';
import OPConstraint from './components/operator/OPConstraint';
import OPHISTORY from './components/operator/OPHISTORY';
import LDDashboard from './components/leader/LDDashboard';
import LDManage from './components/leader/LDManage';
import LDMonitoring from './components/leader/LDMonitoring';
import LDConstraints from './components/leader/LDConstraints';
import LDReports from './components/leader/LDReports';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }
  
  if (!user) return <Navigate to="/login" replace />;
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'operator' ? '/operator/dashboard' : '/leader/dashboard'} replace />;
  }
  
  return children;
};

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* OPERATOR ROUTES */}
      <Route 
        path="/operator" 
        element={
          <ProtectedRoute allowedRoles={['operator']}>
            <Layout role="operator" />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<OPDashboard />} />
        <Route path="input" element={<OPInput />} />
        <Route path="kendala" element={<OPConstraint />} />
        <Route path="riwayat" element={<OPHISTORY />} />
        <Route index element={<Navigate to="/operator/dashboard" replace />} />
      </Route>
      
      {/* LEADER ROUTES */}
      <Route 
        path="/leader" 
        element={
          <ProtectedRoute allowedRoles={['leader']}>
            <Layout role="leader" />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<LDDashboard />} />
        <Route path="kelola" element={<LDManage />} />
        <Route path="monitoring" element={<LDMonitoring />} />
        <Route path="kendala" element={<LDConstraints />} />
        <Route path="laporan" element={<LDReports />} />
        <Route index element={<Navigate to="/leader/dashboard" replace />} />
      </Route>
      
      <Route path="/" element={<Navigate to={user ? (user.role === 'operator' ? '/operator/dashboard' : '/leader/dashboard') : '/login'} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="bottom-center" toastOptions={{ duration: 3000 }} />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;