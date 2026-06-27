import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import BottomNav from './BottomNav';

const Layout = ({ role }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    console.log('🟢 Toggle sidebar:', !sidebarOpen);
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    console.log('🟢 Close sidebar');
    setSidebarOpen(false);
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.remove('open');
  };

  return (
    <div className="app-container" style={{ position: 'relative' }}>
      {/* Overlay */}
      <div 
        id="overlay"
        className={`overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={closeSidebar}
        onTouchStart={closeSidebar}
        style={{ 
          display: sidebarOpen ? 'block' : 'none',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 150,
          touchAction: 'manipulation'
        }}
      />
      
      <Sidebar role={role} isOpen={sidebarOpen} onClose={closeSidebar} />
      
      <Topbar role={role} onToggleSidebar={toggleSidebar} />
      
      <div className="main" onClick={closeSidebar}>
        <div className="page">
          <Outlet />
        </div>
      </div>
      
      <BottomNav role={role} />
    </div>
  );
};

export default Layout;