import React, { useState } from 'react';
import { useOrderNotifications } from '../context/orderNotificationStore';
import { Bell, X, Check, Package, RefreshCw, XCircle, CheckCircle } from 'lucide-react';

const OrderNotifications = () => {
  const { 
    notifications, 
    isConnected, 
    unreadCount, 
    markAsRead, 
    markAllAsRead,
    clearNotifications 
  } = useOrderNotifications();
  
  const [isOpen, setIsOpen] = useState(false);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order_created':
        return <Package className="text-blue-500" size={20} />;
      case 'new_order':
        return <Package className="text-green-500" size={20} />;
      case 'order_status_changed':
        return <RefreshCw className="text-orange-500" size={20} />;
      case 'return_request_submitted':
        return <RefreshCw className="text-yellow-500" size={20} />;
      case 'new_return_request':
        return <RefreshCw className="text-red-500" size={20} />;
      case 'return_request_approved':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'return_request_rejected':
        return <XCircle className="text-red-500" size={20} />;
      case 'return_completed':
        return <Check className="text-green-500" size={20} />;
      default:
        return <Bell className="text-gray-500" size={20} />;
    }
  };

  const formatDate = (dateString, timestamp) => {
    const dateValue = dateString || timestamp;
    if (!dateValue) return 'Just now';
    
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return 'Just now';
    
    return date.toLocaleString();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition"
      >
        <Bell size={24} />
        
        <span
          className={`absolute top-0 right-0 w-3 h-3 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`}
          title={isConnected ? 'Connected' : 'Disconnected'}
        />
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50">
          <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-lg">Order Notifications</h3>
            <div className="flex gap-2">
              {notifications.length > 0 && (
                <>
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Mark all read
                  </button>
                  <button
                    onClick={clearNotifications}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Clear all
                  </button>
                </>
              )}
              <button onClick={() => setIsOpen(false)}>
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell size={48} className="mx-auto mb-2 opacity-20" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification, index) => (
                <div
                  key={index}
                  className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => markAsRead(notification._id)}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm text-gray-900">
                        {notification.title}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      {notification.orderId && (
                        <p className="text-xs text-gray-500 mt-1">
                          Order: #{notification.orderId.toString().slice(-6)}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(notification.createdAt, notification.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="px-4 py-2 bg-gray-50 text-xs text-center border-t">
            <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
              ● {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderNotifications;
