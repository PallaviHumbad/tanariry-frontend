import React, { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ComposedChart,
  ResponsiveContainer,
} from "recharts";
import { FiBarChart } from "react-icons/fi";
import { ShoppingBag, TrendingUp, Users, RefreshCw } from "lucide-react";
import DashBoard from "../../pages/DashBoard";
import useAdminStore from "../../store/useAdminStore";
import useOrderStore from "../../store/useOrderStore";

const Statistics = () => {
  const navigate = useNavigate();
  const { user, clearAuth } = useAdminStore();

  const { orders, fetchOrders, loading } = useOrderStore();

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    if (user.role !== "admin" && user.role !== "userpannel") {
      clearAuth();
      navigate("/login", {
        replace: true,
        state: {
          error: `Access denied. Role '${user.role}' is not authorized.`,
        },
      });
      return;
    }
    fetchOrders(1, 100);
  }, [user, navigate, clearAuth, fetchOrders]);

  // Total orders count
  const totalOrders = orders.length;

  // Average order amount (avoid division by zero)
  const avgOrderAmount = totalOrders
    ? orders.reduce((sum, o) => sum + o.totalAmount, 0) / totalOrders
    : 0;

  // Total order amount revenue sum
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);

  // Count product sales considering missing product data as "Unknown Product"
  const productCounts = {};
  orders.forEach((order) => {
    order.items.forEach((item) => {
      const productName =
        item.productId?.productName || item.name || "Unknown Product";
      productCounts[productName] = (productCounts[productName] || 0) + item.quantity;
    });
  });
  // Find top seller product and count
  const topSellerEntry = Object.entries(productCounts).sort(
    (a, b) => b[1] - a[1]
  )[0] || ["Unknown Product", 0];

  // Returns count based on status "returned" or "refunded"
  const returnsCount = orders.filter(
    (o) => o.status === "returned" || o.status === "refunded"
  ).length;

  // Prepare chart data grouped by date, summed
  const chartData = useMemo(() => {
    const map = {};
    orders.forEach((order) => {
      const date = new Date(order.createdAt).toISOString().slice(0, 10); // YYYY-MM-DD
      if (!map[date]) map[date] = { date, orders: 0, amount: 0 };
      map[date].orders += 1;
      map[date].amount += order.totalAmount || 0;
    });
    return Object.values(map).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
  }, [orders]);

  if (!user || (user.role !== "admin" && user.role !== "userpannel")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <DashBoard>
        <div className="w-full flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading statistics...</p>
          </div>
        </div>
      </DashBoard>
    );
  }

  return (
    <DashBoard>
      <div className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 w-full">
          {/* No. of Orders / Avg Order Amount */}
          <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-gray-600 mb-1">
                NO. OF ORDERS / AVG ORDER AMOUNT
              </p>
              <div className="p-2 rounded-md bg-blue-50">
                <ShoppingBag className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-gray-900">
                  {totalOrders}
                </span>
                {/* <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-green-500" />
                  <span className="text-xs font-medium text-green-600">...</span>
                </div> */}
              </div>
              <div className="pt-1 border-t border-gray-100">
                <span className="text-sm font-semibold text-gray-900">
                  ₹{avgOrderAmount.toFixed(2)}
                </span>
                <span className="text-xs text-gray-500 ml-1">avg</span>
              </div>
            </div>
          </div>

          {/* Order Amount */}
          <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">
                  ORDER AMOUNT
                </p>
                <p className="text-lg font-bold text-gray-900">
                  ₹{totalRevenue.toLocaleString("en-IN")}
                </p>
                {/* <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3 text-green-500" />
                  <span className="text-xs font-medium text-green-600">...</span>
                </div> */}
              </div>
              <div className="p-2 rounded-md bg-green-50">
                <FiBarChart className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </div>

          {/* Top Seller */}
          <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-gray-600 mb-1">TOP SELLER</p>
              <div className="p-2 rounded-md bg-purple-50">
                <Users className="h-4 w-4 text-purple-600" />
              </div>
            </div>
            <p className="text-xs font-medium text-gray-900">
              {topSellerEntry[0]} ({topSellerEntry[1]})
            </p>
          </div>

          {/* Returns */}
          <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">RETURNS</p>
                <p className="text-lg font-bold text-gray-900">{returnsCount} Request(s)</p>
              </div>
              <div className="p-2 rounded-md bg-orange-50">
                <RefreshCw className="h-4 w-4 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 w-full">
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-900">
              Orders & Revenue Analytics
            </h3>
            <p className="text-xs text-gray-600">
              Track your order volume and revenue trends
            </p>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: "#6b7280" }}
                axisLine={{ stroke: "#e5e7eb" }}
              />
              <YAxis
                yAxisId="left"
                orientation="left"
                tick={{ fontSize: 12, fill: "#6b7280" }}
                axisLine={{ stroke: "#e5e7eb" }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12, fill: "#6b7280" }}
                axisLine={{ stroke: "#e5e7eb" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Bar
                yAxisId="left"
                dataKey="amount"
                fill="#3b82f6"
                name="Order Amount (₹)"
                barSize={30}
                radius={[2, 2, 0, 0]}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="orders"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 4, fill: "#10b981" }}
                name="Number of Orders"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </DashBoard>
  );
};

export default Statistics;
