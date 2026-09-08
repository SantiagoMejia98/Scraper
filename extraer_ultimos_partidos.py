"""
SofaScore - Historial de partidos de equipo local y visitante (JSON API).

Pide el ID del equipo LOCAL y el ID del equipo VISITANTE, y genera 4 CSVs:

  1. ultimos10_local_general.csv
     -> últimos 10 finalizados del local
        (jugando como local o visitante)

  2. ultimos10_local_como_local.csv
     -> últimos 10 finalizados del local
        jugando específicamente COMO LOCAL

  3. ultimos10_visitante_general.csv
     -> últimos 10 finalizados del visitante
        (jugando como local o visitante)

  4. ultimos10_visitante_como_visitante.csv
     -> últimos 10 finalizados del visitante
        jugando específicamente COMO VISITANTE

Se excluyen partidos de la competición "Club Friendly Games".

IMPORTANTE:
- Los goles se obtienen EXCLUSIVAMENTE de:
      homeScore.normaltime
      awayScore.normaltime

- NO se utiliza homeScore.current ni awayScore.current.

- El resultado se calcula desde la perspectiva del equipo analizado:

      goles equipo > goles rival -> Victoria
      goles equipo = goles rival -> Empate
      goles equipo < goles rival -> Derrota

Requisitos:

    pip install curl_cffi
"""

from curl_cffi import requests

import time
import csv
import os
from datetime import datetime, timezone


# =============================================================================
# CONFIGURACIÓN
# =============================================================================

OBJETIVO = 10

SLEEP_ENTRE_PAGINAS = 1.5

MARGEN_PAGINAS_EXTRA = 2

MAX_PAGINAS = 40

OUT_DIR = "sofascore_historico"

os.makedirs(OUT_DIR, exist_ok=True)


# =============================================================================
# COMPETICIONES EXCLUIDAS
# =============================================================================

COMPETICIONES_EXCLUIDAS = {
    "club friendly games",
}


# =============================================================================
# HEADERS
# =============================================================================

HEADERS = {
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
    "Referer": "https://www.sofascore.com/",
    "Origin": "https://www.sofascore.com",
}


# =============================================================================
# SESIÓN
# =============================================================================

sesion = requests.Session(impersonate="chrome124")


# =============================================================================
# COLUMNAS DEL CSV
# =============================================================================

FIELDNAMES = [
    "id",
    "fecha",
    "local",
    "goles_local",
    "visitante",
    "goles_visitante",
    "resultado",
    "competicion",
    "href",
]


# =============================================================================
# OBTENER PÁGINA DE LA API
# =============================================================================

def obtener_pagina(team_id, pagina):

    url = (
        f"https://api.sofascore.com/api/v1/"
        f"team/{team_id}/events/last/{pagina}"
    )

    resp = sesion.get(
        url,
        headers=HEADERS,
        timeout=15
    )

    # No hay más páginas
    if resp.status_code == 404:
        return None

    # Bloqueo
    if resp.status_code == 403:

        print(
            "⚠ 403 recibido desde SofaScore."
        )

        print(
            "Puede tratarse de un bloqueo temporal o por IP."
        )

        print(
            resp.text[:500]
        )

    resp.raise_for_status()

    return resp.json()


# =============================================================================
# VERIFICAR SI EL PARTIDO ESTÁ FINALIZADO
# =============================================================================

def evento_finalizado(evento):

    return (
        evento.get("status", {}).get("type")
        == "finished"
    )


# =============================================================================
# VERIFICAR SI LA COMPETICIÓN ESTÁ EXCLUIDA
# =============================================================================

def competicion_excluida(evento):

    nombre = (
        evento.get("tournament", {}).get("name")
        or ""
    ).strip().lower()

    return nombre in COMPETICIONES_EXCLUIDAS


# =============================================================================
# OBTENER NORMaltime
# =============================================================================

