const express = require('express');
const router = express.Router();
const Mechanic = require('../models/Mechanic');
const User = require('../models/User');

// Register as a Mechanic (Partner)
router.post('/register', async (req, res) => {
    console.log('Registering mechanic:', req.body);
    try {
        const { userId, shopName, specialization, location } = req.body;

        if (!require('mongoose').Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid User ID' });
        }

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Check if already a mechanic
        const existingMechanic = await Mechanic.findOne({ userId });
        if (existingMechanic) return res.status(400).json({ message: 'You have already applied as a partner' });

        // Update user role to mechanic if they are a regular user
        if (user.role === 'user') {
            user.role = 'mechanic';
            await user.save();
        }

        const newMechanic = new Mechanic({
            userId,
            shopName,
            specialization: Array.isArray(specialization) ? specialization : [specialization],
            location: {
                type: 'Point',
                coordinates: location || [0, 0] // Default if not provided
            }
        });

        const savedMechanic = await newMechanic.save();
        res.status(201).json({ message: 'Application submitted successfully', mechanic: savedMechanic });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all verified mechanics
router.get('/all', async (req, res) => {
    try {
        const mechanics = await Mechanic.find({ isVerified: true }).populate('userId');
        res.status(200).json(mechanics);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get mechanic status by userId
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
