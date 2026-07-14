import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { OPERATOR_MENU, LEADER_MENU } from '../../utils/constants';

const Sidebar = ({ role, isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const menu = role === 'operator' ? OPERATOR_MENU : LEADER_MENU;

  useEffect(() => {
    console.log('Sidebar isOpen:', isOpen);
  }, [isOpen]);

  const goToPage = (id) => {
    console.log('🔵 MENU DI KLIK:', id);
    const path = `/${role}/${id}`;
    navigate(path);
    
    setTimeout(() => {
      const sidebar = document.getElementById('sidebar');
      if (sidebar) sidebar.classList.remove('open');
      const overlay = document.getElementById('overlay');
      if (overlay) overlay.classList.remove('open');
      if (onClose) onClose();
    }, 50);
  };

  const handleLogout = async () => {
    console.log('🔴 LOGOUT DI KLIK');
    await logout();
    navigate('/login');
    if (onClose) onClose();
  };

  const isActive = (id) => {
    return location.pathname === `/${role}/${id}`;
  };

  return (
    <aside 
      className={`sidebar ${isOpen ? 'open' : ''}`} 
      id="sidebar"
      style={{ 
        touchAction: 'manipulation',
        zIndex: 200,
        WebkitOverflowScrolling: 'touch'
      }}
    >
      <div className="sb-logo">
        <div className="sb-logo-icon">🪡</div>
        SIMPROFE 
      </div>
      <div className="sb-role">
        Role Aktif
        <strong>{role === 'operator' ? 'Operator' : 'Leader / Admin'}</strong>
      </div>
      
      <nav className="sb-nav" style={{ flex: 1, padding: '8px' }}>
        {menu.map((item) => {
          const active = isActive(item.id);
          return (
            <div
              key={item.id}
              className={`nav-item ${active ? 'active' : ''}`}
              onClick={() => goToPage(item.id)}
              onTouchStart={() => goToPage(item.id)}
              style={{ 
                cursor: 'pointer',
                touchAction: 'manipulation',
                padding: '14px 16px',
                minHeight: '50px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '15px',
                borderRadius: '8px',
                userSelect: 'none',
                WebkitTapHighlightColor: 'transparent',
                backgroundColor: active ? 'rgba(255,255,255,0.14)' : 'transparent',
                color: active ? '#fff' : 'rgba(255,255,255,0.65)',
                fontWeight: active ? '600' : '400',
                transition: 'background 0.15s',
                border: 'none',
                outline: 'none'
              }}
            >
              <span className="ni" style={{ fontSize: '18px', width: '24px', textAlign: 'center' }}>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          );
        })}
      </nav>
      
      {/* ❌ EMERGENCY STOP DIHAPUS */}
      <div className="sb-bottom" style={{ padding: '8px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div 
          className="nav-item" 
          onClick={handleLogout}
          onTouchStart={handleLogout}
          style={{ 
            cursor: 'pointer',
            touchAction: 'manipulation',
            padding: '14px 16px',
            minHeight: '50px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '15px',
            borderRadius: '8px',
            userSelect: 'none',
            WebkitTapHighlightColor: 'transparent',
            marginTop: '4px',
            color: 'rgba(255,255,255,0.65)',
            transition: 'background 0.15s',
            border: 'none',
            outline: 'none'
          }}
        >
          <span className="ni" style={{ fontSize: '18px', width: '24px', textAlign: 'center' }}>🚪</span>
          <span>Logout</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;