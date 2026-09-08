from concurrent.futures import (
    ThreadPoolExecutor,
    as_completed
)

from flask import (
    Blueprint,
    jsonify,
    request
)

from services.equipos import (
    analizar_equipo_local,
    analizar_equipo_visitante
)

from services.estadisticas import (
    obtener_estadisticas_partido
)


equipos_bp = Blueprint(
    "equipos",
    __name__
)


# =============================================================================
# CARGAR LAS ESTADÍSTICAS DE UN PARTIDO
# =============================================================================

def cargar_estadisticas_partido(
    partido
):

    event_id = partido.get(
        "event_id"
    )


    # =========================================================================
    # NOMBRES
    # =========================================================================

    local_equipo = partido.get(
        "local_equipo"
    )


    visitante_equipo = partido.get(
        "visitante_equipo"
    )


    # Compatibilidad con posibles nombres anteriores
    if not local_equipo:

        local_equipo = partido.get(
            "local"
        )


    if not visitante_equipo:

        visitante_equipo = partido.get(
            "visitante"
        )


    # =========================================================================
    # IDS REALES DEL PARTIDO
    # =========================================================================

    home_team_id = partido.get(
        "home_team_id"
    )


    away_team_id = partido.get(
        "away_team_id"
    )


    # =========================================================================
    # ID DEL EQUIPO QUE ESTAMOS ANALIZANDO
    # =========================================================================

    equipo_objetivo_id = partido.get(
        "equipo_objetivo_id"
    )


    try:

        print(
            f"Cargando estadísticas del partido {event_id} "
            f"(equipo objetivo: {equipo_objetivo_id})..."
        )


        # =====================================================================
        # OBTENER ESTADÍSTICAS
        # =====================================================================

        resultado = obtener_estadisticas_partido(

            event_id,

            local_equipo=local_equipo,

            visitante_equipo=visitante_equipo,

            home_team_id=home_team_id,

            away_team_id=away_team_id

        )


        # =====================================================================
        # GUARDAR EL EQUIPO OBJETIVO
        # =====================================================================

        resultado[
            "equipo_objetivo_id"
        ] = equipo_objetivo_id


        # =====================================================================
        # GARANTIZAR IDS EN LA RESPUESTA
        # =====================================================================

        if (
            resultado.get(
                "home_team_id"
            ) is None
        ):

            resultado[
                "home_team_id"
            ] = home_team_id


        if (
            resultado.get(
                "away_team_id"
            ) is None
        ):

            resultado[
                "away_team_id"
            ] = away_team_id


        return (

            event_id,

            equipo_objetivo_id,

            resultado

        )


    except Exception as e:

        print(
            f"ERROR estadísticas {event_id}: {e}"
        )


        return (

            event_id,

            equipo_objetivo_id,

            {

                "event_id":
                    event_id,

                "local_equipo":
                    local_equipo,

                "visitante_equipo":
                    visitante_equipo,

                "home_team_id":
                    home_team_id,

                "away_team_id":
                    away_team_id,

                "equipo_objetivo_id":
                    equipo_objetivo_id,

                "error":
                    str(e),

                "periodos":
                    [],

                "eventos_jugadores":
                    {},

                "jugadores":
                    {}

            }

        )


# =============================================================================
# PRECARGAR ESTADÍSTICAS EN PARALELO
# =============================================================================

