const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect('mongodb://localhost:27017/carassist')
  .then(async () => {
    console.log('Connected to DB');
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('Shanmukh@123', salt);
    
    const result = await mongoose.connection.db.collection('users').updateOne(
      { email: { $regex: new RegExp('^shanmukh@gmail.com$', 'i') } },
      { $set: { password: hash } }
    );
    
    console.log(`Matched ${result.matchedCount} document(s) and modified ${result.modifiedCount} document(s)`);
    
    if(result.matchedCount === 0) {
        const users = await mongoose.connection.db.collection('users').find({}, {projection: {email: 1}}).toArray();
        console.log("Existing users:", users);
    } else {
        console.log('Password updated successfully to hashed version.');
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
