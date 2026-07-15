import json
import os
import threading
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path

try:
    import firebase_admin
    from firebase_admin import auth as firebase_auth
    from firebase_admin import credentials, firestore
except ImportError:  # Firebase is optional for local demo mode.
    firebase_admin = None
    firebase_auth = None
    credentials = None
    firestore = None


BASE_DIR = Path(__file__).resolve().parent
LOCAL_STORE_PATH = BASE_DIR / "data" / "ecotrack_store.json"

DEFAULT_SETTINGS = {
    "name": "Eco Learner",
    "daily_budget": 8.0,
    "country": "India",
    "avatar": "",
    "theme": "light",
    "notifications": True,
    "language": "English",
    "weekly_goal": "Stay under budget 5 days this week",
}


def now_iso():
    return datetime.now(timezone.utc).isoformat()


class LocalStore:
    def __init__(self, path=LOCAL_STORE_PATH):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.lock = threading.Lock()
        if not self.path.exists():
            self._write({"users": {}})

    def _read(self):
        try:
            return json.loads(self.path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, FileNotFoundError):
            return {"users": {}}

    def _write(self, payload):
        self.path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    def _ensure_user(self, data, user_id):
        users = data.setdefault("users", {})
        return users.setdefault(
            user_id,
            {
                "settings": deepcopy(DEFAULT_SETTINGS),
                "logs": {},
                "badges": [],
            },
        )

    def get_settings(self, user_id):
        with self.lock:
            data = self._read()
            user = self._ensure_user(data, user_id)
            self._write(data)
            return deepcopy(user["settings"])

    def save_settings(self, user_id, settings):
        with self.lock:
            data = self._read()
            user = self._ensure_user(data, user_id)
            merged = {**DEFAULT_SETTINGS, **user.get("settings", {}), **settings}
            merged["daily_budget"] = float(merged.get("daily_budget", DEFAULT_SETTINGS["daily_budget"]))
            user["settings"] = merged
            user["updated_at"] = now_iso()
            self._write(data)
            return deepcopy(merged)

    def save_log(self, user_id, date_key, log):
        with self.lock:
            data = self._read()
            user = self._ensure_user(data, user_id)
            log_record = {**log, "date": date_key, "updated_at": now_iso()}
            user.setdefault("logs", {})[date_key] = log_record
            user["updated_at"] = now_iso()
            self._write(data)
            return deepcopy(log_record)

    def get_history(self, user_id, limit=30):
        with self.lock:
            data = self._read()
            user = self._ensure_user(data, user_id)
            logs = list(user.setdefault("logs", {}).values())
            self._write(data)
        return sorted(logs, key=lambda item: item.get("date", ""), reverse=True)[:limit]

    def get_log(self, user_id, date_key):
        with self.lock:
            data = self._read()
            user = self._ensure_user(data, user_id)
            self._write(data)
            return deepcopy(user.setdefault("logs", {}).get(date_key))

    def get_badges(self, user_id):
        with self.lock:
            data = self._read()
            user = self._ensure_user(data, user_id)
            self._write(data)
            return deepcopy(user.get("badges", []))

    def save_badges(self, user_id, badges):
        with self.lock:
            data = self._read()
            user = self._ensure_user(data, user_id)
            user["badges"] = badges
            user["updated_at"] = now_iso()
            self._write(data)
            return deepcopy(badges)

    def reset_data(self, user_id):
        with self.lock:
            data = self._read()
            user = self._ensure_user(data, user_id)
            user["logs"] = {}
            user["badges"] = []
            user["updated_at"] = now_iso()
            self._write(data)
            return True


class FirestoreStore:
    def __init__(self, db):
        self.db = db

    def user_ref(self, user_id):
        return self.db.collection("users").document(user_id)

    def get_settings(self, user_id):
        snapshot = self.user_ref(user_id).get()
        if not snapshot.exists:
            self.user_ref(user_id).set({"settings": DEFAULT_SETTINGS, "created_at": firestore.SERVER_TIMESTAMP})
            return deepcopy(DEFAULT_SETTINGS)
        return {**DEFAULT_SETTINGS, **snapshot.to_dict().get("settings", {})}

    def save_settings(self, user_id, settings):
        merged = {**self.get_settings(user_id), **settings}
        merged["daily_budget"] = float(merged.get("daily_budget", DEFAULT_SETTINGS["daily_budget"]))
        self.user_ref(user_id).set({"settings": merged, "updated_at": firestore.SERVER_TIMESTAMP}, merge=True)
        return merged

    def save_log(self, user_id, date_key, log):
        log_record = {**log, "date": date_key, "updated_at": now_iso()}
        self.user_ref(user_id).collection("daily_logs").document(date_key).set(log_record, merge=True)
        self.user_ref(user_id).set({"updated_at": firestore.SERVER_TIMESTAMP}, merge=True)
        return log_record

    def get_history(self, user_id, limit=30):
        query = (
            self.user_ref(user_id)
            .collection("daily_logs")
            .order_by("date", direction=firestore.Query.DESCENDING)
            .limit(limit)
        )
        return [doc.to_dict() for doc in query.stream()]

    def get_log(self, user_id, date_key):
        snapshot = self.user_ref(user_id).collection("daily_logs").document(date_key).get()
        return snapshot.to_dict() if snapshot.exists else None

    def get_badges(self, user_id):
        snapshot = self.user_ref(user_id).get()
        if not snapshot.exists:
            return []
        return snapshot.to_dict().get("badges", [])

    def save_badges(self, user_id, badges):
        self.user_ref(user_id).set({"badges": badges, "updated_at": firestore.SERVER_TIMESTAMP}, merge=True)
        return badges

    def reset_data(self, user_id):
        logs_ref = self.user_ref(user_id).collection("daily_logs")
        for doc in logs_ref.stream():
            doc.reference.delete()
        self.user_ref(user_id).set({"badges": [], "updated_at": firestore.SERVER_TIMESTAMP}, merge=True)
        return True


class AuthError(ValueError):
    pass


def build_firestore_store():
    if firebase_admin is None:
        return None

    try:
        if not firebase_admin._apps:
            service_account_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
            service_account_path = os.getenv("FIREBASE_SERVICE_ACCOUNT") or str(BASE_DIR / "serviceAccountKey.json")

            if service_account_json:
                cert = credentials.Certificate(json.loads(service_account_json))
            elif Path(service_account_path).exists():
                cert = credentials.Certificate(service_account_path)
            else:
                return None

            firebase_admin.initialize_app(cert)

        return FirestoreStore(firestore.client())
    except Exception as exc:
        print(f"Firebase disabled, using local JSON store: {exc}")
        return None


DATA_STORE = build_firestore_store() or LocalStore()
STORE_BACKEND = "firestore" if isinstance(DATA_STORE, FirestoreStore) else "local"


def resolve_user_id(flask_request, payload=None):
    payload = payload or {}

    if STORE_BACKEND == "firestore":
        auth_header = flask_request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            raise AuthError("Firebase ID token is required")

        token = auth_header.removeprefix("Bearer ").strip()
        try:
            decoded = firebase_auth.verify_id_token(token, clock_skew_seconds=10)
        except Exception as exc:
            raise AuthError("Firebase ID token is invalid or expired") from exc

        uid = decoded.get("uid")
        if not uid:
            raise AuthError("Firebase ID token does not include a user ID")
        return uid

    user_id = (
        payload.get("user_id")
        or flask_request.args.get("user_id")
        or flask_request.headers.get("X-User-Id")
        or flask_request.headers.get("X-User-ID")
    )
    if not user_id:
        raise ValueError("user_id is required")
    return user_id
