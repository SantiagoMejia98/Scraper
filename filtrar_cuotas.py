import csv
import re


# ============================================================
# CONFIGURACIÓN
# ============================================================

ARCHIVO_ENTRADA = "cuotas_brutas.csv"
ARCHIVO_SALIDA = "cuotas_filtradas.csv"


# ============================================================
# UTILIDADES
# ============================================================

def limpiar(texto):

    if not texto:
        return ""

    return " ".join(
        str(texto).split()
    )


def normalizar(texto):

    texto = limpiar(
        texto
    ).lower()

    reemplazos = {
        "á": "a",
        "é": "e",
        "í": "i",
        "ó": "o",
        "ú": "u",
        "ü": "u",
    }

    for origen, destino in reemplazos.items():

        texto = texto.replace(
            origen,
            destino
        )

    return texto


# ============================================================
# EXCLUSIONES GENERALES
# ============================================================

def mercado_excluido(mercado):

    m = normalizar(
        mercado
    )

    # ========================================================
    # PRIMER TIEMPO
    # ========================================================

    if "primer tiempo" in m:
        return True

    if "1er tiempo" in m:
        return True

    if "1º tiempo" in m:
        return True

    # ========================================================
    # SEGUNDO TIEMPO
    # ========================================================

    if "segundo tiempo" in m:
        return True

    if "2do tiempo" in m:
        return True

    if "2º tiempo" in m:
        return True

    # ========================================================
    # HÁNDICAP
    # ========================================================

    if "handicap" in m:
        return True

    # ========================================================
    # PRÓXIMO EQUIPO EN RECIBIR
    # ========================================================

    if "proximo equipo en recibir" in m:
        return True

    # ========================================================
    # PRÓXIMO EQUIPO EN RECIBIR TARJETA ROJA
    # ========================================================

    if "proximo equipo en recibir la tarjeta roja" in m:
        return True

    # ========================================================
    # MERCADOS DE AMBOS TIEMPOS
    # ========================================================

    if "ambos tiempos" in m:
        return True

    return False


# ============================================================
# POPULARES
# ============================================================

def filtrar_populares(mercado):

    m = normalizar(
        mercado
    )

    # --------------------------------------------------------
    # Resultado del partido
    # --------------------------------------------------------

    if m == "resultado del partido":
        return True

    # --------------------------------------------------------
    # Ganar el partido o liderar por 2 goles
    # --------------------------------------------------------

    if (
        m ==
        "ganar el partido o liderar por 2 goles"
    ):
        return True

    # --------------------------------------------------------
    # Doble oportunidad
    # --------------------------------------------------------

    if m == "doble oportunidad":
        return True

    # --------------------------------------------------------
    # Marcador correcto
    # --------------------------------------------------------

    if m == "marcador correcto":
        return True

    return False


# ============================================================
# MÁS / MENOS
# ============================================================

def filtrar_mas_menos(mercado):

    m = normalizar(
        mercado
    )

    # --------------------------------------------------------
    # Goles totales Más/Menos
    # --------------------------------------------------------

    if m == "goles totales mas/menos":
        return True

    # --------------------------------------------------------
    # Goles totales por equipo
    # --------------------------------------------------------

    if re.match(
        r"^.+\s-\s*goles totales mas/menos$",
        m
    ):
        return True

    # --------------------------------------------------------
    # Resultado del partido con Más/Menos
    # --------------------------------------------------------

    if re.match(
        r"^resultado del partido con mas/menos",
        m
    ):
        return True

    # --------------------------------------------------------
    # Ambos anotan y Más/Menos
    # --------------------------------------------------------

    if re.match(
        r"^ambos anotan y mas/menos",
        m
    ):
        return True

    # --------------------------------------------------------
    # Resultado del partido o Goles totales Más/Menos
    # --------------------------------------------------------

    if re.match(
        r"^resultado del partido o goles totales mas/menos",
        m
    ):
        return True

    # --------------------------------------------------------
    # Resultado del partido o Ambos equipos anotan
    # --------------------------------------------------------

    if (
        m ==
        "resultado del partido o ambos equipos anotan"
    ):
        return True

    return False


# ============================================================
# GOLES
# ============================================================

def filtrar_goles(mercado):

    m = normalizar(
        mercado
    )

    # --------------------------------------------------------
    # Ambos equipos anotan
    # --------------------------------------------------------

    if m == "ambos equipos anotan":
        return True

    # --------------------------------------------------------
    # Ambos equipos anotan o Más de 2.5
    # --------------------------------------------------------

    if re.match(
        r"^ambos equipos anotan o mas de",
        m
    ):
        return True

    # --------------------------------------------------------
    # Resultado del partido / Ambos Equipos Anotan
    # --------------------------------------------------------

    if (
        m ==
        "resultado del partido / ambos equipos anotan"
    ):
        return True

    # --------------------------------------------------------
    # Doble Oportunidad con Más/Menos
    # --------------------------------------------------------

    if re.match(
        r"^doble oportunidad con mas/menos",
        m
    ):
        return True

    # --------------------------------------------------------
    # Doble oportunidad / Ambos equipos anotan
    # --------------------------------------------------------

    if (
        m ==
        "doble oportunidad / ambos equipos anotan"
    ):
        return True

    # --------------------------------------------------------
    # Total de goles
    # --------------------------------------------------------

    if m == "total de goles":
        return True

    return False


