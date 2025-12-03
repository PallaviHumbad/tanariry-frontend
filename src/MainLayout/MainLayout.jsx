import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/SideBar";
import Navbar from "../components/NavBar";

const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Fixed Navbar - Positioned at top-left, full width */}
      <div className="fixed top-0 left-0 right-0 z-30 bg-white shadow-sm border-b border-gray-200">
        <Navbar toggleSidebar={toggleSidebar} />
      </div>

      {/* Sidebar Container - Already positioned with top-17 as mentioned */}
      <div
        className={`fixed md:relative md:block z-50 h-screen pl-16 transition-all duration-300 ease-in-out mt-17.5 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      </div>

      {/* Mobile Overlay - only visible when sidebar is open */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Main Content Container - Adjusted for fixed navbar */}
      <div className="flex flex-col flex-1 min-w-0 pt-17">
        {/* Main Content - Only scrollable area with top padding to account for fixed navbar */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="max-w-8xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
