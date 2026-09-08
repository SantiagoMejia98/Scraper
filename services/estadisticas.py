import re

from services.sofascore_api import (
    obtener_evento,
    obtener_estadisticas,
    obtener_incidentes,
    obtener_alineaciones,
)


# =============================================================================
# ESTADÍSTICAS DEL PARTIDO
# =============================================================================

ESTADISTICAS_SELECCIONADAS = {
    "corner kicks": "Tiros de esquina",
    "fouls": "Faltas",
    "passes": "Pases intentados",
    "accurate passes": "Pases",
    "total shots": "Tiros totales",
    "shots on target": "Tiros a puerta",
    "hit woodwork": "Tiros al palo",
    "offsides": "Fueras de juego",
    "tackles won": "Entradas",
    "total tackles": "Entradas totales",
    "throw-ins": "Saques de banda",
    "goalkeeper saves": "Atajadas del portero",
    "goal kicks": "Saques de portería",
}


# =============================================================================
# ESTADÍSTICAS DEL TIMELINE
# =============================================================================

ESTADISTICAS_TIMELINE = {
    "goles": "Goles",
    "penales_causados": "Penales causados",
    "amarillas": "Amarillas",
    "rojas": "Rojas",
    "segunda_amarilla": "Segunda amarilla",
    "autogoles": "Autogoles",
}


ORDEN_ESTADISTICAS = [
    "timeline:goles",
    "timeline:autogoles",
    "corner kicks",
    "fouls",
    "timeline:penales_causados",
    "timeline:amarillas",
    "timeline:rojas",
    "timeline:segunda_amarilla",
    "accurate passes",
    "total shots",
    "shots on target",
    "hit woodwork",
    "offsides",
    "tackles won",
    "throw-ins",
    "goalkeeper saves",
    "goal kicks",
]


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


def normalizar_texto(texto):
    return limpiar(texto).casefold()


def convertir_numero(valor):
    if valor is None:
        return None

    texto = limpiar(valor)

    if not texto:
        return None

    match = re.fullmatch(
        r"(-?\d+(?:[.,]\d+)?)\s*%",
        texto
    )

    if match:
        return float(
            match.group(1).replace(",", ".")
        )

    match = re.fullmatch(
        r"-?\d+(?:[.,]\d+)?",
        texto
    )

    if not match:
        return None

    numero = float(
        match.group(0).replace(",", ".")
    )

    if numero.is_integer():
        return int(numero)

    return numero


def es_porcentaje(
    nombre,
    valor_local,
    valor_visitante
):
    nombre_normalizado = normalizar_texto(nombre)

    local = limpiar(valor_local)
    visitante = limpiar(valor_visitante)

    if "%" in local or "%" in visitante:
        return True

    palabras = (
        "ball possession",
        "accuracy",
        "percentage",
        "porcentaje",
    )

    return any(
        palabra in nombre_normalizado
        for palabra in palabras
    )


def obtener_valor(item, lado):
    if lado == "home":
        valor = item.get("home")

        if valor is None:
            valor = item.get("homeValue")

        return valor

    if lado == "away":
        valor = item.get("away")

        if valor is None:
            valor = item.get("awayValue")

        return valor

    return None


# =============================================================================
# INCIDENTES DE JUGADORES
# =============================================================================

TIPOS_GOL_VALIDOS = (
    "regular",
    "penalty",
    "ownGoal",
)

TIPOS_TARJETA_VALIDOS = (
    "yellow",
    "red",
    "yellowRed",
)


def clave_tiempo(dato):
    try:
        minuto = int(
            dato.get("minuto")
        )
    except (
        TypeError,
        ValueError,
    ):
        minuto = 9999

    try:
        agregado = int(
            dato.get("added_time", 0) or 0
        )
    except (
        TypeError,
        ValueError,
    ):
        agregado = 0

    return (
        minuto,
        agregado,
    )


def _nombre_jugador(incidente):
    jugador = incidente.get(
        "player"
    ) or {}

    if isinstance(jugador, dict):
        nombre = (
            jugador.get("name")
            or jugador.get("shortName")
            or jugador.get("slug")
        )

        if nombre:
            return limpiar(nombre)

    return ""


def _id_jugador(incidente):
    jugador = incidente.get(
        "player"
    ) or {}

    if isinstance(jugador, dict):
        return jugador.get("id")

    return None


def _tipo_gol(clase):
    if clase == "penalty":
        return "Penal"

    if clase == "ownGoal":
        return "Autogol"

    return "Normal"


def _tipo_tarjeta(clase):
    if clase == "yellow":
        return "Amarilla"

    if clase == "yellowRed":
        return "Segunda amarilla"

    if clase == "red":
        return "Roja"

    return ""


