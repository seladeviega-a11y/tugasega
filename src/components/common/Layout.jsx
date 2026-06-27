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
      <div className={`overlay ${sidebarOpen ? 'open' : ''}`} onClick={closeSidebar}></div>
      
      {/* Sidebar */}
      <Sidebar role={role} isOpen={sidebarOpen} />
      
      {/* Topbar */}
      <Topbar role={role} onToggleSidebar={toggleSidebar} />
      
      {/* Main Content - OUTLET untuk render halaman */}
      <div className="main">
        <div className="page">
          <Outlet />  {/* ← Ini penting! */}
        </div>
      </div>
      
      {/* Bottom Navigation (Mobile) */}
      <BottomNav role={role} />
    </div>
  );
};

export default Layout;