// Test GitHub token
const fs = require("fs");
const path = require("path");
const envPath = path.join(__dirname, "..", ".env.local");
const content = fs.readFileSync(envPath, "utf-8");
const lines = content.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
// Find the github_pat_ line
const tokenLine = lines.find((l) => l.startsWith("github_pat_"));
if (!tokenLine) {
  console.log("NO TOKEN FOUND");
  process.exit(1);
}
const token = tokenLine;
console.log(`Token: ${token.length} chars, prefix: ${token.substring(0, 18)}...`);

(async () => {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "Mavis-Deploy",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  // Test user
  try {
    const userResp = await fetch("https://api.github.com/user", { headers });
    const user = await userResp.json();
    console.log(`\n--- User ---`);
    console.log(`Login: ${user.login}`);
    console.log(`Type: ${user.type}`);
    console.log(`Name: ${user.name}`);

    if (user.login !== "congtydetmaygiausang-eng") {
      console.log(`\n⚠️ WRONG ACCOUNT - expected congtydetmaygiausang-eng`);
    } else {
      console.log(`\n✅ CORRECT ACCOUNT`);
    }
  } catch (e) {
    console.log("User err:", e.message);
  }

  // Test repo access
  try {
    const repoResp = await fetch("https://api.github.com/repos/congtydetmaygiausang-eng/mimin-erp", { headers });
    if (repoResp.status === 200) {
      const repo = await repoResp.json();
      console.log(`\n--- Repo access ---`);
      console.log(`Repo: ${repo.full_name}`);
      console.log(`Default branch: ${repo.default_branch}`);
      console.log(`Permissions push: ${repo.permissions?.push}`);
      console.log(`Permissions admin: ${repo.permissions?.admin}`);
    } else {
      const err = await repoResp.json();
      console.log(`\n--- Repo access DENIED ---`);
      console.log(`Status: ${repoResp.status}`);
      console.log(`Msg: ${err.message}`);
    }
  } catch (e) {
    console.log("Repo err:", e.message);
  }
})();
