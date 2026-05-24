// Frontend/src/components/Common/Wishlist.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { fetchWishlistItems, fetchProductDetails, removeFromWishlist } from '../../redux/slices/productSlice';
import { Trash2, ShoppingBag } from 'react-feather';

const Wishlist = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const wishlistItems = useSelector((state) => state.products.wishlistItems) || [];
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (user) {
      dispatch(fetchWishlistItems(user._id))
        .then(() => setLoading(false))
        .catch((error) => {
          console.error('Error fetching wishlist:', error);
          toast.error('Failed to load wishlist');
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [user, dispatch]);

  useEffect(() => {
    const fetchProducts = async () => {
      if (wishlistItems.length > 0) {
        const productPromises = wishlistItems.map(item => 
          dispatch(fetchProductDetails(item.productId))
        );
        
        try {
          const results = await Promise.all(productPromises);
          const fetchedProducts = results.map(result => result.payload);
          setProducts(fetchedProducts);
        } catch (error) {
          console.error('Error fetching product details:', error);
          toast.error('Failed to load product details');
        }
      }
    };

    fetchProducts();
  }, [wishlistItems, dispatch]);

  const handleRemoveFromWishlist = async (productId) => {
    try {
      await dispatch(removeFromWishlist({ userId: user._id, productId }));
      toast.success('Removed from wishlist');
    } catch (error) {
      toast.error('Failed to remove from wishlist');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-lv-gold"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-serif font-bold mb-8 text-lv-dark">My Wishlist</h1>
      {!user ? (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">Please login to view your wishlist</p>
          <Link to="/login" className="text-lv-gold hover:underline">
            Login
          </Link>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">Your wishlist is empty</p>
          <Link to="/collections/all" className="mt-4 inline-block text-lv-gold hover:underline">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Desktop View */}
          <div className="hidden md:block bg-white shadow overflow-hidden rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Product
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Price
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Stock Status
                  </th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-20 w-20 flex-shrink-0">
                          <img className="h-20 w-20 rounded-md object-cover border border-gray-100" src={product.images[0]?.url} alt={product.name} />
                        </div>
                        <div className="ml-4">
                          <Link to={`/product/${product._id}`} className="text-sm font-medium text-gray-900 hover:text-lv-gold transition-colors">
                            {product.name}
                          </Link>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">₹{product.price}</span>
                        {product.originalPrice && (
                          <span className="text-sm text-gray-400 line-through">₹{product.originalPrice}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        product.countInStock > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {product.countInStock > 0 ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-3">
                        <Link 
                          to={`/product/${product._id}`}
                          className="text-lv-dark hover:text-white hover:bg-lv-dark bg-gray-100 p-2.5 rounded-full transition-colors"
                          title="View Product"
                        >
                          <ShoppingBag className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleRemoveFromWishlist(product._id)}
                          className="text-red-500 hover:text-white hover:bg-red-500 bg-red-50 p-2.5 rounded-full transition-colors"
                          title="Remove from Wishlist"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile View */}
          <div className="md:hidden space-y-4">
            {products.map((product) => (
              <div key={product._id} className="bg-white border border-gray-100 shadow-sm rounded-xl p-4 flex gap-4 relative">
                <Link to={`/product/${product._id}`} className="flex-shrink-0">
                  <img 
                    className="h-28 w-24 rounded-lg object-cover border border-gray-100" 
                    src={product.images[0]?.url} 
                    alt={product.name} 
                  />
                </Link>
                
                <div className="flex-1 flex flex-col justify-between">
                  <div className="pr-8">
                    <Link to={`/product/${product._id}`} className="text-sm font-semibold text-gray-900 line-clamp-2 hover:text-lv-gold mb-1">
                      {product.name}
                    </Link>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-bold text-gray-900">₹{product.price}</span>
                      {product.originalPrice && (
                        <span className="text-xs text-gray-400 line-through">₹{product.originalPrice}</span>
                      )}
                    </div>
                    <span className={`inline-block px-2.5 py-0.5 text-[10px] leading-5 font-bold uppercase tracking-wider rounded-full ${
                      product.countInStock > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {product.countInStock > 0 ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mt-3">
                    <Link 
                      to={`/product/${product._id}`}
                      className="flex-1 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-widest text-lv-dark bg-gray-100 hover:bg-lv-dark hover:text-white py-2.5 rounded-lg transition-colors"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      View
                    </Link>
                  </div>
                </div>

                <button
                  onClick={() => handleRemoveFromWishlist(product._id)}
                  className="absolute top-3 right-3 text-gray-400 hover:text-red-500 bg-white rounded-full p-1.5 shadow-sm border border-gray-100"
                  aria-label="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Wishlist;