# ============================================================
# TIROS DE ESQUINA
# ============================================================

def filtrar_esquinas(mercado):

    m = normalizar(
        mercado
    )

    # --------------------------------------------------------
    # Tiros de esquina Menos/Más
    # --------------------------------------------------------

    if (
        m ==
        "tiros de esquina menos/mas"
    ):
        return True

    # --------------------------------------------------------
    # Tiros de esquina por equipo
    # --------------------------------------------------------

    if re.match(
        r"^.+\s+tiros de esquina menos/mas$",
        m
    ):
        return True

    # --------------------------------------------------------
    # Equipo con más tiros de esquina
    # --------------------------------------------------------

    if (
        m ==
        "equipo con mas tiros de esquina"
    ):
        return True

    # --------------------------------------------------------
    # Total de tiros de esquina
    # --------------------------------------------------------

    if (
        m ==
        "total de tiros de esquina"
    ):
        return True

    # --------------------------------------------------------
    # Rango de tiros de esquina
    # --------------------------------------------------------

    if (
        m ==
        "rango de tiros de esquina"
    ):
        return True

    return False


# ============================================================
# TARJETAS
# ============================================================

def filtrar_tarjetas(mercado):

    m = normalizar(
        mercado
    )

    # --------------------------------------------------------
    # Tarjetas totales Más/Menos
    # --------------------------------------------------------

    if (
        m ==
        "tarjetas totales mas/menos"
    ):
        return True

    # --------------------------------------------------------
    # Tarjetas totales por equipo
    # --------------------------------------------------------

    if re.match(
        r"^.+\s+tarjetas totales mas/menos$",
        m
    ):
        return True

    # --------------------------------------------------------
    # Ambos equipos reciben una tarjeta
    # --------------------------------------------------------

    if (
        m ==
        "ambos equipos reciben una tarjeta"
    ):
        return True

    # --------------------------------------------------------
    # Ambos equipos reciben 2 o más tarjetas
    # --------------------------------------------------------

    if (
        m ==
        "ambos equipos reciben 2 o mas tarjetas"
    ):
        return True

    # --------------------------------------------------------
    # Total de tarjetas rojas
    # --------------------------------------------------------

    if (
        m ==
        "total de tarjetas rojas"
    ):
        return True

    # --------------------------------------------------------
    # Equipo con más tarjetas
    # --------------------------------------------------------

    if (
        m ==
        "equipo con mas tarjetas"
    ):
        return True

    # --------------------------------------------------------
    # Tarjeta roja por equipo
    # --------------------------------------------------------

    if re.match(
        r"^.+\s+tarjeta roja$",
        m
    ):
        return True

    # --------------------------------------------------------
    # Tarjetas Rangos
    # --------------------------------------------------------

    if (
        m ==
        "tarjetas rangos"
    ):
        return True

    return False


# ============================================================
# ESTADÍSTICAS
# ============================================================

def filtrar_estadisticas(mercado):

    m = normalizar(
        mercado
    )

    # --------------------------------------------------------
    # REMATES TOTALES
    # --------------------------------------------------------

    if m == "remates totales":
        return True

    if re.match(
        r"^.+\s+remates totales$",
        m
    ):
        return True

    # --------------------------------------------------------
    # TIROS AL ARCO
    # --------------------------------------------------------

    if m == "tiros al arco":
        return True

    if re.match(
        r"^.+\s+tiros al arco$",
        m
    ):
        return True

    # --------------------------------------------------------
    # RANGOS DE TIROS AL ARCO
    # --------------------------------------------------------

    if m == "rangos de tiros al arco":
        return True

    # --------------------------------------------------------
    # TOTAL DE FALTAS COMETIDAS
    # --------------------------------------------------------

    if m == "total de faltas cometidas":
        return True

    if re.match(
        r"^.+\s+total de faltas cometidas$",
        m
    ):
        return True

    # --------------------------------------------------------
    # TOTAL DE FUERAS DE LUGAR
    # --------------------------------------------------------

    if m == "total de fueras de lugar":
        return True

    if re.match(
        r"^.+\s+total de fueras de lugar$",
        m
    ):
        return True

    # --------------------------------------------------------
    # PALO
    # --------------------------------------------------------

    if m == "palo":
        return True

    # --------------------------------------------------------
    # TOTAL DE SAQUES DE META
    # --------------------------------------------------------

    if m == "total de saques de meta":
        return True

    if re.match(
        r"^.+\s+total de saques de meta$",
        m
    ):
        return True

    # --------------------------------------------------------
    # TOTAL DE SAQUES DE BANDA
    # --------------------------------------------------------

    if m == "total de saques de banda":
        return True

    if re.match(
        r"^.+\s+total de saques de banda$",
        m
    ):
        return True

    # --------------------------------------------------------
    # TACKLES TOTALES
    # --------------------------------------------------------

    if m == "tackles totales":
        return True

    if re.match(
        r"^.+\s+tackles totales$",
        m
    ):
        return True

    # --------------------------------------------------------
    # TODO LO DEMÁS DE ESTADÍSTICAS SE ELIMINA
    # --------------------------------------------------------

    return False


