from playwright.sync_api import sync_playwright
import csv
import re
import time


# ============================================================
# CONFIGURACIÓN
# ============================================================

BASE_URL = (
    "https://www.betano.co/"
    "cuotas-de-partido/"
    "hull-city-manchester-united/"
    "87685303/"
)

PARTIDO = "Hull City - Manchester United"

# PESTAÑAS QUE SE VAN A EXTRAER
BT_A_EXTRAER = [0, 1, 7, 4,5,6]

ARCHIVO_CSV = "cuotas_brutas.csv"

WINDOW_WIDTH = 1440
WINDOW_HEIGHT = 1000

ESPERA_CARGA = 6


# ============================================================
# UTILIDADES
# ============================================================

def limpiar(texto):

    if not texto:
        return ""

    return " ".join(texto.split())


def normalizar(texto):

    texto = limpiar(texto).lower()

    reemplazos = {
        "á": "a",
        "é": "e",
        "í": "i",
        "ó": "o",
        "ú": "u",
        "ü": "u",
    }

    for a, b in reemplazos.items():
        texto = texto.replace(a, b)

    return texto


def obtener_url(bt):

    if bt == 0:
        return BASE_URL

    return f"{BASE_URL}?bt={bt}"


# ============================================================
# COOKIES
# ============================================================

def cerrar_cookies(page):

    print("🍪 Buscando cookies...")

    textos = [
        "Rechazar Todo",
        "Rechazar todo",
    ]

    for texto in textos:

        try:

            elementos = page.get_by_text(
                texto,
                exact=True
            )

            for i in range(elementos.count()):

                try:

                    boton = elementos.nth(i)

                    if not boton.is_visible(
                        timeout=300
                    ):
                        continue

                    boton.click(
                        timeout=3000
                    )

                    print(
                        "✅ Cookies cerradas"
                    )

                    time.sleep(1)

                    return

                except Exception:
                    pass

        except Exception:
            pass

    print(
        "ℹ️ No apareció ventana de cookies"
    )


# ============================================================
# CERRAR BANNER
# ============================================================

def cerrar_banner(page):

    print("🧹 Buscando banner...")

    try:

        botones = page.locator(
            "button, [role='button']"
        )

        for i in range(
            botones.count()
        ):

            try:

                boton = botones.nth(i)

                if not boton.is_visible(
                    timeout=200
                ):
                    continue

                texto = normalizar(
                    boton.inner_text()
                )

                aria = normalizar(
                    boton.get_attribute(
                        "aria-label"
                    ) or ""
                )

                title = normalizar(
                    boton.get_attribute(
                        "title"
                    ) or ""
                )

                if (
                    texto in ["cerrar", "close"]
                    or aria in ["cerrar", "close"]
                    or title in ["cerrar", "close"]
                ):

                    boton.click(
                        timeout=3000
                    )

                    print(
                        "✅ Banner cerrado"
                    )

                    return

            except Exception:
                pass

    except Exception:
        pass

    try:
        page.keyboard.press("Escape")
    except Exception:
        pass


# ============================================================
# MOSTRAR TODO
# ============================================================

def mostrar_todo(page):

    print(
        "📋 Buscando MOSTRAR TODO..."
    )

    for intento in range(15):

        try:

            elementos = page.get_by_text(
                "MOSTRAR TODO",
                exact=True
            )

            cantidad = elementos.count()

            if cantidad == 0:

                time.sleep(0.7)

                continue

            for i in range(cantidad):

                try:

                    elemento = elementos.nth(i)

                    if not elemento.is_visible(
                        timeout=300
                    ):
                        continue

                    elemento.scroll_into_view_if_needed()

                    time.sleep(0.3)

                    try:

                        elemento.click(
                            timeout=3000
                        )

                    except Exception:

                        elemento.evaluate(
                            "(e) => e.click()"
                        )

                    print(
                        "✅ MOSTRAR TODO ABIERTO"
                    )

                    time.sleep(2)

                    return True

                except Exception:
                    pass

        except Exception:
            pass

        time.sleep(0.5)

    print(
        "ℹ️ No se encontró MOSTRAR TODO"
    )

    return False


# ============================================================
# ABRIR MERCADOS CONTRAÍDOS
# ============================================================

