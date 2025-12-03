import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  ChevronDown,
  Download,
  RefreshCw,
  Users,
  CheckCircle,
  Repeat,
  Crown,
  Mail,
  MapPin,
  Filter,
  X,
  Phone,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import useCustomerStore from "../store/useCustomerStore";
import useOrderStore from "../store/useOrderStore"; // Updated import path based on your snippet
import useUserStore from "../store/useUserStore";
import { toast } from "react-toastify";

const Customer = () => {
  const navigate = useNavigate();

  // Store Hooks
  const { fetchCustomers, customers } = useCustomerStore();
  const { toggleStatus } = useUserStore();
  // Using the specific function from your useOrderStore snippet
  const { fetchOrdersByCustomerId } = useOrderStore();

  // State
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [sortBy, setSortBy] = useState("totalSpent");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Initial Data Load
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch all customers first
      const customerRes = await fetchCustomers();

      // Handle different response structures safely
      let customersList = [];
      if (Array.isArray(customerRes)) {
        customersList = customerRes;
      } else if (customerRes?.data && Array.isArray(customerRes.data)) {
        customersList = customerRes.data;
      } else if (customers?.data && Array.isArray(customers.data)) {
        customersList = customers.data; // Fallback to store state
      }

      if (!customersList || customersList.length === 0) {
        setData([]);
        setFilteredData([]);
        return;
      }

      // 2. Transform customer data and fetch their specific order stats
      // Note: Doing this for all customers might be heavy. 
      // For production, this is usually done on the backend aggregation.
      // Here we map existing data and defaults first.

      const customersWithStats = await Promise.all(
        customersList.map(async (cust) => {
          try {
            // Fetch orders for this specific customer using your store function
            const orderRes = await fetchOrdersByCustomerId(cust._id);
            const customerOrders = orderRes?.data || [];

            // Calculate aggregates locally based on fetched orders
            const noOfOrders = customerOrders.length;

            const totalSpent = customerOrders.reduce((acc, order) => {
              const amount = parseFloat(
                order.paymentTotal || order.totalAmount || order.total || 0
              );
              return acc + amount;
            }, 0);

            // Find last order
            let lastOrderDate = null;
            if (customerOrders.length > 0) {
              // Sort by date descending
              customerOrders.sort((a, b) => {
                const dateA = new Date(a.createdAt || a.orderDate);
                const dateB = new Date(b.createdAt || b.orderDate);
                return dateB - dateA;
              });

              const latest = customerOrders[0];
              lastOrderDate = latest.createdAt || latest.orderDate;
            }

            return {
              key: cust._id,
              id: `CUST-${cust._id.slice(-4).toUpperCase()}`,
              name: `${cust.firstName} ${cust.lastName}`,
              email: cust.email,
              phone: cust.phone || "",
              primaryBranch: cust.addresses?.[0]?.city || "N/A",
              orders: noOfOrders,
              totalSpent: totalSpent.toFixed(2),
              lastOrderDate: lastOrderDate,
              status: cust.isActive ? "active" : "inactive",
              // Keep raw orders if needed for navigation state
              rawOrders: customerOrders
            };

          } catch (err) {
            console.error(`Failed to fetch orders for customer ${cust._id}`, err);
            // Return customer with zero stats on error
            return {
              key: cust._id,
              id: `CUST-${cust._id.slice(-4).toUpperCase()}`,
              name: `${cust.firstName} ${cust.lastName}`,
              email: cust.email,
              phone: cust.phone || "",
              primaryBranch: cust.addresses?.[0]?.city || "N/A",
              orders: 0,
              totalSpent: "0.00",
              lastOrderDate: null,
              status: cust.isActive ? "active" : "inactive",
              rawOrders: []
            };
          }
        })
      );

      setData(customersWithStats);
      setFilteredData(customersWithStats);

    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error("Failed to load customer data");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Filtering and Sorting Logic ---
  useEffect(() => {
    if (!data || data.length === 0) {
      setFilteredData([]);
      return;
    }

    let result = [...data];

    // Search Filter
    if (searchText.trim()) {
      const lowerSearch = searchText.toLowerCase();
      result = result.filter((item) =>
        Object.values(item).some((val) =>
          String(val).toLowerCase().includes(lowerSearch)
        )
      );
    }

    // Sorting Logic
    result.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "orders":
          aValue = Number(a.orders);
          bValue = Number(b.orders);
          break;
        case "totalSpent":
          aValue = parseFloat(a.totalSpent);
          bValue = parseFloat(b.totalSpent);
          break;
        case "lastOrderDate":
          aValue = a.lastOrderDate ? new Date(a.lastOrderDate).getTime() : 0;
          bValue = b.lastOrderDate ? new Date(b.lastOrderDate).getTime() : 0;
          break;
        default:
          aValue = a[sortBy];
          bValue = b[sortBy];
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    setFilteredData(result);
    setCurrentPage(1);
  }, [data, searchText, sortBy, sortOrder]);

  // --- Helper Functions ---

  const handleExport = () => {
    const headers = ["Name", "Email", "Phone", "Orders", "Total Spent", "Last Order", "Location"];
    const rows = filteredData.map(c => [
      c.name, c.email, c.phone, c.orders, c.totalSpent,
      c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString() : "-",
      c.primaryBranch
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(field => `"${field}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleCustomerClick = (record) => {
    // We already fetched orders in loadAllData, pass them to avoid re-fetching
    navigate(`/customers/${record.key}`, {
      state: { customer: record, orders: record.rawOrders },
    });
  };

  const handleStatusChange = async (customer, value) => {
    try {
      // Optimistic update
      setData(prev => prev.map(c => c.key === customer.key ? { ...c, status: value } : c));
      await toggleStatus(customer.key, value);
      toast.success(`Customer ${value === "active" ? "activated" : "deactivated"}`);
    } catch (error) {
      // Revert on failure
      setData(prev => prev.map(c => c.key === customer.key ? { ...c, status: customer.status } : c));
      toast.error("Failed to update status");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric"
    });
  };

  const getStatusColor = (status) => {
    return status === "active"
      ? "bg-green-50 text-green-700 border-green-200"
      : "bg-red-50 text-red-700 border-red-200";
  };

  // --- Pagination ---
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedCustomers = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // --- Stats Calculation ---
  const stats = {
    total: data.length,
    active: data.filter(c => c.status === "active").length,
    returning: data.filter(c => c.orders > 1).length,
    highValue: data.filter(c => parseFloat(c.totalSpent) > 5000).length // Adjusted threshold
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="p-4 w-full">
        {/* Header Actions */}
        <div className="flex items-center justify-end gap-2 mb-4">
          <button onClick={loadAllData} disabled={isLoading} className="inline-flex items-center gap-1 px-3 py-2 text-xs text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200 bg-white">
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} /> Refresh
          </button>
          <button onClick={handleExport} className="inline-flex items-center gap-1 px-3 py-2 text-xs text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200 bg-white">
            <Download size={14} /> Export
          </button>
          <button onClick={() => navigate("/users/add-user")} className="inline-flex items-center gap-2 bg-[#293a90] hover:bg-[#293a90]/90 text-white px-4 py-2 rounded-lg text-sm font-medium">
            <Plus size={16} /> Add Customer
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {[
            { label: "Total Customers", value: stats.total, icon: Users, color: "text-[#293a90]", bg: "bg-[#293a90]/10" },
            { label: "Active Customers", value: stats.active, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
            { label: "Returning", value: stats.returning, icon: Repeat, color: "text-[#eb0082]", bg: "bg-[#eb0082]/10" },
            { label: "High-Value (>5k)", value: stats.highValue, icon: Crown, color: "text-amber-600", bg: "bg-amber-50" },
          ].map((stat, idx) => (
            <div key={idx} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">{stat.label}</p>
                  <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-2 rounded-md ${stat.bg}`}><stat.icon className={`h-4 w-4 ${stat.color}`} /></div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3" />
              <input
                type="text"
                placeholder="Search name, email, phone..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-[#293a90] outline-none"
              />
            </div>

            <div className="flex gap-2">
              <button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} className="inline-flex items-center gap-1 px-3 py-2 text-xs border border-gray-300 rounded-lg hover:bg-gray-50">
                <Filter size={12} /> Filters <ChevronDown size={12} className={showAdvancedFilters ? "rotate-180" : ""} />
              </button>
              <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} className="border border-gray-300 rounded-lg px-2 py-1 text-xs outline-none">
                <option value={10}>10 rows</option>
                <option value={20}>20 rows</option>
                <option value={50}>50 rows</option>
              </select>
            </div>
          </div>

          {showAdvancedFilters && (
            <div className="flex flex-wrap gap-3 pt-3 mt-3 border-t border-gray-100">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-xs outline-none">
                <option value="totalSpent">Sort by Spend</option>
                <option value="orders">Sort by Orders</option>
                <option value="name">Sort by Name</option>
                <option value="lastOrderDate">Sort by Last Order</option>
              </select>
              <button onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")} className="px-3 py-2 text-xs border border-gray-300 rounded-lg hover:bg-gray-50">
                {sortOrder === "asc" ? "Ascending" : "Descending"}
              </button>
              <button onClick={() => { setSearchText(""); setSortBy("totalSpent"); setShowAdvancedFilters(false); }} className="px-3 py-2 text-xs text-red-500 bg-red-50 rounded-lg hover:bg-red-100">
                Clear All
              </button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="py-12 text-center flex flex-col items-center">
              <RefreshCw className="h-8 w-8 text-[#293a90] animate-spin mb-2" />
              <span className="text-sm text-gray-500">Loading customer data...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {["Customer", "Email", "Phone", "Orders", "Total Spent", "Last Order", "Location", "Status"].map((head) => (
                      <th key={head} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedCustomers.length > 0 ? paginatedCustomers.map((customer) => (
                    <tr
                      key={customer.key}
                      onClick={() => handleCustomerClick(customer)}
                      className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4">
                        <div className="font-medium text-sm text-[#293a90]">{customer.name}</div>
                        <div className="text-[10px] text-gray-400">{customer.id}</div>
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-600">
                        <div className="flex items-center gap-1.5"><Mail size={12} className="text-gray-400" /> {customer.email || "-"}</div>
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-600">
                        <div className="flex items-center gap-1.5"><Phone size={12} className="text-gray-400" /> {customer.phone || "-"}</div>
                      </td>
                      <td className="py-3 px-4 text-xs font-medium">{customer.orders}</td>
                      <td className="py-3 px-4 text-xs font-bold text-gray-700">₹{customer.totalSpent}</td>
                      <td className="py-3 px-4 text-xs text-gray-600">{formatDate(customer.lastOrderDate)}</td>
                      <td className="py-3 px-4 text-xs text-gray-600">
                        <div className="flex items-center gap-1.5"><MapPin size={12} className="text-gray-400" /> {customer.primaryBranch}</div>
                      </td>
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={customer.status}
                          onChange={(e) => handleStatusChange(customer, e.target.value)}
                          className={`px-2 py-1 text-[10px] rounded-full border font-medium uppercase tracking-wide outline-none cursor-pointer ${getStatusColor(customer.status)}`}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-gray-500 text-sm">
                        No customers found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && paginatedCustomers.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Customer;
