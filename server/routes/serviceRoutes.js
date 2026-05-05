const express = require('express');
const router = express.Router();
const ServiceRequest = require('../models/ServiceRequest');
const authMiddleware = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { serviceRequestSchema } = require('../validators/serviceValidator');

// ─── CREATE SERVICE REQUEST ───────────────────────────────────────────────────
router.post('/request', authMiddleware, validate(serviceRequestSchema), async (req, res) => {
    try {
        const reqBody = { ...req.body };
        if (reqBody.location && !reqBody.location.coordinates) {
            reqBody.location.type = 'Point';
            reqBody.location.coordinates = [0, 0];
        }

        const newRequest = new ServiceRequest({
            ...reqBody,
            userId: req.user.id
        });
        const savedRequest = await newRequest.save();

        const populatedRequest = await ServiceRequest.findById(savedRequest._id).populate('userId');

        const { io } = require('../index');
        if (io) {
            io.emit('newServiceRequest', populatedRequest);
        }

        res.status(201).json(savedRequest);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── GET USER'S OWN REQUESTS ──────────────────────────────────────────────────
router.get('/user/:userId', authMiddleware, async (req, res) => {
    try {
        const requests = await ServiceRequest.find({ userId: req.params.userId })
            .populate('mechanicId', 'shopName rating')
            .sort({ createdAt: -1 });
        res.status(200).json(requests);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── GET MECHANIC'S ASSIGNED REQUESTS ─────────────────────────────────────────
router.get('/mechanic/:mechanicId', authMiddleware, async (req, res) => {
    try {
        const requests = await ServiceRequest.find({ mechanicId: req.params.mechanicId })
            .populate('userId', 'name email phone')
            .sort({ createdAt: -1 });
        res.status(200).json(requests);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── GET ALL PENDING REQUESTS (for mechanics) ─────────────────────────────────
router.get('/pending', authMiddleware, async (req, res) => {
    try {
        const requests = await ServiceRequest.find({ status: 'Pending' })
            .populate('userId', 'name email phone')
            .sort({ createdAt: -1 });
        res.status(200).json(requests);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── ACCEPT A SERVICE REQUEST ─────────────────────────────────────────────────
router.put('/:id/accept', authMiddleware, async (req, res) => {
    try {
        const mechanic = await require('../models/Mechanic').findOne({ userId: req.user.id });
        if (!mechanic) {
            return res.status(403).json({ message: 'Only registered mechanics can accept requests' });
        }

        const updatedRequest = await ServiceRequest.findOneAndUpdate(
            { _id: req.params.id, status: 'Pending' },
            { $set: { status: 'Accepted', mechanicId: mechanic._id } },
            { new: true }
        );

        if (!updatedRequest) {
            const checkRequest = await ServiceRequest.findById(req.params.id);
            if (!checkRequest) return res.status(404).json({ message: 'Request not found' });
            return res.status(400).json({ message: 'Request already accepted by another mechanic' });
        }

        const { io } = require('../index');
        if (io) {
            io.emit('requestAccepted', req.params.id);
            io.emit('requestStatusUpdate', { requestId: req.params.id, status: 'Accepted', mechanicId: mechanic._id });
        }

        res.status(200).json(updatedRequest);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── REJECT / DECLINE A SERVICE REQUEST ──────────────────────────────────────
router.put('/:id/reject', authMiddleware, async (req, res) => {
    try {
        const mechanic = await require('../models/Mechanic').findOne({ userId: req.user.id });
        if (!mechanic) {
            return res.status(403).json({ message: 'Only registered mechanics can reject requests' });
        }

        const request = await ServiceRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Request not found' });

        if (request.status !== 'Pending' && request.status !== 'Accepted') {
            return res.status(400).json({ message: 'Request cannot be rejected in its current state' });
        }

        // If this mechanic was assigned, free it back to Pending; else just leave it
        if (request.mechanicId && request.mechanicId.toString() === mechanic._id.toString()) {
            request.status = 'Pending';
            request.mechanicId = null;
        } else if (request.status === 'Pending') {
            // Mechanic declining before accepting — mark cancelled
            request.status = 'Cancelled';
        }

        await request.save();

        const { io } = require('../index');
        if (io) {
            io.emit('requestStatusUpdate', { requestId: req.params.id, status: request.status });
        }

        res.status(200).json({ message: 'Request rejected', request });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── COMPLETE A SERVICE REQUEST ───────────────────────────────────────────────
router.put('/:id/complete', authMiddleware, async (req, res) => {
    try {
        const mechanic = await require('../models/Mechanic').findOne({ userId: req.user.id });
        if (!mechanic) {
            return res.status(403).json({ message: 'Unauthorized. Only mechanics can complete requests.' });
        }

        const request = await ServiceRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Request not found' });

        if (request.mechanicId.toString() !== mechanic._id.toString()) {
            return res.status(403).json({ message: 'You are not assigned to this request' });
        }

        if (request.status !== 'Accepted' && request.status !== 'InProgress') {
            return res.status(400).json({ message: 'Request cannot be marked as completed from its current state' });
        }

        request.status = 'Completed';
        request.completedAt = Date.now();
        const updatedRequest = await request.save();

        const { io } = require('../index');
        if (io) {
            io.emit('serviceCompleted', req.params.id);
            io.emit('requestStatusUpdate', { requestId: req.params.id, status: 'Completed' });
        }

        res.status(200).json(updatedRequest);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── UPDATE PAYMENT STATUS ────────────────────────────────────────────────────
router.put('/:id/payment', authMiddleware, async (req, res) => {
    try {
        const { paymentStatus, paymentMethod } = req.body;
        if (!paymentStatus) {
            return res.status(400).json({ message: 'paymentStatus is required' });
        }

        const request = await ServiceRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Request not found' });

        // Only the user who made the request or the assigned mechanic can update payment
        const mechanic = await require('../models/Mechanic').findOne({ userId: req.user.id });
        const isOwner = request.userId.toString() === req.user.id;
        const isAssignedMechanic = mechanic && request.mechanicId && request.mechanicId.toString() === mechanic._id.toString();

        if (!isOwner && !isAssignedMechanic && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to update payment for this request' });
        }

        request.paymentStatus = paymentStatus;
        if (paymentMethod) request.paymentMethod = paymentMethod;
        const updated = await request.save();

        res.status(200).json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
