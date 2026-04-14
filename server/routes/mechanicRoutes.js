const express = require('express');
const router = express.Router();
const Mechanic = require('../models/Mechanic');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

// Register as a Mechanic/Partner (requires login)
router.post('/register', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id; // from JWT — safe, not from body
        const { shopName, specialization, locationText } = req.body;

        if (!shopName || !specialization) {
            return res.status(400).json({ message: 'Shop name and specialization are required' });
        }

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Check if already applied
        const existingMechanic = await Mechanic.findOne({ userId });
        if (existingMechanic) {
            return res.status(400).json({ message: 'You have already submitted a partner application' });
        }

        // ⚠️ Do NOT change user.role here — wait for admin approval
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

// Get all verified mechanics (public)
router.get('/all', async (req, res) => {
    try {
        const mechanics = await Mechanic.find({ isVerified: true }).populate('userId', 'name email phone');
        res.status(200).json(mechanics);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get mechanic application status by userId (public — used by Partner.jsx)
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
