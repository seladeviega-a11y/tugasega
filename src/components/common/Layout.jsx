import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import BottomNav from './BottomNav';

const Layout = ({ role }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="app-container">
      {/* Overlay for mobile */}
      <div 
        className={`overlay ${sidebarOpen ? 'open' : ''}`} 
        id="overlay"
        onClick={closeSidebar}
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.4)',
          zIndex: 150,
          display: sidebarOpen ? 'block' : 'none'
        }}
      ></div>
      
      {/* Sidebar */}
      <Sidebar role={role} isOpen={sidebarOpen} />
      
      {/* Topbar */}
      <Topbar role={role} onToggleSidebar={toggleSidebar} />
      
      {/* Main Content */}
      <div className="main">
        <div className="page">
          <Outlet />
        </div>
      </div>
      
      {/* Bottom Navigation (Mobile) */}
      <BottomNav role={role} />
    </div>
  );
};

export default Layout;