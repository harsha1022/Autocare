const mongoose = require('mongoose');
const ServiceRequest = require('./models/ServiceRequest');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        try {
            // Drop indexes on ServiceRequest if any are causing issues
            await ServiceRequest.collection.dropIndexes();
            console.log('Indexes dropped.');

            // Re-create the specific ones needed without enforcing strict on location if empty
            await ServiceRequest.syncIndexes();
            console.log('Indexes synced.');

            const dummyUserId = new mongoose.Types.ObjectId();
            const request = new ServiceRequest({
                userId: dummyUserId,
                vehicleType: 'Car',
                serviceType: 'Test Service',
                description: 'Test Description',
                location: { address: 'Test Address' }
            });
            await request.save();
            console.log('Saved successfully without geo errors!');
        } catch (error) {
            console.error('Error:', error);
        } finally {
            mongoose.disconnect();
        }
    })
    .catch(err => console.error(err));
