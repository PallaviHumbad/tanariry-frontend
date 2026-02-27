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
  Printer,
  FileText,
} from "lucide-react";
import useOrderStore from "../../store/useOrderStore";

const STANDARD_OPTIONS = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

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
    bulkDownloadShippingLabels,
    generateDailyManifest,
    getAllShipments,
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

  const [selectedOrders, setSelectedOrders] = useState([]);
  const [isBulkPrinting, setIsBulkPrinting] = useState(false);
  const [isGeneratingManifest, setIsGeneratingManifest] = useState(false);

  const [activeTab, setActiveTab] = useState("all_orders");

  const mappedData = useMemo(() => {
    // Failsafe: Agar orders array nahi hai to khali array set karein
    const safeOrders = Array.isArray(orders) ? orders : [];

    return safeOrders.map((order) => ({
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
      returnWaybill: order.returnWaybill || null, // <-- Ye add kiya check karne ke liye
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
    setSelectedOrders([]);
  }, [mappedData, searchText, filterStatus, sortBy, sortOrder]);

  const handleTabChange = async (tabValue) => {
    setActiveTab(tabValue);
    try {
      if (tabValue === "all_orders") {
        await fetchOrders(1, 20);
      } else {
        await getAllShipments(tabValue);
      }
    } catch (err) {
      toast.error("Failed to fetch filtered shipments");
    }
  };

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

  const handleBulkPrint = async () => {
    if (selectedOrders.length === 0) return;
    setIsBulkPrinting(true);
    try {
      await bulkDownloadShippingLabels({ orderIds: selectedOrders });
      toast.success("Bulk labels downloaded successfully");
      setSelectedOrders([]);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to download bulk labels");
    } finally {
      setIsBulkPrinting(false);
    }
  };

  const handleGenerateManifest = async () => {
    setIsGeneratingManifest(true);
    try {
      await generateDailyManifest();
      toast.success("Manifest downloaded successfully");
    } catch (err) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Something went wrong";
      toast.error(errorMessage);
    } finally {
      setIsGeneratingManifest(false);
    }
  };

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const shippableOrders = paginatedData
        .filter((record) => (record.orderStatus === "shipped" && record.waybill) || record.returnWaybill)
        .map((record) => record.id);

      const newSelections = new Set([...selectedOrders, ...shippableOrders]);
      setSelectedOrders(Array.from(newSelections));
    } else {
      const pageIds = paginatedData.map((record) => record.id);
      setSelectedOrders(selectedOrders.filter((id) => !pageIds.includes(id)));
    }
  };

  const handleSelectOne = (e, orderId) => {
    if (e.target.checked) {
      setSelectedOrders([...selectedOrders, orderId]);
    } else {
      setSelectedOrders(selectedOrders.filter((id) => id !== orderId));
    }
  };

  const shippablePageItems = paginatedData.filter(
    (record) => (record.orderStatus === "shipped" && record.waybill) || record.returnWaybill
  );
  const isAllPageSelected =
    shippablePageItems.length > 0 &&
    shippablePageItems.every((record) => selectedOrders.includes(record.id));

  // Dynamic colors for new return statuses
  const getStatusColor = (status) => {
    const s = String(status).toLowerCase();
    if (s.includes("cancel") || s.includes("reject")) return "bg-red-50 text-red-700 border border-red-200";
    if (s.includes("deliver") || s.includes("complet") || s.includes("approv")) return "bg-green-50 text-green-700 border border-green-200";
    if (s.includes("shipp")) return "bg-yellow-50 text-yellow-700 border border-yellow-200";
    return "bg-blue-50 text-blue-700 border border-blue-200";
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

  const TABS = [
    { id: "all_orders", label: "All Orders" },
    { id: "all", label: "All Shipped" },
    { id: "ready_for_pickup", label: "Ready for Pickup" },
    { id: "in_transit", label: "In Transit" },
    { id: "rto", label: "RTO in Transit" },
    { id: "delivered", label: "Delivered" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="p-4 w-full max-w-8xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">
                  Total Orders
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {(summary?.totalOrders || (Array.isArray(orders) ? orders.length : 0))?.toLocaleString()}
                </p>
              </div>
              <div className="p-2 rounded-md bg-blue-50">
                <ShoppingBag className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4 overflow-x-auto pb-2">
          <div className="flex space-x-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${activeTab === tab.id
                  ? "bg-[#293a90] text-white shadow-sm"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row gap-4 items-end justify-between">
              <div className="flex flex-1 gap-4 items-end w-full lg:w-auto">
                <div className="flex-1 max-w-md">
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
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#293a90] focus:border-[#293a90] outline-none"
                >
                  <option value="all">All Local Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                {selectedOrders.length > 0 && (
                  <button
                    onClick={handleBulkPrint}
                    disabled={isBulkPrinting}
                    className="flex items-center gap-2 px-4 py-2 bg-[#293a90] text-white text-sm font-medium rounded-lg hover:bg-[#1f2c6d] transition-colors disabled:opacity-50"
                  >
                    {isBulkPrinting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Printer className="w-4 h-4" />
                    )}
                    Print Selected ({selectedOrders.length})
                  </button>
                )}

                <button
                  onClick={handleGenerateManifest}
                  disabled={isGeneratingManifest}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-[#293a90] border border-blue-200 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
                >
                  {isGeneratingManifest ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                  Generate Manifest
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left w-12">
                    <input
                      type="checkbox"
                      checked={isAllPageSelected}
                      onChange={handleSelectAll}
                      disabled={shippablePageItems.length === 0}
                      className="w-4 h-4 text-[#293a90] border-gray-300 rounded focus:ring-[#293a90] disabled:opacity-50 cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shipment Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedData.map((record) => {
                  const isShippable = record.waybill || record.returnWaybill;

                  return (
                    <tr
                      key={record.key}
                      className={`${selectedOrders.includes(record.id)
                        ? "bg-indigo-50/50"
                        : "hover:bg-gray-50"
                        } transition-colors`}
                    >
                      <td className="px-6 py-4">
                        {isShippable ? (
                          <input
                            type="checkbox"
                            checked={selectedOrders.includes(record.id)}
                            onChange={(e) => handleSelectOne(e, record.id)}
                            className="w-4 h-4 text-[#293a90] border-gray-300 rounded focus:ring-[#293a90] cursor-pointer"
                          />
                        ) : (
                          <input
                            type="checkbox"
                            disabled
                            className="w-4 h-4 border-gray-200 rounded opacity-30 cursor-not-allowed"
                            title="No AWB generated to print"
                          />
                        )}
                      </td>
                      <td
                        className="px-6 py-4 cursor-pointer"
                        onClick={() => handleViewDetails(record.id, record.orderDetails)}
                      >
                        <span className="text-sm font-medium text-[#293a90] hover:underline">
                          {record.id.slice(-6).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">{record.date}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {record.customer}
                      </td>
                      <td className="px-6 py-4">
                        {/* Dropdown Fix: Dynamic Option Rendering */}
                        <select
                          value={record.orderStatus}
                          onChange={(e) => handleStatusChange(record, e.target.value)}
                          className={`px-3 py-1 text-sm rounded-full border font-medium outline-none ${getStatusColor(record.orderStatus)}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>

                          {/* Agar status standard nahi hai, to dropdown me explicitly add kar do */}
                          {!STANDARD_OPTIONS.includes(record.orderStatus) && (
                            <option value={record.orderStatus}>
                              {String(record.orderStatus).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </option>
                          )}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 font-medium">
                          {record.paymentStatus}
                        </span>
                      </td>

                      {/* Shipment Column Logic */}
                      <td className="px-6 py-4 align-middle">
                        {/* 1. Forward Shipment Action */}
                        {record.orderStatus === "shipped" && record.waybill ? (
                          <div className="flex flex-col gap-1.5 w-[140px]">
                            <button
                              type="button"
                              onClick={() => handleSchedulePickup(record)}
                              className="w-full px-2 py-1.5 text-[11px] font-medium rounded bg-[#293a90] text-white hover:bg-[#1f2c6d] shadow-sm transition-all"
                            >
                              Schedule Pickup
                            </button>
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleDownloadLabel(record)}
                                className="flex-1 px-2 py-1 text-[10px] font-medium rounded bg-blue-50 text-[#293a90] border border-blue-100 hover:bg-blue-100 transition-all"
                              >
                                Label
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCancelShipment(record)}
                                className="flex-1 px-2 py-1 text-[10px] font-medium rounded bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition-all"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )
                          /* 2. Cancelled Flow */
                          : record.orderStatus === "cancelled" || record.orderStatus === "return_rejected" ? (
                            <span className="inline-block px-2.5 py-1 text-xs font-medium rounded-full bg-red-50 text-red-700 border border-red-200 text-center">
                              {record.orderStatus === "return_rejected" ? "Return Rejected" : "Cancelled"}
                            </span>
                          )

                            /* 3. Default Flow (Ship now button for standard confirmed orders) */
                            : (
                              <button
                                type="button"
                                onClick={() => handleShipOrder(record)}
                                disabled={record.orderStatus !== "confirmed"}
                                className={`w-full px-2 py-1.5 text-[11px] font-medium rounded ${record.orderStatus === "confirmed"
                                  ? "bg-[#293a90] text-white border-[#293a90] hover:bg-[#1f2c6d]"
                                  : "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                                  }`}
                              >
                                Ship now
                              </button>
                            )}
                      </td>

                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">{record.total}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 flex-wrap">
                          <button
                            onClick={() => handleViewDetails(record.id, record.orderDetails)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-105"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleEditOrder(record.id, record.orderDetails)}
                            className="p-2 text-[#293a90] hover:bg-[#293a90]/10 rounded-lg transition-all duration-200 hover:scale-105"
                            title="Edit Order"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteOrder(record.id, record.customer)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-105"
                            title="Delete Order"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {paginatedData.length === 0 && !loading && (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                      <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <span className="text-sm">No orders found</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

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
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = currentPage <= 3 ? i + 1 : totalPages - 4 + i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 text-sm rounded-lg ${currentPage === page
                          ? "bg-[#293a90] text-white border border-[#293a90]"
                          : "border border-gray-300 hover:bg-gray-50"
                          }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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