def abrir_contraidos(page):

    print(
        "🔓 Abriendo mercados contraídos..."
    )

    total = 0

    for ronda in range(15):

        try:

            flechas = page.locator(
                '[data-qa="sb-arrow-collapsed"]'
            )

            cantidad = flechas.count()

            if cantidad == 0:
                break

            abiertos = 0

            for i in range(cantidad):

                try:

                    flecha = flechas.nth(i)

                    if not flecha.is_visible(
                        timeout=200
                    ):
                        continue

                    flecha.scroll_into_view_if_needed()

                    flecha.click(
                        timeout=2000
                    )

                    abiertos += 1
                    total += 1

                    time.sleep(0.15)

                except Exception:
                    pass

            if abiertos == 0:
                break

            time.sleep(0.5)

        except Exception:
            break

    print(
        f"✅ Mercados abiertos: {total}"
    )


# ============================================================
# DETECTAR PESTAÑA
# ============================================================

def detectar_pestana_activa(page):

    print(
        "🔎 Detectando pestaña activa..."
    )

    try:

        contenedor = page.locator(
            '[data-qa="pre-event-details-market-tabs"]'
        )

        elementos = contenedor.locator(
            '[data-qa]'
        )

        # ----------------------------------------------------
        # MÉTODO 1: CLASE ACTIVA
        # ----------------------------------------------------

        for i in range(
            elementos.count()
        ):

            try:

                elemento = elementos.nth(i)

                if not elemento.is_visible(
                    timeout=200
                ):
                    continue

                texto = limpiar(
                    elemento.inner_text()
                )

                if not texto:
                    continue

                clase = (
                    elemento.get_attribute(
                        "class"
                    )
                    or ""
                )

                if (
                    "tw-bg-sem-color-bg-off-b"
                    in clase
                ):

                    print(
                        f"✅ Pestaña activa: "
                        f"{texto}"
                    )

                    return texto

            except Exception:
                pass

        # ----------------------------------------------------
        # MÉTODO 2: ARIA
        # ----------------------------------------------------

        for i in range(
            elementos.count()
        ):

            try:

                elemento = elementos.nth(i)

                aria = (
                    elemento.get_attribute(
                        "aria-selected"
                    )
                    or ""
                ).lower()

                if aria == "true":

                    texto = limpiar(
                        elemento.inner_text()
                    )

                    if texto:

                        print(
                            f"✅ Pestaña activa: "
                            f"{texto}"
                        )

                        return texto

            except Exception:
                pass

    except Exception as e:

        print(
            "⚠️ Error detectando pestaña:",
            repr(e)
        )

    print(
        "⚠️ No se pudo detectar "
        "el nombre de la pestaña"
    )

    return "Desconocida"

    print(
        "🔎 Detectando pestaña activa..."
    )

    try:

        contenedor = page.locator(
            '[data-qa="pre-event-details-market-tabs"]'
        )

        elementos = contenedor.locator(
            '[data-qa]'
        )

        # ----------------------------------------------------
        # ARIA SELECTED
        # ----------------------------------------------------

        for i in range(
            elementos.count()
        ):

            try:

                elemento = elementos.nth(i)

                if not elemento.is_visible(
                    timeout=200
                ):
                    continue

                aria = (
                    elemento.get_attribute(
                        "aria-selected"
                    ) or ""
                ).lower()

                if aria == "true":

                    texto = limpiar(
                        elemento.inner_text()
                    )

                    if texto:

                        print(
                            f"✅ Pestaña: {texto}"
                        )

                        return texto

            except Exception:
                pass

        # ----------------------------------------------------
        # CLASE ACTIVA
        # ----------------------------------------------------

        for i in range(
            elementos.count()
        ):

            try:

                elemento = elementos.nth(i)

                if not elemento.is_visible(
                    timeout=200
                ):
                    continue

                clase = (
                    elemento.get_attribute(
                        "class"
                    ) or ""
                )

                texto = limpiar(
                    elemento.inner_text()
                )

                if (
                    texto
                    and
                    (
                        "active" in clase.lower()
                        or
                        "selected" in clase.lower()
                    )
                ):

                    print(
                        f"✅ Pestaña: {texto}"
                    )

                    return texto

            except Exception:
                pass

    except Exception as e:

        print(
            "⚠️ Error detectando pestaña:",
            repr(e)
        )

    return "Desconocida"


# ============================================================
# NOMBRE DEL MERCADO
# ============================================================

