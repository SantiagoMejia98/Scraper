import csv
import os


# =============================================================================
# CONFIGURACIÓN
# =============================================================================

ARCHIVO_ENTRADA = "sofascore_historico/ultimos_10_partidos.csv"

ARCHIVO_SALIDA = "seleccion_ultimos_partidos.csv"

CANTIDAD = 10


# =============================================================================
# ENCABEZADO
# =============================================================================

print("=" * 110)
print("SOFASCORE - SELECCIÓN DE PARTIDOS PARA ANÁLISIS")
print("=" * 110)

print()
print("LÓGICA:")
print()
print("  • Se utiliza la lista de partidos ya descargada.")
print("  • Se descartan las competiciones amistosas.")
print("  • Se toman los 10 partidos más recientes en GENERAL.")
print("  • Se toman los 10 partidos más recientes de LOCAL.")
print("  • Se toman los 10 partidos más recientes de VISITANTE.")
print("  • El orden es reciente → antiguo.")
print()


# =============================================================================
# PEDIR EQUIPO
# =============================================================================

equipo = input(
    "Nombre exacto del equipo que quieres analizar: "
).strip()


if not equipo:

    print()
    print("❌ No se introdujo ningún equipo.")
    input("\nPresiona ENTER para cerrar...")
    raise SystemExit


# =============================================================================
# VERIFICAR ARCHIVO
# =============================================================================

if not os.path.exists(ARCHIVO_ENTRADA):

    print()
    print("❌ No se encontró el archivo:")
    print()
    print(
        os.path.abspath(
            ARCHIVO_ENTRADA
        )
    )

    print()
    print(
        "Coloca el CSV en la misma carpeta del programa."
    )

    input(
        "\nPresiona ENTER para cerrar..."
    )

    raise SystemExit


# =============================================================================
# FUNCIÓN PARA NORMALIZAR TEXTO
# =============================================================================

def normalizar(texto):

    if texto is None:

        return ""

    return (
        str(texto)
        .strip()
        .casefold()
    )


# =============================================================================
# FUNCIÓN PARA SABER SI ES AMISTOSO
# =============================================================================

def es_amistoso(competicion):

    texto = normalizar(
        competicion
    )

    # -------------------------------------------------------------------------
    # Club Friendly Games
    # -------------------------------------------------------------------------

    if texto == "club friendly games":

        return True


    # -------------------------------------------------------------------------
    # Cualquier competición que contenga Friendly
    #
    # Esto permite detectar también variantes como:
    #
    # Friendly Games
    # Club Friendly
    # International Friendly Games
    # etc.
    # -------------------------------------------------------------------------

    


    return False


# =============================================================================
# LEER CSV
# =============================================================================

print()
print("=" * 110)
print("1. LEYENDO LISTA DE PARTIDOS")
print("=" * 110)
print()


partidos = []


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

        partidos.append(
            fila
        )


print(
    f"Partidos encontrados en CSV: {len(partidos)}"
)


# =============================================================================
# MOSTRAR COLUMNAS
# =============================================================================

if partidos:

    print()
    print(
        "Columnas detectadas:"
    )

    for columna in partidos[0].keys():

        print(
            f"  • {columna}"
        )


# =============================================================================
# FILTRAR AMISTOSOS
# =============================================================================

print()
print("=" * 110)
print("2. FILTRANDO COMPETICIONES AMISTOSAS")
print("=" * 110)
print()


partidos_validos = []

amistosos = []


for partido in partidos:

    competicion = (
        partido.get(
            "competicion",
            ""
        )
        or ""
    ).strip()


    if es_amistoso(
        competicion
    ):

        amistosos.append(
            partido
        )

    else:

        partidos_validos.append(
            partido
        )


print(
    f"Partidos originales : {len(partidos)}"
)

print(
    f"Amistosos descartados: {len(amistosos)}"
)

print(
    f"Partidos válidos    : {len(partidos_validos)}"
)


# =============================================================================
# FUNCIÓN PARA COMPARAR EQUIPOS
# =============================================================================

def es_mismo_equipo(
    nombre1,
    nombre2
):

    return (
        normalizar(nombre1)
        ==
        normalizar(nombre2)
    )


# =============================================================================
# ENCONTRAR PARTIDOS DEL EQUIPO
# =============================================================================

print()
print("=" * 110)
print("3. BUSCANDO PARTIDOS DEL EQUIPO")
print("=" * 110)
print()


partidos_equipo = []


for partido in partidos_validos:

    local = (
        partido.get(
            "local",
            ""
        )
        or ""
    ).strip()


    visitante = (
        partido.get(
            "visitante",
            ""
        )
        or ""
    ).strip()


    if (
        es_mismo_equipo(
            local,
            equipo
        )
        or
        es_mismo_equipo(
            visitante,
            equipo
        )
    ):

        partidos_equipo.append(
            partido
        )


print(
    f"Equipo buscado: {equipo}"
)

print(
    f"Partidos encontrados: {len(partidos_equipo)}"
)


if not partidos_equipo:

    print()
    print(
        "❌ No se encontraron partidos para ese equipo."
    )

    print()
    print(
        "Equipos encontrados en el CSV:"
    )


    equipos = set()


    for partido in partidos_validos:

        local = (
            partido.get(
                "local",
                ""
            )
            or ""
        ).strip()


        visitante = (
            partido.get(
                "visitante",
                ""
            )
            or ""
        ).strip()


        if local:

            equipos.add(
                local
            )


        if visitante:

            equipos.add(
                visitante
            )


    for nombre in sorted(
        equipos,
        key=normalizar
    ):

        print(
            f"  • {nombre}"
        )


    input(
        "\nPresiona ENTER para cerrar..."
    )

    raise SystemExit


