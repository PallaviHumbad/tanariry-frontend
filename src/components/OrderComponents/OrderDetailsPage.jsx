import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Button, Card, Row, Col, Table, Typography, Space } from "antd";
import {
  PrinterOutlined,
  EditOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { ArrowLeft } from "lucide-react";
import useOrderStore from "../../store/useOrderStore";
import { toast } from "react-toastify";

const { Text } = Typography;

const OrderDetailsPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { fetchOrderById, order, loading: storeLoading } = useOrderStore();

  const [localLoading, setLocalLoading] = useState(false);

  useEffect(() => {
    const orderId = id || location.state?.order?._id;
    if (orderId) {
      const getOrderById = async () => {
        setLocalLoading(true);
        try {
          await fetchOrderById(orderId);
        } catch (error) {
          toast.error("Failed to load order details");
        } finally {
          setLocalLoading(false);
        }
      };
      getOrderById();
    }
  }, [id, location.state?.order?._id, fetchOrderById]);

  const currentOrder = order || location.state?.order || {};

  if (
    storeLoading ||
    localLoading ||
    (!order && Object.keys(currentOrder).length === 0)
  ) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#293a90] mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order && Object.keys(currentOrder).length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-sm text-gray-500">
            No order data available. Please select an order from the table.
          </p>
        </div>
      </div>
    );
  }

  const handleBack = () => navigate("../"); // Relative navigation

  const handlePrint = () => window.print();

  const handleUpdate = () => {
    const orderId = order?._id || currentOrder._id;
    if (orderId) {
      navigate(`../order-update/${orderId}`, {
        state: { order: order || currentOrder },
      });
    } else {
      toast.error("Cannot navigate to update page: Order ID is missing");
    }
  };

  // Format currency
  const formatINR = (amount) => {
    const value = (parseFloat(amount || 0) / 100).toFixed(2);
    return `₹${parseFloat(value).toLocaleString("en-IN")}`;
  };

  // ✅ FIXED: Safe date formatting
  const formatDate = (dateString) =>
    dateString && !isNaN(new Date(dateString))
      ? new Date(dateString).toLocaleDateString("en-IN", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "N/A";

  const activeOrder = order || currentOrder;

  // Order Details Section
  const OrderDetailsSection = () => (
    <Card
      className="bg-white rounded-lg border border-gray-200 shadow-sm"
      title={
        <h3 className="text-sm font-semibold text-gray-900">Order Details</h3>
      }
    >
      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <Text strong>Order ID:</Text>
          <Text className="text-[#293a90] font-medium">
            {activeOrder._id?.slice(-6).toUpperCase() || "N/A"}
          </Text>
        </div>
        <div className="flex justify-between">
          <Text strong>Order Date:</Text>
          <Text>{formatDate(activeOrder.createdAt)}</Text>
        </div>
        <div className="flex justify-between">
          <Text strong>Order Status:</Text>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${
              activeOrder.status === "confirmed"
                ? "bg-green-50 text-green-700 border-green-200"
                : activeOrder.status === "pending"
                ? "bg-[#eb0082]/10 text-[#eb0082] border-[#eb0082]/20"
                : activeOrder.status === "cancelled"
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-gray-50 text-gray-700 border-gray-200"
            }`}
          >
            {activeOrder.status || "N/A"}
          </span>
        </div>
        <div className="flex justify-between">
          <Text strong>Payment Status:</Text>
          <Text>{activeOrder.paymentInfo?.status || "N/A"}</Text>
        </div>
        <div className="flex justify-between">
          <Text strong>Total Amount:</Text>
          <Text className="font-semibold text-[#293a90]">
            {formatINR(activeOrder.totalAmount)}
          </Text>
        </div>
      </div>
    </Card>
  );

  // Customer Details Section
  const CustomerDetailsSection = () => (
    <Card
      className="bg-white rounded-lg border border-gray-200 shadow-sm"
      title={
        <h3 className="text-sm font-semibold text-gray-900">
          Customer Details
        </h3>
      }
    >
      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <Text strong>Name:</Text>
          <Text className="text-[#293a90] font-medium">
            {activeOrder.customerId?.firstName}{" "}
            {activeOrder.customerId?.lastName}
          </Text>
        </div>
        <div className="flex justify-between">
          <Text strong>Email:</Text>
          <Text>{activeOrder.customerId?.email || "N/A"}</Text>
        </div>
        <div className="flex justify-between">
          <Text strong>Phone:</Text>
          <Text>{activeOrder.customerId?.phone || "N/A"}</Text>
        </div>
      </div>
    </Card>
  );

  // Address Section
  const AddressSection = ({ type, address }) => (
    <Card
      className="bg-white rounded-lg border border-gray-200 shadow-sm"
      title={
        <h3 className="text-sm font-semibold text-gray-900">{type} Address</h3>
      }
    >
      <div className="space-y-1 text-xs">
        <p className="text-[#293a90] font-medium">
          {activeOrder.customerId?.firstName} {activeOrder.customerId?.lastName}
        </p>
        <p>{address?.address || "N/A"}</p>
        <p>
          {address?.city}, {address?.pincode || "N/A"}
        </p>
        <p>
          {address?.state}, {address?.country || "N/A"}
        </p>
      </div>
    </Card>
  );

  // Order Items Table
  const OrderItemsTable = () => {
    const columns = [
      {
        title: "Product",
        render: (_, item) => (
          <div className="text-xs">
            <div className="font-medium text-[#293a90]">
              {item.name || "Unknown Product"}
            </div>
          </div>
        ),
      },
      {
        title: "Quantity",
        dataIndex: "quantity",
        key: "quantity",
        render: (text) => <span className="text-xs font-medium">{text}</span>,
      },
      {
        title: "Price",
        render: (_, item) => (
          <span className="text-xs font-medium text-green-600">
            {formatINR(item.price)}
          </span>
        ),
      },
      {
        title: "Total",
        render: (_, item) => (
          <span className="text-xs font-bold text-[#293a90]">
            {formatINR(item.subtotal)}
          </span>
        ),
      },
    ];

    return (
      <Card
        className="bg-white rounded-lg border border-gray-200 shadow-sm"
        title={
          <h3 className="text-sm font-semibold text-gray-900">Order Items</h3>
        }
      >
        <Table
          columns={columns}
          dataSource={activeOrder.items || []}
          pagination={false}
          rowKey="_id"
          className="overflow-x-auto font-sans"
          rowClassName={(record, index) =>
            index % 2 === 0 ? "bg-white" : "bg-gray-50"
          }
        />
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="p-4 w-full">
        <div className="print:hidden">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-[#293a90] px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Orders
            </button>

            <div className="flex items-center gap-3">
              <Button
                onClick={handleUpdate}
                className="inline-flex items-center gap-1.5 text-sm text-[#293a90] hover:text-[#293a90]/80 px-4 py-2 rounded-lg hover:bg-[#293a90]/10 transition-colors font-sans border-[#293a90]"
                icon={<EditOutlined />}
              >
                Update Order
              </Button>
              <Button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 text-sm text-[#eb0082] hover:text-[#eb0082]/80 px-4 py-2 rounded-lg hover:bg-[#eb0082]/10 transition-colors font-sans border-[#eb0082]"
                icon={<PrinterOutlined />}
              >
                Print Invoice
              </Button>
            </div>
          </div>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <OrderDetailsSection />
            </Col>
            <Col xs={24} lg={12}>
              <CustomerDetailsSection />
            </Col>
            <Col xs={24} lg={12}>
              <AddressSection
                type="Shipping"
                address={activeOrder.shippingAddress}
              />
            </Col>
            <Col xs={24} lg={12}>
              <OrderItemsTable />
            </Col>
          </Row>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;