def obtener_nombre_mercado(mercado):

    selectores = [

        '[data-qa^="market-type-id-"]',

        "h2",

        "h3",

        "h4",

    ]

    for selector in selectores:

        try:

            elementos = mercado.locator(
                selector
            )

            for i in range(
                min(
                    elementos.count(),
                    5
                )
            ):

                try:

                    texto = limpiar(
                        elementos.nth(i).inner_text()
                    )

                    if (
                        texto
                        and
                        len(texto) < 200
                    ):

                        return texto

                except Exception:
                    pass

        except Exception:
            pass

    # --------------------------------------------------------
    # FALLBACK
    # --------------------------------------------------------

    try:

        texto = limpiar(
            mercado.inner_text()
        )

        if texto:

            lineas = texto.splitlines()

            if lineas:

                return limpiar(
                    lineas[0]
                )

    except Exception:
        pass

    return "Mercado desconocido"


# ============================================================
# OBTENER CUOTA
# ============================================================

def obtener_cuota(
    seleccion,
    texto
):

    selectores = [

        '[data-qa*="odd"]',

        '[data-qa*="price"]',

        '[class*="odd"]',

        '[class*="odds"]',

        '[class*="price"]',

    ]

    # --------------------------------------------------------
    # BUSCAR ELEMENTO DE CUOTA
    # --------------------------------------------------------

    for selector in selectores:

        try:

            elementos = seleccion.locator(
                selector
            )

            for i in range(
                elementos.count()
            ):

                try:

                    precio = limpiar(
                        elementos.nth(i).inner_text()
                    )

                    # Una cuota normalmente tiene
                    # un decimal.
                    coincidencias = re.findall(
                        r"\d+(?:[.,]\d+)?",
                        precio
                    )

                    for numero in coincidencias:

                        valor = float(
                            numero.replace(
                                ",",
                                "."
                            )
                        )

                        if 1 <= valor <= 1000:

                            return valor

                except Exception:
                    pass

        except Exception:
            pass

    # --------------------------------------------------------
    # FALLBACK
    # --------------------------------------------------------

    numeros = re.findall(
        r"\d+(?:[.,]\d+)?",
        texto
    )

    for numero in reversed(numeros):

        try:

            valor = float(
                numero.replace(
                    ",",
                    "."
                )
            )

            if 1 <= valor <= 1000:

                return valor

        except Exception:
            pass

    return ""


# ============================================================
# OBTENER LÍNEA
# ============================================================

def obtener_linea(texto):

    if not texto:
        return ""

    texto_limpio = limpiar(
        texto
    )

    texto_normalizado = normalizar(
        texto_limpio
    )

    # ========================================================
    # PATRONES ESPECÍFICOS
    # ========================================================

    patrones = [

        # Más de 2.5
        r"\bmas\s+de\s+(\d+(?:[.,]\d+)?)",

        # Menos de 2.5
        r"\bmenos\s+de\s+(\d+(?:[.,]\d+)?)",

        # Over 2.5
        r"\bover\s+(\d+(?:[.,]\d+)?)",

        # Under 2.5
        r"\bunder\s+(\d+(?:[.,]\d+)?)",

        # Más/Menos (2.5)
        r"mas/menos\s*"
        r"\(\s*"
        r"(\d+(?:[.,]\d+)?)"
        r"\s*\)",

        # Más/Menos 2.5
        r"mas/menos\s+"
        r"(\d+(?:[.,]\d+)?)",

        # Menos/Más (2.5)
        r"menos/mas\s*"
        r"\(\s*"
        r"(\d+(?:[.,]\d+)?)"
        r"\s*\)",

        # Menos/Más 2.5
        r"menos/mas\s+"
        r"(\d+(?:[.,]\d+)?)",

        # Más / Menos (2.5)
        r"mas\s*/\s*menos\s*"
        r"\(\s*"
        r"(\d+(?:[.,]\d+)?)"
        r"\s*\)",

        # Menos / Más (2.5)
        r"menos\s*/\s*mas\s*"
        r"\(\s*"
        r"(\d+(?:[.,]\d+)?)"
        r"\s*\)",
    ]

    # ========================================================
    # BUSCAR LÍNEA
    # ========================================================

    for patron in patrones:

        encontrado = re.search(
            patron,
            texto_normalizado,
            re.IGNORECASE
        )

        if encontrado:

            try:

                numero = (
                    encontrado
                    .group(1)
                    .replace(
                        ",",
                        "."
                    )
                )

                return float(
                    numero
                )

            except Exception:
                pass

    # ========================================================
    # FALLBACK
    # ========================================================

    palabras_linea = [
        "mas",
        "menos",
        "over",
        "under",
    ]

    tiene_linea = any(
        palabra in texto_normalizado
        for palabra in palabras_linea
    )

    if tiene_linea:

        numeros = re.findall(
            r"\d+(?:[.,]\d+)?",
            texto_normalizado
        )

        for numero in numeros:

            try:

                valor = float(
                    numero.replace(
                        ",",
                        "."
                    )
                )

                if 0 < valor <= 100:

                    return valor

            except Exception:
                pass

    return ""


