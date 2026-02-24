import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Search,
  RefreshCw,
  ShoppingBag,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import useOrderStore from "../../store/useOrderStore";

const OrdersTable = () => {
  const navigate = useNavigate();

  const {
    fetchOrders,
    changeOrderStatus,
    fetchOrderSummary,
    deleteOrder,
    shipOrderWithDelhivery,
    cancelShipment,
    schedulePickup,
    downloadShippingLabel,
    orders,
    summary,
    loading,
    error,
  } = useOrderStore();

  const [filteredData, setFilteredData] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isInitialized, setIsInitialized] = useState(false);

  const mappedData = useMemo(() => {
    return orders.map((order) => ({
      key: order._id,
      id: order._id,
      date: order.createdAt
        ? new Date(order.createdAt).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
        : "N/A",
      rawDate: order.createdAt,
      customer:
        `${order.customerId?.firstName || ""} ${order.customerId?.lastName || ""
          }`.trim() || "N/A",
      orderStatus: order.status || "pending",
      paymentStatus: order.paymentInfo?.status || "pending",
      total: `₹${(order.totalAmount || 0).toFixed(2)}`,
      waybill: order.waybill || null,
      orderDetails: order,
    }));
  }, [orders]);

  useEffect(() => {
    if (!isInitialized) {
      const loadData = async () => {
        try {
          await Promise.all([fetchOrders(1, 20), fetchOrderSummary()]);
          setIsInitialized(true);
        } catch (err) {
          toast.error("Failed to fetch orders");
          setIsInitialized(true);
        }
      };
      loadData();
    }
  }, [isInitialized, fetchOrders, fetchOrderSummary]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  useEffect(() => {
    let filtered = mappedData;

    if (searchText.trim()) {
      filtered = filtered.filter((item) =>
        Object.values(item).some((val) =>
          String(val).toLowerCase().includes(searchText.toLowerCase().trim())
        )
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((item) => item.orderStatus === filterStatus);
    }

    filtered.sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case "date":
          aValue = new Date(a.rawDate || 0).getTime();
          bValue = new Date(b.rawDate || 0).getTime();
          break;
        case "total":
          aValue = parseFloat(a.total.replace(/[₹,]/g, ""));
          bValue = parseFloat(b.total.replace(/[₹,]/g, ""));
          break;
        case "customer":
          aValue = a.customer.toLowerCase();
          bValue = b.customer.toLowerCase();
          break;
        default:
          aValue = a[sortBy];
          bValue = b[sortBy];
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      }
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
    });

    setFilteredData(filtered);
    setCurrentPage(1);
  }, [mappedData, searchText, filterStatus, sortBy, sortOrder]);

  const handleStatusChange = useCallback(
    async (record, value) => {
      try {
        await changeOrderStatus(record.id, { status: value });
        toast.success("Status updated successfully");
      } catch (error) {
        toast.error("Failed to update status");
      }
    },
    [changeOrderStatus]
  );

  const handleViewDetails = useCallback(
    (orderId, orderDetails) => {
      navigate(`/sales/orders/order-details/${orderId}`, {
        state: { order: orderDetails },
        replace: true,
      });
    },
    [navigate]
  );

  const handleEditOrder = useCallback(
    (orderId, orderDetails) => {
      navigate(`/sales/orders/order-update/${orderId}`, {
        state: { order: orderDetails },
        replace: true,
      });
    },
    [navigate]
  );

  const handleDeleteOrder = useCallback(
    async (orderId, customerName) => {
      if (
        !window.confirm(
          `Delete order for ${customerName}? This cannot be undone.`
        )
      ) {
        return;
      }
      try {
        await deleteOrder(orderId);
        toast.success("Order deleted successfully!");
      } catch (error) {
        toast.error("Failed to delete order");
      }
    },
    [deleteOrder]
  );

  const handleShipOrder = useCallback(
    async (record) => {
      try {
        await shipOrderWithDelhivery(record.id);
        toast.success("Shipment created successfully");
      } catch (err) {
        toast.error(
          err?.response?.data?.message || "Failed to create shipment"
        );
      }
    },
    [shipOrderWithDelhivery]
  );
  const handleCancelShipment = useCallback(
    async (record) => {
      if (!window.confirm("Are you sure you want to cancel this shipment?")) {
        return;
      }

      try {
        const response = await cancelShipment(record.id);
        toast.success(response.message || "Shipment cancelled successfully");
      } catch (err) {
        toast.error(
          err?.response?.data?.message || "Failed to cancel shipment"
        );
      }
    },
    [cancelShipment]
  );
  const handleSchedulePickup = useCallback(
    async (record) => {
      try {
        await schedulePickup(record.id);
        toast.success("Pickup scheduled successfully");
      } catch (err) {
        toast.error(
          err?.response?.data?.message || "Failed to schedule pickup"
        );
      }
    },
    [schedulePickup]
  );

  const handleDownloadLabel = useCallback(
    async (record) => {
      try {
        await downloadShippingLabel(record.id);
        toast.success("Label downloaded successfully");
      } catch (err) {
        toast.error(
          err?.response?.data?.message || "Failed to download label"
        );
      }
    },
    [downloadShippingLabel]
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-blue-50 text-blue-700 border border-blue-200",
      confirmed: "bg-green-50 text-green-700 border border-green-200",
      shipped: "bg-yellow-50 text-yellow-700 border border-yellow-200",
      delivered: "bg-purple-50 text-purple-700 border border-purple-200",
      cancelled: "bg-red-50 text-red-700 border border-red-200",
    };
    return colors[status] || "bg-gray-50 text-gray-700 border border-gray-200";
  };

  if (loading && orders.length === 0 && !isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="text-center">
          <RefreshCw className="animate-spin w-8 h-8 text-gray-400 mx-auto mb-4" />
          <p className="text-sm text-gray-500">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="p-4 w-full max-w-8xl mx-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">
                  Total Orders
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {(summary?.totalOrders || orders.length)?.toLocaleString()}
                </p>
              </div>
              <div className="p-2 rounded-md bg-blue-50">
                <ShoppingBag className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          {/* Filters */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row gap-4 items-end">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search orders..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#293a90] focus:border-[#293a90] text-sm"
                  />
                </div>
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#293a90] focus:border-[#293a90]"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Status
                  </th>
                  {/* Shipment toggle column */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shipment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedData.map((record) => (
                  <tr
                    key={record.key}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {/* Order ID */}
                    <td
                      className="px-6 py-4 cursor-pointer"
                      onClick={() =>
                        handleViewDetails(record.id, record.orderDetails)
                      }
                    >
                      <span className="text-sm font-medium text-[#293a90] hover:underline">
                        {record.id.slice(-6).toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">
                        {record.date}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {record.customer}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={record.orderStatus}
                        onChange={(e) =>
                          handleStatusChange(record, e.target.value)
                        }
                        className={`px-3 py-1 text-sm rounded-full border font-medium ${getStatusColor(
                          record.orderStatus
                        )}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 font-medium">
                        {record.paymentStatus}
                      </span>
                    </td>

                    {/* Shipment cell with toggle */}
                    {/* Shipment cell - 3 Compact Buttons */}
                    <td className="px-6 py-4 align-middle">
                      {record.orderStatus === "shipped" && record.waybill ? (
                        <div className="flex flex-col gap-1.5 min-w-[130px]">
                          {/* Schedule Pickup - Primary */}
                          <button
                            type="button"
                            onClick={() => handleSchedulePickup(record)}
                            className="w-full px-3 py-1.5 text-xs font-medium rounded bg-[#293a90] text-white hover:bg-[#1f2c6d] shadow-sm transition-all"
                          >
                            Schedule Pickup
                          </button>

                          {/* Download Label - Secondary */}
                          <button
                            type="button"
                            onClick={() => handleDownloadLabel(record)}
                            className="w-full px-3 py-1 text-[11px] font-medium rounded bg-blue-50 text-[#293a90] hover:bg-blue-100 border border-blue-100 transition-all"
                          >
                            Download Label
                          </button>

                          {/* Cancel Shipment - Danger/Tertiary */}
                          <button
                            type="button"
                            onClick={() => handleCancelShipment(record)}
                            className="w-full px-3 py-1 text-[11px] font-medium rounded bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 transition-all"
                          >
                            Cancel Shipment
                          </button>
                        </div>
                      ) : record.orderStatus === "cancelled" ? (
                        <span className="inline-block px-2.5 py-1 text-xs font-medium rounded-full bg-red-50 text-red-700 border border-red-200">
                          Cancelled
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleShipOrder(record)}
                          disabled={record.orderStatus !== "confirmed"}
                          className={`px-4 py-1.5 text-xs font-medium rounded border transition-colors whitespace-nowrap ${record.orderStatus === "confirmed"
                            ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                            : "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                            }`}
                        >
                          Ship now
                        </button>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">
                        {record.total}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 flex-wrap">
                        <button
                          onClick={() =>
                            handleViewDetails(record.id, record.orderDetails)
                          }
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-105"
                          title="View Details"
                          type="button"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() =>
                            handleEditOrder(record.id, record.orderDetails)
                          }
                          className="p-2 text-[#293a90] hover:bg-[#293a90]/10 rounded-lg transition-all duration-200 hover:scale-105"
                          title="Edit Order"
                          type="button"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteOrder(record.id, record.customer)
                          }
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-105"
                          title="Delete Order"
                          type="button"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedData.length === 0 && !loading && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <span className="text-sm">No orders found</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-700">
                  Showing {startIndex + 1} to{" "}
                  {Math.min(startIndex + itemsPerPage, filteredData.length)} of{" "}
                  {filteredData.length} results
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  <button
                    onClick={() =>
                      setCurrentPage(Math.max(1, currentPage - 1))
                    }
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    type="button"
                  >
                    Previous
                  </button>
                  {Array.from(
                    { length: Math.min(5, totalPages) },
                    (_, i) => {
                      const page =
                        currentPage <= 3 ? i + 1 : totalPages - 4 + i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-2 text-sm rounded-lg ${currentPage === page
                            ? "bg-[#293a90] text-white border border-[#293a90]"
                            : "border border-gray-300 hover:bg-gray-50"
                            }`}
                          type="button"
                        >
                          {page}
                        </button>
                      );
                    }
                  )}
                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    type="button"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrdersTable;
