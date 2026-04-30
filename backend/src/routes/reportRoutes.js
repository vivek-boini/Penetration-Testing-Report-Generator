const express = require("express");
const { memoryStore } = require("../storage/memoryStore");
const { htmlToPdfBuffer } = require("../services/pdfService");

const reportRouter = express.Router();

/**
 * Temporary storage API (in-memory).
 * This keeps the project metadata + list of vulnerabilities until the user refreshes/restarts the server.
 *
 * Module responsibility (assignment-friendly):
 * - `/draft`: save/load the current in-progress report inputs (project + findings)
 * - `/pdf`: convert the generated HTML report to a PDF for download
 */
reportRouter.get("/draft", (req, res) => {
  res.json(memoryStore.getDraft());
});

reportRouter.post("/draft", (req, res) => {
  const { project, vulnerabilities } = req.body || {};

  // Minimal validation; frontend does the primary validation.
  if (!project || typeof project !== "object") {
    return res.status(400).json({ error: "project is required" });
  }
  if (!Array.isArray(vulnerabilities)) {
    return res.status(400).json({ error: "vulnerabilities must be an array" });
  }

  memoryStore.setDraft({ project, vulnerabilities });
  res.json({ ok: true });
});

reportRouter.post("/pdf", async (req, res) => {
  const { html, filename } = req.body || {};
  if (!html || typeof html !== "string") {
    return res.status(400).json({ error: "html is required" });
  }

  try {
    const pdfBuffer = await htmlToPdfBuffer(html);
    const safeName = (filename || "pentest-report")
      .toString()
      .replace(/[^a-z0-9-_]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeName || "pentest-report"}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (err) {
    console.error("PDF generation failed:", err);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});

module.exports = { reportRouter };

