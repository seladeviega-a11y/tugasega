import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getInitials } from '../../utils/helpers';

const Topbar = ({ role, onToggleSidebar }) => {
  const { user } = useAuth();
  const roleLabel = role === 'operator' ? 'Operator' : 'Leader / Admin';

  return (
    <>
      {/* Desktop Topbar */}
      <div className="topbar desk-only">
        <div className="tb-search">
          <span></span>
          <input type="text" placeholder="Cari style, batch, operator..." />
        </div>
        <div className="topbar-right">
          {/* ❌ NOTIFIKASI DIHAPUS */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="avatar">{getInitials(user?.name || 'User')}</div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>{user?.name || 'User'}</div>
              <div style={{ fontSize: '11px', color: 'var(--sub)' }}>{roleLabel}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Topbar */}
      <div className="mob-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span 
            style={{ 
              fontSize: '24px', 
              cursor: 'pointer', 
              touchAction: 'manipulation',
              padding: '4px 8px',
              userSelect: 'none',
              WebkitTapHighlightColor: 'transparent'
            }} 
            onClick={() => {
              console.log('🍔 Hamburger DI KLIK!');
              onToggleSidebar();
            }}
          >
            ☰
          </span>
          <span style={{ fontSize: '16px', fontWeight: 700 }}>egaaSLDV</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* ❌ NOTIFIKASI DIHAPUS */}
          <div className="avatar">{getInitials(user?.name || 'User')}</div>
        </div>
      </div>
    </>
  );
};

export default Topbar;