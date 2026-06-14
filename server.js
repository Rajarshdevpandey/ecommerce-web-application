const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB connection cloud string simulator
const DB_URI = "mongodb+srv://shopadmin:shopadmin123@cluster0.mongodb.net/ecommerce?retryWrites=true&w=majority";
mongoose.connect(DB_URI)
  .then(() => console.log("E-Commerce DB Connected Successfully"))
  .catch(err => console.log("Database connection error:", err));

// Models definition
const User = mongoose.model('User', new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'user' } // Admin or user control role
}));

const Product = mongoose.model('Product', new mongoose.Schema({
    title: String,
    price: Number,
    category: String,
    stock: Number
}));

// AUTH APIs
app.post('/api/shop/signup', async (req, res) => {
    try {
        const hash = await bcrypt.hash(req.body.password, 10);
        const newUser = new User({ username: req.body.username, password: hash });
        await newUser.save();
        res.status(201).json({ message: "Account created" });
    } catch (err) { res.status(400).json({ error: "Username already exists" }); }
});

app.post('/api/shop/login', async (req, res) => {
    const user = await User.findOne({ username: req.body.username });
    if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
        return res.status(401).json({ error: "Invalid Shop Credentials" });
    }
    const token = jwt.sign({ userId: user._id, role: user.role }, "SHOP_SECRET", { expiresIn: '2h' });
    res.json({ token, username: user.username, role: user.role });
});

// PRODUCT CATALOG MANAGEMENT APIs
app.get('/api/products', async (req, res) => {
    const products = await Product.find({});
    res.json(products);
});

app.post('/api/products', async (req, res) => {
    // Admin operation to inject new inventory products
    const newProduct = new Product(req.body);
    await newProduct.save();
    res.status(201).json(newProduct);
});

// ORDER PLACEMENT SIMULATION API
app.post('/api/orders/checkout', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        jwt.verify(token, "SHOP_SECRET");
        res.status(200).json({ status: "Success", message: "Order processed and stored in database logs." });
    } catch(err) {
        res.status(401).json({ error: "Session expired, re-login required" });
    }
});

app.listen(5000, () => console.log('E-Commerce Server running on Port 5000'));
