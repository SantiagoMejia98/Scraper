"""
SofaScore - Estadísticas de jugadores del equipo LOCAL, vía API.

Endpoint usado:
  https://api.sofascore.com/api/v1/event/{id}/lineups

Este endpoint devuelve, para cada equipo (home/away), la lista de
jugadores con un objeto "statistics" PLANO por jugador. Este script
guarda un único CSV "ancho" con TODOS los campos crudos de
`statistics` tal cual los devuelve la API, uno por jugador del equipo
local -- sin intentar reconstruir las pestañas
General/Attacking/Defending/Passing/Duels/Goalkeeping del frontend.

Requisitos:
    pip install curl_cffi pandas
"""

from curl_cffi import requests
from pathlib import Path
import re
import pandas as pd

# =============================================================================
# CONFIGURACIÓN
# =============================================================================

CARPETA = Path("sofascore_historico")
CARPETA.mkdir(exist_ok=True)

HEADERS = {
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
    "Referer": "https://www.sofascore.com/",
    "Origin": "https://www.sofascore.com",
}

sesion = requests.Session(impersonate="chrome124")

# =============================================================================
# UTILIDADES
# =============================================================================

def limpiar(texto):
    if texto is None:
        return ""
    return re.sub(r"\s+", " ", str(texto)).strip()


def obtener_event_id(url_o_id):
    url_o_id = url_o_id.strip()
    if url_o_id.isdigit():
        return url_o_id
    m = re.search(r"#id:(\d+)", url_o_id)
    if m:
        return m.group(1)
    m = re.search(r"/(\d+)(?:[/?#].*)?$", url_o_id)
    if m:
        return m.group(1)
    return None


def obtener_json(path):
    url = f"https://api.sofascore.com/api/v1{path}"
    resp = sesion.get(url, headers=HEADERS, timeout=15)

    if resp.status_code == 403:
        print("⚠ 403. Revisa fingerprint/IP. Detalle:")
        print(resp.text[:500])

    resp.raise_for_status()
    return resp.json()


# =============================================================================
# EXTRAER JUGADORES DEL LOCAL DESDE LINEUPS
# =============================================================================

def extraer_jugadores_local(data_lineups):
    """
    Devuelve una lista de dicts:
      {
        "nombre": ...,
        "posicion": ...,
        "numero": ...,
        "titular": bool,
        **statistics_planas
      }
    Solo para el equipo "home" (asumido como LOCAL).
    """

    home = data_lineups.get("home", {})
    jugadores_raw = home.get("players", [])

    if not jugadores_raw:
        print("\n⚠ No se encontraron jugadores en data['home']['players'].")
        print("Estructura recibida (primer nivel de claves):")
        print(list(data_lineups.keys()))

    resultados = []

    for j in jugadores_raw:
        info_jugador = j.get("player", {})
        stats = j.get("statistics", {})

        if not stats:
            # Es normal para jugadores que no llegaron a jugar minutos
            # (suplentes no utilizados no suelen tener statistics).
            continue

        fila = {
            "nombre": info_jugador.get("name", ""),
            "posicion": j.get("position", ""),
            "numero": j.get("shirtNumber", ""),
            "titular": not j.get("substitute", False),
        }

        # Agregamos TODOS los campos crudos de statistics, con nombres
        # de columna exactamente iguales a los de la API.
        for clave, valor in stats.items():
            fila[clave] = valor

        resultados.append(fila)

    return resultados


# =============================================================================
# GUARDAR CSV ANCHO (TODOS LOS CAMPOS CRUDOS)
# =============================================================================

def guardar_csv_ancho(jugadores, event_id):
    if not jugadores:
        print("\n❌ No hay jugadores para guardar.")
        return None

    df = pd.DataFrame(jugadores)

    ruta = CARPETA / f"player_stats_local_{event_id}.csv"
    df.to_csv(ruta, index=False, encoding="utf-8-sig")

    print(f"\n✓ CSV guardado -> {ruta}")
    print(f"  Jugadores: {len(df)}")
    print(f"  Columnas de estadísticas detectadas: {len(df.columns) - 4}")
    print("\n  Nombres de columnas:")
    for col in df.columns:
        print(f"    - {col}")

    return df


# =============================================================================
# MAIN
# =============================================================================

def main():
    print("=" * 100)
    print("SOFASCORE - PLAYER STATS DEL LOCAL (vía API)")
    print("=" * 100)

    entrada = input(
        "\nPega la URL del partido (o directamente el event_id): "
    ).strip()

    if not entrada:
        print("❌ URL/ID vacío.")
        return

    event_id = obtener_event_id(entrada)
    if not event_id:
        print("❌ No se pudo extraer el event_id.")
        return

    print(f"\nEvent ID: {event_id}")

    # --- Info del partido (para mostrar nombre del local) ---
    print("\nDescargando info del partido...")
    data_evento = obtener_json(f"/event/{event_id}")
    evento = data_evento.get("event", data_evento)
    local_equipo = evento["homeTeam"]["name"]
    print(f"LOCAL: {local_equipo}")

    # --- Lineups (alineaciones + estadísticas por jugador) ---
    print("\nDescargando lineups...")
    data_lineups = obtener_json(f"/event/{event_id}/lineups")

    jugadores = extraer_jugadores_local(data_lineups)
    print(f"\nJugadores del local con estadísticas: {len(jugadores)}")

    # --- Guardar ---
    guardar_csv_ancho(jugadores, event_id)

    print("\n" + "=" * 100)
    print("TERMINADO")
    print("=" * 100)


if __name__ == "__main__":
    main()