# ============================================================
# EXTRAER TODOS LOS MERCADOS
# ============================================================

def extraer_todos_los_mercados(
    page,
    pestana
):

    print()
    print("=" * 100)

    print(
        "📊 EXTRAYENDO TODO"
    )

    print(
        f"PESTAÑA: {pestana}"
    )

    print("=" * 100)

    filas = []

    # ========================================================
    # MERCADOS
    # ========================================================

    mercados = page.locator(
        "[data-marketid]"
    )

    cantidad = mercados.count()

    print(
        f"Mercados encontrados: {cantidad}"
    )

    # ========================================================
    # RECORRER MERCADOS
    # ========================================================

    for i in range(cantidad):

        try:

            mercado = mercados.nth(i)

            if not mercado.is_visible(
                timeout=200
            ):
                continue

            nombre_mercado = (
                obtener_nombre_mercado(
                    mercado
                )
            )

            print()
            print(
                f"📦 [{i + 1}/{cantidad}] "
                f"{nombre_mercado}"
            )

            # =================================================
            # SELECCIONES
            # =================================================

            selecciones = mercado.locator(
                '[data-qa="event-selection"]'
            )

            cantidad_selecciones = (
                selecciones.count()
            )

            if cantidad_selecciones == 0:

                print(
                    "   ⚠️ Sin selecciones"
                )

                continue

            print(
                f"   Selecciones: "
                f"{cantidad_selecciones}"
            )

            # =================================================
            # RECORRER SELECCIONES
            # =================================================

            for j in range(
                cantidad_selecciones
            ):

                try:

                    seleccion = (
                        selecciones.nth(j)
                    )

                    if not seleccion.is_visible(
                        timeout=200
                    ):
                        continue

                    texto = limpiar(
                        seleccion.inner_text()
                    )

                    if not texto:
                        continue

                    # -----------------------------------------
                    # NOMBRE DE SELECCIÓN
                    # -----------------------------------------

                    nombre_seleccion = ""

                    try:

                        elemento = (
                            seleccion.locator(
                                ".s-name"
                            )
                        )

                        if elemento.count() > 0:

                            nombre_seleccion = (
                                limpiar(
                                    elemento
                                    .first
                                    .inner_text()
                                )
                            )

                    except Exception:
                        pass

                    if not nombre_seleccion:

                        nombre_seleccion = texto

                    # -----------------------------------------
                    # LÍNEA
                    # -----------------------------------------

                    linea = obtener_linea(
                        texto
                    )

                    # -----------------------------------------
                    # CUOTA
                    # -----------------------------------------

                    cuota = obtener_cuota(
                        seleccion,
                        texto
                    )

                    # =================================================
                    # GUARDAR
                    # =================================================

                    fila = {

                        "partido":
                            PARTIDO,

                        "pestana":
                            pestana,

                        "mercado":
                            nombre_mercado,

                        "seleccion":
                            nombre_seleccion,

                        "linea":
                            linea,

                        "cuota":
                            cuota,
                    }

                    filas.append(
                        fila
                    )

                    print(
                        f"      ✓ "
                        f"{nombre_seleccion}"
                    )

                    print(
                        f"        Línea: "
                        f"{linea}"
                    )

                    print(
                        f"        Cuota: "
                        f"{cuota}"
                    )

                except Exception as e:

                    print(
                        "      ⚠️ Error "
                        "selección:",
                        repr(e)
                    )

        except Exception as e:

            print(
                "⚠️ Error mercado:",
                repr(e)
            )

    print()
    print(
        f"✅ FILAS EXTRAÍDAS: "
        f"{len(filas)}"
    )

    return filas


# ============================================================
# PROCESAR UNA PESTAÑA
# ============================================================

