/**
 * Frontend state (temporary in-browser).
 * We also POST the draft to the backend so you can keep it while you iterate.
 *
 * Academic note:
 * - Penetration testing is an authorized security assessment where we try to find and validate weaknesses
 *   in an application/system, then report them clearly with severity, impact, and remediation.
 * - This UI helps collect findings and generates a structured report suitable for submission/viva.
 */
const API_BASE_URL = "http://localhost:3000";

const state = {
  testers: [],
  vulnerabilities: [],
  lastReportHtml: ""
};

const el = (id) => document.getElementById(id);

/**
 * Predefined vulnerability templates for quick academic demonstrations.
 * Selecting a template auto-fills Description/Impact/Recommendation.
 */
const VULNERABILITY_TEMPLATES = {
  "SQL Injection": {
    defaultSeverity: "Critical",
    defaultScore: 9.1,
    description:
      "SQL Injection occurs when an application builds database queries using unsanitized user input. Attackers can manipulate the query logic by injecting SQL syntax.",
    impact:
      "Can lead to unauthorized data access, data modification/deletion, authentication bypass, and in severe cases full database compromise.",
    recommendation:
      "Use parameterized queries (prepared statements) for all database access. Apply server-side input validation, least-privilege DB accounts, and avoid dynamic SQL string concatenation.",
    steps: "1. Identify input field\n2. Inject SQL payload\n3. Observe response",
  },
  "Cross Site Scripting (XSS)": {
    defaultSeverity: "High",
    defaultScore: 7.4,
    description:
      "Cross Site Scripting (XSS) occurs when untrusted input is rendered in the browser without proper output encoding, allowing attackers to execute JavaScript in a victim's session.",
    impact:
      "Can lead to session theft, account takeover, defacement, phishing, and malicious actions performed in the context of the victim.",
    recommendation:
      "Use context-aware output encoding, sanitize rich text if needed, and implement a strong Content Security Policy (CSP). Avoid rendering raw HTML from user input.",
    steps:
      "1. Identify an input field that is reflected/stored (e.g., comment, profile name)\n2. Submit a simple payload like `<script>alert(1)</script>`\n3. Reload the page / view the stored content\n4. If the alert executes, XSS is confirmed",
  },
  CSRF: {
    defaultSeverity: "Medium",
    defaultScore: 6.1,
    description:
      "Cross-Site Request Forgery (CSRF) tricks an authenticated user into performing unintended actions by forcing the browser to send a request to a trusted site.",
    impact:
      "Attackers may perform state-changing actions (e.g., change email/password, create transactions) using the victim's active session.",
    recommendation:
      "Use CSRF tokens for state-changing requests, set SameSite cookies, validate Origin/Referer headers where appropriate, and require re-authentication for sensitive actions.",
    steps:
      "1. Login to the target application in a browser\n2. Identify a state-changing request (e.g., change email/password)\n3. Create a simple HTML form on another page that submits the same request to the target\n4. While still logged in, open the attacker page and submit the form\n5. If the action succeeds without a CSRF token/validation, CSRF is confirmed",
  },
  "Broken Authentication": {
    defaultSeverity: "High",
    defaultScore: 8.0,
    description:
      "Broken Authentication refers to weaknesses in login/session management (e.g., weak passwords, insecure session tokens, missing MFA, improper logout/session invalidation).",
    impact:
      "Attackers may take over accounts via credential stuffing, brute force, session hijacking, or token reuse, leading to unauthorized access and data compromise.",
    recommendation:
      "Enforce strong password policies, rate limiting and lockout controls, secure session cookies (HttpOnly/Secure/SameSite), token rotation, and implement MFA for sensitive accounts.",
    steps:
      "1. Attempt common weak passwords or reuse leaked credentials (only in authorized testing)\n2. Observe whether rate limiting / account lockout is enforced\n3. Login, then test if logout invalidates the session (try reusing old session cookie/token)\n4. Check session cookie flags (HttpOnly, Secure, SameSite)\n5. If sessions can be reused or brute force is possible, broken authentication is confirmed",
  }
};

/**
 * OWASP reference mapping (used in report "References" section).
 * Note: The links below are intentionally kept exactly as provided in the assignment requirements.
 */
