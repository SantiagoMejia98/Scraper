from services.sofascore_api import (
    obtener_info_equipo
)

from services.partidos import (
    obtener_partidos_equipo,
    preparar_lista
)


# =============================================================================
# OBTENER EQUIPO COMPLETO
# =============================================================================

def analizar_equipo_local(
    team_id
):

    info = obtener_info_equipo(
        team_id
    )

    (
        general,
        como_local
    ) = obtener_partidos_equipo(
        team_id,
        "_home_id"
    )

    return {

        "team_id": team_id,

        "nombre": info.get(
            "team",
            info
        ).get(
            "name",
            str(team_id)
        ),

        "general": preparar_lista(
            general
        ),

        "como_local": preparar_lista(
            como_local
        )

    }


def analizar_equipo_visitante(
    team_id
):

    info = obtener_info_equipo(
        team_id
    )

    (
        general,
        como_visitante
    ) = obtener_partidos_equipo(
        team_id,
        "_away_id"
    )

    return {

        "team_id": team_id,

        "nombre": info.get(
            "team",
            info
        ).get(
            "name",
            str(team_id)
        ),

        "general": preparar_lista(
            general
        ),

        "como_visitante":
            preparar_lista(
                como_visitante
            )

    }