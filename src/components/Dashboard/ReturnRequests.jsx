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
            // Refresh data after action
            getAllReturnRequests({
                page: currentPage,
                limit: itemsPerPage,
                ...(filter !== "All Requests" && { status: filter }),
            });
        }
        if (error) {
            alert(error);
            clearMessages();
        }
    }, [successMessage, error]);

    // Build status counts
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

    const handleViewDetails = (request) => {
        setSelectedRequest(request);
        setShowModal(true);
        setRefundAmount(request.totalAmount);
    };

    const handleApprove = async () => {
        if (!adminComment.trim()) {
            alert("Please enter a comment");
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
        }
    };

    const handleReject = async () => {
        if (!adminComment.trim()) {
            alert("Please enter a rejection reason");
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

    const handleComplete = async (orderId) => {
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
                <div className="p-4 w-full">
                    {/* Header */}
                    <div className="mb-4">
                        <h1 className="text-2xl font-bold text-gray-900">
                            Return Requests
                        </h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Manage customer return requests and process refunds
                        </p>
                    </div>

                    {/* Filter Buttons */}
                    <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4 w-full">
                        <div className="flex overflow-x-auto whitespace-nowrap space-x-2 w-full">
                            {["All Requests", "pending", "approved", "rejected", "completed"].map(
                                (status) => (
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
                                        {status === "All Requests"
                                            ? "All Requests"
                                            : status.charAt(0).toUpperCase() + status.slice(1)}{" "}
                                        ({status === "All Requests"
                                            ? returnRequests.length
                                            : statusCounts[status] || 0})
                                    </button>
                                )
                            )}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-visible w-full">
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
                                                    className="hover:bg-gray-50 transition-colors"
                                                >
                                                    <td className="py-3 px-4">
                                                        <div
                                                            className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                                                returnReq?.requestStatus
                                                            )}`}
                                                        >
                                                            {getStatusIcon(returnReq?.requestStatus)}
                                                            {returnReq?.requestStatus.charAt(0).toUpperCase() +
                                                                returnReq?.requestStatus.slice(1)}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="text-xs font-medium text-blue-600">
                                                            #{request._id.slice(-6)}
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
                                                            {returnReq?.reasonCategory
                                                                .replace(/_/g, " ")
                                                                .replace(/\b\w/g, (l) => l.toUpperCase())}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="text-xs font-medium text-gray-900">
                                                            ₹{request.totalAmount.toFixed(2)}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="text-xs text-gray-600">
                                                            {new Date(
                                                                returnReq?.requestedAt
                                                            ).toLocaleDateString()}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleViewDetails(request)}
                                                                className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                                title="View Details"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                            {returnReq?.requestStatus === "approved" && (
                                                                <button
                                                                    onClick={() => handleComplete(request._id)}
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

                        {/* Pagination */}
                        {pagination.pages > 1 && (
                            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between w-full">
                                <div className="text-xs text-gray-700">
                                    Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                                    {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                                    of {pagination.total} results
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() =>
                                            setCurrentPage(Math.max(1, currentPage - 1))
                                        }
                                        disabled={currentPage === 1}
                                        className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                            setCurrentPage(
                                                Math.min(pagination.pages, currentPage + 1)
                                            )
                                        }
                                        disabled={currentPage === pagination.pages}
                                        className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Modal */}
                {showModal && selectedRequest && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <h2 className="text-xl font-bold text-gray-900">
                                        Return Request Details
                                    </h2>
                                    <button
                                        onClick={() => {
                                            setShowModal(false);
                                            setAdminComment("");
                                        }}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Order Info */}
                                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-600">Order ID:</span>
                                            <span className="ml-2 font-medium">
                                                #{selectedRequest._id.slice(-8)}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Amount:</span>
                                            <span className="ml-2 font-medium">
                                                ₹{selectedRequest.totalAmount.toFixed(2)}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Customer:</span>
                                            <span className="ml-2 font-medium">
                                                {selectedRequest.customerId?.firstName}{" "}
                                                {selectedRequest.customerId?.lastName}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Email:</span>
                                            <span className="ml-2 font-medium">
                                                {selectedRequest.customerId?.email}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Return Details */}
                                <div className="mb-4">
                                    <h3 className="font-semibold text-gray-900 mb-2">
                                        Return Information
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                        <div>
                                            <span className="text-gray-600">Category:</span>
                                            <span className="ml-2">
                                                {selectedRequest.returnRequest?.reasonCategory
                                                    .replace(/_/g, " ")
                                                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Reason:</span>
                                            <p className="mt-1 p-2 bg-gray-50 rounded">
                                                {selectedRequest.returnRequest?.reason}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Requested Date:</span>
                                            <span className="ml-2">
                                                {new Date(
                                                    selectedRequest.returnRequest?.requestedAt
                                                ).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Images */}
                                {selectedRequest.returnRequest?.images?.length > 0 && (
                                    <div className="mb-4">
                                        <h3 className="font-semibold text-gray-900 mb-2">
                                            Uploaded Images
                                        </h3>
                                        <div className="grid grid-cols-3 gap-2">
                                            {selectedRequest.returnRequest.images.map((img, idx) => (
                                                <img
                                                    key={idx}
                                                    src={`${process.env.REACT_APP_API_URL}${img}`}
                                                    alt={`Return evidence ${idx + 1}`}
                                                    className="w-full h-24 object-cover rounded border"
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Action Section - Only for Pending */}
                                {selectedRequest.returnRequest?.requestStatus === "pending" && (
                                    <div className="mb-4">
                                        <h3 className="font-semibold text-gray-900 mb-2">
                                            Admin Action
                                        </h3>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-sm text-gray-700 mb-1">
                                                    Refund Amount
                                                </label>
                                                <input
                                                    type="number"
                                                    value={refundAmount}
                                                    onChange={(e) => setRefundAmount(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    placeholder="Enter refund amount"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-gray-700 mb-1">
                                                    Comment *
                                                </label>
                                                <textarea
                                                    value={adminComment}
                                                    onChange={(e) => setAdminComment(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    rows={3}
                                                    placeholder="Enter your comment or reason"
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleApprove}
                                                    disabled={loading}
                                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
                                                >
                                                    Approve Return
                                                </button>
                                                <button
                                                    onClick={handleReject}
                                                    disabled={loading}
                                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50"
                                                >
                                                    Reject Return
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Review Info - For Approved/Rejected */}
                                {selectedRequest.returnRequest?.reviewedBy && (
                                    <div className="p-4 bg-blue-50 rounded-lg">
                                        <h3 className="font-semibold text-gray-900 mb-2">
                                            Admin Review
                                        </h3>
                                        <div className="text-sm space-y-1">
                                            <div>
                                                <span className="text-gray-600">Reviewed by:</span>
                                                <span className="ml-2">
                                                    {selectedRequest.returnRequest.reviewedBy?.firstName}{" "}
                                                    {selectedRequest.returnRequest.reviewedBy?.lastName}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Reviewed at:</span>
                                                <span className="ml-2">
                                                    {new Date(
                                                        selectedRequest.returnRequest.reviewedAt
                                                    ).toLocaleString()}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Comment:</span>
                                                <p className="mt-1 p-2 bg-white rounded">
                                                    {selectedRequest.returnRequest.adminComment}
                                                </p>
                                            </div>
                                            {selectedRequest.returnRequest.refundAmount && (
                                                <div>
                                                    <span className="text-gray-600">Refund Amount:</span>
                                                    <span className="ml-2 font-medium">
                                                        ₹
                                                        {selectedRequest.returnRequest.refundAmount.toFixed(
                                                            2
                                                        )}
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