def obtener_normaltime(score):

    """
    Obtiene EXCLUSIVAMENTE normaltime.

    No utiliza current como respaldo.

    Si normaltime no existe, devuelve None.
    """

    if not isinstance(score, dict):
        return None

    valor = score.get("normaltime")

    if valor is None:
        return None

    try:
        return int(valor)
    except (TypeError, ValueError):
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

    """
    Calcula el resultado desde la perspectiva
    del equipo que estamos analizando.

    Victoria:
        goles equipo > goles rival

    Empate:
        goles equipo == goles rival

    Derrota:
        goles equipo < goles rival
    """

    # ---------------------------------------------------------
    # El equipo analizado jugó como LOCAL
    # ---------------------------------------------------------

    if team_id == home_id:

        goles_equipo = goles_local
        goles_rival = goles_visitante

    # ---------------------------------------------------------
    # El equipo analizado jugó como VISITANTE
    # ---------------------------------------------------------

    elif team_id == away_id:

        goles_equipo = goles_visitante
        goles_rival = goles_local

    # ---------------------------------------------------------
    # No coincide
    # ---------------------------------------------------------

    else:

        return None

    # ---------------------------------------------------------
    # Resultado
    # ---------------------------------------------------------

    if goles_equipo > goles_rival:
        return "Victoria"

    if goles_equipo == goles_rival:
        return "Empate"

    return "Derrota"


# =============================================================================
# PARSEAR EVENTO
# =============================================================================

def parsear_evento(evento, team_id):

    try:

        # -----------------------------------------------------
        # IDs DE LOS EQUIPOS
        # -----------------------------------------------------

        home_id = evento["homeTeam"]["id"]
        away_id = evento["awayTeam"]["id"]

        # -----------------------------------------------------
        # NOMBRES
        # -----------------------------------------------------

        local = evento["homeTeam"]["name"]
        visitante = evento["awayTeam"]["name"]

        # -----------------------------------------------------
        # GOLES
        #
        # IMPORTANTE:
        # SOLO NORMaltime
        #
        # NO usamos current.
        # -----------------------------------------------------

        goles_local = obtener_normaltime(
            evento.get("homeScore")
        )

        goles_visitante = obtener_normaltime(
            evento.get("awayScore")
        )

        # -----------------------------------------------------
        # Si no existe normaltime para alguno de los dos,
        # no utilizamos el partido.
        # -----------------------------------------------------

        if goles_local is None or goles_visitante is None:

            print(
                f"  ⚠ Partido {evento.get('id')} ignorado: "
                f"no tiene normaltime completo."
            )

            return None

        # -----------------------------------------------------
        # COMPETICIÓN
        # -----------------------------------------------------

        competicion = (
            evento.get("tournament", {})
            .get("name", "")
        )

        # -----------------------------------------------------
        # ID DEL PARTIDO
        # -----------------------------------------------------

        event_id = evento["id"]

        # -----------------------------------------------------
        # FECHA
        # -----------------------------------------------------

        timestamp = evento["startTimestamp"]

        fecha = datetime.fromtimestamp(
            timestamp,
            tz=timezone.utc
        ).strftime("%Y-%m-%d")

        # -----------------------------------------------------
        # SLUG Y CUSTOM ID
        # -----------------------------------------------------

        slug_partido = evento.get("slug", "")

        custom_id = evento.get("customId", "")

        # -----------------------------------------------------
        # URL REAL DEL PARTIDO
        # -----------------------------------------------------

        href = (
            f"https://www.sofascore.com/football/match/"
            f"{slug_partido}/{custom_id}"
            f"#id:{event_id}"
        )

        # -----------------------------------------------------
        # RESULTADO DESDE LA PERSPECTIVA DEL EQUIPO
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
        # DEVOLVER DATOS
        # -----------------------------------------------------

        return {

            "id": event_id,

            "timestamp": timestamp,

            "fecha": fecha,

            "local": local,

            "goles_local": goles_local,

            "visitante": visitante,

            "goles_visitante": goles_visitante,

            "resultado": resultado,

            "competicion": competicion,

            "href": href,

            "_home_id": home_id,

            "_away_id": away_id,
        }

    except (KeyError, TypeError, ValueError) as e:

        print(
            f"  ⚠ Error procesando evento "
            f"{evento.get('id', '?')}: {e}"
        )

        return None