def obtener_eventos_jugadores(
    incidents_raw
):
    """
    Obtiene los eventos individuales del partido.

    IMPORTANTE:

    - regular = gol del jugador.
    - penalty = gol del jugador.
    - ownGoal = gol para el equipo contrario,
                 pero NO gol del jugador.
    - inGamePenalty = penal fallado / incidente de penal,
                      pero no gol.
    - penaltyShootout = no se considera.
    """

    goles = []
    tarjetas = []

    for incidente in incidents_raw:

        tipo = incidente.get(
            "incidentType"
        )

        is_home = incidente.get(
            "isHome"
        )

        if is_home is None:
            continue

        clase = incidente.get(
            "incidentClass"
        )

        # =====================================================================
        # GOLES
        # =====================================================================

        if (
            tipo == "goal"
            and clase in TIPOS_GOL_VALIDOS
        ):

            es_autogol = (
                clase == "ownGoal"
            )

            if es_autogol:

                # El gol pertenece al equipo contrario
                # al jugador que cometió el autogol.

                equipo = (
                    "visitante"
                    if is_home
                    else "local"
                )

                jugador = ""
                player_id = None

            else:

                equipo = (
                    "local"
                    if is_home
                    else "visitante"
                )

                jugador = _nombre_jugador(
                    incidente
                )

                player_id = _id_jugador(
                    incidente
                )

            goles.append({
                "player_id": player_id,
                "jugador": jugador,
                "minuto": incidente.get("time"),
                "added_time": incidente.get(
                    "addedTime",
                    0
                ) or 0,
                "equipo": equipo,
                "tipo": _tipo_gol(clase),
                "autogol": es_autogol,
            })

        # =====================================================================
        # TARJETAS
        # =====================================================================

        elif (
            tipo == "card"
            and clase in TIPOS_TARJETA_VALIDOS
        ):

            jugador = _nombre_jugador(
                incidente
            )

            if not jugador:
                continue

            equipo = (
                "local"
                if is_home
                else "visitante"
            )

            tarjetas.append({
                "player_id":
                    _id_jugador(incidente),

                "jugador":
                    jugador,

                "minuto":
                    incidente.get("time"),

                "added_time":
                    incidente.get(
                        "addedTime",
                        0
                    ) or 0,

                "equipo":
                    equipo,

                "tipo":
                    _tipo_tarjeta(clase),
            })

    goles.sort(
        key=clave_tiempo
    )

    tarjetas.sort(
        key=clave_tiempo
    )

    # =========================================================================
    # AGRUPAR JUGADORES
    # =========================================================================

    jugadores = {
        "local": {},
        "visitante": {},
    }

    def obtener_jugador(
        equipo,
        dato
    ):
        player_id = dato.get(
            "player_id"
        )

        nombre = dato.get(
            "jugador",
            ""
        )

        if player_id is not None:

            clave = f"id:{player_id}"

        else:

            clave = (
                f"nombre:{normalizar_texto(nombre)}"
            )

        if clave not in jugadores[equipo]:

            jugadores[equipo][clave] = {
                "player_id":
                    player_id,

                "jugador":
                    nombre,

                "primer_gol_equipo":
                    False,

                "primer_gol_partido":
                    False,

                "ultimo_gol_partido":
                    False,

                "primera_tarjeta_equipo":
                    False,

                "primera_tarjeta_partido":
                    False,

                "goles":
                    0,

                "goles_1T":
                    0,

                "goles_2T":
                    0,

                "anoto_ambos_tiempos":
                    False,

                "amarillas":
                    0,

                "segunda_amarillas":
                    0,

                "rojas":
                    0,

                "tarjetas":
                    [],
            }

        return jugadores[equipo][clave]

    def marcar(
        dato,
        campo
    ):
        jugador_nombre = dato.get(
            "jugador"
        )

        if not jugador_nombre:
            return

        jugador = obtener_jugador(
            dato["equipo"],
            dato
        )

        jugador[campo] = True

    # =========================================================================
    # CONTAR GOLES
    # =========================================================================

    for dato in goles:

        # Nunca atribuir autogol al jugador.
        if dato.get("autogol"):
            continue

        if not dato.get("jugador"):
            continue

        jugador = obtener_jugador(
            dato["equipo"],
            dato
        )

        jugador["goles"] += 1

        periodo_gol = clasificar_periodo(
            dato.get("minuto")
        )

        if periodo_gol == "1T":
            jugador["goles_1T"] += 1

        elif periodo_gol == "2T":
            jugador["goles_2T"] += 1

    # =========================================================================
    # ANOTÓ EN AMBOS TIEMPOS
    # =========================================================================

    for equipo in (
        "local",
        "visitante",
    ):

        for jugador in jugadores[equipo].values():

            jugador["anoto_ambos_tiempos"] = (
                jugador.get("goles_1T", 0) > 0
                and
                jugador.get("goles_2T", 0) > 0
            )

    # =========================================================================
    # CONTAR TARJETAS
    # =========================================================================

    for dato in tarjetas:

        jugador = obtener_jugador(
            dato["equipo"],
            dato
        )

        jugador["tarjetas"].append({
            "minuto":
                dato["minuto"],

            "added_time":
                dato.get(
                    "added_time",
                    0
                ),

            "tipo":
                dato["tipo"],
        })

        if dato["tipo"] == "Amarilla":

            jugador["amarillas"] += 1

        elif dato["tipo"] == "Roja":

            jugador["rojas"] += 1

        elif dato["tipo"] == "Segunda amarilla":

            jugador["segunda_amarillas"] += 1

            jugador["rojas"] += 1

    # =========================================================================
    # PRIMER / ÚLTIMO GOL DEL PARTIDO
    # =========================================================================

    if goles:

        marcar(
            goles[0],
            "primer_gol_partido"
        )

        marcar(
            goles[-1],
            "ultimo_gol_partido"
        )

    # =========================================================================
    # PRIMER GOL DE CADA EQUIPO
    # =========================================================================

    for equipo in (
        "local",
        "visitante",
    ):

        goles_equipo = [
            dato
            for dato in goles
            if dato["equipo"] == equipo
        ]

        if goles_equipo:

            marcar(
                goles_equipo[0],
                "primer_gol_equipo"
            )

    # =========================================================================
    # PRIMERA TARJETA DEL PARTIDO
    # =========================================================================

    if tarjetas:

        marcar(
            tarjetas[0],
            "primera_tarjeta_partido"
        )

    # =========================================================================
    # PRIMERA TARJETA DE CADA EQUIPO
    # =========================================================================

    for equipo in (
        "local",
        "visitante",
    ):

        tarjetas_equipo = [
            dato
            for dato in tarjetas
            if dato["equipo"] == equipo
        ]

        if tarjetas_equipo:

            marcar(
                tarjetas_equipo[0],
                "primera_tarjeta_equipo"
            )

    # =========================================================================
    # CONVERTIR DICCIONARIO -> LISTA
    # =========================================================================

    resultado_jugadores = {
        "local": [],
        "visitante": [],
    }

    for equipo in (
        "local",
        "visitante",
    ):

        lista = list(
            jugadores[equipo].values()
        )

        lista.sort(
            key=lambda jugador:
                normalizar_texto(
                    jugador.get(
                        "jugador",
                        ""
                    )
                )
        )

        resultado_jugadores[equipo] = lista

    # =========================================================================
    # FLAGS DEL PARTIDO
    # =========================================================================

    flags = {
        "primer_gol_equipo":
            goles[0]["equipo"]
            if goles
            else None,

        "ultimo_gol_equipo":
            goles[-1]["equipo"]
            if goles
            else None,

        "primera_tarjeta_equipo":
            tarjetas[0]["equipo"]
            if tarjetas
            else None,
    }

    return {
        "local":
            resultado_jugadores["local"],

        "visitante":
            resultado_jugadores["visitante"],

        "flags":
            flags,

        "goles":
            goles,

        "tarjetas":
            tarjetas,
    }


