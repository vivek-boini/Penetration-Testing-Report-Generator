const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const { reportRouter } = require("./src/routes/reportRoutes");

const app = express();

/**
 * Academic context:
 * Penetration testing is an authorized process of identifying and validating security weaknesses,
 * then producing a report with severity, impact, proof, and remediation.
 *
 * This backend provides:
 * - a simple in-memory "draft" store for the current report inputs
 * - a PDF generation endpoint that converts the generated HTML to a downloadable PDF
 */

// Basic hardening for an API server.
app.use(helmet());

// Allow the static frontend (typically http://localhost:3000 or Live Server) to call the API.
app.use(
  cors({
    origin: "*",
  })
);

// Accept JSON bodies (reports can include large HTML + optional embedded screenshots).
// If this is too small, the HTML gets truncated and PDF generation can produce corrupted files.
app.use(express.json({ limit: "25mb" }));

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api", reportRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});

