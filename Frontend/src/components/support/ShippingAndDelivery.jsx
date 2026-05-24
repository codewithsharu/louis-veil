import React from 'react';
import { Link } from 'react-router-dom';

const ShippingAndDelivery = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white shadow-sm p-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Shipping and Delivery</h1>
            <Link to="/" className="text-sm text-lv-gold hover:text-indigo-800 transition-colors">
              Back to Home
            </Link>
          </div>

          <div className="prose prose-indigo max-w-none">
            <div className="text-sm text-gray-500 mb-8 border-b pb-4">
              Last updated on Apr 20 2025
            </div>
            
            <div className="space-y-6 text-gray-700">
              <p className="leading-relaxed">
                Orders are shipped and delivered within India through registered domestic courier companies and/or speed post only. Orders are shipped within 0-15 days or as per the delivery date agreed at the time of order confirmation and delivery of the shipment, subject to courier company/post office norms.
              </p>

              <p className="leading-relaxed">
                LOUIS VEIL is not liable for any delay in delivery by the courier company/postal authorities and only guarantees to hand over the consignment to the courier company or postal authorities within 0-15 days from the date of the order and payment or as per the delivery date agreed at the time of order confirmation.
              </p>

              <p className="leading-relaxed">
                Delivery of all orders will be to the address provided by the buyer. Delivery of our services will be confirmed on your mail ID as specified during registration. For any issues in utilizing our services, you may contact our helpdesk at +917460935762 or louisveil.com@gmail.com.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingAndDelivery;
