// ============================================================
// CACHE GLOBAL DE ESTADÍSTICAS
// ============================================================

const estadisticasCache = {};

// ============================================================
// ESCAPAR HTML
// ============================================================

function escaparHTML(texto) {
  if (texto === null || texto === undefined) {
    return "";
  }

  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ============================================================
// BUSCAR PARTIDOS
// ============================================================

async function buscarPartidos() {
  const teamId1 = document.getElementById("team_id_1").value.trim();

  const teamId2 = document.getElementById("team_id_2").value.trim();

  const mensaje = document.getElementById("mensaje");

  const boton = document.getElementById("btnBuscar");

  const resultados = document.getElementById("resultados");

  const mercados = document.getElementById("mercados");

  // ==========================================================
  // VALIDAR
  // ==========================================================

  if (!teamId1 || !teamId2) {
    mensaje.innerHTML = `
      <div class="error">
        Debes introducir los dos IDs.
      </div>
    `;

    return;
  }

  // ==========================================================
  // INTERFAZ
  // ==========================================================

  boton.disabled = true;

  mensaje.textContent = "Buscando partidos y cargando estadísticas...";

  resultados.style.display = "none";

  // ==========================================================
  // LIMPIAR MERCADOS
  // ==========================================================

  if (mercados) {
    mercados.innerHTML = "";
  }

  // ==========================================================
  // LIMPIAR CACHE
  // ==========================================================

  Object.keys(estadisticasCache).forEach((cacheKey) => {
    delete estadisticasCache[cacheKey];
  });

  try {
    // ========================================================
    // CONSULTAR BACKEND
    // ========================================================

    const response = await fetch("/api/analizar", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        team_id_1: teamId1,
        team_id_2: teamId2,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Error al consultar SofaScore.");
    }

    // ========================================================
    // GUARDAR ESTADÍSTICAS
    // ========================================================

    const listas = [
      data.equipo_1?.general || [],

      data.equipo_1?.como_local || [],

      data.equipo_2?.general || [],

      data.equipo_2?.como_visitante || [],
    ];

    listas.forEach((lista) => {
      lista.forEach((partido) => {
        const eventId = partido.event_id;

        const equipoObjetivoId = partido.equipo_objetivo_id;

        if (
          eventId !== undefined &&
          eventId !== null &&
          equipoObjetivoId !== undefined &&
          equipoObjetivoId !== null &&
          partido.estadisticas
        ) {
          const cacheKey = `${eventId}-${equipoObjetivoId}`;

          estadisticasCache[cacheKey] = partido.estadisticas;
        }
      });
    });

    // ========================================================
    // NOMBRES
    // ========================================================

    const nombreLocal = data.equipo_1.nombre;

    const nombreVisitante = data.equipo_2.nombre;

    document.getElementById("nombreLocal").textContent = nombreLocal;

    document.getElementById("nombreVisitante").textContent = nombreVisitante;

    // ========================================================
    // MOSTRAR PARTIDOS
    // ========================================================

    /*
     * MUY IMPORTANTE:
     *
     * Pasamos el ID del equipo que estamos analizando.
     *
     * Así no importa si ese equipo es local o visitante
     * dentro de cada partido.
     *
     */

    mostrarPartidos(
      "localGeneral",
      data.equipo_1.general,
      data.equipo_1.team_id,
    );

    mostrarPartidos(
      "localComoLocal",
      data.equipo_1.como_local,
      data.equipo_1.team_id,
    );

    mostrarPartidos(
      "visitanteGeneral",
      data.equipo_2.general,
      data.equipo_2.team_id,
    );

    mostrarPartidos(
      "visitanteComoVisitante",
      data.equipo_2.como_visitante,
      data.equipo_2.team_id,
    );

    // ========================================================
    // MOSTRAR RESULTADOS
    // ========================================================

    resultados.style.display = "grid";

    // ========================================================
    // CARGAR MERCADOS
    // ========================================================

    await cargarMercados(
      Date.now(),
      data.equipo_1.team_id,
      data.equipo_2.team_id,
      nombreLocal,
      nombreVisitante,
    );

    // ========================================================
    // MENSAJE
    // ========================================================

    mensaje.textContent =
      "Partidos, estadísticas y mercados cargados correctamente.";

    // ========================================================
    // DEBUG
    // ========================================================

    console.log(
      "Estadísticas precargadas:",
      Object.keys(estadisticasCache).length,
    );

    console.log("Equipo 1:", data.equipo_1);

    console.log("Equipo 2:", data.equipo_2);

    console.log("Cache estadísticas:", estadisticasCache);
  } catch (error) {
    console.error(error);

    mensaje.innerHTML = `
      <div class="error">
        ❌ ${escaparHTML(error.message)}
      </div>
    `;
  } finally {
    boton.disabled = false;
  }
}

// ============================================================
// ENTER - EQUIPO 1
// ============================================================

document
  .getElementById("team_id_1")
  .addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      buscarPartidos();
    }
  });

// ============================================================
// ENTER - EQUIPO 2
// ============================================================

document
  .getElementById("team_id_2")
  .addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      buscarPartidos();
    }
  });
