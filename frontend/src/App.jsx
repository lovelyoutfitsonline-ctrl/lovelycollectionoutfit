import React from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import HomePage from './pages/HomePage'
import ProductsPage from './pages/ProductsPage'
import ProductDetailPage from './pages/ProductDetailPage'
import CartPage from './pages/CartPage'
import WishlistPage from './pages/WishlistPage'
import OrdersPage from './pages/OrdersPage'
import ChatPage from './pages/ChatPage'
import BottomNavBar from './components/BottomNavBar'
import { ShopProvider } from './context/ShopContext'
import { AuthProvider } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import TermsPage from './pages/TermsPage'
import PolicyPage from './pages/PolicyPage'
import CheckoutPage from './pages/CheckoutPage'
import NotificationsPage from './pages/NotificationsPage'
import OffersPage from './pages/OffersPage'
import SplashEffect from './components/SplashEffect'
import { useState, useEffect } from 'react'

function App() {
  const location = useLocation();
  const noNavPages = ['/', '/login', '/terms', '/policy'];
  const showBottomNav = !noNavPages.includes(location.pathname) && !location.pathname.startsWith('/chat');
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashEffect />;
  }

  return (
    <AuthProvider>
      <ShopProvider>
        <div className="flex flex-col min-h-screen">
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/policy" element={<PolicyPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/offers" element={<OffersPage />} />
              <Route path="/product/:id" element={<ProductDetailPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/chat/:orderId" element={<ChatPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/wishlist" element={<WishlistPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/profile" element={<div className="p-4 text-center mt-20 text-gray-700">Profile Coming Soon</div>} />
            </Routes>
          </main>
          {showBottomNav && <BottomNavBar />}
        </div>
      </ShopProvider>
    </AuthProvider>
  )
}

export default App