# =============================================================================
# GUARDAR CSV
# =============================================================================

def guardar_csv(nombre_archivo, partidos):

    ruta = os.path.join(
        OUT_DIR,
        nombre_archivo
    )

    with open(
        ruta,
        "w",
        newline="",
        encoding="utf-8-sig"
    ) as f:

        writer = csv.DictWriter(
            f,
            fieldnames=FIELDNAMES
        )

        writer.writeheader()

        for partido in partidos:

            writer.writerow({
                k: partido[k]
                for k in FIELDNAMES
            })

    print(
        f"OK: CSV guardado -> {ruta} "
        f"| Partidos: {len(partidos)}"
    )

    return ruta


# =============================================================================
# DESCARGA Y FILTRADO PARA UN EQUIPO
# =============================================================================

def obtener_partidos_equipo(
    team_id,
    condicion_campo
):

    """
    Descarga páginas del historial del equipo.

    Devuelve:

        lista_general
        lista_condicionada

    lista_general:
        últimos OBJETIVO partidos finalizados.

    lista_condicionada:
        últimos OBJETIVO partidos en los que el equipo
        jugó específicamente como LOCAL o VISITANTE.

    El resultado se calcula siempre desde la perspectiva
    del equipo consultado.

    Los goles utilizan exclusivamente normaltime.
    """

    team_id_int = int(team_id)

    eventos_por_id = {}

    pagina = 0

    paginas_extra_restantes = (
        MARGEN_PAGINAS_EXTRA
    )

    while pagina < MAX_PAGINAS:

        print(
            f"  [equipo {team_id}] "
            f"Descargando página {pagina}..."
        )

        data = obtener_pagina(
            team_id,
            pagina
        )

        # -----------------------------------------------------
        # No hay más páginas
        # -----------------------------------------------------

        if (
            not data
            or "events" not in data
            or not data["events"]
        ):

            print(
                "  No hay más páginas disponibles."
            )

            break

        fechas_pagina = []

        # -----------------------------------------------------
        # PROCESAR EVENTOS
        # -----------------------------------------------------

        for evento in data["events"]:

            # -------------------------------------------------
            # Solo finalizados
            # -------------------------------------------------

            if not evento_finalizado(evento):

                continue

            # -------------------------------------------------
            # Excluir amistosos
            # -------------------------------------------------

            if competicion_excluida(evento):

                continue

            # -------------------------------------------------
            # Procesar evento
            # -------------------------------------------------

            partido = parsear_evento(
                evento,
                team_id_int
            )

            if partido:

                eventos_por_id[
                    partido["id"]
                ] = partido

                fechas_pagina.append(
                    partido["fecha"]
                )

        # -----------------------------------------------------
        # Rango de fechas
        # -----------------------------------------------------

        if fechas_pagina:

            print(
                "    Rango de fechas en esta página: "
                f"{min(fechas_pagina)} -> "
                f"{max(fechas_pagina)}"
            )

        # -----------------------------------------------------
        # PARTIDOS CONDICIONADOS
        # -----------------------------------------------------

        condicionados = [

            p

            for p in eventos_por_id.values()

            if p[condicion_campo]
            == team_id_int

        ]

        print(
            "    Acumulados: "
            f"{len(eventos_por_id)} general | "
            f"{len(condicionados)} condicionado"
        )

        # -----------------------------------------------------
        # Siguiente página
        # -----------------------------------------------------

        pagina += 1

        time.sleep(
            SLEEP_ENTRE_PAGINAS
        )

        # -----------------------------------------------------
        # Verificar si existen más páginas
        # -----------------------------------------------------

        hay_siguiente = data.get(
            "hasNextPage",
            True
        )

        if not hay_siguiente:

            print(
                "  La API indica que no hay más páginas "
                "(hasNextPage=False)."
            )

            break

        # -----------------------------------------------------
        # Si ya tenemos suficientes partidos de ambos tipos
        # hacemos unas páginas extra para tener margen.
        # -----------------------------------------------------

        if (
            len(eventos_por_id) >= OBJETIVO
            and len(condicionados) >= OBJETIVO
        ):

            if paginas_extra_restantes <= 0:

                break

            paginas_extra_restantes -= 1

    # =============================================================================
    # ORDEN FINAL
    # =============================================================================

    todos_ordenados = sorted(
        eventos_por_id.values(),
        key=lambda p: p["timestamp"],
        reverse=True
    )

    # ---------------------------------------------------------
    # Filtrar condición
    # ---------------------------------------------------------

    condicionados_ordenados = [

        p

        for p in todos_ordenados

        if p[condicion_campo]
        == team_id_int

    ]

    # ---------------------------------------------------------
    # Devolver solamente los últimos 10
    # ---------------------------------------------------------

    return (
        todos_ordenados[:OBJETIVO],
        condicionados_ordenados[:OBJETIVO]
    )


