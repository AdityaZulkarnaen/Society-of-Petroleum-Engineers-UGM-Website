/** Runs a sanitized copy only. Never loads .env files from the checkout. */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { cp, copyFile, mkdir, mkdtemp, readFile, readdir, symlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repo = fileURLToPath(new URL("../../", import.meta.url));
// Keep dependencies and build copy on the same drive: webpack's Windows entry
// resolution cannot handle the cross-drive paths of a linked pnpm installation.
await mkdir(path.join(repo, ".next"), { recursive: true });
const root = await mkdtemp(path.join(repo, ".next", "recruitment-mock-"));
const artifacts = path.join(root, "qa-artifacts");
await mkdir(artifacts);
for (const entry of ["app", "src", "public", "package.json", "tsconfig.json", "next-env.d.ts", "next.config.ts", "postcss.config.mjs", "eslint.config.mjs", "proxy.ts", "AGENTS.md", "CLAUDE.md"]) {
  await cp(path.join(repo, entry), path.join(root, entry), { recursive: true });
}
await symlink(path.join(repo, "node_modules"), path.join(root, "node_modules"), process.platform === "win32" ? "junction" : "dir");
await copyFile(new URL("block-network.cjs", import.meta.url), path.join(root, "block-network.cjs"));
assert(!(await readdir(root)).some((name) => name.startsWith(".env")), "Environment file copied unexpectedly");

// Only already-installed, self-hosted font assets are copied; never the old build.
const families = { Sora: [], "Plus Jakarta Sans": [] };
for (const name of await readdir(path.join(repo, ".next/static/chunks"))) {
  if (!name.endsWith(".css")) continue;
  const css = await readFile(path.join(repo, ".next/static/chunks", name), "utf8");
  for (const match of css.matchAll(/@font-face\{[^}]+\}/g)) {
    const face = match[0];
    const family = /font-family:([^;]+)/.exec(face)?.[1];
    const font = /src:url\(\.\.\/media\/([^)]*)\)/.exec(face)?.[1];
    if (!font || !families[family]) continue;
    await mkdir(path.join(root, "offline-fonts"), { recursive: true });
    const destination = path.join(root, "offline-fonts", font);
    await copyFile(path.join(repo, ".next/static/media", font), destination);
    // The installed Next.js font test hook accepts a root-relative local path.
    const localFont = process.platform === "win32" ? destination.slice(path.parse(destination).root.length - 1).replaceAll("\\", "/") : destination;
    families[family].push(face.replace(`src:url(../media/${font})`, `src: url(${localFont})`));
  }
}
assert(families.Sora.length && families["Plus Jakarta Sans"].length, "Offline brand fonts unavailable; refusing network fallback");
const fontMock = path.join(root, "offline-fonts.cjs");
await writeFile(fontMock, `const faces = ${JSON.stringify(families)}; module.exports = new Proxy({}, {get: (_, url) => faces[String(url).includes('Sora') ? 'Sora' : 'Plus Jakarta Sans'].join(String.fromCharCode(10))});`);

const env = {};
for (const key of ["SystemRoot", "WINDIR", "TEMP", "TMP", "COMSPEC", "PATH", "PATHEXT", "USERPROFILE", "LOCALAPPDATA", "APPDATA", "NUMBER_OF_PROCESSORS", "PROCESSOR_ARCHITECTURE"]) {
  if (process.env[key]) env[key] = process.env[key];
}
Object.assign(env, {
  NODE_ENV: "production",
  NEXT_TELEMETRY_DISABLED: "1",
  NEXT_FONT_GOOGLE_MOCKED_RESPONSES: fontMock,
  NODE_OPTIONS: `--require=${JSON.stringify(path.join(root, "block-network.cjs"))}`,
  RECRUITMENT_GUARD_LOG: path.join(artifacts, "network-guard.log"),
});
assert(!Object.keys(env).some((key) => /SUPABASE|SECRET|TOKEN|PASSWORD|VERCEL|^NEXT_PUBLIC_/.test(key)));

function run(args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { cwd: root, env, windowsHide: true, ...options });
    let output = "";
    child.stdout.on("data", (chunk) => { output += chunk; process.stdout.write(chunk); });
    child.stderr.on("data", (chunk) => { output += chunk; process.stderr.write(chunk); });
    child.on("error", reject);
    child.on("close", (code) => code === 0 ? resolve(output) : reject(new Error(`Isolated check failed (${code})`)));
  });
}