# =============================================================================
# TIMELINE DEL PARTIDO
# =============================================================================

def crear_estadisticas_timeline():

    def equipo():

        return {
            "goles": 0,
            "penales_causados": 0,
            "amarillas": 0,
            "rojas": 0,
            "segunda_amarilla": 0,
            "autogoles": 0,
        }

    return {
        "1T": {
            "local": equipo(),
            "visitante": equipo(),
        },

        "2T": {
            "local": equipo(),
            "visitante": equipo(),
        },
    }


def clasificar_periodo(minuto):

    if minuto is None:
        return None

    try:
        minuto = int(minuto)

    except (
        TypeError,
        ValueError,
    ):
        return None

    if minuto <= 45:
        return "1T"

    # Todo lo posterior a 45 pertenece al segundo tiempo.
    # Así no perdemos 90+.
    return "2T"


def normalizar_incidentes(
    incidents_raw
):

    normalizados = []

    for incidente in incidents_raw:

        tipo = incidente.get(
            "incidentType"
        )

        if tipo not in (
            "goal",
            "card",
            "inGamePenalty",
        ):
            continue

        minuto = incidente.get(
            "time"
        )

        is_home = incidente.get(
            "isHome"
        )

        if (
            minuto is None
            or is_home is None
        ):
            continue

        periodo = clasificar_periodo(
            minuto
        )

        if periodo is None:
            continue

        equipo = (
            "local"
            if is_home
            else "visitante"
        )

        clase = incidente.get(
            "incidentClass"
        )

        # =====================================================================
        # TARJETA
        # =====================================================================

        if tipo == "card":

            if clase not in TIPOS_TARJETA_VALIDOS:
                continue

            normalizados.append({
                "categoria":
                    "card",

                "subtipo":
                    clase,

                "periodo":
                    periodo,

                "minuto":
                    minuto,

                "equipo":
                    equipo,
            })

        # =====================================================================
        # PENAL
        # =====================================================================

        elif tipo == "inGamePenalty":

            normalizados.append({
                "categoria":
                    "penalty",

                "subtipo":
                    None,

                "periodo":
                    periodo,

                "minuto":
                    minuto,

                "equipo":
                    equipo,
            })

        # =====================================================================
        # GOL
        # =====================================================================

        elif tipo == "goal":

            if clase not in TIPOS_GOL_VALIDOS:
                continue

            # En autogol, el equipo que suma el gol
            # es el contrario al jugador.
            if clase == "ownGoal":

                equipo_gol = (
                    "visitante"
                    if is_home
                    else "local"
                )

            else:

                equipo_gol = equipo

            normalizados.append({
                "categoria":
                    "goal",

                "subtipo":
                    clase,

                "periodo":
                    periodo,

                "minuto":
                    minuto,

                "equipo":
                    equipo_gol,
            })

    return normalizados


