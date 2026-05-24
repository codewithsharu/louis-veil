import React from 'react';
import { RiDeleteBin3Fill } from 'react-icons/ri';
import { useDispatch } from 'react-redux';
import { removeFromCart, updateCartItemQuantity } from '../../redux/slices/cartSlice';
import { getItemPricing } from '../../utils/pricing';

const FALLBACK_PRODUCT_IMAGE = 'https://via.placeholder.com/160x200?text=Product';
const CUSTOM_MEASUREMENT_FIELDS = [
    { id: 'bustChest', shortLabel: 'Bust' },
    { id: 'waist', shortLabel: 'Waist' },
    { id: 'hips', shortLabel: 'Hips' },
    { id: 'shoulderWidth', shortLabel: 'Shoulder' },
    { id: 'sleeveLength', shortLabel: 'Sleeve' },
    { id: 'armhole', shortLabel: 'Armhole' },
    { id: 'bicepSize', shortLabel: 'Bicep' },
];

const getCompactMeasurementLine = (customMeasurements) => {
    if (!customMeasurements || typeof customMeasurements !== 'object') {
        return '';
    }

    return CUSTOM_MEASUREMENT_FIELDS
        .filter((field) => Number.isFinite(Number(customMeasurements[field.id])))
        .map((field) => {
            const formattedValue = Number(customMeasurements[field.id]).toFixed(1).replace('.0', '');
            return `${field.shortLabel} ${formattedValue}"`;
        })
        .join(' | ');
};

const CartContents = ({ cart, userId, guestId }) => {
    const dispatch = useDispatch();

    // Handle increasing/decreasing quantity
    const handleAddToCart = (productId, delta, quantity, size, color, customMeasurementKey) => {
        const targetItem = cart.products.find(
            (item) => item.productId === productId && item.size === size && item.color === color && (item.customMeasurementKey || '') === (customMeasurementKey || '')
        );

        if (
            delta > 0 &&
            Number.isFinite(Number(targetItem?.countInStock)) &&
            quantity >= Number(targetItem.countInStock)
        ) {
            return;
        }

        const newQuantity = quantity + delta;
        if (newQuantity >= 1) {
            dispatch(updateCartItemQuantity({
                productId,
                quantity: newQuantity,
                guestId,
                userId,
                size,
                color,
                customMeasurementKey,
            }));
        } else {
            dispatch(removeFromCart({ productId, guestId, userId, size, color, customMeasurementKey }));
        }
    };

    const handleRemoveFromCart = (productId, size, color, customMeasurementKey) => {
        dispatch(removeFromCart({ productId, guestId, userId, size, color, customMeasurementKey }));
    };

    

    return (
        <div>
            {cart.products.map((product, index) => {
                const pricing = getItemPricing(product);
                const maxStockReached = Number.isFinite(Number(product.countInStock)) && product.quantity >= Number(product.countInStock);
                const compactMeasurementLine = getCompactMeasurementLine(product.customMeasurements);

                return (
                    <div className="flex items-start justify-between py-4 border-b" key={`${product.productId}-${product.size || ''}-${product.color || ''}-${product.customMeasurementKey || ''}-${index}`}>
                        <div className="flex items-center">
                            <img src={product.image || FALLBACK_PRODUCT_IMAGE} alt={product.name || 'Product'} className="w-20 h-24 object-cover mr-4" />
                            <div>
                                <h3>{product.name}</h3>
                                <p className="text-sm text-gray-500">
                                    Size: {product.size} | Color: {product.color}
                                </p>
                                {compactMeasurementLine && (
                                    <p className="text-[11px] text-indigo-700 mt-1">{compactMeasurementLine}</p>
                                )}
                                <div className="flex items-center mt-2">
                                    <button onClick={() => handleAddToCart(product.productId, -1, product.quantity, product.size, product.color, product.customMeasurementKey || '')} className="border border-gray-200 px-2 py-1 text-xl font-medium text-lv-dark hover:border-lv-gold transition-colors">
                                        -
                                    </button>
                                    <span className="mx-4">{product.quantity}</span>
                                    <button
                                        onClick={() => handleAddToCart(product.productId, 1, product.quantity, product.size, product.color, product.customMeasurementKey || '')}
                                        className={`border px-2 py-1 text-xl font-medium transition-colors ${maxStockReached ? 'border-gray-200 text-gray-300 cursor-not-allowed' : 'border-gray-200 text-lv-dark hover:border-lv-gold'}`}
                                        disabled={maxStockReached}
                                    >
                                        +
                                    </button>
                                </div>
                                {maxStockReached && (
                                    <p className="text-xs text-amber-700 mt-1">Max stock reached</p>
                                )}
                            </div>
                        </div>
                        <div>
                            <p className="text-right font-medium">₹{pricing.finalPrice.toFixed(2)}</p>
                            {pricing.hasDiscount && (
                                <>
                                    <p className="text-xs text-gray-500 text-right line-through">₹{pricing.originalPrice.toFixed(2)}</p>
                                    <p className="text-xs text-green-600 text-right">{pricing.discountPercent}% OFF</p>
                                </>
                            )}
                            <button onClick={() => handleRemoveFromCart(product.productId, product.size, product.color, product.customMeasurementKey || '')}>
                                <RiDeleteBin3Fill className="h-5 w-5 bg-gray-200 mt-2" />
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default CartContents;
