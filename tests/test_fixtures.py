from unittest import TestCase
from unittest.mock import patch

from app import app
from services.fixtures import (
    FixtureNotFoundError,
    FixtureValidationError,
    validar_fixture,
)


EVENTO_VALIDO = {
    "event": {
        "id": 999,
        "homeTeam": {"id": 10, "name": "Local"},
        "awayTeam": {"id": 20, "name": "Visitante"},
        "startTimestamp": 1893457800,
        "tournament": {"name": "Liga de prueba"},
    }
}


class ValidarFixtureTests(TestCase):
    @patch("services.fixtures.obtener_evento", return_value=EVENTO_VALIDO)
    def test_fixture_valido(self, obtener_evento):
        fixture = validar_fixture(
            event_id=999,
            equipo_local_id=10,
            equipo_visitante_id=20,
            kickoff_at="2030-01-01T00:30:00Z",
            competicion="liga DE prueba",
        )

        self.assertEqual(fixture["event_id"], 999)
        self.assertEqual(fixture["equipo_local_id"], 10)
        self.assertEqual(fixture["equipo_visitante_id"], 20)
        self.assertEqual(fixture["kickoff_at"], "2030-01-01T00:30:00Z")
        self.assertEqual(fixture["competicion"], "Liga de prueba")
        self.assertTrue(fixture["fixture_verificado"])
        obtener_evento.assert_called_once_with(999)

    @patch(
        "services.fixtures.obtener_evento",
        side_effect=Exception("Recurso no encontrado en SofaScore (404)"),
    )
    def test_event_id_inexistente(self, obtener_evento):
        with self.assertRaises(FixtureNotFoundError):
            validar_fixture(999)

    @patch("services.fixtures.obtener_evento", return_value=EVENTO_VALIDO)
    def test_equipo_local_incorrecto(self, obtener_evento):
        with self.assertRaisesRegex(
            FixtureValidationError,
            "equipo_local_id no coincide",
        ):
            validar_fixture(999, equipo_local_id=11)

    @patch("services.fixtures.obtener_evento", return_value=EVENTO_VALIDO)
    def test_equipo_visitante_incorrecto(self, obtener_evento):
        with self.assertRaisesRegex(
            FixtureValidationError,
            "equipo_visitante_id no coincide",
        ):
            validar_fixture(999, equipo_visitante_id=21)

    @patch("services.fixtures.obtener_evento", return_value=EVENTO_VALIDO)
    def test_fecha_inconsistente(self, obtener_evento):
        with self.assertRaisesRegex(
            FixtureValidationError,
            "kickoff_at no coincide",
        ):
            validar_fixture(999, kickoff_at="2030-01-01T00:30:01Z")

    @patch(
        "services.fixtures.obtener_evento",
        return_value={
            "event": {
                "id": 999,
                "homeTeam": {"id": 10},
                "awayTeam": {"id": 20},
                "startTimestamp": 1893457800,
            }
        },
    )
    def test_competicion_ausente(self, obtener_evento):
        fixture = validar_fixture(999)

        self.assertIsNone(fixture["competicion"])
        self.assertTrue(fixture["fixture_verificado"])

    @patch(
        "services.fixtures.obtener_evento",
        return_value={
            "event": {
                "id": 999,
                "homeTeam": {"id": 10},
                "awayTeam": {"id": 20},
                "startTimestamp": 1893457800,
            }
        },
    )
    def test_competicion_declarada_falla_si_sofascore_no_la_proporciona(
        self,
        obtener_evento,
    ):
        with self.assertRaisesRegex(
            FixtureValidationError,
            "no proporciona competición",
        ):
            validar_fixture(999, competicion="Liga de prueba")


class RutaFixtureTests(TestCase):
    def setUp(self):
        app.config.update(TESTING=True)
        self.client = app.test_client()

    @patch("routes.fixtures.validar_fixture")
    def test_endpoint_fixture_valido(self, validar):
        validar.return_value = {
            "event_id": 999,
            "equipo_local_id": 10,
            "equipo_visitante_id": 20,
            "kickoff_at": "2030-01-01T00:30:00Z",
            "competicion": "Liga de prueba",
            "fixture_verificado": True,
        }

        respuesta = self.client.post(
            "/api/fixture/analizar",
            json={"event_id": 999},
        )

        self.assertEqual(respuesta.status_code, 200)
        self.assertTrue(respuesta.get_json()["ok"])
        self.assertTrue(respuesta.get_json()["fixture"]["fixture_verificado"])

    def test_api_analizar_existente_sigue_registrada(self):
        respuesta = self.client.post("/api/analizar", json={})

        self.assertEqual(respuesta.status_code, 400)
        self.assertIn("error", respuesta.get_json())
