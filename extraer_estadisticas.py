"""
SofaScore - Estadísticas por período (1ST / 2ND / TOTAL_90) vía API.

Reemplaza por completo el enfoque de Selenium: el endpoint de
estadísticas de SofaScore ya devuelve los datos separados por período
(1ST, 2ND, y a veces ALL), así que no hace falta simular clics en
pestañas ni parsear el DOM.

Endpoints usados:
  https://api.sofascore.com/api/v1/event/{id}              -> equipos
  https://api.sofascore.com/api/v1/event/{id}/statistics    -> stats por período

AVISO:
  No se pudo verificar en vivo la estructura exacta de "statistics"
  (nombres de campos como "period", "statisticsItems", "homeValue" /
  "awayValue"). Están basados en la estructura típica documentada de
  esta API. Si el script imprime "ESTRUCTURA NO RECONOCIDA", pegame
  ese output para ajustar el parseo.

Requisitos:
    pip install curl_cffi pandas
"""

from curl_cffi import requests
from pathlib import Path
import re
import json
import unicodedata
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
# UTILIDADES GENERALES
# =============================================================================

def limpiar(texto):
    if texto is None:
        return ""
    return re.sub(r"\s+", " ", str(texto)).strip()


def quitar_acentos(texto):
    texto = unicodedata.normalize("NFKD", texto)
    return "".join(c for c in texto if not unicodedata.combining(c))


def nombre_archivo(texto):
    texto = quitar_acentos(limpiar(texto))
    texto = re.sub(r'[<>:"/\\|?*]', "", texto)
    return texto.replace(" ", "_")


def normalizar_texto(texto):
    return limpiar(str(texto)).casefold()


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


def convertir_numero(valor):
    if valor is None:
        return None
    texto = limpiar(str(valor))
    if not texto:
        return None

    match = re.fullmatch(r"(-?\d+(?:[.,]\d+)?)\s*%", texto)
    if match:
        return float(match.group(1).replace(",", "."))

    match = re.fullmatch(r"-?\d+(?:[.,]\d+)?", texto)
    if match:
        numero = float(match.group(0).replace(",", "."))
        return int(numero) if numero.is_integer() else numero

    return None


def es_porcentaje(nombre, valor_local, valor_visitante):
    texto_nombre = normalizar_texto(nombre)
    texto_local = limpiar(str(valor_local or ""))
    texto_visitante = limpiar(str(valor_visitante or ""))

    if "%" in texto_local or "%" in texto_visitante:
        return True

    palabras = [
        "%", "possession", "posesión", "accuracy", "precision",
        "precisión", "percentage", "porcentaje",
    ]
    return any(p in texto_nombre for p in palabras)


# =============================================================================
# EXTRAER ESTADÍSTICAS DE UN PERÍODO (desde el JSON de la API)
# =============================================================================

def extraer_periodo(data_stats, period_key, event_id, local_equipo, visitante_equipo):
    """
    Busca el bloque correspondiente a period_key (p.ej. "1ST", "2ND",
    "ALL") dentro de data_stats["statistics"], y devuelve una lista de
    registros en el mismo formato que usaba la versión Selenium:
        {event_id, local_equipo, visitante_equipo, periodo, estadistica,
         local, visitante}
    """

    bloques = data_stats.get("statistics", [])

    bloque = None
    for b in bloques:
        if b.get("period") == period_key:
            bloque = b
            break

    if bloque is None:
        return []

    resultados = []

    for grupo in bloque.get("groups", []):
        for item in grupo.get("statisticsItems", []):

            nombre = item.get("name")

            # Preferimos el texto ya formateado que manda la API
            # ("55%", "12", etc.). Si no está, probamos con los
            # valores numéricos crudos.
            valor_local = item.get("home")
            valor_visitante = item.get("away")

            if valor_local is None and "homeValue" in item:
                valor_local = item.get("homeValue")
            if valor_visitante is None and "awayValue" in item:
                valor_visitante = item.get("awayValue")

            if nombre is None or (valor_local is None and valor_visitante is None):
                print("\n⚠ ESTRUCTURA NO RECONOCIDA (statisticsItem):")
                print(json.dumps(item, indent=2, ensure_ascii=False))
                continue

            resultados.append({
                "event_id": event_id,
                "local_equipo": local_equipo,
                "visitante_equipo": visitante_equipo,
                "periodo": period_key,
                "estadistica": nombre,
                "local": valor_local,
                "visitante": valor_visitante,
            })

    print(f"[{period_key}] Estadísticas extraídas: {len(resultados)}")
    return resultados


# =============================================================================
# CALCULAR TOTAL 90 (suma 1ST + 2ND; promedio para porcentajes)
# =============================================================================