def procesar_incidente(
    estadisticas,
    incidente
):

    periodo = incidente["periodo"]

    equipo = incidente["equipo"]

    datos = (
        estadisticas
        [periodo]
        [equipo]
    )

    categoria = incidente[
        "categoria"
    ]

    subtipo = incidente[
        "subtipo"
    ]

    contrario = (
        "visitante"
        if equipo == "local"
        else "local"
    )

    # =========================================================================
    # GOLES
    # =========================================================================

    if categoria == "goal":

        datos["goles"] += 1

        if subtipo == "penalty":

            estadisticas[
                periodo
            ][
                contrario
            ][
                "penales_causados"
            ] += 1

        elif subtipo == "ownGoal":

            estadisticas[
                periodo
            ][
                contrario
            ][
                "autogoles"
            ] += 1

    # =========================================================================
    # PENAL FALLADO
    # =========================================================================

    elif categoria == "penalty":

        estadisticas[
            periodo
        ][
            contrario
        ][
            "penales_causados"
        ] += 1

    # =========================================================================
    # TARJETAS
    # =========================================================================

    elif categoria == "card":

        if subtipo == "yellow":

            datos["amarillas"] += 1

        elif subtipo == "red":

            datos["rojas"] += 1

        elif subtipo == "yellowRed":

            # Segunda amarilla = roja.
            # NO la contamos como amarilla normal.
            datos["segunda_amarilla"] += 1
            datos["rojas"] += 1


def obtener_estadisticas_timeline(
    event_id
):

    data = obtener_incidentes(
        event_id
    )

    incidents_raw = data.get(
        "incidents",
        []
    )

    estadisticas = (
        crear_estadisticas_timeline()
    )

    incidentes = normalizar_incidentes(
        incidents_raw
    )

    for incidente in incidentes:

        procesar_incidente(
            estadisticas,
            incidente
        )

    estadisticas[
        "eventos_jugadores"
    ] = obtener_eventos_jugadores(
        incidents_raw
    )

    return estadisticas


# =============================================================================
# ESTADÍSTICAS DE LINEUPS + INCIDENTS
# =============================================================================

