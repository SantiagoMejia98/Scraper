import re
import time

from datetime import datetime, timezone

from config import (
    PARTIDOS_POR_EQUIPO,
    SLEEP_ENTRE_PAGINAS,
    MARGEN_PAGINAS_EXTRA,
    MAX_PAGINAS,
    COMPETICIONES_EXCLUIDAS
)

from services.sofascore_api import (
    obtener_pagina_partidos
)


# =============================================================================
# UTILIDADES
# =============================================================================

def limpiar(texto):

    if texto is None:
        return ""

    return re.sub(
        r"\s+",
        " ",
        str(texto)
    ).strip()


# =============================================================================
# PARTIDO FINALIZADO
# =============================================================================

def evento_finalizado(evento):

    return (
        evento
        .get("status", {})
        .get("type")
        == "finished"
    )


# =============================================================================
# COMPETICIÓN EXCLUIDA
# =============================================================================

def competicion_excluida(evento):

    nombre = (
        evento
        .get("tournament", {})
        .get("name")
        or ""
    )

    return (
        nombre.strip().lower()
        in COMPETICIONES_EXCLUIDAS
    )


# =============================================================================
# NORMALTIME
# =============================================================================

def obtener_normaltime(score):

    """
    IMPORTANTE:

    Solo utilizamos normaltime.

    Nunca utilizamos current.
    """

    if not isinstance(score, dict):

        return None

    valor = score.get(
        "normaltime"
    )

    if valor is None:

        return None

    try:

        return int(valor)

    except (
        TypeError,
        ValueError
    ):

        return None


# =============================================================================
# CALCULAR RESULTADO
# =============================================================================

def calcular_resultado(
    goles_local,
    goles_visitante,
    team_id,
    home_id,
    away_id
):

    if team_id == home_id:

        goles_equipo = goles_local
        goles_rival = goles_visitante

    elif team_id == away_id:

        goles_equipo = goles_visitante
        goles_rival = goles_local

    else:

        return None

    if goles_equipo > goles_rival:

        return "Victoria"

    if goles_equipo == goles_rival:

        return "Empate"

    return "Derrota"


# =============================================================================
# PARSEAR EVENTO
# =============================================================================

def parsear_evento(
    evento,
    team_id
):

    try:

        home_id = evento[
            "homeTeam"
        ]["id"]

        away_id = evento[
            "awayTeam"
        ]["id"]

        local = evento[
            "homeTeam"
        ]["name"]

        visitante = evento[
            "awayTeam"
        ]["name"]


        # -----------------------------------------------------
        # GOLES
        # -----------------------------------------------------

        goles_local = obtener_normaltime(
            evento.get("homeScore")
        )

        goles_visitante = obtener_normaltime(
            evento.get("awayScore")
        )


        # -----------------------------------------------------
        # Si falta normaltime ignoramos el partido
        # -----------------------------------------------------

        if (
            goles_local is None
            or
            goles_visitante is None
        ):

            return None


        # -----------------------------------------------------
        # COMPETICIÓN
        # -----------------------------------------------------

        competicion = (
            evento
            .get("tournament", {})
            .get("name", "")
        )


        # -----------------------------------------------------
        # ID
        # -----------------------------------------------------

        event_id = evento["id"]


        # -----------------------------------------------------
        # FECHA
        # -----------------------------------------------------

        timestamp = evento[
            "startTimestamp"
        ]

        fecha = datetime.fromtimestamp(
            timestamp,
            tz=timezone.utc
        ).strftime(
            "%Y-%m-%d"
        )


        # -----------------------------------------------------
        # URL
        # -----------------------------------------------------

        slug = evento.get(
            "slug",
            ""
        )

        custom_id = evento.get(
            "customId",
            ""
        )

        href = (
            "https://www.sofascore.com/"
            "football/match/"
            f"{slug}/"
            f"{custom_id}"
            f"#id:{event_id}"
        )


        # -----------------------------------------------------
        # RESULTADO
        # -----------------------------------------------------

        resultado = calcular_resultado(
            goles_local,
            goles_visitante,
            int(team_id),
            home_id,
            away_id
        )


        if resultado is None:

            return None


        # -----------------------------------------------------
        # PARTIDO
        # -----------------------------------------------------

        return {

            "event_id": event_id,

            "fecha": fecha,

            "timestamp": timestamp,

            "local_equipo": local,

            "visitante_equipo": visitante,

            "marcador_local": goles_local,

            "marcador_visitante": goles_visitante,

            "resultado": resultado,

            "torneo": competicion,

            "href": href,

            # Equipo que se está analizando.
            # Se conserva desde el origen para evitar
            # colisiones cuando el mismo partido aparece
            # para ambos equipos.
            "equipo_objetivo_id": int(team_id),

            # Se mantienen internamente
            # para filtrar local/visitante.

            "_home_id": home_id,

            "_away_id": away_id,
        }


    except (
        KeyError,
        TypeError,
        ValueError
    ):

        return None


