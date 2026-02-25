#!/usr/bin/env node
/**
 * scripts/test-and-report.mjs
 *
 * Single command that:
 *  1. Runs all API tests  (vitest)
 *  2. Runs all E2E tests  (Playwright — servers auto-start if needed)
 *  3. Builds a beautiful HTML report from both result sets
 *  4. Saves it to ./test-report.html
 *  5. Emails it via Resend
 *
 * Usage:  npm run test:report  (from repo root)
 */

import { spawnSync } from 'child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ─── Paths ────────────────────────────────────────────────────────────────────
const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const ROOT       = path.resolve(__dirname, '..');
const API_DIR    = path.join(ROOT, 'apps', 'api');
const WEB_DIR    = path.join(ROOT, 'apps', 'web');
const RESULTS    = path.join(ROOT, 'test-results');
const VITEST_OUT = path.join(RESULTS, 'vitest-results.json');
const PW_OUT     = path.join(WEB_DIR, 'test-results', 'playwright-results.json');
const REPORT_OUT = path.join(ROOT, 'test-report.html');

mkdirSync(RESULTS, { recursive: true });

// ─── Load .env ────────────────────────────────────────────────────────────────
function loadEnv(envPath) {
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq < 0) continue;
    const key = t.slice(0, eq).trim();
    let val   = t.slice(eq + 1).trim();
    if (val.length >= 2 && val[0] === val.at(-1) && (val[0] === '"' || val[0] === "'"))
      val = val.slice(1, -1);
    if (!process.env[key]) process.env[key] = val;
  }
}
loadEnv(path.join(API_DIR, '.env'));

const RESEND_KEY  = process.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM ?? 'Clever HR <no-reply@clever-hr.com>';
const TO_EMAIL    = 'barak.goren6@gmail.com';

