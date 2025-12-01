import { create } from "zustand";
import axiosInstance from "../../utils/axios";

const useAuthStore = create((set) => ({
  loading: false,
  error: null,
  successMessage: null,

  // Change Password Action
  changePassword: async (passwordData) => {
    set({ loading: true, error: null, successMessage: null });
    try {
      const response = await axiosInstance.post(
        "/auth/change-password",
        passwordData
      );

      console.log("Password Change Response:", response.data);

      set({
        loading: false,
        successMessage:
          response.data.message || "Password changed successfully",
        error: null,
      });

      return response.data;
    } catch (error) {
      console.error("Password Change Error:", error.response?.data);
      set({
        error: error.response?.data?.message || "Failed to change password",
        loading: false,
        successMessage: null,
      });
      throw error;
    }
  },

  // Forgot Password Action
  forgotPassword: async (email) => {
    set({ loading: true, error: null, successMessage: null });
    try {
      const response = await axiosInstance.post("/auth/forgot-password", {
        email,
      });

      console.log("Forgot Password Response:", response.data);

      set({
        loading: false,
        successMessage:
          response.data.message || "Password reset email sent successfully",
        error: null,
      });

      return response.data;
    } catch (error) {
      console.error("Forgot Password Error:", error.response?.data);
      set({
        error:
          error.response?.data?.message ||
          "Failed to send password reset email",
        loading: false,
        successMessage: null,
      });
      throw error;
    }
  },

  // Reset Password Action
  resetPassword: async (resetData) => {
    set({ loading: true, error: null, successMessage: null });
    try {
      const response = await axiosInstance.post(
        "/auth/reset-password",
        resetData
      );

      console.log("Reset Password Response:", response.data);

      set({
        loading: false,
        successMessage: response.data.message || "Password reset successful",
        error: null,
      });

      return response.data;
    } catch (error) {
      console.error("Reset Password Error:", error.response?.data);
      set({
        error: error.response?.data?.message || "Failed to reset password",
        loading: false,
        successMessage: null,
      });
      throw error;
    }
  },

  // Clear messages
  clearMessages: () => set({ error: null, successMessage: null }),
}));

export default useAuthStore;
