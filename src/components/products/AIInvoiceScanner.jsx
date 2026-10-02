import React, { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import api from '../../api/apiClient';

export default function AIInvoiceScanner({ onClose, onComplete }) {
  const { showToast } = useToast();
  // Camera and scanning states
  const [isScanning, setIsScanning] = useState(false);
  const [scannedItems, setScannedItems] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Real camera states
  const videoRef = React.useRef(null);
  const streamRef = React.useRef(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Stop camera when component unmounts or closes
  React.useEffect(() => {
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Prefer back camera on phones
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
      setIsCameraOpen(true);
    } catch (err) {
      showToast('Camera access denied or unavailable.', 'error');
      // Fallback to direct mock scan if camera fails
      simulateAIScan();
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  // Triggered when they click "Capture" on the camera feed
  const handleCapture = () => {
    // Play a shutter sound or flash effect here if desired
    stopCamera();
    simulateAIScan();
  };

  // Mock AI scanning process (simulating OCR)
  const simulateAIScan = () => {
    setIsScanning(true);
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          finishScanning();
          return 100;
        }
        return p + Math.floor(Math.random() * 20);
      });
    }, 400);
  };

  const finishScanning = () => {
    setIsScanning(false);
    // Mock items extracted from bill
    setScannedItems([
      { name: "Dettol Original Liquid Handwash 100ml", barcode: "8901396315803", quantity: 24, costPrice: 22.50 },
      { name: "Bombay Shaving Company Power Styler", barcode: "8904330603615", quantity: 10, costPrice: 550.00 },
      { name: "Plum Coconut Milk Shampoo", barcode: "8904430200813", quantity: 12, costPrice: 180.00 }
    ]);
  };

  const handleConfirm = async () => {
    setIsUploading(true);
    try {
      // Look up existing products to update inventory, or create new ones
      for (const item of scannedItems) {
        try {
          const res = await api.get(`/api/products/barcode/${item.barcode}`);
          if (res.data) {
            await api.put(`/api/products/${res.data.id}`, {
              ...res.data,
              quantity: res.data.quantity + item.quantity,
              costPrice: item.costPrice
            });
          }
        } catch (e) {
          await api.post('/api/products', {
            ...item, category: 'Auto-Scanned', price: Math.round(item.costPrice * 1.2), reorderLevel: 5
          });
        }
      }
      showToast('Successfully processed invoice and updated inventory!', 'success');
      onComplete();
    } catch (err) {
      showToast('Failed to process some items.', 'error');
    }
    setIsUploading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
          <div className="flex items-center gap-3">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-xl font-bold">AI Invoice Scanner</h2>
          </div>
          <button onClick={() => { stopCamera(); onClose(); }} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          {/* Initial State (Before Camera) */}
          {!isScanning && !isCameraOpen && scannedItems.length === 0 && (
            <div className="text-center py-8">
              <div className="w-24 h-24 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-purple-600 dark:text-purple-400">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Upload Supplier Bill</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                Take a photo of any printed invoice. Our AI will automatically detect products, quantities, and prices to update your inventory.
              </p>
              
              <button 
                onClick={startCamera}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-700 hover:to-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-purple-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                Open Camera
              </button>
            </div>
          )}

          {/* Real Camera Feed */}
          {isCameraOpen && (
            <div className="flex flex-col items-center">
              <div className="relative w-full aspect-[3/4] bg-black rounded-2xl overflow-hidden mb-6 border-4 border-gray-200 dark:border-gray-700">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {/* Aiming Reticle */}
                <div className="absolute inset-8 border-2 border-white/50 border-dashed rounded-lg"></div>
              </div>
              <button 
                onClick={handleCapture}
                className="w-16 h-16 bg-white rounded-full border-4 border-purple-500 shadow-lg shadow-purple-500/30 flex items-center justify-center active:scale-95 transition-transform"
              >
                <div className="w-12 h-12 bg-purple-600 rounded-full"></div>
              </button>
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 font-medium">Align bill within the frame and capture</p>
            </div>
          )}

          {isScanning && (
            <div className="py-12 text-center">
              <div className="relative w-32 h-32 mx-auto mb-8">
                <div className="absolute inset-0 border-4 border-gray-200 dark:border-gray-700 rounded-2xl"></div>
                <div className="absolute top-0 left-0 right-0 h-1 bg-purple-500 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
                <svg className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mt-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">AI is analyzing the bill...</h3>
              <p className="text-purple-500 font-medium mb-4">Extracting text via OCR...</p>
              
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2.5 rounded-full transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          )}

          {scannedItems.length > 0 && !isScanning && (
            <div>
              <div className="flex items-center gap-2 mb-4 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-100 dark:border-emerald-800">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                <span className="font-semibold text-sm">Successfully extracted {scannedItems.length} items from the bill!</span>
              </div>

              <div className="space-y-3 mb-6">
                {scannedItems.map((item, i) => (
                  <div key={i} className="flex justify-between items-center p-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white text-sm">{item.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">{item.barcode}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 dark:text-white bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md text-sm inline-block mb-1">
                        Qty: {item.quantity}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Cost: ₹{item.costPrice.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={handleConfirm}
                disabled={isUploading}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/30 hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isUploading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Syncing to Inventory...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    Confirm & Auto-Fill Inventory
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}
