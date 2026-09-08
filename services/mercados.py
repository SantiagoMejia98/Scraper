# services/mercados.py


from services.partidos import (
    obtener_partidos_equipo
)


# =============================================================================
# RESULTADO DEL PARTIDO
# =============================================================================

def calcular_resultados(
    partidos,
    equipo_id
):
    """
    Calcula:

    - Victorias
    - Empates
    - Derrotas
    - Partidos analizados

    utilizando únicamente partidos finalizados
    que ya fueron obtenidos por services.partidos.
    """

    resultado = {
        "victorias": 0,
        "empates": 0,
        "derrotas": 0,
        "partidos": 0
    }

    if not partidos:
        return resultado

    equipo_id = int(equipo_id)

    for partido in partidos:

        resultado_partido = partido.get(
            "resultado"
        )

        if resultado_partido not in (
            "Victoria",
            "Empate",
            "Derrota"
        ):
            continue

        resultado["partidos"] += 1

        if resultado_partido == "Victoria":

            resultado["victorias"] += 1

        elif resultado_partido == "Empate":

            resultado["empates"] += 1

        elif resultado_partido == "Derrota":

            resultado["derrotas"] += 1

    return resultado


# =============================================================================
# MERCADO: RESULTADO DEL PARTIDO
# =============================================================================

def obtener_mercado_resultado(
    equipo_local_id,
    equipo_visitante_id
):
    """
    Obtiene los datos reales para:

        MERCADOS
            POPULARES
                Resultado del partido

    Para el equipo local:

        General
        Como local

    Para el equipo visitante:

        General
        Como visitante
    """

    equipo_local_id = int(
        equipo_local_id
    )

    equipo_visitante_id = int(
        equipo_visitante_id
    )


    # =========================================================================
    # EQUIPO LOCAL
    # =========================================================================

    partidos_local_general, partidos_local_casa = (
        obtener_partidos_equipo(
            equipo_local_id,
            "_home_id"
        )
    )


    # =========================================================================
    # EQUIPO VISITANTE
    # =========================================================================

    partidos_visitante_general, partidos_visitante_fuera = (
        obtener_partidos_equipo(
            equipo_visitante_id,
            "_away_id"
        )
    )


    # =========================================================================
    # CALCULAR RESULTADOS
    # =========================================================================

    local_general = calcular_resultados(
        partidos_local_general,
        equipo_local_id
    )

    local_casa = calcular_resultados(
        partidos_local_casa,
        equipo_local_id
    )

    visitante_general = calcular_resultados(
        partidos_visitante_general,
        equipo_visitante_id
    )

    visitante_fuera = calcular_resultados(
        partidos_visitante_fuera,
        equipo_visitante_id
    )


    # =========================================================================
    # RESULTADO FINAL
    # =========================================================================

    return {

        "equipo_local": {

            "general": local_general,

            "local": local_casa

        },

        "equipo_visitante": {

            "general": visitante_general,

            "visitante": visitante_fuera

        }

    }