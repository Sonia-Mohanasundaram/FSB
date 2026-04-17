/* eslint-disable no-console */

const http = require("http");
const { spawn } = require("child_process");

const DEFAULT_PORT = 5000;

function getPort() {
  const value = Number(process.env.PORT || DEFAULT_PORT);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_PORT;
}

function getHealth({ port }) {
  return new Promise((resolve) => {
    const req = http.request(
      {
        hostname: "localhost",
        port,
        path: "/api/health",
        method: "GET",
        timeout: 800,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          try {
            const json = JSON.parse(data || "{}");
            resolve({ ok: true, status: res.statusCode || 0, json });
          } catch {
            resolve({ ok: true, status: res.statusCode || 0, json: null });
          }
        });
      },
    );

    req.on("timeout", () => {
      req.destroy(new Error("timeout"));
    });

    req.on("error", (err) => {
      resolve({ ok: false, error: err });
    });

    req.end();
  });
}

async function main() {
  const port = getPort();

  const health = await getHealth({ port });

  if (health.ok) {
    const service = health.json?.service;
    const ok = health.json?.ok;

    if (ok === true && service === "hms-backend") {
      console.log(`Backend already running on http://localhost:${port} (no action needed)`);
      process.exit(0);
    }

    console.error(
      `Port ${port} is already in use by another application.\n` +
        `Please stop that app OR change PORT in .env (e.g. PORT=5001) and restart backend/front-end.`,
    );
    process.exit(1);
  }

  // Not running yet; start nodemon normally.
  const child = spawn("nodemon", ["src/server.js"], {
    stdio: "inherit",
    shell: true,
    env: process.env,
  });

  child.on("exit", (code) => {
    process.exit(code ?? 0);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