def procesar_bt(
    p,
    bt
):

    url = obtener_url(
        bt
    )

    print()
    print()
    print("#" * 100)

    print(
        f"🚀 PROCESANDO BT={bt}"
    )

    print("#" * 100)

    print(
        url
    )

    browser = None
    context = None
    page = None

    filas = []

    try:

        # ====================================================
        # ABRIR NAVEGADOR NUEVO
        # ====================================================

        browser = p.chromium.launch(

            headless=False,

            args=[
                f"--window-size="
                f"{WINDOW_WIDTH},"
                f"{WINDOW_HEIGHT}"
            ]
        )

        context = browser.new_context(

            viewport={
                "width":
                    WINDOW_WIDTH,

                "height":
                    WINDOW_HEIGHT,
            },

            locale="es-CO"
        )

        page = context.new_page()

        # ====================================================
        # ABRIR URL
        # ====================================================

        print(
            "🌐 Abriendo página..."
        )

        response = page.goto(

            url,

            wait_until="domcontentloaded",

            timeout=60000
        )

        if response:

            print(
                f"📡 HTTP: "
                f"{response.status}"
            )

        print(
            f"⏳ Esperando "
            f"{ESPERA_CARGA}s..."
        )

        time.sleep(
            ESPERA_CARGA
        )

        # ====================================================
        # COOKIES
        # ====================================================

        cerrar_cookies(
            page
        )

        # ====================================================
        # BANNER
        # ====================================================

        cerrar_banner(
            page
        )

        time.sleep(1)

        # ====================================================
        # MOSTRAR TODO
        # ====================================================

        mostrar_todo(
            page
        )

        # ====================================================
        # ABRIR CONTRAÍDOS
        # ====================================================

        abrir_contraidos(
            page
        )

        time.sleep(1)

        # ====================================================
        # DETECTAR PESTAÑA
        # ====================================================

        pestana = (
            detectar_pestana_activa(
                page
            )
        )

        # ====================================================
        # EXTRAER TODO
        # ====================================================

        filas = (
            extraer_todos_los_mercados(
                page,
                pestana
            )
        )

        print()
        print(
            f"✅ BT={bt} TERMINADO"
        )

        print(
            f"Filas: {len(filas)}"
        )

    except Exception as e:

        print()
        print(
            f"❌ ERROR BT={bt}"
        )

        print(
            repr(e)
        )

    finally:

        # ====================================================
        # CERRAR TODO
        # ====================================================

        print()
        print(
            f"🔒 Cerrando BT={bt}..."
        )

        try:

            if page:
                page.close()

        except Exception:
            pass

        try:

            if context:
                context.close()

        except Exception:
            pass

        try:

            if browser:
                browser.close()

        except Exception:
            pass

        print(
            "✅ Navegador cerrado "
            "completamente"
        )

        time.sleep(2)

    return filas


# ============================================================
# GUARDAR CSV
# ============================================================

def guardar_csv(
    filas
):

    columnas = [

        "partido",

        "pestana",

        "mercado",

        "seleccion",

        "linea",

        "cuota",

    ]

    with open(

        ARCHIVO_CSV,

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
            filas
        )

    print()
    print("=" * 100)

    print(
        "💾 CSV GUARDADO"
    )

    print(
        f"Archivo: "
        f"{ARCHIVO_CSV}"
    )

    print(
        f"Total filas: "
        f"{len(filas)}"
    )

    print("=" * 100)


# ============================================================
# MAIN
# ============================================================

def main():

    print()
    print("=" * 100)

    print(
        "BETANO - EXTRACTOR BRUTO"
    )

    print("=" * 100)

    print()
    print(
        f"Partido: {PARTIDO}"
    )

    print()
    print(
        f"BT a extraer: "
        f"{BT_A_EXTRAER}"
    )

    print()
    print(
        "⚠️ IMPORTANTE:"
    )

    print(
        "NO SE APLICA NINGÚN FILTRO."
    )

    print(
        "SE GUARDA TODO LO QUE SE ENCUENTRE."
    )

    todas_las_filas = []

    # ========================================================
    # PLAYWRIGHT
    # ========================================================

    with sync_playwright() as p:

        for bt in BT_A_EXTRAER:

            filas = procesar_bt(
                p,
                bt
            )

            todas_las_filas.extend(
                filas
            )

    # ========================================================
    # GUARDAR
    # ========================================================

    guardar_csv(
        todas_las_filas
    )

    print()
    print(
        "✅ PROCESO COMPLETADO"
    )


# ============================================================
# EJECUTAR
# ============================================================

if __name__ == "__main__":

    main()