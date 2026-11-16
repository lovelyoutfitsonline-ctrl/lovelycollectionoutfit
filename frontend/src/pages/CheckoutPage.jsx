import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ShopContext } from '../context/ShopContext';
import { FiChevronLeft, FiMapPin, FiCheck, FiChevronRight, FiShield, FiLoader, FiX, FiFileText } from 'react-icons/fi';
import { io } from 'socket.io-client';
import axios from 'axios';
import { BACKEND_URL, API_BASE_URL } from '../config';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login, hasAcceptedPolicies } = useContext(AuthContext);
  const { cart, calculateCartTotals, clearCart, refetchOrders } = useContext(ShopContext);
  const { total: itemTotal, savings, comboDetails, shipping } = calculateCartTotals(cart);
  const totalAmount = itemTotal + shipping;
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Load Razorpay checkout script on mount
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const [acceptedTerms, setAcceptedTerms] = useState(() => {
    return sessionStorage.getItem('lovely_terms_accepted') === 'true';
  });

  // Listen for real-time order confirmation from Socket.IO room
  useEffect(() => {
    if (user?.phone) {
      const socket = io(BACKEND_URL);
      
      socket.emit('join-room', user.phone);
      console.log(`[SOCKET] Joined room: ${user.phone}`);

      socket.on('order-confirmed', (data) => {
        console.log('[SOCKET] Received order confirmation:', data);
        setIsVerifying(false);
        if (clearCart) clearCart();
        if (refetchOrders) refetchOrders();
        navigate('/orders');
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [user?.phone, navigate, clearCart, refetchOrders]);

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/checkout');
    } else if (cart.length === 0 && !isVerifying) {
      navigate('/cart');
    }
  }, [user, cart.length, isVerifying, navigate]);

  const [step, setStep] = useState(1); // 1: Address, 2: Order Summary, 3: Payment
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    pincode: user?.pincode || '',
    landmark: user?.landmark || '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const triggerPaymentFlow = async () => {
    login(formData);
    setIsProcessing(true);
    setErrorMessage('');

    try {
      // 1. Create a secure payment order in the backend
      const response = await axios.post(`${API_BASE_URL}/create-order`, {
        cart,
        customerDetails: formData
      });

      const orderData = response.data;
      setIsProcessing(false);

      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || orderData.key_id || orderData.keyId;
      const orderId = orderData.order_id || orderData.paymentId;

      // 2. Configure and trigger the Razorpay Overlay
      const options = {
        key: razorpayKey,
        amount: orderData.amount, // amount in paise
        currency: orderData.currency || 'INR',
        name: '𝐋𝐨𝐯𝐞𝐥𝐲 𝐎𝐮𝐭𝐟𝐢𝐭𝐬',
        description: 'Secure Order Checkout Payment',
        order_id: orderId,
        handler: async function (payResponse) {
          console.log('[RAZORPAY SUCCESS] Payment completed:', payResponse);
          setIsVerifying(true);

          try {
            // STEP 3: Send razorpay_payment_id, razorpay_order_id, razorpay_signature to backend verify endpoint
            const verifyRes = await axios.post(`${API_BASE_URL}/verify-payment`, {
              razorpay_order_id: payResponse.razorpay_order_id,
              razorpay_payment_id: payResponse.razorpay_payment_id,
              razorpay_signature: payResponse.razorpay_signature
            });

            if (verifyRes.data && verifyRes.data.success) {
              console.log('[VERIFICATION SUCCESS]', verifyRes.data);
              setIsVerifying(false);
              if (clearCart) clearCart();
              if (refetchOrders) refetchOrders();
              navigate('/orders');
            } else {
              setIsVerifying(false);
              setErrorMessage(verifyRes.data?.error || 'Payment signature verification failed.');
            }
          } catch (verifyErr) {
            console.error('[VERIFICATION ERROR]', verifyErr);
            setIsVerifying(false);
            setErrorMessage(verifyErr.response?.data?.error || 'Payment signature verification failed.');
          }
        },
        prefill: {
          name: formData.name,
          contact: formData.phone
        },
        theme: {
          color: '#2563eb'
        },
        modal: {
          ondismiss: function () {
            console.log('[RAZORPAY MODAL] Checkout closed by customer (cancelled)');
            setIsProcessing(false);
            setErrorMessage('Payment was cancelled by user.');
          }
        }
      };

      const rzp = new window.Razorpay(options);

      // Handle payment.failed event
      rzp.on('payment.failed', function (failedRes) {
        console.error('[RAZORPAY PAYMENT FAILED]', failedRes.error);
        setIsProcessing(false);
        setErrorMessage(`Payment failed: ${failedRes.error.description || 'Transaction declined'}`);
      });

      rzp.open();

    } catch (error) {
      console.error('[PAYMENT ERROR] Secure checkout initialization failed:', error);
      setIsProcessing(false);
      setErrorMessage(error.response?.data?.error || 'Secure Checkout failed to initialize. Please check your network or try again.');
    }
  };


  // Handle returning from Terms Page with auto-payment trigger
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('startPayment') === 'true') {
      sessionStorage.setItem('lovely_terms_accepted', 'true');
      setAcceptedTerms(true);
      setStep(3);

      // Clean query parameter from URL without page refresh
      navigate('/checkout', { replace: true });

      // Automatically launch payment modal
      setTimeout(() => {
        triggerPaymentFlow();
      }, 400);
    }
  }, [location.search, navigate]);

  const handlePayment = () => {
    const isTermsAccepted = sessionStorage.getItem('lovely_terms_accepted') === 'true' || acceptedTerms;

    if (!isTermsAccepted) {
      // Directly navigate customer to Terms & Conditions page to read before payment
      navigate('/terms?from=checkout&autoPay=true');
      return;
    }

    triggerPaymentFlow();
  };

  if (!user || cart.length === 0) {
    return null;
  }

  return (
    <div className="w-full min-h-screen bg-[#f1f3f6] pb-32">
      {/* Flipkart Style Header */}
      <div className="bg-blue-600 px-4 py-4 flex items-center gap-4 sticky top-0 z-50 shadow-md">
        <button onClick={() => navigate(-1)} className="text-white">
          <FiChevronLeft size={28} />
        </button>
        <h1 className="text-xl font-bold text-white tracking-tight">Order Summary</h1>
      </div>

      {errorMessage && (
        <div className="mx-4 mt-3 p-4 bg-red-50 border-l-4 border-red-500 rounded-r shadow-sm flex items-center justify-between text-red-700">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="text-lg">⚠️</span>
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage('')} className="text-red-500 hover:text-red-800 text-lg font-bold">
            <FiX />
          </button>
        </div>
      )}

      <div className="mt-2 space-y-2">
        {/* Step 1: Delivery Address */}
        <div className="bg-white p-4 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-3">
              <span className="bg-blue-50 text-blue-600 w-5 h-5 rounded-sm flex items-center justify-center text-[10px] font-bold">1</span>
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Delivery Address</h2>
            </div>
            {step > 1 && (
              <button onClick={() => setStep(1)} className="text-blue-600 text-xs font-bold uppercase border border-gray-200 px-3 py-1 rounded-sm shadow-sm">
                Change
              </button>
            )}
          </div>

          {step === 1 ? (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <input name="name" value={formData.name} onChange={handleChange} placeholder="Full Name" className="w-full border-b-2 border-gray-100 py-2 outline-none focus:border-blue-600 text-sm font-bold" />
                <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone Number" className="w-full border-b-2 border-gray-100 py-2 outline-none focus:border-blue-600 text-sm font-bold" />
              </div>
              <textarea name="address" value={formData.address} onChange={handleChange} placeholder="Address (House No, Building, Street, Area)" rows="2" className="w-full border-b-2 border-gray-100 py-2 outline-none focus:border-blue-600 text-sm font-bold resize-none" />
              <div className="grid grid-cols-2 gap-3">
                <input name="city" value={formData.city} onChange={handleChange} placeholder="City & Town" className="w-full border-b-2 border-gray-100 py-2 outline-none focus:border-blue-600 text-sm font-bold" />
                <input name="state" value={formData.state} onChange={handleChange} placeholder="State" className="w-full border-b-2 border-gray-100 py-2 outline-none focus:border-blue-600 text-sm font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input name="pincode" value={formData.pincode} onChange={handleChange} placeholder="Pincode" className="w-full border-b-2 border-gray-100 py-2 outline-none focus:border-blue-600 text-sm font-bold" />
                <input name="landmark" value={formData.landmark} onChange={handleChange} placeholder="Landmark" className="w-full border-b-2 border-gray-100 py-2 outline-none focus:border-blue-600 text-sm font-bold" />
              </div>
              <button
                onClick={() => {
                  login(formData);
                  setStep(2);
                }}
                className="w-full bg-[#fb641b] text-white font-bold py-4 rounded-sm shadow-md uppercase text-sm"
              >
                Deliver Here
              </button>
            </div>
          ) : (
            <div className="mt-2">
              <p className="text-sm font-bold text-gray-800">{formData.name} <span className="ml-2 px-2 py-0.5 bg-gray-100 text-[10px] rounded-sm">HOME</span></p>
              <p className="text-xs text-gray-600 mt-1">{formData.address}{formData.city ? `, ${formData.city}` : ''}{formData.state ? `, ${formData.state}` : ''}, {formData.landmark}, {formData.pincode}</p>
              <p className="text-xs font-bold text-gray-800 mt-1">{formData.phone}</p>
            </div>
          )}
        </div>

        {/* Step 2: Order Summary */}
        <div className="bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <span className={`w-5 h-5 rounded-sm flex items-center justify-center text-[10px] font-bold ${step >= 2 ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>2</span>
            <h2 className={`text-sm font-bold uppercase tracking-wider ${step >= 2 ? 'text-gray-500' : 'text-gray-300'}`}>Order Summary</h2>
          </div>

          {step === 2 && (
            <div className="space-y-4">
              {cart.map((item, idx) => (
                <div key={idx} className="flex gap-4 border-b border-gray-50 pb-4">
                  <img src={item.image} alt={item.name} className="w-20 h-20 object-contain border border-gray-100" />
                  <div className="flex-grow">
                    <h3 className="text-sm font-medium text-gray-800 line-clamp-2">{item.name}</h3>
                    <p className="text-xs text-gray-400 mt-1 italic capitalize">Seller: 𝐋𝐨𝐯𝐞𝐥𝐲 𝐎𝐮𝐭𝐟𝐢𝐭𝐬</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm font-bold text-gray-900">₹{item.price}</span>
                      <span className="text-[10px] text-green-600 font-bold">1 Offer Applied</span>
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex justify-between items-center bg-gray-50 p-3">
                <p className="text-xs font-medium text-gray-600">Order confirmation email will be sent to your registered ID.</p>
                <button onClick={() => setStep(3)} className="bg-[#fb641b] text-white font-bold px-6 py-3 rounded-sm shadow-md uppercase text-xs">Continue</button>
              </div>
            </div>
          )}
        </div>

        {/* Step 3: Payment Options */}
        <div className="bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <span className={`w-5 h-5 rounded-sm flex items-center justify-center text-[10px] font-bold ${step === 3 ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>3</span>
            <h2 className={`text-sm font-bold uppercase tracking-wider ${step === 3 ? 'text-gray-500' : 'text-gray-300'}`}>Payment Options</h2>
          </div>

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 border border-blue-100 bg-blue-50/30 rounded-sm">
                <div className="w-4 h-4 rounded-full border-4 border-blue-600 flex items-center justify-center"></div>
                <div className="flex-grow">
                  <p className="text-sm font-bold text-gray-800">PhonePe / Google Pay / BHIM UPI</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Pay via UPI ID: mrdharun200@okaxis</p>
                </div>
                <img src="https://img1a.flixcart.com/www/linchpin/fk-cp-zion/img/payment-method-bhim-upi_70200c.png" alt="UPI" className="h-4" />
              </div>
              
              {/* Mandatory Terms & Conditions Banner (Directs user to Terms Page - No Checkbox) */}
              {acceptedTerms ? (
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/70 text-emerald-900 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <FiCheck className="w-5 h-5 text-emerald-600 bg-emerald-100 rounded-full p-1 font-bold shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-emerald-900">Terms & Conditions Reviewed</p>
                      <p className="text-[10px] text-emerald-700">You have read and agreed to our store terms.</p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => navigate('/terms?from=checkout')}
                    className="text-xs font-bold text-emerald-800 underline hover:text-emerald-950 shrink-0 ml-2"
                  >
                    Re-read Terms
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/60 text-blue-900 space-y-2 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📜</span>
                    <p className="text-xs font-extrabold uppercase tracking-wider text-blue-900">Mandatory Store Policy Review</p>
                  </div>
                  <p className="text-xs text-blue-800 leading-relaxed font-medium">
                    Before placing your order, store policy requires you to read and agree to our Terms & Conditions page.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/terms?from=checkout&autoPay=true')}
                    className="text-xs font-bold text-blue-700 underline flex items-center gap-1 hover:text-blue-900"
                  >
                    Click here to read Terms & Conditions →
                  </button>
                </div>
              )}

              <button
                disabled={isProcessing}
                onClick={handlePayment}
                className={`w-full text-white font-bold py-4 rounded-sm shadow-lg uppercase text-sm flex items-center justify-center gap-2 ${
                  isProcessing ? 'bg-orange-400 cursor-not-allowed' : acceptedTerms ? 'bg-[#fb641b]' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isProcessing ? (
                  <>
                    <FiLoader className="animate-spin text-lg" />
                    Initializing Payment...
                  </>
                ) : acceptedTerms ? (
                  `Proceed to Pay ₹${totalAmount}`
                ) : (
                  `Read Terms & Pay ₹${totalAmount}`
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Price Details - Only show on wide screens or as a summary footer on mobile */}
      <div className="mt-2 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-50 pb-2">Price Details</h2>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-700">Price ({cart.length} items)</span>
            <span className="text-gray-900 font-medium">₹{itemTotal + savings}</span>
          </div>
          {savings > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">Combo Savings</span>
              <span className="text-green-600 font-medium">-₹{savings}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-700">Delivery Charges</span>
            <span className={`${shipping === 0 ? 'text-green-600' : 'text-gray-950 font-bold'} font-medium`}>
              {shipping === 0 ? 'FREE' : `₹${shipping}`}
            </span>
          </div>
          <div className="flex justify-between border-t border-dashed border-gray-200 pt-3 mt-3">
            <span className="text-base font-bold text-gray-900">Total Amount</span>
            <span className="text-base font-bold text-gray-900">₹{totalAmount}</span>
          </div>
          {comboDetails && (
            <p className="text-[10px] text-blue-600 font-bold mt-2">
              ✨ Combo Offer Applied ({comboDetails.sets} bundle(s) / {comboDetails.totalItems} items)
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 px-6 flex items-center gap-2 text-gray-400">
        <FiShield />
        <p className="text-[10px] font-bold uppercase tracking-widest">Safe and Secure Payments. 100% Authentic products.</p>
      </div>

      {/* Secure Cryptographic Webhook Verification Overlay */}
      {isVerifying && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center z-50 p-6 text-center animate-fade-in">
          <div className="bg-white p-8 rounded-3xl max-w-md shadow-2xl flex flex-col items-center border border-slate-100">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-6"></div>
            <h2 className="text-xl font-black text-slate-800 mb-2">Verifying Payment Status</h2>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              We are cryptographically verifying your payment with the gateway. This guarantees maximum security. Please do not close, refresh, or navigate away from this window.
            </p>
            <div className="bg-blue-50 border border-blue-100 px-4 py-2.5 rounded-xl text-blue-700 text-xs font-black uppercase tracking-wider animate-pulse flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping"></span>
              Awaiting Signed Webhook...
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;

