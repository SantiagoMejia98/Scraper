// ============================================================
// CACHE GLOBAL DE ESTADÍSTICAS
// ============================================================

const estadisticasCache = {};

// ============================================================
// CACHE GLOBAL DEL ANÁLISIS COMPLETO
// ============================================================

const ANALISIS_STORAGE_KEY = "analisis_completo";

// ============================================================
// ESCAPAR HTML
// ============================================================

function escaparHTML(texto) {
  if (texto === null || texto === undefined) {
    return "";
  }

  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/\</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ============================================================
// LIMPIAR CACHE DE ESTADÍSTICAS
// ============================================================

function limpiarCacheEstadisticas() {
  Object.keys(estadisticasCache).forEach((cacheKey) => {
    delete estadisticasCache[cacheKey];
  });
}

// ============================================================
// GUARDAR ESTADÍSTICAS EN CACHE
// ============================================================

function guardarEstadisticasEnCache(data) {
  const listas = [
    data?.equipo_1?.general || [],
    data?.equipo_1?.como_local || [],
    data?.equipo_2?.general || [],
    data?.equipo_2?.como_visitante || [],
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
}

// ============================================================
// GUARDAR ANÁLISIS COMPLETO
// ============================================================

function guardarAnalisisLocalStorage(data) {
  try {
    localStorage.setItem(
      ANALISIS_STORAGE_KEY,
      JSON.stringify(data),
    );

    console.log(
      "Análisis completo guardado en localStorage.",
    );
  } catch (error) {
    console.error(
      "No se pudo guardar el análisis en localStorage:",
      error,
    );
  }
}

// ============================================================
// RECUPERAR ANÁLISIS
// ============================================================

function recuperarAnalisisLocalStorage() {
  try {
    const guardado = localStorage.getItem(
      ANALISIS_STORAGE_KEY,
    );

    if (!guardado) {
      return null;
    }

    const data = JSON.parse(guardado);

    if (!data || !data.equipo_1 || !data.equipo_2) {
      return null;
    }

    return data;
  } catch (error) {
    console.error(
      "No se pudo recuperar el análisis desde localStorage:",
      error,
    );

    return null;
  }
}

// ============================================================
// MOSTRAR ANÁLISIS
// ============================================================

async function mostrarAnalisis(data, mostrarMensaje = true) {
  if (!data || !data.equipo_1 || !data.equipo_2) {
    return;
  }

  const resultados = document.getElementById("resultados");
  const mensaje = document.getElementById("mensaje");

  // ==========================================================
  // CACHE DE ESTADÍSTICAS
  // ==========================================================

  limpiarCacheEstadisticas();
  guardarEstadisticasEnCache(data);

  // ==========================================================
  // RESTAURAR IDS
  // ==========================================================

  const inputEquipo1 =
    document.getElementById("team_id_1");

  const inputEquipo2 =
    document.getElementById("team_id_2");

  if (
    inputEquipo1 &&
    data.equipo_1.team_id !== undefined &&
    data.equipo_1.team_id !== null
  ) {
    inputEquipo1.value = data.equipo_1.team_id;
  }

  if (
    inputEquipo2 &&
    data.equipo_2.team_id !== undefined &&
    data.equipo_2.team_id !== null
  ) {
    inputEquipo2.value = data.equipo_2.team_id;
  }

  // ==========================================================
  // NOMBRES
  // ==========================================================

  const nombreLocal =
    data.equipo_1.nombre || "Equipo local";

  const nombreVisitante =
    data.equipo_2.nombre || "Equipo visitante";

  const elementoNombreLocal =
    document.getElementById("nombreLocal");

  const elementoNombreVisitante =
    document.getElementById("nombreVisitante");

  if (elementoNombreLocal) {
    elementoNombreLocal.textContent = nombreLocal;
  }

  if (elementoNombreVisitante) {
    elementoNombreVisitante.textContent =
      nombreVisitante;
  }

  // ==========================================================
  // MOSTRAR PARTIDOS
  // ==========================================================

  mostrarPartidos(
    "localGeneral",
    data.equipo_1.general || [],
    data.equipo_1.team_id,
  );

  mostrarPartidos(
    "localComoLocal",
    data.equipo_1.como_local || [],
    data.equipo_1.team_id,
  );

  mostrarPartidos(
    "visitanteGeneral",
    data.equipo_2.general || [],
    data.equipo_2.team_id,
  );

  mostrarPartidos(
    "visitanteComoVisitante",
    data.equipo_2.como_visitante || [],
    data.equipo_2.team_id,
  );

  // ==========================================================
  // MOSTRAR RESULTADOS
  // ==========================================================

  if (resultados) {
    resultados.classList.remove("historial-visible");
  }

  const botonHistorial = document.getElementById("btnHistorial");

  if (botonHistorial) {
    botonHistorial.hidden = false;
    botonHistorial.textContent = "Mostrar historial de partidos";
    botonHistorial.setAttribute("aria-expanded", "false");
  }

  // ==========================================================
  // CALCULAR MERCADOS CON LOS DATOS CARGADOS
  // ==========================================================

  if (typeof cargarMercados === "function") {
    cargarMercados(
      data,
      data.equipo_1.team_id,
      data.equipo_2.team_id,
      nombreLocal,
      nombreVisitante,
    );
  }

  // ==========================================================
  // MENSAJE
  // ==========================================================

  if (mostrarMensaje && mensaje) {
    mensaje.textContent =
      "Partidos, estadísticas y mercados cargados correctamente.";
  }

  // ==========================================================
  // DEBUG
  // ==========================================================

  console.log(
    "Estadísticas precargadas:",
    Object.keys(estadisticasCache).length,
  );

  console.log("Equipo 1:", data.equipo_1);
  console.log("Equipo 2:", data.equipo_2);
  console.log("Cache estadísticas:", estadisticasCache);
}

// ============================================================
// BUSCAR PARTIDOS
// ============================================================

async function buscarPartidos() {
  const teamId1 =
    document.getElementById("team_id_1").value.trim();

  const teamId2 =
    document.getElementById("team_id_2").value.trim();

  const mensaje =
    document.getElementById("mensaje");

  const boton =
    document.getElementById("btnBuscar");

  const resultados =
    document.getElementById("resultados");

  const mercados =
    document.getElementById("mercados");

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

  mensaje.textContent =
    "Buscando partidos y cargando estadísticas...";

  resultados.style.display = "none";
  resultados.classList.remove("historial-visible");

  const botonHistorial = document.getElementById("btnHistorial");

  if (botonHistorial) {
    botonHistorial.hidden = true;
  }

  // ==========================================================
  // LIMPIAR MERCADOS
  // ==========================================================

  if (mercados) {
    mercados.innerHTML = "";
  }

  // ==========================================================
  // LIMPIAR CACHE
  // ==========================================================

  limpiarCacheEstadisticas();

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
      throw new Error(
        data.error ||
        "Error al consultar SofaScore.",
      );
    }

    // ========================================================
    // GUARDAR ANÁLISIS
    // ========================================================

    guardarAnalisisLocalStorage(data);

    // ========================================================
    // MOSTRAR TODO
    // ========================================================

    await mostrarAnalisis(data, true);

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
// MOSTRAR / OCULTAR HISTORIAL
// ============================================================

function alternarHistorialPartidos() {
  const resultados = document.getElementById("resultados");
  const boton = document.getElementById("btnHistorial");

  if (!resultados || !boton) {
    return;
  }

  const visible = resultados.classList.toggle("historial-visible");
  boton.textContent = visible
    ? "Ocultar historial de partidos"
    : "Mostrar historial de partidos";
  boton.setAttribute("aria-expanded", String(visible));
}

// ============================================================
// CARGAR DATOS GUARDADOS AL ABRIR
// ============================================================

async function cargarDatosGuardados() {
  const data =
    recuperarAnalisisLocalStorage();

  if (!data) {
    console.log(
      "No hay análisis guardado en localStorage.",
    );

    return;
  }

  try {
    await mostrarAnalisis(data, false);

    const mensaje =
      document.getElementById("mensaje");

    if (mensaje) {
      mensaje.textContent =
        "Datos recuperados desde localStorage.";
    }

    console.log(
      "Análisis restaurado correctamente desde localStorage.",
    );

  } catch (error) {
    console.error(
      "Error restaurando el análisis guardado:",
      error,
    );
  }
}

// ============================================================
// INICIALIZACIÓN
// ============================================================

document.addEventListener(
  "DOMContentLoaded",
  function () {

    // ========================================================
    // ENTER - EQUIPO 1
    // ========================================================

    const inputEquipo1 =
      document.getElementById("team_id_1");

    if (inputEquipo1) {
      inputEquipo1.addEventListener(
        "keydown",
        function (event) {
          if (event.key === "Enter") {
            buscarPartidos();
          }
        },
      );
    }

    // ========================================================
    // ENTER - EQUIPO 2
    // ========================================================

    const inputEquipo2 =
      document.getElementById("team_id_2");

    if (inputEquipo2) {
      inputEquipo2.addEventListener(
        "keydown",
        function (event) {
          if (event.key === "Enter") {
            buscarPartidos();
          }
        },
      );
    }

    // ========================================================
    // RESTAURAR LOCALSTORAGE
    // ========================================================

    cargarDatosGuardados();
  },
);
