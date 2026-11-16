import React, { createContext, useState, useEffect } from 'react';
import { calculateCartTotals } from '../utils/cartUtils';
import axios from 'axios';
import { BACKEND_URL, API_BASE_URL } from '../config';

export const ShopContext = createContext();

const API_URL = `${API_BASE_URL}/products`;

export const ShopProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fixLocalhostUrl = (url) => {
    if (!url) return url;
    return url.replace(/http:\/\/localhost:5000|http:\/\/127\.0\.0\.1:5000/g, BACKEND_URL);
  };

  // Fetch categories from MongoDB
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/categories`);
        const fixedCategories = response.data.map(cat => ({
          ...cat,
          image: fixLocalhostUrl(cat.image)
        }));
        setCategories(fixedCategories);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(API_URL);
      if (response.data.length > 0) {
        const fixedProducts = response.data.map(prod => ({
          ...prod,
          image: fixLocalhostUrl(prod.image)
        }));
        setProducts(fixedProducts);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch products from MongoDB
  useEffect(() => {
    fetchProducts();
  }, []);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/notifications`);
        setNotifications(response.data);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };
    fetchNotifications();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/orders`);
      setOrders(response.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  // Fetch orders from MongoDB
  useEffect(() => {
    fetchOrders();
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markNotificationsAsRead = async () => {
    try {
      await axios.put(`${API_BASE_URL}/notifications/read-all`);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };


  const addProduct = async (newProduct) => {
    try {
      const response = await axios.post(API_URL, newProduct);
      const fixedProduct = { ...response.data, image: fixLocalhostUrl(response.data.image) };
      setProducts((prev) => [...prev, fixedProduct]);
    } catch (error) {
      console.error("Error adding product:", error);
    }
  };

  const addToCart = (product) => {
    setCart((prevCart) => {
      const sizeToMatch = product.selectedSize || 'M';
      const existingItem = prevCart.find((item) => 
        (item.id === product.id || item._id === product._id) && (item.selectedSize === sizeToMatch)
      );
      if (existingItem) {
        return prevCart.map((item) =>
          ((item.id === product.id || item._id === product._id) && (item.selectedSize === sizeToMatch)) 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prevCart, { ...product, selectedSize: sizeToMatch, quantity: 1 }];
    });
  };

  const removeFromCart = (productId, selectedSize) => {
    const sizeToMatch = selectedSize || 'M';
    setCart((prevCart) => prevCart.filter((item) => 
      !((item.id === productId || item._id === productId) && (item.selectedSize === sizeToMatch))
    ));
  };

  const updateQuantity = (productId, selectedSize, quantity) => {
    if (quantity < 1) return;
    const sizeToMatch = selectedSize || 'M';
    setCart((prevCart) =>
      prevCart.map((item) =>
        ((item.id === productId || item._id === productId) && (item.selectedSize === sizeToMatch)) 
          ? { ...item, quantity } 
          : item
      )
    );
  };

  const toggleWishlist = (product) => {
    setWishlist((prevWishlist) => {
      const isLiked = prevWishlist.some((item) => (
        (product._id && item._id && item._id === product._id) || 
        (product.id && item.id && item.id === product.id)
      ));
      if (isLiked) {
        return prevWishlist.filter((item) => (
          (product._id && item._id && item._id !== product._id) || 
          (product.id && item.id && item.id !== product.id)
        ));
      }
      return [...prevWishlist, product];
    });
  };

  const placeOrder = async (customerDetails) => {
    if (cart.length === 0) return;
    const { total: itemTotal, savings, comboDetails, shipping } = calculateCartTotals(cart);
    const subtotal = itemTotal + savings;
    const grandTotal = itemTotal + shipping;

    const items = cart.map(item => ({
      productId: item._id || item.id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      size: item.selectedSize || 'M',
      image: item.image
    }));

    const orderData = {
      orderId: `ORD-${Date.now()}`,
      customerName: customerDetails?.name || 'Guest Customer',
      customerPhone: customerDetails?.phone || '0000000000',
      customerAddress: `${customerDetails?.address || ''}, Landmark: ${customerDetails?.landmark || ''}, Pincode: ${customerDetails?.pincode || ''}`,
      items,
      subtotal,
      savings,
      shipping,
      total: grandTotal,
      status: 'Processing',
      deliveryEstimate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    };

    try {
      const response = await axios.post(`${API_BASE_URL}/orders`, orderData);
      const fixedOrder = {
        ...response.data,
        items: response.data.items.map(item => ({ ...item, image: fixLocalhostUrl(item.image) }))
      };
      setOrders((prevOrders) => [fixedOrder, ...prevOrders]);
      setCart([]);
      
      // Update local products list to reflect reduced stock!
      setProducts((prevProducts) => 
        prevProducts.map(p => {
          const matchingItems = items.filter(item => item.productId === (p._id || p.id));
          if (matchingItems.length > 0) {
            const updatedSizes = (p.sizes || []).map(sObj => {
              if (typeof sObj === 'string') return sObj;
              const matchingItem = matchingItems.find(item => item.size === sObj.size);
              if (matchingItem) {
                return { ...sObj, stock: Math.max(0, sObj.stock - matchingItem.quantity) };
              }
              return sObj;
            });
            return { ...p, sizes: updatedSizes };
          }
          return p;
        })
      );
    } catch (error) {
      console.error("Error placing order:", error);
    }
  };

  const confirmDelivery = async (orderId) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/orders/${orderId}/status`, {
        status: 'Delivered'
      });
      setOrders((prev) => prev.map(o => o._id === orderId || o.id === orderId ? response.data : o));
    } catch (error) {
      console.error("Error confirming delivery:", error);
    }
  };

  const submitFeedback = async (feedbackData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/feedback`, feedbackData);
      return response.data;
    } catch (error) {
      console.error("Error submitting feedback:", error);
    }
  };

  return (
    <ShopContext.Provider
      value={{
        products,
        categories,
        cart,
        wishlist,
        orders,
        searchQuery,
        setSearchQuery,
        addToCart,
        removeFromCart,
        updateQuantity,
        toggleWishlist,
        placeOrder,
        addProduct,
        confirmDelivery,
        submitFeedback,
        notifications,
        unreadCount,
        markNotificationsAsRead,
        loading,
        calculateCartTotals,
        refetchProducts: fetchProducts,
        refetchOrders: fetchOrders,
        clearCart: () => setCart([])
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};
