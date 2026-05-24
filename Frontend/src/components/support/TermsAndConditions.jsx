import React from 'react';
import { Link } from 'react-router-dom';

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white shadow-sm p-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Terms and Conditions</h1>
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
                Welcome to LOUIS VEIL! These Terms and Conditions govern your use of our website and services. By accessing or using our website, you agree to be bound by these terms. If you disagree with any part of these terms, please do not use our website.
              </p>

              <p className="font-medium text-gray-900">
                Please read these terms carefully before using our website:
              </p>

              <ul className="list-disc pl-6 space-y-4 marker:text-lv-gold">
                <li className="leading-relaxed">We reserve the right to modify or update these terms at any time without prior notice. Your continued use of the website after any changes indicates your acceptance of the modified terms.</li>
                
                <li className="leading-relaxed">All product descriptions, prices, and availability are subject to change without notice. While we strive for accuracy, we cannot guarantee that all information is error-free.</li>
                
                <li className="leading-relaxed">You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account. Please notify us immediately of any unauthorized use of your account.</li>
                
                <li className="leading-relaxed">All content on our website, including but not limited to text, graphics, logos, images, and software, is the property of LOUIS VEIL and is protected by copyright laws. Unauthorized use is strictly prohibited.</li>
                
                <li className="leading-relaxed">We respect intellectual property rights. If you believe your work has been copied in a way that constitutes copyright infringement, please contact us immediately.</li>
                
                <li className="leading-relaxed">We may provide links to third-party websites for your convenience. We are not responsible for the content or practices of these external sites.</li>
                
                <li className="leading-relaxed">All purchases made through our website are subject to our shipping and return policies, which are available on our website.</li>
                
                <li className="leading-relaxed">We reserve the right to refuse service, terminate accounts, or cancel orders at our sole discretion.</li>
                
                <li className="leading-relaxed">These terms shall be governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Fatehpur, Uttar Pradesh, India.</li>
                
                <li className="leading-relaxed">We are not liable for any damages arising from the use of our website or services, including but not limited to direct, indirect, incidental, or consequential damages.</li>
              </ul>

              <p className="leading-relaxed mt-6">
                If you have any questions about these Terms and Conditions, please contact us at louisveil.com@gmail.com or call us at +917460935762.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
