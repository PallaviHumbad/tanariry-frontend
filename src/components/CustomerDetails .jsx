import React, { useState, useEffect } from "react";
import { Link, useParams, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Star,
  Edit,
  Save,
  X,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Eye,
  Plus,
  User,
  Trash2,
  PackageCheck,
  RotateCcw,
} from "lucide-react";
import useCustomerStore from "../store/useCustomerStore";
import useOrderStore from "../store/useOrderStore";
import { toast } from "react-toastify";

const CustomerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { currentCustomer, fetchCustomerById, updateCustomer } = useCustomerStore();
  const { fetchOrdersByCustomerId } = useOrderStore();

  const [orders, setOrders] = useState([]);
  const [editedCustomer, setEditedCustomer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [activeTab, setActiveTab] = useState("orders");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [savedAddress, setSavedAddress] = useState(null);
  const [addressFormData, setAddressFormData] = useState({});

  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    setEditedCustomer(null);
    setOrders([]);
    setIsLoading(true);

    const loadData = async () => {
      try {
        await fetchCustomerById(id);

        if (location.state?.orders && location.state.customer?.key === id) {
          setOrders(location.state.orders);
        } else {
          const response = await fetchOrdersByCustomerId(id);
          setOrders(response.data || []);
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load customer data");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id, fetchCustomerById, fetchOrdersByCustomerId, location.state]);

  useEffect(() => {
    if (currentCustomer && currentCustomer._id === id) {
      setEditedCustomer(currentCustomer);
    }
  }, [currentCustomer, id]);

  const getTimeAgo = (invoiceDate) => {
    if (!invoiceDate) return "N/A";
    const lastDate = new Date(invoiceDate);
    const now = new Date();
    const diffMs = now - lastDate;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (diffDays < 1) return "Today";
    if (diffDays < 30) return `${Math.floor(diffDays)} day(s) ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} month(s) ago`;
    return `${Math.floor(diffDays / 365)} year(s) ago`;
  };

  const computeOrderAggregates = (orderList) => {
    if (!orderList || orderList.length === 0) {
      return {
        lastOrderTime: "No orders",
        totalSpent: "₹0.00",
        averageOrder: "₹0.00",
        totalOrders: "0",
      };
    }

    const totalOrders = orderList.length;
    const totalSpent = orderList.reduce(
      (acc, order) => acc + parseFloat(order.paymentTotal || order.totalAmount || order.total || 0),
      0
    );
    const averageOrder = totalSpent / totalOrders;

    const sortedOrders = [...orderList].sort((a, b) => {
      const dateA = new Date(a.invoiceDetails?.[0]?.invoiceDate || a.createdAt);
      const dateB = new Date(b.invoiceDetails?.[0]?.invoiceDate || b.createdAt);
      return dateB - dateA;
    });

    const lastOrder = sortedOrders[0];
    const lastOrderDate = lastOrder?.invoiceDetails?.[0]?.invoiceDate || lastOrder?.createdAt;

    return {
      lastOrderTime: getTimeAgo(lastOrderDate),
      totalSpent: `₹${totalSpent.toFixed(2)}`,
      averageOrder: `₹${averageOrder.toFixed(2)}`,
      totalOrders: totalOrders.toString(),
    };
  };

  const orderAggregates = computeOrderAggregates(orders);

  const filteredOrders = orders.map((order) => ({
    id: order.orderNumber || order.invoiceDetails?.[0]?.invoiceNo || order._id.slice(-6).toUpperCase(),
    date: order.invoiceDetails?.[0]?.invoiceDate || order.createdAt,
    status: order.paymentStatus || order.status || "Pending",
    items: order.items?.length || 0,
    amount: parseFloat(order.paymentTotal || order.totalAmount || 0),
    rawDate: new Date(order.invoiceDetails?.[0]?.invoiceDate || order.createdAt)
  })).filter((order) => {
    if (statusFilter !== "all" && order.status !== statusFilter) return false;
    if (dateFilter !== "all") {
      const today = new Date();
      const daysDiff = Math.floor((today - order.rawDate) / (1000 * 60 * 60 * 24));
      switch (dateFilter) {
        case "week": if (daysDiff > 7) return false; break;
        case "month": if (daysDiff > 30) return false; break;
        case "quarter": if (daysDiff > 90) return false; break;
      }
    }
    return true;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleOpenModal = (isEdit = false, address = null) => {
    setIsEditing(isEdit);
    setSavedAddress(address);
    setAddressFormData(isEdit && address ? address : {});
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSavedAddress(null);
    setAddressFormData({});
  };

  const handleModalSubmit = (e) => {
    e.preventDefault();
    if (isEditing) {
      setEditedCustomer((prev) => ({
        ...prev,
        addresses: prev.addresses.map((addr) =>
          addr._id === savedAddress._id ? { ...addr, ...addressFormData } : addr
        ),
      }));
      toast.success("Address updated locally");
    } else {
      const newAddress = { ...addressFormData, _id: Date.now().toString() };
      setEditedCustomer((prev) => ({
        ...prev,
        addresses: [...prev.addresses, newAddress],
      }));
      toast.success("Address added locally");
    }
    handleCloseModal();
  };

  const handleDeleteAddress = (address) => {
    setEditedCustomer((prev) => ({
      ...prev,
      addresses: prev.addresses.filter((addr) => addr !== address),
    }));
    toast.success("Address removed");
  };

  const handleSaveChanges = async () => {
    try {
      setIsSaving(true);
      const updatedData = {
        email: editedCustomer.email,
        phone: editedCustomer.phone,
        addresses: editedCustomer.addresses,
      };
      await updateCustomer(id, updatedData);
      toast.success("Customer updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update customer");
    } finally {
      setIsSaving(false);
    }
  };

  const formatINR = (amount) => `₹${parseFloat(amount).toFixed(2)}`;
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric", month: "short", day: "numeric",
    });
  };

  const getStatusColor = (status) => {
    const s = status?.toLowerCase() || "";
    if (s === "confirmed" || s === "paid" || s === "delivered") return "bg-green-50 text-green-700 border-green-200";
    if (s === "cancelled") return "bg-red-50 text-red-700 border-red-200";
    if (s === "pending" || s === "processing") return "bg-blue-50 text-blue-700 border-blue-200";
    if (s === "return_completed" || s === "returned") return "bg-gray-50 text-gray-700 border-gray-200";
    return "bg-gray-50 text-gray-700 border-gray-200";
  };

  const getStatusIcon = (status) => {
    const s = status?.toLowerCase() || "";
    if (s === "confirmed" || s === "paid") return <CheckCircle className="w-3.5 h-3.5" />;
    if (s === "delivered") return <PackageCheck className="w-3.5 h-3.5" />;
    if (s === "cancelled") return <XCircle className="w-3.5 h-3.5" />;
    if (s === "pending" || s === "processing") return <Clock className="w-3.5 h-3.5" />;
    if (s === "return_completed" || s === "returned") return <RotateCcw className="w-3.5 h-3.5" />;
    return <AlertCircle className="w-3.5 h-3.5" />;
  };

  if (!editedCustomer) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 font-sans">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#293a90] mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm">Loading customer details...</p>
        </div>
      </div>
    );
  }

  const customerDisplay = {
    id: `CUST-${String(id).slice(-4).toUpperCase()}`,
    name: `${editedCustomer.firstName} ${editedCustomer.lastName}`,
    email: editedCustomer.email,
    phone: editedCustomer.phone,
    status: editedCustomer.isActive ? "Active" : "Inactive",
    totalSpend: orderAggregates.totalSpent
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="p-4 w-full">
        <div className="flex flex-col">
          <div className="flex justify-between items-center py-2 mb-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/customers")}
                className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft size={14} /> Back
              </button>
            </div>
            <button
              onClick={handleSaveChanges}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 text-xs bg-[#293a90] text-white px-4 py-2 rounded-lg hover:bg-[#293a90]/90 transition-colors"
            >
              <Save size={14} /> {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="flex items-start space-x-6">
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-blue-600" />
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">{customerDisplay.name}</h2>
                      <p className="text-xs text-gray-500">Customer ID: {customerDisplay.id}</p>
                      <div className="flex items-center space-x-1 mt-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-current" />
                        <span className="text-xs text-gray-600">{customerDisplay.status} Customer</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">{customerDisplay.totalSpend}</div>
                      <div className="text-xs text-gray-500">Total Lifetime Value</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center"><Mail size={14} /></div>
                      <div><p className="text-gray-400 text-[10px] uppercase">Email</p><p className="font-medium">{customerDisplay.email}</p></div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center"><Phone size={14} /></div>
                      <div><p className="text-gray-400 text-[10px] uppercase">Phone</p><p className="font-medium">{customerDisplay.phone}</p></div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center"><MapPin size={14} /></div>
                      <div><p className="text-gray-400 text-[10px] uppercase">Location</p><p className="font-medium">{editedCustomer.addresses?.[0]?.city || "N/A"}</p></div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center"><Clock size={14} /></div>
                      <div><p className="text-gray-400 text-[10px] uppercase">Last Order</p><p className="font-medium">{orderAggregates.lastOrderTime}</p></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex border-t border-gray-200 bg-gray-50">
              <button onClick={() => setActiveTab("orders")} className={`flex-1 py-3 text-xs font-medium border-b-2 transition-colors ${activeTab === "orders" ? "border-[#293a90] text-[#293a90] bg-white" : "border-transparent text-gray-500 hover:text-gray-700"}`}>Order History</button>
              <button onClick={() => setActiveTab("addresses")} className={`flex-1 py-3 text-xs font-medium border-b-2 transition-colors ${activeTab === "addresses" ? "border-[#293a90] text-[#293a90] bg-white" : "border-transparent text-gray-500 hover:text-gray-700"}`}>Addresses ({editedCustomer.addresses?.length || 0})</button>
            </div>
          </div>

          <div className="space-y-6">
            {activeTab === "orders" && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex justify-between">
                    <div><p className="text-xs text-gray-500 font-medium">Total Spend</p><h3 className="text-lg font-bold text-gray-900 mt-1">{orderAggregates.totalSpent}</h3></div>
                    <div className="p-2 bg-blue-50 rounded-lg"><DollarSign className="w-4 h-4 text-blue-600" /></div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex justify-between">
                    <div><p className="text-xs text-gray-500 font-medium">Total Orders</p><h3 className="text-lg font-bold text-gray-900 mt-1">{orderAggregates.totalOrders}</h3></div>
                    <div className="p-2 bg-purple-50 rounded-lg"><ShoppingBag className="w-4 h-4 text-purple-600" /></div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex justify-between">
                    <div><p className="text-xs text-gray-500 font-medium">Average Order</p><h3 className="text-lg font-bold text-gray-900 mt-1">{orderAggregates.averageOrder}</h3></div>
                    <div className="p-2 bg-green-50 rounded-lg"><TrendingUp className="w-4 h-4 text-green-600" /></div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex justify-between">
                    <div><p className="text-xs text-gray-500 font-medium">Last Order</p><h3 className="text-lg font-bold text-gray-900 mt-1">{orderAggregates.lastOrderTime}</h3></div>
                    <div className="p-2 bg-orange-50 rounded-lg"><Clock className="w-4 h-4 text-orange-600" /></div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50">
                    <h3 className="text-sm font-semibold text-gray-900">Recent Orders</h3>
                    <div className="flex items-center gap-2">
                      <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 bg-white">
                        <option value="all">All Status</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Pending">Pending</option>
                        <option value="Cancelled">Cancelled</option>
                        <option value="Delivered">Delivered</option>
                        <option value="return_completed">Returned</option>
                      </select>
                      <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 bg-white">
                        <option value="all">All Time</option>
                        <option value="week">Last Week</option>
                        <option value="month">Last Month</option>
                        <option value="quarter">Last Quarter</option>
                      </select>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium">Order ID</th>
                          <th className="px-4 py-3 text-left font-medium">Date</th>
                          <th className="px-4 py-3 text-left font-medium">Status</th>
                          <th className="px-4 py-3 text-left font-medium">Items</th>
                          <th className="px-4 py-3 text-left font-medium">Amount</th>
                          <th className="px-4 py-3 text-right font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 text-xs">
                        {paginatedOrders.length > 0 ? (
                          paginatedOrders.map((order, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 font-medium text-blue-600">{order.id}</td>
                              <td className="px-4 py-3 text-gray-600">{formatDate(order.date)}</td>
                              <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${getStatusColor(order.status)}`}>{getStatusIcon(order.status)}{order.status}</span></td>
                              <td className="px-4 py-3 text-gray-600">{order.items} items</td>
                              <td className="px-4 py-3 font-medium text-gray-900">{formatINR(order.amount)}</td>
                              <td className="px-4 py-3 text-right"><button className="text-blue-600 hover:bg-blue-50 p-1.5 rounded transition-colors"><Eye size={14} /></button></td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan="6" className="px-4 py-8 text-center text-gray-500">No orders found</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {totalPages > 1 && (
                    <div className="border-t border-gray-200 px-4 py-3 flex items-center justify-between bg-gray-50">
                      <span className="text-xs text-gray-500">Page {currentPage} of {totalPages}</span>
                      <div className="flex gap-2">
                        <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-3 py-1 text-xs border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50">Previous</button>
                        <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="px-3 py-1 text-xs border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50">Next</button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === "addresses" && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                  <h3 className="text-sm font-semibold text-gray-900">Saved Addresses</h3>
                  <button onClick={() => handleOpenModal(false)} className="inline-flex items-center gap-1.5 bg-[#293a90] text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-[#293a90]/90 transition-colors"><Plus size={14} /> Add New</button>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {editedCustomer.addresses && editedCustomer.addresses.length > 0 ? (
                    editedCustomer.addresses.map((address, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors relative group bg-gray-50/50">
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleOpenModal(true, address)} className="p-1.5 bg-white text-blue-600 border border-gray-200 rounded hover:bg-blue-50"><Edit size={12} /></button>
                          <button onClick={() => handleDeleteAddress(address)} className="p-1.5 bg-white text-red-600 border border-gray-200 rounded hover:bg-red-50"><Trash2 size={12} /></button>
                        </div>
                        <div className="flex items-center gap-2 mb-2"><MapPin size={16} className="text-blue-600" /><span className="text-xs font-bold text-gray-700 uppercase">Address #{index + 1}</span></div>
                        <div className="text-xs text-gray-700 space-y-1">
                          <p className="font-medium">Address: {address.address}</p>
                          <p>City: {address.city}</p>
                          <p>Pincode: {address.pincode}</p>
                          <p>State: {address.state}</p>
                          <p>Country: {address.country}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center text-gray-500 py-8"><MapPin size={32} className="mx-auto mb-2 text-gray-300" /><p className="text-xs">No addresses found</p></div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {isModalVisible && (
          <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">{isEditing ? "Edit Address" : "Add Address"}</h3>
                <button onClick={handleCloseModal} className="p-1 hover:bg-gray-100 rounded transition-colors"><X size={16} className="text-gray-400" /></button>
              </div>
              <form onSubmit={handleModalSubmit} className="p-4 space-y-4">
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Address</label><input type="text" value={addressFormData.address || ""} onChange={(e) => setAddressFormData((prev) => ({ ...prev, address: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-xs" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-medium text-gray-700 mb-1">City</label><input type="text" value={addressFormData.city || ""} onChange={(e) => setAddressFormData((prev) => ({ ...prev, city: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-xs" /></div>
                  <div><label className="block text-xs font-medium text-gray-700 mb-1">Pincode</label><input type="text" value={addressFormData.pincode || ""} onChange={(e) => setAddressFormData((prev) => ({ ...prev, pincode: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-xs" /></div>
                  <div><label className="block text-xs font-medium text-gray-700 mb-1">State</label><input type="text" value={addressFormData.state || ""} onChange={(e) => setAddressFormData((prev) => ({ ...prev, state: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-xs" /></div>
                  <div><label className="block text-xs font-medium text-gray-700 mb-1">Country</label><input type="text" value={addressFormData.country || ""} onChange={(e) => setAddressFormData((prev) => ({ ...prev, country: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-xs" /></div>
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                  <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-xs text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-xs bg-[#293a90] hover:bg-[#293a90]/90 text-white rounded-lg">{isEditing ? "Update" : "Add"}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDetails;
