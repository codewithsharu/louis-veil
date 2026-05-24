import React, { useCallback, useEffect, useState } from "react";
import { API_BASE_URL } from "../utils/config";

const PRODUCT_PROBE_PATH = "/api/products?limit=1";

const resolveProbeUrl = () => `${API_BASE_URL}${PRODUCT_PROBE_PATH}`;

const BackendConnectionCheck = () => {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);

  const runCheck = useCallback(async () => {
    const startedAt = performance.now();
    const endpoint = resolveProbeUrl();

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      const durationMs = Math.round(performance.now() - startedAt);
      const contentType = response.headers.get("content-type") || "unknown";

      let parsedBody = null;
      let textPreview = "";

      if (contentType.includes("application/json")) {
        parsedBody = await response.json();
      } else {
        textPreview = await response.text();
      }

      const products = Array.isArray(parsedBody)
        ? parsedBody
        : Array.isArray(parsedBody?.products)
          ? parsedBody.products
          : Array.isArray(parsedBody?.data)
            ? parsedBody.data
            : null;

      const htmlFallbackDetected =
        response.ok &&
        contentType.includes("text/html") &&
        textPreview.toLowerCase().includes("<!doctype html");

      const isConnected = response.ok && Array.isArray(products);

      setResult({
        ok: isConnected,
        status: response.status,
        statusText: response.statusText,
        durationMs,
        endpoint,
        checkedAt: new Date().toISOString(),
        contentType,
        productCount: Array.isArray(products) ? products.length : null,
        sampleProductId: Array.isArray(products) && products[0]?._id ? products[0]._id : "",
        textPreview: textPreview ? textPreview.slice(0, 180) : "",
        hint: htmlFallbackDetected
          ? "Received HTML instead of JSON. Frontend host is serving index.html for /api. Configure /api proxy rewrite to backend."
          : "",
      });
    } catch (error) {
      const durationMs = Math.round(performance.now() - startedAt);

      setResult({
        ok: false,
        status: 0,
        statusText: "Network Error",
        durationMs,
        endpoint,
        checkedAt: new Date().toISOString(),
        contentType: "unknown",
        productCount: null,
        sampleProductId: "",
        textPreview: "",
        error: error?.message || "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    runCheck();
  }, [runCheck]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-6">
        <p className="text-xs tracking-[0.2em] uppercase text-lv-gold mb-2">Diagnostics</p>
        <h1 className="text-2xl md:text-3xl font-serif text-lv-dark">Backend Connection Check</h1>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
              loading
                ? "bg-amber-100 text-amber-800"
                : result?.ok
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-red-100 text-red-800"
            }`}
          >
            {loading ? "Checking..." : result?.ok ? "Connected" : "Not Connected"}
          </span>

          <button
            type="button"
            onClick={runCheck}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-gray-700 hover:border-lv-gold hover:text-lv-dark transition-colors"
          >
            Run Check Again
          </button>
        </div>

        <div className="space-y-2 text-sm text-gray-700">
          <p><strong>API Base:</strong> {API_BASE_URL || "(empty -> same-origin /api)"}</p>
          <p><strong>Probe Endpoint:</strong> {result?.endpoint || resolveProbeUrl()}</p>
          <p><strong>HTTP:</strong> {result ? `${result.status} ${result.statusText}` : "-"}</p>
          <p><strong>Response Time:</strong> {result ? `${result.durationMs} ms` : "-"}</p>
          <p><strong>Content Type:</strong> {result?.contentType || "-"}</p>
          <p><strong>Products Returned:</strong> {result?.productCount ?? "-"}</p>
          <p><strong>Sample Product ID:</strong> {result?.sampleProductId || "-"}</p>
          <p><strong>Checked At:</strong> {result?.checkedAt || "-"}</p>
          {result?.error ? <p><strong>Error:</strong> {result.error}</p> : null}
          {result?.hint ? <p><strong>Hint:</strong> {result.hint}</p> : null}
          {result?.textPreview ? <p><strong>Body Preview:</strong> {result.textPreview}</p> : null}
        </div>
      </div>
    </div>
  );
};

export default BackendConnectionCheck;
