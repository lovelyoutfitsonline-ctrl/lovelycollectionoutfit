import React, { useContext, useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import { FiChevronLeft, FiSend, FiMessageCircle, FiPackage, FiActivity } from 'react-icons/fi';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const ChatPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { orders, submitFeedback } = useContext(ShopContext);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [messagesList, setMessagesList] = useState([]);
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef(null);

  // Auto-scroll to the bottom of messages list
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Find order from global context or backend orders stream
  useEffect(() => {
    if (orders && orders.length > 0) {
      const found = orders.find(
        (o) => o.orderId === orderId || o._id === orderId || o.id === orderId
      );
      if (found) {
        setOrder(found);
        setLoading(false);
      }
    }
  }, [orders, orderId]);

  // Load chat messages and poll every 4 seconds
  useEffect(() => {
    if (order) {
      const fetchFeedbacks = async () => {
        try {
          const response = await axios.get(`${API_BASE_URL}/feedback`);
          // Filter comments that match this specific customer name
          const customerNameFilter = order.customerName || 'Customer';
          const filtered = response.data.filter(
            (m) => m.customerName === customerNameFilter
          );
          setMessagesList(filtered);
        } catch (error) {
          console.error('Error loading chat messages:', error);
        }
      };

      fetchFeedbacks();
      const interval = setInterval(fetchFeedbacks, 4000);
      return () => clearInterval(interval);
    }
  }, [order]);

  // Scroll to bottom when messages list changes
  useEffect(() => {
    scrollToBottom();
  }, [messagesList]);

  // Handle sending a customer message
  const handleSendMessage = async () => {
    if (!messageText.trim() || !order) return;
    setIsSending(true);

    const feedbackData = {
      customerName: order.customerName || 'Customer',
      rating: 5,
      comment: messageText.trim(),
      productId: order.items[0]?.productId || null,
    };

    try {
      const response = await submitFeedback(feedbackData);
      if (response) {
        setMessagesList((prev) => [...prev, response]);
        setMessageText('');
        setTimeout(scrollToBottom, 50);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-bold tracking-tight animate-pulse">Loading Chat Room...</p>
      </div>
    );
  }

  const firstItem = order?.items[0];

  return (
    <div className="w-full h-screen bg-slate-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center gap-4 flex-shrink-0 shadow-sm z-10">
        <button
          onClick={() => navigate('/orders')}
          className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center active:scale-95 transition-all"
        >
          <FiChevronLeft className="text-slate-700 text-xl" />
        </button>
        <div className="flex-grow">
          <h1 className="text-lg font-black text-slate-800">Message Seller</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Order #{order.orderId || order.id}
          </p>
        </div>
        <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full flex items-center gap-1.5 border border-blue-100">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
          <span className="text-[10px] font-black uppercase tracking-wider">Live Support</span>
        </div>
      </div>

      {/* Collapsible/Compact Order Preview Card */}
      <div className="bg-white border-b border-slate-100 px-6 py-3 flex items-center gap-4 flex-shrink-0 shadow-sm">
        {firstItem?.image && (
          <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-100">
            <img src={firstItem.image} alt={firstItem.name} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex-grow min-w-0">
          <p className="text-xs font-black text-slate-800 truncate">{firstItem?.name || 'Product Details'}</p>
          <p className="text-[10px] text-blue-600 font-bold">
            ₹{order.total} • Size: {firstItem?.size || 'M'} • Qty: {firstItem?.quantity || 1}
          </p>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Status</span>
          <span
            className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
              order.status === 'Delivered'
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'bg-blue-100 text-blue-700 border border-blue-200'
            }`}
          >
            {order.status || 'Processing'}
          </span>
        </div>
      </div>

      {/* Messages Stream Container */}
      <div className="flex-grow overflow-y-auto px-6 py-6 space-y-4 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        {messagesList.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4 animate-bounce">
              <FiMessageCircle className="text-3xl" />
            </div>
            <h3 className="text-slate-800 font-black text-base mb-1">Start the Conversation</h3>
            <p className="text-slate-400 text-xs max-w-[240px]">
              Send a message below to connect directly with the seller regarding your order details.
            </p>
          </div>
        ) : (
          messagesList.map((msg) => (
            <div key={msg._id} className="space-y-3">
              {/* Customer Message */}
              <div className="flex justify-end">
                <div className="bg-blue-600 text-white rounded-2xl rounded-tr-none px-4 py-3 max-w-[80%] shadow-sm border border-blue-500/10">
                  <p className="text-sm font-semibold leading-relaxed break-words">{msg.comment}</p>
                  <span className="text-[9px] text-blue-200 block mt-1 text-right font-medium">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Seller Reply */}
              {msg.reply && (
                <div className="flex justify-start">
                  <div className="bg-white text-slate-800 rounded-2xl rounded-tl-none px-4 py-3 max-w-[80%] border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[9px] font-black uppercase text-blue-600 tracking-wider">Seller Reply</span>
                    </div>
                    <p className="text-sm font-semibold leading-relaxed break-words text-slate-700">{msg.reply}</p>
                    <span className="text-[9px] text-slate-400 block mt-1 font-medium">
                      {new Date(msg.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Premium Sticky Footer Input Bar */}
      <div className="bg-white border-t border-slate-100 px-6 py-4 flex-shrink-0 shadow-[0_-5px_25px_rgba(0,0,0,0.02)] z-10 pb-8">
        <div className="flex gap-3 items-center bg-slate-50 border border-slate-100 rounded-2xl p-1.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-300">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            placeholder="Type your message to seller..."
            className="flex-grow bg-transparent border-none outline-none px-3 py-2 font-semibold text-slate-700 text-sm placeholder-slate-400"
          />
          <button
            disabled={isSending || !messageText.trim()}
            onClick={handleSendMessage}
            className="w-11 h-11 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white rounded-xl shadow-md active:scale-95 disabled:scale-100 transition-all flex items-center justify-center flex-shrink-0"
          >
            <FiSend className="text-base" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
