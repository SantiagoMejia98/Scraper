# =============================================================================
# CONFIGURACIÓN GENERAL
# =============================================================================

API_BASE = "https://api.sofascore.com/api/v1"


HEADERS = {

    "Accept":
        "application/json, text/plain, */*",

    "Accept-Language":
        "es-ES,es;q=0.9,en;q=0.8",

    "Referer":
        "https://www.sofascore.com/",

    "Origin":
        "https://www.sofascore.com",

}


# =============================================================================
# HISTORIAL
# =============================================================================

PARTIDOS_POR_EQUIPO = 10

SLEEP_ENTRE_PAGINAS = 1.5

MARGEN_PAGINAS_EXTRA = 2

MAX_PAGINAS = 40


# =============================================================================
# COMPETICIONES EXCLUIDAS
# =============================================================================

COMPETICIONES_EXCLUIDAS = {

    "club friendly games",

}