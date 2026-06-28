const mongoose = require('mongoose');

const ServiceRequestSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mechanicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mechanic' },
    vehicleType: { type: String, enum: ['Car', 'Bike'], required: true },
    serviceType: { type: String, required: true }, // e.g., 'Battery Jump-start', 'Fuel Delivery'
    description: { type: String },
    location: {
        type: { type: String, enum: ['Point'] },
        coordinates: { type: [Number], index: '2dsphere' },
        address: { type: String }
    },
    status: {
        type: String,
        enum: ['Pending', 'Accepted', 'OnTheWay', 'Arrived', 'InProgress', 'Completed', 'Cancelled'],
        default: 'Pending'
    },
    paymentStatus: { type: String, enum: ['Pending', 'Paid'], default: 'Pending' },
    paymentMethod: { type: String, enum: ['Cash', 'Online'], default: 'Cash' },
    declinedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Mechanic' }],
    createdAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    review: {
        rating: { type: Number, min: 1, max: 5 },
        feedback: { type: String, trim: true },
        createdAt: { type: Date }
    }

});

module.exports = mongoose.model('ServiceRequest', ServiceRequestSchema);
