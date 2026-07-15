import json
import os
import re

import requests
from flask import Blueprint, jsonify, request


suggestions_bp = Blueprint("suggestions", __name__)

GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"


def category_totals(context):
    return {
        "travel": float(context.get("travel_emissions", 0) or 0),
        "food": float(context.get("food_emissions", 0) or 0),
        "energy": float(context.get("energy_emissions", 0) or 0),
    }


def fallback_suggestions(context):
    totals = category_totals(context)
    sorted_categories = sorted(totals.items(), key=lambda item: item[1], reverse=True)
    budget = float(context.get("daily_budget", 8) or 8)
    total = float(context.get("total", sum(totals.values())) or 0)
    over_budget = total > budget

    templates = {
        "travel": {
            "category": "travel",
            "title": "Swap one car trip for transit",
            "description": "Replace the highest-distance car journey with train, bus, cycling, or a shared ride when practical.",
            "estimated_savings": round(max(0.6, totals["travel"] * 0.35), 1),
        },
        "food": {
            "category": "food",
            "title": "Make one meal plant-forward",
            "description": "Choose a vegetarian or vegan meal and plan portions before cooking to avoid the 10% food-waste penalty.",
            "estimated_savings": round(max(0.5, totals["food"] * 0.22), 1),
        },
        "energy": {
            "category": "energy",
            "title": "Trim peak electricity use",
            "description": "Shift laundry or charging away from peak hours, raise AC by 1-2C, and switch off idle appliances.",
            "estimated_savings": round(max(0.4, totals["energy"] * 0.25), 1),
        },
    }

    suggestions = [templates[category] for category, _value in sorted_categories[:3]]
    if over_budget and suggestions:
        suggestions[0] = {
            **suggestions[0],
            "title": f"Get back under your {budget:.1f} kg budget",
            "description": suggestions[0]["description"] + " This is your quickest lever for today's footprint.",
        }
    return with_camel_case_savings(suggestions[:3])


def with_camel_case_savings(suggestions):
    normalized = []
    for suggestion in suggestions:
        saving = float(suggestion.get("estimated_savings", suggestion.get("estimatedSaving", 0)) or 0)
        normalized.append({**suggestion, "estimated_savings": saving, "estimatedSaving": saving})
    return normalized


def parse_suggestions(content):
    try:
        parsed = json.loads(content)
    except json.JSONDecodeError:
        match = re.search(r"\[[\s\S]*\]", content)
        if not match:
            raise ValueError("Groq response did not include a JSON array")
        parsed = json.loads(match.group(0))

    if not isinstance(parsed, list):
        raise ValueError("Groq response must be a JSON array")

    clean = []
    for item in parsed[:3]:
        if not isinstance(item, dict):
            continue
        saving = float(item.get("estimated_savings", item.get("estimatedSaving", item.get("estimated_savings_kg", 0))) or 0)
        clean.append(
            {
                "category": str(item.get("category", "general")).lower(),
                "title": str(item.get("title", "Eco-friendly swap")),
                "description": str(item.get("description", "")),
                "estimated_savings": saving,
                "estimatedSaving": saving,
            }
        )
    if len(clean) != 3:
        raise ValueError("Groq response must contain exactly 3 suggestion objects")
    return clean


def call_groq(context):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not configured")

    prompt = f"""
Create exactly 3 personal carbon-reduction suggestions as a JSON array.
Each object must contain: category, title, description, estimatedSaving.
Use kg CO2e for estimatedSaving as a number. Do not include markdown.

Daily context:
- Total: {context.get("total", 0)} kg CO2e
- Budget: {context.get("daily_budget", 8)} kg CO2e
- Travel: {context.get("travel_emissions", 0)} kg, mode {context.get("travel_mode", "unknown")}, distance {context.get("distance_km", 0)} km
- Food: {context.get("food_emissions", 0)} kg, diet {context.get("diet_type", "unknown")}, food waste {context.get("food_waste", False)}
- Energy: {context.get("energy_emissions", 0)} kg, kWh {context.get("kwh", 0)}, heating {context.get("heating", False)}, AC {context.get("ac", False)}
"""

    response = requests.post(
        GROQ_ENDPOINT,
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json={
            "model": "llama-3.3-70b-versatile",
            "temperature": 0.7,
            "max_tokens": 800,
            "messages": [
                {
                    "role": "system",
                    "content": "You are a sustainability coach. Return concise, actionable JSON only.",
                },
                {"role": "user", "content": prompt},
            ],
        },
        timeout=20,
    )
    response.raise_for_status()
    content = response.json()["choices"][0]["message"]["content"]
    return parse_suggestions(content)


@suggestions_bp.post("/generate")
def generate():
    context = request.get_json(silent=True) or {}
    try:
        suggestions = call_groq(context)
        source = "groq"
    except Exception as exc:
        suggestions = fallback_suggestions(context)
        source = f"fallback: {exc}"
    return jsonify({"success": True, "suggestions": suggestions, "source": source})
