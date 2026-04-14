const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const ADMIN_EMAIL = 'admin@carassist.com';
const ADMIN_PASSWORD = 'admin123';

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });

        // Hash the password so bcrypt.compare() works at login
        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

        if (existingAdmin) {
            console.log('Admin already exists — updating password & role...');
            existingAdmin.role = 'admin';
            existingAdmin.password = hashedPassword;
            await existingAdmin.save();
            console.log('Admin updated successfully.');
        } else {
            const newAdmin = new User({
                name: 'System Admin',
                email: ADMIN_EMAIL,
                password: hashedPassword,
                role: 'admin',
                phone: '1234567890'
            });
            await newAdmin.save();
            console.log('Admin user created successfully.');
        }

        console.log(`\nAdmin credentials:\n  Email   : ${ADMIN_EMAIL}\n  Password: ${ADMIN_PASSWORD}\n`);
        mongoose.connection.close();
    } catch (err) {
        console.error('Error seeding admin:', err);
        mongoose.connection.close();
    }
};

seedAdmin();
