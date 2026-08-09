import React, { useState } from 'react';
import { X, Shield, CreditCard, Smartphone, Building2, ArrowRight, Lock, Loader2 } from 'lucide-react';
import { Course, UserProfile } from '../types';

interface PaymentModalProps {
  isOpen: boolean;
  course: Course | null;
  user: UserProfile | null;
  onClose: () => void;
  onPaymentSuccess: (course: Course, transactionId: string) => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, course, user, onClose, onPaymentSuccess }) => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !course) return null;

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!phone || phone.length < 10) { setError('Please enter a valid 10-digit mobile number.'); return; }

    setLoading(true);
    setError('');

    try {
      // Step 1: Call OUR backend to create the order
      const orderRes = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(course.price * 100),
          course_id: course.id,
          user_id: user?.id,
          user_name: user?.name || 'Student',
          user_email: user?.email || '',
          user_phone: phone,
        }),
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok) {
        throw new Error(orderData.message || 'Failed to create Razorpay order.');
      }

      if (!window.Razorpay) {
        throw new Error('Razorpay checkout is not available. Please refresh the page and try again.');
      }

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Aaryan Media',
        description: course.title,
        order_id: orderData.order_id,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: phone,
        },
        theme: { color: '#D7FF2F' },
        modal: {
          ondismiss: function () {
            setLoading(false);
            setError('Payment was cancelled. Please try again or use a different method.');
          },
        },
        handler: async function (response: any) {
          try {
            // Send payment details to backend for signature verification
            const verify = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                course_id: course.id,
                user_id: user?.id,
                amount: course.price,
              }),
            });

            const result = await verify.json();

            if (!result.success) {
              throw new Error(result.message || "Payment verification failed.");
            }

            // Success! Grant access and close modal
            onPaymentSuccess(course, response.razorpay_payment_id);
            onClose();
          } catch (err: any) {
            console.error("Verification failed:", err);
            setError(err.message || "Payment verification failed. Please contact support.");
            setLoading(false);
          }
        },
      };

      const razorpay = new window.Razorpay(options);
      
      // Handle modal closed by user without paying
      razorpay.on('payment.failed', function (response: any) {
        setError(response.error.description || "Payment failed. Please try again.");
        setLoading(false);
      });

      razorpay.open();

    } catch (err: any) {
      setError(err.message || 'Payment failed. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-[#111111] border border-white/[0.12] rounded-[24px] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/[0.06]">
          <button onClick={onClose} disabled={loading} className="absolute top-5 right-5 w-8 h-8 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white disabled:opacity-30">
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#D7FF2F]/10 border border-[#D7FF2F]/20 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-[#D7FF2F]" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-mono">Complete Purchase</p>
              <p className="text-sm font-semibold text-white">{course.title}</p>
            </div>
          </div>

          {/* Price box */}
          <div className="flex items-center justify-between bg-[#0A0A0A] rounded-xl px-4 py-3">
            <span className="text-sm text-zinc-400">Total Amount</span>
            <div className="text-right">
              {course.price > 0 && (
                <span className="text-xs text-zinc-600 line-through mr-2">
                  ₹{Math.round(course.price * 2.5).toLocaleString()}
                </span>
              )}
              <span className="text-xl font-extrabold text-[#D7FF2F]">₹{course.price.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <div className="w-12 h-12 border-2 border-[#D7FF2F]/30 border-t-[#D7FF2F] rounded-full animate-spin" />
              <p className="text-sm text-zinc-400">Redirecting to payment...</p>
              <p className="text-xs text-zinc-600">Please do not close this window</p>
            </div>
          ) : (
            <form onSubmit={handlePay} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-400">{error}</div>
              )}

              {/* Read-only fields */}
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wider">Name</label>
                <input type="text" value={user?.name ?? ''} readOnly className="w-full bg-[#0A0A0A] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-zinc-400 outline-none cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wider">Email</label>
                <input type="email" value={user?.email ?? ''} readOnly className="w-full bg-[#0A0A0A] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-zinc-400 outline-none cursor-not-allowed" />
              </div>

              {/* Phone Input */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">
                  Mobile Number <span className="text-red-400">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="flex items-center px-3 bg-[#0A0A0A] border border-white/[0.08] rounded-xl text-sm text-zinc-400 whitespace-nowrap">
                    🇮🇳 +91
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    required
                    maxLength={10}
                    placeholder="9876543210"
                    className="flex-1 bg-[#0A0A0A] border border-white/[0.1] focus:border-[#D7FF2F] rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-colors"
                  />
                </div>
                <p className="text-xs text-zinc-600 mt-1">Required for payment OTP & confirmation SMS</p>
              </div>

              {/* Pay button */}
              <button type="submit" className="w-full bg-[#D7FF2F] hover:bg-[#c3ea23] text-black font-bold py-3.5 rounded-full text-sm transition-all flex items-center justify-center gap-2 mt-2">
                <span>Pay ₹{course.price.toLocaleString('en-IN')} Securely</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Payment methods */}
              <div className="pt-1">
                <p className="text-xs text-zinc-600 text-center mb-3">Accepted payment methods</p>
                <div className="flex items-center justify-center gap-5">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500"><Smartphone className="w-3.5 h-3.5" /> UPI</div>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500"><CreditCard className="w-3.5 h-3.5" /> Cards</div>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500"><Building2 className="w-3.5 h-3.5" /> Net Banking</div>
                </div>
              </div>

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-5 pt-2 border-t border-white/[0.05]">
                <div className="flex items-center gap-1.5 text-xs text-zinc-600"><Shield className="w-3.5 h-3.5 text-[#D7FF2F]/40" />Powered by Razorpay </div>
                <div className="flex items-center gap-1.5 text-xs text-zinc-600"><Lock className="w-3.5 h-3.5 text-[#D7FF2F]/40" />256-bit SSL</div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};