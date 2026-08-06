// Test fine-grained token permissions
const fs = require("fs");
const path = require("path");
const envPath = path.join(__dirname, "..", ".env.local");
const content = fs.readFileSync(envPath, "utf-8");
const lines = content.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
const token = lines.find((l) => l.startsWith("github_pat_"));
if (!token) { console.log("NO TOKEN"); process.exit(1); }
console.log(`Token: ${token.length} chars`);

(async () => {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "Mavis-Deploy",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  // Check token info
  try {
    const r = await fetch("https://api.github.com/user", { headers });
    const user = await r.json();
    console.log(`\n--- Token user ---`);
    console.log(`Login: ${user.login}`);

    // Check fine-grained token repos
    console.log(`\n--- Token repos accessible ---`);
    const r2 = await fetch("https://api.github.com/user/repos?per_page=5", { headers });
    if (r2.status === 200) {
      const repos = await r2.json();
      repos.forEach((repo) => {
        console.log(`  - ${repo.full_name} (push: ${repo.permissions?.push}, admin: ${repo.permissions?.admin})`);
      });
    } else {
      console.log(`  Status: ${r2.status}`);
    }

    // Check specific repo
    console.log(`\n--- Target repo: congtydetmaygiausang-eng/mimin-erp ---`);
    const r3 = await fetch("https://api.github.com/repos/congtydetmaygiausang-eng/mimin-erp", { headers });
    if (r3.status === 200) {
      const repo = await r3.json();
      console.log(`Permissions: push=${repo.permissions?.push}, admin=${repo.permissions?.admin}, pull=${repo.permissions?.pull}`);
    } else {
      const err = await r3.json();
      console.log(`Status: ${r3.status} - ${err.message}`);
    }
  } catch (e) {
    console.log("Err:", e.message);
  }
})();
