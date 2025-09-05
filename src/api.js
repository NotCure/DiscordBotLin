// src/api.js
const express = require("express");
const LicenseKey = require("./Schemas/LicenseKeySchema");
const { WebhookClient, EmbedBuilder } = require("discord.js");
const { rateLimit } = require('express-rate-limit');


const logWebhook = new WebhookClient({
  url: "https://discord.com/api/webhooks/1413185785569742919/t7JOmnxuWtQ1FwdCpC_KYFpaCfwFNXEJUloVutpgQmL0oSavPpJ8qQGkBuox9rEt2J5S",
});

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 10, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
	standardHeaders: 'draft-8', // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
	ipv6Subnet: 56, // Set to 60 or 64 to be less aggressive, or 52 or 48 to be more aggressive
	// store: ... , // Redis, Memcached, etc. See below.
})

function startApiServer() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json(), limiter);
  
  const PORT = process.env.API_PORT ? Number(process.env.API_PORT) : 3000;

  // Helper to resolve client IP
  function getIp(req) {
    const xff = req.headers["x-forwarded-for"];
    const first = Array.isArray(xff) ? xff[0] : String(xff || "").split(",")[0];
    return (first || req.socket?.remoteAddress || "unknown").trim();
  }

  // === ONE endpoint: GET /auth?key=...&name=...&sid=...&res=... ===
  // Returns "true" (consumed) or "false" (failed). Always text/plain.
app.get("/auth", async (req, res) => {
  try {
    const key = (req.query.key || "").trim();
    if (!key) return res.status(400).type("text/plain").send("false");

    const meta = {
      name: (req.query.name || "").toString().slice(0, 64) || "unknown",
      ep:   (req.query.ep || req.query.endpoint || "").toString().slice(0, 128) || "unknown",
      sid:  (req.query.sid || "").toString().slice(0, 32) || "unknown", // optional legacy
      res:  (req.query.res || "").toString().slice(0, 64) || "unknown",
    };

    const ip = getIp(req);
    const now = new Date();

    const doc = await LicenseKey.findOneAndUpdate(
      {
        key,
        used: false,
        revoked: false,
        $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
      },
      { $set: { used: true, usedAt: now, lastCheckAt: now } },
      { new: true }
    );

    if (doc) {
      const okEmbed = new EmbedBuilder()
        .setTitle("🔑 License Used")
        .addFields(
          { name: "Key", value: doc.key, inline: true },
          { name: "Client IP", value: ip, inline: true },
          { name: "Used At", value: now.toISOString(), inline: false },
          { name: "Player Name", value: meta.name, inline: true },
          { name: "Server Endpoint", value: meta.ep, inline: true },   // <-- log endpoint
          // { name: "Server ID", value: meta.sid, inline: true },      // optional legacy
          { name: "Resource", value: meta.res, inline: true },
          ...(doc.expiresAt
            ? [{ name: "Expires At", value: doc.expiresAt.toISOString(), inline: false }]
            : [])
        )
        .setColor("Green")
        .setTimestamp();
      await logWebhook.send({ embeds: [okEmbed] }).catch(console.error);

      return res.type("text/plain").send("true");
    }

    await LicenseKey.findOneAndUpdate({ key }, { $set: { lastCheckAt: now } }).catch(() => {});
    const existing = await LicenseKey.findOne({ key }).lean();

    let reason = "not-found";
    if (existing) {
      if (existing.revoked) reason = "revoked";
      else if (existing.used) reason = "already-used";
      else if (existing.expiresAt && existing.expiresAt <= now) reason = "expired";
      else reason = "invalid-state";
    }

    const failEmbed = new EmbedBuilder()
      .setTitle("❌ License Auth Failed")
      .addFields(
        { name: "Key Tried", value: key || "(empty)", inline: true },
        { name: "Client IP", value: ip, inline: true },
        { name: "Reason", value: reason, inline: false },
        { name: "Player Name", value: meta.name, inline: true },
        { name: "Server Endpoint", value: meta.ep, inline: true },     // <-- log endpoint
        // { name: "Server ID", value: meta.sid, inline: true },        // optional legacy
        { name: "Resource", value: meta.res, inline: true },
      )
      .setColor("Red")
      .setTimestamp();
    await logWebhook.send({ embeds: [failEmbed] }).catch(console.error);

    return res.type("text/plain").send("false");
  } catch (err) {
    console.error("GET /auth error:", err);
    try {
      const errEmbed = new EmbedBuilder()
        .setTitle("🛑 License Auth Error")
        .setDescription(String(err?.message || err))
        .setColor("DarkRed")
        .setTimestamp();
      await logWebhook.send({ embeds: [errEmbed] });
    } catch (_) {}
    return res.status(500).type("text/plain").send("false");
  }
});


  app.listen(PORT, () => {
    console.log(`[api] listening on http://0.0.0.0:${PORT}`);
  });
}

module.exports = { startApiServer };
