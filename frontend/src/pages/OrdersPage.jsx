import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import { AuthContext } from '../context/AuthContext';
import { FiChevronLeft, FiBox, FiCheckCircle, FiRefreshCw } from 'react-icons/fi';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const OrdersPage = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { orders: contextOrders, confirmDelivery, refetchOrders } = useContext(ShopContext);
  const [orders, setOrders] = useState(contextOrders || []);
  const [isLoading, setIsLoading] = useState(true);

  // Directly fetch latest verified orders from backend API on mount
  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_BASE_URL}/orders`);
      setOrders(response.data);
      if (refetchOrders) refetchOrders();
    } catch (error) {
      console.error('Error fetching orders:', error);
      // Fallback to context orders if network fails
      if (contextOrders && contextOrders.length > 0) {
        setOrders(contextOrders);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      loadOrders();
    }
  }, [user, navigate]);

  // Robust matching by phone or customerId
  const userDigits = String(user?.phone || '').replace(/\D/g, '');
  const userOrders = orders.filter((order) => {
    if (!user) return false;
    const phoneDigits = String(order.customerPhone || '').replace(/\D/g, '');
    const customerDigits = String(order.customerId || '').replace(/\D/g, '');

    return (
      order.customerPhone === user.phone ||
      order.customerId === user.phone ||
      (userDigits.length >= 7 && phoneDigits.length >= 7 && (userDigits.endsWith(phoneDigits) || phoneDigits.endsWith(userDigits))) ||
      (userDigits.length >= 7 && customerDigits.length >= 7 && (userDigits.endsWith(customerDigits) || customerDigits.endsWith(userDigits)))
    );
  });

  const getStatusWidth = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'DELIVERED') return '100%';
    if (s === 'SHIPPED') return '80%';
    if (s === 'PACKED') return '55%';
    if (s === 'CONFIRMED' || s === 'PROCESSING') return '35%';
    return '25%';
  };

  if (!user) return null;

  return (
    <div className="w-full min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
            <FiChevronLeft className="text-blue-600 text-xl" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">My Orders</h1>
        </div>
        <button 
          onClick={loadOrders} 
          disabled={isLoading}
          className="text-blue-600 p-2 hover:bg-blue-50 rounded-full transition-colors"
          title="Refresh Orders"
        >
          <FiRefreshCw className={`text-lg ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center pt-24 px-10">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-sm font-semibold text-gray-500">Loading your orders...</p>
        </div>
      ) : userOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center pt-20 px-10">
          <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
            <FiBox className="text-4xl text-blue-200" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">No orders yet</h2>
          <p className="text-gray-500 text-center mb-8">You haven't placed any orders. Start shopping to see them here!</p>
          <button 
            onClick={() => navigate('/products')}
            className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-blue-500/30"
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="px-6 flex flex-col gap-6">
          {userOrders.map((order) => {
            const currentStatus = order.orderStatus || order.status || 'CONFIRMED';
            return (
              <div key={order._id || order.id || order.orderId} className="border border-blue-100 rounded-3xl p-5 shadow-sm bg-white">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-blue-50">
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Order ID</p>
                    <p className="font-black text-gray-900">{order.orderId || order.id}</p>
                  </div>
                  <div className="flex flex-col items-end">
                     <div className="bg-blue-600 text-white px-3 py-1 rounded-full flex items-center gap-1 mb-1">
                       <span className="text-[10px] font-black uppercase tracking-wider">{currentStatus}</span>
                     </div>
                     <p className="text-[10px] text-gray-400 font-bold italic">
                       {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : (order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '')}
                     </p>
                  </div>
                </div>
                
                <div className="flex flex-col gap-3 mb-6">
                  {(order.items || []).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-blue-50 overflow-hidden flex-shrink-0 border border-blue-50">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-grow">
                        <p className="text-sm font-black text-gray-800 truncate">{item.name}</p>
                        <p className="text-xs text-blue-500 font-bold">Qty: {item.quantity} • Size: {item.size || 'M'} • ₹{item.price}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-blue-50/50 rounded-2xl p-4 mb-4 border border-blue-100/50">
                   <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-gray-500 font-bold uppercase tracking-tight">Status Update</span>
                      <span className="text-xs text-blue-600 font-black">{currentStatus}</span>
                   </div>
                   <div className="w-full bg-blue-100 h-1.5 rounded-full overflow-hidden mb-3">
                      <div 
                        className="bg-blue-600 h-full transition-all duration-1000 ease-out" 
                        style={{ width: getStatusWidth(currentStatus) }}
                      ></div>
                   </div>
                   {order.trackingLink && (
                     <div className="mt-3 pt-3 border-t border-blue-100/50">
                       <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Tracking Info</p>
                       <a 
                         href={order.trackingLink} 
                         target="_blank" 
                         rel="noopener noreferrer"
                         className="text-xs text-blue-600 font-black flex items-center gap-2 bg-white w-fit px-3 py-1.5 rounded-lg border border-blue-100 shadow-sm"
                       >
                         <FiBox /> Track My Package
                       </a>
                     </div>
                   )}
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs text-gray-400 font-bold">Total Amount Paid</span>
                  <span className="text-xl font-black text-blue-600 tracking-tighter">₹{order.total}</span>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 pt-4 border-t border-dashed border-gray-100 flex justify-between gap-3">
                  <button
                    onClick={() => navigate(`/chat/${order.orderId || order._id || order.id}`)}
                    className="flex-1 bg-white border-2 border-blue-600 text-blue-600 font-bold text-xs uppercase tracking-wider py-3 rounded-2xl active:scale-95 transition-all text-center"
                  >
                    Message Seller
                  </button>
                  {currentStatus === 'Shipped' && (
                    <button
                      onClick={() => confirmDelivery(order._id || order.id)}
                      className="flex-grow bg-green-600 hover:bg-green-700 text-white font-bold text-xs uppercase tracking-wider py-3 px-4 rounded-2xl shadow-lg shadow-green-500/20 active:scale-95 transition-all text-center"
                    >
                      Confirm Delivery
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default OrdersPage;
