from flask import Blueprint, jsonify, request


calculator_bp = Blueprint("calculator", __name__)

TRANSPORT_COEFFICIENTS = {
    "car_petrol": 0.192,
    "car_diesel": 0.171,
    "car_electric": 0.053,
    "bus": 0.089,
    "train": 0.041,
    "motorcycle": 0.114,
    "bicycle": 0.0,
    "walking": 0.0,
    "flight_short_haul": 0.255,
    "flight_long_haul": 0.195,
}

TRANSPORT_LABELS = {
    "car_petrol": "Car Petrol",
    "car_diesel": "Car Diesel",
    "car_electric": "Car Electric",
    "bus": "Bus",
    "train": "Train",
    "motorcycle": "Motorcycle",
    "bicycle": "Bicycle",
    "walking": "Walking",
    "flight_short_haul": "Flight Short-haul",
    "flight_long_haul": "Flight Long-haul",
}

FOOD_EMISSIONS = {
    "meat_heavy": 7.19,
    "omnivore": 5.63,
    "vegetarian": 3.81,
    "vegan": 2.89,
}

FOOD_LABELS = {
    "meat_heavy": "Meat-heavy",
    "omnivore": "Omnivore",
    "vegetarian": "Vegetarian",
    "vegan": "Vegan",
}

ENERGY_FACTORS = {
    "electricity": 0.233,
    "heating": 2.0,
    "ac": 1.5,
}

CARPOOL_MODES = {"car_petrol", "car_diesel", "car_electric"}


def normalise_key(value):
    return str(value or "").strip().lower().replace(" ", "_").replace("-", "_")


def as_float(value, name, minimum=None, maximum=None):
    try:
        number = float(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"{name} must be a number") from exc
    if minimum is not None and number < minimum:
        raise ValueError(f"{name} must be at least {minimum}")
    if maximum is not None and number > maximum:
        raise ValueError(f"{name} must be at most {maximum}")
    return number


def as_int(value, name, minimum=None, maximum=None):
    try:
        number = int(value)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"{name} must be a whole number") from exc
    if minimum is not None and number < minimum:
        raise ValueError(f"{name} must be at least {minimum}")
    if maximum is not None and number > maximum:
        raise ValueError(f"{name} must be at most {maximum}")
    return number


def as_bool(value):
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in {"true", "1", "yes", "on"}
    return bool(value)


def calculate_footprint(payload):
    travel_mode = normalise_key(payload.get("travel_mode") or payload.get("mode") or "walking")
    diet_type = normalise_key(payload.get("diet_type") or payload.get("diet") or "omnivore")

    if travel_mode not in TRANSPORT_COEFFICIENTS:
        raise ValueError("travel_mode must be one of: " + ", ".join(TRANSPORT_COEFFICIENTS))
    if diet_type not in FOOD_EMISSIONS:
        raise ValueError("diet_type must be one of: " + ", ".join(FOOD_EMISSIONS))

    distance_km = as_float(payload.get("distance_km", payload.get("distance", 0)), "distance_km", 0)
    passengers = as_int(payload.get("passengers", 1), "passengers", 1, 12)
    kwh = as_float(payload.get("kwh", 0), "kwh", 0, 30)
    food_waste = as_bool(payload.get("food_waste", payload.get("wasted", False)))
    heating = as_bool(payload.get("heating", False))
    ac = as_bool(payload.get("ac", False))

    transport_factor = TRANSPORT_COEFFICIENTS[travel_mode]
    sharing_divisor = passengers if travel_mode in CARPOOL_MODES else 1
    travel_emissions = distance_km * transport_factor / sharing_divisor

    food_emissions = FOOD_EMISSIONS[diet_type] * (1.1 if food_waste else 1)

    energy_emissions = kwh * ENERGY_FACTORS["electricity"]
    if heating:
        energy_emissions += ENERGY_FACTORS["heating"]
    if ac:
        energy_emissions += ENERGY_FACTORS["ac"]

    total = travel_emissions + food_emissions + energy_emissions

    return {
        "success": True,
        "travel_emissions": round(travel_emissions, 2),
        "food_emissions": round(food_emissions, 2),
        "energy_emissions": round(energy_emissions, 2),
        "total": round(total, 2),
        "breakdown": {
            "travel": {
                "mode": travel_mode,
                "label": TRANSPORT_LABELS[travel_mode],
                "distance_km": round(distance_km, 2),
                "passengers": passengers,
                "factor": transport_factor,
                "emissions": round(travel_emissions, 2),
            },
            "food": {
                "diet_type": diet_type,
                "label": FOOD_LABELS[diet_type],
                "food_waste": food_waste,
                "base_emissions": FOOD_EMISSIONS[diet_type],
                "emissions": round(food_emissions, 2),
            },
            "energy": {
                "kwh": round(kwh, 2),
                "electricity_factor": ENERGY_FACTORS["electricity"],
                "heating": heating,
                "ac": ac,
                "emissions": round(energy_emissions, 2),
            },
        },
    }


@calculator_bp.post("/footprint")
def calculate_route():
    payload = request.get_json(silent=True) or {}
    try:
        return jsonify(calculate_footprint(payload))
    except ValueError as exc:
        return jsonify({"success": False, "error": str(exc)}), 400
