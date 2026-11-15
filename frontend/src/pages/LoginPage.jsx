import React, { useState, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FiUser, FiMapPin, FiPhone, FiArrowRight, FiShield } from 'react-icons/fi';

const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/checkout';
  const { login, user } = useContext(AuthContext);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name && formData.phone && formData.address && formData.pincode) {
      login(formData); 
      navigate(redirectTarget);
    } else {
      alert('Please fill in all required customer details (Name, Mobile NO, Address, Pincode)');
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100/70 flex flex-col items-center justify-center py-8 px-5 font-sans relative overflow-hidden">
      
      {/* Background Decorative Glass Glow Orbs */}
      <div className="w-96 h-96 bg-blue-400/20 rounded-full blur-3xl absolute -top-24 -left-24 animate-pulse pointer-events-none"></div>
      <div className="w-80 h-80 bg-blue-600/15 rounded-full blur-3xl absolute -bottom-16 -right-16 pointer-events-none"></div>

      {/* Aesthetic White & Blue Glassmorphism Container */}
      <div className="w-full max-w-md bg-white/80 backdrop-blur-2xl border border-white/80 rounded-[40px] p-7 md:p-8 shadow-[0_25px_60px_rgba(37,99,235,0.14)] space-y-6 relative z-10">
        
        {/* Top Handle Bar */}
        <div className="w-14 h-1.5 bg-blue-200/80 rounded-full mx-auto mb-1"></div>

        {/* Title Section */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-black text-[#1e3a8a] uppercase tracking-tight">Customer Registration</h1>
          <p className="text-blue-600/90 text-xs font-bold uppercase tracking-wider">
            Enter your details to place order
          </p>
        </div>

        {/* Aesthetic Form with White & Blue Glassmorphism Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* 1. Full Name Input */}
          <div className="relative group">
            <FiUser className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-600 text-xl pointer-events-none transition-transform group-focus-within:scale-110" />
            <input
              name="name"
              type="text"
              placeholder="Full Name"
              className="w-full pl-16 pr-6 py-4.5 bg-blue-50/70 border border-blue-200/80 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 rounded-full outline-none transition-all font-extrabold text-slate-800 placeholder-blue-400/80 text-base shadow-sm"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          {/* 2. Phone Number / Mobile NO Input */}
          <div className="relative group">
            <FiPhone className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-600 text-xl pointer-events-none transition-transform group-focus-within:scale-110" />
            <input
              name="phone"
              type="tel"
              placeholder="Phone Number"
              className="w-full pl-16 pr-6 py-4.5 bg-blue-50/70 border border-blue-200/80 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 rounded-full outline-none transition-all font-extrabold text-slate-800 placeholder-blue-400/80 text-base shadow-sm"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          {/* 3. Delivery / Shipping Address Textarea */}
          <div className="relative group">
            <FiMapPin className="absolute left-6 top-5 text-blue-600 text-xl pointer-events-none transition-transform group-focus-within:scale-110" />
            <textarea
              name="address"
              placeholder="Shipping Address"
              rows="2"
              className="w-full pl-16 pr-6 py-4 bg-blue-50/70 border border-blue-200/80 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 rounded-3xl outline-none transition-all font-extrabold text-slate-800 placeholder-blue-400/80 text-base resize-none shadow-sm"
              value={formData.address}
              onChange={handleChange}
              required
            ></textarea>
          </div>

          {/* 4. City & Town / State Grid */}
          <div className="grid grid-cols-2 gap-3">
            <input
              name="city"
              type="text"
              placeholder="City & Town"
              className="w-full px-6 py-4 bg-blue-50/70 border border-blue-200/80 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 rounded-full outline-none transition-all font-extrabold text-slate-800 placeholder-blue-400/80 text-base shadow-sm"
              value={formData.city}
              onChange={handleChange}
            />
            <input
              name="state"
              type="text"
              placeholder="State"
              className="w-full px-6 py-4 bg-blue-50/70 border border-blue-200/80 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 rounded-full outline-none transition-all font-extrabold text-slate-800 placeholder-blue-400/80 text-base shadow-sm"
              value={formData.state}
              onChange={handleChange}
            />
          </div>

          {/* 5. Pincode / Landmark Grid */}
          <div className="grid grid-cols-2 gap-3">
            <input
              name="pincode"
              type="text"
              placeholder="Pincode"
              className="w-full px-6 py-4 bg-blue-50/70 border border-blue-200/80 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 rounded-full outline-none transition-all font-extrabold text-slate-800 placeholder-blue-400/80 text-base shadow-sm"
              value={formData.pincode}
              onChange={handleChange}
              required
            />
            <input
              name="landmark"
              type="text"
              placeholder="Landmark"
              className="w-full px-6 py-4 bg-blue-50/70 border border-blue-200/80 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 rounded-full outline-none transition-all font-extrabold text-slate-800 placeholder-blue-400/80 text-base shadow-sm"
              value={formData.landmark}
              onChange={handleChange}
            />
          </div>

          {/* 6. Glowing Blue Pill Action Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] hover:from-[#1d4ed8] hover:to-[#1e40af] text-white font-black py-5 rounded-full shadow-[0_12px_30px_rgba(37,99,235,0.38)] hover:shadow-[0_16px_35px_rgba(37,99,235,0.48)] active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-wider text-xl cursor-pointer mt-6"
          >
            Get Started <FiArrowRight className="text-xl" />
          </button>
        </form>

        <div className="flex items-center justify-center gap-1.5 text-blue-600/90 text-xs font-bold uppercase tracking-widest pt-2">
          <FiShield className="text-sm" />
          <span>100% Safe & Secure Registration</span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;


