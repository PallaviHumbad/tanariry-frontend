import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const DashBoard = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === "/dashboard") {
      navigate("/");
    }
  }, [location, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 mb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* Navigation Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              className={`px-4 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                location.pathname === "/"
                  ? "bg-[#293a90] text-white"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-gray-300"
              }`}
              onClick={() => navigate("/")}
            >
              Statistics
            </button>
            <button
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                location.pathname === "/recentOrders"
                  ? "bg-[#293a90] text-white"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-gray-300"
              }`}
              onClick={() => navigate("/recentOrders")}
            >
              Recent Orders
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 w-full">{children}</div>
    </div>
  );
};

export default DashBoard;
