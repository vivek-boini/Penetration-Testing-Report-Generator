# Penetration Testing Report Generator Interface

Simple full-stack app to collect penetration testing findings (multiple vulnerabilities) and generate a structured report in **HTML**, with an option to **download as PDF**.

## Folder structure

```
EH-Assignment/
  backend/
    package.json
    server.js
    src/
      routes/
        reportRoutes.js
      services/
        pdfService.js
      storage/
        memoryStore.js
  frontend/
    index.html
    styles.css
    app.js
```

## Prerequisites

- Node.js 18+ (recommended)
- (Optional) MongoDB if you later swap the in-memory store

## Run the backend

```bash
cd backend
npm install
npm start
```

Backend runs on `http://localhost:5000`.

## Run the frontend

You have two easy options:

### Option A (recommended): use VS Code / Cursor “Live Server”

Open `frontend/index.html` and start Live Server.  
Set the API base URL in `frontend/app.js` if needed (defaults to `http://localhost:5000`).

### Option B: serve with Node (quick)

```bash
cd frontend
npx http-server -p 3000
```

Open `http://localhost:3000`.

## How it works

- Add vulnerabilities using the form and **Add Vulnerability**.
- Click **Generate Report** to render a structured HTML report.
- Click **Download HTML** to save the report as `.html`.
- Click **Download PDF** to request a PDF from the backend (headless Chromium).

## Academic enhancements (Ethical Hacking assignment)

- **Predefined vulnerability templates**: SQL Injection, XSS, CSRF, Broken Authentication (auto-fill description/impact/recommendation)
- **Severity color coding**: Low (Green), Medium (Yellow), High (Orange), Critical (Red)
- **CVSS-like scoring**: each finding includes a simple 0–10 score and a score band
- **Optional screenshot upload**: embedded directly into the generated report (as an image)
- **Multiple testers**: add/remove names (useful for group submissions)
- **Sample output**: see `sample-output/sample-report.html`

## Dummy sample data

Click **Load sample data** in the UI to populate the form and add a few example findings.

## Viva (short explanation)

### Project overview

This project is a simple **penetration testing report generator**. It helps students collect findings (vulnerabilities) during an ethical hacking exercise and produces a **professional structured report** in HTML, with an option to download as PDF.

### Architecture

- **Frontend (`frontend/`)**: HTML + CSS + JavaScript
  - Collects project details + multiple findings
  - Applies vulnerability templates (auto-fill)
  - Generates the final report HTML and previews it
  - Downloads report as HTML and requests PDF from backend
- **Backend (`backend/`)**: Node.js + Express
  - Stores a temporary draft in memory (`/api/draft`)
  - Generates PDF from HTML using headless Chromium (`/api/pdf`)

### How it works (flow)

1. User fills project details, adds multiple testers.
2. User adds findings (optionally using templates + screenshot).
3. Frontend generates a structured report in HTML (including severity and score).
4. For PDF, frontend sends the HTML to backend → backend renders it via Puppeteer → returns a downloadable PDF.

# Penetration Testing Report Generator Interface

Simple full-stack app to collect penetration testing findings (multiple vulnerabilities) and generate a structured report in **HTML**, with an option to **download as PDF**.

## Folder structure

```
EH-Assignment/
  backend/
    package.json
    server.js
    src/
      routes/
        reportRoutes.js
      services/
        pdfService.js
      storage/
        memoryStore.js
  frontend/
    index.html
    styles.css
    app.js
```

## Prerequisites

- Node.js 18+ (recommended)
- (Optional) MongoDB if you later swap the in-memory store

## Run the backend

```bash
cd backend
npm install
npm start
```

Backend runs on `http://localhost:5000`.

## Run the frontend

You have two easy options:

### Option A (recommended): use VS Code / Cursor “Live Server”

Open `frontend/index.html` and start Live Server.  
Set the API base URL in `frontend/app.js` if needed (defaults to `http://localhost:5000`).

### Option B: serve with Node (quick)

```bash
cd frontend
npx http-server -p 3000
```

Open `http://localhost:3000`.

## How it works

- Add vulnerabilities using the form and **Add Vulnerability**.
- Click **Generate Report** to render a structured HTML report.
- Click **Download HTML** to save the report as `.html`.
- Click **Download PDF** to request a PDF from the backend (headless Chromium).

## Dummy sample data

Click **Load sample data** in the UI to populate the form and add a few example findings.

