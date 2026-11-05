/* Run against the credential-free QA copy on 127.0.0.1:3106.
   Pass the path to an existing playwright-core install as the first argument.
   Every recruitment request is fulfilled/aborted here; none reaches a backend. */
import { createRequire } from "node:module";
const loadModule = createRequire(import.meta.url);
const { chromium } = loadModule(process.argv[2] || "playwright-core");
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
const out = path.resolve("node_modules/.cache/recruitment-ux");
const slots = ["cv", "idCard", "commitment", "followProof", "storyProof", "mbti", "ugmGroupProof"];
const period = {
  id: "synthetic-ux-only", label: "Synthetic UX Test", contentState: "approved", notice: "Synthetic only", batches: ["2025", "2026"],
  divisions: [{ id: "synthetic", label: "Synthetic division", subDivisions: [
    { id: "required", label: "Synthetic required", assignment: { status: "required", instructions: "Synthetic file", upload: { formats: ["pdf"], maxBytes: 3145728, filename: "Sample.pdf" } } },
    { id: "none", label: "Synthetic no assignment", assignment: { status: "none", message: "No assignment" } },
    { id: "second", label: "Synthetic second", assignment: { status: "none", message: "No assignment" } },
  ] }],
  documents: Object.fromEntries(slots.map((key, i) => [key, { required: true, formats: [i < 3 ? "pdf" : "png"], maxBytes: 3145728, filename: "Sample" }])),
};
const pdf = { name: "Synthetic.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\nSynthetic local UX fixture only\n%%EOF") };
const png = { name: "Synthetic.png", mimeType: "image/png", buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=", "base64") };
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", headless: true });
  const results = [], runtime = [];
  try {
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 } });
    let mode = "success", uploads = 0, finalizations = 0, inits = 0, release, intercepted = 0, external = 0;
    const requests = [], stages = [];
    await context.route("**/*", async route => {
      const req = route.request(), url = new URL(req.url());
      if (url.hostname !== "127.0.0.1") { external++; return route.abort(); }
      if (!url.pathname.startsWith("/api/")) return route.continue();
      intercepted++;
      assert.equal(url.pathname, "/api/recruitment");
      const reply = (body, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
      if (req.method() === "GET") {
        if (mode === "session-network") return route.abort("failed");
        return reply({ token: "synthetic-session-only", period });
      }
      assert.equal(req.headers()["x-recruitment-session"], "synthetic-session-only");
      const action = url.searchParams.get("action");
      requests.push({ action, payload: action === "upload" ? req.postData() : req.postDataJSON() });
      if (action === "init") {
        inits++; uploads = 0;
        if (mode === "hold-init") await new Promise(resolve => { release = resolve; });
        if (mode === "init-network") return route.abort("failed");
        if (mode === "unavailable") return reply({ error: "Internal secret-token server detail" }, 503);
        if (mode === "malformed") return route.fulfill({ status: 503, contentType: "text/html", body: "private internal stack" });
        if (mode === "duplicate") return reply({ error: "An application has already been submitted with this Student ID (NIM)." }, 409);
        if (mode === "expired") return reply({ error: "Invalid session. Please reload the page." }, 403);
        if (mode === "earlier-field") return reply({ error: "Please review your entries.", fields: { phoneNumber: "Enter a phone number with 8\u201325 characters." } }, 422);
        if (mode === "recover") return reply({ status: "already_submitted", applicationId: "SYNTHETIC-RECOVERED" });
        return reply({ applicationId: "SYNTHETIC-INIT" });
      }
      if (action === "upload") {
        uploads++;
        await new Promise(resolve => setTimeout(resolve, 90));
        if (mode === "upload-network" && uploads === 3) return route.abort("failed");
        if (mode === "document-field") return reply({ error: "File content does not match supported PDF/PNG format.", fields: { cv: "File content does not match supported PDF/PNG format." } }, 422);
        return reply({ fileId: "synthetic-file-" + uploads, fileUrl: "" });
      }
      assert.equal(action, "finalize"); finalizations++;
      if (mode === "finalize-network") return route.abort("failed");
      await new Promise(resolve => setTimeout(resolve, 200));
      return reply({ applicationId: "SYNTHETIC-SUCCESS" });
    });
    const page = await context.newPage();
    page.on("pageerror", e => runtime.push(e.message));
    const record = name => results.push({ width, name, passed: true });
    const button = name => page.getByRole("button", { name, exact: true });
    const next = () => button("Next").click();
    const review = async () => { await button("Review application").click(); await page.getByRole("heading", { name: "Review your application", exact: true }).waitFor(); };
    const start = async required => {
      mode = "success";
      await page.goto("http://127.0.0.1:3106/join/apply");
      await page.locator("#recruit-fullName").waitFor();
      await next();
      assert.equal(await page.locator("#recruit-fullName").getAttribute("aria-invalid"), "true");
      assert.equal(await page.evaluate(() => document.activeElement.id), "recruit-fullName");
      record("current step validation marks and focuses first field");
      for (const [key, value] of Object.entries({ fullName: "Synthetic Applicant", nim: "SYNTHETIC-2026-001", birthPlace: "Synthetic City", birthDate: "2005-01-01", phoneNumber: "08123456789", major: "Synthetic Engineering" })) await page.locator("#recruit-" + key).fill(value);
      await page.locator("#recruit-batch").selectOption("2025");
      await next();
      assert.equal(await page.evaluate(() => document.activeElement.id), "recruit-ugmEmail");
      await page.getByRole("alert").filter({ hasText: "Please check the following field." }).waitFor();
      assert.equal(await page.locator("#recruit-ugmEmail").getAttribute("aria-describedby"), "recruit-ugmEmail-hint recruit-ugmEmail-error");
      record("singular error and accessible association");
      await page.locator("#recruit-ugmEmail").fill("synthetic@example.invalid"); await next();
      await page.locator("#recruit-division1").selectOption("synthetic");
      await page.locator("#recruit-subDivision1").selectOption(required ? "required" : "none");
      await page.locator("#recruit-motivation1").fill("Synthetic first preference motivation");
      if (required) await page.locator("#recruit-assignment1").setInputFiles(pdf);
      await next();
      await page.locator("#recruit-division2").selectOption("synthetic");
      await page.locator("#recruit-subDivision2").selectOption("second");
      await page.locator("#recruit-motivation2").fill("Synthetic second preference motivation");
      await next();
      await button("Review application").click();
      assert.equal(await page.evaluate(() => document.activeElement.id), "recruit-cv");
      assert.equal(await page.locator("#recruit-cv").getAttribute("aria-invalid"), "true");
      record("missing supporting documents focus and mark actual upload");
      for (let i = 0; i < slots.length; i++) await page.locator("#recruit-" + slots[i]).setInputFiles(i < 3 ? pdf : png);
      await review();
    };
    const submit = async testMode => {
      mode = testMode; await button("Submit application").click();
      await page.waitForFunction(() => !document.querySelector("dialog[open]"), null, { timeout: 15000 });
    };
    const retained = async () => {
      const text = await page.locator("main").innerText();
      assert.match(text, /SYNTHETIC-2026-001/);assert.match(text, /Synthetic.pdf/);assert.match(text, /Synthetic.png/);
      assert.doesNotMatch(text, /Failed to fetch|secret-token|private internal stack/);
    };
    mode = "session-network"; await page.goto("http://127.0.0.1:3106/join/apply");
    await page.getByText("We could not connect to the application system. Check your internet connection and try again.", { exact: true }).waitFor();
    record("initial connection error is friendly");
    await start(true);
    for (const [m, text] of [["init-network", "Check your connection"], ["unavailable", "temporarily unavailable"], ["malformed", "temporarily unavailable"], ["duplicate", "Do not submit using a different NIM"], ["expired", "Your session has expired"]]) {
      await submit(m); await page.getByRole("alert").filter({ hasText: text }).waitFor(); await retained();
      assert.equal(await page.evaluate(() => document.activeElement.getAttribute("role")), "alert");
      record(m + " retains input and files and focuses feedback");
    }
    await submit("earlier-field"); await page.locator("#recruit-phoneNumber[aria-invalid=true]").waitFor();
    assert.equal(await page.evaluate(() => document.activeElement.id), "recruit-phoneNumber");
    const box = await page.locator("#recruit-phoneNumber").boundingBox();assert.ok(box.y > 60 && box.y < (width === 390 ? 844 : 900));
    assert.equal(await page.locator("#recruit-nim").inputValue(), "SYNTHETIC-2026-001");
    record("API review error navigates and scrolls to earlier field");
    await page.locator("#recruit-phoneNumber").fill("081234567890");
    assert.equal(await page.evaluate(() => document.activeElement.id), "recruit-phoneNumber", "typing a correction keeps keyboard focus in the field");
    await next();
    assert.equal(await page.evaluate(() => document.activeElement.id), "wizard-title", "old server feedback does not steal focus on step navigation");
    await next(); await next(); await review(); await retained();
    await submit("document-field"); await page.locator("#recruit-cv[aria-invalid=true]").waitFor();
    assert.equal(await page.evaluate(() => document.activeElement.id), "recruit-cv");
    assert.match(await page.locator("main").innerText(), /Synthetic.pdf/);record("API upload validation locates document without clearing files");
    await page.locator("#recruit-cv").setInputFiles(pdf); await review();
    const finalBefore = finalizations; await submit("upload-network");
    assert.equal(uploads, 3);assert.equal(finalizations, finalBefore);await retained();record("staged upload network failure stops before finalize");
    await submit("finalize-network");await page.getByRole("alert").filter({ hasText: "could not confirm whether" }).waitFor();await retained();record("finalization network failure remains uncertain");
    await submit("init-network");await page.getByRole("alert").filter({ hasText: "could not confirm whether" }).waitFor();record("uncertainty persists across retry failure");
    await submit("recover");await page.getByText("SYNTHETIC-RECOVERED", { exact: true }).waitFor();
    assert.equal(uploads, 0);record("already-submitted recovery confirms same NIM without uploads");
    for (const required of [false, true]) {
      await start(required);mode = "hold-init";const before = inits;
      await button("Submit application").scrollIntoViewIfNeeded();
      assert.ok(await page.evaluate(() => scrollY > innerHeight), "Submit starts below the viewport on the long review page");
      await button("Submit application").evaluate(el => { el.click(); el.click(); });
      const dialog = page.getByRole("dialog"); await dialog.waitFor();
      assert.equal(inits, before + 1);assert.equal(await dialog.getAttribute("aria-modal"), "true");
      const rect = await dialog.boundingBox();assert.ok(rect.x >= 0 && rect.y >= 0 && rect.x + rect.width <= width && rect.y + rect.height <= (width === 390 ? 844 : 900));
      assert.ok(await page.evaluate(() => document.activeElement.closest("dialog") !== null));
      await page.keyboard.press("Escape");assert.equal(await dialog.isVisible(), true);
      await page.mouse.click(1, 1);assert.equal(await dialog.isVisible(), true);
      await page.keyboard.press("Tab");assert.ok(await page.evaluate(() => document.activeElement.closest("dialog") !== null));
      await page.keyboard.press("Shift+Tab");assert.ok(await page.evaluate(() => document.activeElement.closest("dialog") !== null));
      await page.screenshot({ path: path.join(out, `modal-${width}-${required ? 8 : 7}.png`) });
      const progressPoll = setInterval(async () => { try { const value = await page.locator("#submission-progress").innerText({ timeout: 100 });stages.push(value); } catch {} }, 35);
      mode = "success";release();
      await page.getByText("SYNTHETIC-SUCCESS", { exact: true }).waitFor();clearInterval(progressPoll);
      const expected = required ? 8 : 7;
      assert.equal(uploads, expected);assert.equal(inits, before + 1);
      const finalRequest = requests.filter(r => r.action === "finalize").at(-1);
      assert.equal(finalRequest.payload.documents.length, expected);assert.equal(finalRequest.payload.values.nim, "SYNTHETIC-2026-001");
      assert.ok(stages.some(s => s.includes(`Uploading document 3 of ${expected}`)));assert.ok(stages.some(s => s.includes("Finalizing your application")));
      assert.equal(await page.evaluate(() => document.activeElement.tagName), "H1");
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      record(`successful ${expected}-document flow with visible modal, real stages, Escape/backdrop prevention, double-click guard`);
    }
    assert.deepEqual(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length })), { local: 0, session: 0 });
    results.push({ width, intercepted, backendRequestsAllowedThrough: 0, externalBlocked: external });
    await context.close();
  }
  assert.deepEqual(runtime, []);
  fs.writeFileSync(path.join(out, "browser-results.json"), JSON.stringify({ results, runtime, syntheticOnly: true }, null, 2));
  console.log(JSON.stringify({ checks: results.length - 2, results, runtime }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
