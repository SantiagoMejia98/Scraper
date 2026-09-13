from datetime import datetime, timezone

from services.sofascore_api import obtener_evento


class FixtureValidationError(ValueError):
    """El fixture no coincide con los datos verificables de SofaScore."""


class FixtureNotFoundError(FixtureValidationError):
    """SofaScore no encontró el evento solicitado."""


def _entero_positivo(valor, campo):
    try:
        numero = int(valor)
    except (TypeError, ValueError):
        raise FixtureValidationError(
            f"{campo} debe ser un entero positivo"
        )

    if numero <= 0:
        raise FixtureValidationError(
            f"{campo} debe ser un entero positivo"
        )

    return numero


def _normalizar_kickoff(valor):
    if not isinstance(valor, str) or not valor.strip():
        raise FixtureValidationError(
            "kickoff_at debe usar formato ISO 8601 con zona horaria"
        )

    texto = valor.strip()

    if texto.endswith("Z"):
        texto = f"{texto[:-1]}+00:00"

    try:
        fecha = datetime.fromisoformat(texto)
    except ValueError:
        raise FixtureValidationError(
            "kickoff_at debe usar formato ISO 8601 con zona horaria"
        )

    if fecha.tzinfo is None:
        raise FixtureValidationError(
            "kickoff_at debe incluir zona horaria"
        )

    return fecha.astimezone(timezone.utc)


def _formatear_kickoff(timestamp):
    try:
        fecha = datetime.fromtimestamp(
            int(timestamp),
            tz=timezone.utc
        )
    except (TypeError, ValueError, OSError, OverflowError):
        raise FixtureValidationError(
            "El evento no contiene startTimestamp verificable"
        )

    return fecha.replace(microsecond=0)


def _obtener_competicion(evento):
    torneo = evento.get("tournament")

    if not isinstance(torneo, dict):
        return None

    nombre = torneo.get("name")

    if not isinstance(nombre, str) or not nombre.strip():
        return None

    return nombre.strip()


def validar_fixture(
    event_id,
    equipo_local_id=None,
    equipo_visitante_id=None,
    kickoff_at=None,
    competicion=None
):
    """Valida campos declarados contra ``/event/{id}`` y normaliza fixture.

    Los campos distintos de ``event_id`` son restricciones opcionales: cuando
    llegan en la petición deben coincidir exactamente con el evento remoto.
    """

    event_id = _entero_positivo(event_id, "event_id")

    try:
        data = obtener_evento(event_id)
    except Exception as error:
        mensaje = str(error)

        if "(404)" in mensaje or "404" in mensaje:
            raise FixtureNotFoundError(
                f"No existe el evento {event_id} en SofaScore"
            )

        raise FixtureValidationError(
            f"No se pudo verificar el evento {event_id}: {mensaje}"
        )

    if not isinstance(data, dict):
        raise FixtureValidationError(
            f"Respuesta inválida para el evento {event_id}"
        )

    evento = data.get("event", data)

    if not isinstance(evento, dict) or not evento:
        raise FixtureNotFoundError(
            f"No existe el evento {event_id} en SofaScore"
        )

    local = evento.get("homeTeam")
    visitante = evento.get("awayTeam")

    if not isinstance(local, dict) or not isinstance(visitante, dict):
        raise FixtureValidationError(
            "El evento no contiene equipos local y visitante verificables"
        )

    local_id_evento = _entero_positivo(
        local.get("id"),
        "ID local del evento"
    )
    visitante_id_evento = _entero_positivo(
        visitante.get("id"),
        "ID visitante del evento"
    )
    kickoff_evento = _formatear_kickoff(evento.get("startTimestamp"))
    competicion_evento = _obtener_competicion(evento)

    if equipo_local_id is not None:
        equipo_local_id = _entero_positivo(
            equipo_local_id,
            "equipo_local_id"
        )

        if equipo_local_id != local_id_evento:
            raise FixtureValidationError(
                "equipo_local_id no coincide con el evento de SofaScore"
            )

    if equipo_visitante_id is not None:
        equipo_visitante_id = _entero_positivo(
            equipo_visitante_id,
            "equipo_visitante_id"
        )

        if equipo_visitante_id != visitante_id_evento:
            raise FixtureValidationError(
                "equipo_visitante_id no coincide con el evento de SofaScore"
            )

    if kickoff_at is not None:
        kickoff_declarado = _normalizar_kickoff(kickoff_at)

        if kickoff_declarado != kickoff_evento:
            raise FixtureValidationError(
                "kickoff_at no coincide con el evento de SofaScore"
            )

    if competicion is not None:
        if not isinstance(competicion, str) or not competicion.strip():
            raise FixtureValidationError(
                "competicion debe ser texto no vacío"
            )

        if competicion_evento is None:
            raise FixtureValidationError(
                "SofaScore no proporciona competición para este evento"
            )

        if competicion.strip().casefold() != competicion_evento.casefold():
            raise FixtureValidationError(
                "competicion no coincide con el evento de SofaScore"
            )

    return {
        "event_id": event_id,
        "equipo_local_id": local_id_evento,
        "equipo_visitante_id": visitante_id_evento,
        "kickoff_at": kickoff_evento.isoformat().replace("+00:00", "Z"),
        "competicion": competicion_evento,
        "fixture_verificado": True,
    }
