import React, { useState, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiX, FiCheck } from 'react-icons/fi';
import { AuthContext } from '../context/AuthContext';
import { ShopContext } from '../context/ShopContext';

const PolicyPage = () => {
  const navigate = useNavigate();
  const { acceptPolicies } = useContext(AuthContext);
  const { cart } = useContext(ShopContext);
  const [canProceed, setCanProceed] = useState(false);
  const scrollRef = useRef(null);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 30) {
        setCanProceed(true);
      }
    }
  };

  const handleAccept = () => {
    acceptPolicies();
    if (cart && cart.length > 0) {
      navigate('/checkout');
    } else {
      navigate('/products');
    }
  };

  return (
    <div className="w-full min-h-screen bg-white flex flex-col font-sans">
      {/* Header with Close Button */}
      <div className="flex justify-end p-4">
        <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
          <FiX size={20} />
        </button>
      </div>

      <div className="px-6 pb-32 max-w-2xl mx-auto w-full flex-grow flex flex-col">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6 tracking-tight border-b pb-4">Return and Exchange Policy</h1>
        
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="space-y-6 text-gray-700 leading-relaxed overflow-y-auto max-h-[65vh] pr-2 scrollbar-hide flex-grow"
        >
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-6">
            <p className="text-amber-900 font-semibold mb-1">Important Notice</p>
            <p className="text-sm text-amber-800 font-medium">
              To be eligible for an exchange, please note the following mandatory conditions:
            </p>
          </div>
          
          <div className="space-y-6">
            <h2 className="text-xl font-extrabold text-gray-950 border-b pb-2">Returns and exchange</h2>
            
            {/* Condition 1 */}
            <div className="bg-red-50/55 border border-red-100 p-4 rounded-xl">
              <h3 className="text-base font-bold text-red-950 mb-2 flex items-start gap-2">
                <span className="bg-red-100 text-red-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                Mandatory Unboxing Video
              </h3>
              <p className="text-sm text-red-900 leading-relaxed">
                Customers must record a clear, continuous unboxing video from start to finish in one single shot. The video must be unedited and without any cuts. Returns or exchanges will not be accepted without this video proof.
              </p>
            </div>

            {/* Condition 2 */}
            <div className="pb-4">
              <h3 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
                <span className="bg-gray-100 text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</span>
                Eligibility
              </h3>
              <p className="text-sm text-gray-600 pl-8">
                Returns are strictly accepted only for products that are defective, damaged, or clearly used upon arrival.
              </p>
            </div>

            {/* Condition 3 */}
            <div className="pb-4">
              <h3 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
                <span className="bg-gray-100 text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</span>
                Size Exchange Restrictions
              </h3>
              <div className="pl-8 space-y-2 text-sm text-gray-600">
                <p>• Size exchanges are not available for items priced below ₹300.</p>
                <p>• Size exchanges are not available for combo sets (e.g..3 T-shirts for 500, 4 Shirts for 1000, or any Shirt & Pant /T-shirt & Tracksuit combos)</p>
              </div>
            </div>

            <h2 className="text-xl font-extrabold text-gray-950 border-b pb-2 pt-4">Exchange Instructions</h2>

            {/* Instruction 1 */}
            <div className="flex gap-3">
              <div className="bg-emerald-50 text-emerald-700 w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold shrink-0">1</div>
              <div>
                <h4 className="font-bold text-gray-900">Contact Us</h4>
                <p className="text-sm text-gray-600">Give us a call to get in touch with our team and start your exchange process.</p>
              </div>
            </div>

            {/* Instruction 2 */}
            <div className="flex gap-3">
              <div className="bg-emerald-50 text-emerald-700 w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold shrink-0">2</div>
              <div>
                <h4 className="font-bold text-gray-900">Return Address</h4>
                <p className="text-sm text-gray-600">We will provide our return address once you have contacted us.</p>
              </div>
            </div>

            {/* Instruction 3 */}
            <div className="flex gap-3">
              <div className="bg-emerald-50 text-emerald-700 w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold shrink-0">3</div>
              <div>
                <h4 className="font-bold text-gray-900">Return Shipping</h4>
                <p className="text-sm text-gray-600">The customer is responsible for paying the shipping charges to send the item back to us.</p>
              </div>
            </div>

            {/* Instruction 4 */}
            <div className="flex gap-3">
              <div className="bg-emerald-50 text-emerald-700 w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold shrink-0">4</div>
              <div>
                <h4 className="font-bold text-gray-900">Replacement Shipping</h4>
                <p className="text-sm text-gray-600">We will pay the courier fees to ship the replacement product back to you.</p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Sticky Bottom Button */}
      <div className="fixed bottom-0 left-0 w-full p-6 bg-white border-t border-gray-100 flex flex-col items-center shadow-lg">
        {!canProceed && (
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 animate-pulse">Please scroll to read return policy</p>
        )}
        <button
          disabled={!canProceed}
          onClick={handleAccept}
          className={`w-full max-w-lg py-5 rounded-full font-bold text-lg transition-all flex items-center justify-center gap-2 ${
            canProceed 
            ? 'bg-[#10b981] text-white shadow-lg hover:brightness-95 active:scale-95' 
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          I agree {canProceed && <FiCheck />}
        </button>
      </div>
    </div>
  );
};

export default PolicyPage;
