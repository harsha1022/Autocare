const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const adminEmail = 'admin@carassist.com';
        const existingAdmin = await User.findOne({ email: adminEmail });

        if (existingAdmin) {
            console.log('Admin already exists');
            existingAdmin.role = 'admin'; // Ensure role is admin
            await existingAdmin.save();
        } else {
            const newAdmin = new User({
                name: 'System Admin',
                email: adminEmail,
                password: 'admin123', // In production use hashed passwords
                role: 'admin',
                phone: '1234567890'
            });
            await newAdmin.save();
            console.log('Admin user created successfully');
        }

        mongoose.connection.close();
    } catch (err) {
        console.error('Error seeding admin:', err);
    }
};

seedAdmin();