const OWASP_REFERENCES = {
  "SQL Injection": {
    owaspCategory: "OWASP Top 10 (2021) - A03: Injection",
    url: "https://owasp.org/Top10/A03_2021-Injection/"
  },
  "Cross Site Scripting (XSS)": {
    owaspCategory: "OWASP Top 10 (2021) - A03: Injection",
    url: "https://owasp.org/Top10/A03_2021-Injection/"
  },
  CSRF: {
    owaspCategory: "OWASP Community - CSRF",
    url: "https://owasp.org/www-community/attacks/csrf"
  },
  "Broken Authentication": {
    owaspCategory: "OWASP Top 10 (2021) - A07: Identification and Authentication Failures",
    url: "https://owasp.org/Top10/A07_2021-Identification_and_Authentication_Failures/"
  }
};

const ui = {
  projectName: el("projectName"),
  testerName: el("testerName"),
  btnAddTester: el("btnAddTester"),
  testerChips: el("testerChips"),
  testDate: el("testDate"),
  target: el("target"),

  template: el("template"),
  vulnName: el("vulnName"),
  severity: el("severity"),
  cvssScore: el("cvssScore"),
  description: el("description"),
  steps: el("steps"),
  impact: el("impact"),
  recommendation: el("recommendation"),
  screenshot: el("screenshot"),
  screenshotHint: el("screenshotHint"),

  btnAddVuln: el("btnAddVuln"),
  btnClearVulnForm: el("btnClearVulnForm"),
  btnGenerate: el("btnGenerate"),
  btnDownloadHtml: el("btnDownloadHtml"),
  btnDownloadPdf: el("btnDownloadPdf"),
  btnClearAll: el("btnClearAll"),
  btnLoadSample: el("btnLoadSample"),

  status: el("status"),
  vulnCount: el("vulnCount"),
  vulnTableBody: el("vulnTableBody"),
  reportFrame: el("reportFrame")
};

function setStatus(message) {
  ui.status.textContent = message || "";
}

function getProject() {
  return {
    projectName: ui.projectName.value.trim(),
    testers: [...state.testers],
    date: ui.testDate.value,
    target: ui.target.value.trim()
  };
}

function clearVulnerabilityForm() {
  ui.template.value = "";
  ui.vulnName.value = "";
  ui.severity.value = "Low";
  ui.cvssScore.value = "5.0";
  ui.description.value = "";
  ui.steps.value = "";
  ui.impact.value = "";
  ui.recommendation.value = "";
  ui.screenshot.value = "";
  ui.screenshotHint.textContent = "No file selected.";
  ui.screenshotHint.dataset.dataUrl = "";
  ui.screenshotHint.dataset.fileName = "";
}

function validateVulnerability(v) {
  if (!v.vulnerabilityName) return "Vulnerability Name is required";
  if (!v.severity) return "Severity is required";
  if (typeof v.cvssScore !== "number" || Number.isNaN(v.cvssScore)) return "Score must be a number";
  if (v.cvssScore < 0 || v.cvssScore > 10) return "Score must be between 0 and 10";
  if (!v.description) return "Description is required";
  if (!v.stepsToReproduce) return "Steps to Reproduce is required";
  if (!v.impact) return "Impact is required";
  if (!v.recommendation) return "Recommendation is required";
  return null;
}

function createVulnerabilityFromForm() {
  const dataUrl = ui.screenshotHint.dataset.dataUrl || "";
  const fileName = ui.screenshotHint.dataset.fileName || "";

  return {
    id: crypto.randomUUID(),
    template: ui.template.value || "",
    vulnerabilityName: ui.vulnName.value.trim(),
    severity: ui.severity.value,
    cvssScore: Number(ui.cvssScore.value),
    description: ui.description.value.trim(),
    stepsToReproduce: ui.steps.value.trim(),
    impact: ui.impact.value.trim(),
    recommendation: ui.recommendation.value.trim(),
    screenshot: dataUrl ? { fileName, dataUrl } : null
  };
}

function severityRank(severity) {
  switch (severity) {
    case "Critical":
      return 4;
    case "High":
      return 3;
    case "Medium":
      return 2;
    case "Low":
    default:
      return 1;
  }
}

