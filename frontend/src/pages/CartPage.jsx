import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import { AuthContext } from '../context/AuthContext';
import { FiChevronLeft, FiTrash2, FiMinus, FiPlus } from 'react-icons/fi';

const CartPage = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { cart, updateQuantity, removeFromCart, calculateCartTotals } = useContext(ShopContext);
  const { total, savings, comboDetails, shipping } = calculateCartTotals(cart);

  return (
    <div className="w-full min-h-screen bg-white pb-32">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 pt-6 mb-8">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
          <FiChevronLeft className="text-blue-600 text-xl" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">My Cart</h1>
      </div>

      {cart.length === 0 ? (
        <div className="flex flex-col items-center justify-center pt-20 px-10">
          <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
            <FiTrash2 className="text-4xl text-blue-200" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 text-center mb-8">Looks like you haven't added anything to your cart yet.</p>
          <button 
            onClick={() => navigate('/products')}
            className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-blue-500/30"
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="px-6 flex flex-col gap-4">
          {cart.map((item) => (
            <div key={`${item._id || item.id}-${item.selectedSize || 'M'}`} className="flex gap-4 p-3 bg-white border border-blue-50 rounded-2xl shadow-sm">
              <div className="w-24 h-24 rounded-xl bg-blue-50 overflow-hidden">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-grow flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-800 line-clamp-1">{item.name}</h3>
                    {item.selectedSize && (
                      <p className="text-[10px] text-gray-400 mt-0.5 font-bold uppercase tracking-wider">Size: <span className="text-blue-600">{item.selectedSize}</span></p>
                    )}
                    {(item.combo_group === "COMBO300" || item.combo_group === "COMBO200" || item.price === 300 || item.price === 200) && (
                      <span className="text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-bold mt-1 inline-block uppercase tracking-wider">
                        {item.combo_group === "COMBO200" || item.price === 200 ? 'COMBO 3 for ₹500' : 'COMBO 4 for ₹999'}
                      </span>
                    )}
                  </div>
                  <button onClick={() => removeFromCart(item.id || item._id, item.selectedSize)}>
                    <FiTrash2 className="text-red-400" />
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-black text-blue-600">₹{item.price}</span>
                  <div className="flex items-center gap-3 bg-blue-50 px-2 py-1 rounded-lg">
                    <button onClick={() => updateQuantity(item.id || item._id, item.selectedSize, item.quantity - 1)} className="w-6 h-6 flex items-center justify-center">
                      <FiMinus className="text-blue-600 text-xs" />
                    </button>
                    <span className="font-bold text-sm text-gray-800">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id || item._id, item.selectedSize, item.quantity + 1)} className="w-6 h-6 flex items-center justify-center">
                      <FiPlus className="text-blue-600 text-xs" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Checkout Section */}
      {cart.length > 0 && (
        <div className="fixed bottom-24 left-0 w-full px-6 py-6 bg-white border-t border-blue-50 rounded-t-[30px] shadow-[0_-10px_30px_rgba(59,130,246,0.05)]">
          {comboDetails && (
            <div className="mb-4 p-3 bg-blue-50 rounded-2xl border border-blue-100">
              <div className="flex justify-between items-center mb-1">
                <span className="text-blue-600 font-bold text-sm flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                  Combo Applied: {comboDetails.totalItems} Items
                </span>
                <span className="text-blue-600 font-black text-sm">₹{comboDetails.appliedPrice}</span>
              </div>
              <p className="text-[10px] text-blue-400 font-medium">
                {comboDetails.sets} bundle(s) of 4 items + {comboDetails.remaining} individual items
              </p>
            </div>
          )}
          
          <div className="flex flex-col gap-2 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-medium">Subtotal</span>
              <span className="font-bold text-gray-800">₹{total + savings}</span>
            </div>
            {savings > 0 && (
              <div className="flex justify-between items-center text-green-600">
                <span className="font-medium">Combo Savings</span>
                <span className="font-bold">- ₹{savings}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-gray-500">
              <span className="font-medium">Shipping Charges</span>
              <span className={`font-bold ${shipping === 0 ? 'text-green-600' : 'text-gray-800'}`}>
                {shipping === 0 ? 'FREE' : `₹${shipping}`}
              </span>
            </div>
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-dashed border-gray-100">
              <span className="text-gray-800 font-bold">Total Amount</span>
              <span className="text-2xl font-black text-blue-600">₹{total + shipping}</span>
            </div>
          </div>

          <button 
            onClick={() => {
              if (!user) {
                navigate('/login?redirect=/checkout');
              } else {
                navigate('/checkout');
              }
            }}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
          >
            Checkout Now
            <span className="bg-white/20 px-3 py-1 rounded-xl text-sm">₹{total + shipping}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default CartPage;
