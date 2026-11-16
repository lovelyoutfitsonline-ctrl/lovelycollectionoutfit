// Razorpay Calculations & Keys Updated
const dns = require("node:dns");
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {}
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
// app.use("/api/auth", require("./routes/auth"));
app.use("/api/products", require("./routes/products"));
app.use("/api/categories", require("./routes/categories"));
app.use("/api/banners", require("./routes/banners"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/feedback", require("./routes/feedback"));
app.use("/api/upload", require("./routes/upload"));
app.use("/api/payments", require("./routes/payments"));
app.use("/api", require("./routes/payments"));

// Socket.io for Real-time Order Updates
io.on("connection", (socket) => {
  console.log("A user connected: " + socket.id);
  
  socket.on("join-room", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected: " + socket.id);
  });
});

// Make io accessible to routers
app.set("io", io);

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/lovelycollection", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log("MongoDB Connected");
  
  // Seed initial products if empty
  const Product = require('./models/Product');
  const count = await Product.countDocuments();
  if (count === 0) {
    const initialProducts = [
      {
        name: 'Premium Linen Shirt',
        price: 999,
        originalPrice: 1999,
        image: 'https://images.unsplash.com/photo-1594932224010-74f43a163102?auto=format&fit=crop&q=80&w=500',
        category: 'Men',
        description: 'Experience the ultimate comfort with our premium breathable linen shirt.',
        sizes: [{ size: 'S', stock: 15 }, { size: 'M', stock: 25 }, { size: 'L', stock: 20 }, { size: 'XL', stock: 10 }],
        trending: true
      },
      {
        name: 'Classic Fit Trousers',
        price: 1299,
        originalPrice: 2499,
        image: 'https://images.unsplash.com/photo-1624371414361-e6e0efc8586b?auto=format&fit=crop&q=80&w=500',
        category: 'Men',
        description: 'Tailored to perfection, these classic fit trousers provide all-day comfort and elegance.',
        sizes: [{ size: '30', stock: 12 }, { size: '32', stock: 20 }, { size: '34', stock: 18 }, { size: '36', stock: 8 }],
        trending: true
      },
      {
        name: 'Summer Cotton Polo',
        price: 799,
        originalPrice: 1599,
        image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&q=80&w=500',
        category: 'Men',
        description: 'Stay cool and stylish with our breathable 100% summer cotton polo tee.',
        sizes: [{ size: 'M', stock: 30 }, { size: 'L', stock: 25 }, { size: 'XL', stock: 15 }]
      },
      {
        name: 'Casual Denim Jacket',
        price: 1999,
        originalPrice: 3999,
        image: 'https://images.unsplash.com/photo-1576871333021-d5d3aa33d432?auto=format&fit=crop&q=80&w=500',
        category: 'Men',
        description: 'A timeless vintage denim piece that adds an effortless edge to any outfit.',
        sizes: [{ size: 'M', stock: 10 }, { size: 'L', stock: 15 }, { size: 'XL', stock: 8 }],
        trending: true
      },
      {
        name: 'Floral Summer Dress',
        price: 1499,
        originalPrice: 2999,
        image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&q=80&w=500',
        category: 'Women',
        description: 'Embrace the sunny season with this lightweight, beautiful floral summer dress.',
        sizes: [{ size: 'S', stock: 14 }, { size: 'M', stock: 22 }, { size: 'L', stock: 16 }],
        trending: true
      },
      {
        name: 'Silk Blouse',
        price: 1799,
        originalPrice: 3499,
        image: 'https://images.unsplash.com/photo-1548504769-900b70012705?auto=format&fit=crop&q=80&w=500',
        category: 'Women',
        description: 'Luxurious silk blouse tailored to feel soft and look stunning for any occasion.',
        sizes: [{ size: 'S', stock: 10 }, { size: 'M', stock: 15 }, { size: 'L', stock: 12 }]
      },
      {
        name: 'Kids Everyday Graphic Tee',
        price: 499,
        originalPrice: 999,
        image: 'https://images.unsplash.com/photo-1519238385202-ce0f64c185bc?auto=format&fit=crop&q=80&w=500',
        category: 'Kids',
        description: 'Ultra-soft cotton tee with vibrant playful graphics made for active kids.',
        sizes: [{ size: '2-3Y', stock: 20 }, { size: '4-5Y', stock: 25 }, { size: '6-7Y', stock: 18 }]
      },
      {
        name: 'Handcrafted Leather Belt',
        price: 699,
        originalPrice: 1299,
        image: 'https://images.unsplash.com/photo-1576053139778-7e32f2ae3cfd?auto=format&fit=crop&q=80&w=500',
        category: 'Accessories',
        description: 'Genuine full-grain leather belt with antique brass buckle finish.',
        sizes: [{ size: 'Free Size', stock: 50 }]
      }
    ];
    await Product.insertMany(initialProducts);
    console.log("Database Seeded with initial products");
  }

  // Seed initial categories if empty
  const Category = require('./models/Category');
  const catCount = await Category.countDocuments();
  if (catCount === 0) {
    const initialCategories = [
      { name: 'Men', image: 'https://images.unsplash.com/photo-1594932224010-74f43a163102?auto=format&fit=crop&q=80&w=300' },
      { name: 'Women', image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&q=80&w=300' },
      { name: 'Kids', image: 'https://images.unsplash.com/photo-1519238385202-ce0f64c185bc?auto=format&fit=crop&q=80&w=300' },
      { name: 'Accessories', image: 'https://images.unsplash.com/photo-1576053139778-7e32f2ae3cfd?auto=format&fit=crop&q=80&w=300' }
    ];
    await Category.insertMany(initialCategories);
    console.log("Database Seeded with initial categories");
  }

  // Seed initial banners if empty
  const Banner = require('./models/Banner');
  const bannerCount = await Banner.countDocuments();
  if (bannerCount === 0) {
    const initialBanners = [
      { 
        title: "3 pcs 500 only", 
        subtitle: "No Exchange, Any 200 Price product", 
        image: "/combo200_banner.png",
        bgColor: "bg-gradient-to-r from-gray-900 to-gray-700"
      },
      { 
        title: "4 Shirt 999 only", 
        subtitle: "No exchange size, Add Any rs -300 product", 
        image: "/combo300_banner.png",
        bgColor: "bg-gradient-to-r from-blue-900 to-blue-700"
      },
      { 
        title: "Summer Collection", 
        subtitle: "Trending styles for Men, Women & Kids", 
        image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1200",
        bgColor: "bg-gradient-to-r from-amber-900 to-amber-700"
      }
    ];
    await Banner.insertMany(initialBanners);
    console.log("Database Seeded with initial banners");
  }

  // Seed initial notifications if empty
  const Notification = require('./models/Notification');
  const notifCount = await Notification.countDocuments();
  if (notifCount === 0) {
    const initialNotifs = [
      { title: 'Welcome to Lovely Collections', message: 'Explore our latest arrivals and exclusive festive combos!', type: 'system', read: false },
      { title: 'Mega Combo Offer LIVE', message: '3 pcs for ₹500 & 4 shirts for ₹999 combo deals are now active.', type: 'offer', read: false }
    ];
    await Notification.insertMany(initialNotifs);
    console.log("Database Seeded with initial notifications");
  }

  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})
.catch(err => console.log(err));
