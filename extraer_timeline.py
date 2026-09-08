"""
SofaScore - Estadísticas 1T / 2T vía API (sin Selenium, sin parsear HTML).

Usa dos endpoints:
  https://api.sofascore.com/api/v1/event/{id}              -> info del partido
  https://api.sofascore.com/api/v1/event/{id}/incidents     -> timeline de eventos

AVISO:
  Los nombres exactos de los campos de "incidents" están basados en la
  estructura típica documentada de esta API. Confirmado por el usuario:
    - Penal ANOTADO -> un solo incidente "goal" con incidentClass
      "penalty". Suma el gol Y el penal causado al rival, ambos desde
      ese mismo incidente.
    - Penal FALLADO -> un solo incidente "inGamePenalty". Suma
      únicamente el penal causado al rival (no hay gol).
  Si el script encuentra algo que no puede clasificar, lo imprime
  completo bajo "INCIDENTE NO RECONOCIDO".

Requisitos:
    pip install curl_cffi
"""

from curl_cffi import requests
import os
import re
import csv
import json

# =============================================================================
# CONFIGURACIÓN
# =============================================================================

CARPETA = "sofascore_historico"
os.makedirs(CARPETA, exist_ok=True)

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

def obtener_event_id(url_o_id):
    """Acepta una URL completa (con #id:NNNN) o directamente el ID numérico."""
    url_o_id = url_o_id.strip()

    if url_o_id.isdigit():
        return url_o_id

    m = re.search(r"#id:(\d+)", url_o_id)
    if m:
        return m.group(1)

    # Algunas URLs viejas no tienen #id, sino que el id va al final del path
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


def clasificar_periodo(minuto):
    if minuto is None:
        return "TANDA"
    if minuto <= 45:
        return "1T"
    if minuto <= 90:
        return "2T"
    return "EXTRA"


# =============================================================================
# ESTADÍSTICAS
# =============================================================================

def crear_estadisticas():
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
        "1T": {"local": equipo(), "visitante": equipo()},
        "2T": {"local": equipo(), "visitante": equipo()},
    }


def procesar_incidente(estadisticas, incidente):
    """
    incidente ya normalizado a:
      {
        "categoria": "goal" | "card" | "penalty",
        "subtipo": "regular" | "penalty" | "ownGoal"   (si categoria == "goal")
                   | "yellow" | "red" | "yellowRed"     (si categoria == "card")
                   | None                                (si categoria == "penalty")
        "minuto": int,
        "equipo": "local" | "visitante",
      }

    Nota sobre penales:
      Penal ANOTADO -> un solo incidente "goal" con subtipo=="penalty".
      Ese mismo incidente suma el gol Y el penal causado al rival.
      Penal FALLADO -> un solo incidente "inGamePenalty", normalizado
      aquí a categoria=="penalty". Suma únicamente el penal causado al
      rival (no hay gol que sumar).
    """

    minuto = incidente["minuto"]
    equipo = incidente["equipo"]

    periodo = clasificar_periodo(minuto)
    if periodo not in ("1T", "2T"):
        return

    if equipo not in ("local", "visitante"):
        return

    datos = estadisticas[periodo][equipo]
    categoria = incidente["categoria"]
    subtipo = incidente["subtipo"]

    contrario = "visitante" if equipo == "local" else "local"

    if categoria == "goal":

        if subtipo == "regular":
            datos["goles"] += 1

        elif subtipo == "penalty":
            # Penal anotado: suma el gol Y el penal causado al rival,
            # ambos desde este mismo incidente.
            datos["goles"] += 1
            estadisticas[periodo][contrario]["penales_causados"] += 1

        elif subtipo == "ownGoal":
            # El gol suma para el equipo que aparece marcado como "equipo"
            # (quien se beneficia), pero el autogol es estadística del
            # equipo contrario (quien lo cometió).
            datos["goles"] += 1
            estadisticas[periodo][contrario]["autogoles"] += 1

    elif categoria == "penalty":
        # inGamePenalty (penal FALLADO): siempre cuenta como penal
        # causado por el equipo contrario al que remata. No suma gol
        # porque no lo hubo.
        estadisticas[periodo][contrario]["penales_causados"] += 1

    elif categoria == "card":

        if subtipo == "yellow":
            datos["amarillas"] += 1

        elif subtipo == "red":
            datos["rojas"] += 1

        elif subtipo == "yellowRed":
            datos["amarillas"] += 1
            datos["rojas"] += 1
            datos["segunda_amarilla"] += 1


# =============================================================================
# NORMALIZAR INCIDENTES DE LA API
# =============================================================================

