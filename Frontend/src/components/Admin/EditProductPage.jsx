import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { fetchProductDetails } from '../../redux/slices/productSlice';
import { upadateProduct } from '../../redux/slices/adminProductSlice';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/config';
import { 
  ArrowLeft, 
  Package, 
  DollarSign, 
  Hash, 
  Layers, 
  Coffee, 
  Tag, 
  Grid, 
  Upload, 
  Image as ImageIcon, 
  X, 
  Save
} from 'react-feather';

const EditProductPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const { selectedProduct, loading, error } = useSelector((state) => state.products);

  const [productData, setProductData] = useState({
    name: "",
    description: "",
    price: 0,
    discountPrice: 0,
    countInStock: 0,
    sku: "",
    category: "",
    brand: "",
    sizes: [],
    colors: [],
    collections: "",
    material: "",
    gender: "",
    images: []
  });

  const [uploading, setUploading] = useState(false);
  
  useEffect(() => {
    if (id) {
      dispatch(fetchProductDetails(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (selectedProduct) {
      setProductData(selectedProduct);
    }
  }, [selectedProduct]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProductData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("image", file);

    try {
      setUploading(true);
      const { data } = await axios.post(
        `${API_BASE_URL}/api/upload`,
        formData,
        {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem('userToken')}`
          }
        }
      );
      setProductData((prevData) => ({
        ...prevData,
        images: [...prevData.images, { url: data.imageUrl, altText: "" }],
      }));
      setUploading(false);
      toast.success("Image uploaded successfully!");
    } catch (error) {
      console.log("Upload Error:", error.response?.data || error);
      setUploading(false);
      const errorMessage = error.response?.data?.msg || error.message || "Failed to upload image.";
      toast.error(errorMessage);
    }
  };

  const removeImage = (indexToRemove) => {
    setProductData((prevData) => ({
      ...prevData,
      images: prevData.images.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(upadateProduct({ id, productData }));
    toast.success("Product updated successfully!");
    navigate("/admin/products");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mx-auto max-w-5xl mt-8">
        <p className="font-bold">Error</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white mx-auto max-w-5xl p-8 shadow-lg rounded-lg">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl  text-gray-800">Edit Product</h2>
          <Link 
            to="/admin/products" 
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 transition-colors font-medium"
          >
            <ArrowLeft size={18} />
            Back to Products
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information Section */}
            <div className="md:col-span-2 bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                <Package size={18} className="mr-2" />
                Basic Information
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    required
                    name="name"
                    value={productData.name}
                    onChange={handleChange}
                    placeholder="Enter product name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    value={productData.description}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    onChange={handleChange}
                    rows={4}
                    required
                    placeholder="Describe your product in detail"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search Keywords</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    placeholder="Enter keywords separated by commas (e.g. western, dress, casual)"
                    value={Array.isArray(productData.keywords) ? productData.keywords.join(', ') : (productData.keywords || '')}
                    onChange={(e) => {
                      const values = e.target.value.split(',').map(item => item.trim()).filter(Boolean);
                      setProductData(prev => ({ ...prev, keywords: values }));
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1">These keywords help customers find this product via the search bar.</p>
                </div>
              </div>
            </div>

            {/* Pricing & Inventory Section */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                <DollarSign size={18} className="mr-2" />
                Pricing & Inventory
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">₹</span>
                    </div>
                    <input
                      type="number"
                      className="w-full border border-gray-300 rounded-lg p-3 pl-8 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                      required
                      name="price"
                      value={productData.price}
                      onChange={handleChange}
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Price (Selling Price)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">₹</span>
                    </div>
                    <input
                      type="number"
                      className="w-full border border-gray-300 rounded-lg p-3 pl-8 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                      name="discountPrice"
                      value={productData.discountPrice}
                      onChange={handleChange}
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Count in Stock</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    required
                    name="countInStock"
                    value={productData.countInStock}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                  <input
                    type="text"
                    name="brand"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:border-transparent bg-white"
                    value={productData.brand}
                    onChange={handleChange}
                    placeholder="Enter brand name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Hash size={16} className="text-gray-500" />
                      </div>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-lg p-3 pl-10 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                        required
                        name="sku"
                        value={productData.sku}
                        readOnly
                        placeholder="Auto-generated"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const id = 'SKU-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
                        setProductData(prev => ({ ...prev, sku: id }));
                      }}
                      className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-black transition-colors whitespace-nowrap"
                    >
                      Generate
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Attributes Section */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                <Tag size={18} className="mr-2" />
                Product Attributes
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sizes</label>
                  <div className="flex flex-wrap gap-2">
                    {['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '28', '30', '32', '34', '36', '38', '40', '42'].map((size) => {
                      const isSelected = productData.sizes.includes(size);
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => {
                            setProductData(prev => ({
                              ...prev,
                              sizes: isSelected
                                ? prev.sizes.filter(s => s !== size)
                                : [...prev.sizes, size]
                            }));
                          }}
                          className={`min-w-[44px] h-10 px-3 rounded-lg text-sm font-semibold transition-all ${
                            isSelected
                              ? 'bg-gray-900 text-white border border-gray-900'
                              : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-500'
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Colors</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {[
                      { name: 'Red', hex: '#EF4444' },
                      { name: 'Blue', hex: '#3B82F6' },
                      { name: 'Black', hex: '#111827' },
                      { name: 'White', hex: '#FFFFFF' },
                      { name: 'Green', hex: '#16A34A' },
                      { name: 'Yellow', hex: '#EAB308' },
                      { name: 'Pink', hex: '#EC4899' },
                      { name: 'Gray', hex: '#9CA3AF' },
                      { name: 'Navy', hex: '#1E3A5F' },
                      { name: 'Beige', hex: '#D2B48C' },
                      { name: 'Brown', hex: '#92400E' },
                      { name: 'Purple', hex: '#7C3AED' },
                      { name: 'Orange', hex: '#F97316' },
                      { name: 'Maroon', hex: '#7F1D1D' },
                    ].map((color) => {
                      const colorEntry = `${color.name}:${color.hex}`;
                      const isSelected = productData.colors.some(c => c === color.name || c === colorEntry || c.startsWith(color.name + ':#'));
                      return (
                        <button
                          key={color.name}
                          type="button"
                          onClick={() => {
                            setProductData(prev => ({
                              ...prev,
                              colors: isSelected
                                ? prev.colors.filter(c => c !== color.name && c !== colorEntry && !c.startsWith(color.name + ':#'))
                                : [...prev.colors, colorEntry]
                            }));
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                            isSelected
                              ? 'border-black bg-gray-900 text-white'
                              : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                          }`}
                        >
                          <span
                            className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
                            style={{ backgroundColor: color.hex }}
                          />
                          {color.name}
                        </button>
                      );
                    })}
                  </div>
                  {productData.colors.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-xs text-gray-500 self-center">Selected:</span>
                      {productData.colors.map((c) => {
                        const colonHashIdx = c.lastIndexOf(':#');
                        const colorName = colonHashIdx > 0 ? c.substring(0, colonHashIdx) : c;
                        const colorHex = colonHashIdx > 0 ? c.substring(colonHashIdx + 1) : c;
                        return (
                          <span key={c} className="flex items-center gap-1 bg-white border border-gray-200 rounded-full px-2 py-0.5">
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-gray-300 flex-shrink-0"
                              style={{ backgroundColor: colorHex }}
                            />
                            <span className="text-xs font-medium text-gray-700">{colorName}</span>
                          </span>
                        );
                      })}
                    </div>
                  )}
                  {/* Add Custom Color */}
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <p className="text-xs font-medium text-gray-500 mb-2">Add Custom Color</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Color name"
                        id="editCustomColorName"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <input
                        type="color"
                        id="editCustomColorHex"
                        defaultValue="#000000"
                        className="w-10 h-10 border border-gray-200 cursor-pointer p-0.5 rounded"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const nameInput = document.getElementById('editCustomColorName');
                          const hexInput = document.getElementById('editCustomColorHex');
                          const name = nameInput.value.trim();
                          const hex = hexInput.value;
                          if (name) {
                            const colorEntry = `${name}:${hex}`;
                            const alreadyAdded = productData.colors.some(c => c === name || c.startsWith(name + ':#'));
                            if (!alreadyAdded) {
                              setProductData(prev => ({
                                ...prev,
                                colors: [...prev.colors, colorEntry]
                              }));
                              nameInput.value = '';
                            }
                          }
                        }}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Image Upload Section */}
            <div className="md:col-span-2 bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                <ImageIcon size={18} className="mr-2" />
                Product Images
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <label className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 transition-colors text-white font-medium py-2 px-4 rounded-lg cursor-pointer">
                    <Upload size={18} className="mr-2" />
                    Upload Image
                    <input 
                      type="file" 
                      onChange={handleImageUpload} 
                      className="hidden" 
                      accept="image/*"
                    />
                  </label>
                  {uploading && (
                    <div className="ml-4 flex items-center text-indigo-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2"></div>
                      Uploading...
                    </div>
                  )}
                </div>
                
                {productData.images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
                    {productData.images.map((image, index) => (
                      <div 
                        key={index} 
                        className="relative group border border-gray-200 rounded-lg overflow-hidden"
                      >
                        <img 
                          src={image.url} 
                          alt={`Product image ${index + 1}`} 
                          className="w-full h-24 object-cover" 
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Remove image"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {productData.images.length === 0 && (
                  <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
                    <Grid size={40} className="mx-auto mb-2" />
                    <p>No images uploaded yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Submit Button */}
          <div className="pt-4">
            <button 
              type="submit" 
              className="w-full flex justify-center items-center bg-indigo-600 hover:bg-indigo-700 transition-colors text-white font-medium py-3 px-4 rounded-lg"
            >
              <Save size={18} className="mr-2" />
              Update Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProductPage;