# =============================================================================
# SELECCIONAR GENERAL
# =============================================================================

ultimos_general = partidos_equipo[
    :CANTIDAD
]


# =============================================================================
# SELECCIONAR LOCAL
# =============================================================================

partidos_local = []


for partido in partidos_equipo:

    local = (
        partido.get(
            "local",
            ""
        )
        or ""
    ).strip()


    if es_mismo_equipo(
        local,
        equipo
    ):

        partidos_local.append(
            partido
        )


ultimos_local = partidos_local[
    :CANTIDAD
]


# =============================================================================
# SELECCIONAR VISITANTE
# =============================================================================

partidos_visitante = []


for partido in partidos_equipo:

    visitante = (
        partido.get(
            "visitante",
            ""
        )
        or ""
    ).strip()


    if es_mismo_equipo(
        visitante,
        equipo
    ):

        partidos_visitante.append(
            partido
        )


ultimos_visitante = partidos_visitante[
    :CANTIDAD
]


# =============================================================================
# FUNCIÓN PARA MOSTRAR PARTIDOS
# =============================================================================

def mostrar_partidos(
    titulo,
    lista
):

    print()
    print("-" * 110)
    print(titulo)
    print("-" * 110)


    if not lista:

        print(
            "No hay partidos."
        )

        return


    for numero, partido in enumerate(
        lista,
        start=1
    ):

        local = (
            partido.get(
                "local",
                ""
            )
            or ""
        ).strip()


        visitante = (
            partido.get(
                "visitante",
                ""
            )
            or ""
        ).strip()


        goles_local = (
            partido.get(
                "goles_local",
                ""
            )
            or ""
        ).strip()


        goles_visitante = (
            partido.get(
                "goles_visitante",
                ""
            )
            or ""
        ).strip()


        competicion = (
            partido.get(
                "competicion",
                ""
            )
            or ""
        ).strip()


        event_id = (
            partido.get(
                "id",
                ""
            )
            or ""
        ).strip()


        print()

        print(
            f"{numero:02d}. "
            f"{local} "
            f"{goles_local}"
            f" - "
            f"{goles_visitante} "
            f"{visitante}"
        )


        print(
            f"    Competición: {competicion}"
        )


        if event_id:

            print(
                f"    ID: {event_id}"
            )


# =============================================================================
# MOSTRAR RESULTADOS
# =============================================================================

print()
print("=" * 110)
print("4. RESULTADOS")
print("=" * 110)


mostrar_partidos(
    "ÚLTIMOS 10 GENERALES",
    ultimos_general
)


mostrar_partidos(
    "ÚLTIMOS 10 DE LOCAL",
    ultimos_local
)


mostrar_partidos(
    "ÚLTIMOS 10 DE VISITANTE",
    ultimos_visitante
)


# =============================================================================
# CREAR CSV DE SALIDA
# =============================================================================

print()
print("=" * 110)
print("5. GUARDANDO SELECCIÓN")
print("=" * 110)
print()


filas_salida = []


# -------------------------------------------------------------------------
# GENERAL
# -------------------------------------------------------------------------

for partido in ultimos_general:

    fila = partido.copy()

    fila["grupo"] = "general"

    filas_salida.append(
        fila
    )


# -------------------------------------------------------------------------
# LOCAL
# -------------------------------------------------------------------------

for partido in ultimos_local:

    fila = partido.copy()

    fila["grupo"] = "local"

    filas_salida.append(
        fila
    )


# -------------------------------------------------------------------------
# VISITANTE
# -------------------------------------------------------------------------

for partido in ultimos_visitante:

    fila = partido.copy()

    fila["grupo"] = "visitante"

    filas_salida.append(
        fila
    )


# =============================================================================
# GUARDAR
# =============================================================================

if filas_salida:

    columnas = [
        "grupo",
        "id",
        "local",
        "goles_local",
        "visitante",
        "goles_visitante",
        "competicion",
        "href"
    ]


    with open(
        ARCHIVO_SALIDA,
        "w",
        newline="",
        encoding="utf-8-sig"
    ) as archivo:

        writer = csv.DictWriter(
            archivo,
            fieldnames=columnas,
            extrasaction="ignore"
        )


        writer.writeheader()


        for fila in filas_salida:

            writer.writerow(
                fila
            )


    print(
        "✓ CSV creado:"
    )

    print(
        os.path.abspath(
            ARCHIVO_SALIDA
        )
    )


# =============================================================================
# RESUMEN
# =============================================================================

print()
print("=" * 110)
print("6. RESUMEN")
print("=" * 110)
print()

print(
    f"Equipo: {equipo}"
)

print()

print(
    f"Generales  : {len(ultimos_general)}"
)

print(
    f"Locales    : {len(ultimos_local)}"
)

print(
    f"Visitantes : {len(ultimos_visitante)}"
)

print()

print(
    f"Amistosos descartados: {len(amistosos)}"
)

print()

print("=" * 110)
print("TERMINADO")
print("=" * 110)

input(
    "\nPresiona ENTER para cerrar..."
)