def calcular_total_90(datos_1st, datos_2nd, event_id, local_equipo, visitante_equipo):

    print()
    print("=" * 100)
    print("CALCULANDO TOTAL 90")
    print("=" * 100)

    primero = {normalizar_texto(f["estadistica"]): f for f in datos_1st}
    segundo = {normalizar_texto(f["estadistica"]): f for f in datos_2nd}

    estadisticas = []
    for fila in datos_1st + datos_2nd:
        if fila["estadistica"] not in estadisticas:
            estadisticas.append(fila["estadistica"])

    resultados = []

    for nombre in estadisticas:
        clave = normalizar_texto(nombre)
        fila_1 = primero.get(clave)
        fila_2 = segundo.get(clave)

        v1l = fila_1["local"] if fila_1 else ""
        v1v = fila_1["visitante"] if fila_1 else ""
        v2l = fila_2["local"] if fila_2 else ""
        v2v = fila_2["visitante"] if fila_2 else ""

        es_pct = es_porcentaje(nombre, v1l, v1v)

        n1l, n2l = convertir_numero(v1l), convertir_numero(v2l)
        n1v, n2v = convertir_numero(v1v), convertir_numero(v2v)

        def combinar(n1, n2, promedio):
            if n1 is not None and n2 is not None:
                return (n1 + n2) / 2 if promedio else n1 + n2
            if n1 is not None:
                return n1
            if n2 is not None:
                return n2
            return ""

        total_local = combinar(n1l, n2l, es_pct)
        total_visitante = combinar(n1v, n2v, es_pct)

        if es_pct:
            if total_local != "":
                total_local = f"{total_local:.2f}%"
            if total_visitante != "":
                total_visitante = f"{total_visitante:.2f}%"

        resultados.append({
            "event_id": event_id,
            "local_equipo": local_equipo,
            "visitante_equipo": visitante_equipo,
            "periodo": "TOTAL",
            "estadistica": nombre,
            "local": total_local,
            "visitante": total_visitante,
        })

    print(f"Total estadísticas TOTAL_90: {len(resultados)}")
    return resultados


# =============================================================================
# MAIN PROGRAM
# =============================================================================

def main():
    print("=" * 100)
    print("SOFASCORE - ESTADÍSTICAS POR PERÍODO (vía API)")
    print("=" * 100)

    entrada = input(
        "\nPega la URL del partido (o directamente el event_id): "
    ).strip()

    if not entrada:
        print("❌ No se introdujo ninguna URL/ID.")
        return

    event_id = obtener_event_id(entrada)
    if not event_id:
        print("❌ No se pudo extraer el event_id.")
        return

    print(f"\nEvent ID: {event_id}")

    # --- Info del partido (nombres de equipos) ---
    print("\nDescargando info del partido...")
    data_evento = obtener_json(f"/event/{event_id}")
    evento = data_evento.get("event", data_evento)

    local_equipo = evento["homeTeam"]["name"]
    visitante_equipo = evento["awayTeam"]["name"]

    print(f"LOCAL     : {local_equipo}")
    print(f"VISITANTE : {visitante_equipo}")

    # --- Estadísticas ---
    print("\nDescargando estadísticas...")
    data_stats = obtener_json(f"/event/{event_id}/statistics")

    periodos_disponibles = {
        b.get("period") for b in data_stats.get("statistics", [])
    }
    print(f"Períodos disponibles en la API: {periodos_disponibles}")

    resultados_totales = []

    tiene_1st = "1ST" in periodos_disponibles
    tiene_2nd = "2ND" in periodos_disponibles

    if tiene_1st and tiene_2nd:

        print("\n✓ Se encontraron 1ST y 2ND. Se calculará TOTAL_90.")

        datos_1st = extraer_periodo(
            data_stats, "1ST", event_id, local_equipo, visitante_equipo
        )
        datos_2nd = extraer_periodo(
            data_stats, "2ND", event_id, local_equipo, visitante_equipo
        )
        datos_total_90 = calcular_total_90(
            datos_1st, datos_2nd, event_id, local_equipo, visitante_equipo
        )

        resultados_totales.extend(datos_1st)
        resultados_totales.extend(datos_2nd)
        resultados_totales.extend(datos_total_90)

    elif "ALL" in periodos_disponibles:

        print("\n⚠ No hay 1ST + 2ND. Se usará ALL como TOTAL.")

        datos_all = extraer_periodo(
            data_stats, "ALL", event_id, local_equipo, visitante_equipo
        )
        # Renombramos periodo a "TOTAL" para mantener consistencia con
        # el resto del pipeline.
        for fila in datos_all:
            fila["periodo"] = "TOTAL"

        resultados_totales.extend(datos_all)

    else:
        print("\n❌ No se encontraron estadísticas utilizables (ni 1ST/2ND ni ALL).")

    # --- DataFrame ---
    print("\n" + "=" * 100)
    print("CREANDO DATAFRAME")
    print("=" * 100)

    df = pd.DataFrame(resultados_totales)

    if df.empty:
        print("\n❌ No se encontraron estadísticas válidas.")
        return

    df = df.drop_duplicates(
        subset=["event_id", "periodo", "estadistica", "local", "visitante"]
    ).reset_index(drop=True)

    nombre_local = nombre_archivo(local_equipo)
    nombre_visitante = nombre_archivo(visitante_equipo)

    nombre_csv = f"{nombre_local}_vs_{nombre_visitante}_{event_id}_90min.csv"
    archivo_csv = CARPETA / nombre_csv

    df.to_csv(archivo_csv, index=False, encoding="utf-8-sig")

    print()
    print(df.to_string(index=False))

    print(f"\n✓ Archivo creado: {archivo_csv}")
    print(f"Partido: {local_equipo} vs {visitante_equipo}")
    print(f"Estadísticas: {len(df)}")

    print("\nFilas por periodo:")
    print(df.groupby("periodo").size().to_string())

    # --- Total Shots (ejemplo de consulta puntual, igual que el original) ---
    print("\n" + "=" * 100)
    print("TOTAL SHOTS")
    print("=" * 100)

    total_shots = df[df["estadistica"].str.strip().str.lower() == "total shots"]

    if total_shots.empty:
        print("No encontrado.")
    else:
        for _, fila in total_shots.iterrows():
            print(f"{fila['periodo']:<10} {str(fila['local']):>10} - {str(fila['visitante']):<10}")

    print("\n" + "=" * 100)
    print("TERMINADO")
    print("=" * 100)


if __name__ == "__main__":
    main()