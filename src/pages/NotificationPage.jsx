import React, { useMemo, useState, useEffect } from "react";
import { useOrderNotifications } from '../context/orderNotificationStore';
import {
    CheckCircle2,
    XCircle,
    Clock3,
    Package,
    RefreshCw,
    CreditCard,
    Filter,
    X,
    MapPin,
    Phone,
    Mail,
    ShoppingBag,
    ArrowRight,
    FileText
} from "lucide-react";


//  Helper Functions 
const statusColors = {
    pending: "bg-amber-100 text-amber-800",
    shipped: "bg-blue-100 text-blue-800",
    delivered: "bg-emerald-100 text-emerald-800",
    requested: "bg-amber-100 text-amber-800",
    approved: "bg-emerald-100 text-emerald-800",
    success: "bg-emerald-100 text-emerald-800",
    processing: "bg-sky-100 text-sky-800",
    failed: "bg-rose-100 text-rose-800",
};

const typeIcon = (type) => {
    switch (type) {
        case "order": return <Package className="w-5 h-5 text-indigo-600" />;
        case "return": return <RefreshCw className="w-5 h-5 text-amber-600" />;
        case "payment": return <CreditCard className="w-5 h-5 text-emerald-600" />;
        default: return <Clock3 className="w-5 h-5 text-gray-500" />;
    }
};

