/**
 * fixPasswords.js
 * One-time migration: finds users whose passwords are NOT bcrypt hashes
 * (bcrypt hashes always start with "$2b$" or "$2a$") and rehashes them.
 * Run with: node fixPasswords.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const isBcryptHash = (str) => /^\$2[ab]\$\d+\$/.test(str);

const fixPasswords = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const users = await User.find({});
        let fixed = 0;

        for (const user of users) {
            if (!isBcryptHash(user.password)) {
                const plainPassword = user.password;
                const hashed = await bcrypt.hash(plainPassword, 10);
                user.password = hashed;
                await user.save();
                console.log(`🔒 Fixed: ${user.email}  (was plain text: "${plainPassword}")`);
                fixed++;
            } else {
                console.log(`✔  Skipped: ${user.email}  (already hashed)`);
            }
        }

        console.log(`\n✅ Done — ${fixed} user(s) fixed.\n`);

        if (fixed > 0) {
            console.log('⚠️  IMPORTANT: Plain-text passwords were printed above for reference.');
            console.log('   Users can now log in with their original passwords.\n');
        }

        mongoose.connection.close();
    } catch (err) {
        console.error('❌ Error:', err);
        mongoose.connection.close();
    }
};

fixPasswords();
