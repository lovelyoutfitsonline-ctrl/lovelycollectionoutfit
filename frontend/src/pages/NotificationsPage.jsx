import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiChevronLeft, FiBell, FiPackage, FiTag, FiInfo } from 'react-icons/fi';
import { ShopContext } from '../context/ShopContext';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { notifications, markNotificationsAsRead, loading } = useContext(ShopContext);

  useEffect(() => {
    // Mark all as read when page is opened
    markNotificationsAsRead();
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'order': return <FiPackage className="text-blue-600" />;
      case 'offer': return <FiTag className="text-green-600" />;
      default: return <FiInfo className="text-gray-600" />;
    }
  };

  const getBgColor = (type) => {
    switch (type) {
      case 'order': return 'bg-blue-50';
      case 'offer': return 'bg-green-50';
      default: return 'bg-gray-50';
    }
  };

  return (
    <div className="w-full min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 pt-6 mb-8">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
          <FiChevronLeft className="text-blue-600 text-xl" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
      </div>

      {loading ? (
        <div className="flex flex-col gap-4 px-6">
           {[1, 2, 3].map(i => (
             <div key={i} className="h-24 bg-gray-50 rounded-3xl animate-pulse"></div>
           ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center pt-20 px-10">
          <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
            <FiBell className="text-4xl text-blue-200" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">All caught up!</h2>
          <p className="text-gray-500 text-center">No new notifications for you right now.</p>
        </div>
      ) : (
        <div className="px-6 flex flex-col gap-4">
          {notifications.map((notif) => (
            <div 
              key={notif._id} 
              className={`p-5 rounded-[30px] border border-blue-50 shadow-sm flex gap-4 transition-all hover:scale-[1.02] ${notif.read ? 'bg-white opacity-80' : 'bg-blue-50/30'}`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${getBgColor(notif.type)}`}>
                 {getIcon(notif.type)}
              </div>
              <div className="flex-grow">
                 <div className="flex justify-between items-start mb-1">
                    <h3 className="font-black text-gray-800 text-sm">{notif.title}</h3>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">{new Date(notif.date).toLocaleDateString()}</span>
                 </div>
                 <p className="text-xs text-gray-500 leading-relaxed font-medium">{notif.message}</p>
                 {!notif.read && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                 )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
