import { create } from "zustand";
import axiosInstance from "../../utils/axios";

const useReturnStore = create((set) => ({
  // State
  returnRequests: [],
  myReturnRequests: [],
  currentReturnRequest: null,
  loading: false,
  error: null,
  successMessage: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },

  // Submit Return Request (Customer)
  submitReturnRequest: async (orderId, returnData, images = []) => {
    set({ loading: true, error: null, successMessage: null });
    try {
      const formData = new FormData();
      formData.append("reason", returnData.reason);
      formData.append("reasonCategory", returnData.reasonCategory);

      // Append images if any
      images.forEach((image, index) => {
        formData.append("images", {
          uri: image.uri,
          type: image.type || "image/jpeg",
          name: image.name || `return_image_${index}.jpg`,
        });
      });

      const response = await axiosInstance.post(
        `/orders/${orderId}/return-request`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Submit Return Request Response:", response.data);

      set({
        loading: false,
        successMessage:
          response.data.message || "Return request submitted successfully",
        error: null,
      });

      return response.data;
    } catch (error) {
      console.error("Submit Return Request Error:", error.response?.data);
      set({
        error:
          error.response?.data?.message || "Failed to submit return request",
        loading: false,
        successMessage: null,
      });
      throw error;
    }
  },

  // Get All Return Requests (Admin)
  getAllReturnRequests: async (filters = {}) => {
    set({ loading: true, error: null, successMessage: null });
    try {
      const { status, page = 1, limit = 20 } = filters;
      const params = {
        page,
        limit,
        ...(status && { status }),
      };

      const response = await axiosInstance.get("/orders/return-requests", {
        params,
      });

      console.log("Get All Return Requests Response:", response.data);

      set({
        returnRequests: response.data.data.returnRequests,
        pagination: response.data.data.pagination,
        loading: false,
        error: null,
      });

      return response.data;
    } catch (error) {
      console.error("Get All Return Requests Error:", error.response?.data);
      set({
        error:
          error.response?.data?.message || "Failed to fetch return requests",
        loading: false,
      });
      throw error;
    }
  },

  // Get My Return Requests (Customer)
  getMyReturnRequests: async () => {
    set({ loading: true, error: null, successMessage: null });
    try {
      const response = await axiosInstance.get("/orders/my-return-requests");

      console.log("Get My Return Requests Response:", response.data);

      set({
        myReturnRequests: response.data.data,
        loading: false,
        error: null,
      });

      return response.data;
    } catch (error) {
      console.error("Get My Return Requests Error:", error.response?.data);
      set({
        error:
          error.response?.data?.message ||
          "Failed to fetch your return requests",
        loading: false,
      });
      throw error;
    }
  },

  // Approve Return Request (Admin)
  approveReturnRequest: async (orderId, approvalData) => {
    set({ loading: true, error: null, successMessage: null });
    try {
      const response = await axiosInstance.post(
        `/orders/${orderId}/return-request/approve`,
        approvalData
      );

      console.log("Approve Return Request Response:", response.data);

      // Update the return request in the list
      set((state) => ({
        returnRequests: state.returnRequests.map((req) =>
          req._id === orderId ? response.data.data : req
        ),
        loading: false,
        successMessage:
          response.data.message || "Return request approved successfully",
        error: null,
      }));

      return response.data;
    } catch (error) {
      console.error("Approve Return Request Error:", error.response?.data);
      set({
        error:
          error.response?.data?.message || "Failed to approve return request",
        loading: false,
        successMessage: null,
      });
      throw error;
    }
  },

  // Reject Return Request (Admin)
  rejectReturnRequest: async (orderId, rejectionData) => {
    set({ loading: true, error: null, successMessage: null });
    try {
      const response = await axiosInstance.post(
        `/orders/${orderId}/return-request/reject`,
        rejectionData
      );

      console.log("Reject Return Request Response:", response.data);

      // Update the return request in the list
      set((state) => ({
        returnRequests: state.returnRequests.map((req) =>
          req._id === orderId ? response.data.data : req
        ),
        loading: false,
        successMessage:
          response.data.message || "Return request rejected successfully",
        error: null,
      }));

      return response.data;
    } catch (error) {
      console.error("Reject Return Request Error:", error.response?.data);
      set({
        error:
          error.response?.data?.message || "Failed to reject return request",
        loading: false,
        successMessage: null,
      });
      throw error;
    }
  },

  // Complete Return Request (Admin)
  completeReturnRequest: async (orderId) => {
    set({ loading: true, error: null, successMessage: null });
    try {
      const response = await axiosInstance.post(
        `/orders/${orderId}/return-request/complete`
      );

      console.log("Complete Return Request Response:", response.data);

      // Update the return request in the list
      set((state) => ({
        returnRequests: state.returnRequests.map((req) =>
          req._id === orderId ? response.data.data : req
        ),
        loading: false,
        successMessage:
          response.data.message ||
          "Return completed and refund initiated successfully",
        error: null,
      }));

      return response.data;
    } catch (error) {
      console.error("Complete Return Request Error:", error.response?.data);
      set({
        error:
          error.response?.data?.message || "Failed to complete return request",
        loading: false,
        successMessage: null,
      });
      throw error;
    }
  },

  // Cancel Return Request (Customer)
  cancelReturnRequest: async (orderId) => {
    set({ loading: true, error: null, successMessage: null });
    try {
      const response = await axiosInstance.post(
        `/orders/${orderId}/return-request/cancel`
      );

      console.log("Cancel Return Request Response:", response.data);

      // Remove the cancelled return from my requests
      set((state) => ({
        myReturnRequests: state.myReturnRequests.filter(
          (req) => req._id !== orderId
        ),
        loading: false,
        successMessage:
          response.data.message || "Return request cancelled successfully",
        error: null,
      }));

      return response.data;
    } catch (error) {
      console.error("Cancel Return Request Error:", error.response?.data);
      set({
        error:
          error.response?.data?.message || "Failed to cancel return request",
        loading: false,
        successMessage: null,
      });
      throw error;
    }
  },

  // Set Current Return Request
  setCurrentReturnRequest: (returnRequest) => {
    set({ currentReturnRequest: returnRequest });
  },

  // Clear messages
  clearMessages: () => set({ error: null, successMessage: null }),

  // Reset Store
  resetStore: () => {
    set({
      returnRequests: [],
      myReturnRequests: [],
      currentReturnRequest: null,
      loading: false,
      error: null,
      successMessage: null,
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        pages: 0,
      },
    });
  },
}));

export default useReturnStore;
