# Private Memory Map with Local Gemma 4

This repository is a technical blog demo about building a local-first LLM
workflow with Gemma 4. The app lets a user upload travel photos, preserve local
metadata, run local Gemma analysis, and browse trip memories through a map,
timeline, photo detail view, trip summary, and grounded Q&A panel.

The first version focuses on the full-stack shape:

```text
photo upload
  -> EXIF extraction
  -> SQLite metadata
  -> local image storage
  -> explicit Analyze action
  -> background Gemma workflow
  -> photo memories and trip synthesis
  -> grounded Q&A with evidence photo IDs
```

This is not an agent demo. Python controls the sequence and Gemma is called at
fixed checkpoints for image understanding, trip synthesis, and grounded Q&A.

## Repository Layout

```text
backend/
  app/
    api/routes/       FastAPI route modules
    core/             settings and runtime paths
    db/               SQLModel database setup and tables
    schemas/          request and response models
    services/         upload, EXIF, vision, and memory services
    workflows/        prompts, schemas, and deterministic Gemma workflow
  tests/              backend smoke tests
frontend/
  src/
    api/              typed API client
    app/              top-level React app
    components/       upload, map, timeline, photo, insights panels
    pages/            first-screen workspace
archive/
  local_agent_ml_workflow/
```

## Setup

Create and activate the Python environment:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

Install the frontend dependencies:

```powershell
cd frontend
npm install
cd ..
```

## Run Locally

Start the backend:

```powershell
.\.venv\Scripts\python -m uvicorn backend.app.main:app --reload --port 8000
```

Start the frontend:

```powershell
cd frontend
npm run dev
```

Open the Vite URL, usually `http://localhost:5173`.

Runtime data is written under `backend/local_data/` and is ignored by git.

The Analyze button starts a local background job. The frontend polls the job
until it completes, then reloads the trip memory.

## Test

Backend:

```powershell
.\.venv\Scripts\python -m pytest backend/tests
```

Frontend:

```powershell
cd frontend
npm run build
```

## Local Demo Utilities

Reset the local SQLite database and uploaded files:

```powershell
.\.venv\Scripts\python scripts\reset_local_data.py --yes
```

Run the real Gemma workflow against one image. This depends on the local Ollama
model and is intentionally not part of automated tests:

```powershell
.\.venv\Scripts\python scripts\smoke_test_real_workflow.py C:\path\to\travel-photo.jpg
```

## Current API Surface

- `GET /api/health`
- `POST /api/trips`
- `GET /api/trips`
- `GET /api/trips/{trip_id}`
- `POST /api/trips/{trip_id}/photos`
- `GET /api/trips/{trip_id}/photos`
- `POST /api/photos/{photo_id}/analyze`
- `POST /api/trips/{trip_id}/analyze`
- `GET /api/jobs/{job_id}`
- `POST /api/trips/{trip_id}/ask`

## Local Gemma Notes

The Ollama setup notes and Modelfiles are kept at the repository root because
they are still useful for the Gemma 4 workflow:

- `model_setup.md`
- `ollama_modelfiles/`
