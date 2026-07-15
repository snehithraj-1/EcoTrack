# EcoTrack

EcoTrack is a responsive, colorful personal carbon footprint dashboard built with React, Flask, Firebase Authentication, Firebase Firestore, and Groq AI. It supports multi-user login, daily habit logging, carbon calculations, AI eco-swap suggestions, trend charts, heatmaps, streaks, badges, and profile budget settings.

## Project Structure

```text
EcoTrack/
  backend/
    app.py
    firebase_config.py
    routes/
      calculator.py
      habits.py
      suggestions.py
      carbon_interface.py
  frontend/
    src/
      components/
      context/
      pages/
      utils/
```

## Backend

```bash
cd backend
pip install -r requirements.txt
python app.py
```

The Flask API runs on `http://127.0.0.1:5000`.

Copy `backend/.env.example` to `backend/.env`.

For Firebase cloud storage:

1. Create a Firebase project.
2. Enable Firestore Database.
3. Create a service account key from Firebase project settings.
4. Save it as `backend/serviceAccountKey.json`.
5. Keep `FIREBASE_SERVICE_ACCOUNT=serviceAccountKey.json` in `backend/.env`.

When the service account is present, Flask stores each signed-in user's data under:

```text
users/{firebaseUid}
users/{firebaseUid}/daily_logs/{yyyy-mm-dd}
```

The backend verifies the Firebase ID token from the React app before any Firestore read or write. If Firebase credentials are missing, the app falls back to local demo JSON storage.

For Groq AI suggestions, add this to `backend/.env`:

```env
GROQ_API_KEY=your_groq_api_key_here
```

## Frontend

```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

The React app runs on `http://127.0.0.1:5173`.

Copy `frontend/.env.example` to `frontend/.env` and paste your Firebase web app config. Enable Email/Password sign-in in Firebase Authentication. If these values are blank, the frontend opens in demo mode.

## GitHub Codespaces

Do not commit `.env` files or Firebase service account JSON files. Add secrets in GitHub instead.

1. Push this repository to GitHub.
2. Open the repo on GitHub.
3. Select `Code` -> `Codespaces` -> `Create codespace on main`.
4. Add Codespaces secrets in `Settings` -> `Secrets and variables` -> `Codespaces`.

Required backend secrets:

```env
GROQ_API_KEY=your_groq_api_key
CARBON_INTERFACE_API_KEY=your_carbon_interface_key_optional
FIREBASE_WEB_API_KEY=your_firebase_web_api_key
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

Required frontend secrets or `frontend/.env` values:

```env
VITE_FIREBASE_API_KEY=your_firebase_web_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Run backend in one Codespaces terminal:

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

Run frontend in another Codespaces terminal:

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

Open the forwarded `5173` port. If the dashboard says Flask is not running, confirm the forwarded `5000` port is also running and public/visible in the Codespaces Ports tab.

## Verification

```bash
cd frontend
npm run lint
npm run build
```

```bash
cd backend
python -m py_compile app.py routes/calculator.py routes/habits.py routes/suggestions.py routes/carbon_interface.py firebase_config.py
```
