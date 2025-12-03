import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  ChevronDown,
  User,
  RefreshCw,
  Trash2,
  X,
  Calendar,
  Mail,
  Phone,
  Hash,
} from "lucide-react";
import useSupportStore from "../store/useSupportStore";

// --- Ticket Details Modal Component ---
const TicketDetailsModal = ({ ticket, onClose, onStatusChange, onDelete }) => {
  if (!ticket) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "resolved":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "resolved":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex justify-between items-start p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-3 mb-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border uppercase tracking-wide ${getStatusColor(
                  ticket.status
                )}`}
              >
                {getStatusIcon(ticket.status)}
                {ticket.status}
              </span>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Hash size={12} /> {ticket._id}
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 leading-tight">
              {ticket.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="p-6 overflow-y-auto space-y-8">
          {/* Customer Info Section */}
          <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100">
            <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <User size={14} /> Customer Details
            </h3>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-blue-600 font-bold text-lg border border-blue-200 shadow-sm">
                {ticket.customerInfo?.firstName?.[0]}
                {ticket.customerInfo?.lastName?.[0]}
              </div>
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {ticket.customerInfo?.firstName}{" "}
                    {ticket.customerInfo?.lastName}
                  </p>
                  <p className="text-xs text-gray-500">Customer Name</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Mail size={14} className="text-gray-400" />
                    {ticket.customerInfo?.email || "N/A"}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700 mt-1">
                    <Phone size={14} className="text-gray-400" />
                    {ticket.customerInfo?.phone || "N/A"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <MessageCircle size={16} className="text-gray-400" />
              Description / Message
            </h3>
            <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-700 leading-relaxed border border-gray-200 whitespace-pre-wrap">
              {ticket.description || "No description provided."}
            </div>
          </div>

          {/* Meta Data */}
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <Calendar size={14} />
              Created:{" "}
              <span className="font-medium text-gray-700">
                {new Date(ticket.createdAt).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={14} />
              Last Updated:{" "}
              <span className="font-medium text-gray-700">
                {new Date(ticket.updatedAt).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer - Actions */}
        <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-between items-center gap-4">
          <button
            onClick={() => {
              if (
                window.confirm(
                  "Are you sure you want to delete this ticket? This cannot be undone."
                )
              ) {
                onDelete(ticket._id);
                onClose();
              }
            }}
            className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors flex items-center gap-2"
          >
            <Trash2 size={16} /> Delete Ticket
          </button>

          <div className="flex items-center gap-3">
            {ticket.status !== "resolved" && (
              <button
                onClick={() => {
                  onStatusChange(ticket._id, "resolved");
                  onClose();
                }}
                className="px-5 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-sm transition-all flex items-center gap-2 font-medium"
              >
                <CheckCircle size={16} /> Mark Resolved
              </button>
            )}
            {ticket.status !== "pending" && (
              <button
                onClick={() => {
                  onStatusChange(ticket._id, "pending");
                  onClose();
                }}
                className="px-5 py-2 text-sm bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg shadow-sm transition-all flex items-center gap-2 font-medium"
              >
                <Clock size={16} /> Mark Pending
              </button>
            )}
            <button
              onClick={onClose}
              className="px-5 py-2 text-sm bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg shadow-sm transition-all font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main Support Tickets Component ---
const SupportTickets = () => {
  const {
    supports,
    loading,
    fetchSupports,
    changeStatus,
    deleteSupport,
    error,
  } = useSupportStore();

  const [filteredTickets, setFilteredTickets] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("created");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedTicket, setSelectedTicket] = useState(null); // State for selected ticket

  // Load tickets on mount and when error clears
  useEffect(() => {
    fetchSupports();
  }, [fetchSupports]);

  // Show error toast
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...supports];

    // Search filter
    if (searchText) {
      filtered = filtered.filter(
        (ticket) =>
          ticket.title?.toLowerCase().includes(searchText.toLowerCase()) ||
          `${ticket.customerInfo?.firstName} ${ticket.customerInfo?.lastName}`
            .toLowerCase()
            .includes(searchText.toLowerCase()) ||
          ticket._id?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter((ticket) => ticket.status === filterStatus);
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case "created":
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case "updated":
          aValue = new Date(a.updatedAt);
          bValue = new Date(b.updatedAt);
          break;
        case "customer":
          aValue = `${a.customerInfo?.firstName || ""} ${a.customerInfo?.lastName || ""
            }`.toLowerCase();
          bValue = `${b.customerInfo?.firstName || ""} ${b.customerInfo?.lastName || ""
            }`.toLowerCase();
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

    setFilteredTickets(filtered);
    setCurrentPage(1);
  }, [searchText, filterStatus, sortBy, sortOrder, supports]);

  // Handle status change
  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      await changeStatus(ticketId, newStatus);
      toast.success(`Ticket status updated to ${newStatus}`);
      // Update local state if needed, though store should handle it
      if (selectedTicket && selectedTicket._id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
    } catch (error) {
      toast.error("Failed to update ticket status");
    }
  };

  // Handle delete
  const handleDelete = async (ticketId) => {
    try {
      await deleteSupport(ticketId);
      toast.success("Ticket deleted successfully");
      setSelectedTicket(null); // Close modal if deleted
    } catch (error) {
      toast.error("Failed to delete ticket");
    }
  };

  // Get status styling
  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-50 text-yellow-700 border border-yellow-200";
      case "resolved":
        return "bg-green-50 text-green-700 border border-green-200";
      default:
        return "bg-gray-50 text-gray-700 border border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock className="w-3 h-3" />;
      case "resolved":
        return <CheckCircle className="w-3 h-3" />;
      default:
        return <AlertCircle className="w-3 h-3" />;
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTickets = filteredTickets.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Stats
  const totalTickets = supports.length;
  const pendingTickets = supports.filter((t) => t.status === "pending").length;
  const resolvedTickets = supports.filter(
    (t) => t.status === "resolved"
  ).length;

  if (loading && supports.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Loading tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Modal Integration */}
      {selectedTicket && (
        <TicketDetailsModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
        />
      )}

      <div className="p-4 w-full">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">
                  Total Tickets
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {totalTickets}
                </p>
              </div>
              <div className="p-2 rounded-md bg-blue-50">
                <MessageCircle className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">
                  Pending
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {pendingTickets}
                </p>
              </div>
              <div className="p-2 rounded-md bg-yellow-50">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">
                  Resolved
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {resolvedTickets}
                </p>
              </div>
              <div className="p-2 rounded-md bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Table Container */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          {/* Search and Filters */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                  <input
                    type="text"
                    placeholder="Search tickets by ID, name or title..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>

          {/* Responsive Table Container */}
          <div className="">
            {loading && supports.length === 0 ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 text-sm mt-2">
                    Loading tickets...
                  </p>
                </div>
              </div>
            ) : paginatedTickets.length === 0 ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">No tickets found</p>
                </div>
              </div>
            ) : (
              <div className="min-h-[400px]">
                <table className="w-full min-w-full">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                        Ticket
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[180px]">
                        Customer
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                        Created
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedTickets.map((ticket) => (
                      <tr
                        key={ticket._id}
                        onClick={() => setSelectedTicket(ticket)}
                        className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                      >
                        <td className="px-4 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900 truncate max-w-[180px] group-hover:text-blue-600 transition-colors">
                              {ticket.title}
                            </p>
                            <p className="text-xs text-gray-500 truncate max-w-[180px]">
                              {ticket.description?.substring(0, 100)}...
                            </p>
                            <p className="text-xs text-gray-400">
                              #{ticket._id?.slice(-6)}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div>
                            <p className="text-sm text-gray-900 truncate max-w-[160px]">
                              {ticket.customerInfo?.firstName}{" "}
                              {ticket.customerInfo?.lastName}
                            </p>
                            <p className="text-xs text-gray-500 truncate max-w-[160px]">
                              {ticket.customerInfo?.email}
                            </p>
                            <p className="text-xs text-gray-400">
                              {ticket.customerInfo?.phone}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              ticket.status
                            )}`}
                          >
                            {getStatusIcon(ticket.status)}
                            <span className="whitespace-nowrap">
                              {ticket.status.charAt(0).toUpperCase() +
                                ticket.status.slice(1)}
                            </span>
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div>
                            <p className="text-sm text-gray-900">
                              {new Date(ticket.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(ticket.createdAt).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (
                                  window.confirm("Delete this ticket?")
                                )
                                  handleDelete(ticket._id);
                              }}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                              title="Delete Ticket"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-700">
                Showing {startIndex + 1} to{" "}
                {Math.min(startIndex + itemsPerPage, filteredTickets.length)} of{" "}
                {filteredTickets.length} tickets
              </div>
              <div className="flex gap-1 flex-wrap">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    return (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    );
                  })
                  .map((page, index, array) => {
                    const showEllipsis =
                      index > 0 && page - array[index - 1] > 1;
                    return (
                      <React.Fragment key={page}>
                        {showEllipsis && (
                          <span className="px-3 py-1 text-sm text-gray-500">
                            ...
                          </span>
                        )}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1 text-sm border rounded transition-colors ${currentPage === page
                              ? "bg-[#293a90] text-white border-blue-600"
                              : "border-gray-300 hover:bg-gray-50"
                            }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    );
                  })}
                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

export default SupportTickets;
