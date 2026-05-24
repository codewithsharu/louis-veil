import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white shadow-sm p-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
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
                Your privacy is important to us. This privacy policy explains how we collect, use, and protect your information when you visit our website or make a purchase.
              </p>

              <p className="leading-relaxed">
                We collect personal information that you provide to us when you register on our site, place an order, subscribe to our newsletter, or interact with us in other ways. This information may include your name, email address, phone number, and shipping address.
              </p>

              <p className="leading-relaxed">
                We use this information to process your orders, improve our services, and communicate with you. We do not sell or rent your personal information to third parties.
              </p>

              <p className="leading-relaxed">
                We implement a variety of security measures to maintain the safety of your personal information. However, no method of transmission over the internet or method of electronic storage is 100% secure, and we cannot guarantee its absolute security.
              </p>

              <p className="leading-relaxed">
                By using our site, you consent to our privacy policy. If you have any questions about this policy, please contact us at +917460935762 or louisveil.com@gmail.com.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
