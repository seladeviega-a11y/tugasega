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
          <div className="tb-bell">
            🔔
            <div className="tb-badge"></div>
          </div>
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
          <span style={{ fontSize: '22px', cursor: 'pointer' }} onClick={onToggleSidebar}>
            ☰
          </span>
          <span style={{ fontSize: '16px', fontWeight: 700 }}>jokiega</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="tb-bell">
            🔔
            <div className="tb-badge"></div>
          </div>
          <div className="avatar">{getInitials(user?.name || 'User')}</div>
        </div>
      </div>
    </>
  );
};

export default Topbar;