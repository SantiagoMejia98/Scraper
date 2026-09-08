from curl_cffi import requests
from collections import Counter
import time


# =============================================================================
# CONFIGURACIÓN
# =============================================================================

API_BASE = "https://api.sofascore.com/api/v1"

HEADERS = {
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
    "Referer": "https://www.sofascore.com/",
    "Origin": "https://www.sofascore.com",
}


# ID DEL EQUIPO QUE QUIERES ANALIZAR
TEAM_ID = 6105


# Cantidad de páginas de partidos que quieres revisar
PAGINAS = 5


# Pausa entre páginas
SLEEP = 1


sesion = requests.Session(
    impersonate="chrome124"
)


# =============================================================================
# PETICIÓN
# =============================================================================

def obtener_json(path):

    url = f"{API_BASE}{path}"

    response = sesion.get(
        url,
        headers=HEADERS,
        timeout=15
    )

    response.raise_for_status()

    return response.json()


# =============================================================================
# OBTENER PARTIDOS
# =============================================================================

def obtener_partidos():

    partidos = {}

    print()
    print("=" * 80)
    print("BUSCANDO PARTIDOS")
    print("=" * 80)


    for pagina in range(PAGINAS):

        print(
            f"Página {pagina}..."
        )


        try:

            data = obtener_json(
                f"/team/{TEAM_ID}/events/last/{pagina}"
            )


        except Exception as e:

            print(
                f"ERROR página {pagina}: {e}"
            )

            continue


        eventos = data.get(
            "events",
            []
        )


        for evento in eventos:

            event_id = evento.get(
                "id"
            )


            if event_id is None:

                continue


            # ---------------------------------------------------------------
            # Solo partidos finalizados
            # ---------------------------------------------------------------

            status = evento.get(
                "status",
                {}
            )


            if status.get(
                "type"
            ) != "finished":

                continue


            partidos[event_id] = evento


        time.sleep(
            SLEEP
        )


    return list(
        partidos.values()
    )


# =============================================================================
# OBTENER ALINEACIONES
# =============================================================================

def obtener_alineaciones(
    event_id
):

    return obtener_json(
        f"/event/{event_id}/lineups"
    )


# =============================================================================
# EXTRAER ESTADÍSTICAS
# =============================================================================

def extraer_estadisticas(
    data_lineups
):

    estadisticas = []


    for lado in (
        "home",
        "away"
    ):

        equipo = data_lineups.get(
            lado,
            {}
        )


        jugadores = equipo.get(
            "players",
            []
        )


        for jugador in jugadores:

            stats = jugador.get(
                "statistics",
                {}
            )


            if not stats:

                continue


            player = jugador.get(
                "player",
                {}
            )


            nombre = player.get(
                "name",
                "SIN NOMBRE"
            )


            player_id = player.get(
                "id"
            )


            # ---------------------------------------------------------------
            # Guardamos cada campo
            # ---------------------------------------------------------------

            for campo, valor in stats.items():

                estadisticas.append({

                    "campo":
                        campo,

                    "player_id":
                        player_id,

                    "nombre":
                        nombre,

                })


    return estadisticas


# =============================================================================
# PROGRAMA PRINCIPAL
# =============================================================================

def main():

    print()
    print("=" * 80)
    print("LISTADO DE ESTADÍSTICAS DE JUGADORES DE SOFASCORE")
    print("=" * 80)


    # =========================================================================
    # PARTIDOS
    # =========================================================================

    partidos = obtener_partidos()


    print()
    print(
        f"Partidos encontrados: {len(partidos)}"
    )


    if not partidos:

        print(
            "No se encontraron partidos."
        )

        return


    # =========================================================================
    # CAMPOS ENCONTRADOS
    # =========================================================================

    campos = set()

    frecuencia = Counter()


    jugadores_procesados = 0

    partidos_procesados = 0


    # =========================================================================
    # RECORRER PARTIDOS
    # =========================================================================

    for posicion, evento in enumerate(
        partidos,
        start=1
    ):

        event_id = evento.get(
            "id"
        )


        home = evento.get(
            "homeTeam",
            {}
        ).get(
            "name",
            ""
        )


        away = evento.get(
            "awayTeam",
            {}
        ).get(
            "name",
            ""
        )


        print()
        print(
            f"[{posicion}/{len(partidos)}] "
            f"{home} vs {away}"
        )

        print(
            f"Event ID: {event_id}"
        )


        try:

            data_lineups = obtener_alineaciones(
                event_id
            )


        except Exception as e:

            print(
                f"  ERROR alineaciones: {e}"
            )

            continue


        # =====================================================================
        # RECORRER JUGADORES
        # =====================================================================

        for lado in (
            "home",
            "away"
        ):

            equipo = data_lineups.get(
                lado,
                {}
            )


            jugadores = equipo.get(
                "players",
                []
            )


            for jugador in jugadores:

                stats = jugador.get(
                    "statistics",
                    {}
                )


                if not stats:

                    continue


                jugadores_procesados += 1


                # -------------------------------------------------------------
                # TODOS LOS CAMPOS DE STATISTICS
                # -------------------------------------------------------------

                for campo in stats.keys():

                    campos.add(
                        campo
                    )

                    frecuencia[
                        campo
                    ] += 1


        partidos_procesados += 1


    # =========================================================================
    # RESULTADO
    # =========================================================================

    print()
    print()
    print("=" * 80)
    print("RESULTADO")
    print("=" * 80)


    print()
    print(
        f"Partidos procesados: {partidos_procesados}"
    )


    print(
        f"Jugadores con estadísticas: "
        f"{jugadores_procesados}"
    )


    print(
        f"Estadísticas diferentes encontradas: "
        f"{len(campos)}"
    )


    # =========================================================================
    # LISTA ALFABÉTICA
    # =========================================================================

    print()
    print("=" * 80)
    print("ESTADÍSTICAS DISPONIBLES")
    print("=" * 80)


    campos_ordenados = sorted(
        campos,
        key=lambda x: x.lower()
    )


    for numero, campo in enumerate(
        campos_ordenados,
        start=1
    ):

        print(
            f"{numero:3}. {campo}"
        )


    # =========================================================================
    # FRECUENCIA
    # =========================================================================

    print()
    print("=" * 80)
    print("FRECUENCIA DE CADA ESTADÍSTICA")
    print("=" * 80)


    for campo in campos_ordenados:

        print(
            f"{campo:<45} "
            f"{frecuencia[campo]}"
        )


    # =========================================================================
    # FORMATO PYTHON
    # =========================================================================

    print()
    print("=" * 80)
    print("LISTA PARA COPIAR EN estadisticas.py")
    print("=" * 80)


    print()
    print("ESTADISTICAS_JUGADORES = {")


    for campo in campos_ordenados:

        print(
            f'    "{campo}",'
        )


    print("}")


    print()
    print("=" * 80)
    print("FIN")
    print("=" * 80)


# =============================================================================
# EJECUTAR
# =============================================================================

if __name__ == "__main__":

    main()