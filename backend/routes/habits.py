from datetime import date

from flask import Blueprint, jsonify, request

from firebase_config import AuthError, DATA_STORE, resolve_user_id
from routes.calculator import calculate_footprint


habits_bp = Blueprint("habits", __name__)


def request_payload():
    return request.get_json(silent=True) or {}


def require_user_id(payload=None):
    return resolve_user_id(request, payload)


@habits_bp.post("/log")
def log_habit():
    payload = request_payload()
    try:
        user_id = require_user_id(payload)
        date_key = payload.get("date") or date.today().isoformat()
        calculation = payload.get("calculation")
        if not calculation:
            calculation = calculate_footprint(payload)

        log_record = {
            **payload,
            **calculation,
            "date": date_key,
            "user_id": user_id,
        }
        saved = DATA_STORE.save_log(user_id, date_key, log_record)
        history = DATA_STORE.get_history(user_id, 30)
        return jsonify({"success": True, "log": saved, "history": history})
    except AuthError as exc:
        return jsonify({"success": False, "error": str(exc)}), 401
    except ValueError as exc:
        return jsonify({"success": False, "error": str(exc)}), 400


@habits_bp.get("/history")
def history():
    try:
        user_id = require_user_id()
        limit = int(request.args.get("days", 30))
        history_rows = DATA_STORE.get_history(user_id, max(1, min(limit, 90)))
        return jsonify({"success": True, "history": history_rows})
    except AuthError as exc:
        return jsonify({"success": False, "error": str(exc)}), 401
    except ValueError as exc:
        return jsonify({"success": False, "error": str(exc)}), 400


@habits_bp.get("/today")
def today():
    try:
        user_id = require_user_id()
        date_key = request.args.get("date") or date.today().isoformat()
        return jsonify({"success": True, "date": date_key, "log": DATA_STORE.get_log(user_id, date_key)})
    except AuthError as exc:
        return jsonify({"success": False, "error": str(exc)}), 401
    except ValueError as exc:
        return jsonify({"success": False, "error": str(exc)}), 400


@habits_bp.route("/settings", methods=["GET", "PATCH"])
def settings():
    payload = request_payload()
    try:
        user_id = require_user_id(payload)
        if request.method == "GET":
            return jsonify({"success": True, "settings": DATA_STORE.get_settings(user_id)})

        allowed = {"name", "daily_budget", "country", "weekly_goal", "avatar", "theme", "notifications", "language"}
        clean_settings = {key: payload[key] for key in allowed if key in payload}
        if "daily_budget" in clean_settings:
            clean_settings["daily_budget"] = float(clean_settings["daily_budget"])
            if clean_settings["daily_budget"] <= 0:
                raise ValueError("daily_budget must be greater than 0")
        saved = DATA_STORE.save_settings(user_id, clean_settings)
        return jsonify({"success": True, "settings": saved})
    except AuthError as exc:
        return jsonify({"success": False, "error": str(exc)}), 401
    except ValueError as exc:
        return jsonify({"success": False, "error": str(exc)}), 400


@habits_bp.delete("/reset")
def reset():
    try:
        user_id = require_user_id()
        DATA_STORE.reset_data(user_id)
        return jsonify({"success": True})
    except AuthError as exc:
        return jsonify({"success": False, "error": str(exc)}), 401
    except ValueError as exc:
        return jsonify({"success": False, "error": str(exc)}), 400


@habits_bp.route("/badges", methods=["GET", "POST"])
def badges():
    payload = request_payload()
    try:
        user_id = require_user_id(payload)
        if request.method == "GET":
            return jsonify({"success": True, "badges": DATA_STORE.get_badges(user_id)})

        badges_payload = payload.get("badges")
        if not isinstance(badges_payload, list):
            raise ValueError("badges must be an array")
        saved = DATA_STORE.save_badges(user_id, badges_payload)
        return jsonify({"success": True, "badges": saved})
    except AuthError as exc:
        return jsonify({"success": False, "error": str(exc)}), 401
    except ValueError as exc:
        return jsonify({"success": False, "error": str(exc)}), 400