# =============================================================================
# FLUJO PRINCIPAL
# =============================================================================

def main():

    # ---------------------------------------------------------
    # PEDIR IDs
    # ---------------------------------------------------------

    ID_LOCAL = input(
        "ID del equipo LOCAL: "
    ).strip()

    ID_VISITANTE = input(
        "ID del equipo VISITANTE: "
    ).strip()

    # ---------------------------------------------------------
    # Validación
    # ---------------------------------------------------------

    try:

        int(ID_LOCAL)
        int(ID_VISITANTE)

    except ValueError:

        print(
            "❌ Los IDs de los equipos deben ser números."
        )

        return

    print()

    print("=" * 80)
    print("EQUIPO LOCAL")
    print("=" * 80)

    # ---------------------------------------------------------
    # Equipo local
    # ---------------------------------------------------------

    local_general, local_como_local = (
        obtener_partidos_equipo(
            ID_LOCAL,
            "_home_id"
        )
    )

    print()

    print("=" * 80)
    print("EQUIPO VISITANTE")
    print("=" * 80)

    # ---------------------------------------------------------
    # Equipo visitante
    # ---------------------------------------------------------

    visitante_general, visitante_como_visitante = (
        obtener_partidos_equipo(
            ID_VISITANTE,
            "_away_id"
        )
    )

    print()

    print("=" * 80)
    print("GUARDANDO ARCHIVOS")
    print("=" * 80)

    # ---------------------------------------------------------
    # CSV 1
    # ---------------------------------------------------------

    guardar_csv(
        "ultimos10_local_general.csv",
        local_general
    )

    # ---------------------------------------------------------
    # CSV 2
    # ---------------------------------------------------------

    guardar_csv(
        "ultimos10_local_como_local.csv",
        local_como_local
    )

    # ---------------------------------------------------------
    # CSV 3
    # ---------------------------------------------------------

    guardar_csv(
        "ultimos10_visitante_general.csv",
        visitante_general
    )

    # ---------------------------------------------------------
    # CSV 4
    # ---------------------------------------------------------

    guardar_csv(
        "ultimos10_visitante_como_visitante.csv",
        visitante_como_visitante
    )

    print()

    print("=" * 80)
    print("LISTO")
    print("=" * 80)

    print()
    print(
        "Los resultados fueron calculados "
        "exclusivamente usando normaltime."
    )


# =============================================================================
# EJECUTAR
# =============================================================================

if __name__ == "__main__":

    main()