def _fusionar_eventos_con_lineups(
    data_lineups,
    eventos_jugadores
):

    resultado = {
        "local": [],
        "visitante": [],
    }

    eventos_jugadores = (
        eventos_jugadores or {}
    )

    for equipo_api, equipo_salida in (
        ("home", "local"),
        ("away", "visitante"),
    ):

        jugadores_eventos = (
            eventos_jugadores.get(
                equipo_salida,
                []
            )
            or []
        )

        # ================================================================
        # ÍNDICES DE INCIDENTS
        # ================================================================

        por_id = {}
        por_nombre = {}

        for evento_jugador in jugadores_eventos:

            player_id = evento_jugador.get(
                "player_id"
            )

            nombre = evento_jugador.get(
                "jugador",
                ""
            )

            if player_id is not None:

                por_id[
                    str(player_id)
                ] = evento_jugador

            nombre_normalizado = (
                normalizar_texto(nombre)
            )

            if nombre_normalizado:

                por_nombre[
                    nombre_normalizado
                ] = evento_jugador

        # ================================================================
        # JUGADORES DEL LINEUP
        # ================================================================

        bloque = (
            data_lineups.get(
                equipo_api,
                {}
            )
            or {}
        )

        jugadores_raw = (
            bloque.get(
                "players",
                []
            )
            or []
        )

        ids_lineup = set()

        for jugador_raw in jugadores_raw:

            info = (
                jugador_raw.get(
                    "player",
                    {}
                )
                or {}
            )

            stats = (
                jugador_raw.get(
                    "statistics",
                    {}
                )
                or {}
            )

            # ============================================================
            # IMPORTANTE:
            # NO eliminamos jugadores sin statistics.
            # ============================================================

            if not isinstance(stats, dict):
                stats = {}

            player_id = info.get(
                "id"
            )

            nombre = limpiar(
                info.get("name")
                or info.get("shortName")
                or info.get("slug")
                or ""
            )

            if not nombre:
                continue

            if player_id is not None:

                ids_lineup.add(
                    str(player_id)
                )

            # ============================================================
            # BUSCAR INCIDENTE DEL MISMO JUGADOR
            # ============================================================

            evento_jugador = None

            if player_id is not None:

                evento_jugador = (
                    por_id.get(
                        str(player_id)
                    )
                )

            if evento_jugador is None:

                evento_jugador = (
                    por_nombre.get(
                        normalizar_texto(nombre)
                    )
                )

            # ============================================================
            # FILA
            # ============================================================

            fila = {
                "player_id":
                    player_id,

                "jugador":
                    nombre,

                "posicion":
                    jugador_raw.get(
                        "position",
                        ""
                    ),

                "numero":
                    jugador_raw.get(
                        "shirtNumber",
                        ""
                    ),

                "titular":
                    not jugador_raw.get(
                        "substitute",
                        False
                    ),
            }

            # ============================================================
            # TODAS LAS ESTADÍSTICAS RAW DE SOFASCORE
            # ============================================================

            for clave, valor in stats.items():

                fila[clave] = (
                    ""
                    if valor is None
                    else valor
                )

            # ============================================================
            # ESTADÍSTICAS DE INCIDENTS
            # ============================================================

            if evento_jugador:

                fila.update({

                    "primer_gol_equipo":
                        evento_jugador.get(
                            "primer_gol_equipo",
                            False
                        ),

                    "primer_gol_partido":
                        evento_jugador.get(
                            "primer_gol_partido",
                            False
                        ),

                    "ultimo_gol_partido":
                        evento_jugador.get(
                            "ultimo_gol_partido",
                            False
                        ),

                    "primera_tarjeta_equipo":
                        evento_jugador.get(
                            "primera_tarjeta_equipo",
                            False
                        ),

                    "primera_tarjeta_partido":
                        evento_jugador.get(
                            "primera_tarjeta_partido",
                            False
                        ),

                    "goles":
                        evento_jugador.get(
                            "goles",
                            0
                        ),

                    "goles_1T":
                        evento_jugador.get(
                            "goles_1T",
                            0
                        ),

                    "goles_2T":
                        evento_jugador.get(
                            "goles_2T",
                            0
                        ),

                    "anoto_ambos_tiempos":
                        evento_jugador.get(
                            "anoto_ambos_tiempos",
                            False
                        ),

                    "amarillas":
                        evento_jugador.get(
                            "amarillas",
                            0
                        ),

                    "segunda_amarillas":
                        evento_jugador.get(
                            "segunda_amarillas",
                            0
                        ),

                    "rojas":
                        evento_jugador.get(
                            "rojas",
                            0
                        ),

                    "tarjetas":
                        evento_jugador.get(
                            "tarjetas",
                            []
                        ),
                })

            else:

                fila.update({

                    "primer_gol_equipo":
                        False,

                    "primer_gol_partido":
                        False,

                    "ultimo_gol_partido":
                        False,

                    "primera_tarjeta_equipo":
                        False,

                    "primera_tarjeta_partido":
                        False,

                    "goles":
                        0,

                    "goles_1T":
                        0,

                    "goles_2T":
                        0,

                    "anoto_ambos_tiempos":
                        False,

                    "amarillas":
                        0,

                    "segunda_amarillas":
                        0,

                    "rojas":
                        0,

                    "tarjetas":
                        [],
                })

            resultado[
                equipo_salida
            ].append(
                fila
            )

        # ================================================================
        # INCIDENTS QUE NO APARECIERON EN LINEUP
        # ================================================================

        for evento_jugador in jugadores_eventos:

            player_id = evento_jugador.get(
                "player_id"
            )

            if (
                player_id is not None
                and
                str(player_id) in ids_lineup
            ):
                continue

            nombre = evento_jugador.get(
                "jugador",
                ""
            )

            if not nombre:
                continue

            existe = False

            for jugador in resultado[
                equipo_salida
            ]:

                if (
                    player_id is not None
                    and
                    jugador.get(
                        "player_id"
                    ) is not None
                    and
                    str(
                        jugador.get(
                            "player_id"
                        )
                    )
                    ==
                    str(player_id)
                ):

                    existe = True
                    break

                if (
                    normalizar_texto(
                        jugador.get(
                            "jugador",
                            ""
                        )
                    )
                    ==
                    normalizar_texto(
                        nombre
                    )
                ):

                    existe = True
                    break

            if existe:
                continue

            # ============================================================
            # JUGADOR QUE SOLO APARECE EN INCIDENTS
            # ============================================================

            fila = {
                "player_id":
                    player_id,

                "jugador":
                    nombre,

                "posicion":
                    "",

                "numero":
                    "",

                "titular":
                    "",

                "primer_gol_equipo":
                    evento_jugador.get(
                        "primer_gol_equipo",
                        False
                    ),

                "primer_gol_partido":
                    evento_jugador.get(
                        "primer_gol_partido",
                        False
                    ),

                "ultimo_gol_partido":
                    evento_jugador.get(
                        "ultimo_gol_partido",
                        False
                    ),

                "primera_tarjeta_equipo":
                    evento_jugador.get(
                        "primera_tarjeta_equipo",
                        False
                    ),

                "primera_tarjeta_partido":
                    evento_jugador.get(
                        "primera_tarjeta_partido",
                        False
                    ),

                "goles":
                    evento_jugador.get(
                        "goles",
                        0
                    ),

                "goles_1T":
                    evento_jugador.get(
                        "goles_1T",
                        0
                    ),

                "goles_2T":
                    evento_jugador.get(
                        "goles_2T",
                        0
                    ),

                "anoto_ambos_tiempos":
                    evento_jugador.get(
                        "anoto_ambos_tiempos",
                        False
                    ),

                "amarillas":
                    evento_jugador.get(
                        "amarillas",
                        0
                    ),

                "segunda_amarillas":
                    evento_jugador.get(
                        "segunda_amarillas",
                        0
                    ),

                "rojas":
                    evento_jugador.get(
                        "rojas",
                        0
                    ),

                "tarjetas":
                    evento_jugador.get(
                        "tarjetas",
                        []
                    ),
            }

            resultado[
                equipo_salida
            ].append(
                fila
            )

        # ================================================================
        # ORDEN
        # ================================================================

        resultado[
            equipo_salida
        ].sort(
            key=lambda jugador:
                normalizar_texto(
                    jugador.get(
                        "jugador",
                        ""
                    )
                )
        )

    return resultado


def obtener_estadisticas_jugadores_lineups(
    event_id,
    eventos_jugadores
):

    data_lineups = obtener_alineaciones(
        event_id
    )

    return _fusionar_eventos_con_lineups(
        data_lineups,
        eventos_jugadores
    )


# =============================================================================
# ESTADÍSTICAS DEL PARTIDO
# =============================================================================

