import React, { useState, useEffect, useCallback } from "react";
import {
  Form,
  AutoComplete,
  Input,
  Button,
  Image,
  Table,
  Spin,
  Alert,
} from "antd";
import { AiOutlineMinus, AiOutlinePlus } from "react-icons/ai";
import { DeleteOutlined, SearchOutlined } from "@ant-design/icons";
import useProductStore from "../../../store/useProductStore";
import debounce from "lodash/debounce";

const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE || "";

// UpdateQuantityControl component
const UpdateQuantityControl = ({ value = 1, onChange }) => {
  const handleDecrease = () => value > 1 && onChange(value - 1);
  const handleIncrease = () => onChange(value + 1);

  return (
    <div className="flex items-center justify-center gap-2 bg-gray-50 rounded-lg p-1 border border-gray-200">
      <button
        type="button"
        onClick={handleDecrease}
        disabled={value <= 1}
        className="w-7 h-7 flex items-center justify-center bg-white border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <AiOutlineMinus className="text-gray-600 text-sm" />
      </button>
      <span className="w-10 text-center font-semibold text-sm text-gray-900">{value}</span>
      <button
        type="button"
        onClick={handleIncrease}
        className="w-7 h-7 flex items-center justify-center bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
      >
        <AiOutlinePlus className="text-gray-600 text-sm" />
      </button>
    </div>
  );
};

// UpdateProductTable component
const UpdateProductTable = ({ data = [], onRemove, onQuantityChange }) => {
  const columns = [
    {
      title: "Image",
      key: "image",
      width: 80,
      render: (_, record) => {
        const imageSrc = record.product?.productImages?.[0]
          ? `${IMAGE_BASE_URL}${record.product.productImages[0]}`
          : "/default-image.jpg";

        return (
          <div className="flex items-center justify-center">
            <Image
              src={imageSrc}
              alt={record.product?.productName || "product"}
              width={60}
              height={60}
              className="rounded-lg border border-gray-200 object-cover"
              preview={false}
              fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
            />
          </div>
        );
      },
    },
    {
      title: "Product",
      key: "name",
      render: (_, record) => (
        <div>
          <div className="text-sm font-semibold text-gray-900">
            {record.product?.productName || "Unknown Product"}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            SKU: {record.product?._id?.slice(-6).toUpperCase() || "N/A"}
          </div>
        </div>
      ),
    },
    {
      title: "Price",
      key: "price",
      align: "right",
      width: 100,
      render: (_, record) => (
        <span className="text-sm font-semibold text-gray-900">
          ₹{Number(record.price || 0).toFixed(2)}
        </span>
      ),
    },
    {
      title: "Qty",
      key: "quantity",
      align: "center",
      width: 140,
      render: (_, record) => (
        <UpdateQuantityControl
          value={record.quantity || 1}
          onChange={(q) => onQuantityChange(record.key, q)}
        />
      ),
    },
    {
      title: "Total",
      key: "total",
      align: "right",
      width: 120,
      render: (_, record) => (
        <span className="text-sm font-bold text-[#293a90]">
          ₹{((record.price || 0) * (record.quantity || 0)).toFixed(2)}
        </span>
      ),
    },
    {
      title: "Action",
      key: "action",
      align: "center",
      width: 80,
      render: (_, record) => (
        <Button
          type="text"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            onRemove(record.key);
          }}
          className="hover:bg-red-50"
        />
      ),
    },
  ];

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <Table
        columns={columns}
        dataSource={data}
        pagination={false}
        size="middle"
        className="custom-product-table"
        scroll={{ x: "max-content" }}
        onRow={(record) => ({
          onClick: (e) => e.stopPropagation(),
        })}
      />
    </div>
  );
};