# ============================================================
# FILTRO GENERAL
# ============================================================

def mercado_permitido(
    pestana,
    mercado
):

    p = normalizar(
        pestana
    )

    # ========================================================
    # EXCLUSIONES GENERALES
    #
    # ESTO SE EJECUTA ANTES DE CUALQUIER PESTAÑA.
    # ========================================================

    if mercado_excluido(
        mercado
    ):
        return False

    # ========================================================
    # ESTADÍSTICAS
    # ========================================================

    if (
        "estadistica" in p
        or
        "estadisticas" in p
    ):

        return filtrar_estadisticas(
            mercado
        )

    # ========================================================
    # POPULARES
    # ========================================================

    if "popular" in p:

        return filtrar_populares(
            mercado
        )

    # ========================================================
    # MÁS / MENOS
    # ========================================================

    if (
        "mas/menos" in p
        or
        "mas menos" in p
    ):

        return filtrar_mas_menos(
            mercado
        )

    # ========================================================
    # GOLES
    # ========================================================

    if "gole" in p:

        return filtrar_goles(
            mercado
        )

    # ========================================================
    # TIROS DE ESQUINA
    # ========================================================

    if "esquina" in p:

        return filtrar_esquinas(
            mercado
        )

    # ========================================================
    # TARJETAS
    # ========================================================

    if "tarjeta" in p:

        return filtrar_tarjetas(
            mercado
        )

    # ========================================================
    # TODO LO DEMÁS
    # ========================================================

    return False


# ============================================================
# FILTRAR CSV
# ============================================================

def filtrar_csv():

    filas = []

    # ========================================================
    # LEER CSV
    # ========================================================

    print()
    print("=" * 90)

    print(
        "📂 LEYENDO CSV BRUTO"
    )

    print("=" * 90)

    try:

        with open(
            ARCHIVO_ENTRADA,
            "r",
            newline="",
            encoding="utf-8-sig"
        ) as archivo:

            reader = csv.DictReader(
                archivo
            )

            for fila in reader:

                filas.append(
                    fila
                )

    except FileNotFoundError:

        print()
        print(
            "❌ ERROR"
        )

        print(
            f"No existe: "
            f"{ARCHIVO_ENTRADA}"
        )

        print(
            "Primero ejecuta el extractor."
        )

        return

    print()
    print(
        f"Filas originales: "
        f"{len(filas)}"
    )

    # ========================================================
    # FILTRAR MERCADOS
    # ========================================================

    conservadas = []
    eliminadas_por_filtro = []

    for fila in filas:

        pestana = fila.get(
            "pestana",
            ""
        )

        mercado = fila.get(
            "mercado",
            ""
        )

        if mercado_permitido(
            pestana,
            mercado
        ):

            conservadas.append(
                fila
            )

        else:

            eliminadas_por_filtro.append(
                fila
            )

    # ========================================================
    # RESUMEN DEL FILTRO
    # ========================================================

    print()
    print("=" * 90)

    print(
        "🔎 FILTRO DE MERCADOS"
    )

    print("=" * 90)

    print(
        f"Conservadas: "
        f"{len(conservadas)}"
    )

    print(
        f"Eliminadas:  "
        f"{len(eliminadas_por_filtro)}"
    )

    # ========================================================
    # GUARDAR CSV
    # ========================================================

    columnas = [
        "partido",
        "pestana",
        "mercado",
        "seleccion",
        "linea",
        "cuota",
    ]

    with open(
        ARCHIVO_SALIDA,
        "w",
        newline="",
        encoding="utf-8-sig"
    ) as archivo:

        writer = csv.DictWriter(
            archivo,
            fieldnames=columnas
        )

        writer.writeheader()

        writer.writerows(
            conservadas
        )

    # ========================================================
    # RESUMEN FINAL
    # ========================================================

    print()
    print("=" * 90)

    print(
        "✅ FILTRADO TERMINADO"
    )

    print("=" * 90)

    print(
        f"Filas originales: "
        f"{len(filas)}"
    )

    print(
        f"Filas finales:    "
        f"{len(conservadas)}"
    )

    print()
    print(
        "📄 Archivo generado:"
    )

    print(
        f"   {ARCHIVO_SALIDA}"
    )

    print("=" * 90)


# ============================================================
# EJECUTAR
# ============================================================

if __name__ == "__main__":

    filtrar_csv()