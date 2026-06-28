const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validate = require('../middleware/validate');
const authMiddleware = require('../middleware/authMiddleware');
const { userRegistrationSchema, userLoginSchema } = require('../validators/userValidator');

// ─── REGISTER USER ────────────────────────────────────────────────────────────
router.post('/register', validate(userRegistrationSchema), async (req, res) => {
    try {
        const { name, email, password, phone, role } = req.body;

        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        user = new User({ name, email, password, phone, role });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        const savedUser = await user.save();

        const payload = { id: savedUser._id, role: savedUser.role };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            token,
            user: { id: savedUser._id, name: savedUser.name, email: savedUser.email, role: savedUser.role }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── LOGIN ────────────────────────────────────────────────────────────────────
router.post('/login', validate(userLoginSchema), async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const payload = { id: user._id, role: user.role };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(200).json({
            message: 'Login successful',
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── GET OWN PROFILE ──────────────────────────────────────────────────────────
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── UPDATE OWN PROFILE ───────────────────────────────────────────────────────
router.put('/me', authMiddleware, async (req, res) => {
    try {
        const { name, phone } = req.body;
        const updateData = {};
        if (name) updateData.name = name;
        if (phone) updateData.phone = phone;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) return res.status(404).json({ message: 'User not found' });

        res.status(200).json({ message: 'Profile updated successfully', user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