// UpdateProductInput component
const UpdateProductInput = ({ onAdd, products = [] }) => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [searchValue, setSearchValue] = useState("");
  const [options, setOptions] = useState([]);

  const searchProducts = useCallback(
    debounce((value) => {
      if (!value.trim()) {
        setOptions([]);
        return;
      }
      const filtered = products
        .filter((p) =>
          p.productName?.toLowerCase().includes(value.toLowerCase())
        )
        .slice(0, 10)
        .map((p) => ({
          value: p._id,
          label: (
            <div className="flex items-center gap-3 py-1">
              <img
                src={p.productImages?.[0] ? `${IMAGE_BASE_URL}${p.productImages[0]}` : "/default-image.jpg"}
                alt={p.productName}
                className="w-10 h-10 object-cover rounded border"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{p.productName}</div>
                <div className="text-xs text-gray-500">₹{p.discountPrice || p.originalPrice}</div>
              </div>
            </div>
          ),
        }));
      setOptions(filtered);
    }, 300),
    [products]
  );

  const handleSelect = (value) => {
    const product = products.find((p) => p._id === value);
    setSelectedProduct(product);
    setSearchValue(product?.productName || "");
    setOptions([]);
  };

  const handleAdd = (e) => {
    e?.stopPropagation();
    if (!selectedProduct) return;
    const price = Number(
      selectedProduct.discountPrice || selectedProduct.originalPrice || 0
    );
    onAdd({
      key: Date.now(),
      product: selectedProduct,
      price,
      quantity,
    });
    setSelectedProduct(null);
    setQuantity(1);
    setSearchValue("");
    setOptions([]);
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <SearchOutlined className="text-gray-400 text-lg" />
        <h3 className="text-base font-semibold text-gray-900 m-0">Search Product</h3>
      </div>

      <Form layout="vertical">
        <Form.Item label={<span className="text-sm font-medium text-gray-700">Product Name</span>} className="mb-4">
          <AutoComplete
            options={options}
            onSearch={searchProducts}
            onSelect={handleSelect}
            value={searchValue}
            onChange={setSearchValue}
            // placeholder="Type product name to search..."
            allowClear
            size="large"
            className="w-full"
          >
            <Input prefix={<SearchOutlined className="text-gray-400" />} />
          </AutoComplete>
        </Form.Item>

        {selectedProduct && (
          <div className="flex items-center gap-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
            <Image
              src={selectedProduct.productImages?.[0] ? `${IMAGE_BASE_URL}${selectedProduct.productImages[0]}` : "/default-image.jpg"}
              width={80}
              height={80}
              alt={selectedProduct.productName}
              preview={false}
              className="rounded-lg border border-gray-200 object-cover"
            />
            <div className="flex-1">
              <div className="font-semibold text-gray-900 text-base">{selectedProduct.productName}</div>
              <div className="text-lg font-bold text-[#293a90] mt-1">
                ₹{selectedProduct.discountPrice || selectedProduct.originalPrice}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div>
                <label className="text-xs text-gray-600 block mb-1">Quantity</label>
                <Input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                  className="w-20 text-center font-semibold"
                  size="large"
                />
              </div>
              <Button
                type="primary"
                onClick={handleAdd}
                size="large"
                className="bg-[#293a90] hover:bg-[#293a90]/90 border-none font-medium px-6 shadow-sm"
              >
                Add Product
              </Button>
            </div>
          </div>
        )}
      </Form>
    </div>
  );
};

// Main Component
const UpdateProductSelectionStep = ({
  onProductSelect,
  initialProducts = [],
}) => {
  const { products, loading, error, fetchProducts } = useProductStore();
  const [selectedProducts, setSelectedProducts] = useState([]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Load initial products from existing order
  useEffect(() => {
    if (initialProducts.length > 0 && selectedProducts.length === 0) {
      const safeProducts = initialProducts.map((item) => {
        const product = item.product || {};
        const price =
          Number(item.price) ||
          product.discountPrice ||
          product.originalPrice ||
          0;

        return {
          key: item.key || Date.now() + Math.random(),
          product: {
            _id: product._id || "unknown",
            productName: product.productName || "Deleted Product",
            productImages: product.productImages || [],
          },
          price,
          quantity: Number(item.quantity) || 1,
        };
      });
      setSelectedProducts(safeProducts);
    }
  }, [initialProducts, selectedProducts.length]);

  useEffect(() => {
    onProductSelect(selectedProducts);
  }, [selectedProducts, onProductSelect]);

  const addProduct = (newItem) => {
    setSelectedProducts((prev) => {
      const exists = prev.find((p) => p.product._id === newItem.product._id);
      if (exists) {
        return prev.map((p) =>
          p.product._id === newItem.product._id
            ? { ...p, quantity: p.quantity + newItem.quantity }
            : p
        );
      }
      return [...prev, newItem];
    });
  };

  const removeProduct = (key) => {
    setSelectedProducts((prev) => prev.filter((p) => p.key !== key));
  };

  const updateQuantity = (key, qty) => {
    setSelectedProducts((prev) =>
      prev.map((p) => (p.key === key ? { ...p, quantity: qty } : p))
    );
  };

  const tableData = selectedProducts.map((p) => ({
    key: p.key,
    product: p.product,
    price: p.price,
    quantity: p.quantity,
  }));

  return (
    <div className="space-y-6">
      <style jsx>{`
        .custom-product-table .ant-table-thead > tr > th {
          background: #f9fafb !important;
          font-weight: 600 !important;
          font-size: 13px !important;
          color: #374151 !important;
          border-bottom: 2px solid #e5e7eb !important;
        }
        .custom-product-table .ant-table-tbody > tr:hover > td {
          background: #f9fafb !important;
        }
      `}</style>

      {loading && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Spin size="large" tip="Loading products..." />
        </div>
      )}

      {error && (
        <Alert
          message="Failed to load products"
          description={error}
          type="error"
          showIcon
          className="rounded-xl"
        />
      )}

      {!loading && products.length > 0 && (
        <>
          <UpdateProductInput
            onAdd={addProduct}
            products={products.filter((p) => p.isActive && !p.hideProduct)}
          />

          {selectedProducts.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900">
                  Selected Products ({selectedProducts.length})
                </h3>
                <div className="text-sm text-gray-500">
                  Total: <span className="font-bold text-[#293a90] text-lg">
                    ₹{selectedProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0).toFixed(2)}
                  </span>
                </div>
              </div>
              <UpdateProductTable
                data={tableData}
                onRemove={removeProduct}
                onQuantityChange={updateQuantity}
              />
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
              <SearchOutlined className="text-gray-300 text-4xl mb-3" />
              <p className="text-gray-500 font-medium">No products selected</p>
              <p className="text-sm text-gray-400">Search and add products above</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UpdateProductSelectionStep;
