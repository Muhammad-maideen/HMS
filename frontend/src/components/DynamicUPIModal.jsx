import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { X } from 'lucide-react';
import { posAudio } from '../utils/posAudio';

// Confetti burst particles matching user reference (stars, dots, diamonds, rectangles)
const CONFETTI_PIECES = [
  // Stars (Gold/Yellow)
  { type: 'star', color: '#F59E0B', x: 68, y: -45, rot: 15, size: 14, delay: 0.05 },
  { type: 'star', color: '#F59E0B', x: -65, y: -48, rot: -20, size: 13, delay: 0.08 },
  { type: 'star', color: '#EAB308', x: -52, y: 56, rot: 35, size: 12, delay: 0.1 },
  { type: 'star', color: '#F59E0B', x: 58, y: 58, rot: -15, size: 14, delay: 0.06 },
  { type: 'star', color: '#EAB308', x: 0, y: -82, rot: 45, size: 13, delay: 0.12 },
  { type: 'star', color: '#F59E0B', x: -75, y: -10, rot: -30, size: 12, delay: 0.07 },
  
  // Dots / Circles (Red, Green, Cyan, Pink)
  { type: 'circle', color: '#EF4444', x: 44, y: -66, rot: 0, size: 9, delay: 0.04 },
  { type: 'circle', color: '#EF4444', x: -72, y: 22, rot: 0, size: 8, delay: 0.09 },
  { type: 'circle', color: '#10B981', x: 68, y: -16, rot: 0, size: 8, delay: 0.07 },
  { type: 'circle', color: '#06B6D4', x: -36, y: -72, rot: 0, size: 7, delay: 0.11 },
  { type: 'circle', color: '#EC4899', x: 26, y: 74, rot: 0, size: 8, delay: 0.08 },
  { type: 'circle', color: '#EF4444', x: -26, y: 70, rot: 0, size: 9, delay: 0.05 },
  { type: 'circle', color: '#3B82F6', x: 74, y: 25, rot: 0, size: 7, delay: 0.1 },

  // Rectangles / Confetti paper (Mint, Cyan, Pink, Emerald)
  { type: 'rect', color: '#10B981', x: -54, y: -28, rot: 45, w: 12, h: 5, delay: 0.06 },
  { type: 'rect', color: '#06B6D4', x: 48, y: 32, rot: -30, w: 11, h: 5, delay: 0.08 },
  { type: 'rect', color: '#EC4899', x: -44, y: -56, rot: 60, w: 10, h: 4, delay: 0.1 },
  { type: 'rect', color: '#10B981', x: 30, y: -76, rot: -45, w: 12, h: 5, delay: 0.04 },
  { type: 'rect', color: '#06B6D4', x: -66, y: -6, rot: 15, w: 11, h: 4, delay: 0.07 },
  { type: 'rect', color: '#10B981', x: 76, y: 14, rot: 50, w: 10, h: 5, delay: 0.09 },

  // Diamonds (Cyan, Yellow, Green)
  { type: 'diamond', color: '#06B6D4', x: -30, y: -44, rot: 45, size: 8, delay: 0.05 },
  { type: 'diamond', color: '#F59E0B', x: 40, y: -42, rot: 45, size: 8, delay: 0.07 },
  { type: 'diamond', color: '#06B6D4', x: -56, y: 40, rot: 45, size: 9, delay: 0.11 },
  { type: 'diamond', color: '#10B981', x: 56, y: -54, rot: 45, size: 8, delay: 0.06 },

  // Arcs & Ribbons
  { type: 'arc', color: '#EF4444', x: 46, y: 66, rot: 25, size: 11, delay: 0.08 },
  { type: 'arc', color: '#10B981', x: -64, y: -62, rot: -40, size: 11, delay: 0.1 },
  { type: 'arc', color: '#F59E0B', x: -20, y: -76, rot: 70, size: 10, delay: 0.07 },
  { type: 'arc', color: '#EC4899', x: -60, y: 58, rot: -10, size: 11, delay: 0.09 },
];

