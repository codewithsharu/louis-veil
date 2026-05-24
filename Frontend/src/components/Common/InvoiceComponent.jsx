import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/config';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const InvoicePage = () => {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const invoiceRef = useRef(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('userToken');
        if (!token) {
          setError('You must be logged in to view this invoice.');
          setLoading(false);
          return;
        }
        const { data } = await axios.get(`${API_BASE_URL}/api/orders/${id}/invoice`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setInvoice(data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch invoice');
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id]);

  const handleGeneratePDF = async () => {
    if (!invoiceRef.current) return;
    
    try {
      setGeneratingPdf(true);
      const invoiceElement = invoiceRef.current;
      const canvas = await html2canvas(invoiceElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);
      
      let heightLeft = imgHeight - pageHeight;
      let position = -pageHeight;
      
      while (heightLeft > 0) {
        position = position - pageHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`Invoice-${invoice.invoiceNumber}.pdf`);
      setGeneratingPdf(false);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setGeneratingPdf(false);
      alert('Error generating PDF. Please try again.');
    }
  };

  if (loading) return (
    <div className="fixed inset-0 bg-gray-100 flex flex-col justify-center items-center z-50">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-gray-800 mb-4"></div>
      <p className="text-gray-700 font-medium text-lg">Loading invoice...</p>
    </div>
  );

  if (error) return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-red-100 p-4 rounded-lg flex items-center gap-3">
        <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-red-600 font-medium">Error: {error}</p>
      </div>
    </div>
  );

  if (!invoice) return (
    <div className="max-w-7xl mx-auto p-6 text-center">
      <p className="text-gray-600">No invoice found</p>
    </div>
  );

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const subtotal =
    invoice.subtotal != null
      ? invoice.subtotal
      : invoice.items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const discount = invoice.promoCodeDiscount || 0;

  return (
    <div className="max-w-3xl mx-auto px-3 py-5 sm:px-6 sm:py-8">
      {/* PDF Generation Overlay */}
      {generatingPdf && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-60 flex flex-col justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-2xl flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-600"></div>
            <p className="text-gray-800 font-semibold">Generating PDF...</p>
            <p className="text-gray-400 text-xs">Please wait, this may take a moment</p>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="print:hidden mb-5 flex justify-between items-center">
        <Link to={`/order/${id}`} className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Order
        </Link>
        <button
          onClick={handleGeneratePDF}
          disabled={generatingPdf}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 px-4 rounded-lg shadow-sm disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download PDF
        </button>
      </div>

      {/* Invoice Card */}
      <div ref={invoiceRef} className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">

        {/* Accent top bar */}
        <div className="h-1.5 bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500" />

        {/* Invoice Header */}
        <div className="px-6 pt-6 pb-5 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">L</div>
                <span className="text-xl font-bold text-gray-900 tracking-tight">Louisveil</span>
              </div>
              <p className="text-xs text-gray-400">louisveil.com</p>
            </div>
            {/* Invoice title */}
            <div className="sm:text-right">
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-widest uppercase">Invoice</h1>
              <p className="text-xs text-indigo-600 font-mono mt-0.5">{invoice.invoiceNumber}</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* Bill To + Invoice Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Bill To */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Bill To</p>
              <p className="font-semibold text-gray-900 text-sm">{invoice.customer.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{invoice.customer.email}</p>
              {invoice.shippingAddress && (
                <div className="mt-2 text-xs text-gray-500 space-y-0.5 leading-relaxed">
                  {(invoice.shippingAddress.firstName || invoice.shippingAddress.lastName) && (
                    <p>{[invoice.shippingAddress.firstName, invoice.shippingAddress.lastName].filter(Boolean).join(' ')}</p>
                  )}
                  <p>{invoice.shippingAddress.address}</p>
                  <p>
                    {invoice.shippingAddress.city}
                    {invoice.shippingAddress.state ? `, ${invoice.shippingAddress.state}` : ''}{' '}
                    {invoice.shippingAddress.postalCode}
                  </p>
                  <p>{invoice.shippingAddress.country}</p>
                  {(invoice.shippingAddress.phone || invoice.shippingAddress.phoneNumber) && (
                    <p>Ph: {invoice.shippingAddress.phone || invoice.shippingAddress.phoneNumber}</p>
                  )}
                </div>
              )}
            </div>

            {/* Invoice Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Invoice Details</p>
              <dl className="space-y-1.5 text-xs">
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-500">Invoice No</dt>
                  <dd className="font-medium text-gray-900 text-right">{invoice.invoiceNumber}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-500">Order ID</dt>
                  <dd className="font-medium text-gray-900">#{invoice.orderId.toString().slice(-8).toUpperCase()}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-500 shrink-0">Order Date</dt>
                  <dd className="font-medium text-gray-900 text-right">{formatDate(invoice.date)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-500">Payment</dt>
                  <dd className="font-medium text-gray-900">{invoice.paymentMethod}</dd>
                </div>
                {invoice.paymentId && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-gray-500 shrink-0">Payment ID</dt>
                    <dd className="font-medium text-gray-900 break-all text-right">{invoice.paymentId}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-500">Status</dt>
                  <dd className={`font-semibold ${invoice.isPaid ? 'text-green-600' : 'text-red-500'}`}>
                    {invoice.isPaid ? 'PAID' : 'PENDING'}
                  </dd>
                </div>
                {invoice.isPaid && invoice.paidAt && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-gray-500 shrink-0">Paid On</dt>
                    <dd className="font-medium text-gray-900 text-right">{formatDate(invoice.paidAt)}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-500">Order Status</dt>
                  <dd className="font-medium text-gray-900">{invoice.status}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Order Items</p>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="bg-gray-900 text-white">
                    <th className="px-3 py-2.5 text-left font-semibold uppercase tracking-wider">Item</th>
                    <th className="px-3 py-2.5 text-center font-semibold uppercase tracking-wider w-12">Qty</th>
                    <th className="px-3 py-2.5 text-right font-semibold uppercase tracking-wider w-24">Unit</th>
                    <th className="px-3 py-2.5 text-right font-semibold uppercase tracking-wider w-24">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoice.items.map((item, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          {item.image && (
                            <img
                              className="h-9 w-9 object-cover rounded-md hidden sm:block border border-gray-100 shrink-0"
                              src={item.image}
                              alt={item.name}
                            />
                          )}
                          <div>
                            <div className="font-medium text-gray-900 leading-snug">{item.name}</div>
                            {(item.size || item.color) && (
                              <div className="text-gray-400 text-[10px] mt-0.5">
                                {item.size && `Size: ${item.size}`}
                                {item.size && item.color && '  ·  '}
                                {item.color && `Color: ${item.color}`}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center text-gray-700">{item.quantity}</td>
                      <td className="px-3 py-2.5 text-right text-gray-600">₹{Number(item.price).toFixed(2)}</td>
                      <td className="px-3 py-2.5 text-right font-semibold text-gray-900">₹{Number(item.total).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Price Summary */}
          <div className="flex justify-end">
            <div className="w-full sm:w-72 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
              <div className="bg-gray-900 px-4 py-2">
                <p className="text-[10px] font-semibold text-gray-300 uppercase tracking-widest">Price Summary</p>
              </div>
              <div className="px-4 py-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-gray-800">₹{subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && invoice.promoCode && (
                  <div className="flex justify-between text-green-600">
                    <span className="flex items-center gap-1">
                      Discount
                      <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-mono text-[10px]">
                        {invoice.promoCode}
                      </span>
                    </span>
                    <span>- ₹{discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-sm">
                  <span className="text-gray-900">Total Paid</span>
                  <span className="text-indigo-600">₹{Number(invoice.totalAmount).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Status Banner */}
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-lg text-xs font-medium ${
              invoice.isPaid
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-amber-50 border border-amber-200 text-amber-800'
            }`}
          >
            {invoice.isPaid ? (
              <svg className="h-4 w-4 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-4 w-4 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
              </svg>
            )}
            <span>
              {invoice.isPaid
                ? `Payment of ₹${Number(invoice.totalAmount).toFixed(2)} received on ${formatDateTime(invoice.paidAt)}`
                : `Payment of ₹${Number(invoice.totalAmount).toFixed(2)} is pending`}
            </span>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 pt-4 text-center space-y-1">
            <p className="text-xs font-semibold text-gray-700">Thank you for shopping with Louisveil!</p>
            <p className="text-xs text-gray-400">For support, visit <span className="text-indigo-500">louisveil.com</span> or contact our customer service team.</p>
            <p className="text-[10px] text-gray-300 pt-1">Invoice generated on {formatDateTime(invoice.date)}</p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default InvoicePage;
