const express = require("express");
const app = express();
app.use(express.json());

const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK;

app.post("/github", async (req, res) => {
  const commit = req.body.head_commit;
  if (!commit) return res.sendStatus(200);

  const message =
`🚀 New commit pushed
Repo: ${req.body.repository.full_name}
Author: ${commit.author.name}
Message: ${commit.message}
${commit.url}`;

  await fetch(DISCORD_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: message })
  });

  res.sendStatus(200);
});

app.listen(3000);