await run(["-e", `
  const assert = require('node:assert/strict');
  assert(globalThis[Symbol.for('spe.recruitment.networkGuard')]);
  (async () => {
  for (const operation of [
    () => require('node:net').connect({host:'203.0.113.1',port:443}),
    () => require('node:tls').connect({host:'203.0.113.1',port:443}),
    () => require('node:http').get('http://example.invalid'),
    () => require('node:https').get('https://example.invalid'),
    () => require('node:dns').lookup('example.invalid'),
  ]) {
    let error;
    try {
      const request = operation();
      error = await new Promise((resolve) => {
        const timeout = setTimeout(() => resolve(new Error('Guard did not block')), 2000);
        request.once('error', failure => { clearTimeout(timeout); resolve(failure); });
      });
    } catch (failure) { error = failure; }
    assert.equal(error?.code, 'RECRUITMENT_NETWORK_BLOCKED');
  }
    await assert.rejects(fetch('https://example.invalid'), {code:'RECRUITMENT_NETWORK_BLOCKED'});
    await assert.rejects(fetch('https://203.0.113.1'), {code:'RECRUITMENT_NETWORK_BLOCKED'});
    await assert.rejects(require('node:dns').promises.resolve4('example.invalid'), {code:'RECRUITMENT_NETWORK_BLOCKED'});
    const { Worker } = require('node:worker_threads');
    await new Promise((resolve,reject) => {
      const worker = new Worker(\"require('node:worker_threads').parentPort.postMessage(Boolean(globalThis[Symbol.for('spe.recruitment.networkGuard')]))\", {eval:true});
      worker.on('message', value => value ? resolve() : reject(new Error('Worker guard absent')));
      worker.on('error', reject);
    });
    console.log('PASS: credential-free copy; external fetch/TCP/TLS/HTTP/HTTPS/DNS blocked; worker guard inherited');
  })().catch(error => { console.error(error); process.exitCode=1; });
`]);

// This probe exists only in the temporary copy, never in application source.
const probe = path.join(root, "app/mock-isolation-proof");
await mkdir(probe);
await writeFile(path.join(probe, "route.ts"), `export async function GET() {
  const guarded = Boolean((globalThis as Record<symbol, unknown>)[Symbol.for("spe.recruitment.networkGuard")]);
  const credentialFree = !Object.keys(process.env).some(key => /SUPABASE|SECRET|TOKEN|PASSWORD|^NEXT_PUBLIC_/.test(key));
  let blocked = false;
  try { await fetch("https://example.invalid"); } catch (error) { blocked = (error as {code?: string}).code === "RECRUITMENT_NETWORK_BLOCKED"; }
  return Response.json({guarded, credentialFree, blocked});
}`);

// Isolated browser-only fixture page: mocked API interception, no credentials.
const backendProbe = path.join(root, "app/backend-wizard-test");
await mkdir(backendProbe);
await writeFile(path.join(backendProbe, "page.tsx"), `import { ApplicationWizard } from "@/modules/recruitment/wizard"; export default function Page() { return <ApplicationWizard backend />; }`);

console.log("Isolated artifacts:", artifacts);
await copyFile(new URL("assert-source.cjs", import.meta.url), path.join(root, "assert-source.cjs"));
await run([path.join(root, "assert-source.cjs")]);
if (process.argv.includes("--source-only")) process.exit(0);
await run([path.join(repo, "node_modules/next/dist/bin/next"), "build", "--webpack"]);
await run([path.join(repo, "node_modules/typescript/bin/tsc"), "--noEmit", "--incremental", "false"]);
await run([path.join(repo, "node_modules/eslint/bin/eslint.js"), "app/(site)/join", "src/modules/recruitment", "src/components/site-header.tsx", "src/modules/home/hero/index.tsx"]);

const net = await import("node:net");
const port = await new Promise((resolve, reject) => {
  const socket = net.createServer();
  socket.on("error", reject);
  socket.listen(0, "127.0.0.1", () => { const selected = socket.address().port; socket.close(() => resolve(selected)); });
});
const origin = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, [path.join(repo, "node_modules/next/dist/bin/next"), "start", "--hostname", "127.0.0.1", "--port", String(port)], { cwd: root, env, windowsHide: true });
server.stdout.on("data", (chunk) => process.stdout.write(chunk));
server.stderr.on("data", (chunk) => process.stderr.write(chunk));
server.on("error", (error) => console.error(error));
try {
  let ready = false;
  for (let attempt = 0; attempt < 90; attempt++) {
    try {
      const response = await fetch(`${origin}/mock-isolation-proof`);
      const proof = await response.json();
      assert.deepEqual(proof, { guarded: true, credentialFree: true, blocked: true });
      ready = true;
      break;
    } catch { await new Promise((resolve) => setTimeout(resolve, 500)); }
  }
  assert(ready, "Actual Next.js server isolation proof failed; browser tests prohibited");
  console.log("PASS: actual Next.js server has no backend credentials and blocks external requests");
  const { checkBrowser } = await import("./browser.mjs");
  await checkBrowser({ origin, artifacts, env });
} finally {
  server.kill();
}
