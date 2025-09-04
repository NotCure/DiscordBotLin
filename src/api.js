// src/api.js
const express = require("express");
const LicenseKey = require("./Schemas/LicenseKeySchema");
const { WebhookClient, EmbedBuilder } = require("discord.js");

const logWebhook = new WebhookClient({
  url: "https://discord.com/api/webhooks/1413185785569742919/t7JOmnxuWtQ1FwdCpC_KYFpaCfwFNXEJUloVutpgQmL0oSavPpJ8qQGkBuox9rEt2J5S",
});

function startApiServer() {
  const app = express();
  app.use(express.json());
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

      // optional metadata
      const meta = {
        name: (req.query.name || "").toString().slice(0, 64) || "unknown",
        sid:  (req.query.sid  || "").toString().slice(0, 32) || "unknown",
        res:  (req.query.res  || "").toString().slice(0, 64) || "unknown",
      };

      const ip = getIp(req);
      const now = new Date();

      // Atomically consume a valid, unused key
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
        // success log
        const okEmbed = new EmbedBuilder()
          .setTitle("🔑 License Used")
          .addFields(
            { name: "Key", value: doc.key, inline: true },
            { name: "Client IP", value: ip, inline: true },
            { name: "Used At", value: now.toISOString(), inline: false },
            { name: "Player Name", value: meta.name, inline: true },
            { name: "Server ID", value: meta.sid, inline: true },
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

      // Not consumed — figure out why and log it
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
          { name: "Server ID", value: meta.sid, inline: true },
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
