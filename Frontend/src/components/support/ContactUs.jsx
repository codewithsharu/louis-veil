import React from 'react';
import { Link } from 'react-router-dom';

const ContactUs = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white shadow-sm p-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Contact Us</h1>
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
                If you have any questions, concerns, or feedback, we would love to hear from you! Please reach out to us using the contact information below.
              </p>

              <p className="leading-relaxed">
                <strong>Email:</strong> <a href="mailto:louisveil.com@gmail.com" className="text-lv-gold hover:text-indigo-800">louisveil.com@gmail.com</a>
              </p>

              <p className="leading-relaxed">
                <strong>Phone:</strong> <a href="tel:+917460935762" className="text-lv-gold hover:text-indigo-800">+91 7460935762</a>
              </p>

              <p className="leading-relaxed">
                You can also reach us through our social media channels. We look forward to assisting you!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
