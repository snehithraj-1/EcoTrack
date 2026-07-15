import os

import requests
from flask import Blueprint, jsonify, request


carbon_bp = Blueprint("carbon", __name__)

CARBON_INTERFACE_ENDPOINT = "https://www.carboninterface.com/api/v1/estimates"
INDIA_ELECTRICITY_FACTOR = 0.233


def api_headers():
    return {
        "Authorization": f"Bearer {os.getenv('CARBON_INTERFACE_API_KEY', '')}",
        "Content-Type": "application/json",
    }


def has_api_key():
    return bool(os.getenv("CARBON_INTERFACE_API_KEY"))


@carbon_bp.post("/electricity")
def electricity():
    payload = request.get_json(silent=True) or {}
    try:
        kwh = float(payload.get("kwh", 0))
        if kwh < 0 or kwh > 30:
            raise ValueError("kwh must be between 0 and 30")
    except (TypeError, ValueError) as exc:
        return jsonify({"success": False, "error": str(exc)}), 400

    if has_api_key():
        try:
            response = requests.post(
                CARBON_INTERFACE_ENDPOINT,
                headers=api_headers(),
                json={
                    "type": "electricity",
                    "electricity_unit": "kwh",
                    "electricity_value": kwh,
                    "country": payload.get("country_code", "in"),
                },
                timeout=15,
            )
            response.raise_for_status()
            attrs = response.json()["data"]["attributes"]
            return jsonify({"success": True, "source": "carbon_interface", "carbon_kg": attrs["carbon_kg"], "raw": attrs})
        except Exception as exc:
            fallback = round(kwh * INDIA_ELECTRICITY_FACTOR, 2)
            return jsonify({"success": True, "source": f"fallback: {exc}", "carbon_kg": fallback})

    return jsonify({"success": True, "source": "fallback", "carbon_kg": round(kwh * INDIA_ELECTRICITY_FACTOR, 2)})


@carbon_bp.post("/flight")
def flight():
    payload = request.get_json(silent=True) or {}
    passengers = int(payload.get("passengers", 1) or 1)
    distance_km = float(payload.get("distance_km", 0) or 0)
    haul = payload.get("haul", "short")
    factor = 0.195 if haul == "long" else 0.255

    if passengers < 1:
        return jsonify({"success": False, "error": "passengers must be at least 1"}), 400
    if distance_km < 0:
        return jsonify({"success": False, "error": "distance_km must be non-negative"}), 400

    legs = payload.get("legs")
    if has_api_key() and legs:
        try:
            response = requests.post(
                CARBON_INTERFACE_ENDPOINT,
                headers=api_headers(),
                json={"type": "flight", "passengers": passengers, "legs": legs},
                timeout=15,
            )
            response.raise_for_status()
            attrs = response.json()["data"]["attributes"]
            return jsonify({"success": True, "source": "carbon_interface", "carbon_kg": attrs["carbon_kg"], "raw": attrs})
        except Exception as exc:
            fallback = round(distance_km * factor * passengers, 2)
            return jsonify({"success": True, "source": f"fallback: {exc}", "carbon_kg": fallback})

    return jsonify({"success": True, "source": "fallback", "carbon_kg": round(distance_km * factor * passengers, 2)})
