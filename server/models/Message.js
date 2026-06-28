const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    requestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ServiceRequest',
        required: true,
        index: true // Index for fast lookup by request
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    senderRole: {
        type: String,
        enum: ['user', 'mechanic'],
        required: true
    },
    text: {
        type: String,
        required: true,
        trim: true
    }
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
