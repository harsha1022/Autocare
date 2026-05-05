const express = require('express');
const router = express.Router();
const Mechanic = require('../models/Mechanic');
const ServiceRequest = require('../models/ServiceRequest');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

// ─── REGISTER AS MECHANIC/PARTNER (requires login) ───────────────────────────
router.post('/register', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { shopName, specialization, locationText } = req.body;

        if (!shopName || !specialization) {
            return res.status(400).json({ message: 'Shop name and specialization are required' });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const existingMechanic = await Mechanic.findOne({ userId });
        if (existingMechanic) {
            return res.status(400).json({ message: 'You have already submitted a partner application' });
        }

        const newMechanic = new Mechanic({
            userId,
            shopName,
            locationText: locationText || '',
            specialization: Array.isArray(specialization) ? specialization : [specialization],
            isVerified: false,
            location: { type: 'Point', coordinates: [0, 0] }
        });

        const savedMechanic = await newMechanic.save();
        res.status(201).json({
            message: 'Application submitted! Awaiting admin approval.',
            mechanic: savedMechanic
        });
    } catch (err) {
        console.error('Mechanic register error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ─── GET OWN MECHANIC PROFILE ─────────────────────────────────────────────────
router.get('/profile/me', authMiddleware, async (req, res) => {
    try {
        const mechanic = await Mechanic.findOne({ userId: req.user.id }).populate('userId', 'name email phone');
        if (!mechanic) return res.status(404).json({ message: 'Mechanic profile not found' });
        res.status(200).json(mechanic);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── TOGGLE AVAILABILITY (online/offline) ─────────────────────────────────────
router.put('/availability', authMiddleware, async (req, res) => {
    try {
        const mechanic = await Mechanic.findOne({ userId: req.user.id });
        if (!mechanic) return res.status(404).json({ message: 'Mechanic profile not found' });

        mechanic.availability = !mechanic.availability;
        await mechanic.save();

        res.status(200).json({ 
            message: `Status set to ${mechanic.availability ? 'Online' : 'Offline'}`,
            availability: mechanic.availability 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── GET EARNINGS SUMMARY ─────────────────────────────────────────────────────
router.get('/earnings', authMiddleware, async (req, res) => {
    try {
        const mechanic = await Mechanic.findOne({ userId: req.user.id });
        if (!mechanic) return res.status(404).json({ message: 'Mechanic profile not found' });

        const completed = await ServiceRequest.find({ 
            mechanicId: mechanic._id, 
            status: 'Completed' 
        }).sort({ completedAt: -1 });

        // Earnings this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const thisMonthJobs = completed.filter(r => new Date(r.completedAt) >= startOfMonth);

        res.status(200).json({
            totalCompleted: completed.length,
            thisMonthCompleted: thisMonthJobs.length,
            recentJobs: completed.slice(0, 10)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── GET ALL VERIFIED MECHANICS (public) ──────────────────────────────────────
router.get('/all', async (req, res) => {
    try {
        const mechanics = await Mechanic.find({ isVerified: true }).populate('userId', 'name email phone');
        res.status(200).json(mechanics);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── GET APPLICATION STATUS BY USER ID (used by Partner.jsx) ─────────────────
router.get('/status/:userId', async (req, res) => {
    try {
        const mechanic = await Mechanic.findOne({ userId: req.params.userId });
        if (!mechanic) return res.status(404).json({ message: 'No application found' });
        res.status(200).json(mechanic);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
