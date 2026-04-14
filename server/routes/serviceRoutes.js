const express = require('express');
const router = express.Router();
const ServiceRequest = require('../models/ServiceRequest');
const authMiddleware = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { serviceRequestSchema } = require('../validators/serviceValidator');

// Create a new service request
router.post('/request', authMiddleware, validate(serviceRequestSchema), async (req, res) => {
    try {
        const reqBody = { ...req.body };
        // Ensure location is valid GeoJSON for the index
        if (reqBody.location && !reqBody.location.coordinates) {
            reqBody.location.type = 'Point';
            reqBody.location.coordinates = [0, 0]; // Default coordinates to satisfy 2dsphere index
        }

        const newRequest = new ServiceRequest({
            ...reqBody,
            userId: req.user.id // Attach the user ID from the JWT
        });
        const savedRequest = await newRequest.save();

        // Populate the user details before emitting so the frontend card looks correct
        const populatedRequest = await ServiceRequest.findById(savedRequest._id).populate('userId');

        // Broadcast the new request to all connected mechanics
        const { io } = require('../index');
        if (io) {
            io.emit('newServiceRequest', populatedRequest);
        }

        res.status(201).json(savedRequest);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all requests for a user
router.get('/user/:userId', async (req, res) => {
    try {
        const requests = await ServiceRequest.find({ userId: req.params.userId }).populate('mechanicId');
        res.status(200).json(requests);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all requests for a mechanic
router.get('/mechanic/:mechanicId', async (req, res) => {
    try {
        const requests = await ServiceRequest.find({ mechanicId: req.params.mechanicId }).populate('userId');
        res.status(200).json(requests);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Get all pending requests
router.get('/pending', async (req, res) => {
    try {
        const requests = await ServiceRequest.find({ status: 'Pending' }).populate('userId');
        res.status(200).json(requests);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Accept a service request
router.put('/:id/accept', authMiddleware, async (req, res) => {
    try {
        // Find the mechanic by the logged-in user's ID
        const mechanic = await require('../models/Mechanic').findOne({ userId: req.user.id });
        if (!mechanic) {
            return res.status(403).json({ message: 'Only registered mechanics can accept requests' });
        }

        // Atomic update to prevent multiple mechanics from accepting the same request concurrently
        const updatedRequest = await ServiceRequest.findOneAndUpdate(
            { _id: req.params.id, status: 'Pending' }, // Query includes status: 'Pending' lock
            { 
                $set: { 
                    status: 'Accepted', 
                    mechanicId: mechanic._id 
                } 
            },
            { new: true } // Return the updated document
        );

        if (!updatedRequest) {
             // If null, either it doesn't exist, or it was ALREADY accepted by someone else
             const checkRequest = await ServiceRequest.findById(req.params.id);
             if (!checkRequest) return res.status(404).json({ message: 'Request not found' });
             return res.status(400).json({ message: 'Request has already been accepted by another mechanic or is no longer pending' });
        }
        
        // Broadcast that this request has been accepted so other mechanics' dashboards update
        const { io } = require('../index');
        if (io) {
            io.emit('requestAccepted', req.params.id);
        }
        
        res.status(200).json(updatedRequest);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Complete a service request
router.put('/:id/complete', authMiddleware, async (req, res) => {
    try {
        // Find the mechanic by the logged-in user's ID
        const mechanic = await require('../models/Mechanic').findOne({ userId: req.user.id });
        if (!mechanic) {
            return res.status(403).json({ message: 'Unauthorized. Only mechanics can complete requests.' });
        }

        const request = await ServiceRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Request not found' });
        
        // Ensure this mechanic owns the request
        if (request.mechanicId.toString() !== mechanic._id.toString()) {
            return res.status(403).json({ message: 'You are not assigned to this request' });
        }
        
        if (request.status !== 'Accepted' && request.status !== 'InProgress') {
            return res.status(400).json({ message: 'Request cannot be marked as completed from its current state' });
        }

        request.status = 'Completed';
        request.completedAt = Date.now();
        const updatedRequest = await request.save();

        res.status(200).json(updatedRequest);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
