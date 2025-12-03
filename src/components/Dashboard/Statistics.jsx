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
      productCounts[productName] =
        (productCounts[productName] || 0) + item.quantity;
    });
  });
  // Find top seller product and count
  const topSellerEntry =
    Object.entries(productCounts).sort((a, b) => b[1] - a[1])[0] || [
      "Unknown Product",
      0,
    ];

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
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [orders]);

  if (!user || (user.role !== "admin" && user.role !== "userpannel")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">Verifying access...</p>
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
            <p className="mt-4 text-sm text-gray-600">Loading statistics...</p>
          </div>
        </div>
      </DashBoard>
    );
  }

  return (
    <DashBoard>
      <div className="w-full p-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Statistics</h1>
          <p className="text-sm text-gray-600 mt-1">
            Overview of your business performance
          </p>
        </div>

        {/* Stats Cards - Consistent Height */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 w-full">
          {/* Total Orders */}
          <div className="bg-white rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow border border-gray-200 h-[140px] flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Total Orders
                </p>
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-gray-900">
                    {totalOrders}
                  </p>
                  <p className="text-xs text-gray-500">orders placed</p>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-blue-50">
                <ShoppingBag className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Average Order Amount */}
          <div className="bg-white rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow border border-gray-200 h-[140px] flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Avg Order Value
                </p>
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-gray-900">
                    ₹{avgOrderAmount.toFixed(0)}
                  </p>
                  <p className="text-xs text-gray-500">per order</p>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-purple-50">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Total Revenue */}
          <div className="bg-white rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow border border-gray-200 h-[140px] flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Total Revenue
                </p>
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-gray-900">
                    ₹{(totalRevenue / 1000).toFixed(1)}k
                  </p>
                  <p className="text-xs text-gray-500">
                    ₹{totalRevenue.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-green-50">
                <FiBarChart className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </div>

          {/* Returns */}
          <div className="bg-white rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow border border-gray-200 h-[140px] flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Returns
                </p>
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-gray-900">
                    {returnsCount}
                  </p>
                  <p className="text-xs text-gray-500">return requests</p>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-orange-50">
                <RefreshCw className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Top Seller Card - Full Width */}
        <div className="bg-white rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow border border-gray-200 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-50">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Top Selling Product
                </p>
                <p className="text-xl font-bold text-gray-900">
                  {topSellerEntry[0]}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-purple-600">
                {topSellerEntry[1]}
              </p>
              <p className="text-xs text-gray-500">units sold</p>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 w-full">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Orders & Revenue Analytics
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Track your order volume and revenue trends over time
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
                  padding: "8px 12px",
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: "12px", paddingTop: "16px" }}
                iconSize={12}
              />
              <Bar
                yAxisId="left"
                dataKey="amount"
                fill="#3b82f6"
                name="Order Amount (₹)"
                barSize={30}
                radius={[4, 4, 0, 0]}
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
