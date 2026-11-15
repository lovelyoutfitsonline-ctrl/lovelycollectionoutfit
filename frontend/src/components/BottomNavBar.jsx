import React, { useContext } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FiHome, FiHeart, FiShoppingCart, FiPackage, FiTag } from 'react-icons/fi'
import { ShopContext } from '../context/ShopContext'

const BottomNavBar = () => {
  const location = useLocation()
  const { cart, wishlist } = useContext(ShopContext)

  // Check if there is any offer item in the cart (price 300/200 or combo group)
  const hasOfferItem = cart.some(
    (item) => item.combo_group === 'COMBO300' || item.combo_group === 'COMBO200' || item.price === 300 || item.price === 200
  )

  const navItems = [
    { name: 'Orders', path: '/orders', icon: FiPackage },
    { name: 'Wishlist', path: '/wishlist', icon: FiHeart, count: wishlist.length },
    { name: 'Home', path: '/products', icon: FiHome },
    { name: 'Cart', path: '/cart', icon: FiShoppingCart, count: cart.length },
    { name: 'Offers', path: '/offers', icon: FiTag },
  ]

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-2xl border-t border-blue-50 shadow-[0_-10px_30px_rgba(59,130,246,0.08)] px-6 py-4 rounded-t-[30px] z-50">
      <div className="flex justify-between items-center max-w-md mx-auto relative">
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.path
          const Icon = item.icon
          
          if (item.name === 'Home') {
            return (
              <Link key={index} to={item.path} className="relative group w-16 flex flex-col items-center justify-end pt-1">
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/40 border-4 border-white transition-all group-hover:scale-105 active:scale-95">
                  <Icon className="text-white text-2xl group-hover:scale-110 transition-transform duration-300" />
                </div>
                <span className={`text-[10px] font-bold mt-8 transition-all duration-300 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-500'}`}>
                  Home
                </span>
              </Link>
            )
          }

          if (item.name === 'Offers') {
            return (
              <Link key={index} to={item.path} className="flex flex-col items-center group relative pt-1 w-12">
                <div className="relative">
                  <Icon className={`text-2xl transition-all duration-300 ${isActive ? 'text-green-600 scale-110' : 'text-gray-400 group-hover:text-green-500'} ${hasOfferItem ? 'animate-pulse text-green-500' : ''}`} />
                  {hasOfferItem && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border border-white animate-bounce"></span>
                  )}
                </div>
                <span className={`text-[10px] font-bold mt-1 transition-all duration-300 ${isActive ? 'text-green-600 font-extrabold' : 'text-gray-400 group-hover:text-green-500'} ${hasOfferItem ? 'text-green-500' : ''}`}>
                  {item.name}
                </span>
              </Link>
            )
          }

          return (
            <Link key={index} to={item.path} className="flex flex-col items-center group relative pt-1 w-12">
              <div className="relative">
                <Icon className={`text-2xl transition-all duration-300 ${isActive ? 'text-blue-600 scale-110' : 'text-gray-400 group-hover:text-blue-500'}`} />
                {item.count > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                    {item.count}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-bold mt-1 transition-all duration-300 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-500'}`}>
                {item.name}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default BottomNavBar
