import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import SideBar from '../components/Sider';
import { Menu } from 'lucide-react';

const Layout = ({ children }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Define paths where the sidebar should not be displayed
  const noSidebarPaths = ['/'];
  const showSidebar = !noSidebarPaths.includes(location.pathname);

  // Create refs for sidebar and button
  const sidebarRef = useRef(null);
  const buttonRef = useRef(null);

  // Function to handle outside click to close the sidebar
  const handleClickOutside = (e) => {
    if (
      sidebarRef.current && !sidebarRef.current.contains(e.target) && 
      buttonRef.current && !buttonRef.current.contains(e.target)
    ) {
      setSidebarOpen(false);
    }
  };

  // Use effect to add event listener when sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.addEventListener('click', handleClickOutside);
    } else {
      document.removeEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [sidebarOpen]);

  return (
    <div className="flex min-h-screen">
      {showSidebar && (
        <>
          <button
            ref={buttonRef} // Attach ref to the button
            className={`md:hidden fixed top-4 z-50 bg-gray-800 text-white p-2 rounded-full ${sidebarOpen ? `right-20` : `left-4`}`}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu size={24} />
          </button>
          <aside
            ref={sidebarRef} // Attach ref to the sidebar
            className={`fixed h-full bg-gray-900 text-white transition-transform transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 w-64 z-40 md:block`}
          >
            <SideBar />
          </aside>
        </>
      )}
      <main className={`flex-1 p-4 transition-all ${showSidebar ? 'md:ml-64' : ''}`}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
