import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Eye,
    Upload,
    X,
    Package,
    RefreshCw,
    Image as ImageIcon,
} from "lucide-react";
import DashBoard from "../../pages/DashBoard";
import useReturnStore from "../../store/useReturnStore";
import { toast } from "react-toastify";

const IMAGE = import.meta.env.VITE_IMAGE;

const ReturnRequests = () => {
    const [filter, setFilter] = useState("All Requests");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [adminComment, setAdminComment] = useState("");
    const [refundAmount, setRefundAmount] = useState("");
    const itemsPerPage = 8;

    const {
        returnRequests,
        loading,
        error,
        successMessage,
        pagination,
        getAllReturnRequests,
        approveReturnRequest,
        rejectReturnRequest,
        completeReturnRequest,
        clearMessages,
    } = useReturnStore();

    const navigate = useNavigate();

    useEffect(() => {
        const filters = {
            page: currentPage,
            limit: itemsPerPage,
            ...(filter !== "All Requests" && { status: filter }),
        };
        getAllReturnRequests(filters);
    }, [currentPage, filter]);

    useEffect(() => {
        if (successMessage) {
            toast.success(successMessage);
            clearMessages();
            getAllReturnRequests({
                page: currentPage,
                limit: itemsPerPage,
                ...(filter !== "All Requests" && { status: filter }),
            });
        }
        if (error) {
            toast.error(error);
            clearMessages();
        }
    }, [successMessage, error]);

    const statusCounts = returnRequests.reduce((acc, request) => {
        const status = request.returnRequest?.requestStatus || "unknown";
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {});

    const getStatusColor = (status) => {
        switch (status) {
            case "pending":
                return "bg-yellow-50 text-yellow-700 border border-yellow-200";
            case "approved":
                return "bg-green-50 text-green-700 border border-green-200";
            case "rejected":
                return "bg-red-50 text-red-700 border border-red-200";
            case "completed":
                return "bg-purple-50 text-purple-700 border border-purple-200";
            default:
                return "bg-gray-50 text-gray-700 border border-gray-200";
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "pending":
                return <Clock className="w-3 h-3" />;
            case "approved":
                return <CheckCircle className="w-3 h-3" />;
            case "rejected":
                return <XCircle className="w-3 h-3" />;
            case "completed":
                return <Package className="w-3 h-3" />;
            default:
                return <AlertCircle className="w-3 h-3" />;
        }
    };

    const formatReasonCategory = (category) => {
        if (!category) return "Not specified";
        return category
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase());
    };

    const handleViewDetails = (request) => {
        setSelectedRequest(request);
        setShowModal(true);
        setRefundAmount(request.totalAmount);
    };

    const handleRowClick = (request) => {
        handleViewDetails(request);
    };

    const handleApprove = async () => {
        if (!adminComment.trim()) {
            toast.warning("Please enter a comment");
            return;
        }

        if (!selectedRequest.returnRequest?.reasonCategory ||
            !selectedRequest.returnRequest?.reason) {
            toast.error("Cannot approve: Customer hasn't provided return details yet");
            return;
        }

        try {
            await approveReturnRequest(selectedRequest._id, {
                adminComment,
                refundAmount: parseFloat(refundAmount),
            });
            setShowModal(false);
            setAdminComment("");
            setRefundAmount("");
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to approve return");
        }
    };

    const handleReject = async () => {
        if (!adminComment.trim()) {
            toast.warning("Please enter a rejection reason");
            return;
        }
        try {
            await rejectReturnRequest(selectedRequest._id, { adminComment });
            setShowModal(false);
            setAdminComment("");
        } catch (err) {
            console.error(err);
        }
    };

    const handleComplete = async (orderId, e) => {
        if (e) e.stopPropagation();

        if (window.confirm("Complete this return and process refund?")) {
            try {
                await completeReturnRequest(orderId);
            } catch (err) {
                console.error(err);
            }
        }
    };

    return (
        <DashBoard>
            <div className="min-h-screen bg-gray-50 font-sans">
                <div className="p-3 sm:p-4 md:p-6 w-full">
                    {/* Header */}
                    <div className="mb-4">
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                            Return Requests
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">
                            Manage customer return requests and process refunds
                        </p>
                    </div>

                    {/* Filter Buttons */}
                    <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200 mb-4 w-full">
                        <div className="flex overflow-x-auto gap-2 pb-2 -mb-2 scrollbar-thin scrollbar-thumb-gray-300">
                            {["All Requests", "pending", "approved", "rejected", "completed"].map(
                                (status) => (
                                    <button
                                        key={status}
                                        className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 min-h-[44px] ${filter === status
                                            ? "bg-[#293a90] text-white"
                                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-gray-300"
                                            }`}
                                        onClick={() => {
                                            setFilter(status);
                                            setCurrentPage(1);
                                        }}
                                    >
                                        {status === "All Requests"
                                            ? "All"
                                            : status.charAt(0).toUpperCase() + status.slice(1)}{" "}
                                        ({status === "All Requests"
                                            ? returnRequests.length
                                            : statusCounts[status] || 0})
                                    </button>
                                )
                            )}
                        </div>
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden lg:block bg-white rounded-lg border border-gray-200 overflow-hidden w-full">
                        {loading ? (
                            <div className="flex justify-center items-center py-8">
                                <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                                <span className="ml-2 text-sm text-gray-600">Loading...</span>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Order ID
                                            </th>
                                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Customer
                                            </th>
                                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Reason
                                            </th>
                                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Amount
                                            </th>
                                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Requested
                                            </th>
                                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {returnRequests.map((request) => {
                                            const returnReq = request.returnRequest;
                                            return (
                                                <tr
                                                    key={request._id}
                                                    onClick={() => handleRowClick(request)}
                                                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                                                >
                                                    <td className="py-3 px-4">
                                                        <div
                                                            className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                                                returnReq?.requestStatus
                                                            )}`}
                                                        >
                                                            {getStatusIcon(returnReq?.requestStatus)}
                                                            {returnReq?.requestStatus?.charAt(0).toUpperCase() +
                                                                returnReq?.requestStatus?.slice(1) || "Unknown"}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="text-xs font-medium text-blue-600">
                                                            #{request?._id?.slice(-6) || "N/A"}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="text-xs">
                                                            <div className="font-medium text-gray-900">
                                                                {request.customerId?.firstName}{" "}
                                                                {request.customerId?.lastName}
                                                            </div>
                                                            <div className="text-gray-500">
                                                                {request.customerId?.email}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="text-xs text-gray-900">
                                                            {formatReasonCategory(returnReq?.reasonCategory)}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="text-xs font-medium text-gray-900">
                                                            ₹{Number(request?.totalAmount || 0).toFixed(2)}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="text-xs text-gray-600">
                                                            {returnReq?.requestedAt
                                                                ? new Date(returnReq.requestedAt).toLocaleDateString()
                                                                : "N/A"}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleViewDetails(request);
                                                                }}
                                                                className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                                title="View Details"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                            {returnReq?.requestStatus === "approved" && (
                                                                <button
                                                                    onClick={(e) => handleComplete(request._id, e)}
                                                                    className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                                                                >
                                                                    Complete
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {returnRequests.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={7}
                                                    className="px-4 py-8 text-center text-gray-500"
                                                >
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Package className="w-8 h-8 text-gray-300" />
                                                        <span className="text-xs">
                                                            No return requests found
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Mobile Card View */}
                    <div className="lg:hidden space-y-3">
                        {loading ? (
                            <div className="flex justify-center items-center py-8 bg-white rounded-lg">
                                <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                                <span className="ml-2 text-sm text-gray-600">Loading...</span>
                            </div>
                        ) : returnRequests.length === 0 ? (
                            <div className="bg-white rounded-lg p-8 text-center">
                                <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">No return requests found</p>
                            </div>
                        ) : (
                            returnRequests.map((request) => {
                                const returnReq = request.returnRequest;
                                return (
                                    <div
                                        key={request._id}
                                        onClick={() => handleRowClick(request)}
                                        className="bg-white rounded-lg border border-gray-200 p-4 space-y-3 shadow-sm cursor-pointer active:scale-[0.98] transition-transform"
                                    >
                                        {/* Status Badge */}
                                        <div className="flex items-center justify-between">
                                            <div
                                                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(
                                                    returnReq?.requestStatus
                                                )}`}
                                            >
                                                {getStatusIcon(returnReq?.requestStatus)}
                                                {returnReq?.requestStatus?.charAt(0).toUpperCase() +
                                                    returnReq?.requestStatus?.slice(1) || "Unknown"}
                                            </div>
                                            <span className="text-xs font-medium text-blue-600">
                                                #{request?._id?.slice(-6) || "N/A"}
                                            </span>
                                        </div>

                                        {/* Customer Info */}
                                        <div className="space-y-1">
                                            <div className="text-sm font-medium text-gray-900">
                                                {request.customerId?.firstName}{" "}
                                                {request.customerId?.lastName}
                                            </div>
                                            <div className="text-xs text-gray-500 break-all">
                                                {request.customerId?.email}
                                            </div>
                                        </div>

                                        {/* Details Grid */}
                                        <div className="grid grid-cols-2 gap-3 text-xs">
                                            <div>
                                                <span className="text-gray-500">Reason:</span>
                                                <div className="font-medium text-gray-900 mt-0.5">
                                                    {formatReasonCategory(returnReq?.reasonCategory)}
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Amount:</span>
                                                <div className="font-medium text-gray-900 mt-0.5">
                                                    ₹{Number(request?.totalAmount || 0).toFixed(2)}
                                                </div>
                                            </div>
                                            <div className="col-span-2">
                                                <span className="text-gray-500">Requested:</span>
                                                <div className="font-medium text-gray-900 mt-0.5">
                                                    {returnReq?.requestedAt
                                                        ? new Date(returnReq.requestedAt).toLocaleDateString(
                                                            "en-IN",
                                                            {
                                                                year: "numeric",
                                                                month: "short",
                                                                day: "numeric",
                                                            }
                                                        )
                                                        : "N/A"}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        {returnReq?.requestStatus === "approved" && (
                                            <div className="flex gap-2 pt-2">
                                                <button
                                                    onClick={(e) => handleComplete(request._id, e)}
                                                    className="flex-1 min-h-[44px] px-4 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors active:scale-95"
                                                >
                                                    Complete Return
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                        <div className="mt-4 bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                                <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
                                    Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                                    {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                                    of {pagination.total}
                                </div>
                                <div className="flex gap-1 sm:gap-2 flex-wrap justify-center">
                                    <button
                                        onClick={() =>
                                            setCurrentPage(Math.max(1, currentPage - 1))
                                        }
                                        disabled={currentPage === 1}
                                        className="min-h-[44px] px-3 sm:px-4 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Previous
                                    </button>
                                    {Array.from(
                                        { length: Math.min(pagination.pages, 5) },
                                        (_, i) => i + 1
                                    ).map((page) => (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`min-h-[44px] min-w-[44px] px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg transition-colors ${currentPage === page
                                                ? "bg-[#293a90] text-white"
                                                : "border border-gray-300 hover:bg-gray-50"
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() =>
                                            setCurrentPage(
                                                Math.min(pagination.pages, currentPage + 1)
                                            )
                                        }
                                        disabled={currentPage === pagination.pages}
                                        className="min-h-[44px] px-3 sm:px-4 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal */}
                {showModal && selectedRequest && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
                        <div className="bg-white rounded-t-2xl sm:rounded-lg w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 z-10">
                                <div className="flex justify-between items-start">
                                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                                        Return Request Details
                                    </h2>
                                    <button
                                        onClick={() => {
                                            setShowModal(false);
                                            setAdminComment("");
                                        }}
                                        className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600 -mr-2"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-4 sm:p-6 space-y-4">
                                {/* Order Info */}
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                                        <div>
                                            <span className="text-gray-600">Order ID:</span>
                                            <span className="ml-2 font-medium break-all">
                                                #{selectedRequest?._id?.slice(-8) || "N/A"}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Amount:</span>
                                            <span className="ml-2 font-medium">
                                                ₹{Number(selectedRequest?.totalAmount || 0).toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <span className="text-gray-600">Customer:</span>
                                            <span className="ml-2 font-medium">
                                                {selectedRequest.customerId?.firstName}{" "}
                                                {selectedRequest.customerId?.lastName}
                                            </span>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <span className="text-gray-600">Email:</span>
                                            <span className="ml-2 font-medium break-all">
                                                {selectedRequest.customerId?.email}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Return Details */}
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">
                                        Return Information
                                    </h3>
                                    <div className="space-y-3 text-xs sm:text-sm">
                                        {selectedRequest.returnRequest?.reasonCategory && (
                                            <div>
                                                <span className="text-gray-600">Category:</span>
                                                <span className="ml-2">
                                                    {formatReasonCategory(
                                                        selectedRequest.returnRequest.reasonCategory
                                                    )}
                                                </span>
                                            </div>
                                        )}
                                        {selectedRequest.returnRequest?.reason && (
                                            <div>
                                                <span className="text-gray-600 block mb-1">
                                                    Reason:
                                                </span>
                                                <p className="p-3 bg-gray-50 rounded text-gray-900">
                                                    {selectedRequest.returnRequest.reason}
                                                </p>
                                            </div>
                                        )}
                                        {selectedRequest.returnRequest?.requestedAt && (
                                            <div>
                                                <span className="text-gray-600">Requested Date:</span>
                                                <span className="ml-2">
                                                    {new Date(
                                                        selectedRequest.returnRequest.requestedAt
                                                    ).toLocaleString("en-IN", {
                                                        year: "numeric",
                                                        month: "short",
                                                        day: "numeric",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </span>
                                            </div>
                                        )}
                                        {!selectedRequest.returnRequest?.reasonCategory &&
                                            !selectedRequest.returnRequest?.reason && (
                                                <div className="p-3 bg-yellow-50 rounded-lg text-yellow-800 text-xs">
                                                    Return details not yet provided by customer
                                                </div>
                                            )}
                                    </div>
                                </div>

                                {/* Images */}
                                {selectedRequest.returnRequest?.images?.length > 0 && (
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">
                                            Uploaded Images
                                        </h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                            {selectedRequest.returnRequest.images.map((img, idx) => (
                                                <img
                                                    key={idx}
                                                    src={`${IMAGE}${img}`}
                                                    alt={`Return evidence ${idx + 1}`}
                                                    className="w-full h-24 sm:h-28 object-cover rounded border cursor-pointer hover:opacity-90 transition-opacity"
                                                    onClick={() =>
                                                        window.open(
                                                            `${IMAGE}${img}`,
                                                            "_blank"
                                                        )
                                                    }
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Action Section - Only for Pending */}
                                {selectedRequest.returnRequest?.requestStatus === "pending" && (
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">
                                            Admin Action
                                        </h3>

                                        {(!selectedRequest.returnRequest?.reasonCategory ||
                                            !selectedRequest.returnRequest?.reason) && (
                                                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                                    <div className="flex gap-2">
                                                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                                        <div className="text-sm text-amber-800">
                                                            <p className="font-medium">Incomplete Return Request</p>
                                                            <p className="text-xs mt-1">
                                                                Customer hasn't provided return reason and details yet.
                                                                You can only reject this request until complete information is provided.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-xs sm:text-sm text-gray-700 mb-1.5 font-medium">
                                                    Refund Amount
                                                </label>
                                                <input
                                                    type="number"
                                                    value={refundAmount}
                                                    onChange={(e) => setRefundAmount(e.target.value)}
                                                    disabled={!selectedRequest.returnRequest?.reasonCategory}
                                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:bg-gray-100 disabled:text-gray-400"
                                                    placeholder="Enter refund amount"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs sm:text-sm text-gray-700 mb-1.5 font-medium">
                                                    Admin Comment
                                                </label>
                                                <textarea
                                                    value={adminComment}
                                                    onChange={(e) => setAdminComment(e.target.value)}
                                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm h-24 resize-none"
                                                    placeholder="Add a note about this decision..."
                                                />
                                            </div>
                                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                                <button
                                                    onClick={handleApprove}
                                                    disabled={!selectedRequest.returnRequest?.reasonCategory}
                                                    className="flex-1 min-h-[44px] bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 font-medium text-sm flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                    Approve Return
                                                </button>
                                                <button
                                                    onClick={handleReject}
                                                    className="flex-1 min-h-[44px] bg-red-600 text-white px-4 py-2.5 rounded-lg hover:bg-red-700 font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                    Reject Return
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Show Admin Action History */}
                                {(selectedRequest.returnRequest?.requestStatus === "approved" ||
                                    selectedRequest.returnRequest?.requestStatus === "rejected" ||
                                    selectedRequest.returnRequest?.requestStatus === "completed") && (
                                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                            <h4 className="text-sm font-medium text-gray-900 mb-2">
                                                Decision History
                                            </h4>
                                            <div className="text-xs sm:text-sm space-y-2">
                                                <div className="flex justify-between text-gray-600">
                                                    <span>Action:</span>
                                                    <span className="font-medium capitalize text-gray-900">
                                                        {selectedRequest.returnRequest.requestStatus}
                                                    </span>
                                                </div>
                                                {selectedRequest.returnRequest?.adminComment && (
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-gray-600">Admin Comment:</span>
                                                        <p className="text-gray-900 bg-white p-2 rounded border border-gray-200">
                                                            {selectedRequest.returnRequest.adminComment}
                                                        </p>
                                                    </div>
                                                )}
                                                {selectedRequest.returnRequest?.processedAt && (
                                                    <div className="flex justify-between text-gray-600">
                                                        <span>Processed Date:</span>
                                                        <span className="text-gray-900">
                                                            {new Date(
                                                                selectedRequest.returnRequest.processedAt
                                                            ).toLocaleString("en-IN")}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashBoard>
    );
};

export default ReturnRequests;
