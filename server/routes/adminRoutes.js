const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Mechanic = require('../models/Mechanic');
const ServiceRequest = require('../models/ServiceRequest');

// Get overview statistics
router.get('/stats', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ role: 'user' });
        const totalMechanics = await Mechanic.countDocuments();
        const totalRequests = await ServiceRequest.countDocuments();
        const pendingVerification = await Mechanic.countDocuments({ isVerified: false });

        res.status(200).json({
            totalUsers,
            totalMechanics,
            totalRequests,
            pendingVerification
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all users
router.get('/users', async (req, res) => {
    try {
        const users = await User.find({ role: 'user' }).sort({ createdAt: -1 });
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all mechanics
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

        // Promote the user role to 'mechanic' on approval
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

        // Revert user role back to 'user' on rejection
        if (mechanic.userId) {
            await User.findByIdAndUpdate(mechanic.userId._id, { role: 'user' });
        }

        res.status(200).json({ message: 'Partner application rejected', mechanic });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Legacy toggle (kept for compatibility — prefer /approve and /reject above)
router.put('/mechanics/:id/verify', async (req, res) => {
    try {
        const mechanic = await Mechanic.findById(req.params.id).populate('userId');
        if (!mechanic) return res.status(404).json({ message: 'Mechanic not found' });

        mechanic.isVerified = !mechanic.isVerified;
        await mechanic.save();

        // Sync user role
        if (mechanic.userId) {
            await User.findByIdAndUpdate(mechanic.userId._id, {
                role: mechanic.isVerified ? 'mechanic' : 'user'
            });
        }

        res.status(200).json({ message: `Mechanic ${mechanic.isVerified ? 'approved' : 'rejected'} successfully`, mechanic });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a user
router.delete('/users/:id', async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a mechanic
router.delete('/mechanics/:id', async (req, res) => {
    try {
        const mechanic = await Mechanic.findById(req.params.id);
        if (mechanic) {
            // Also update the user role if needed, or delete the user? 
            // For now, let's just delete the mechanic profile
            await Mechanic.findByIdAndDelete(req.params.id);
        }
        res.status(200).json({ message: 'Mechanic profile deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
