import os

from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS

load_dotenv()

from firebase_config import STORE_BACKEND
from routes.auth import auth_bp
from routes.calculator import calculator_bp
from routes.carbon_interface import carbon_bp
from routes.habits import habits_bp
from routes.suggestions import suggestions_bp


def create_app():
    app = Flask(__name__)
    allowed_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
    CORS(app, resources={r"/api/*": {"origins": [origin.strip() for origin in allowed_origins.split(",")]}})

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(calculator_bp, url_prefix="/api/calculate")
    app.register_blueprint(habits_bp, url_prefix="/api/habits")
    app.register_blueprint(suggestions_bp, url_prefix="/api/suggestions")
    app.register_blueprint(carbon_bp, url_prefix="/api/carbon")

    @app.get("/")
    def root():
        return jsonify(
            {
                "service": "EcoTrack API",
                "status": "running",
                "routes": [
                    "/api/auth/register",
                    "/api/auth/login",
                    "/api/calculate/footprint",
                    "/api/habits/log",
                    "/api/habits/history",
                    "/api/habits/today",
                    "/api/habits/settings",
                    "/api/habits/badges",
                    "/api/suggestions/generate",
                    "/api/carbon/electricity",
                    "/api/carbon/flight",
                ],
            }
        )

    @app.get("/api/health")
    def health():
        return jsonify({"success": True, "status": "healthy", "storage": STORE_BACKEND})

    return app


app = create_app()


if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=os.getenv("FLASK_DEBUG", "1") == "1")
