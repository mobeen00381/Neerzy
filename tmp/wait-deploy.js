/**
 * Waits for the Vercel production deployment of the current commit to settle.
 *   node tmp/wait-deploy.js
 */
const fs = require("fs");
const { execSync } = require("child_process");

const env = {};
fs.readFileSync(require("path").join(__dirname, "..", ".env.local"), "utf8")
  .split(/\r?\n/)
  .forEach((line) => {
    const m = line.match(/^([A-Z_0-9]+)=(.*)$/);
    if (m) env[m[1]] = m[2];
  });

const sha = execSync("git rev-parse --short HEAD", { cwd: require("path").join(__dirname, "..") })
  .toString()
  .trim();

(async () => {
  for (let i = 0; i < 40; i++) {
    const r = await fetch(
      `https://api.vercel.com/v6/deployments?projectId=${env.VERCEL_PROJECT_ID}&limit=5`,
      { headers: { Authorization: `Bearer ${env.VERCEL_TOKEN}` } }
    );
    const j = await r.json();
    const match = (j.deployments || []).find((d) => (d.meta?.githubCommitSha || "").startsWith(sha));
    if (match) {
      console.log(`${new Date().toISOString()}  ${sha}  ${match.state}  https://${match.url}`);
      if (["READY", "ERROR", "CANCELED"].includes(match.state)) {
        console.log(match.state === "READY" ? "\nDEPLOY LIVE" : "\nDEPLOY DID NOT SUCCEED");
        process.exitCode = match.state === "READY" ? 0 : 1;
        return;
      }
    } else {
      console.log(`${new Date().toISOString()}  no deployment for ${sha} yet`);
    }
    await new Promise((res) => setTimeout(res, 15000));
  }
  console.log("timed out waiting for the deployment");
  process.exitCode = 1;
})();
