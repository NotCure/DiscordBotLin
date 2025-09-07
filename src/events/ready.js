const mongoose = require('mongoose');
const mongoURL = process.env.mongoURL;
const { startApiServer } = require('../api.js');

module.exports = {
  name: 'clientReady',
  once: true,
  async execute(client) {
    console.log(mongoURL);

    if (!mongoURL) {
      console.error('MongoDB connection string is missing.');
      return;
    }

    if (typeof fetch !== "function") {
      global.fetch = (...a) => import("node-fetch").then(m => m.default(...a));
    }

    try {
      await mongoose.connect(mongoURL);
      startApiServer();
      console.log('Connected to MongoDB');

    
      const port = Number(process.env.API_PORT || 3000);
      const keepUrl = process.env.KEEPALIVE_URL || `https://discordbotlin.onrender.com${port}/status`;

      const ping = async () => {
        try {
          const r = await fetch(keepUrl, { method: "GET" });
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          await r.text();
        } catch (e) {
          console.warn(`[keepalive] ping failed: ${e.message}`);
        }
      };

      ping(); // immediate ping
      client.keepaliveInterval = setInterval(ping, 9 * 60 * 1000);

      const cleanup = () => {
        if (client.keepaliveInterval) clearInterval(client.keepaliveInterval);
      };
      process.on("SIGTERM", cleanup);
      process.on("SIGINT", cleanup);
    } catch (error) {
      console.error('MongoDB connection error:', error);
    }
  },
};
