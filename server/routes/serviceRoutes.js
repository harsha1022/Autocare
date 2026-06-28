const express = require('express');
const router = express.Router();
const ServiceRequest = require('../models/ServiceRequest');
const authMiddleware = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { serviceRequestSchema } = require('../validators/serviceValidator');
const { getIO } = require('../socket'); // ✅ Fixed: use shared socket module, no circular dep

// ─── CREATE SERVICE REQUEST ───────────────────────────────────────────────────
router.post('/request', authMiddleware, validate(serviceRequestSchema), async (req, res) => {
    try {
        if (req.user.role !== 'user') {
            return res.status(403).json({ message: 'Only registered users can create service requests' });
        }

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

        const io = getIO();
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
        if (req.user.role !== 'mechanic') {
            return res.status(403).json({ message: 'Only mechanics can view pending requests' });
        }

        const mechanic = await require('../models/Mechanic').findOne({ userId: req.user.id });
        if (!mechanic) {
            return res.status(403).json({ message: 'Only registered mechanics can view pending requests' });
        }

        const requests = await ServiceRequest.find({ 
            status: 'Pending',
            declinedBy: { $ne: mechanic._id } 
        })
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
        if (req.user.role !== 'mechanic') {
            return res.status(403).json({ message: 'Only registered mechanics can accept requests' });
        }

        const mechanic = await require('../models/Mechanic').findOne({ userId: req.user.id });
        if (!mechanic) {
            return res.status(403).json({ message: 'Only registered mechanics can accept requests' });
        }

        const updatedRequest = await ServiceRequest.findOneAndUpdate(
            { _id: req.params.id, status: 'Pending' },
            { $set: { status: 'Accepted', mechanicId: mechanic._id } },
            { new: true }
        )
        .populate('userId', 'name email phone')
        .populate('mechanicId', 'shopName rating');

        if (!updatedRequest) {
            const checkRequest = await ServiceRequest.findById(req.params.id);
            if (!checkRequest) return res.status(404).json({ message: 'Request not found' });
            return res.status(400).json({ message: 'Request already accepted by another mechanic' });
        }

        const io = getIO();
        if (io) {
            io.emit('requestAccepted', req.params.id);
            io.emit('requestStatusUpdate', { 
                requestId: req.params.id, 
                status: 'Accepted', 
                mechanicId: mechanic._id,
                request: updatedRequest 
            });
        }

        res.status(200).json(updatedRequest);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── REJECT / DECLINE A SERVICE REQUEST ──────────────────────────────────────
router.put('/:id/reject', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'mechanic') {
            return res.status(403).json({ message: 'Only registered mechanics can reject requests' });
        }

        const mechanic = await require('../models/Mechanic').findOne({ userId: req.user.id });
        if (!mechanic) {
            return res.status(403).json({ message: 'Only registered mechanics can reject requests' });
        }

        const request = await ServiceRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Request not found' });

        if (request.status !== 'Pending' && request.status !== 'Accepted') {
            return res.status(400).json({ message: 'Request cannot be rejected in its current state' });
        }

        // If this mechanic was assigned, free it back to Pending
        if (request.mechanicId && request.mechanicId.toString() === mechanic._id.toString()) {
            request.status = 'Pending';
            request.mechanicId = null;
        } else if (request.status === 'Pending') {
            // Mechanic declining before accepting — hide it for this mechanic
            if (!request.declinedBy.includes(mechanic._id)) {
                request.declinedBy.push(mechanic._id);
            }
        }

        await request.save();

        const io = getIO();
        if (io && request.mechanicId === null) {
            // Only emit status update if the global status actually changed (e.g. un-assigning)
            io.emit('requestStatusUpdate', { requestId: req.params.id, status: request.status });
        }

        res.status(200).json({ message: 'Request rejected', request });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── UPDATE SERVICE REQUEST STATUS (Granular) ─────────────────────────────────
router.put('/:id/status', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'mechanic') {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const mechanic = await require('../models/Mechanic').findOne({ userId: req.user.id });
        if (!mechanic) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const request = await ServiceRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Request not found' });

        if (request.mechanicId.toString() !== mechanic._id.toString()) {
            return res.status(403).json({ message: 'Not assigned to this request' });
        }

        const { status } = req.body;
        const validStatuses = ['Accepted', 'OnTheWay', 'Arrived', 'InProgress', 'Completed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        request.status = status;
        if (status === 'Completed') {
            request.completedAt = Date.now();
        }
        
        const updatedRequest = await request.save();

        const io = getIO();
        if (io) {
            if (status === 'Completed') io.emit('serviceCompleted', req.params.id);
            io.emit('requestStatusUpdate', { requestId: req.params.id, status });
        }

        res.status(200).json(updatedRequest);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── COMPLETE A SERVICE REQUEST ───────────────────────────────────────────────
router.put('/:id/complete', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'mechanic') {
            return res.status(403).json({ message: 'Unauthorized. Only mechanics can complete requests.' });
        }

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

        const io = getIO();
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


// ─── SUBMIT A REVIEW ──────────────────────────────────────────────────────────
router.post('/:id/review', authMiddleware, async (req, res) => {
    try {
        const { rating, feedback } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }

        const request = await ServiceRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Request not found' });

        // Only the user who made the request can review
        if (request.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to review this request' });
        }

        if (request.status !== 'Completed') {
            return res.status(400).json({ message: 'You can only review completed services' });
        }

        if (request.review && request.review.rating) {
            return res.status(400).json({ message: 'You have already reviewed this service' });
        }

        request.review = {
            rating: Number(rating),
            feedback: feedback?.trim() || '',
            createdAt: new Date()
        };

        const updated = await request.save();

        // --- UPDATE MECHANIC RATING ---
        if (request.mechanicId) {
            const Mechanic = require('../models/Mechanic');
            const completedRequests = await ServiceRequest.find({ 
                mechanicId: request.mechanicId,
                'review.rating': { $exists: true }
            });
            
            if (completedRequests.length > 0) {
                const totalRating = completedRequests.reduce((sum, r) => sum + r.review.rating, 0);
                const avgRating = totalRating / completedRequests.length;
                await Mechanic.findByIdAndUpdate(request.mechanicId, { rating: avgRating });
            }
        }
        // ------------------------------

        res.status(200).json({ message: 'Review submitted successfully', review: updated.review });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