def extraer_periodo(
    data_stats,
    period_key,
    event_id,
    local_equipo,
    visitante_equipo
):

    bloques = data_stats.get(
        "statistics",
        []
    )

    bloque = next(
        (
            bloque
            for bloque in bloques
            if bloque.get(
                "period"
            ) == period_key
        ),
        None
    )

    if bloque is None:
        return []

    # =========================================================================
    # PRIMERO INDEXAMOS TODOS LOS ITEMS
    #
    # Esto es importante porque SofaScore no garantiza que "tackles won"
    # aparezca antes o después de "total tackles".
    # =========================================================================

    items_por_clave = {}

    for grupo in bloque.get(
        "groups",
        []
    ):

        for item in grupo.get(
            "statisticsItems",
            []
        ):

            nombre = item.get(
                "name"
            )

            if nombre is None:
                continue

            clave = normalizar_texto(
                nombre
            )

            if clave not in items_por_clave:

                items_por_clave[
                    clave
                ] = item

    resultados = []
    vistas = set()

    # =========================================================================
    # EXTRAER ESTADÍSTICAS
    # =========================================================================

    for clave in ESTADISTICAS_SELECCIONADAS:

        item = items_por_clave.get(
            clave
        )

        if item is None:
            continue

        if clave in vistas:
            continue

        local = obtener_valor(
            item,
            "home"
        )

        visitante = obtener_valor(
            item,
            "away"
        )

        # =====================================================================
        # ENTRADAS GANADAS
        #
        # SofaScore entrega "tackles won" como porcentaje.
        #
        # Ejemplo:
        # total tackles = 20
        # tackles won = 65%
        #
        # resultado = 20 * 65 / 100 = 13
        #
        # No inventamos el valor si falta cualquiera de los dos datos.
        # =====================================================================

        if clave == "tackles won":

            item_total = items_por_clave.get(
                "total tackles"
            )

            if item_total is None:
                continue

            total_local = convertir_numero(
                obtener_valor(
                    item_total,
                    "home"
                )
            )

            total_visitante = convertir_numero(
                obtener_valor(
                    item_total,
                    "away"
                )
            )

            porcentaje_local = convertir_numero(
                local
            )

            porcentaje_visitante = convertir_numero(
                visitante
            )

            if (
                total_local is not None
                and
                porcentaje_local is not None
            ):

                local = round(
                    total_local
                    * porcentaje_local
                    / 100
                )

            else:

                local = None

            if (
                total_visitante is not None
                and
                porcentaje_visitante is not None
            ):

                visitante = round(
                    total_visitante
                    * porcentaje_visitante
                    / 100
                )

            else:

                visitante = None

        # =====================================================================
        # VALOR NORMAL
        # =====================================================================

        if (
            local is None
            and
            visitante is None
        ):
            continue

        vistas.add(
            clave
        )

        resultados.append({
            "event_id":
                event_id,

            "local_equipo":
                local_equipo,

            "visitante_equipo":
                visitante_equipo,

            "periodo":
                period_key,

            "estadistica_key":
                clave,

            "estadistica":
                ESTADISTICAS_SELECCIONADAS[
                    clave
                ],

            "local":
                local,

            "visitante":
                visitante,
        })

    posiciones = {
        clave: posicion
        for posicion, clave
        in enumerate(
            ORDEN_ESTADISTICAS
        )
    }

    resultados.sort(
        key=lambda fila:
            posiciones.get(
                fila[
                    "estadistica_key"
                ],
                999
            )
    )

    return resultados


def agregar_timeline_periodo(
    resultados,
    timeline_periodo,
    event_id,
    local_equipo,
    visitante_equipo,
    periodo
):

    for clave in (
        "goles",
        "penales_causados",
        "amarillas",
        "rojas",
        "segunda_amarilla",
        "autogoles",
    ):

        resultados.append({
            "event_id":
                event_id,

            "local_equipo":
                local_equipo,

            "visitante_equipo":
                visitante_equipo,

            "periodo":
                periodo,

            "estadistica_key":
                f"timeline:{clave}",

            "estadistica":
                ESTADISTICAS_TIMELINE[
                    clave
                ],

            "local":
                timeline_periodo[
                    "local"
                ][clave],

            "visitante":
                timeline_periodo[
                    "visitante"
                ][clave],
        })


def sumar_timeline(
    timeline
):

    resultado = {
        "local": {},
        "visitante": {},
    }

    for equipo in (
        "local",
        "visitante",
    ):

        for clave in (
            "goles",
            "penales_causados",
            "amarillas",
            "rojas",
            "segunda_amarilla",
            "autogoles",
        ):

            resultado[
                equipo
            ][clave] = (
                timeline["1T"][equipo][clave]
                +
                timeline["2T"][equipo][clave]
            )

    return resultado


def calcular_valor_ft(
    valor_1,
    valor_2,
    porcentaje=False
):

    numero_1 = convertir_numero(
        valor_1
    )

    numero_2 = convertir_numero(
        valor_2
    )

    if (
        numero_1 is not None
        and
        numero_2 is not None
    ):

        if porcentaje:

            return (
                numero_1
                +
                numero_2
            ) / 2

        return (
            numero_1
            +
            numero_2
        )

    if numero_1 is not None:
        return numero_1

    if numero_2 is not None:
        return numero_2

    return ""


def formatear_ft(
    valor,
    porcentaje=False
):

    if valor == "":
        return ""

    if porcentaje:
        return f"{valor:.2f}%"

    if (
        isinstance(valor, float)
        and
        valor.is_integer()
    ):
        return int(valor)

    return valor


