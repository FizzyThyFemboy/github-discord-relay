import express from "express";

const app = express();

// GitHub sends JSON
app.use(express.json());

const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK;

app.get("/", (req, res) => res.status(200).send("ok"));

app.post("/github", async (req, res) => {
  try {
    if (!DISCORD_WEBHOOK) return res.status(500).send("Missing DISCORD_WEBHOOK");

    const commit = req.body?.head_commit;
    if (!commit) return res.sendStatus(200); // ignore events without a head commit

    const message =
`🚀 New commit pushed
Repo: ${req.body.repository.full_name}
Author: ${commit.author.name}
Message: ${commit.message}
${commit.url}`;

    const r = await fetch(DISCORD_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message }),
    });

    if (!r.ok) return res.status(502).send(`Discord webhook failed: ${r.status}`);

    return res.sendStatus(200);
  } catch (err) {
    return res.status(500).send("Server error");
  }
});

// Render expects you to bind to host 0.0.0.0 and the PORT env var (default 10000)
const port = process.env.PORT || 10000;
app.listen(port, "0.0.0.0", () => {
  console.log(`Listening on ${port}`);
});
