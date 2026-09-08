from flask import (
    Blueprint,
    jsonify,
    request
)

from services.mercados import (
    obtener_mercado_resultado
)


mercados_bp = Blueprint(
    "mercados",
    __name__
)


# =============================================================================
# MERCADOS
# =============================================================================

@mercados_bp.route(
    "/api/partido/<int:event_id>/mercados",
    methods=["GET"]
)
def mercados(event_id):

    try:

        equipo_local_id = request.args.get(
            "equipo_local_id",
            type=int
        )

        equipo_visitante_id = request.args.get(
            "equipo_visitante_id",
            type=int
        )


        # ---------------------------------------------------------------------
        # COMPROBAR IDs
        # ---------------------------------------------------------------------

        if (
            equipo_local_id is None
            or
            equipo_visitante_id is None
        ):

            return jsonify({
                "error":
                    "Faltan los IDs de los equipos"
            }), 400


        # ---------------------------------------------------------------------
        # OBTENER MERCADO
        # ---------------------------------------------------------------------

        resultado = obtener_mercado_resultado(
            equipo_local_id=equipo_local_id,
            equipo_visitante_id=equipo_visitante_id
        )


        # ---------------------------------------------------------------------
        # RESPUESTA
        # ---------------------------------------------------------------------

        return jsonify({

            "event_id": event_id,

            "mercados": {

                "populares": {

                    "resultado_partido": resultado

                }

            }

        })


    except Exception as e:

        print(
            f"ERROR mercados {event_id}: {e}"
        )

        return jsonify({

            "error":
                f"No se pudieron obtener los mercados: {str(e)}"

        }), 500