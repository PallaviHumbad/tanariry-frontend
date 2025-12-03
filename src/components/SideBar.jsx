import React, { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaTh,
  FaFileAlt,
  FaList,
  FaUsers,
  FaCog,
  FaTimes,
  FaBox,
  FaLifeRing,
  FaSignOutAlt,
  FaUserAlt,
  FaDollarSign,
  FaReadme,
} from "react-icons/fa";

const menuItems = [
  { label: "Dashboard", icon: FaTh, path: "/dashboard" },
  { label: "Users", icon: FaUserAlt, path: "/users" },
  { label: "Categories", icon: FaList, path: "/catalogue/categories" },
  { label: "Products", icon: FaBox, path: "/catalogue/product" },
  { label: "Orders", icon: FaFileAlt, path: "/sales/orders" },
  { label: "Customers", icon: FaUsers, path: "/customers" },
  { label: "Finance", icon: FaDollarSign, path: "/finance" },
  { label: "Report", icon: FaReadme, path: "/report" },
  { label: "Support", icon: FaLifeRing, path: "/support" },
  { label: "Settings", icon: FaCog, path: "/settings" },
];

export default function Sidebar({ isSidebarOpen, toggleSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  const filteredMenuItems = useMemo(() => {
    try {
      const adminUser = JSON.parse(localStorage.getItem("adminUser"));

      if (!adminUser || adminUser.role !== "userpannel") {
        return menuItems;
      }

      const userModules = adminUser.modules || [];
      return menuItems.filter(item => userModules.includes(item.path));
    } catch (error) {
      console.error("Error parsing adminUser from localStorage:", error);
      return menuItems;
    }
  }, []);

  const handleLogout = () => {
    try {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
      localStorage.removeItem("userPreferences");
      localStorage.removeItem("sessionData");

      navigate("/", { replace: true });
      window.location.reload();

      console.log("User logged out successfully");
    } catch (error) {
      console.error("Error during logout:", error);
      navigate("/", { replace: true });
    }
  };

  return (
    <>
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={toggleSidebar}
        />
      )}

      <nav
        className={`hidden lg:flex flex-col h-screen bg-slate-50 border-r border-slate-200/60 shadow-xl fixed top-0 left-0 transition-all duration-300 ease-in-out z-50 ${isExpanded ? "w-64" : "w-16"
          }`}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        <div className="flex-1 py-6 overflow-y-auto scrollbar-hide flex flex-col">
          <div className="px-2 space-y-1">
            {filteredMenuItems.map((item, index) => (
              <Link
                key={item.path}
                to={item.path}
                className={`group flex items-center justify-center ${isExpanded ? "justify-start" : ""
                  } px-3 py-3 text-sm font-medium rounded-xl transition-all duration-300 relative overflow-hidden ${location.pathname === item.path
                    ? "bg-[#293a90] text-white shadow-lg shadow-[#293a90]/25"
                    : "text-slate-700 hover:bg-[#293a90]/5 hover:text-[#293a90] hover:shadow-md"
                  }`}
                title={!isExpanded ? item.label : ""}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center justify-center w-5 h-5 flex-shrink-0 z-10">
                  <item.icon
                    size={18}
                    className="transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
                {isExpanded && (
                  <span className="ml-3 whitespace-nowrap transition-all duration-300 opacity-100 translate-x-0">
                    {item.label}
                  </span>
                )}

                {location.pathname === item.path && (
                  <div className="absolute left-0 top-0 bottom-0 w-1  rounded-r-full"></div>
                )}

                {!isExpanded && (
                  <div className="absolute left-full ml-3 px-3 py-2 bg-[#293a90] text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg">
                    {item.label}
                    <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-[#293a90] rotate-45"></div>
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>

        <div className="px-2 py-4 mb-18 border-t border-slate-200/60 flex-shrink-0">
          <button
            onClick={handleLogout}
            className={`cursor-pointer group flex items-center justify-center ${isExpanded ? "justify-start" : ""
              } px-3 py-3 text-sm font-medium rounded-xl transition-all duration-300 relative w-full text-slate-700 hover:bg-[#eb0082]/10 hover:text-[#eb0082] hover:shadow-md`}
            title={!isExpanded ? "Logout" : ""}
          >
            <div className="flex items-center justify-center w-5 h-5 flex-shrink-0">
              <FaSignOutAlt
                size={18}
                className="transition-all duration-300 group-hover:scale-110 group-hover:text-[#eb0082]"
              />
            </div>
            {isExpanded && (
              <span className="ml-3 whitespace-nowrap transition-all duration-300">
                Logout
              </span>
            )}

            {!isExpanded && (
              <div className="absolute cursor-pointer left-full ml-3 px-3 py-2 bg-[#293a90] text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg">
                Logout
                <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-[#293a90] rotate-45"></div>
              </div>
            )}
          </button>
        </div>
      </nav>

      <nav
        className={`lg:hidden fixed top-0 left-0 z-50 h-screen w-80 bg-slate-50 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="px-6 py-4 border-b border-slate-200/60 flex-shrink-0 bg-[#293a90]">
          <div className="flex items-center justify-between">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-200"
            >
              <FaTimes size={18} className="text-white" />
            </button>
          </div>
        </div>

        <div className="flex-1 py-6 overflow-y-auto flex flex-col">
          <div className="px-4 space-y-2">
            {filteredMenuItems.map((item, index) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={toggleSidebar}
                className={`flex items-center px-4 py-4 text-sm font-medium rounded-xl transition-all duration-300 ${location.pathname === item.path
                    ? "bg-[#293a90] text-white shadow-lg shadow-[#293a90]/25"
                    : "text-slate-700 hover:bg-[#293a90]/5 hover:text-[#293a90] hover:shadow-md"
                  }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <item.icon
                  className="mr-4 transition-transform duration-300 hover:scale-110"
                  size={18}
                />
                <span className="font-medium">{item.label}</span>

                {location.pathname === item.path && (
                  <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                )}
              </Link>
            ))}
          </div>
        </div>

        <div className="px-4 py-4 mb-16 border-t border-slate-200/60 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="flex cursor-pointer items-center px-4 py-4 text-sm font-medium rounded-xl transition-all duration-300 w-full text-slate-700 hover:bg-[#eb0082]/10 hover:text-[#eb0082] hover:shadow-md"
          >
            <FaSignOutAlt
              className="mr-4 transition-transform duration-300 hover:scale-110"
              size={18}
            />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </nav>

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        nav a {
          animation: slideIn 0.3s ease-out forwards;
        }
      `}</style>
    </>
  );
}
