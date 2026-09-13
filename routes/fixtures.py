from flask import Blueprint, jsonify, request

from services.fixtures import (
    FixtureNotFoundError,
    FixtureValidationError,
    validar_fixture,
)


fixtures_bp = Blueprint("fixtures", __name__)


@fixtures_bp.route("/api/fixture/analizar", methods=["POST"])
def analizar_fixture():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "ok": False,
            "error": "El cuerpo debe ser un objeto JSON",
            "fixture_verificado": False,
        }), 400

    try:
        fixture = validar_fixture(
            event_id=data.get("event_id"),
            equipo_local_id=data.get("equipo_local_id"),
            equipo_visitante_id=data.get("equipo_visitante_id"),
            kickoff_at=data.get("kickoff_at"),
            competicion=data.get("competicion"),
        )

        return jsonify({
            "ok": True,
            "fixture": fixture,
        })

    except FixtureNotFoundError as error:
        return jsonify({
            "ok": False,
            "error": str(error),
            "fixture_verificado": False,
        }), 404

    except FixtureValidationError as error:
        return jsonify({
            "ok": False,
            "error": str(error),
            "fixture_verificado": False,
        }), 400
