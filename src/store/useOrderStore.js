import { create } from "zustand";
import axiosInstance from "../../utils/axios";

const useOrderStore = create((set, get) => ({
  orders: [],
  order: null,
  summary: null,
  loading: false,
  error: null,

  // Fetch all orders with pagination
  fetchOrders: async (page = 1, limit = 20) => {
    set({ loading: true, error: null });
    try {
      const response = await axiosInstance.get(
        `/orders/getAllOrders?page=${page}&limit=${limit}`
      );
      set({
        orders: response.data.data.orders || [],
        loading: false,
      });
      return response.data;
    } catch (error) {
      console.error("Fetch orders error:", error);
      set({
        error: error.response?.data?.message || error.message,
        loading: false,
      });
      throw error;
    }
  },

  // Fetch order summary
  fetchOrderSummary: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axiosInstance.get("/orders/summary");
      set({
        summary: response.data.data,
        loading: false,
      });
      return response.data;
    } catch (error) {
      console.error("Fetch summary error:", error);
      set({
        error: error.response?.data?.message || error.message,
        loading: false,
      });
      throw error;
    }
  },

  // Fetch single order by ID
  fetchOrderById: async (orderId) => {
    set({ loading: true, error: null });
    try {
      const response = await axiosInstance.get(`/orders/getOrders/${orderId}`);
      set({
        order: response.data.data,
        loading: false,
      });
      return response.data.data;
    } catch (error) {
      console.error("Fetch order error:", error);
      set({
        error: error.response?.data?.message || error.message,
        loading: false,
      });
      throw error;
    }
  },

  // Fetch orders by customer ID
  fetchOrdersByCustomerId: async (customerId) => {
    set({ loading: true, error: null });
    try {
      const response = await axiosInstance.get(
        `/orders/getOrdersByCustomerId/${customerId}`
      );
      set({
        orders: response.data.data || [],
        loading: false,
      });
      return response.data;
    } catch (error) {
      console.error("Fetch customer orders error:", error);
      set({
        error: error.response?.data?.message || error.message,
        loading: false,
      });
      throw error;
    }
  },

  // Update ONLY this function in your useOrderStore
  changeOrderStatus: async (orderId, statusData) => {
    set({ loading: true, error: null });
    try {
      // API expects ONLY { status: "shipped" } - extract only status field
      const { status } = statusData;

      const response = await axiosInstance.patch(
        `/orders/updateOrdersStatus/${orderId}/status`,
        { status } // Send ONLY { status: "shipped" }
      );

      // Update local state optimistically
      set((state) => ({
        orders: state.orders.map((order) =>
          order._id === orderId ? { ...order, status } : order
        ),
        order:
          state.order?._id === orderId
            ? { ...state.order, status }
            : state.order,
        loading: false,
      }));

      return response.data;
    } catch (error) {
      console.error("Update status error:", error);
      set({
        error: error.response?.data?.message || error.message,
        loading: false,
      });
      throw error;
    }
  },

  // Update full order
  updateOrder: async (orderId, orderData) => {
    set({ loading: true, error: null });
    try {
      const response = await axiosInstance.patch(
        `/orders/updateOrdersById/${orderId}`,
        orderData
      );

      // Update local state
      set((state) => ({
        orders: state.orders.map((order) =>
          order._id === orderId ? response.data.data : order
        ),
        order: response.data.data,
        loading: false,
      }));

      return response.data;
    } catch (error) {
      console.error("Update order error:", error);
      set({
        error: error.response?.data?.message || error.message,
        loading: false,
      });
      throw error;
    }
  },

  // Delete order
  deleteOrder: async (orderId) => {
    set({ loading: true, error: null });
    try {
      await axiosInstance.delete(`/orders/${orderId}`);

      // Remove from local state
      set((state) => ({
        orders: state.orders.filter((order) => order._id !== orderId),
        loading: false,
      }));

      return { success: true };
    } catch (error) {
      console.error("Delete order error:", error);
      set({
        error: error.response?.data?.message || error.message,
        loading: false,
      });
      throw error;
    }
  },

  // Generate invoice PDF
  generateInvoice: async (orderId) => {
    set({ loading: true, error: null });
    try {
      const response = await axiosInstance.get(
        `/api/orders/${orderId}/invoice`,
        {
          responseType: "blob",
        }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `invoice-${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      set({ loading: false });
      return response;
    } catch (error) {
      console.error("Generate invoice error:", error);
      set({
        error: error.response?.data?.message || error.message,
        loading: false,
      });
      throw error;
    }
  },

  // Clear error
  clearError: () => set({ error: null }),

  // Reset store
  reset: () =>
    set({
      orders: [],
      order: null,
      summary: null,
      loading: false,
      error: null,
    }),
}));

export default useOrderStore;
