import { useState } from 'react';
import { toast } from 'sonner';
import { API_BASE_URL } from '../../utils/config';

const PRODUCT_TYPE_OPTIONS = [
  'Earrings',
  'Lockets',
  'Bracelets',
  'Pendants',
  'Combo'
];

const createInitialFormData = () => ({
  name: '',
  description: '',
  price: '',
  discountPrice: '',
  countInStock: '',
  sku: '',
  category: '',
  brand: '',
  colors: [],
  collections: '',
  material: '',
  images: [],
  isFeatured: false,
  isPublished: false,
  keywords: []
});

const AddProductPage = () => {
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [formData, setFormData] = useState(createInitialFormData);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setUploadingImage(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('userToken')}`
        },
        body: formData
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.msg || 'Image upload failed on the server');
      }
      
      if (data.imageUrl) {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, { url: data.imageUrl }]
        }));
        toast.success('Image uploaded successfully!');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to upload image');
    }
    setUploadingImage(false);
  };

  const removeImage = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('userToken')}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || 'Failed to add product');
      }

      toast.success('Product added successfully!');
      setFormData(createInitialFormData());
    } catch (err) {
      toast.error(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="mx-auto w-full max-w-[1450px] space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Add New Product</h1>
        <p className="mt-1 text-sm text-slate-600">Fill in the details to create a new jewelry product in your inventory.</p>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-8">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Product Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      placeholder="Enter product name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      SKU
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        name="sku"
                        placeholder="Auto-generated"
                        value={formData.sku}
                        readOnly
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-800 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const id = 'SKU-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
                          setFormData(prev => ({ ...prev, sku: id }));
                        }}
                        className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-black transition-colors whitespace-nowrap"
                      >
                        Generate
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Pricing & Inventory</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Price (₹)
                    </label>
                    <input
                      type="number"
                      name="price"
                      placeholder="0.00"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Discount Price (₹)
                    </label>
                    <input
                      type="number"
                      name="discountPrice"
                      placeholder="0.00"
                      value={formData.discountPrice}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Stock Quantity
                    </label>
                    <input
                      type="number"
                      name="countInStock"
                      placeholder="0"
                      value={formData.countInStock}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Product Details</h2>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      name="description"
                      placeholder="Enter product description"
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                      rows="4"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Search Keywords
                    </label>
                    <input
                      type="text"
                      placeholder="Enter keywords separated by commas (e.g. western, dress, casual)"
                      value={Array.isArray(formData.keywords) ? formData.keywords.join(', ') : (formData.keywords || '')}
                      onChange={(e) => {
                        const values = e.target.value.split(',').map(item => item.trim()).filter(Boolean);
                        setFormData(prev => ({ ...prev, keywords: values }));
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <p className="text-xs text-gray-500">These keywords help customers find this product via the search bar.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Category
                      </label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">Select Category</option>
                        {PRODUCT_TYPE_OPTIONS.map((category) => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Brand
                      </label>
                      <input
                        type="text"
                        name="brand"
                        value={formData.brand}
                        onChange={handleInputChange}
                        placeholder="Enter brand name"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Collection
                      </label>
                      <select
                        name="collections"
                        value={formData.collections}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">Select Collection</option>
                        {PRODUCT_TYPE_OPTIONS.map((collection) => (
                          <option key={collection} value={collection}>{collection}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Material
                      </label>
                      <input
                        type="text"
                        name="material"
                        value={formData.material}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter material (e.g. Alloy, Brass, Stainless Steel)"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Colors
                      </label>
                      <div className="flex flex-wrap gap-2">
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
                          const isSelected = formData.colors.some(c => c === color.name || c === colorEntry || c.startsWith(color.name + ':#'));
                          return (
                            <button
                              key={color.name}
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({
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
                      {formData.colors.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="text-xs text-gray-500 self-center">Selected:</span>
                          {formData.colors.map((c) => {
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
                            id="addCustomColorName"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                          <input
                            type="color"
                            id="addCustomColorHex"
                            defaultValue="#000000"
                            className="w-10 h-10 border border-gray-200 cursor-pointer p-0.5 rounded"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const nameInput = document.getElementById('addCustomColorName');
                              const hexInput = document.getElementById('addCustomColorHex');
                              const name = nameInput.value.trim();
                              const hex = hexInput.value;
                              if (name) {
                                const colorEntry = `${name}:${hex}`;
                                const alreadyAdded = formData.colors.some(c => c === name || c.startsWith(name + ':#'));
                                if (!alreadyAdded) {
                                  setFormData(prev => ({
                                    ...prev,
                                    colors: [...prev.colors, colorEntry]
                                  }));
                                  nameInput.value = '';
                                }
                              }
                            }}
                            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Product Images</h2>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload Images
                      </label>
                      <div className="flex items-center">
                        <label className="cursor-pointer bg-white border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors">
                          <span className="text-indigo-600 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                            Choose Image
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={uploadingImage}
                            className="hidden"
                          />
                        </label>
                        {uploadingImage && (
                          <div className="ml-4 flex items-center text-gray-600">
                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-indigo-500 mr-2"></div>
                            <span>Uploading...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-w-1 aspect-h-1 w-full rounded-lg overflow-hidden bg-gray-100">
                          <img
                            src={image.url}
                            alt={`Product ${index + 1}`}
                            className="object-cover w-full h-full"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Product Status</h2>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.isPublished}
                        onChange={(e) => setFormData(prev => ({ ...prev, isPublished: e.target.checked }))}
                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-gray-700">Published</span>
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.isFeatured}
                        onChange={(e) => setFormData(prev => ({ ...prev, isFeatured: e.target.checked }))}
                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-gray-700">Featured Product</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 pt-6 border-t border-gray-200 flex justify-end">
              <button
                type="submit"
                disabled={loading || uploadingImage}
                className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${(loading || uploadingImage) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Product...
                  </>
                ) : (
                  <>
                    <svg className="mr-2 -ml-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    Create Product
                  </>
                )}
              </button>
            </div>
          </form>
      </section>
    </div>
  );
};

export default AddProductPage;
