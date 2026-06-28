const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const http = require('http');
const { Server } = require('socket.io');
const Message = require('./models/Message');
const { setIO } = require('./socket');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, Postman, curl)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS policy: origin ${origin} not allowed`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── MIDDLEWARE ────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '5mb' }));

// Request Logger
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// ─── CREATE HTTP SERVER ────────────────────────────────────────────────────────
const server = http.createServer(app);

// ─── INITIALIZE SOCKET.IO ─────────────────────────────────────────────────────
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true,
    }
});

// Store the io instance in the shared module (breaks circular dependency)
setIO(io);

// ─── SOCKET CONNECTION LOGIC ──────────────────────────────────────────────────
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Relay mechanic location updates to users tracking a specific request
    socket.on('mechanicLocationUpdate', (data) => {
        // data: { requestId, lat, lng, mechanicId }
        io.emit(`tracking_${data.requestId}`, data);
    });

    // Chat: join a request room
    socket.on('joinRoom', (requestId) => {
        socket.join(`request_${requestId}`);
        console.log(`Socket ${socket.id} joined room: request_${requestId}`);
    });

    // Chat: handle a message
    socket.on('chatMessage', async (data) => {
        try {
            const { requestId, senderId, senderRole, text } = data;

            // Persist to database
            const message = new Message({
                requestId,
                senderId,
                senderRole,
                text
            });
            await message.save();

            // Broadcast to everyone in the room (including sender for consistency)
            io.to(`request_${requestId}`).emit('newMessage', message);
        } catch (error) {
            console.error('Socket chatMessage error:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

// ─── ROUTES ───────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.send('CarAssist API is running ✅');
});

app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/services', require('./routes/serviceRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/mechanics', require('./routes/mechanicRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));

// ─── GLOBAL ERROR HANDLER ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// ─── MONGODB ──────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => {
        console.error('❌ MongoDB connection error:', err.message);
        process.exit(1); // Fail fast if DB is unavailable
    });

// ─── START SERVER ─────────────────────────────────────────────────────────────
server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