// ─── Run helper ───────────────────────────────────────────────────────────────
function run(label, cmd, args, cwd) {
  console.log(`\n${'═'.repeat(55)}`);
  console.log(` ${label}`);
  console.log('═'.repeat(55));
  const result = spawnSync(cmd, args, {
    cwd,
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: process.platform === 'win32',
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  return result;
}

// ─── Step 1 — API Tests ───────────────────────────────────────────────────────
const apiRun = run(
  'STEP 1 — Backend Tests (Vitest)',
  'npx', ['vitest', 'run', '--reporter=verbose', '--reporter=json', `--outputFile=${VITEST_OUT}`],
  API_DIR
);

let vitestData = null;
try   { vitestData = JSON.parse(readFileSync(VITEST_OUT, 'utf-8')); }
catch { /* no results file — treat as total failure */ }

// ─── Step 2 — Playwright E2E Tests ───────────────────────────────────────────
const pwRun = run(
  'STEP 2 — Frontend E2E Tests (Playwright)',
  'npx', ['playwright', 'test'],
  WEB_DIR
);

let pwData = null;
try   { pwData = JSON.parse(readFileSync(PW_OUT, 'utf-8')); }
catch { /* results file missing → server likely was not reachable */ }

// ─── Step 3 — Generate HTML report ───────────────────────────────────────────
console.log(`\n${'═'.repeat(55)}`);
console.log(' STEP 3 — Generating HTML Report');
console.log('═'.repeat(55));

const html = buildReport({ vitestData, pwData });
writeFileSync(REPORT_OUT, html, 'utf-8');
console.log(`✅  Report saved → ${REPORT_OUT}`);

// ─── Step 4 — Send email ──────────────────────────────────────────────────────
console.log(`\n${'═'.repeat(55)}`);
console.log(' STEP 4 — Sending Report via Email');
console.log('═'.repeat(55));

await sendEmail(html);

// ══════════════════════════════════════════════════════════════════════════════
//  HTML BUILDER
// ══════════════════════════════════════════════════════════════════════════════

function buildReport({ vitestData, pwData }) {
  const now = new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' });

  // ── Backend stats ──
  const beTotal  = vitestData?.numTotalTests  ?? 0;
  const bePassed = vitestData?.numPassedTests ?? 0;
  const beFailed = vitestData?.numFailedTests ?? 0;

  // ── Frontend stats ──
  let feTotal = 0, fePassed = 0, feFailed = 0, feSkipped = 0;
  if (pwData?.stats) {
    fePassed  = pwData.stats.expected   ?? 0;
    feFailed  = pwData.stats.unexpected ?? 0;
    feSkipped = pwData.stats.skipped    ?? 0;
    feTotal   = fePassed + feFailed + feSkipped;
  }

  const grandTotal  = beTotal + feTotal;
  const grandPassed = bePassed + fePassed;
  const grandFailed = beFailed + feFailed;
  const allGreen    = grandFailed === 0 && grandTotal > 0;

  // ── Backend rows ──
  const beRows = (vitestData?.testResults ?? []).map(suite => {
    const file   = path.basename(suite.testFilePath ?? 'unknown');
    const passed = (suite.assertionResults ?? []).filter(t => t.status === 'passed').length;
    const failed = (suite.assertionResults ?? []).filter(t => t.status === 'failed').length;

    const testRows = (suite.assertionResults ?? []).map(t => {
      const ancestors = (t.ancestorTitles ?? []).join(' › ');
      const title     = ancestors ? `${ancestors} › ${t.title}` : t.title;
      const badge     = t.status === 'passed' ? passBadge() : failBadge();
      const dur       = t.duration != null ? `<span style="${S.dur}">${t.duration}ms</span>` : '';
      const err       = (t.failureMessages ?? []).length
        ? `<tr><td colspan="3"><pre style="${S.errBlock}">${esc((t.failureMessages[0] ?? '').slice(0, 600))}</pre></td></tr>`
        : '';
      return `<tr style="${S.testRow}">
        <td style="${S.testName}">${esc(title)}</td>
        <td style="${S.badgeCell}">${badge}</td>
        <td style="${S.durCell}">${dur}</td>
      </tr>${err}`;
    }).join('');

    const headerColor = failed > 0 ? '#fef2f2' : '#f0fdf4';
    const icon        = failed > 0 ? '❌' : '✅';
    return `
      <div style="${S.suiteWrap}">
        <div style="background:${headerColor};${S.suiteHeader}">
          <span style="font-weight:700;font-size:13px">${icon} ${esc(file)}</span>
          <span style="${S.suiteCount}">${passed} passed${failed ? ` · <strong style="color:#dc2626">${failed} failed</strong>` : ''}</span>
        </div>
        <table style="${S.table}">${testRows}</table>
      </div>`;
  }).join('');

  // ── Playwright rows ──
  function pwSuites(suites) {
    if (!suites?.length) return '';
    return suites.map(suite => {
      const specRows = (suite.specs ?? []).map(spec => {
        const ok    = spec.ok !== false && (spec.tests ?? []).every(t => t.status === 'expected' || t.status === 'passed');
        const badge = ok ? passBadge() : failBadge();
        const dur   = (spec.tests ?? [])[0]?.duration;
        const durTd = dur != null ? `<span style="${S.dur}">${dur}ms</span>` : '';
        const errs  = (spec.tests ?? []).flatMap(t => t.errors ?? [])
          .map(e => `<tr><td colspan="3"><pre style="${S.errBlock}">${esc(String(e.message ?? e).slice(0, 600))}</pre></td></tr>`)
          .join('');
        return `<tr style="${S.testRow}">
          <td style="${S.testName}">${esc(spec.title)}</td>
          <td style="${S.badgeCell}">${badge}</td>
          <td style="${S.durCell}">${durTd}</td>
        </tr>${errs}`;
      }).join('');

      const nested      = pwSuites(suite.suites);
      const allOk       = (suite.specs ?? []).every(s => s.ok !== false);
      const isFile      = /\.spec\.ts$/.test(suite.title ?? '');
      const icon        = isFile ? (allOk ? '✅' : '❌') : '📂';
      const headerColor = isFile ? (allOk ? '#f0fdf4' : '#fef2f2') : '#f9fafb';

      if (!specRows && !nested) return '';
      return `
        <div style="${S.suiteWrap}">
          <div style="background:${headerColor};${S.suiteHeader}">
            <span style="font-weight:700;font-size:13px">${icon} ${esc(suite.title ?? '')}</span>
          </div>
          <table style="${S.table}">${specRows}</table>
          ${nested}
        </div>`;
    }).join('');
  }

  const pwRows = pwData
    ? pwSuites(pwData.suites)
    : `<p style="color:#6b7280;font-style:italic;padding:12px 0">
         ⚠️ Playwright results not available — the dev servers may not have started in time.
         Check that ports 3000 and 3001 are accessible and re-run.
       </p>`;

  // ── Conclusions ──
  const conclusionItems = [
    `<li>Backend: <strong>${bePassed}/${beTotal}</strong> tests ${beFailed ? `— <span style="color:#dc2626">${beFailed} failed</span>` : '— all green ✅'}</li>`,
    `<li>Frontend: ${feTotal === 0
      ? '<em style="color:#6b7280">Results unavailable (servers did not start or timed out)</em>'
      : `<strong>${fePassed}/${feTotal}</strong> tests ${feFailed ? `— <span style="color:#dc2626">${feFailed} failed</span>` : '— all green ✅'}${feSkipped ? ` · ${feSkipped} skipped` : ''}`
    }</li>`,
    `<li>Overall: <strong style="color:${allGreen ? '#16a34a' : '#dc2626'}">${allGreen ? 'PASS — everything is green 🚀' : `FAIL — ${grandFailed} test(s) need attention`}</strong></li>`,
  ].join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Claver HR — Test Report · ${now}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,sans-serif;color:#111827">

<div style="max-width:720px;margin:32px auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.09)">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:30px 36px">
    <h1 style="margin:0;color:#fff;font-size:24px;font-weight:800;letter-spacing:-0.5px">🧪 Claver HR — Test Report</h1>
    <p style="margin:6px 0 0;color:#c7d2fe;font-size:13px">${now}</p>
  </div>

  <!-- Status banner -->
  <div style="background:${allGreen ? '#f0fdf4' : '#fef2f2'};border-bottom:2px solid ${allGreen ? '#86efac' : '#fca5a5'};padding:16px 36px;display:flex;align-items:center;gap:12px">
    <span style="font-size:28px">${allGreen ? '✅' : '❌'}</span>
    <div>
      <p style="margin:0;font-size:17px;font-weight:700;color:${allGreen ? '#15803d' : '#b91c1c'}">
        ${allGreen ? 'All Tests Passed' : `${grandFailed} Test${grandFailed !== 1 ? 's' : ''} Failed`}
      </p>
      <p style="margin:2px 0 0;font-size:12px;color:${allGreen ? '#166534' : '#991b1b'}">
        ${grandPassed} passed · ${grandFailed} failed · ${grandTotal} total
      </p>
    </div>
  </div>

  <div style="padding:28px 36px">

    <!-- Summary cards -->
    <div style="display:flex;gap:12px;margin-bottom:32px">
      ${summaryCard('Total', grandTotal, '#6366f1', '#eef2ff')}
      ${summaryCard('Passed', grandPassed, '#16a34a', '#f0fdf4')}
      ${summaryCard('Failed', grandFailed, '#dc2626', '#fef2f2')}
      ${summaryCard('Skipped', feSkipped, '#d97706', '#fffbeb')}
    </div>

    <!-- Backend section -->
    <h2 style="${S.sectionTitle}">
      ⚙️ Backend Tests — Vitest
      <span style="${S.sectionMeta}">${bePassed}/${beTotal} passed</span>
    </h2>
    ${beRows || '<p style="color:#6b7280;font-style:italic">No results captured.</p>'}

    <div style="height:28px"></div>

    <!-- Frontend section -->
    <h2 style="${S.sectionTitle}">
      🌐 Frontend E2E — Playwright
      <span style="${S.sectionMeta}">${fePassed}/${feTotal} passed</span>
    </h2>
    ${pwRows}

    <div style="height:28px"></div>

    <!-- Conclusions -->
    <div style="background:#f8fafc;border-radius:10px;padding:18px 22px;border-left:4px solid ${allGreen ? '#22c55e' : '#ef4444'}">
      <h3 style="margin:0 0 10px;font-size:14px;font-weight:700;color:#111827">📋 Conclusions</h3>
      <ul style="margin:0;padding-left:20px;font-size:13px;color:#374151;line-height:2">
        ${conclusionItems}
      </ul>
    </div>

  </div>

  <!-- Footer -->
  <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:14px 36px;text-align:center;font-size:11px;color:#94a3b8">
    Generated by Claver HR automated test suite · ${now}
  </div>

</div>
</body>
</html>`;
}

// ── Micro-helpers ──────────────────────────────────────────────────────────────
function passBadge() {
  return `<span style="background:#dcfce7;color:#15803d;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600">PASS</span>`;
}
function failBadge() {
  return `<span style="background:#fee2e2;color:#b91c1c;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600">FAIL</span>`;
}
function summaryCard(label, value, color, bg) {
  return `
    <div style="flex:1;background:${bg};border-radius:10px;padding:16px;text-align:center;border:1px solid ${color}22">
      <p style="margin:0;font-size:30px;font-weight:800;color:${color}">${value}</p>
      <p style="margin:4px 0 0;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:${color};opacity:.8">${label}</p>
    </div>`;
}
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Shared inline styles ───────────────────────────────────────────────────────
const S = {
  sectionTitle: 'margin:0 0 14px;font-size:15px;font-weight:700;border-bottom:2px solid #e2e8f0;padding-bottom:10px;display:flex;justify-content:space-between;align-items:center',
  sectionMeta:  'font-size:12px;font-weight:400;color:#6b7280',
  suiteWrap:    'margin-bottom:12px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden',
  suiteHeader:  'padding:10px 14px;display:flex;justify-content:space-between;align-items:center',
  suiteCount:   'font-size:12px;color:#6b7280',
  table:        'width:100%;border-collapse:collapse',
  testRow:      'border-top:1px solid #f1f5f9',
  testName:     'padding:6px 12px;font-size:12px;color:#374151',
  badgeCell:    'padding:6px 8px;text-align:center;white-space:nowrap',
  durCell:      'padding:6px 10px;text-align:right;white-space:nowrap',
  dur:          'font-size:11px;color:#9ca3af',
  errBlock:     'margin:4px 8px 8px;padding:10px 12px;background:#fff1f2;border-left:3px solid #ef4444;font-size:11px;color:#7f1d1d;white-space:pre-wrap;border-radius:0 4px 4px 0;font-family:monospace',
};

// ══════════════════════════════════════════════════════════════════════════════
//  EMAIL SENDER (Resend)
// ══════════════════════════════════════════════════════════════════════════════

async function sendEmail(html) {
  if (!RESEND_KEY) {
    console.warn('⚠️  RESEND_API_KEY not set — skipping email send.');
    return;
  }

  const subject = `Claver HR Test Report — ${new Date().toLocaleDateString('en-US', { dateStyle: 'medium' })}`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${RESEND_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from:    RESEND_FROM,
      to:      [TO_EMAIL],
      subject,
      html,
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (res.ok) {
    console.log(`✅  Email sent → ${TO_EMAIL}  (id: ${data.id})`);
  } else {
    console.error(`❌  Resend error [${res.status}]:`, JSON.stringify(data));
  }
}