def calcular_ft_estadisticas(
    datos_1st,
    datos_2nd,
    event_id,
    local_equipo,
    visitante_equipo
):

    primero = {
        fila["estadistica_key"]: fila
        for fila in datos_1st
        if not fila[
            "estadistica_key"
        ].startswith("timeline:")
    }

    segundo = {
        fila["estadistica_key"]: fila
        for fila in datos_2nd
        if not fila[
            "estadistica_key"
        ].startswith("timeline:")
    }

    resultados = []

    for clave in ESTADISTICAS_SELECCIONADAS:

        fila_1 = primero.get(
            clave
        )

        fila_2 = segundo.get(
            clave
        )

        if (
            fila_1 is None
            and
            fila_2 is None
        ):
            continue

        valor_1_local = (
            fila_1["local"]
            if fila_1
            else None
        )

        valor_2_local = (
            fila_2["local"]
            if fila_2
            else None
        )

        valor_1_visitante = (
            fila_1["visitante"]
            if fila_1
            else None
        )

        valor_2_visitante = (
            fila_2["visitante"]
            if fila_2
            else None
        )

        # =====================================================================
        # ENTRADAS GANADAS
        #
        # extraer_periodo() ya convirtió cada porcentaje de 1T/2T
        # a una cantidad.
        #
        # Por eso aquí NO promediamos.
        #
        # FT = Entradas ganadas 1T + Entradas ganadas 2T
        # =====================================================================

        if clave == "tackles won":

            numero_1_local = convertir_numero(
                valor_1_local
            )

            numero_2_local = convertir_numero(
                valor_2_local
            )

            numero_1_visitante = convertir_numero(
                valor_1_visitante
            )

            numero_2_visitante = convertir_numero(
                valor_2_visitante
            )

            if (
                numero_1_local is not None
                or
                numero_2_local is not None
            ):

                total_local = (
                    (numero_1_local or 0)
                    +
                    (numero_2_local or 0)
                )

            else:

                total_local = ""

            if (
                numero_1_visitante is not None
                or
                numero_2_visitante is not None
            ):

                total_visitante = (
                    (numero_1_visitante or 0)
                    +
                    (numero_2_visitante or 0)
                )

            else:

                total_visitante = ""

        # =====================================================================
        # RESTO DE ESTADÍSTICAS
        # =====================================================================

        else:

            porcentaje = es_porcentaje(
                clave,
                valor_1_local,
                valor_1_visitante
            )

            total_local = formatear_ft(
                calcular_valor_ft(
                    valor_1_local,
                    valor_2_local,
                    porcentaje
                ),
                porcentaje
            )

            total_visitante = formatear_ft(
                calcular_valor_ft(
                    valor_1_visitante,
                    valor_2_visitante,
                    porcentaje
                ),
                porcentaje
            )

        resultados.append({
            "event_id":
                event_id,

            "local_equipo":
                local_equipo,

            "visitante_equipo":
                visitante_equipo,

            "periodo":
                "FT",

            "estadistica_key":
                clave,

            "estadistica":
                ESTADISTICAS_SELECCIONADAS[
                    clave
                ],

            "local":
                total_local,

            "visitante":
                total_visitante,
        })

    return resultados


def agregar_timeline_a_periodo(
    datos_estadisticas,
    timeline,
    periodo,
    event_id,
    local_equipo,
    visitante_equipo
):

    resultados = list(
        datos_estadisticas
    )

    if periodo not in timeline:
        return resultados

    agregar_timeline_periodo(
        resultados,
        timeline[periodo],
        event_id,
        local_equipo,
        visitante_equipo,
        (
            "1ST"
            if periodo == "1T"
            else "2ND"
        )
    )

    posiciones = {
        clave: posicion
        for posicion, clave
        in enumerate(
            ORDEN_ESTADISTICAS
        )
    }

    resultados.sort(
        key=lambda fila:
            posiciones.get(
                fila[
                    "estadistica_key"
                ],
                999
            )
    )

    return resultados


# =============================================================================
# FILAS FT: PRIMER GOL / PRIMERA TARJETA
# =============================================================================

def agregar_resumen_jugadores_ft(
    resultados,
    eventos_jugadores,
    event_id,
    local_equipo,
    visitante_equipo
):

    flags = (
        eventos_jugadores or {}
    ).get(
        "flags",
        {}
    )

    primer_gol = flags.get(
        "primer_gol_equipo"
    )

    primera_tarjeta = flags.get(
        "primera_tarjeta_equipo"
    )

    def valor_equipo(
        equipo,
        evento
    ):

        if evento is None:
            return "N/D"

        return (
            "Sí"
            if equipo == evento
            else "No"
        )

    resultados.append({
        "event_id":
            event_id,

        "local_equipo":
            local_equipo,

        "visitante_equipo":
            visitante_equipo,

        "periodo":
            "FT",

        "estadistica_key":
            "timeline:primer_gol",

        "estadistica":
            "Primer gol",

        "local":
            valor_equipo(
                "local",
                primer_gol
            ),

        "visitante":
            valor_equipo(
                "visitante",
                primer_gol
            ),
    })

    resultados.append({
        "event_id":
            event_id,

        "local_equipo":
            local_equipo,

        "visitante_equipo":
            visitante_equipo,

        "periodo":
            "FT",

        "estadistica_key":
            "timeline:primera_tarjeta",

        "estadistica":
            "Primera tarjeta",

        "local":
            valor_equipo(
                "local",
                primera_tarjeta
            ),

        "visitante":
            valor_equipo(
                "visitante",
                primera_tarjeta
            ),
    })


