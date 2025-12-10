import React, { useEffect, useState, useCallback } from 'react';
import io from 'socket.io-client';
import useAdminStore from '../store/useAdminStore';
import axiosInstance from '../../utils/axios';
import OrderNotificationContext from './orderNotificationStore';

export const OrderNotificationProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAdminStore();

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/notifications');
      const fetchedNotifications = response.data?.data?.notifications || response.data?.data || [];
      const count = response.data?.data?.unreadCount || 0;
      
      setNotifications(fetchedNotifications);
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    const token = localStorage.getItem('adminToken');
    
    if (!token) {
      console.log('No auth token found');
      return;
    }

    const socketUrl = import.meta.env.DEV 
      ? 'http://localhost:5000' 
      : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000');
      
    const socketInstance = io(socketUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    socketInstance.on('connect', () => {
      console.log('✅ Connected to order notification service');
      setIsConnected(true);
    });

    socketInstance.on('connected', (data) => {
      console.log('Connection confirmed:', data);
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ Disconnected from order notification service');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Connection error:', error.message);
      setIsConnected(false);
    });

    socketInstance.on('order:notification', (notification) => {
      console.log('📦 New order notification:', notification);
      
      setNotifications((prev) => [notification, ...prev]);
      
      setUnreadCount((prev) => prev + 1);
      
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/logo.png'
        });
      }
      
      const audio = new Audio('/notification-sound.mp3');
      audio.play().catch(() => {});
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user, fetchNotifications]);

  const markAsRead = useCallback(async (notificationId) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif._id === notificationId
          ? { ...notif, read: true }
          : notif
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await axiosInstance.patch(`/notifications/${notificationId}/read`);
    } catch (error) {
       console.error("Error marking as read", error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, read: true }))
    );
    setUnreadCount(0);

    try {
        await axiosInstance.patch(`/notifications/mark-all-read`);
    } catch (error) {
        console.error("Error marking all as read", error);
    }
  }, []);

  const clearNotifications = useCallback(async () => {
    setNotifications([]);
    setUnreadCount(0);

    try {
      await axiosInstance.delete('/notifications/read/all');
    } catch (error) {
        console.error("Error clearing notifications:", error);
        fetchNotifications();
    }
  }, [fetchNotifications]);

  const value = {
    socket,
    notifications,
    isConnected,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    fetchNotifications
  };

  return (
    <OrderNotificationContext.Provider value={value}>
      {children}
    </OrderNotificationContext.Provider>
  );
};
