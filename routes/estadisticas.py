from flask import (
    Blueprint,
    jsonify
)

from services.estadisticas import (
    obtener_estadisticas_partido
)


# =============================================================================
# BLUEPRINT
# =============================================================================

estadisticas_bp = Blueprint(
    "estadisticas",
    __name__
)


# =============================================================================
# ESTADÍSTICAS DE UN PARTIDO
# =============================================================================

@estadisticas_bp.route(
    "/api/partido/<int:event_id>/estadisticas",
    methods=["GET"]
)
def estadisticas(event_id):

    try:

        resultado = obtener_estadisticas_partido(
            event_id
        )

        return jsonify(
            resultado
        )

    except Exception as e:

        print(
            f"ERROR estadísticas {event_id}: {e}"
        )

        return jsonify({
            "error":
                f"No se pudieron obtener las estadísticas: {str(e)}"
        }), 500