def precargar_estadisticas(
    equipo_local,
    equipo_visitante
):

    # =========================================================================
    # LISTAS
    # =========================================================================

    listas = [

        equipo_local.get(
            "general",
            []
        ),

        equipo_local.get(
            "como_local",
            []
        ),

        equipo_visitante.get(
            "general",
            []
        ),

        equipo_visitante.get(
            "como_visitante",
            []
        )

    ]


    # =========================================================================
    # PARTIDOS ÚNICOS
    #
    # IMPORTANTE:
    #
    # NO usamos solamente event_id.
    #
    # El mismo partido puede aparecer para:
    #
    # equipo 1 → equipo_objetivo_id = A
    #
    # equipo 2 → equipo_objetivo_id = B
    #
    # Por eso la clave es:
    #
    # (event_id, equipo_objetivo_id)
    #
    # =========================================================================

    partidos_unicos = {}


    for lista in listas:

        for partido in lista:

            event_id = partido.get(
                "event_id"
            )


            if event_id is None:

                continue


            equipo_objetivo_id = partido.get(
                "equipo_objetivo_id"
            )


            clave_partido = (

                event_id,

                equipo_objetivo_id

            )


            if clave_partido not in partidos_unicos:

                partidos_unicos[
                    clave_partido
                ] = partido


    print(
        "Partidos únicos para precargar: "
        f"{len(partidos_unicos)}"
    )


    # =========================================================================
    # CACHE
    # =========================================================================

    estadisticas_cache = {}


    # =========================================================================
    # CARGA PARALELA
    # =========================================================================

    with ThreadPoolExecutor(
        max_workers=6
    ) as executor:

        futuros = {}


        for clave_partido, partido in (
            partidos_unicos.items()
        ):

            futuro = executor.submit(

                cargar_estadisticas_partido,

                partido

            )


            futuros[
                futuro
            ] = clave_partido


        # =====================================================================
        # RECIBIR RESULTADOS
        # =====================================================================

        for futuro in as_completed(
            futuros
        ):

            clave_partido = futuros[
                futuro
            ]


            event_id = (
                clave_partido[0]
            )


            equipo_objetivo_id = (
                clave_partido[1]
            )


            try:

                resultado_evento = (
                    futuro.result()
                )


                resultado_id = (
                    resultado_evento[0]
                )


                resultado_objetivo = (
                    resultado_evento[1]
                )


                resultado = (
                    resultado_evento[2]
                )


                # =============================================================
                # CLAVE CORRECTA
                #
                # event_id + equipo objetivo
                # =============================================================

                estadisticas_cache[
                    (
                        resultado_id,
                        resultado_objetivo
                    )
                ] = resultado


                print(

                    "Estadísticas cargadas: "

                    f"{len(estadisticas_cache)}/"
                    f"{len(partidos_unicos)} "

                    f"| evento={resultado_id} "

                    f"| equipo={resultado_objetivo}"

                )


            except Exception as e:

                print(

                    f"ERROR procesando partido "
                    f"{event_id}: {e}"

                )


                estadisticas_cache[
                    clave_partido
                ] = {

                    "event_id":
                        event_id,

                    "equipo_objetivo_id":
                        equipo_objetivo_id,

                    "error":
                        str(e),

                    "periodos":
                        [],

                    "eventos_jugadores":
                        {},

                    "jugadores":
                        {}

                }


    # =========================================================================
    # INSERTAR ESTADÍSTICAS EN LOS PARTIDOS
    # =========================================================================

    for lista in listas:

        for partido in lista:

            event_id = partido.get(
                "event_id"
            )


            if event_id is None:

                continue


            equipo_objetivo_id = partido.get(
                "equipo_objetivo_id"
            )


            clave_partido = (

                event_id,

                equipo_objetivo_id

            )


            if clave_partido in estadisticas_cache:

                partido[
                    "estadisticas"
                ] = estadisticas_cache[
                    clave_partido
                ]


    print(
        "Precarga de estadísticas finalizada."
    )


    print(
        "Estadísticas precargadas: "
        f"{len(estadisticas_cache)}"
    )


# =============================================================================
# API ANALIZAR
# =============================================================================

@equipos_bp.route(
    "/api/analizar",
    methods=["POST"]
)
def analizar():

    try:

        data = request.get_json(
            force=True
        ) or {}


        # =====================================================================
        # IDs RECIBIDOS
        # =====================================================================

        team_id_1 = str(

            data.get(
                "team_id_1",
                ""
            )

        ).strip()


        team_id_2 = str(

            data.get(
                "team_id_2",
                ""
            )

        ).strip()


        # =====================================================================
        # VALIDAR
        # =====================================================================

        if (
            not team_id_1
            or
            not team_id_2
        ):

            return jsonify({

                "error":
                    "Debes indicar los IDs de ambos equipos."

            }), 400


        # =====================================================================
        # CONVERTIR A ENTEROS
        # =====================================================================

        try:

            team_id_1 = int(
                team_id_1
            )


            team_id_2 = int(
                team_id_2
            )


        except ValueError:

            return jsonify({

                "error":
                    "Los IDs deben ser números."

            }), 400


        # =====================================================================
        # ANALIZAR EQUIPO 1
        #
        # analizar_equipo_local() recibe el ID del equipo buscado.
        #
        # Los partidos resultantes llevan:
        #
        # equipo_objetivo_id = team_id_1
        #
        # =====================================================================

        equipo_local = analizar_equipo_local(
            team_id_1
        )


        # =====================================================================
        # ANALIZAR EQUIPO 2
        #
        # Los partidos resultantes llevan:
        #
        # equipo_objetivo_id = team_id_2
        #
        # =====================================================================

        equipo_visitante = analizar_equipo_visitante(
            team_id_2
        )


        # =====================================================================
        # PRECARGAR ESTADÍSTICAS
        # =====================================================================

        print(
            "Iniciando precarga de estadísticas en paralelo..."
        )


        precargar_estadisticas(

            equipo_local,

            equipo_visitante

        )


        # =====================================================================
        # RESPUESTA
        # =====================================================================

        return jsonify({

            "equipo_1":
                equipo_local,

            "equipo_2":
                equipo_visitante

        })


    except Exception as e:

        print(
            f"ERROR /api/analizar: {e}"
        )


        return jsonify({

            "error":
                f"Error de red: {str(e)}"

        }), 500