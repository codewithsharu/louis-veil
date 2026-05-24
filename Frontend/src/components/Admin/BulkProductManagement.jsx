import React, { useState } from 'react';
import { toast } from 'sonner';
import { API_BASE_URL } from '../../utils/config';
import { FiDownload, FiUploadCloud, FiCode, FiCheckCircle, FiEye, FiTrash2, FiX, FiCheck } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const BulkProductManagement = () => {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'paste'
  const [jsonText, setJsonText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  // Preview State
  const [previewProducts, setPreviewProducts] = useState([]);
  const [previewMode, setPreviewMode] = useState(null); // 'import' or 'export'

  const fetchExportPreview = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/products/export/json`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('userToken')}` }
      });
      if (!response.ok) throw new Error("Failed to fetch export preview");
      const data = await response.json();
      setPreviewProducts(data);
      setPreviewMode('export');
      toast.success(`Prepared ${data.length} products for export`);
    } catch (error) {
      toast.error(error.message);
    }
    setLoading(false);
  };

  const handleDownloadExport = () => {
    try {
      const blob = new Blob([JSON.stringify(previewProducts, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `louis-veil-products-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Products exported successfully!");
    } catch (error) {
      toast.error("Download failed.");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/json") {
      setSelectedFile(file);
      setUploadResult(null);
    } else {
      toast.error("Please select a valid JSON file.");
    }
  };

  const previewImport = () => {
    if (activeTab === 'upload') {
      if (!selectedFile) return toast.error("Please select a file first.");
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target.result);
          if (!Array.isArray(parsed)) throw new Error("JSON must be an array");
          setPreviewProducts(parsed);
          setPreviewMode('import');
          toast.success(`Parsed ${parsed.length} products`);
        } catch (err) {
          toast.error("Invalid JSON format in file");
        }
      };
      reader.readAsText(selectedFile);
    } else {
      if (!jsonText.trim()) return toast.error("Please paste JSON data first.");
      try {
        const parsed = JSON.parse(jsonText);
        if (!Array.isArray(parsed)) throw new Error("JSON must be an array");
        setPreviewProducts(parsed);
        setPreviewMode('import');
        toast.success(`Parsed ${parsed.length} products`);
      } catch (err) {
        toast.error("Invalid JSON format in text area");
      }
    }
  };

  const confirmBulkUpload = async () => {
    setLoading(true);
    setUploadResult(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/products/bulk/json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('userToken')}`
        },
        body: JSON.stringify(previewProducts)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.msg || "Failed to import products");
      }

      setUploadResult({ success: true, count: data.count, msg: data.msg });
      toast.success(data.msg);
      // Reset form
      setJsonText('');
      setSelectedFile(null);
      setPreviewMode(null);
      setPreviewProducts([]);
    } catch (error) {
      toast.error(error.message);
      setUploadResult({ success: false, msg: error.message });
    }
    setLoading(false);
  };

  return (
    <div className="mx-auto w-full max-w-[1450px] space-y-6 py-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 border-l-4 border-sky-600 pl-3">Bulk Operations</h2>
          <p className="mt-1 text-sm text-slate-500 pl-4">Export or import massive product batches via JSON.</p>
        </div>
        <Link to="/admin/products" className="text-sm font-medium text-sky-600 hover:text-sky-700 bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-100">
          &larr; Back to Products
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Export Panel */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col h-full">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-slate-900 flex items-center gap-2">
              <FiDownload className="text-emerald-500" /> Export Catalog
            </h3>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Retrieve your entire live product catalog. Preview the data locally before downloading it as a master JSON backup.
            </p>
          </div>
          <div className="mt-auto pt-6 border-t border-slate-100">
            <button
              onClick={fetchExportPreview}
              disabled={loading}
              className="w-full py-3 px-4 bg-emerald-50 text-emerald-700 font-semibold rounded-xl border border-emerald-100 shadow-sm hover:bg-emerald-100 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading && previewMode !== 'export' ? <FiCheckCircle className="animate-pulse" /> : <FiEye size={18} />} 
              Preview Export
            </button>
          </div>
        </div>

        {/* Import Panel */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-slate-900 flex items-center gap-2">
                <FiUploadCloud className="text-sky-500" /> Import Products
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Upload or paste a JSON array to preview and instantly bulk-create products.
              </p>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('upload')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${activeTab === 'upload' ? 'bg-white shadow-sm text-sky-700' : 'text-slate-500 hover:text-slate-700'}`}
              >
                File
              </button>
              <button
                onClick={() => setActiveTab('paste')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${activeTab === 'paste' ? 'bg-white shadow-sm text-sky-700' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Paste
              </button>
            </div>
          </div>

          <div className="flex-1 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden mb-6">
            {activeTab === 'upload' ? (
              <div className="h-48 flex flex-col items-center justify-center border-2 border-dashed border-sky-200 m-4 rounded-xl bg-white hover:bg-sky-50/50 transition relative">
                <FiUploadCloud className="w-10 h-10 text-sky-400 mb-3" />
                <p className="text-sm font-medium text-slate-700 text-center px-4">
                  {selectedFile ? selectedFile.name : 'Drag & drop a JSON file here, or click to select'}
                </p>
                <input
                  type="file"
                  accept="application/json"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            ) : (
              <div className="h-48 flex flex-col p-2">
                <textarea
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  placeholder="[\n  {\n    &#34;name&#34;: &#34;Sample Product&#34;,\n    &#34;price&#34;: 100\n  }\n]"
                  className="flex-1 w-full p-4 font-mono text-xs bg-[#1e1e1e] text-emerald-400 focus:outline-none rounded-lg resize-none"
                  spellCheck="false"
                ></textarea>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-5">
            <div className="flex items-center space-x-3 text-sm">
              {uploadResult && uploadResult.success && (
                <div className="flex items-center text-emerald-600 font-medium">
                  <FiCheckCircle className="mr-1" /> {uploadResult.msg}
                </div>
              )}
              {uploadResult && !uploadResult.success && (
                <div className="flex items-center text-rose-600 font-medium">
                  <span className="w-2 h-2 rounded-full bg-rose-500 mr-2"></span> {uploadResult.msg}
                </div>
              )}
            </div>
            
            <button
              onClick={previewImport}
              disabled={activeTab === 'upload' ? !selectedFile : !jsonText}
              className="inline-flex items-center justify-center px-6 py-2.5 bg-slate-800 border border-transparent rounded-lg font-medium text-white hover:bg-slate-900 transition disabled:opacity-50"
            >
              Parse Preview
            </button>
          </div>
        </div>
      </div>

      {/* Preview Section */}
      {previewMode && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                {previewMode === 'import' ? 'Data Import Preview' : 'Export Catalog Preview'}
              </h3>
              <p className="text-sm text-slate-500">
                Loaded {previewProducts.length} items from {previewMode === 'import' ? 'JSON payload' : 'database'}.
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex gap-3">
              <button
                onClick={() => { setPreviewMode(null); setPreviewProducts([]); }}
                className="px-4 py-2 border border-slate-300 bg-white text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              {previewMode === 'import' ? (
                <button
                  onClick={confirmBulkUpload}
                  disabled={loading}
                  className="px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-lg hover:bg-sky-700 transition flex items-center gap-2"
                >
                  {loading ? 'Uploading...' : <><FiUploadCloud /> Confirm Upload</>}
                </button>
              ) : (
                <button
                  onClick={handleDownloadExport}
                  className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition flex items-center gap-2"
                >
                  <FiDownload /> Download Backup JSON
                </button>
              )}
            </div>
          </div>

          <div className="max-h-[500px] overflow-y-auto p-4 bg-slate-50">
            <div className="flex flex-col gap-3">
              {previewProducts.slice(0, 100).map((product, index) => (
                <div key={index} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center shadow-sm">
                  <div className="h-20 w-20 flex-shrink-0 bg-slate-100 rounded-lg overflow-hidden border border-slate-100">
                    <img 
                      src={product.images?.[0]?.url || 'https://via.placeholder.com/150?text=No+Image'} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=Error'; }}
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 truncate" title={product.name}>
                      {product.name || 'Unnamed Product'}
                    </h4>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs">
                      <span className="font-semibold text-slate-700">₹{product.price || 0}</span>
                      {product.discountPrice > 0 && (
                        <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded text-[10px] font-bold">
                          Discount: ₹{product.discountPrice}
                        </span>
                      )}
                      {product.sku && (
                        <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-mono">
                          SKU: {product.sku}
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded font-bold ${product.countInStock > 0 ? 'bg-sky-50 text-sky-700' : 'bg-rose-50 text-rose-700'}`}>
                        Qty: {product.countInStock || 0}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 sm:w-48">
                    {product.sizes?.map(size => (
                      <span key={size} className="text-[10px] px-1.5 py-0.5 border border-slate-200 text-slate-600 rounded">
                        {size}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              
              {previewProducts.length > 100 && (
                <div className="p-4 text-center rounded-xl border border-dashed border-slate-300 bg-slate-100 text-slate-500 text-sm font-medium">
                  + {previewProducts.length - 100} more products hidden in preview.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkProductManagement;
