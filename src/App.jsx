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

// ============================================
// ERROR BOUNDARY
// ============================================
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error: error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <h2>⚠️ Terjadi Error</h2>
          <p style={{ color: '#718096' }}>{this.state.error?.message || 'Unknown error'}</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ 
              padding: '10px 20px', 
              marginTop: '10px', 
              cursor: 'pointer',
              background: '#0f2027',
              color: '#fff',
              border: 'none',
              borderRadius: '8px'
            }}
          >
            Refresh Halaman
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ============================================
// PROTECTED ROUTE
// ============================================
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '16px',
        color: '#718096'
      }}>
        Loading...
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'operator' ? '/operator/dashboard' : '/leader/dashboard'} replace />;
  }
  
  return children;
};

// ============================================
// APP ROUTES
// ============================================
function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '16px',
        color: '#718096'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Routes>
        {/* PUBLIC */}
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
        
        {/* DEFAULT */}
        <Route 
          path="/" 
          element={
            <Navigate 
              to={
                user 
                  ? (user.role === 'operator' ? '/operator/dashboard' : '/leader/dashboard') 
                  : '/login'
              } 
              replace 
            />
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}

// ============================================
// MAIN APP
// ============================================
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster 
          position="bottom-center" 
          toastOptions={{ 
            duration: 3000,
            style: {
              background: '#0f2027',
              color: '#fff',
              borderRadius: '8px',
              padding: '12px 20px'
            }
          }} 
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;