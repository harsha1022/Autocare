const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const http = require('http');
const { Server } = require('socket.io');

const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io with CORS
const io = new Server(server, {
    cors: {
        origin: ['http://localhost:5173', 'http://localhost:5174'], // Vite common ports
        methods: ['GET', 'POST']
    }
});

// Socket connection logic
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    
    // Relay mechanic tracking updates directly to listening active users
    socket.on('mechanicLocationUpdate', (data) => {
        // data contains { requestId, lat, lng }
        // We emit it back uniquely so only the user watching this request gets it
        io.emit(`tracking_${data.requestId}`, data);
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

// Export io so we can emit events from routes
module.exports = { io };

// Middleware
app.use(cors());
app.use(express.json());

// Request Logger
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Basic Route
app.get('/', (req, res) => {
    res.send('CarAssist API is running');
});

// Routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/services', require('./routes/serviceRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/mechanics', require('./routes/mechanicRoutes'));


// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log('MongoDB connection error:', err));

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