export default function DynamicUPIModal({ 
  isOpen, 
  onClose, 
  amount, 
  orderNumber = 'ORD-LIVE',
  onConfirmPayment 
}) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Payment states: 'scan' | 'verifying' | 'success'
  const [paymentState, setPaymentState] = useState('scan');
  const timerRef1 = useRef(null);
  const timerRef2 = useRef(null);

  const [upiId, setUpiId] = useState(() => {
    return localStorage.getItem('hms_upi_id') || 'starbiriyani@okhdfcbank';
  });
  const [restaurantName, setRestaurantName] = useState(() => {
    return localStorage.getItem('hms_restaurant_name') || 'Star Biriyani';
  });

  // Sync UPI ID & Restaurant Name from events & storage
  useEffect(() => {
    const handleSync = () => {
      setUpiId(localStorage.getItem('hms_upi_id') || 'starbiriyani@okhdfcbank');
      setRestaurantName(localStorage.getItem('hms_restaurant_name') || 'Star Biriyani');
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('hms_upi_updated', handleSync);
    window.addEventListener('hms_receipt_settings_updated', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('hms_upi_updated', handleSync);
      window.removeEventListener('hms_receipt_settings_updated', handleSync);
    };
  }, []);

  const upiUri = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(restaurantName)}&am=${amount.toFixed(2)}&tr=${orderNumber}&cu=INR`;

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setPaymentState('scan');
      setUpiId(localStorage.getItem('hms_upi_id') || 'starbiriyani@okhdfcbank');
      setRestaurantName(localStorage.getItem('hms_restaurant_name') || 'Star Biriyani');
      if (timerRef1.current) clearTimeout(timerRef1.current);
      if (timerRef2.current) clearTimeout(timerRef2.current);
    }
  }, [isOpen]);

  // Generate QR Code
  useEffect(() => {
    if (!isOpen || amount <= 0) return;

    let isMounted = true;
    setLoading(true);

    QRCode.toDataURL(upiUri, {
      width: 280,
      margin: 1.5,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => {
        if (isMounted) {
          setQrDataUrl(url);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to generate UPI QR', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, amount, upiUri]);

  // Trigger payment confirmation with animated transition
  const handleTriggerPayment = () => {
    if (paymentState !== 'scan') return;

    // Step 1: 3-dots verifying animation inside BLACK circle (matching user's reference with black bg)
    setPaymentState('verifying');

    // Step 2: After 750ms, switch to success checkmark with confetti celebration
    timerRef1.current = setTimeout(() => {
      setPaymentState('success');
      posAudio.checkout();

      // Step 3: Complete checkout after 1.5s celebration and open receipt
      timerRef2.current = setTimeout(() => {
        if (onConfirmPayment) onConfirmPayment();
      }, 1600);
    }, 750);
  };

  // Keyboard shortcut listener: Enter triggers payment, Escape closes
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleTriggerPayment();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, paymentState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef1.current) clearTimeout(timerRef1.current);
      if (timerRef2.current) clearTimeout(timerRef2.current);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget && paymentState === 'scan') onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn font-sans"
    >
      {/* Scoped CSS animations for 3-dots wave, checkmark pop, and confetti burst */}
      <style>{`
        @keyframes upiDotPulse {
          0%, 80%, 100% {
            transform: scale(0.6);
            opacity: 0.35;
          }
          40% {
            transform: scale(1.2);
            opacity: 1;
          }
        }
        @keyframes upiBadgePop {
          0% {
            transform: scale(0.4);
            opacity: 0;
          }
          60% {
            transform: scale(1.15);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes upiCheckPop {
          0% {
            transform: scale(0) rotate(-45deg);
            opacity: 0;
          }
          60% {
            transform: scale(1.25) rotate(5deg);
            opacity: 1;
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
        @keyframes upiConfettiBurst {
          0% {
            transform: translate(0, 0) scale(0) rotate(0deg);
            opacity: 0;
          }
          30% {
            opacity: 1;
          }
          85% {
            opacity: 1;
            transform: translate(var(--tx), var(--ty)) scale(1.15) rotate(var(--rot));
          }
          100% {
            opacity: 1;
            transform: translate(var(--tx), var(--ty)) scale(1) rotate(var(--rot));
          }
        }
        @keyframes upiScanLaser {
          0%, 100% {
            top: 6%;
            opacity: 0.3;
          }
          50% {
            top: 88%;
            opacity: 0.9;
          }
        }
        .animate-upi-dot-1 {
          animation: upiDotPulse 1s infinite ease-in-out;
          animation-delay: 0s;
        }
        .animate-upi-dot-2 {
          animation: upiDotPulse 1s infinite ease-in-out;
          animation-delay: 0.2s;
        }
        .animate-upi-dot-3 {
          animation: upiDotPulse 1s infinite ease-in-out;
          animation-delay: 0.4s;
        }
        .animate-upi-badge-pop {
          animation: upiBadgePop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        .animate-upi-check-pop {
          animation: upiCheckPop 0.45s 0.1s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
        }
        .animate-upi-confetti {
          animation: upiConfettiBurst 0.85s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-upi-laser {
          animation: upiScanLaser 2.2s infinite ease-in-out;
        }
      `}</style>

      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-neutral-200 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-neutral-900 text-center relative overflow-hidden"
      >
        {/* Top Close Button (Only while in scan mode) */}
        {paymentState === 'scan' && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* ====================================================
            MODE 1: SCANNER & TOTAL AMOUNT ONLY
            ==================================================== */}
        {paymentState === 'scan' && (
          <div className="space-y-4 pt-1 animate-fadeIn">
            
            {/* Restaurant Name Header & Configured UPI ID */}
            <div className="space-y-1">
              <h3 className="text-xl font-black text-neutral-900 tracking-tight">
                {restaurantName}
              </h3>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-neutral-100 text-neutral-800 text-[11px] font-mono font-bold border border-neutral-200">
                <span className="text-neutral-400 font-sans font-semibold">UPI ID:</span>
                <span className="text-neutral-900">{upiId}</span>
              </div>
            </div>

            {/* Total Amount to Pay */}
            <div className="py-2 px-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                Total Amount
              </span>
              <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-neutral-900">
                ₹{amount.toFixed(2)}
              </div>
            </div>

            {/* Scanner (QR Code) - Clickable to trigger payment */}
            <div 
              onClick={handleTriggerPayment}
              className="relative p-4 bg-white rounded-2xl border-2 border-neutral-200 hover:border-black transition-all cursor-pointer group shadow-sm flex flex-col items-center justify-center min-h-[250px]"
              title="Click scanner or press Enter once paid"
            >
              {loading ? (
                <div className="space-y-2 text-center py-10">
                  <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-neutral-400 font-medium">Generating QR...</p>
                </div>
              ) : qrDataUrl ? (
                <div className="relative inline-block">
                  <img
                    src={qrDataUrl}
                    alt="UPI QR Code"
                    className="w-56 h-56 object-contain rounded-xl transition-transform group-hover:scale-101"
                  />
                  {/* Subtle animated laser scan bar */}
                  <div className="absolute left-2 right-2 h-0.5 bg-black/60 shadow-[0_0_8px_rgba(0,0,0,0.6)] animate-upi-laser pointer-events-none" />
                </div>
              ) : (
                <div className="text-xs text-red-500 py-10">Failed to render QR Code</div>
              )}

              {/* Minimalist interactive hint */}
              <div className="pt-2 text-[11px] font-semibold text-neutral-500 group-hover:text-black transition-colors flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Tap scanner or press Enter once paid</span>
              </div>
            </div>

          </div>
        )}

        {/* ====================================================
            MODE 2: PAYMENT RECEIVED ANIMATION (BLACK CIRCLE + CONFETTI)
            ==================================================== */}
        {paymentState !== 'scan' && (
          <div className="py-10 space-y-5 flex flex-col items-center justify-center animate-fadeIn relative">
            
            {/* Center Circular Badge Area with Confetti Burst */}
            <div className="relative w-36 h-36 flex items-center justify-center">
              
              {/* Confetti Explosion (Rendered when state === 'success') */}
              {paymentState === 'success' && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-visible">
                  {CONFETTI_PIECES.map((piece, idx) => (
                    <div
                      key={idx}
                      className="absolute animate-upi-confetti"
                      style={{
                        '--tx': `${piece.x}px`,
                        '--ty': `${piece.y}px`,
                        '--rot': `${piece.rot}deg`,
                        animationDelay: `${piece.delay}s`,
                      }}
                    >
                      {piece.type === 'star' && (
                        <svg width={piece.size} height={piece.size} viewBox="0 0 24 24" fill={piece.color}>
                          <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
                        </svg>
                      )}
                      {piece.type === 'circle' && (
                        <div
                          className="rounded-full"
                          style={{ width: `${piece.size}px`, height: `${piece.size}px`, backgroundColor: piece.color }}
                        />
                      )}
                      {piece.type === 'rect' && (
                        <div
                          className="rounded-xs"
                          style={{ width: `${piece.w}px`, height: `${piece.h}px`, backgroundColor: piece.color }}
                        />
                      )}
                      {piece.type === 'diamond' && (
                        <div
                          style={{
                            width: `${piece.size}px`,
                            height: `${piece.size}px`,
                            backgroundColor: piece.color,
                            transform: 'rotate(45deg)',
                          }}
                        />
                      )}
                      {piece.type === 'arc' && (
                        <svg width={piece.size} height={piece.size} viewBox="0 0 20 20" fill="none">
                          <path d="M3 15 C 8 3, 12 3, 17 15" stroke={piece.color} strokeWidth="2.8" strokeLinecap="round" />
                        </svg>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* State A: Verifying 3 Dots inside BLACK circle */}
              {paymentState === 'verifying' && (
                <div className="w-24 h-24 rounded-full bg-black shadow-2xl flex items-center justify-center animate-scaleUp z-10">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-white rounded-xs animate-upi-dot-1" />
                    <div className="w-3 h-3 bg-white rounded-xs animate-upi-dot-2" />
                    <div className="w-3 h-3 bg-white rounded-xs animate-upi-dot-3" />
                  </div>
                </div>
              )}

              {/* State B: Success Checkmark inside BLACK circle */}
              {paymentState === 'success' && (
                <div className="w-24 h-24 rounded-full bg-black shadow-2xl flex items-center justify-center animate-upi-badge-pop z-10">
                  <svg
                    className="w-12 h-12 text-white animate-upi-check-pop"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}

            </div>

            {/* Status Feedback Text */}
            <div className="space-y-1 text-center">
              {paymentState === 'verifying' ? (
                <div className="space-y-0.5">
                  <h4 className="text-base font-bold text-neutral-900">Verifying Payment...</h4>
                  <p className="text-xs text-neutral-400">Connecting to UPI network</p>
                </div>
              ) : (
                <div className="space-y-1 animate-fadeIn">
                  <h4 className="text-xl font-black text-neutral-900 tracking-tight">
                    Payment Received!
                  </h4>
                  <div className="text-2xl font-black font-mono text-emerald-600">
                    ₹{amount.toFixed(2)}
                  </div>
                  <p className="text-xs text-neutral-400">Generating receipt bill...</p>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