def normalizar_incidentes(incidents_raw):
    """
    Convierte la lista cruda de /event/{id}/incidents en la forma
    normalizada que usa procesar_incidente().

    Si encuentra algo que no puede clasificar con certeza, lo imprime
    para poder ajustar el mapeo.
    """

    normalizados = []

    for inc in incidents_raw:

        tipo = inc.get("incidentType")

        if tipo not in ("goal", "card", "inGamePenalty"):
            # Sustituciones, VAR, "period" (inicio/fin de tiempo), etc.
            # No nos interesan para estas estadísticas.
            continue

        minuto = inc.get("time")
        is_home = inc.get("isHome")

        if minuto is None or is_home is None:
            print("\n⚠ INCIDENTE NO RECONOCIDO (falta time o isHome):")
            print(json.dumps(inc, indent=2, ensure_ascii=False))
            continue

        equipo = "local" if is_home else "visitante"

        if tipo == "card":
            clase = inc.get("incidentClass")  # "yellow" | "red" | "yellowRed"
            if clase not in ("yellow", "red", "yellowRed"):
                print("\n⚠ INCIDENTE NO RECONOCIDO (card, incidentClass raro):")
                print(json.dumps(inc, indent=2, ensure_ascii=False))
                continue

            normalizados.append({
                "categoria": "card",
                "subtipo": clase,
                "minuto": minuto,
                "equipo": equipo,
            })

        elif tipo == "inGamePenalty":
            # Marcador del penal cuando fue FALLADO (no hay "goal"
            # acompañante). Siempre cuenta como penal causado al rival.
            normalizados.append({
                "categoria": "penalty",
                "subtipo": None,
                "minuto": minuto,
                "equipo": equipo,
            })

        elif tipo == "goal":
            clase = inc.get("incidentClass")  # "regular" | "penalty" | "ownGoal" (esperado)

            if clase in ("regular", "penalty", "ownGoal"):
                normalizados.append({
                    "categoria": "goal",
                    "subtipo": clase,
                    "minuto": minuto,
                    "equipo": equipo,
                })
            else:
                print("\n⚠ INCIDENTE NO RECONOCIDO (goal, incidentClass raro):")
                print(json.dumps(inc, indent=2, ensure_ascii=False))

    return normalizados


# =============================================================================
# CSV
# =============================================================================

def guardar_csv(ruta, event_id, local, visitante, estadisticas):
    campos = [
        "event_id", "local", "visitante", "tiempo", "equipo",
        "goles", "penales_causados", "amarillas", "rojas",
        "segunda_amarilla", "autogoles",
    ]

    with open(ruta, "w", newline="", encoding="utf-8-sig") as archivo:
        writer = csv.DictWriter(archivo, fieldnames=campos)
        writer.writeheader()

        for periodo in ("1T", "2T"):
            for lado, nombre in (("local", local), ("visitante", visitante)):
                d = estadisticas[periodo][lado]
                writer.writerow({
                    "event_id": event_id,
                    "local": local,
                    "visitante": visitante,
                    "tiempo": periodo,
                    "equipo": nombre,
                    "goles": d["goles"],
                    "penales_causados": d["penales_causados"],
                    "amarillas": d["amarillas"],
                    "rojas": d["rojas"],
                    "segunda_amarilla": d["segunda_amarilla"],
                    "autogoles": d["autogoles"],
                })


def mostrar_resultado(local, visitante, estadisticas):
    print("\n" + "=" * 100)
    print("RESULTADO FINAL - SOLO 1T Y 2T")
    print("=" * 100)

    for periodo in ("1T", "2T"):
        print(f"\n--- {periodo} ---")
        for lado, nombre in (("local", local), ("visitante", visitante)):
            d = estadisticas[periodo][lado]
            print(f"\n{nombre}")
            print(f"  Goles            : {d['goles']}")
            print(f"  Penales causados : {d['penales_causados']}")
            print(f"  Amarillas        : {d['amarillas']}")
            print(f"  Rojas            : {d['rojas']}")
            print(f"  Segunda amarilla : {d['segunda_amarilla']}")
            print(f"  Autogoles        : {d['autogoles']}")


# =============================================================================
# MAIN
# =============================================================================

def main():
    print("=" * 100)
    print("SOFASCORE - ESTADÍSTICAS 1T / 2T (vía API)")
    print("=" * 100)

    entrada = input(
        "\nPega la URL del partido (o directamente el event_id): "
    ).strip()

    event_id = obtener_event_id(entrada)
    if not event_id:
        print("\nERROR: no se pudo extraer el event_id.")
        return

    print(f"\nEvent ID: {event_id}")

    # --- Info del partido ---
    print("\nDescargando info del partido...")
    data_evento = obtener_json(f"/event/{event_id}")
    evento = data_evento.get("event", data_evento)  # por si no viene envuelto

    local = evento["homeTeam"]["name"]
    visitante = evento["awayTeam"]["name"]

    print(f"LOCAL     : {local}")
    print(f"VISITANTE : {visitante}")

    # --- Incidentes ---
    print("\nDescargando incidentes...")
    data_incidentes = obtener_json(f"/event/{event_id}/incidents")
    incidents_raw = data_incidentes.get("incidents", [])

    print(f"Incidentes crudos recibidos: {len(incidents_raw)}")

    incidentes = normalizar_incidentes(incidents_raw)
    print(f"Incidentes clasificados (goal/card válidos): {len(incidentes)}")

    # --- Procesar ---
    estadisticas = crear_estadisticas()
    for inc in incidentes:
        procesar_incidente(estadisticas, inc)

    mostrar_resultado(local, visitante, estadisticas)

    # --- Guardar CSV ---
    nombre_local = re.sub(r'[\\/:*?"<>|]', "", local).replace(" ", "_")
    nombre_visitante = re.sub(r'[\\/:*?"<>|]', "", visitante).replace(" ", "_")

    ruta_csv = os.path.join(
        CARPETA,
        f"{nombre_local}_vs_{nombre_visitante}_{event_id}_estadisticas_1T_2T.csv",
    )

    guardar_csv(ruta_csv, event_id, local, visitante, estadisticas)

    print(f"\n✓ CSV guardado -> {ruta_csv}")


if __name__ == "__main__":
    main()