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
        const { shopName, specialization, locationText, experience } = req.body;

        if (!shopName || !specialization) {
            return res.status(400).json({ message: 'Shop name and specialization are required' });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        if (user.role === 'admin') {
            return res.status(403).json({ message: 'Admins cannot register as partners' });
        }

        const existingMechanic = await Mechanic.findOne({ userId });
        if (existingMechanic) {
            return res.status(400).json({ message: 'You have already submitted a partner application' });
        }

        const newMechanic = new Mechanic({
            userId,
            shopName,
            locationText: locationText || '',
            specialization: Array.isArray(specialization) ? specialization : [specialization],
            experience: experience ? Number(experience) : 0,
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

// ─── UPLOAD / UPDATE PAYMENT QR CODE ─────────────────────────────────────────
router.put('/payment-qr', authMiddleware, async (req, res) => {
    try {
        const { paymentQR, paymentUpiId } = req.body;

        if (!paymentQR && paymentUpiId === undefined) {
            return res.status(400).json({ message: 'paymentQR or paymentUpiId is required' });
        }

        // Validate that it's a base64 image if provided
        if (paymentQR && !paymentQR.startsWith('data:image/')) {
            return res.status(400).json({ message: 'Invalid image format. Please upload a valid image.' });
        }

        // Rough size guard: base64 images shouldn't exceed ~2MB
        if (paymentQR && paymentQR.length > 2 * 1024 * 1024 * 1.37) {
            return res.status(400).json({ message: 'QR image is too large. Please upload an image under 2MB.' });
        }

        const mechanic = await Mechanic.findOne({ userId: req.user.id });
        if (!mechanic) return res.status(404).json({ message: 'Mechanic profile not found' });

        if (paymentQR !== undefined) mechanic.paymentQR = paymentQR;
        if (paymentUpiId !== undefined) mechanic.paymentUpiId = paymentUpiId.trim();

        await mechanic.save();

        res.status(200).json({
            message: 'Payment QR updated successfully',
            paymentUpiId: mechanic.paymentUpiId,
            hasQR: !!mechanic.paymentQR
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── GET MECHANIC PAYMENT QR BY MECHANIC ID (for users to scan) ───────────────
router.get('/:mechanicId/payment-qr', authMiddleware, async (req, res) => {
    try {
        const mechanic = await Mechanic.findById(req.params.mechanicId).select('paymentQR paymentUpiId shopName');
        if (!mechanic) return res.status(404).json({ message: 'Mechanic not found' });

        res.status(200).json({
            shopName: mechanic.shopName,
            paymentUpiId: mechanic.paymentUpiId,
            paymentQR: mechanic.paymentQR || null
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

