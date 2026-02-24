const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'mechanic', 'admin'], default: 'user' },
    phone: { type: String },
    location: {
        type: { type: String, enum: ['Point'] },
        coordinates: { type: [Number] }
    },
    createdAt: { type: Date, default: Date.now }
});

// Pre-save hook to remove empty location object
UserSchema.pre('save', function () {
    if (this.location && (!this.location.type || !this.location.coordinates || (this.location.coordinates && this.location.coordinates.length === 0))) {
        this.location = undefined;
    }
});

UserSchema.index({ location: '2dsphere' }, { sparse: true });

module.exports = mongoose.model('User', UserSchema);