//  Modal Component 
const NotificationModal = ({ notification, onClose }) => {
    if (!notification) return null;

    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = "unset"; };
    }, []);

    const { extendedDetails } = notification;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm transition-all">
            <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">

                {/* Modal Header */}
                <div className="flex items-start justify-between p-5 border-b border-gray-100">
                    <div className="flex gap-3">
                        <div className="p-2 bg-gray-50 rounded-lg">{typeIcon(notification.type)}</div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">{notification.title}</h3>
                            <p className="text-sm text-gray-500 flex items-center gap-2">
                                {notification.time} • <span className={`uppercase text-[10px] font-bold px-1.5 py-0.5 rounded ${statusColors[notification.status]}`}>{notification.status}</span>
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-5 overflow-y-auto max-h-[70vh] space-y-6">

                    {/* Customer Info */}
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                {notification.customer.charAt(0)}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">{notification.customer}</p>
                                <p className="text-xs text-gray-500">Customer</p>
                            </div>
                        </div>
                        {extendedDetails?.email && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                <div className="flex items-center gap-2 text-gray-600"><Mail className="w-3.5 h-3.5" /> {extendedDetails.email}</div>
                                <div className="flex items-center gap-2 text-gray-600"><Phone className="w-3.5 h-3.5" /> {extendedDetails.phone}</div>
                            </div>
                        )}
                    </div>

                    {/* ORDER DETAILS */}
                    {notification.type === 'order' && (
                        <div className="space-y-4">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <ShoppingBag className="w-4 h-4" /> Order Summary
                            </h4>
                            <ul className="space-y-3">
                                {extendedDetails?.items?.map((item, idx) => (
                                    <li key={idx} className="flex justify-between items-center text-sm border-b border-dashed border-gray-100 pb-2 last:border-0">
                                        <span className="text-gray-700">{item.qty} x {item.name}</span>
                                        <span className="font-medium text-gray-900">₹{item.price * item.qty}</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                                <span className="font-medium text-gray-900">Total Amount</span>
                                <span className="text-lg font-bold text-indigo-600">₹{notification.amount}</span>
                            </div>
                            <div className="bg-white border border-gray-200 p-3 rounded text-sm text-gray-600">
                                <div className="flex items-start gap-2">
                                    <MapPin className="w-4 h-4 mt-0.5 text-gray-400" />
                                    <span>{extendedDetails?.address}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* RETURN DETAILS */}
                    {notification.type === 'return' && (
                        <div className="space-y-4">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <FileText className="w-4 h-4" /> Return Request
                            </h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between p-2 bg-amber-50 rounded text-amber-900">
                                    <span>Reason</span>
                                    <span className="font-medium">{extendedDetails?.reason}</span>
                                </div>
                                <div className="p-3 border border-gray-200 rounded text-gray-600 italic">
                                    "{extendedDetails?.comments}"
                                </div>
                                <div className="flex items-center justify-between text-gray-600 pt-2">
                                    <span>Action Requested:</span>
                                    <span className="font-medium text-gray-900">{extendedDetails?.requestedAction}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PAYMENT DETAILS */}
                    {notification.type === 'payment' && (
                        <div className="space-y-4">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <CreditCard className="w-4 h-4" /> Transaction Details
                            </h4>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="p-3 bg-gray-50 rounded">
                                    <p className="text-xs text-gray-500">Transaction ID</p>
                                    <p className="font-mono text-gray-800 mt-1 truncate" title={extendedDetails?.transactionId}>{extendedDetails?.transactionId}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded">
                                    <p className="text-xs text-gray-500">Gateway</p>
                                    <p className="font-medium text-gray-800 mt-1">{extendedDetails?.gateway}</p>
                                </div>
                                <div className="col-span-2 p-3 bg-gray-50 rounded">
                                    <p className="text-xs text-gray-500">Payment Method</p>
                                    <p className="font-medium text-gray-800 mt-1">{extendedDetails?.method}</p>
                                </div>
                                {extendedDetails?.failureReason && (
                                    <div className="col-span-2 p-3 bg-red-50 text-red-700 rounded border border-red-100">
                                        <p className="text-xs font-bold">Failure Reason</p>
                                        <p className="text-sm mt-1">{extendedDetails.failureReason}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white hover:text-gray-900 border border-transparent hover:border-gray-200 rounded-lg transition-all">
                        Close
                    </button>
                    <button className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm flex items-center gap-2 transition-colors">
                        View Full Details <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

//  Main Page Component 
const NotificationPage = () => {
    const { notifications: contextNotifications, markAsRead, markAllAsRead } = useOrderNotifications();
    const [activeTab, setActiveTab] = useState("all");
    const [showUnreadOnly, setShowUnreadOnly] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState(null);

    const notifications = useMemo(() => {
        if (!contextNotifications) return [];
        return contextNotifications.map(n => ({
            id: n._id,
            type: n.type === 'new_order' ? 'order' : (n.type || 'order'),
            title: n.title,
            customer: n.data?.customerName || 'Unknown',
            amount: n.data?.totalAmount || 0,
            status: n.data?.status || 'pending',
            time: new Date(n.createdAt).toLocaleString(),
            createdAt: n.createdAt,
            details: n.message,
            read: n.read,
            extendedDetails: n.data || {}
        }));
    }, [contextNotifications]);

    const filteredNotifications = useMemo(() => {
        let list = [...notifications];
        if (activeTab !== "all") list = list.filter((n) => n.type === activeTab);
        if (showUnreadOnly) list = list.filter((n) => !n.read);
        return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [notifications, activeTab, showUnreadOnly]);

    const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

    const handleMarkAllRead = () => markAllAsRead();

    const handleToggleRead = (e, id) => {
        e.stopPropagation();
        markAsRead(id);
    };

    const handleClearOne = (e, id) => {
        e.stopPropagation();
    };

    const handleRowClick = (notification) => {
        if (!notification.read) {
            markAsRead(notification.id);
        }
        setSelectedNotification(notification);
    };

    const tabs = [
        { key: "all", label: "All" },
        { key: "order", label: "Recent Orders" },
        { key: "return", label: "Return Requests" },
        { key: "payment", label: "Payments" },
    ];

    return (
        <div className="min-h-screen bg-gray-50 px-4 py-6 lg:px-8 font-sans">
            <div className="mx-auto max-w-8xl">
                {/* Header */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                   
                </div>

                {/* Tabs */}
                <div className="mb-4 flex items-center justify-between gap-2 overflow-x-auto pb-2">
                    <div className="flex gap-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${activeTab === tab.key
                                        ? "bg-gray-900 text-white shadow-sm"
                                        : "bg-white text-gray-600 hover:bg-gray-100"
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={() => setShowUnreadOnly((prev) => !prev)}
                            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${showUnreadOnly
                                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                                }`}
                        >
                            <Filter className="w-4 h-4" /> {showUnreadOnly ? "Unread Only" : "Filter"}
                        </button>

                        <button
                            onClick={handleMarkAllRead}
                            disabled={unreadCount === 0}
                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <CheckCircle2 className="w-4 h-4" /> Mark all read
                        </button>
                    </div>
                </div>


                {/* List */}
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    {filteredNotifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
                            <Clock3 className="w-10 h-10 text-gray-300" />
                            <p className="text-sm font-medium text-gray-900">No notifications found</p>
                            <p className="text-xs text-gray-500">Adjust your filters or check back later.</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {filteredNotifications.map((n) => (
                                <li
                                    key={n.id}
                                    onClick={() => handleRowClick(n)}
                                    className={`group flex cursor-pointer items-start gap-4 px-4 py-4 transition-colors hover:bg-gray-50 sm:px-6 ${!n.read ? "bg-indigo-50/50" : "bg-white"}`}
                                >
                                    <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-1 ring-inset ${!n.read ? "bg-indigo-100 ring-indigo-200" : "bg-gray-50 ring-gray-200"}`}>
                                        {typeIcon(n.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start gap-2">
                                            <p className={`text-sm font-medium truncate ${!n.read ? "text-gray-900" : "text-gray-700"}`}>{n.title}</p>
                                            <span className="text-xs text-gray-400 whitespace-nowrap">{n.time}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{n.details}</p>
                                        <div className="mt-2 flex items-center gap-2">
                                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusColors[n.status]} ring-opacity-20`}>{n.status}</span>
                                            <span className="text-xs text-gray-400">• {n.customer}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity sm:opacity-100">
                                        <button onClick={(e) => handleToggleRead(e, n.id)} title={n.read ? "Mark unread" : "Mark read"} className="p-1 text-gray-400 hover:text-indigo-600 transition-colors">
                                            <div className={`w-2 h-2 rounded-full ${n.read ? "bg-transparent border border-gray-300" : "bg-indigo-600"}`}></div>
                                        </button>
                                        <button onClick={(e) => handleClearOne(e, n.id)} title="Dismiss" className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                                            <XCircle className="w-4 h-4" />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* Modal */}
            {selectedNotification && (
                <NotificationModal
                    notification={selectedNotification}
                    onClose={() => setSelectedNotification(null)}
                />
            )}
        </div>
    );
};

export default NotificationPage;
