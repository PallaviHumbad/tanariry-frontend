import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useLocation, useParams } from "react-router-dom";
import { Form } from "antd";
import UpdateCustomerDetails from "./UpdateCustomerDetails";
import UpdateProductSelectionStep from "./UpdateProductSelectionStep";
import UpdateShippingAndPaymentOptions from "./UpdateShippingAndPaymentOptions";
import useOrderStore from "../../../store/useOrderStore";
import useUserStore from "../../../store/useUserStore";
import { toast } from "react-toastify";
import {
  Home,
  ArrowLeft,
  Clock,
  User,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

const BreadcrumbNav = () => (
  <div className="flex items-center text-gray-500 mb-4 text-sm">
    <Link to="/sales/orders" className="flex items-center hover:text-blue-600">
      <Home size={14} className="mr-1" />
      <span>Orders</span>
    </Link>
    <span className="mx-2">/</span>
    <span>Update Order</span>
  </div>
);

const FooterButtons = ({ onCancel, loading, disabled }) => (
  <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
    <button
      type="button"
      onClick={onCancel}
      disabled={loading}
      className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
    >
      Cancel
    </button>
    <button
      type="submit"
      disabled={loading || disabled}
      className="px-4 py-2 text-sm font-medium bg-[#293a90] hover:bg-[#293a90]/90 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
    >
      {loading ? (
        <>
          <Clock size={16} className="animate-spin" />
          Saving...
        </>
      ) : (
        "Update Order"
      )}
    </button>
  </div>
);

const UpdateOrder = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const {
    fetchOrderById,
    updateOrder,
    order: storeOrder,
    loading: storeLoading,
  } = useOrderStore();

  const { fetchUserById } = useUserStore();

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [customerData, setCustomerData] = useState(null);
  const [shippingAndPaymentData, setShippingAndPaymentData] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const orderId = id || location.state?.order?._id;
        if (!orderId) {
          toast.error("No order ID found");
          navigate("/sales/orders");
          return;
        }
        const order = await fetchOrderById(orderId);

        if (order.customerId?._id) {
          try {
            const user = await fetchUserById(order.customerId._id);
            setUserInfo(user);

            setCustomerData({
              _id: user._id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              phone: user.phone,
              role: user.role,
              isActive: user.isActive,
              addresses: user.addresses || [],
              selectedBillingAddress: order.shippingAddress || null,
              selectedShippingAddress: order.shippingAddress || null,
            });
          } catch (userError) {
            toast.error("Failed to fetch user info: " + userError.message);
          }
        }

        setSelectedProducts(
          order.items.map((item, index) => ({
            key: Date.now() + index,
            product: { productName: item.name, _id: item.productId || null },
            variant: { price: item.price / 100, _id: null },
            quantity: item.quantity,
            price: item.price / 100,
          }))
        );

        setShippingAndPaymentData({
          shippingMethod: "standard",
          orderStatus: order.status || "pending",
          paymentStatus: order.paymentInfo?.status || "pending",
          discount: 0,
          orderNote: "",
          additionalCharges: [
            { name: "Packaging Charges", amount: 200 },
            { name: "Shipping Charges", amount: 250 },
          ],
        });

        setFetching(false);
      } catch (error) {
        console.error("Load order error:", error);
        toast.error("Failed to fetch order: " + error.message);
        setFetching(false);
      }
    };

    loadOrder();
  }, [id, location.state?.order?._id, fetchOrderById, fetchUserById, navigate]);

  const handleCustomerSelect = useCallback((customer) => {
    setCustomerData(customer);
  }, []);

  const handleShippingAndPaymentChange = useCallback((data) => {
    setShippingAndPaymentData(data);
  }, []);

  const handleProductSelect = useCallback((products) => {
    setSelectedProducts(products);
  }, []);

  const calculateSummary = useCallback(() => {
    const subtotal = selectedProducts.reduce((total, product) => {
      const price = product.price || product.variant?.price || 0;
      return total + price * (product.quantity || 0);
    }, 0);

    const discountPercentage = shippingAndPaymentData?.discount || 0;
    const discountAmount = (subtotal * discountPercentage) / 100;
    const additionalChargesTotal = shippingAndPaymentData
      ? shippingAndPaymentData.additionalCharges.reduce(
          (total, charge) => total + Number(charge.amount || 0),
          0
        )
      : 0;
    const total = subtotal - discountAmount + additionalChargesTotal;

    return {
      subtotal: subtotal.toFixed(2),
      discount: discountAmount.toFixed(2),
      additionalChargesTotal: additionalChargesTotal.toFixed(2),
      total: total < 0 ? "0.00" : total.toFixed(2),
    };
  }, [selectedProducts, shippingAndPaymentData]);

  const summary = calculateSummary();

  const isFormValid =
    customerData &&
    customerData.selectedBillingAddress &&
    customerData.selectedShippingAddress &&
    shippingAndPaymentData &&
    selectedProducts.length > 0;

  const onFinish = async () => {
    if (!isFormValid) {
      toast.error("Please complete all required fields");
      return;
    }

    setLoading(true);
    try {
      const orderId = id || location.state?.order?._id;

      const orderData = {
        customer: customerData._id,
        shippingAddress: customerData.selectedShippingAddress,
        items: selectedProducts.map((p) => ({
          productId: p.product?._id || null,
          name: p.product?.productName || "Custom Item",
          price: Math.round(Number(p.price || p.variant?.price || 0) * 100),
          quantity: p.quantity,
          subtotal: Math.round(
            Number(p.price || p.variant?.price || 0) * p.quantity * 100
          ),
        })),
        status: shippingAndPaymentData.orderStatus,
        totalAmount: Math.round(Number(summary.total) * 100),
      };

      await updateOrder(orderId, orderData);
      toast.success("Order updated successfully!");
      navigate("/sales/orders");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update order");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/sales/orders");
  };

  if (fetching || storeLoading) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#293a90]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="p-6 max-w-6xl mx-auto">
        <BreadcrumbNav />

        <div className="flex justify-between items-center mb-8">
          <button
            onClick={handleCancel}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Orders
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Update Order</h1>
        </div>

        <Form form={form} layout="vertical" onFinish={onFinish}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Customer Details */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 uppercase tracking-wide border-b pb-2">
                Customer Information
              </h2>

              {/* ✅ CUSTOMER DETAILS DISPLAY - UNDER THE BOX */}
              {userInfo && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">
                        {userInfo.firstName} {userInfo.lastName}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {userInfo.role === "customer"
                          ? "Customer"
                          : userInfo.role}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Mail className="w-4 h-4" />
                      <span>{userInfo.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Phone className="w-4 h-4" />
                      <span>{userInfo.phone}</span>
                    </div>
                    {userInfo.isActive && (
                      <div className="flex items-center gap-2 text-green-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Active Customer</span>
                      </div>
                    )}
                  </div>

                  {userInfo.addresses && userInfo.addresses.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-blue-100">
                      <div className="flex items-center gap-2 mb-2 text-xs font-medium text-gray-700">
                        <MapPin className="w-4 h-4" />
                        <span>Primary Address</span>
                      </div>
                      <div className="text-sm text-gray-700">
                        <p>{userInfo.addresses[0].address}</p>
                        <p className="text-xs">
                          {userInfo.addresses[0].city},{" "}
                          {userInfo.addresses[0].state}
                        </p>
                        <p className="text-xs font-medium">
                          {userInfo.addresses[0].pincode}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <UpdateCustomerDetails
                onCustomerSelect={handleCustomerSelect}
                initialCustomer={customerData}
              />
            </div>

            {/* Product Selection */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 uppercase tracking-wide border-b pb-2">
                Product Selection
              </h2>
              <UpdateProductSelectionStep
                onProductSelect={handleProductSelect}
                initialProducts={selectedProducts}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Shipping & Payment */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 uppercase tracking-wide border-b pb-2">
                Shipping & Payment
              </h2>
              <UpdateShippingAndPaymentOptions
                onShippingAndPaymentChange={handleShippingAndPaymentChange}
                initialData={shippingAndPaymentData}
              />
            </div>

            {/* Summary */}
            {selectedProducts.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-6 uppercase tracking-wide border-b pb-2">
                  Order Summary
                </h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between font-medium">
                    <span>Subtotal:</span>
                    <span>₹{summary.subtotal}</span>
                  </div>
                  {shippingAndPaymentData?.additionalCharges?.map(
                    (charge, index) => (
                      <div key={index} className="flex justify-between">
                        <span className="text-gray-600">{charge.name}:</span>
                        <span>₹{Number(charge.amount || 0).toFixed(2)}</span>
                      </div>
                    )
                  )}
                  {shippingAndPaymentData?.discount > 0 && (
                    <div className="flex justify-between text-red-600 font-medium">
                      <span>
                        Discount ({shippingAndPaymentData.discount}%):
                      </span>
                      <span>-₹{summary.discount}</span>
                    </div>
                  )}
                  <div className="border-t pt-4 mt-4 flex justify-between text-xl font-bold text-[#293a90]">
                    <span>Total:</span>
                    <span>₹{summary.total}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <FooterButtons
            onCancel={handleCancel}
            loading={loading}
            disabled={!isFormValid}
          />
        </Form>
      </div>
    </div>
  );
};

export default UpdateOrder;