# =============================================================================
# OBTENER PARTIDOS DE UN EQUIPO
# =============================================================================

def obtener_partidos_equipo(
    team_id,
    condicion_campo
):

    team_id = int(team_id)

    eventos_por_id = {}

    pagina = 0

    paginas_extra = MARGEN_PAGINAS_EXTRA


    while pagina < MAX_PAGINAS:

        data = obtener_pagina_partidos(
            team_id,
            pagina
        )

        if not data:

            break


        eventos = data.get(
            "events",
            []
        )


        if not eventos:

            break


        # -----------------------------------------------------
        # PROCESAR EVENTOS
        # -----------------------------------------------------

        for evento in eventos:

            if not evento_finalizado(
                evento
            ):

                continue


            if competicion_excluida(
                evento
            ):

                continue


            partido = parsear_evento(
                evento,
                team_id
            )


            if partido:

                eventos_por_id[
                    partido["event_id"]
                ] = partido


        # -----------------------------------------------------
        # PARTIDOS CONDICIONADOS
        # -----------------------------------------------------

        condicionados = [

            partido

            for partido
            in eventos_por_id.values()

            if partido[
                condicion_campo
            ] == team_id

        ]


        pagina += 1


        # -----------------------------------------------------
        # Ya tenemos suficientes
        # -----------------------------------------------------

        if (
            len(eventos_por_id)
            >= PARTIDOS_POR_EQUIPO
            and
            len(condicionados)
            >= PARTIDOS_POR_EQUIPO
        ):

            if paginas_extra <= 0:

                break

            paginas_extra -= 1


        # -----------------------------------------------------
        # No hay más páginas
        # -----------------------------------------------------

        if not data.get(
            "hasNextPage",
            False
        ):

            break


        # -----------------------------------------------------
        # Esperar
        # -----------------------------------------------------

        if pagina < MAX_PAGINAS:

            time.sleep(
                SLEEP_ENTRE_PAGINAS
            )


    # ---------------------------------------------------------
    # ORDENAR
    # ---------------------------------------------------------

    partidos_ordenados = sorted(
        eventos_por_id.values(),
        key=lambda p: p["timestamp"],
        reverse=True
    )


    # ---------------------------------------------------------
    # CONDICIONADOS
    # ---------------------------------------------------------

    condicionados_ordenados = [

        partido

        for partido
        in partidos_ordenados

        if partido[
            condicion_campo
        ] == team_id

    ]


    return (

        partidos_ordenados[
            :PARTIDOS_POR_EQUIPO
        ],

        condicionados_ordenados[
            :PARTIDOS_POR_EQUIPO
        ]

    )


# =============================================================================
# PREPARAR PARTIDO PARA JSON
# =============================================================================

def preparar_partido(partido):

    return {

        "event_id":
            partido["event_id"],

        "fecha":
            partido["fecha"],

        "local_equipo":
            partido["local_equipo"],

        "visitante_equipo":
            partido["visitante_equipo"],

        "marcador_local":
            partido["marcador_local"],

        "marcador_visitante":
            partido["marcador_visitante"],

        "resultado":
            partido["resultado"],

        "torneo":
            partido["torneo"],

        "href":
            partido["href"],

        # Equipo que originó el análisis
        # de este partido.
        "equipo_objetivo_id":
            partido.get(
                "equipo_objetivo_id"
            ),

        # IDs reales de SofaScore para determinar
        # si el equipo objetivo es local o visitante.
        "home_team_id":
            partido["_home_id"],

        "away_team_id":
            partido["_away_id"],

    }


# =============================================================================
# PREPARAR LISTA
# =============================================================================

def preparar_lista(partidos):

    return [

        preparar_partido(partido)

        for partido in partidos

    ]