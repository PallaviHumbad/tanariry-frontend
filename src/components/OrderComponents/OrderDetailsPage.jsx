import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { ArrowLeft, Edit3, Printer, Package, MapPin, User, Mail, Phone, Calendar, CreditCard } from "lucide-react";
import useOrderStore from "../../store/useOrderStore";

const IMAGE = import.meta.env.VITE_IMAGE;

const OrderDetailsPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { fetchOrderById, order, loading: storeLoading } = useOrderStore();
  const [localLoading, setLocalLoading] = useState(false);

  useEffect(() => {
    const orderId = id || location.state?.order?._id;
    if (orderId) {
      const getOrderById = async () => {
        setLocalLoading(true);
        try {
          await fetchOrderById(orderId);
        } catch (error) {
          toast.error("Failed to load order details");
        } finally {
          setLocalLoading(false);
        }
      };
      getOrderById();
    }
  }, [id, location.state?.order?._id, fetchOrderById]);

  const currentOrder = order || location.state?.order || {};

  if (storeLoading || localLoading || (!order && Object.keys(currentOrder).length === 0)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#293a90] mx-auto mb-3"></div>
          <p className="text-sm text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order && Object.keys(currentOrder).length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Order Found</h2>
          <p className="text-sm text-gray-600">Please select an order from the table.</p>
        </div>
      </div>
    );
  }

  const activeOrder = order || currentOrder;
  const handleBack = () => navigate("../");
  const handlePrint = () => window.print();
  const handleUpdate = () => {
    const orderId = order?._id || currentOrder._id;
    if (orderId) {
      navigate(`../order-update/${orderId}`, { state: { order: order || currentOrder } });
    }
  };

  const formatINR = (amount) => {
    const value = (parseFloat(amount || 0) / 100).toFixed(2);
    return `₹${parseFloat(value).toLocaleString("en-IN")}`;
  };

  const formatDate = (dateString) =>
    dateString && !isNaN(new Date(dateString))
      ? new Date(dateString).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
      : "N/A";

  const getStatusBadge = (status) => {
    const badges = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
      confirmed: "bg-green-100 text-green-800 border-green-300",
      shipped: "bg-blue-100 text-blue-800 border-blue-300",
      delivered: "bg-purple-100 text-purple-800 border-purple-300",
      cancelled: "bg-red-100 text-red-800 border-red-300",
    };
    return badges[status] || badges.pending;
  };

  // NEW: Function for payment status colors
  const getPaymentStatusBadge = (status) => {
    const badges = {
      paid: "bg-green-100 text-green-800 border-green-300",
      pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
      failed: "bg-red-100 text-red-800 border-red-300"
    };
    return badges[status] || "bg-gray-100 text-gray-800 border-gray-300";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="print:hidden mb-6">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={16} />
            <span>Orders</span>
          </button>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                Order ID: {activeOrder._id?.slice(-8).toUpperCase()}
              </h1>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  <span>{formatDate(activeOrder.createdAt)}</span>
                </div>
                <span className={`px-3 py-1 rounded-full border text-xs font-medium ${getStatusBadge(activeOrder.status)}`}>
                  {activeOrder.status?.charAt(0).toUpperCase() + activeOrder.status?.slice(1) || "Pending"}
                </span>
                {/* UPDATED: Payment status badge in header */}
                <span className={`px-3 py-1 rounded-full border text-xs font-medium ${getPaymentStatusBadge(activeOrder.paymentInfo?.status)}`}>
                  {activeOrder.paymentInfo?.status === "pending" ? "Payment pending" : "Paid"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleUpdate}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Edit3 size={16} />
                Edit
              </button>
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Printer size={16} />
                Print
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Grid - EQUAL HEIGHT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 lg:items-start gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex-1 flex flex-col">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Package size={18} className="text-gray-400" />
                  Order items ({activeOrder.items?.length || 0})
                </h2>
              </div>
              <div className="divide-y divide-gray-200 flex-1">
                {(activeOrder.items || []).map((item, index) => (
                  <div key={index} className="px-6 py-4 flex items-start gap-4">
                    {item.productId?.productImages?.[0] && (
                      <img
                        src={`${IMAGE}${item.productId.productImages[0]}`}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900">{item.name || "Unknown Product"}</h3>
                      <div className="mt-1 flex items-center gap-4 text-xs text-gray-600">
                        <span>Qty: {item.quantity}</span>
                        <span>×</span>
                        <span className="font-medium">{formatINR(item.price)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{formatINR(item.subtotal)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium text-gray-900">{formatINR(activeOrder.totalAmount)}</span>
                  </div>
                  {/* <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium text-gray-900">₹0.00</span>
                  </div> */}
                  <div className="pt-2 border-t border-gray-200 flex justify-between">
                    <span className="text-base font-semibold text-gray-900">Total</span>
                    <span className="text-lg font-bold text-gray-900">{formatINR(activeOrder.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <CreditCard size={18} className="text-gray-400" />
                  Payment information
                </h2>
              </div>
              <div className="px-6 py-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Payment Status</span>
                  {/* UPDATED: Payment status badge in card */}
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getPaymentStatusBadge(activeOrder.paymentInfo?.status)}`}>
                    {activeOrder.paymentInfo?.status?.toUpperCase() || "PENDING"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Razorpay Order ID</span>
                  <span className="font-mono text-xs text-gray-900">{activeOrder.paymentInfo?.razorpayOrderId || "N/A"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Amount</span>
                  <span className="font-semibold text-gray-900">{formatINR(activeOrder.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="bg-white rounded-lg border border-gray-200 flex flex-col h-full">
            <div className="flex-1">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Customer</h2>
                <div className="flex items-start gap-3">
                  <User size={16} className="text-gray-400 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">
                      {activeOrder.customerId?.firstName} {activeOrder.customerId?.lastName}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">1 Order</p>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Contact information</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-900">{activeOrder.customerId?.email || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-900">{activeOrder.customerId?.phone || "No phone number"}</span>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4">
                  <MapPin size={18} className="text-gray-400" />
                  Shipping address
                </h2>
                <div className="text-sm text-gray-900 space-y-1">
                  <p className="font-medium">
                    {activeOrder.customerId?.firstName} {activeOrder.customerId?.lastName}
                  </p>
                  <p>{activeOrder.shippingAddress?.address || "N/A"}</p>
                  <p>
                    {activeOrder.shippingAddress?.city}, {activeOrder.shippingAddress?.state}{" "}
                    {activeOrder.shippingAddress?.pincode}
                  </p>
                  <p>{activeOrder.shippingAddress?.country || "India"}</p>
                  <p className="pt-2 text-gray-600">{activeOrder.customerId?.phone || "N/A"}</p>
                </div>
              </div>
              {activeOrder.isReturnable !== undefined && (
                <div className="px-6 py-4">
                  <h2 className="text-base font-semibold text-gray-900 mb-4">Return policy</h2>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Returnable</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${activeOrder.isReturnable
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                      }`}>
                      {activeOrder.isReturnable ? `Yes (${activeOrder.returnWindowDays} days)` : "No"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;
