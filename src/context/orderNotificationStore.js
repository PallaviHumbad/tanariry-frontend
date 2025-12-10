import { createContext, useContext } from 'react';

const OrderNotificationContext = createContext();

export const useOrderNotifications = () => {
    const context = useContext(OrderNotificationContext);
    if (!context) {
        throw new Error('useOrderNotifications must be used within OrderNotificationProvider');
    }
    return context;
};

export default OrderNotificationContext;