# =============================================================================
# FUNCIÓN PRINCIPAL
# =============================================================================

def obtener_estadisticas_partido(
    event_id,
    local_equipo=None,
    visitante_equipo=None,
    home_team_id=None,
    away_team_id=None,
    equipo_objetivo_id=None
):

    # =========================================================================
    # NOMBRES E IDS REALES DEL PARTIDO
    # =========================================================================

    if (
        local_equipo is None
        or
        visitante_equipo is None
        or
        home_team_id is None
        or
        away_team_id is None
    ):

        data_evento = obtener_evento(
            event_id
        )

        evento = data_evento.get(
            "event",
            data_evento
        )

        home_team = evento.get(
            "homeTeam",
            {}
        ) or {}

        away_team = evento.get(
            "awayTeam",
            {}
        ) or {}

        if local_equipo is None:

            local_equipo = home_team.get(
                "name",
                ""
            )

        if visitante_equipo is None:

            visitante_equipo = away_team.get(
                "name",
                ""
            )

        if home_team_id is None:

            home_team_id = home_team.get(
                "id"
            )

        if away_team_id is None:

            away_team_id = away_team.get(
                "id"
            )

    # =========================================================================
    # ESTADÍSTICAS NORMALES
    # =========================================================================

    data_stats = obtener_estadisticas(
        event_id
    )

    # =========================================================================
    # INCIDENTS
    # =========================================================================

    timeline = obtener_estadisticas_timeline(
        event_id
    )

    # =========================================================================
    # JUGADORES
    # =========================================================================

    jugadores_lineups = (
        obtener_estadisticas_jugadores_lineups(
            event_id,
            timeline.get(
                "eventos_jugadores",
                {}
            )
        )
    )

    # =========================================================================
    # PERIODOS DISPONIBLES
    # =========================================================================

    periodos_disponibles = {
        bloque.get("period")
        for bloque
        in data_stats.get(
            "statistics",
            []
        )
    }

    resultados = []

    # =========================================================================
    # 1ST + 2ND
    # =========================================================================

    if (
        "1ST" in periodos_disponibles
        and
        "2ND" in periodos_disponibles
    ):

        datos_1st = extraer_periodo(
            data_stats,
            "1ST",
            event_id,
            local_equipo,
            visitante_equipo
        )

        datos_1st = agregar_timeline_a_periodo(
            datos_1st,
            timeline,
            "1T",
            event_id,
            local_equipo,
            visitante_equipo
        )

        datos_2nd = extraer_periodo(
            data_stats,
            "2ND",
            event_id,
            local_equipo,
            visitante_equipo
        )

        datos_2nd = agregar_timeline_a_periodo(
            datos_2nd,
            timeline,
            "2T",
            event_id,
            local_equipo,
            visitante_equipo
        )

        datos_ft = calcular_ft_estadisticas(
            datos_1st,
            datos_2nd,
            event_id,
            local_equipo,
            visitante_equipo
        )

        timeline_ft = sumar_timeline(
            timeline
        )

        agregar_timeline_periodo(
            datos_ft,
            timeline_ft,
            event_id,
            local_equipo,
            visitante_equipo,
            "FT"
        )

        agregar_resumen_jugadores_ft(
            datos_ft,
            timeline.get(
                "eventos_jugadores",
                {}
            ),
            event_id,
            local_equipo,
            visitante_equipo
        )

        resultados.extend(
            datos_1st
        )

        resultados.extend(
            datos_2nd
        )

        resultados.extend(
            datos_ft
        )

    # =========================================================================
    # SOLO ALL
    # =========================================================================

    elif "ALL" in periodos_disponibles:

        datos_all = extraer_periodo(
            data_stats,
            "ALL",
            event_id,
            local_equipo,
            visitante_equipo
        )

        for fila in datos_all:
            fila["periodo"] = "FT"

        timeline_ft = sumar_timeline(
            timeline
        )

        agregar_timeline_periodo(
            datos_all,
            timeline_ft,
            event_id,
            local_equipo,
            visitante_equipo,
            "FT"
        )

        agregar_resumen_jugadores_ft(
            datos_all,
            timeline.get(
                "eventos_jugadores",
                {}
            ),
            event_id,
            local_equipo,
            visitante_equipo
        )

        resultados.extend(
            datos_all
        )

    # =========================================================================
    # ORDEN FINAL
    # =========================================================================

    orden_periodos = {
        "1ST": 0,
        "2ND": 1,
        "FT": 2,
    }

    posiciones = {
        clave: posicion
        for posicion, clave
        in enumerate(
            ORDEN_ESTADISTICAS
        )
    }

    resultados.sort(
        key=lambda fila: (
            orden_periodos.get(
                fila.get(
                    "periodo"
                ),
                99
            ),

            posiciones.get(
                fila.get(
                    "estadistica_key"
                ),
                999
            )
        )
    )

    # =========================================================================
    # RESPUESTA
    # =========================================================================

    return {
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

        "periodos":
            resultados,

        "eventos_jugadores":
            timeline.get(
                "eventos_jugadores",
                {}
            ),

        "jugadores":
            jugadores_lineups,
    }