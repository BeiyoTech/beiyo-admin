// server.js
// helo from development
const express = require('express');
const morgan = require('morgan')
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const { config } = require('dotenv');
const PORT = process.env.PORT || 5000;
const cron = require('node-cron');
  const cookieParser = require('cookie-parser');
const cluster = require('cluster');
const hostelRoutes = require('./routes/hostelRoutes');
const roomRoutes = require('./routes/roomRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const CleaningSchedule = require('./routes/CleaningShedule');
const newResident = require('./routes/newResident');
const payment = require('./routes/payment')
const login = require('./routes/login')
const Dashboard = require('./routes/DashBoard')
const Staff = require('./routes/Staff')
const Ticket = require('./routes/Tickets');
const Manager = require('./routes/Manager');
const requestForm = require('./routes/requestForm');
const otp = require('./routes/otp');
const { connectDB } = require('./db');
const AppVersion  = require('./routes/appVersion')
const Member = require('./routes/Member')
const razorPay = require('./routes/RazorPayPayment')
const notification = require('./routes/notification')
const faq = require('./routes/Faq');
const adminDashboard = require('./routes/adminDashBoard');

const app = express();

config();

const URL1 = process.env.ALLOW_URL_1
const URL2 = process.env.ALLOW_URL_2
const URL3 = process.env.ALLOW_URL_3
const URL4 =process.env.ALLOW_URL_4

const allowedOrigins = [URL1,URL2,URL3,URL4
  // 'http://localhost:5000'
];
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));




// // Middleware to check API key
app.use((req, res, next) => {
  // Log all headers for debugging
  const apiKey = req.headers['apikey']; // Extract API key from headers
  if (!apiKey || apiKey !== process.env.SERVER_API_KEY) {
    console.log('API Key is missing or invalid');
    return res.status(403).json({ message: 'Forbidden: Invalid API key' });
  }
  next(); // If API key is valid, proceed to the next middleware/route handler
});

// calling from production

// app.use((req, res, next) => {
//   // Log all headers for debugging
//   const apiKey = req.query['apikey']; // Extract API key from query parameters

//   if (!apiKey || apiKey !== process.env.SERVER_API_KEY) {
//     console.log('API Key is missing or invalid');
//     return res.status(403).json({ message: 'Forbidden: Invalid API key' });
//   }

//   next(); // If API key is valid, proceed to the next middleware/route handler
// });


// Middleware
// app.use(bodyParser.json());
app.use(bodyParser.json({ limit: '50mb' }));

// Increase the limit for URL-encoded requests
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));


connectDB();
// updateRoomStatuses();
app.use(cookieParser())

// Routes
app.get("/", (req,res)=>{
  res.json("Welcome to the Beiyo admin backend");
});



app.use('/api/hostels', hostelRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/cleaningSchedule', CleaningSchedule);
// app.use('/api/pay',payment)
app.use('/api/newResident',newResident)
app.use('/api/login',login)
app.use('/api/dashboard',Dashboard)
app.use('/api/staff', Staff );
app.use('/api/member', Member );
app.use('/api/ticket',Ticket);
app.use('/api/appVersion',AppVersion);
app.use('/api/manager',Manager);
app.use('/api/requestForm',requestForm);
app.use('/api/inventory',inventoryRoutes);
app.use('/api/Otp',otp)
app.use('/api/pay/razor',razorPay)
app.use('/api/notification',notification)
app.use('/api/faq',faq)
app.use('/api/adminDashboard',adminDashboard)


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});





