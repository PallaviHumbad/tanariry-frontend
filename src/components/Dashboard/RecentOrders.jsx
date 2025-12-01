import React, { useState, useEffect } from "react";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import DashBoard from "../../pages/DashBoard";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  CheckCircle,
  Package,
  Truck,
  X,
  AlertCircle,
  ShoppingBag,
} from "lucide-react";

import useOrderStore from "../../store/useOrderStore";

const RecentOrders = () => {
  const [filter, setFilter] = useState("Recent Orders");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const { orders, fetchOrders, loading, error } = useOrderStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders(currentPage, itemsPerPage);
  }, [fetchOrders, currentPage]);

  // Build status counts dynamically from fetched orders
  const statusCounts = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});

  // Filter orders based on selected filter; "Recent Orders" shows all
  const filteredOrders =
    filter === "Recent Orders"
      ? orders
      : orders.filter((order) => order.status === filter);

  // Calculate total pages based on filtered orders
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  // Slice the filtered orders to show only the current page
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleClick = () => {
    navigate("/sales/orders");
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      case "confirmed":
        return "bg-green-50 text-green-700 border border-green-200";
      case "shipped":
        return "bg-yellow-50 text-yellow-700 border border-yellow-200";
      case "delivered":
        return "bg-purple-50 text-purple-700 border border-purple-200";
      case "cancelled":
        return "bg-red-50 text-red-700 border border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock className="w-3 h-3" />;
      case "confirmed":
        return <CheckCircle className="w-3 h-3" />;
      case "shipped":
        return <Truck className="w-3 h-3" />;
      case "delivered":
        return <Package className="w-3 h-3" />;
      case "cancelled":
        return <X className="w-3 h-3" />;
      default:
        return <AlertCircle className="w-3 h-3" />;
    }
  };

  return (
    <DashBoard>
      <div className="min-h-screen bg-gray-50 font-sans">
        <div className="p-4 w-full">
          <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4 w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex overflow-x-auto whitespace-nowrap space-x-2 w-full sm:w-auto">
                {[
                  "Recent Orders",
                  "pending",
                  "delivered",
                  "shipped",
                  "cancelled",
                  "confirmed",
                ].map((status) => (
                  <button
                    key={status}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${filter === status
                        ? "bg-[#293a90] text-white"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-gray-300"
                      }`}
                    onClick={() => {
                      setFilter(status);
                      setCurrentPage(1);
                    }}
                  >
                    {status === "pending"
                      ? "Pending"
                      : status.charAt(0).toUpperCase() + status.slice(1)}{" "}
                    ({statusCounts[status] || 0})
                  </button>
                ))}
              </div>
              <button
                className="text-blue-600 hover:text-blue-700 text-xs font-medium hover:underline transition-colors shrink-0"
                onClick={handleClick}
              >
                View more
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 overflow-visible w-full">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order Status
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedOrders.map((order) => (
                    <tr
                      key={order._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div
                          className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            order.status.toLowerCase()
                          )}`}
                        >
                          {getStatusIcon(order.status.toLowerCase())}
                          {order.status.charAt(0).toUpperCase() +
                            order.status.slice(1)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs font-medium text-blue-600">
                          Order #{order._id.slice(-6)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs font-medium text-gray-900">
                          ₹{order.totalAmount.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs text-gray-600">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {paginatedOrders.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <ShoppingBag className="w-8 h-8 text-gray-300" />
                          <span className="text-xs">No orders found</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between w-full">
                <div className="text-xs text-gray-700">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, filteredOrders.length)} of{" "}
                  {filteredOrders.length} results
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {Array.from(
                    { length: Math.min(totalPages, 5) },
                    (_, i) => i + 1
                  ).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-2 py-1 text-xs rounded ${currentPage === page
                          ? "bg-[#293a90] text-white"
                          : "border border-gray-300 hover:bg-gray-50"
                        }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashBoard>
  );
};

export default RecentOrders;
