const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const ServiceRequest = require('../models/ServiceRequest');
const auth = require('../middleware/authMiddleware');

// Get all messages for a specific request
router.get('/:requestId', auth, async (req, res) => {
    try {
        const { requestId } = req.params;
        const request = await ServiceRequest.findById(requestId).populate('mechanicId');

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        // Verify the user is either the customer who made the request, or the mechanic assigned to it
        // Or if the user is an admin, they can view it.
        const isCustomer = request.userId.toString() === req.user.id;
        const isMechanic = request.mechanicId && request.mechanicId.userId.toString() === req.user.id;
        const isAdmin = req.user.role === 'admin';

        if (!isCustomer && !isMechanic && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized to view this chat' });
        }

        const messages = await Message.find({ requestId }).sort({ createdAt: 1 });
        res.json(messages);

    } catch (error) {
        console.error('Fetch chat error:', error);
        res.status(500).json({ message: 'Server error fetching chat messages' });
    }
});

module.exports = router;
