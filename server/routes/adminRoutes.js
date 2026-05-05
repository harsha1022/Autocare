const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Mechanic = require('../models/Mechanic');
const ServiceRequest = require('../models/ServiceRequest');
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

// All admin routes require a valid JWT AND admin role
router.use(authMiddleware, requireRole('admin'));

// ─── STATS ────────────────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ role: 'user' });
        const totalMechanics = await Mechanic.countDocuments();
        const totalRequests = await ServiceRequest.countDocuments();
        const pendingVerification = await Mechanic.countDocuments({ isVerified: false });
        const completedRequests = await ServiceRequest.countDocuments({ status: 'Completed' });
        const activeRequests = await ServiceRequest.countDocuments({ status: { $in: ['Pending', 'Accepted', 'InProgress'] } });

        res.status(200).json({
            totalUsers,
            totalMechanics,
            totalRequests,
            pendingVerification,
            completedRequests,
            activeRequests
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── ANALYTICS ────────────────────────────────────────────────────────────────
router.get('/analytics', async (req, res) => {
    try {
        // Bookings per day (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const bookingsByDay = await ServiceRequest.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Service type breakdown
        const serviceBreakdown = await ServiceRequest.aggregate([
            { $group: { _id: '$serviceType', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        // Status breakdown
        const statusBreakdown = await ServiceRequest.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // Top mechanics by completed jobs
        const topMechanics = await ServiceRequest.aggregate([
            { $match: { status: 'Completed', mechanicId: { $ne: null } } },
            { $group: { _id: '$mechanicId', completedJobs: { $sum: 1 } } },
            { $sort: { completedJobs: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'mechanics',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'mechanic'
                }
            },
            { $unwind: '$mechanic' },
            {
                $lookup: {
                    from: 'users',
                    localField: 'mechanic.userId',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    completedJobs: 1,
                    shopName: '$mechanic.shopName',
                    rating: '$mechanic.rating',
                    ownerName: '$user.name'
                }
            }
        ]);

        res.status(200).json({ bookingsByDay, serviceBreakdown, statusBreakdown, topMechanics });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── ALL SERVICE REQUESTS ─────────────────────────────────────────────────────
router.get('/services', async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const filter = status ? { status } : {};
        const requests = await ServiceRequest.find(filter)
            .populate('userId', 'name email phone')
            .populate('mechanicId', 'shopName')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));
        const total = await ServiceRequest.countDocuments(filter);
        res.status(200).json({ requests, total, page: parseInt(page) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── USERS ────────────────────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
    try {
        const users = await User.find({ role: 'user' }).sort({ createdAt: -1 });
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/users/:id', async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── MECHANICS ────────────────────────────────────────────────────────────────
router.get('/mechanics', async (req, res) => {
    try {
        const mechanics = await Mechanic.find().populate('userId').sort({ _id: -1 });
        res.status(200).json(mechanics);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Approve a mechanic partner application
router.put('/mechanics/:id/approve', async (req, res) => {
    try {
        const mechanic = await Mechanic.findById(req.params.id).populate('userId');
        if (!mechanic) return res.status(404).json({ message: 'Application not found' });

        mechanic.isVerified = true;
        await mechanic.save();

        if (mechanic.userId) {
            await User.findByIdAndUpdate(mechanic.userId._id, { role: 'mechanic' });
        }

        res.status(200).json({ message: 'Partner application approved successfully', mechanic });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Reject a mechanic partner application
router.put('/mechanics/:id/reject', async (req, res) => {
    try {
        const mechanic = await Mechanic.findById(req.params.id).populate('userId');
        if (!mechanic) return res.status(404).json({ message: 'Application not found' });

        mechanic.isVerified = false;
        await mechanic.save();

        if (mechanic.userId) {
            await User.findByIdAndUpdate(mechanic.userId._id, { role: 'user' });
        }

        res.status(200).json({ message: 'Partner application rejected', mechanic });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a mechanic profile
router.delete('/mechanics/:id', async (req, res) => {
    try {
        const mechanic = await Mechanic.findById(req.params.id);
        if (mechanic) {
            await Mechanic.findByIdAndDelete(req.params.id);
        }
        res.status(200).json({ message: 'Mechanic profile deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
