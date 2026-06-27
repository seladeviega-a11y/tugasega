import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { OPERATOR_MENU, LEADER_MENU } from '../../utils/constants';

const Sidebar = ({ role, isOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const menu = role === 'operator' ? OPERATOR_MENU : LEADER_MENU;

  const handleNav = (id) => {
    console.log('Navigasi ke:', `/${role}/${id}`); // Debug
    navigate(`/${role}/${id}`);
    // Tutup sidebar di mobile
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.remove('open');
    const overlay = document.getElementById('overlay');
    if (overlay) overlay.classList.remove('open');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleEmergencyStop = () => {
    alert('⏹ Emergency Stop Triggered!');
  };

  const isActive = (id) => {
    return location.pathname === `/${role}/${id}`;
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`} id="sidebar">
      <div className="sb-logo">
        <div className="sb-logo-icon">🪡</div>
        StitchControl AI
      </div>
      <div className="sb-role">
        Role Aktif
        <strong>{role === 'operator' ? 'Operator' : 'Leader / Admin'}</strong>
      </div>
      <nav className="sb-nav">
        {menu.map((item) => (
          <div
            key={item.id}
            className={`nav-item ${isActive(item.id) ? 'active' : ''}`}
            onClick={() => handleNav(item.id)}
            style={{ 
              cursor: 'pointer',
              touchAction: 'manipulation' // Fix mobile
            }}
          >
            <span className="ni">{item.icon}</span>
            {item.label}
          </div>
        ))}
      </nav>
      <div className="sb-bottom">
        <button className="btn-emstop" onClick={handleEmergencyStop}>
          ⏹ Emergency Stop
        </button>
        <div 
          className="nav-item" 
          style={{ marginTop: '2px', cursor: 'pointer' }} 
          onClick={handleLogout}
        >
          <span className="ni">🚪</span> Logout
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;