const mongoose = require('mongoose');
const mongoURL = process.env.mongoURL;
const { startApiServer } = require('../api.js');

module.exports = {
    name: 'clientReady',
    once: true,
    async execute(client) {
         console.log(mongoURL);

         if (!mongoURL || mongoURL === '' || mongoURL === undefined) {
            console.error('MongoDB connection string is missing.');
            return;
        }
        try {
            await mongoose.connect(`${mongoURL}`);
            startApiServer();
            console.log('Connected to MongoDB');
        } catch (error) {
            console.error('MongoDB connection error:', error);
        }
    },
};
       

