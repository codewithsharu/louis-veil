import React from 'react';
import { Link } from 'react-router-dom';

const CancellationAndRefund = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white shadow-sm p-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Cancellation and Refund Policy</h1>
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
                We understand that sometimes you may need to cancel an order. If you wish to cancel your order, please contact us within 24 hours of placing your order.
              </p>

              <p className="leading-relaxed">
                If your order has already been shipped, we will not be able to cancel it. However, you should contact us within 3 days of receiving the product to initiate a return.
              </p>

              <p className="leading-relaxed">
                You will receive your refund within 1 - 7 business days subject to the condition that the Louis Veil trust seal is present on the garment and the garment is damaged.
              </p>

              <p className="leading-relaxed">
                For any questions regarding cancellations or refunds, please contact us at <a href="mailto:louisveil.com@gmail.com" className="text-lv-gold hover:text-indigo-800">louisveil.com@gmail.com</a> or call us at <a href="tel:+917460935762" className="text-lv-gold hover:text-indigo-800">+91 7460935762</a>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancellationAndRefund;
