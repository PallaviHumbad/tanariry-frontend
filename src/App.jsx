import React, { useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import OrdersTable from "./components/OrderComponents/OrderTables";
import Statistics from "./components/Dashboard/Statistics";
import RecentOrders from "./components/Dashboard/RecentOrders";
import MainLayout from "./MainLayout/MainLayout";
import ManageProfilePage from "./components/ManageProfile";
import OrderDetailsPage from "./components/OrderComponents/OrderDetailsPage";
import UpdateOrder from "./components/OrderComponents/Update/UpdateOrder";
import ProductTable from "./components/ProductComponents/ProductTable";
import AddProduct from "./components/ProductComponents/AddProduct";
import UpdateProduct from "./components/ProductComponents/UpdateProduct";
import Login from "./pages/Login";
import OrderCancellation from "./components/OrderCancellation";
import Wishlist from "./components/WishList";
import Customer from "./pages/Customer";
import AddCustomerForm from "./components/AddCustomerForm";
import CustomerDetails from "./components/CustomerDetails ";
import CategoriesPage from "./pages/CategoriesPage";
import UpdateCategoryPage from "./components/UpdateCategoryPage";
import AddCategoryPage from "./components/AddCategoryPage";
import DashBoard from "./pages/DashBoard";
import AbandonedCart from "./components/AbandonedCart";
import ChangePassword from "./components/ChangePassword";
import AddOrder from "./components/OrderComponents/Add/AddOrder";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AdminDistributors from "./pages/AdminDistributors";
import AdminInquiries from "./pages/AdminInquiries";
import Setting from "./pages/Setting";
import Help from "./pages/Help";
import ForgotPassword from "./pages/ForgotPassword";
import useAdminStore from "./store/useAdminStore";
import Support from "./pages/Support";
import UserManagement from "./pages/UserManagement";
import AddUserPage from "./components/UserComponents/AddUserPage";
import EditUserPage from "./components/UserComponents/EditUserPage";
import Finance from "./pages/Finance.jsx";
import Report from "./pages/Report.jsx";

export default function App() {
  const { checkAuth, user, initializeAuth } = useAdminStore();

  useEffect(() => {
    initializeAuth();
    checkAuth();
  }, [checkAuth, initializeAuth]);
  return (
    <>
      <BrowserRouter>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss={false}
          draggable
          pauseOnHover={false}
        />
        <Routes>
          {user ? (
            <Route path="/" element={<MainLayout />}>
              <Route path="manage-profile" element={<ManageProfilePage />} />
              <Route path="change-password" element={<ChangePassword />} />
              <Route
                path="sales/cancelled-orders"
                element={<OrderCancellation />}
              />
              <Route path="sales/wishlist" element={<Wishlist />} />
              <Route path="sales/abandoned-cart" element={<AbandonedCart />} />
              <Route path="recentOrders" element={<RecentOrders />} />
              <Route path="dashboard" element={<DashBoard />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="users/add-user" element={<AddUserPage />} />
              <Route path="users/edit-user/:id" element={<EditUserPage />} />
              <Route
                path="customers/addcustomer"
                element={<AddCustomerForm />}
              />
              <Route path="statistics" element={<Statistics />} />
              <Route path="sales/orders">
                <Route index element={<OrdersTable />} />
                {/* <Route path="AddOrder" element={<AddOrder />} /> */}
                <Route
                  path="order-details/:id"
                  element={<OrderDetailsPage />}
                />
                <Route path="order-update/:id" element={<UpdateOrder />} />
              </Route>
              <Route path="customers" element={<Customer />} />
              <Route path="customers/:id" element={<CustomerDetails />} />

              <Route path="catalogue/categories" element={<CategoriesPage />} />
              <Route
                path="catalogue/categories/:id"
                element={<UpdateCategoryPage />}
              />
              <Route
                path="catalogue/categories/addcategory"
                element={<AddCategoryPage />}
              />
              <Route path="sales/exchange" element={<h2>Exchange</h2>} />
              <Route path="sales/returns" element={<h2>Returns</h2>} />
              <Route path="catalogue/product/*" element={<ProductTable />}>
                <Route path="add-product" element={<AddProduct />} />
                <Route path="update-product/:id" element={<UpdateProduct />} />
              </Route>
              <Route path="distributor" element={<AdminDistributors />} />
              <Route path="inquiry" element={<AdminInquiries />} />
              <Route path="contents" element={<h2>Contents</h2>} />
              <Route path="appearance" element={<h2> Appearance </h2>} />
              <Route path="settings" element={<Setting />} />
              <Route path="help" element={<Help />} />
              <Route path="support" element={<Support />} />
              <Route path="finance" element={<Finance />} />
              <Route path="report" element={<Report />} />
            </Route>
          ) : (
            <>
              <Route index element={<Login />} />
              <Route path="forgot-password" element={<ForgotPassword />} />
              <Route path="*" element={<Login />} />
            </>
          )}
        </Routes>
      </BrowserRouter>
    </>
  );
}
