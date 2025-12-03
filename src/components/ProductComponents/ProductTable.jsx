import React, { useState, useEffect, useMemo } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import useProductStore from "../../store/useProductStore.js";
import {
  Search,
  ChevronDown,
  Download,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Package,
  Filter,
  Clock,
  ChevronRight,
  Eye,
  Star,
} from "lucide-react";
import { useCategoryStore } from "../../store/CategoryStore.js";
import { toast } from "react-toastify";

const IMAGE = import.meta.env.VITE_IMAGE
const ProductTable = () => {
  const navigate = useNavigate();
  const fetchCategories = useCategoryStore((state) => state.fetchCategories);

  const {
    // products,
    fetchProducts,
    deleteProduct,
    toggleStatus,
    toggleBestSeller,
    toggleHideProduct,
  } = useProductStore();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sortBy, setSortBy] = useState("title");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Fetch categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        const categoriesResponse = await fetchCategories();
        setCategories(categoriesResponse.data);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    fetchData();
  }, [fetchCategories]);


  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetchProducts();
        setProducts(res.data.products);   // <-- FIXED
      } catch (error) {
        console.error("Failed to fetch products:", error);
        setProducts([]);
      }
    };

    fetchData();
  }, [fetchProducts]);


  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await fetchProducts();
    } catch (err) {
      toast.error("Failed to fetch products: " + err.message);
    }
    setLastRefresh(new Date());
    setIsLoading(false);
  };

  // Compute table data
  const tableData = useMemo(() => {
    if (!Array.isArray(products)) return [];

    return products.map((prod) => ({
      key: prod._id,
      image: prod.productImages?.[0],
      title: prod.productName,
      category: prod.category,
      originalPrice: prod.originalPrice,
      discountedPrice: prod.discountPrice,
      isActive: prod.isActive,
      bestSeller: prod.bestSeller,
      hideProduct: prod.hideProduct,
    }));
  }, [products]);


  // Filter and sort logic
  const filteredData = useMemo(() => {
    return tableData
      .filter((item) => {
        const matchesSearch = item.title
          .toLowerCase()
          .includes(searchText.toLowerCase());

        const matchesCategory =
          !selectedCategory || item.category?._id === selectedCategory;

        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        let aValue = a[sortBy];
        let bValue = b[sortBy];
        if (sortBy === "title") {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
          if (sortOrder === "asc") {
            return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
          } else {
            return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
          }
        } else {
          aValue = parseFloat(aValue) || 0;
          bValue = parseFloat(bValue) || 0;
          if (sortOrder === "asc") {
            return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
          } else {
            return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
          }
        }
      });
  }, [tableData, searchText, selectedCategory, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleDelete = async (key) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await deleteProduct(key);
      toast.success("Product removed successfully");
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (err) {
      toast.error("Error while removing product");
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await toggleStatus(id);
      toast.success("Product status toggled successfully");
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (err) {
      toast.error("Error toggling status: " + err.message);
    }
  };

  const handleToggleBestSeller = async (id) => {
    try {
      await toggleBestSeller(id);
      toast.success("Best seller status toggled successfully");
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (err) {
      toast.error("Error toggling best seller: " + err.message);
    }
  };

  const handleToggleHide = async (id) => {
    try {
      await toggleHideProduct(id);
      toast.success("Hide status toggled successfully");
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (err) {
      toast.error("Error toggling hide: " + err.message);
    }
  };

  const handlePageSizeChange = (value) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  // Export functionality
  const handleExport = (format = "csv") => {
    const headers = [
      "Title",
      "Category",
      "Original Price",
      "Discount Price",
      "Status",
      "Best Seller",
      "Hidden",
    ];
    const exportData = filteredData.length > 0 ? filteredData : tableData;
    const dataRows = exportData.map((product) => [
      product.title,
      product.category?.name || "N/A",
      product.originalPrice || "",
      product.discountedPrice || "N/A",
      product.isActive ? "Active" : "Inactive",
      product.bestSeller ? "Yes" : "No",
      product.hideProduct ? "Yes" : "No",
    ]);

    let content, mimeType, fileName;

    if (format === "csv") {
      content = [headers, ...dataRows]
        .map((row) => row.map((field) => `"${field}"`).join(","))
        .join("\n");
      mimeType = "text/csv";
      fileName = `products-${new Date().toISOString().split("T")[0]}.csv`;
    } else {
      content = [headers, ...dataRows].map((row) => row.join("\t")).join("\n");
      mimeType = "text/tab-separated-values";
      fileName = `products-${new Date().toISOString().split("T")[0]}.xls`;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Clear filters
  const handleClearFilters = () => {
    setSearchText("");
    setSelectedCategory(null);
    setSortBy("title");
    setSortOrder("asc");
    setShowAdvancedFilters(false);
  };

  // Calculate summary stats
  const totalProducts = products.length;
  const activeProducts = products.filter(
    (p) => p.isActive && !p.hideProduct
  ).length;
  const bestSellers = products.filter((p) => p.bestSeller).length;

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-50 text-green-700 border border-green-200";
      case "inactive":
        return "bg-red-50 text-red-700 border border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border border-gray-200";
    }
  };

  const getBestSellerColor = (isBestSeller) => {
    return isBestSeller
      ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
      : "bg-gray-50 text-gray-700 border border-gray-200";
  };

  const getHideColor = (isHidden) => {
    return isHidden
      ? "bg-orange-50 text-orange-700 border border-orange-200"
      : "bg-green-50 text-green-700 border border-green-200";
  };

  const renderContent = () => {
    if (
      window.location.pathname.includes("/catalogue/product/add-product") ||
      window.location.pathname.includes("/catalogue/product/update-product")
    ) {
      return <Outlet context={{ tableData, setData: null }} />;
    }
    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <div className="p-4 w-full">
          {/* Header */}
          <div className="flex items-center justify-end gap-2 mb-0 py-2">
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-1 px-3 py-2 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Download size={14} />
              Export
            </button>

            <Link
              to="/catalogue/product/add-product"
              className="inline-flex items-center gap-2 bg-[#293a90] hover:bg-[#293a90]/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus size={16} />
              Add Product
            </Link>
          </div>

          {/* Summary Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 w-full">
            <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">
                    Total Products
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    {totalProducts.toLocaleString()}
                  </p>
                </div>
                <div className="p-2 rounded-md bg-[#293a90]/10">
                  <Package className="h-4 w-4 text-[#293a90]" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">
                    Active Products
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    {activeProducts.toLocaleString()}
                  </p>
                </div>
                <div className="p-2 rounded-md bg-green-100">
                  <Eye className="h-4 w-4 text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">
                    Best Sellers
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    {bestSellers.toLocaleString()}
                  </p>
                </div>
                <div className="p-2 rounded-md bg-yellow-100">
                  <Star className="h-4 w-4 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4 w-full">
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#293a90] focus:border-[#293a90] text-xs"
                    />
                  </div>
                </div>

                <select
                  value={selectedCategory || ""}
                  onChange={(e) => setSelectedCategory(e.target.value || null)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-[#293a90]"
                >
                  <option value="">All Categories</option>
                  {categories && categories.length > 0 ? (
                    categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))
                  ) : (
                    <option disabled>Loading categories...</option>
                  )}
                </select>

                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="inline-flex items-center gap-1 px-3 py-2 text-xs border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Filter size={12} />
                  More
                  <ChevronDown
                    size={12}
                    className={showAdvancedFilters ? "rotate-180" : ""}
                  />
                </button>

                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-600">Show:</label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => handlePageSizeChange(e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-[#293a90]"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="text-xs text-gray-600">entries</span>
                </div>
              </div>

              {showAdvancedFilters && (
                <div className="flex flex-wrap gap-3 pt-3 border-t border-gray-200 w-full text-xs">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-[#293a90]"
                  >
                    <option value="title">Sort by Title</option>
                    <option value="originalPrice">
                      Sort by Original Price
                    </option>
                    <option value="discountedPrice">
                      Sort by Discount Price
                    </option>
                  </select>

                  <button
                    onClick={() =>
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                    }
                    className="inline-flex items-center gap-1 px-3 py-2 text-xs border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    {sortOrder === "asc" ? "↑" : "↓"} {sortOrder.toUpperCase()}
                  </button>

                  <button
                    onClick={handleClearFilters}
                    className="inline-flex items-center gap-1 px-3 py-2 text-xs bg-[#eb0082]/10 text-[#eb0082] hover:bg-[#eb0082]/20 rounded-lg"
                  >
                    <ChevronRight size={12} />
                    Clear All
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-visible w-full">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-2 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Image
                    </th>
                    <th className="text-left py-2 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="text-left py-2 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="text-left py-2 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Original Price
                    </th>
                    <th className="text-left py-2 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Discount Price
                    </th>
                    <th className="text-left py-2 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left py-2 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Best Seller
                    </th>
                    <th className="text-left py-2 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hidden
                    </th>
                    <th className="text-left py-2 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedData.map((record) => (
                    <tr
                      key={record.key}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-2 px-4">
                        <img
                          src={`${IMAGE}${record.image}`}
                          alt="Product"
                          className="w-10 h-10 object-cover rounded-md border border-gray-200"
                          crossorigin="anonymous"
                        />
                      </td>
                      <td className="py-2 px-4">
                        <Link
                          to={`/catalogue/product/update-product/${record.key}`}
                          state={{ productData: record }}
                          className="text-xs font-medium text-[#293a90] hover:underline"
                        >
                          {record.title}
                        </Link>
                      </td>
                      <td className="py-2 px-4">
                        <div className="text-xs text-gray-900">
                          {record.category?.name || "N/A"}
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        <div className="text-xs font-medium text-green-600">
                          ₹{record.originalPrice}
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        <div className="text-xs font-medium text-gray-500">
                          ₹{record.discountedPrice || "N/A"}
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        <select
                          value={record.isActive ? "Active" : "Inactive"}
                          onChange={() => handleToggleStatus(record.key)}
                          className={`px-2 py-1 text-xs rounded-full border transition-colors cursor-pointer ${getStatusColor(
                            record.isActive ? "active" : "inactive"
                          )}`}
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </td>
                      <td className="py-2 px-4">
                        <select
                          value={record.bestSeller ? "Best Seller" : "Normal"}
                          onChange={() => handleToggleBestSeller(record.key)}
                          className={`px-2 py-1 text-xs rounded-full border transition-colors cursor-pointer ${getBestSellerColor(
                            record.bestSeller
                          )}`}
                        >
                          <option value="Best Seller">Best Seller</option>
                          <option value="Normal">Normal</option>
                        </select>
                      </td>
                      <td className="py-2 px-4">
                        <select
                          value={record.hideProduct ? "Hidden" : "Visible"}
                          onChange={() => handleToggleHide(record.key)}
                          className={`px-2 py-1 text-xs rounded-full border transition-colors cursor-pointer ${getHideColor(
                            record.hideProduct
                          )}`}
                        >
                          <option value="Hidden">Hidden</option>
                          <option value="Visible">Visible</option>
                        </select>
                      </td>
                      <td className="py-2 px-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() =>
                              navigate(
                                `/catalogue/product/update-product/${record.key}`,
                                {
                                  state: { productData: record },
                                }
                              )
                            }
                            className="p-1 text-[#293a90] hover:bg-[#293a90]/10 rounded"
                          >
                            <Edit size={12} />
                          </button>
                          <button
                            onClick={() => handleDelete(record.key)}
                            className="p-1 text-[#eb0082] hover:bg-[#eb0082]/10 rounded"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paginatedData.length === 0 && (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <Package className="w-8 h-8 text-gray-300" />
                          <span className="text-xs">No products found</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between w-full">
                <div className="text-xs text-gray-700">
                  Showing {startIndex + 1} to{" "}
                  {Math.min(startIndex + itemsPerPage, filteredData.length)} of{" "}
                  {filteredData.length} results
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {Array.from(
                    { length: Math.min(totalPages, 5) },
                    (_, i) => i + 1
                  ).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-2 py-1 text-xs rounded ${currentPage === page
                        ? "bg-[#293a90] text-white border border-[#293a90]"
                        : "border border-gray-300 hover:bg-gray-50"
                        }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return <div>{renderContent()}</div>;
};

export default ProductTable;
