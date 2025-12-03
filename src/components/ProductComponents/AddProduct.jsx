import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import MdEditor from "@uiw/react-md-editor";
import useProductStore from "../../store/useProductStore.js";
import { useCategoryStore } from "../../store/CategoryStore.js";
import { toast } from "react-toastify";
import { ArrowLeft, Plus, X, Clock } from "lucide-react";

const ProductDetailsForm = ({
  productName,
  setProductName,
  description,
  setDescription,
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Product Name *
          </label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
            placeholder="Enter product name"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Description *
          </label>
          <div data-color-mode="light">
            <MdEditor
              value={description}
              onChange={(v) => setDescription(v || "")}
              height={200}
              className="border border-gray-300 rounded-lg"
            />
          </div>
          <div className="text-right text-xs text-gray-500 mt-2">
            {description.split(/\s+/).filter(Boolean).length} WORDS
          </div>
        </div>
      </div>
    </div>
  );
};

const PriceFields = ({
  priceINR,
  setPriceINR,
  discountedPriceINR,
  setDiscountedPriceINR,
  priceUSD,
  setPriceUSD,
  discountedPriceUSD,
  setDiscountedPriceUSD,
  stock,
  setStock,
}) => (
  <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
    <h3 className="text-xs font-semibold text-gray-900 mb-4 uppercase tracking-wide">
      Pricing
    </h3>

    <div className="space-y-6">
      <div>
        <h4 className="text-xs font-medium text-gray-700 mb-3">INR Pricing</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Original Price (₹) *
            </label>
            <input
              type="number"
              value={priceINR}
              onChange={(e) => setPriceINR(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Discount Price (₹) *
            </label>
            <input
              type="number"
              value={discountedPriceINR}
              onChange={(e) => setDiscountedPriceINR(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-medium text-gray-700 mb-3">USD Pricing</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Original Price ($) *
            </label>
            <input
              type="number"
              value={priceUSD}
              onChange={(e) => setPriceUSD(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Discount Price ($) *
            </label>
            <input
              type="number"
              value={discountedPriceUSD}
              onChange={(e) => setDiscountedPriceUSD(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Stock *
        </label>
        <input
          type="number"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
          placeholder="0"
        />
      </div>
    </div>
  </div>
);

const ProductImages = ({ images, setImages }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
      <h3 className="text-xs font-semibold text-gray-900 mb-4 uppercase tracking-wide">
        Product Images *
      </h3>

      <div className="flex flex-wrap gap-2">
        {images.map((file) => (
          <div key={file.uid} className="relative">
            <img
              src={file.thumbUrl}
              alt="Preview"
              className="w-20 h-20 object-cover rounded border border-gray-200"
            />
            <button
              onClick={() =>
                setImages(images.filter((img) => img.uid !== file.uid))
              }
              className="absolute top-0 right-0 bg-[#eb0082] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
            >
              <X size={10} />
            </button>
          </div>
        ))}

        <label className="w-20 h-20 border-2 border-dashed border-[#293a90]/30 rounded flex items-center justify-center cursor-pointer">
          <div className="flex flex-col items-center">
            <Plus size={20} className="text-[#293a90]" />
            <span className="text-xs text-[#293a90]">Upload</span>
          </div>
          <input
            type="file"
            multiple
            onChange={(e) => {
              const newFiles = Array.from(e.target.files).map((file) => ({
                uid: Date.now() + Math.random(),
                originFileObj: file,
                thumbUrl: URL.createObjectURL(file),
              }));
              setImages([...images, ...newFiles]);
            }}
            className="hidden"
            accept="image/*"
          />
        </label>
      </div>
    </div>
  );
};

const CategorySubCategorySelect = ({
  allCategories,
  selectedCategoryId,
  setSelectedCategoryId,
  selectedSubCategoryId,
  setSelectedSubCategoryId,
}) => {
  const selectedCategory = allCategories.find(
    (c) => c._id === selectedCategoryId
  );
  const subCategories = selectedCategory?.subCategories || [];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
      <h3 className="text-xs font-semibold text-gray-900 mb-4 uppercase tracking-wide">
        Category & Subcategory *
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Category *
          </label>
          <select
            value={selectedCategoryId}
            onChange={(e) => {
              setSelectedCategoryId(e.target.value);
              setSelectedSubCategoryId("");
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
          >
            <option value="">Select Category</option>
            {allCategories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {selectedCategoryId && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Subcategory *
            </label>
            <select
              value={selectedSubCategoryId}
              onChange={(e) => setSelectedSubCategoryId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
            >
              <option value="">Select Subcategory</option>
              {subCategories.map((sc) => (
                <option key={sc._id} value={sc._id}>
                  {sc.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};

const VisibilityFields = ({
  isActive,
  setIsActive,
  bestSeller,
  setBestSeller,
  hideProduct,
  setHideProduct,
}) => (
  <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
    <h3 className="text-xs font-semibold text-gray-900 mb-4 uppercase tracking-wide">
      Status & Visibility
    </h3>

    <div className="space-y-3">
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-4 w-4"
        />
        <label className="ml-2 text-xs">Active</label>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          checked={bestSeller}
          onChange={(e) => setBestSeller(e.target.checked)}
          className="h-4 w-4"
        />
        <label className="ml-2 text-xs">Best Seller</label>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          checked={hideProduct}
          onChange={(e) => setHideProduct(e.target.checked)}
          className="h-4 w-4"
        />
        <label className="ml-2 text-xs">Hide from Shop</label>
      </div>
    </div>
  </div>
);

const FooterButtons = ({ onCancel, loading }) => (
  <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
    <button
      type="button"
      onClick={onCancel}
      className="px-4 py-2 text-xs border border-gray-300 rounded-lg"
    >
      Cancel
    </button>

    <button
      type="submit"
      disabled={loading}
      className="px-4 py-2 text-xs bg-[#293a90] text-white rounded-lg"
    >
      {loading ? (
        <>
          <Clock size={12} className="animate-spin inline mr-2" />
          Saving...
        </>
      ) : (
        "Save & Close"
      )}
    </button>
  </div>
);

const AddProduct = () => {
  const navigate = useNavigate();
  const { createProduct, loading } = useProductStore();
  const { fetchCategories } = useCategoryStore();

  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [priceINR, setPriceINR] = useState("");
  const [discountedPriceINR, setDiscountedPriceINR] = useState("");
  const [priceUSD, setPriceUSD] = useState("");
  const [discountedPriceUSD, setDiscountedPriceUSD] = useState("");
  const [stock, setStock] = useState("");
  const [images, setImages] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [bestSeller, setBestSeller] = useState(false);
  const [hideProduct, setHideProduct] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const c = await fetchCategories();
        setAllCategories(c);
      } catch {
        toast.error("Failed to fetch categories");
      }
    };
    load();
  }, [fetchCategories]);

  const onFinish = async (e) => {
    e.preventDefault();

    if (
      !productName.trim() ||
      !description.trim() ||
      !priceINR ||
      !discountedPriceINR ||
      !stock ||
      !selectedCategoryId ||
      !selectedSubCategoryId ||
      images.length === 0
    ) {
      toast.error("All fields required");
      return;
    }

    const formData = new FormData();
    formData.append("productName", productName);
    formData.append("description", description);

    // yahi critical mapping hai
    formData.append("originalPrice", priceINR);
    formData.append("discountPrice", discountedPriceINR);

    // optional: USD fields backend me abhi ignore ho jayenge
    formData.append("priceUSD", priceUSD || 0);
    formData.append("discountPriceUSD", discountedPriceUSD || 0);

    formData.append("stock", stock);
    formData.append("category", selectedCategoryId);
    formData.append("subCategoryId", selectedSubCategoryId);
    formData.append("isActive", isActive);
    formData.append("bestSeller", bestSeller);
    formData.append("hideProduct", hideProduct);

    images.forEach((file) => {
      formData.append("productImages", file.originFileObj);
    });

    try {
      await createProduct(formData);
      toast.success("Product created");
      setTimeout(() => {
        window.location.reload();
      }, 800);
      navigate("/catalogue/product");
    } catch (err) {
      toast.error("Create failed: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="p-4 w-full">
        <div className="flex items-center py-2 mb-0">
          <button
            onClick={() => navigate("/catalogue/product")}
            className="inline-flex items-center gap-1.5 text-xs text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-50"
          >
            <ArrowLeft size={14} /> Back
          </button>
        </div>

        <form onSubmit={onFinish} className="space-y-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <ProductDetailsForm
                productName={productName}
                setProductName={setProductName}
                description={description}
                setDescription={setDescription}
              />

              <PriceFields
                priceINR={priceINR}
                setPriceINR={setPriceINR}
                discountedPriceINR={discountedPriceINR}
                setDiscountedPriceINR={setDiscountedPriceINR}
                priceUSD={priceUSD}
                setPriceUSD={setPriceUSD}
                discountedPriceUSD={discountedPriceUSD}
                setDiscountedPriceUSD={setDiscountedPriceUSD}
                stock={stock}
                setStock={setStock}
              />

              <ProductImages images={images} setImages={setImages} />
            </div>

            <div className="space-y-6">
              <CategorySubCategorySelect
                allCategories={allCategories}
                selectedCategoryId={selectedCategoryId}
                setSelectedCategoryId={setSelectedCategoryId}
                selectedSubCategoryId={selectedSubCategoryId}
                setSelectedSubCategoryId={setSelectedSubCategoryId}
              />

              <VisibilityFields
                isActive={isActive}
                setIsActive={setIsActive}
                bestSeller={bestSeller}
                setBestSeller={setBestSeller}
                hideProduct={hideProduct}
                setHideProduct={setHideProduct}
              />
            </div>
          </div>

          <FooterButtons
            onCancel={() => navigate("/catalogue/product")}
            loading={loading}
          />
        </form>
      </div>
    </div>
  );
};

export default AddProduct;
