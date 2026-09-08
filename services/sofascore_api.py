from curl_cffi import requests as curl_requests

import threading

from config import API_BASE, HEADERS


# =============================================================================
# SESIÓN HTTP POR HILO
# =============================================================================
#
# Cada hilo que haga peticiones tendrá su propia sesión curl_cffi.
#
# Esto permite utilizar ThreadPoolExecutor de forma segura cuando cargamos
# varios partidos simultáneamente.
# =============================================================================

_local = threading.local()


def obtener_sesion():

    if not hasattr(
        _local,
        "sesion"
    ):

        _local.sesion = curl_requests.Session(
            impersonate="chrome124"
        )

    return _local.sesion


# =============================================================================
# PETICIÓN JSON
# =============================================================================

def obtener_json(
    path
):

    url = f"{API_BASE}{path}"

    sesion = obtener_sesion()

    response = sesion.get(
        url,
        headers=HEADERS,
        timeout=15
    )


    # =========================================================================
    # ERRORES ESPECÍFICOS
    # =========================================================================

    if response.status_code == 403:

        raise Exception(
            f"Acceso denegado por SofaScore (403): {url}"
        )


    if response.status_code == 404:

        raise Exception(
            f"Recurso no encontrado en SofaScore (404): {url}"
        )


    # =========================================================================
    # OTROS ERRORES HTTP
    # =========================================================================

    response.raise_for_status()


    # =========================================================================
    # JSON
    # =========================================================================

    return response.json()


# =============================================================================
# INFORMACIÓN DEL EQUIPO
# =============================================================================

def obtener_info_equipo(
    team_id
):

    return obtener_json(
        f"/team/{team_id}"
    )


# =============================================================================
# PARTIDOS DEL EQUIPO
# =============================================================================

def obtener_pagina_partidos(
    team_id,
    pagina
):

    return obtener_json(
        f"/team/{team_id}/events/last/{pagina}"
    )


# =============================================================================
# INFORMACIÓN DEL PARTIDO
# =============================================================================

def obtener_evento(
    event_id
):

    return obtener_json(
        f"/event/{event_id}"
    )


# =============================================================================
# ESTADÍSTICAS DEL PARTIDO
# =============================================================================

def obtener_estadisticas(
    event_id
):

    return obtener_json(
        f"/event/{event_id}/statistics"
    )


# =============================================================================
# INCIDENTES DEL PARTIDO
# =============================================================================

def obtener_incidentes(
    event_id
):

    return obtener_json(
        f"/event/{event_id}/incidents"
    )


# =============================================================================
# ALINEACIONES DEL PARTIDO
# =============================================================================

def obtener_alineaciones(
    event_id
):

    return obtener_json(
        f"/event/{event_id}/lineups"
    )