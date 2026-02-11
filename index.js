import express from "express";

const app = express();
app.use(express.json());

const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK;

app.get("/", (req, res) => res.status(200).send("ok"));

app.post("/github", async (req, res) => {
  try {
    if (!DISCORD_WEBHOOK) return res.status(500).send("Missing DISCORD_WEBHOOK");

    const repo = req.body?.repository;
    const commit = req.body?.head_commit;
    if (!repo || !commit) return res.sendStatus(200);

    const branch = typeof req.body?.ref === "string"
      ? req.body.ref.replace("refs/heads/", "")
      : "unknown";

    const authorName = commit.author?.name || "Unknown";
    const commitMsg = commit.message || "(no message)";
    const commitUrl = commit.url;
    const repoUrl = repo.html_url || `https://github.com/${repo.full_name}`;

    // Nice Discord embed
    const payload = {
      // optional: username/avatar_url can be set here if you want to customize webhook identity
      embeds: [
        {
          title: "New commit pushed",
          url: commitUrl, // makes the title clickable
          color: 0x2b90d9, // decimal/hex both fine in JS; Discord expects an int
          author: {
            name: repo.full_name,
            url: repoUrl,
          },
          description: commitMsg,
          fields: [
            { name: "Branch", value: branch, inline: true },
            { name: "Author", value: authorName, inline: true },
            { name: "Commit", value: commit.id ? commit.id.slice(0, 7) : "unknown", inline: true },
          ],
          footer: { text: "GitHub → Discord Relay" },
          timestamp: new Date(commit.timestamp || Date.now()).toISOString(),
        },
      ],
    };

    const r = await fetch(DISCORD_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!r.ok) return res.status(502).send(`Discord webhook failed: ${r.status}`);

    return res.sendStatus(200);
  } catch {
    return res.status(500).send("Server error");
  }
});

const port = process.env.PORT || 10000;
app.listen(port, "0.0.0.0", () => console.log(`Listening on ${port}`));
