const express = require('express');
const router = express.Router();
const ServiceRequest = require('../models/ServiceRequest');

// Create a new service request
router.post('/request', async (req, res) => {
    try {
        const newRequest = new ServiceRequest(req.body);
        const savedRequest = await newRequest.save();
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

module.exports = router;
