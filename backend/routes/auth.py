import os

import requests
from flask import Blueprint, jsonify, request


auth_bp = Blueprint("auth", __name__)

FIREBASE_IDENTITY_BASE = "https://identitytoolkit.googleapis.com/v1/accounts"


def firebase_api_key():
    return os.getenv("FIREBASE_WEB_API_KEY") or os.getenv("VITE_FIREBASE_API_KEY")


def require_key():
    key = firebase_api_key()
    if not key:
        raise RuntimeError("FIREBASE_WEB_API_KEY is required for backend auth endpoints")
    return key


def call_identity(endpoint, payload):
    key = require_key()
    response = requests.post(f"{FIREBASE_IDENTITY_BASE}:{endpoint}", params={"key": key}, json=payload, timeout=20)
    response.raise_for_status()
    return response.json()


@auth_bp.post("/register")
def register():
    payload = request.get_json(silent=True) or {}
    email = payload.get("email")
    password = payload.get("password")
    name = payload.get("name", "")
    if not email or not password:
        return jsonify({"success": False, "error": "email and password are required"}), 400

    try:
        data = call_identity("signUp", {"email": email, "password": password, "returnSecureToken": True})
        if name and data.get("idToken"):
            call_identity("update", {"idToken": data["idToken"], "displayName": name, "returnSecureToken": True})
        return jsonify({"success": True, "user": {"uid": data.get("localId"), "email": data.get("email")}, "idToken": data.get("idToken")})
    except RuntimeError as exc:
        return jsonify({"success": False, "error": str(exc)}), 501
    except requests.HTTPError as exc:
        return jsonify({"success": False, "error": exc.response.text}), 400


@auth_bp.post("/login")
def login():
    payload = request.get_json(silent=True) or {}
    email = payload.get("email")
    password = payload.get("password")
    if not email or not password:
        return jsonify({"success": False, "error": "email and password are required"}), 400

    try:
        data = call_identity("signInWithPassword", {"email": email, "password": password, "returnSecureToken": True})
        return jsonify({"success": True, "user": {"uid": data.get("localId"), "email": data.get("email")}, "idToken": data.get("idToken")})
    except RuntimeError as exc:
        return jsonify({"success": False, "error": str(exc)}), 501
    except requests.HTTPError as exc:
        return jsonify({"success": False, "error": exc.response.text}), 400
