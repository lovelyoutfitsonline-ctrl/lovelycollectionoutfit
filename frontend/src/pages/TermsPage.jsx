import React, { useState, useRef, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiX, FiArrowRight, FiCheckCircle, FiShield } from 'react-icons/fi';
import { ShopContext } from '../context/ShopContext';
import { AuthContext } from '../context/AuthContext';

const TermsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, calculateCartTotals } = useContext(ShopContext);
  const { acceptPolicies } = useContext(AuthContext);
  
  const searchParams = new URLSearchParams(location.search);
  const fromCheckout = searchParams.get('from') === 'checkout' || location.state?.fromCheckout;
  const autoPay = searchParams.get('autoPay') === 'true';

  const { total: itemTotal, shipping } = calculateCartTotals(cart || []);
  const totalAmount = itemTotal + shipping;

  const [canProceed, setCanProceed] = useState(false);
  const scrollRef = useRef(null);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 40) {
        setCanProceed(true);
      }
    }
  };

  useEffect(() => {
    const checkScrollable = () => {
      if (scrollRef.current) {
        const { scrollHeight, clientHeight } = scrollRef.current;
        if (scrollHeight <= clientHeight + 20) {
          setCanProceed(true);
        }
      }
    };
    checkScrollable();
    window.addEventListener('resize', checkScrollable);
    return () => window.removeEventListener('resize', checkScrollable);
  }, []);

  const handleAgree = () => {
    sessionStorage.setItem('lovely_terms_accepted', 'true');
    if (acceptPolicies) acceptPolicies();

    if (fromCheckout || autoPay || (cart && cart.length > 0)) {
      navigate('/checkout?startPayment=true', { replace: true });
    } else {
      navigate('/products');
    }
  };

  const handleClose = () => {
    if (fromCheckout) {
      navigate('/checkout');
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="w-full min-h-screen bg-white flex flex-col font-sans">
      {/* Top Banner if redirected from Checkout */}
      {fromCheckout && (
        <div className="bg-blue-600 text-white px-4 py-3 text-xs font-bold text-center flex items-center justify-center gap-2 shadow-sm sticky top-0 z-50">
          <FiShield className="text-base shrink-0" />
          <span>Mandatory Step: Please read our Store Terms below to proceed to Payment</span>
        </div>
      )}

      {/* Header with Close Button */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded-sm">
            STORE POLICY & TERMS
          </span>
        </div>
        <button 
          onClick={handleClose} 
          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
          title="Close"
        >
          <FiX size={20} />
        </button>
      </div>

      <div className="px-6 pb-36 max-w-2xl mx-auto w-full flex-grow flex flex-col pt-4">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2 tracking-tight">Terms & Conditions</h1>
        <p className="text-xs text-gray-500 mb-4">
          Please review the following store terms carefully before completing your order.
        </p>
        
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="space-y-4 text-gray-700 leading-relaxed overflow-y-auto max-h-[60vh] pr-2 scrollbar-hide flex-grow border border-gray-100 rounded-2xl p-4 bg-gray-50/50"
        >
          <div className="bg-blue-50/80 p-4 rounded-xl border border-blue-100 mb-2">
            <p className="text-blue-950 font-bold mb-1 text-sm">Welcome to 𝐋𝐨𝐯𝐞𝐥𝐲 𝐎𝐮𝐭𝐟𝐢𝐭𝐬</p>
            <p className="text-xs text-blue-900 leading-relaxed">
              By placing an order on 𝐋𝐨𝐯𝐞𝐥𝐲 𝐎𝐮𝐭𝐟𝐢𝐭𝐬, you agree to comply with and be bound by the following terms and conditions. Please read them carefully.
            </p>
          </div>
          
          <div className="space-y-4">
            {/* Section 1 */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <h2 className="text-sm font-bold text-gray-900 mb-2 flex items-center">
                <span className="bg-red-50 text-red-600 w-6 h-6 rounded-full flex items-center justify-center mr-2 text-xs font-bold">1</span>
                Special Policy for Products at or below ₹300
              </h2>
              <p className="mb-2 text-xs text-gray-600 leading-relaxed">
                For all products priced at ₹300 or less, the following rules apply because these items are provided at below-wholesale rates for customer satisfaction:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs text-gray-700 font-medium">
                <li><strong className="text-red-600">No Size Exchanges:</strong> Please select your size carefully before placing an order.</li>
                <li><strong className="text-red-600">No Refunds:</strong> We do not offer refunds on these specific budget items.</li>
              </ul>
            </div>

            {/* Section 2 */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <h2 className="text-sm font-bold text-gray-900 mb-2 flex items-center">
                <span className="bg-gray-100 text-gray-700 w-6 h-6 rounded-full flex items-center justify-center mr-2 text-xs font-bold">2</span>
                Order Cancellation & Changes
              </h2>
              <p className="mb-2 text-xs text-gray-600 leading-relaxed">
                Once an order has been placed and payment initialized, it cannot be canceled or modified:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs text-gray-700 font-medium">
                <li>No color or size changes after order placement</li>
                <li>No item replacement requests after checkout</li>
              </ul>
            </div>

            {/* Section 3 */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <h2 className="text-sm font-bold text-gray-900 mb-2 flex items-center">
                <span className="bg-gray-100 text-gray-700 w-6 h-6 rounded-full flex items-center justify-center mr-2 text-xs font-bold">3</span>
                Online Operations & Support
              </h2>
              <p className="text-xs text-gray-600 leading-relaxed">
                We operate exclusively online. For customer assistance, order inquiries, or exchange support, please contact us directly via WhatsApp or our in-app chat support.
              </p>
            </div>

            {/* Section 4 */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <h2 className="text-sm font-bold text-gray-900 mb-2 flex items-center">
                <span className="bg-emerald-50 text-emerald-600 w-6 h-6 rounded-full flex items-center justify-center mr-2 text-xs font-bold">4</span>
                Product Quality Guarantee
              </h2>
              <p className="text-xs text-gray-600 leading-relaxed">
                All products sold on 𝐋𝐨𝐯𝐞𝐥𝐲 𝐎𝐮𝐭𝐟𝐢𝐭𝐬 are guaranteed to be 100% brand new, authentic, and inspected for quality before dispatch.
              </p>
            </div>

            {/* Section 5 */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <h2 className="text-sm font-bold text-gray-900 mb-2 flex items-center">
                <span className="bg-amber-50 text-amber-600 w-6 h-6 rounded-full flex items-center justify-center mr-2 text-xs font-bold">5</span>
                Address Accuracy
              </h2>
              <p className="text-xs text-gray-600 leading-relaxed">
                Please ensure your full delivery address, pincode, landmark, and phone number are 100% accurate. 𝐋𝐨𝐯𝐞𝐥𝐲 𝐎𝐮𝐭𝐟𝐢𝐭𝐬 is not responsible for shipment delays caused by incorrect address details.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Button */}
      <div className="fixed bottom-0 left-0 w-full p-4 bg-white border-t border-gray-100 flex flex-col items-center shadow-2xl z-50">
        {!canProceed && (
          <p className="text-[11px] font-bold text-amber-600 uppercase tracking-widest mb-2 animate-pulse flex items-center gap-1">
            <span>👇</span> Scroll to read all terms to unlock button
          </p>
        )}
        <button
          disabled={!canProceed}
          onClick={handleAgree}
          className={`w-full max-w-lg py-4 rounded-xl font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
            canProceed 
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30 active:scale-95 cursor-pointer' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {canProceed ? (
            <>
              <FiCheckCircle className="text-lg" />
              {fromCheckout && totalAmount > 0
                ? `I Have Read & Agree — Pay ₹${totalAmount}`
                : 'I Have Read & Agree to Terms'}
              <FiArrowRight className="text-lg ml-1" />
            </>
          ) : (
            'Please Scroll to Read Terms'
          )}
        </button>
      </div>
    </div>
  );
};

export default TermsPage;

