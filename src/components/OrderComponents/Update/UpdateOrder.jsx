import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useLocation, useParams } from "react-router-dom";
import { Form, Button, Tag, Spin, Alert } from "antd";
import UpdateCustomerDetails from "./UpdateCustomerDetails";
import UpdateProductSelectionStep from "./UpdateProductSelectionStep";
import UpdateShippingAndPaymentOptions from "./UpdateShippingAndPaymentOptions";
import useOrderStore from "../../../store/useOrderStore";
import useUserStore from "../../../store/useUserStore";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Package,
  CreditCard,
  FileText,
  CheckCircle
} from "lucide-react";

const UpdateOrder = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const { fetchOrderById, updateOrder, loading: storeLoading } = useOrderStore();
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

        // 1. Load Customer Info
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
            console.error("User fetch error", userError);
          }
        }

        // 2. Load Products
        setSelectedProducts(
          order.items.map((item, index) => ({
            key: Date.now() + index,
            product: {
              productName: item.name,
              _id: item.productId?._id || item.productId || null,
              productImages: item.productId?.productImages || []
            },
            variant: { price: item.price / 100, _id: null },
            quantity: item.quantity,
            price: item.price / 100,
          }))
        );

        // 3. Load Shipping/Payment
        setShippingAndPaymentData({
          shippingMethod: "standard",
          orderStatus: order.status || "pending",
          paymentStatus: order.paymentInfo?.status || "pending",
          discount: 0,
          orderNote: "",
          additionalCharges: [
            { name: "Packaging", amount: 200 },
            { name: "Shipping", amount: 250 },
          ],
        });

        setFetching(false);
      } catch (error) {
        toast.error("Failed to fetch order: " + error.message);
        setFetching(false);
      }
    };

    loadOrder();
  }, [id, location.state?.order?._id, fetchOrderById, fetchUserById, navigate]);

  const handleCustomerSelect = useCallback((customer) => setCustomerData(customer), []);
  const handleShippingAndPaymentChange = useCallback((data) => setShippingAndPaymentData(data), []);
  const handleProductSelect = useCallback((products) => setSelectedProducts(products), []);

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
          subtotal: Math.round(Number(p.price || p.variant?.price || 0) * p.quantity * 100),
        })),
        status: shippingAndPaymentData.orderStatus,
        paymentInfo: { status: shippingAndPaymentData.paymentStatus },
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

  if (fetching || storeLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12 font-sans">
      {/* Simple Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10 mb-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/sales/orders")}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Update Order</h1>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => navigate("/sales/orders")}>Cancel</Button>
            <Button
              type="primary"
              loading={loading}
              disabled={!isFormValid}
              onClick={() => document.getElementById("update-form-submit").click()}
              className="bg-[#293a90] hover:bg-[#293a90]/90"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <button type="submit" id="update-form-submit" className="hidden" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content Column */}
            <div className="lg:col-span-2 space-y-6">

              {/* Customer Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                  <User size={18} className="text-gray-400" />
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Customer</h2>
                </div>
                <div className="p-6">
                  {userInfo && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-gray-900 text-base">
                            {userInfo.firstName} {userInfo.lastName}
                          </h3>
                          <div className="flex flex-col gap-1 mt-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Mail size={14} /> {userInfo.email}
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone size={14} /> {userInfo.phone}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Tag color="blue">{userInfo.role}</Tag>
                        </div>
                      </div>
                      {userInfo.addresses?.[0] && (
                        <div className="mt-4 pt-4 border-t border-gray-200 flex items-start gap-2 text-sm text-gray-600">
                          <MapPin size={14} className="mt-0.5 shrink-0" />
                          <span>
                            {userInfo.addresses[0].address}, {userInfo.addresses[0].city}, {userInfo.addresses[0].state} - {userInfo.addresses[0].pincode}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  {/* <UpdateCustomerDetails
                    onCustomerSelect={handleCustomerSelect}
                    initialCustomer={customerData}
                  /> */}
                </div>
              </div>

              {/* Product Selection */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                  <Package size={18} className="text-gray-400" />
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Products</h2>
                </div>
                <div className="p-6">
                  <UpdateProductSelectionStep
                    onProductSelect={handleProductSelect}
                    initialProducts={selectedProducts}
                  />
                </div>
              </div>

              {/* Payment & Status */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                  <CreditCard size={18} className="text-gray-400" />
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Payment & Status</h2>
                </div>
                <div className="p-6">
                  <UpdateShippingAndPaymentOptions
                    onShippingAndPaymentChange={handleShippingAndPaymentChange}
                    initialData={shippingAndPaymentData}
                  />
                </div>
              </div>
            </div>

            {/* Sidebar - Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-24">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                  <FileText size={18} className="text-gray-400" />
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Summary</h2>
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">₹{summary.subtotal}</span>
                  </div>

                  {shippingAndPaymentData?.additionalCharges?.map((charge, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-gray-600">{charge.name}</span>
                      <span className="font-medium">₹{Number(charge.amount).toFixed(2)}</span>
                    </div>
                  ))}

                  {shippingAndPaymentData?.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount ({shippingAndPaymentData.discount}%)</span>
                      <span>-₹{summary.discount}</span>
                    </div>
                  )}

                  <div className="border-t border-gray-100 pt-4 mt-2">
                    <div className="flex justify-between items-baseline">
                      <span className="text-base font-bold text-gray-900">Total</span>
                      <span className="text-2xl font-bold text-[#293a90]">₹{summary.total}</span>
                    </div>
                  </div>

                  <Button
                    type="primary"
                    block
                    size="large"
                    loading={loading}
                    disabled={!isFormValid}
                    onClick={() => document.getElementById("update-form-submit").click()}
                    className="mt-4 bg-[#293a90] hover:bg-[#293a90]/90"
                  >
                    Update Order
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default UpdateOrder;
