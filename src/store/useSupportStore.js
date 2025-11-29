import { create } from "zustand";
import axiosInstance from "../../utils/axios";

const useSupportStore = create((set, get) => ({
  supports: [],
  loading: false,
  error: null,

  // Fetch all support tickets (with optional status filter)
  fetchSupports: async (status = null) => {
    set({ loading: true, error: null });
    try {
      const params = status ? `?status=${status}` : "";
      const response = await axiosInstance.get(`/support${params}`);
      set({
        supports: response.data.data || [],
        loading: false,
      });
      return response.data;
    } catch (error) {
      console.error("Fetch supports error:", error);
      set({
        error: error.response?.data?.message || error.message,
        loading: false,
      });
      throw error;
    }
  },

  // Create new support ticket
  createSupport: async (supportData) => {
    set({ loading: true, error: null });
    try {
      const response = await axiosInstance.post("/support", supportData);
      set({ loading: false });
      return response.data;
    } catch (error) {
      console.error("Create support error:", error);
      set({
        error: error.response?.data?.message || error.message,
        loading: false,
      });
      throw error;
    }
  },

  // Get single support ticket by ID
  getSupportById: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await axiosInstance.get(`support/${id}`);
      set({ loading: false });
      return response.data.data;
    } catch (error) {
      console.error("Get support error:", error);
      set({
        error: error.response?.data?.message || error.message,
        loading: false,
      });
      throw error;
    }
  },

  // Update support ticket status
  changeStatus: async (id, status) => {
    set({ loading: true, error: null });
    try {
      const response = await axiosInstance.patch(`/support/${id}/status`, {
        status,
      });

      // Update the ticket in local state
      set((state) => ({
        supports: state.supports.map((ticket) =>
          ticket._id === id ? { ...ticket, status } : ticket
        ),
        loading: false,
      }));

      return response.data;
    } catch (error) {
      console.error("Change status error:", error);
      set({
        error: error.response?.data?.message || error.message,
        loading: false,
      });
      throw error;
    }
  },

  // Delete support ticket
  deleteSupport: async (id) => {
    set({ loading: true, error: null });
    try {
      await axiosInstance.delete(`/support/${id}`);

      // Remove from local state
      set((state) => ({
        supports: state.supports.filter((ticket) => ticket._id !== id),
        loading: false,
      }));

      return { success: true };
    } catch (error) {
      console.error("Delete support error:", error);
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
  reset: () => set({ supports: [], loading: false, error: null }),
}));

export default useSupportStore;
