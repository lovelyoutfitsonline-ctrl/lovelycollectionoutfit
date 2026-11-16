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
  
  /*
  // Seed initial products if empty
  const Product = require('./models/Product');
  const count = await Product.countDocuments();
  if (count === 0) {
    const initialProducts = [
      { name: 'Premium Linen Shirt', price: 999, originalPrice: 1999, image: 'https://images.unsplash.com/photo-1594932224010-74f43a163102?auto=format&fit=crop&q=80&w=500', category: 'Men', description: 'Experience the ultimate comfort with our premium linen shirt.' },
      { name: 'Classic Fit Trousers', price: 1299, originalPrice: 2499, image: 'https://images.unsplash.com/photo-1624371414361-e6e0efc8586b?auto=format&fit=crop&q=80&w=500', category: 'Men', description: 'Tailored to perfection, these classic fit trousers.' },
      { name: 'Summer Cotton Polo', price: 799, originalPrice: 1599, image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&q=80&w=500', category: 'Men', description: 'Stay cool and stylish with our breathable summer cotton polo.' },
      { name: 'Casual Denim Jacket', price: 1999, originalPrice: 3999, image: 'https://images.unsplash.com/photo-1576871333021-d5d3aa33d432?auto=format&fit=crop&q=80&w=500', category: 'Men', description: 'A timeless piece that adds an edge to any outfit.' },
      { name: 'Floral Summer Dress', price: 1499, originalPrice: 2999, image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&q=80&w=500', category: 'Women', description: 'Embrace the season with this beautiful floral summer dress.' },
      { name: 'Silk Blouse', price: 1799, originalPrice: 3499, image: 'https://images.unsplash.com/photo-1548504769-900b70012705?auto=format&fit=crop&q=80&w=500', category: 'Women', description: 'Luxurious silk blouse that feels soft against the skin.' },
    ];
    await Product.insertMany(initialProducts);
    console.log("Database Seeded with initial products");
  }

  // Seed initial categories if empty
  const Category = require('./models/Category');
  const catCount = await Category.countDocuments();
  if (catCount === 0) {
    const initialCategories = [
      { name: 'Men', image: 'https://images.unsplash.com/photo-1594932224010-74f43a163102?auto=format&fit=crop&q=80&w=150' },
      { name: 'Women', image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&q=80&w=150' },
      { name: 'Kids', image: 'https://images.unsplash.com/photo-1519238385202-ce0f64c185bc?auto=format&fit=crop&q=80&w=150' },
      { name: 'Accessories', image: 'https://images.unsplash.com/photo-1576053139778-7e32f2ae3cfd?auto=format&fit=crop&q=80&w=150' }
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
        image: "../../data's/offers/Screenshot 2026-05-14 113020.png",
        bgColor: "bg-gradient-to-r from-gray-900 to-gray-700"
      },
      { 
        title: "4 Shirt 999 only", 
        subtitle: "No exchange size, Add Any rs -300 product", 
        image: "../../data's/offers/Screenshot 2026-05-14 113035.png",
        bgColor: "bg-gradient-to-r from-blue-900 to-blue-700"
      },
      { 
        title: "Any combo deal", 
        subtitle: "shirt & phant, Tshirt & shorts or track", 
        image: "../../data's/offers/Screenshot 2026-05-14 113052.png",
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
      { title: 'Order Shipped!', message: 'Your order #ORD-78234 has been shipped. Tracking ID: LH123456789IN', type: 'order' },
      { title: 'Summer Sale is LIVE!', message: 'Get up to 50% OFF on all premium collections. Shop now before stocks end!', type: 'offer' },
      { title: 'Welcome to Lovely Collections', message: 'Thank you for joining our premium fashion community.', type: 'system' }
    ];
    await Notification.insertMany(initialNotifs);
    console.log("Database Seeded with initial notifications");
  }
  */

  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})
.catch(err => console.log(err));
