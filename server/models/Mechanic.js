const mongoose = require('mongoose');

const MechanicSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    shopName: { type: String, required: true },
    specialization: { type: [String], enum: ['Car', 'Bike', 'Both'], default: ['Car'] },
    locationText: { type: String, default: '' }, // Human-readable location from the form
    services: { type: [String] },
    experience: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
    availability: { type: Boolean, default: true },
    rating: { type: Number, default: 0 },
    reviews: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        comment: { type: String },
        rating: { type: Number },
        date: { type: Date, default: Date.now }
    }],
    location: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number] }
    },
    paymentQR: { type: String, default: '' },    // base64 image of the payment QR code
    paymentUpiId: { type: String, default: '' }  // optional UPI ID text
}, { timestamps: true });

MechanicSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Mechanic', MechanicSchema);