function escapeHtml(str) {
  return (str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(isoDate) {
  if (!isoDate) return "";
  try {
    const d = new Date(isoDate);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
  } catch {
    return isoDate;
  }
}

function severityColor(severity) {
  switch (severity) {
    case "Critical":
      return "#ef4444";
    case "High":
      return "#f97316";
    case "Medium":
      return "#eab308";
    case "Low":
    default:
      return "#22c55e";
  }
}

function cvssBand(score) {
  if (score >= 9.0) return "Critical";
  if (score >= 7.0) return "High";
  if (score >= 4.0) return "Medium";
  return "Low";
}

function getOwaspReferenceForVulnerability(vuln) {
  // Prefer the explicit template selection.
  const byTemplate = vuln.template && OWASP_REFERENCES[vuln.template];
  if (byTemplate) {
    return {
      vulnerability: vuln.template,
      owaspCategory: byTemplate.owaspCategory,
      url: byTemplate.url
    };
  }

  // Fallback: if a user typed the name (without selecting template) try to match known template keys.
  const name = (vuln.vulnerabilityName || "").toLowerCase();
  const knownTemplates = Object.keys(OWASP_REFERENCES);
  for (const t of knownTemplates) {
    if (name.includes(t.toLowerCase())) {
      return {
        vulnerability: t,
        owaspCategory: OWASP_REFERENCES[t].owaspCategory,
        url: OWASP_REFERENCES[t].url
      };
    }
  }

  // Not mapped to OWASP reference (custom finding).
  return {
    vulnerability: vuln.vulnerabilityName || "Custom finding",
    owaspCategory: "Not mapped",
    url: ""
  };
}

function buildReferencesForReport(vulnerabilities) {
  // Optional requirement: avoid duplicates (dedupe on URL + category + vulnerability label).
  const seen = new Set();
  const refs = [];

  vulnerabilities.forEach((v) => {
    const r = getOwaspReferenceForVulnerability(v);
    const key = `${r.vulnerability}__${r.owaspCategory}__${r.url}`;
    if (seen.has(key)) return;
    seen.add(key);
    refs.push(r);
  });

  // Keep stable, readable order: mapped first, then unmapped.
  refs.sort((a, b) => {
    const aMapped = a.url ? 0 : 1;
    const bMapped = b.url ? 0 : 1;
    if (aMapped !== bMapped) return aMapped - bMapped;
    return a.vulnerability.localeCompare(b.vulnerability);
  });

  return refs;
}

function computeExecutiveSummary(project, vulnerabilities) {
  if (!vulnerabilities.length) return "No vulnerabilities were recorded.";

  const bySeverity = vulnerabilities.reduce((acc, v) => {
    acc[v.severity] = (acc[v.severity] || 0) + 1;
    return acc;
  }, {});

  const parts = ["This assessment identified the following findings:"];
  const order = ["Critical", "High", "Medium", "Low"];
  order.forEach((sev) => {
    if (bySeverity[sev]) parts.push(`${bySeverity[sev]} ${sev}`);
  });

  const top = [...vulnerabilities].sort((a, b) => {
    const sevDiff = severityRank(b.severity) - severityRank(a.severity);
    if (sevDiff !== 0) return sevDiff;
    return (b.cvssScore || 0) - (a.cvssScore || 0);
  })[0];
  const target = project.target ? ` on the target "${project.target}"` : "";

  return `${parts.join(", ")}.${target} The most severe finding was "${top.vulnerabilityName}" (${top.severity}, score ${Number(
    top.cvssScore || 0
  ).toFixed(1)}).`;
}

function computeRecommendations(vulnerabilities) {
  if (!vulnerabilities.length) return [];
  return [...vulnerabilities]
    .sort((a, b) => {
      const sevDiff = severityRank(b.severity) - severityRank(a.severity);
      if (sevDiff !== 0) return sevDiff;
      return (b.cvssScore || 0) - (a.cvssScore || 0);
    })
    .map((v) => ({
      severity: v.severity,
      score: v.cvssScore,
      title: v.vulnerabilityName,
      recommendation: v.recommendation
    }));
}

function generateReportHtml(project, vulnerabilities) {
  const execSummary = computeExecutiveSummary(project, vulnerabilities);
  const recs = computeRecommendations(vulnerabilities);
  const references = buildReferencesForReport(vulnerabilities);

  const highest = getHighestSeverity(vulnerabilities);
  const testersText = (project.testers || []).length
    ? project.testers.join(", ")
    : "-";

  const style = `
    :root { --ink:#0b1220; --muted:#475569; --border:#e2e8f0; --bg:#f8fafc; --accent:#2563eb; }
    *{ box-sizing:border-box; }
    body{ margin:0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
      color:var(--ink); background:var(--bg); }
    .page{ padding:28px; }
    .card{ background:#fff; border:1px solid var(--border); border-radius:14px; padding:18px; box-shadow: 0 10px 30px rgba(2,6,23,.06); }
    h1,h2,h3{ margin:0 0 10px; }
    h1{ font-size:28px; }
    h2{ font-size:16px; margin-top:18px; text-transform:uppercase; letter-spacing:.4px; color:#0f172a; }
    h3{ font-size:14px; margin-top:14px; color:#0f172a; }
    p{ margin:0 0 10px; line-height:1.45; color:#0f172a; }
    .muted{ color:var(--muted); }
    .grid{ display:grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .kvs{ display:grid; gap:6px; font-size:13px; }
    .kv{ display:flex; gap:8px; }
    .kv b{ width:140px; color:#0f172a; }
    .hr{ height:1px; background:var(--border); margin:14px 0; }
    .sev{ display:inline-flex; align-items:center; gap:8px; border:1px solid var(--border); border-radius:999px; padding:5px 10px; font-size:12px; }
    .dot{ width:10px; height:10px; border-radius:999px; }
    .finding{ border:1px solid var(--border); border-radius:12px; padding:12px; margin-top:10px; }
    .finding__head{ display:flex; justify-content:space-between; gap:10px; align-items:flex-start; }
    .finding__title{ font-weight:700; }
    .tag{ border-radius:999px; padding:4px 10px; font-size:12px; color:#0f172a; border:1px solid var(--border); background:#f1f5f9; }
    .tag--Critical{ background: rgba(239, 68, 68, .12); border-color: rgba(239, 68, 68, .25); }
    .tag--High{ background: rgba(249, 115, 22, .12); border-color: rgba(249, 115, 22, .25); }
    .tag--Medium{ background: rgba(234, 179, 8, .12); border-color: rgba(234, 179, 8, .25); }
    .tag--Low{ background: rgba(34, 197, 94, .12); border-color: rgba(34, 197, 94, .25); }
    .badge{ display:inline-flex; align-items:center; gap:8px; border-radius:999px; padding:5px 10px; font-size:12px; border:1px solid var(--border); background:#f8fafc; }
    .scorebar{ height:10px; background:#e2e8f0; border-radius:999px; overflow:hidden; border:1px solid #e2e8f0; }
    .scorebar > i{ display:block; height:100%; width:0; background: var(--accent); }
    .tbl{ width:100%; border-collapse: collapse; margin-top:10px; font-size:13px; }
    .tbl th,.tbl td{ border-bottom:1px solid var(--border); padding:8px; text-align:left; vertical-align:top; }
    .tbl th{ color: #0f172a; background:#f8fafc; font-weight:700; }
    .img{ max-width:100%; border:1px solid var(--border); border-radius:12px; margin-top:8px; }
    ol, ul { margin: 8px 0 10px 18px; padding:0; }
    .toc li{ margin: 4px 0; }
    @media print { .page{ padding:0; } }
  `;

  const titlePage = `
    <div class="page">
      <div class="card">
        <h1>${escapeHtml(project.projectName || "Penetration Testing Report")}</h1>
        <p class="muted">Professional report format (generated HTML/PDF)</p>
        <div class="hr"></div>
        <div class="grid">
          <div class="kvs">
            <div class="kv"><b>Testers</b><span>${escapeHtml(testersText)}</span></div>
            <div class="kv"><b>Date</b><span>${escapeHtml(formatDate(project.date) || "-")}</span></div>
            <div class="kv"><b>Target</b><span>${escapeHtml(project.target || "-")}</span></div>
          </div>
          <div class="kvs">
            <div class="kv"><b>Total Findings</b><span>${vulnerabilities.length}</span></div>
            <div class="kv"><b>Highest Severity</b><span>${escapeHtml(highest || "-")}</span></div>
            <div class="kv"><b>Scoring Model</b><span>CVSS-like (0–10)</span></div>
          </div>
        </div>
        <div class="hr"></div>
        <h2>Table of Contents</h2>
        <ol class="toc">
          <li>Executive Summary</li>
          <li>Scope</li>
          <li>Methodology</li>
          <li>Findings</li>
          <li>Risk Classification</li>
          <li>Recommendations</li>
          <li>Conclusion</li>
          <li>References</li>
        </ol>
      </div>
    </div>
  `;

  const executiveSummary = `
    <div class="page">
      <div class="card">
        <h2>Executive Summary</h2>
        <p>${escapeHtml(execSummary)}</p>
        <p class="muted">
          Note: This report is generated from the provided inputs and is intended as a structured starting point.
        </p>
      </div>
    </div>
  `;

  const scope = `
    <div class="page">
      <div class="card">
        <h2>Scope</h2>
        <p><b>Target:</b> ${escapeHtml(project.target || "Not specified")}</p>
        <p class="muted">
          Scope should include in-scope hosts/apps, excluded systems, and any testing constraints agreed with stakeholders.
        </p>
      </div>
    </div>
  `;

  const methodology = `
    <div class="page">
      <div class="card">
        <h2>Methodology</h2>
        <ul>
          <li>Information gathering and reconnaissance</li>
          <li>Automated scanning (where applicable)</li>
          <li>Manual verification and exploitation attempts</li>
          <li>Risk rating and remediation guidance</li>
        </ul>
        <p class="muted">
          Adjust methodology to match your engagement (web app, network, API, mobile, etc.).
        </p>
      </div>
    </div>
  `;

  const findings = `
    <div class="page">
      <div class="card">
        <h2>Findings</h2>
        ${vulnerabilities.length ? "" : `<p class="muted">No findings added.</p>`}
        ${
          vulnerabilities.length
            ? `
              <h3>Findings Summary</h3>
              <table class="tbl">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Finding</th>
                    <th>Severity</th>
                    <th>Score</th>
                    <th>Score Band</th>
                  </tr>
                </thead>
                <tbody>
                  ${vulnerabilities
                    .map(
                      (v, i) => `
                      <tr>
                        <td>${i + 1}</td>
                        <td>${escapeHtml(v.vulnerabilityName)}</td>
                        <td><span class="tag tag--${escapeHtml(v.severity)}">${escapeHtml(v.severity)}</span></td>
                        <td>${Number(v.cvssScore || 0).toFixed(1)}</td>
                        <td>${escapeHtml(cvssBand(Number(v.cvssScore || 0)))}</td>
                      </tr>
                    `
                    )
                    .join("")}
                </tbody>
              </table>
              <div class="hr"></div>
            `
            : ""
        }
        ${vulnerabilities
          .map((v, idx) => {
            const score = Number(v.cvssScore || 0);
            const pct = Math.max(0, Math.min(100, (score / 10) * 100));
            const barColor = severityColor(cvssBand(score));

            return `
              <div class="finding">
                <div class="finding__head">
                  <div>
                    <div class="finding__title">${idx + 1}. ${escapeHtml(v.vulnerabilityName)}</div>
                    <div class="muted" style="font-size:12px;margin-top:2px;">
                      Finding ID: ${escapeHtml(v.id)}${v.template ? ` • Template: ${escapeHtml(v.template)}` : ""}
                    </div>
                  </div>
                  <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap; justify-content:flex-end;">
                    <span class="tag tag--${escapeHtml(v.severity)}">${escapeHtml(v.severity)}</span>
                    <span class="badge"><b>Score</b> ${Number(score).toFixed(1)} / 10</span>
                  </div>
                </div>
                <div style="margin-top:10px;">
                  <div class="scorebar"><i style="width:${pct}%; background:${barColor};"></i></div>
                  <div class="muted" style="font-size:12px;margin-top:6px;">
                    Score band: <b>${escapeHtml(cvssBand(score))}</b> (simple academic scoring)
                  </div>
                </div>
                <div class="hr"></div>
                <h3>Description</h3>
                <p>${nl2br(escapeHtml(v.description))}</p>
                <h3>Steps to Reproduce</h3>
                <p>${nl2br(escapeHtml(v.stepsToReproduce))}</p>
                <h3>Impact</h3>
                <p>${nl2br(escapeHtml(v.impact))}</p>
                <h3>Recommendation</h3>
                <p>${nl2br(escapeHtml(v.recommendation))}</p>
                ${
                  v.screenshot && v.screenshot.dataUrl
                    ? `
                      <h3>Screenshot (Proof of Concept)</h3>
                      <p class="muted">${escapeHtml(v.screenshot.fileName || "screenshot")}</p>
                      <img class="img" src="${escapeHtml(v.screenshot.dataUrl)}" alt="Screenshot"/>
                    `
                    : ""
                }
              </div>
            `;
          })
          .join("")}
      </div>
    </div>
  `;

  const riskClassification = `
    <div class="page">
      <div class="card">
        <h2>Risk Classification</h2>
        <p class="muted">
          Severity uses a simple academic scale (Low/Medium/High/Critical). Score uses a CVSS-like 0–10 value per finding.
        </p>
        <table class="tbl" style="margin-top:12px;">
          <thead>
            <tr>
              <th>Band</th>
              <th>Score Range</th>
              <th>Meaning (simple)</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Critical</td><td>9.0 – 10.0</td><td>Immediate remediation recommended</td></tr>
            <tr><td>High</td><td>7.0 – 8.9</td><td>Fix as a priority</td></tr>
            <tr><td>Medium</td><td>4.0 – 6.9</td><td>Fix in normal cycle</td></tr>
            <tr><td>Low</td><td>0.0 – 3.9</td><td>Monitor / low-risk improvements</td></tr>
          </tbody>
        </table>
        <div class="hr"></div>
        <p>
          In real-world reporting, CVSS uses a detailed formula. Here we use a simplified numeric score to keep the assignment easy to understand.
        </p>
      </div>
    </div>
  `;

  const recommendations = `
    <div class="page">
      <div class="card">
        <h2>Recommendations</h2>
        ${
          recs.length
            ? `<ol>${recs
                .map(
                  (r) =>
                    `<li><b>${escapeHtml(r.title)}</b> <span class="muted">(${escapeHtml(
                      r.severity
                    )}, score ${Number(r.score || 0).toFixed(1)})</span><br/>${nl2br(
                      escapeHtml(r.recommendation)
                    )}</li>`
                )
                .join("")}</ol>`
            : `<p class="muted">No recommendations (no findings).</p>`
        }
      </div>
    </div>
  `;

  const conclusion = `
    <div class="page">
      <div class="card">
        <h2>Conclusion</h2>
        <p>
          Remediate the identified findings in order of severity, then retest to confirm fixes.
          Maintaining secure development practices and monitoring will reduce the likelihood of recurrence.
        </p>
      </div>
    </div>
  `;

  const referencesSection = `
    <div class="page">
      <div class="card">
        <h2>References</h2>
        ${
          references.length
            ? `
              <p class="muted">
                OWASP links for predefined vulnerability templates used in this report (duplicates removed).
              </p>
              <table class="tbl" style="margin-top:12px;">
                <thead>
                  <tr>
                    <th>Vulnerability</th>
                    <th>OWASP Category</th>
                    <th>Link</th>
                  </tr>
                </thead>
                <tbody>
                  ${references
                    .map((r) => {
                      const link = r.url
                        ? `<a href="${escapeHtml(r.url)}" target="_blank" rel="noreferrer">${escapeHtml(
                            r.url
                          )}</a>`
                        : `<span class="muted">-</span>`;
                      return `
                        <tr>
                          <td>${escapeHtml(r.vulnerability)}</td>
                          <td>${escapeHtml(r.owaspCategory)}</td>
                          <td>${link}</td>
                        </tr>
                      `;
                    })
                    .join("")}
                </tbody>
              </table>
            `
            : `<p class="muted">No references (no findings).</p>`
        }
      </div>
    </div>
  `;

  // Combine all pages.
  const fullHtml = `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${escapeHtml(project.projectName || "Penetration Testing Report")}</title>
      <style>${style}</style>
    </head>
    <body>
      ${titlePage}
      ${executiveSummary}
      ${scope}
      ${methodology}
      ${findings}
      ${riskClassification}
      ${recommendations}
      ${conclusion}
      ${referencesSection}
    </body>
  </html>`;

  return fullHtml;
}

function nl2br(str) {
  return (str || "").replaceAll("\n", "<br/>");
}

function getHighestSeverity(vulnerabilities) {
  if (!vulnerabilities.length) return "";
  return [...vulnerabilities].sort((a, b) => {
    const sevDiff = severityRank(b.severity) - severityRank(a.severity);
    if (sevDiff !== 0) return sevDiff;
    return (b.cvssScore || 0) - (a.cvssScore || 0);
  })[0].severity;
}

function renderVulnerabilityTable() {
  ui.vulnCount.textContent = String(state.vulnerabilities.length);

  if (!state.vulnerabilities.length) {
    ui.vulnTableBody.innerHTML = `<tr><td colspan="5" class="muted">No vulnerabilities added yet.</td></tr>`;
    return;
  }

  ui.vulnTableBody.innerHTML = state.vulnerabilities
    .map((v, idx) => {
      return `
        <tr>
          <td>${idx + 1}</td>
          <td>${escapeHtml(v.vulnerabilityName)}</td>
          <td><span class="pill pill--${escapeHtml(v.severity)}">${escapeHtml(v.severity)}</span></td>
          <td>${Number(v.cvssScore || 0).toFixed(1)}</td>
          <td class="right">
            <button class="btn btn--secondary" type="button" data-action="remove" data-id="${escapeHtml(
              v.id
            )}">Remove</button>
          </td>
        </tr>
      `;
    })
    .join("");
}

async function saveDraftToApi() {
  const payload = {
    project: getProject(),
    vulnerabilities: state.vulnerabilities
  };

  try {
    await fetch(`${API_BASE_URL}/api/draft`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch {
    // If the API isn't running, we still allow local report generation.
  }
}

function downloadTextFile(filename, text, mimeType) {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function downloadPdfFromApi(filename, html) {
  const res = await fetch(`${API_BASE_URL}/api/pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ html, filename })
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "PDF generation failed");
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function setReportPreview(html) {
  state.lastReportHtml = html;
  ui.reportFrame.srcdoc = html;
  ui.btnDownloadHtml.disabled = !html;
  ui.btnDownloadPdf.disabled = !html;
}

function buildSafeFilename(projectName) {
  const base = (projectName || "pentest-report")
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return base || "pentest-report";
}

function loadSampleData() {
  ui.projectName.value = "ACME Web App Penetration Test";
  state.testers = ["Security Team", "Student A"];
  renderTesterChips();
  ui.testerName.value = "";
  ui.testDate.value = new Date().toISOString().slice(0, 10);
  ui.target.value = "https://acme.example.com";

  state.vulnerabilities = [
    {
      id: crypto.randomUUID(),
      template: "Cross Site Scripting (XSS)",
      vulnerabilityName: "Stored XSS in Product Reviews",
      severity: "High",
      cvssScore: 7.6,
      description:
        "User-supplied HTML/JS is stored and rendered without proper output encoding in the product reviews feature.",
      stepsToReproduce:
        "1. Login as a normal user\n2. Navigate to a product page\n3. Submit a review containing `<img src=x onerror=alert(1)>`\n4. View the review as another user or admin",
      impact:
        "Attackers can execute arbitrary JavaScript in a victim's browser, leading to session theft, account takeover, or malicious actions performed on behalf of the user.",
      recommendation:
        "Apply output encoding (context-aware) for all user-supplied data. Consider using a safe HTML sanitizer if rich text is required. Add a Content Security Policy (CSP).",
      screenshot: null
    },
    {
      id: crypto.randomUUID(),
      template: "",
      vulnerabilityName: "IDOR in Order Details Endpoint",
      severity: "Critical",
      cvssScore: 9.0,
      description:
        "The order details API endpoint does not properly authorize access, allowing a user to request other users' orders by changing an ID.",
      stepsToReproduce:
        "1. Login as user A\n2. Capture request to `/api/orders/12345`\n3. Change the ID to another user's order ID\n4. Observe sensitive details in the response",
      impact:
        "Unauthorized access to sensitive customer data (PII, addresses, order contents) and potential fraud.",
      recommendation:
        "Enforce authorization checks server-side: verify the order belongs to the authenticated user (or role). Use opaque identifiers to reduce enumeration risk.",
      screenshot: null
    },
    {
      id: crypto.randomUUID(),
      template: "",
      vulnerabilityName: "Verbose Error Messages",
      severity: "Low",
      cvssScore: 3.1,
      description:
        "Internal stack traces and framework error details are returned to the client on certain invalid requests.",
      stepsToReproduce:
        "1. Send malformed JSON to an API endpoint\n2. Observe stack trace in the response",
      impact:
        "Information disclosure that may help attackers understand internals and craft targeted attacks.",
      recommendation:
        "Return generic error messages to clients; log detailed errors server-side only. Disable debug mode in production.",
      screenshot: null
    }
  ];

  renderVulnerabilityTable();
  setReportPreview("");
  setStatus("Sample data loaded. Click Generate Report.");
  saveDraftToApi();
}

function renderTesterChips() {
  if (!state.testers.length) {
    ui.testerChips.innerHTML = `<span class="muted">No testers added yet.</span>`;
    return;
  }

  ui.testerChips.innerHTML = state.testers
    .map(
      (name) => `
      <span class="chip">
        ${escapeHtml(name)}
        <button class="chip__x" type="button" aria-label="Remove tester" data-action="removeTester" data-name="${escapeHtml(
          name
        )}">×</button>
      </span>
    `
    )
    .join("");
}

function addTester(name) {
  const n = (name || "").trim();
  if (!n) return "Tester name cannot be empty";
  if (state.testers.some((t) => t.toLowerCase() === n.toLowerCase())) return "Tester already added";
  state.testers.push(n);
  renderTesterChips();
  return null;
}

function applyTemplate(templateName) {
  const tpl = VULNERABILITY_TEMPLATES[templateName];
  if (!tpl) return;

  // Auto-fill the core academic fields; keep Steps as user-entered.
  if (!ui.vulnName.value.trim()) ui.vulnName.value = templateName;
  ui.description.value = tpl.description;
  ui.impact.value = tpl.impact;
  ui.recommendation.value = tpl.recommendation;
  ui.steps.value = tpl.steps || "";
  ui.severity.value = tpl.defaultSeverity;
  ui.cvssScore.value = String(tpl.defaultScore.toFixed(1));
}

async function readScreenshotFile(file) {
  if (!file) return { dataUrl: "", fileName: "" };

  // Keep it simple: store as a data URL for embedding directly into HTML/PDF.
  // For academic assignments this is fine; for real systems you'd upload to storage.
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });

  return { dataUrl, fileName: file.name || "screenshot" };
}

// Event wiring
ui.btnAddTester.addEventListener("click", async () => {
  setStatus("");
  const err = addTester(ui.testerName.value);
  if (err) return setStatus(err);
  ui.testerName.value = "";
  setStatus("Tester added.");
  await saveDraftToApi();
});

ui.testerChips.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action='removeTester']");
  if (!btn) return;
  const name = btn.dataset.name || "";
  state.testers = state.testers.filter((t) => t !== name);
  renderTesterChips();
  setStatus("Tester removed.");
  await saveDraftToApi();
});

ui.template.addEventListener("change", () => {
  const name = ui.template.value;
  if (!name) return;
  applyTemplate(name);
  setStatus(`Template applied: ${name}`);
});

ui.screenshot.addEventListener("change", async () => {
  setStatus("");
  const file = ui.screenshot.files && ui.screenshot.files[0];
  if (!file) {
    ui.screenshotHint.textContent = "No file selected.";
    ui.screenshotHint.dataset.dataUrl = "";
    ui.screenshotHint.dataset.fileName = "";
    return;
  }

  // Small UX: show filename, then store the data URL in the hint element's dataset.
  ui.screenshotHint.textContent = `Selected: ${file.name}`;
  try {
    const { dataUrl, fileName } = await readScreenshotFile(file);
    ui.screenshotHint.dataset.dataUrl = dataUrl;
    ui.screenshotHint.dataset.fileName = fileName;
    setStatus("Screenshot attached (will be embedded in report).");
  } catch {
    ui.screenshotHint.textContent = "Failed to read file.";
    ui.screenshotHint.dataset.dataUrl = "";
    ui.screenshotHint.dataset.fileName = "";
    setStatus("Screenshot failed to attach.");
  }
});

ui.btnAddVuln.addEventListener("click", async () => {
  setStatus("");

  const v = createVulnerabilityFromForm();
  const err = validateVulnerability(v);
  if (err) return setStatus(err);

  state.vulnerabilities.push(v);
  renderVulnerabilityTable();
  clearVulnerabilityForm();
  setReportPreview("");
  setStatus("Vulnerability added.");
  await saveDraftToApi();
});

ui.btnClearVulnForm.addEventListener("click", () => {
  clearVulnerabilityForm();
  setStatus("Fields cleared.");
});

ui.vulnTableBody.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const action = btn.dataset.action;
  const id = btn.dataset.id;

  if (action === "remove") {
    state.vulnerabilities = state.vulnerabilities.filter((v) => v.id !== id);
    renderVulnerabilityTable();
    setReportPreview("");
    setStatus("Removed vulnerability.");
    await saveDraftToApi();
  }
});

ui.btnGenerate.addEventListener("click", async () => {
  setStatus("");
  const project = getProject();

  if (!project.projectName) return setStatus("Project Name is required");
  if (!project.testers.length) return setStatus("Add at least one tester");
  if (!project.date) return setStatus("Date is required");
  if (!project.target) return setStatus("Target is required");

  const html = generateReportHtml(project, state.vulnerabilities);
  setReportPreview(html);
  setStatus("Report generated.");
  await saveDraftToApi();
});

ui.btnDownloadHtml.addEventListener("click", () => {
  const project = getProject();
  const filename = buildSafeFilename(project.projectName);
  downloadTextFile(`${filename}.html`, state.lastReportHtml, "text/html;charset=utf-8");
});

ui.btnDownloadPdf.addEventListener("click", async () => {
  setStatus("Generating PDF…");
  const project = getProject();
  const filename = buildSafeFilename(project.projectName);

  try {
    await downloadPdfFromApi(filename, state.lastReportHtml);
    setStatus("PDF downloaded.");
  } catch (err) {
    setStatus(
      `PDF failed. Make sure backend is running. (${String(err.message || err)})`
    );
  }
});

ui.btnClearAll.addEventListener("click", async () => {
  ui.projectName.value = "";
  ui.testerName.value = "";
  state.testers = [];
  renderTesterChips();
  ui.testDate.value = "";
  ui.target.value = "";
  clearVulnerabilityForm();
  state.vulnerabilities = [];
  renderVulnerabilityTable();
  setReportPreview("");
  setStatus("Cleared all data.");
  await saveDraftToApi();
});

ui.btnLoadSample.addEventListener("click", () => {
  loadSampleData();
});

// Initialize defaults
renderVulnerabilityTable();
renderTesterChips();
ui.testDate.value = new Date().toISOString().slice(0, 10);
setStatus("Tip: Load sample data to test quickly.");

