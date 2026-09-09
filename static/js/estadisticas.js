// ============================================================
// ESTADÍSTICAS DE PARTIDOS
// ============================================================


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
// NORMALIZAR ID
// ============================================================

function normalizarId(valor) {

  if (valor === null || valor === undefined) {
    return "";
  }

  return String(valor);
}


// ============================================================
// OBTENER EQUIPO OBJETIVO REAL
// ============================================================

function obtenerEquipoObjetivoReal(
  equipoObjetivoId,
  homeTeamId,
  awayTeamId
) {

  const objetivo =
    normalizarId(equipoObjetivoId);

  const home =
    normalizarId(homeTeamId);

  const away =
    normalizarId(awayTeamId);


  // ==========================================================
  // EQUIPO ANALIZADO = LOCAL
  // ==========================================================

  if (objetivo && home && objetivo === home) {
    return "local";
  }


  // ==========================================================
  // EQUIPO ANALIZADO = VISITANTE
  // ==========================================================

  if (objetivo && away && objetivo === away) {
    return "visitante";
  }


  return null;
}


// ============================================================
// TOGGLE ESTADÍSTICAS
// ============================================================

async function toggleEstadisticas(
  idUnico,
  eventId,
  equipoObjetivoId,
  homeTeamId,
  awayTeamId,
) {

  const panel =
    document.getElementById(
      `stats-${idUnico}`
    );

  const contenido =
    document.getElementById(
      `stats-content-${idUnico}`
    );

  const flecha =
    document.getElementById(
      `flecha-${idUnico}`
    );


  if (!panel || !contenido) {

    console.error(
      "No se encontró el panel de estadísticas."
    );

    return;
  }


  // ==========================================================
  // CERRAR
  // ==========================================================

  if (
    panel.classList.contains("visible")
  ) {

    panel.classList.remove(
      "visible"
    );

    if (flecha) {
      flecha.textContent = "▶";
    }

    return;
  }


  // ==========================================================
  // ABRIR
  // ==========================================================

  panel.classList.add(
    "visible"
  );

  if (flecha) {
    flecha.textContent = "▼";
  }


  // ==========================================================
  // CACHE
  // ==========================================================

  const cacheKey =
    `${eventId}-${equipoObjetivoId}`;

  let data =
    estadisticasCache[cacheKey];


  // ==========================================================
  // COMPATIBILIDAD CON CACHE ANTIGUO
  // ==========================================================

  if (!data) {
    data =
      estadisticasCache[eventId];
  }


  // ==========================================================
  // SI YA ESTÁ CARGADO EN ESTE PANEL
  // ==========================================================

  if (
    contenido.dataset.cargado === "true"
  ) {
    return;
  }


  // ==========================================================
  // SI NO ESTÁ EN CACHE
  // ==========================================================

  if (!data) {

    contenido.innerHTML = `
      <div class="cargando">
        Cargando estadísticas...
      </div>
    `;


    try {

      const response =
        await fetch(
          `/api/partido/${eventId}/estadisticas`
        );


      const resultado =
        await response.json();


      if (!response.ok) {

        throw new Error(
          resultado.error ||
          "Error al obtener estadísticas."
        );
      }


      data = resultado;


      // ======================================================
      // GUARDAR EN CACHE EN MEMORIA
      // ======================================================

      estadisticasCache[cacheKey] =
        data;


      // ======================================================
      // GUARDAR EN LOCAL STORAGE
      // ======================================================

      if (
        typeof guardarCacheEstadisticas ===
        "function"
      ) {

        guardarCacheEstadisticas();

      }

    } catch (error) {

      contenido.innerHTML = `
        <div class="error">
          ❌ ${escaparHTML(error.message)}
        </div>
      `;

      return;
    }
  }


  // ==========================================================
  // ERROR DEL BACKEND
  // ==========================================================

  if (data.error) {

    contenido.innerHTML = `
      <div class="error">
        ❌ ${escaparHTML(data.error)}
      </div>
    `;

    return;
  }


  // ==========================================================
  // IDs DEFINITIVOS
  // ==========================================================

  const objetivoFinal =
    equipoObjetivoId ??
    data.equipo_objetivo_id;

  const homeFinal =
    homeTeamId ??
    data.home_team_id;

  const awayFinal =
    awayTeamId ??
    data.away_team_id;


  // ==========================================================
  // DETERMINAR HOME / AWAY
  // ==========================================================

  const equipoObjetivo =
    obtenerEquipoObjetivoReal(
      objetivoFinal,
      homeFinal,
      awayFinal,
    );


  // ==========================================================
  // VALIDAR EQUIPO OBJETIVO
  // ==========================================================

  if (!equipoObjetivo) {

    contenido.innerHTML = `
      <div class="error">
        ⚠️ No se pudo identificar
        el equipo analizado en este partido.
      </div>
    `;

    console.error(
      "No se pudo determinar el equipo objetivo:",
      {
        equipoObjetivoId:
          objetivoFinal,

        homeTeamId:
          homeFinal,

        awayTeamId:
          awayFinal,
      }
    );

    return;
  }


  // ==========================================================
  // RENDERIZAR
  // ==========================================================

  renderizarEstadisticas(
    contenido,
    data,
    idUnico,
    objetivoFinal,
    equipoObjetivo,
  );


  contenido.dataset.cargado =
    "true";
}


// ============================================================
// RENDERIZAR ESTADÍSTICAS
// ============================================================

function renderizarEstadisticas(
  contenedor,
  data,
  idUnico,
  equipoObjetivoId,
  equipoObjetivo,
) {

  let html = "";


  // ==========================================================
  // PERIODOS
  // ==========================================================

  const periodosRaw =
    Array.isArray(data.periodos)
      ? data.periodos
      : [];


  const periodos = {
    "1ST": [],
    "2ND": [],
    FT: [],
  };


  // ==========================================================
  // AGRUPAR FILAS
  // ==========================================================

  periodosRaw.forEach(
    (fila) => {

      if (!fila) {
        return;
      }

      const periodo =
        fila.periodo;

      if (
        periodo === "1ST" ||
        periodo === "2ND" ||
        periodo === "FT"
      ) {

        periodos[periodo].push(
          fila
        );
      }
    }
  );


  // ==========================================================
  // NOMBRES DE PERIODOS
  // ==========================================================

  const nombresPeriodo = {
    "1ST": "1T",
    "2ND": "2T",
    FT: "FT",
  };


  // ==========================================================
  // ORDEN
  // ==========================================================

  const ordenPeriodos = [
    "1ST",
    "2ND",
    "FT"
  ];


  // ==========================================================
  // MOSTRAR PERIODOS
  // ==========================================================

  ordenPeriodos.forEach(
    (periodo) => {

      const filas =
        periodos[periodo] || [];


      if (
        !Array.isArray(filas) ||
        filas.length === 0
      ) {
        return;
      }


      html += `
        <div class="periodo-estadisticas">

          <h4>
            ${escaparHTML(
              nombresPeriodo[periodo]
            )}
          </h4>

          <table class="tabla-estadisticas">

            <thead>

              <tr>

                <th>
                  ${escaparHTML(
                    data.local_equipo ||
                    "Local"
                  )}
                </th>

                <th>
                  Estadística
                </th>

                <th>
                  ${escaparHTML(
                    data.visitante_equipo ||
                    "Visitante"
                  )}
                </th>

              </tr>

            </thead>

            <tbody>
      `;


      // ========================================================
      // FILAS
      // ========================================================

      filas.forEach(
        (fila) => {

          html += `
            <tr>

              <td>
                ${escaparHTML(
                  fila.local ?? "-"
                )}
              </td>

              <td>
                ${escaparHTML(
                  fila.estadistica ?? "-"
                )}
              </td>

              <td>
                ${escaparHTML(
                  fila.visitante ?? "-"
                )}
              </td>

            </tr>
          `;
        }
      );


      html += `
            </tbody>

          </table>

        </div>
      `;
    }
  );


  // ==========================================================
  // JUGADORES
  // ==========================================================

  const jugadoresPorEquipo =
    data.jugadores || {};


  const jugadores =
    Array.isArray(
      jugadoresPorEquipo[
        equipoObjetivo
      ]
    )
      ? jugadoresPorEquipo[
          equipoObjetivo
        ]
      : [];


  // ==========================================================
  // SEPARAR PORTEROS / CAMPO
  // ==========================================================

  const porteros = [];

  const jugadoresCampo = [];


  jugadores.forEach(
    (jugador) => {

      if (esPortero(jugador)) {

        porteros.push(jugador);

      } else {

        jugadoresCampo.push(jugador);
      }
    }
  );


  // ==========================================================
  // PORTEROS
  // ==========================================================

  if (porteros.length > 0) {

    html +=
      renderizarTablaPorteros(
        porteros
      );
  }


  // ==========================================================
  // JUGADORES DE CAMPO
  // ==========================================================

  if (jugadoresCampo.length > 0) {

    html +=
      renderizarTablaJugadoresCampo(
        jugadoresCampo
      );
  }


  // ==========================================================
  // SIN JUGADORES
  // ==========================================================

  if (
    jugadores.length === 0 &&
    !html.trim()
  ) {

    html = `
      <div class="vacio">
        No hay estadísticas de jugadores
        disponibles para el equipo analizado.
      </div>
    `;
  }


  // ==========================================================
  // SIN ESTADÍSTICAS
  // ==========================================================

  if (!html.trim()) {

    html = `
      <div class="vacio">
        No hay estadísticas disponibles.
      </div>
    `;
  }


  contenedor.innerHTML =
    html;
}


// ============================================================
// IDENTIFICAR PORTERO
// ============================================================

function esPortero(jugador) {

  if (!jugador) {
    return false;
  }


  const posicion =
    String(
      jugador.posicion ||
      jugador.position ||
      ""
    )
      .trim()
      .toUpperCase();


  // ==========================================================
  // POSICIONES DE PORTERO
  // ==========================================================

  if (
    posicion === "GK" ||
    posicion === "G" ||
    posicion === "POR" ||
    posicion === "PORTERO" ||
    posicion === "ARQUERO" ||
    posicion === "GOALKEEPER"
  ) {

    return true;
  }


  // ==========================================================
  // TEXTO ADICIONAL
  // ==========================================================

  if (
    posicion.includes(
      "GOALKEEPER"
    ) ||
    posicion.includes(
      "PORTERO"
    ) ||
    posicion.includes(
      "ARQUERO"
    )
  ) {

    return true;
  }


  return false;
}


// ============================================================
// TABLA DE PORTEROS
// ============================================================

function renderizarTablaPorteros(
  porteros
) {

  if (
    !Array.isArray(porteros) ||
    porteros.length === 0
  ) {

    return "";
  }


  // ==========================================================
  // COLUMNAS PORTEROS
  // ==========================================================

  const columnas = [

    {
      titulo: "Jugador",
      campo: "jugador",
      tipo: "texto",
    },

    {
      titulo: "Pos.",
      campo: "posicion",
      tipo: "valor",
    },

    {
      titulo: "Tit.",
      campo: "titular",
      tipo: "boolean",
    },

    {
      titulo: "Min.",
      campo: "minutesPlayed",
      tipo: "valor",
    },

    {
      titulo: "Ataj.",
      campo: "saves",
      tipo: "valor",
    },

    {
      titulo: "1ª tarj.",
      campo: "primera_tarjeta_partido",
      tipo: "boolean",
    },

    {
      titulo: "Amar.",
      campo: "amarillas",
      tipo: "valor",
    },

    {
      titulo: "Rojas",
      campo: "rojas",
      tipo: "valor",
    },
  ];


  return construirTablaJugadores(
    porteros,
    columnas,
    "PORTEROS",
    "tabla-porteros",
  );
}


// ============================================================
// TABLA DE JUGADORES DE CAMPO
// ============================================================

// ============================================================
// TABLAS DE JUGADORES DE CAMPO
// ============================================================

function renderizarTablaJugadoresCampo(
  jugadores
) {

  if (
    !Array.isArray(jugadores) ||
    jugadores.length === 0
  ) {

    return "";
  }


  // ==========================================================
  // TABLA GOLES
  // ==========================================================

  const columnasGoles = [

    {
      titulo: "Jugador",
      campo: "jugador",
      tipo: "texto",
    },

    {
      titulo: "Pos.",
      campo: "posicion",
      tipo: "valor",
    },

    {
      titulo: "Tit.",
      campo: "titular",
      tipo: "boolean",
    },

    {
      titulo: "Min.",
      campo: "minutesPlayed",
      tipo: "valor",
    },

    {
      titulo: "Goles",
      campo: "goles",
      tipo: "valor",
    },

    {
      titulo: "1er gol eq.",
      campo: "primer_gol_equipo",
      tipo: "boolean",
    },

    {
      titulo: "1er gol",
      campo: "primer_gol_partido",
      tipo: "boolean",
    },

    {
      titulo: "Últ. gol",
      campo: "ultimo_gol_partido",
      tipo: "boolean",
    },

    {
      titulo: "Ambos 1T/2T",
      campo: "anoto_ambos_tiempos",
      tipo: "boolean",
    },

    {
      titulo: "Asist.",
      campo: "goalAssist",
      tipo: "valor",
    },
  ];


  // ==========================================================
  // TABLA TARJETAS
  // ==========================================================

  const columnasTarjetas = [

    {
      titulo: "Jugador",
      campo: "jugador",
      tipo: "texto",
    },

    {
      titulo: "Pos.",
      campo: "posicion",
      tipo: "valor",
    },

    {
      titulo: "Tit.",
      campo: "titular",
      tipo: "boolean",
    },

    {
      titulo: "Min.",
      campo: "minutesPlayed",
      tipo: "valor",
    },

    {
      titulo: "1ª tarj.",
      campo: "primera_tarjeta_partido",
      tipo: "boolean",
    },

    {
      titulo: "Amar.",
      campo: "amarillas",
      tipo: "valor",
    },

    {
      titulo: "Rojas",
      campo: "rojas",
      tipo: "valor",
    },
  ];


  // ==========================================================
  // TABLA ESTADÍSTICAS
  // ==========================================================

  const columnasEstadisticas = [

    {
      titulo: "Jugador",
      campo: "jugador",
      tipo: "texto",
    },

    {
      titulo: "Pos.",
      campo: "posicion",
      tipo: "valor",
    },

    {
      titulo: "Tit.",
      campo: "titular",
      tipo: "boolean",
    },

    {
      titulo: "Min.",
      campo: "minutesPlayed",
      tipo: "valor",
    },

    {
      titulo: "Tiros",
      campo: "totalShots",
      tipo: "valor",
    },

    {
      titulo: "T. puerta",
      campo: "onTargetScoringAttempt",
      tipo: "valor",
    },

    {
      titulo: "Pases",
      campo: "accuratePass",
      tipo: "valor",
    },

    {
      titulo: "Faltas",
      campo: "fouls",
      tipo: "valor",
    },

    {
      titulo: "Recib.",
      campo: "wasFouled",
      tipo: "valor",
    },

    {
      titulo: "Entradas",
      campo: "wonTackle",
      tipo: "valor",
    },

    {
      titulo: "Offside",
      campo: "totalOffside",
      tipo: "valor",
    },

    {
      titulo: "Palo",
      campo: "hitWoodwork",
      tipo: "valor",
    },
  ];


  // ==========================================================
  // CONSTRUIR LAS 3 TABLAS
  // ==========================================================

  let html = "";


  // ==========================================================
  // GOLES
  // ==========================================================

  html +=
    construirTablaJugadores(
      jugadores,
      columnasGoles,
      "GOLES",
      "tabla-jugadores-campo",
    );


  // ==========================================================
  // TARJETAS
  // ==========================================================

  html +=
    construirTablaJugadores(
      jugadores,
      columnasTarjetas,
      "TARJETAS",
      "tabla-jugadores-campo",
    );


  // ==========================================================
  // ESTADÍSTICAS
  // ==========================================================

  html +=
    construirTablaJugadores(
      jugadores,
      columnasEstadisticas,
      "ESTADÍSTICAS",
      "tabla-jugadores-campo",
    );


  return html;
}


// ============================================================
// CONSTRUIR TABLA DE JUGADORES
// ============================================================

function construirTablaJugadores(
  jugadores,
  columnas,
  titulo,
  claseTabla
) {

  // ==========================================================
  // FILTRAR Y ORDENAR JUGADORES
  // ==========================================================
  //
  // 1. Los jugadores con 0 minutos no aparecen.
  // 2. Los titulares aparecen primero.
  // 3. Dentro de cada grupo, más minutos primero.
  //
  // ==========================================================

  const jugadoresOrdenados =
    jugadores
      .filter(
        (jugador) => {

          const minutos =
            Number(
              jugador?.minutesPlayed
            );

          return (
            Number.isFinite(
              minutos
            ) &&
            minutos > 0
          );
        }
      )
      .sort(
        (a, b) => {

          const titularA =
            a?.titular === true
              ? 1
              : 0;

          const titularB =
            b?.titular === true
              ? 1
              : 0;


          if (
            titularA !== titularB
          ) {

            return (
              titularB -
              titularA
            );
          }


          const minutosA =
            Number(
              a?.minutesPlayed
            ) || 0;

          const minutosB =
            Number(
              b?.minutesPlayed
            ) || 0;


          return (
            minutosB -
            minutosA
          );
        }
      );


  if (
    jugadoresOrdenados.length === 0
  ) {

    return "";
  }


  let html = `

    <div class="jugadores-seccion">

      <h4>
        ${escaparHTML(titulo)}
      </h4>

      <div class="tabla-jugadores-scroll">

        <table
          class="tabla-jugadores ${escaparHTML(
            claseTabla
          )}"
        >

          <thead>

            <tr>
  `;


  // ==========================================================
  // ENCABEZADOS
  // ==========================================================

  columnas.forEach(
    (columna) => {

      html += `
        <th>
          ${escaparHTML(
            columna.titulo
          )}
        </th>
      `;
    }
  );


  html += `

            </tr>

          </thead>

          <tbody>
  `;


  // ==========================================================
  // FILAS
  // ==========================================================

  jugadoresOrdenados.forEach(
    (jugador) => {

      const nombre =
        jugador.jugador ||
        jugador.nombre ||
        jugador.name ||
        jugador.playerName ||
        "-";


      html += `
        <tr>
      `;


      // ========================================================
      // COLUMNAS
      // ========================================================

      columnas.forEach(
        (columna) => {

          const valor =
            jugador[
              columna.campo
            ];


          // ======================================================
          // BOOLEAN
          // ======================================================

          if (
            columna.tipo ===
            "boolean"
          ) {

            html +=
              crearCeldaBoolean(
                valor
              );

            return;
          }


          // ======================================================
          // NOMBRE
          // ======================================================

          if (
            columna.campo ===
            "jugador"
          ) {

            html += `
              <td>

                <div class="nombre-jugador">

                  ${escaparHTML(
                    nombre
                  )}

                </div>

              </td>
            `;

            return;
          }


          // ======================================================
          // VALOR NORMAL
          // ======================================================

          html +=
            crearCeldaValor(
              valor
            );
        }
      );


      html += `
        </tr>
      `;
    }
  );


  // ==========================================================
  // CERRAR TABLA
  // ==========================================================

  html += `

          </tbody>

        </table>

      </div>

    </div>

  `;


  return html;
}


// ============================================================
// CELDA BOOLEAN
// ============================================================

function crearCeldaBoolean(
  valor
) {

  // ==========================================================
  // TRUE = SÍ
  // ==========================================================

  if (valor === true) {

    return `
      <td>
        Sí
      </td>
    `;
  }


  // ==========================================================
  // FALSE = NO
  // ==========================================================

  return `
    <td>
      No
    </td>
  `;
}


// ============================================================
// CELDA DE VALOR
// ============================================================

function crearCeldaValor(
  valor
) {

  // ==========================================================
  // SIN VALOR
  // ==========================================================

  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {

    return `
      <td>
        0
      </td>
    `;
  }


  // ==========================================================
  // OBJETOS / ARRAYS
  // ==========================================================

  if (
    typeof valor === "object"
  ) {

    try {

      return `
        <td>
          ${escaparHTML(
            JSON.stringify(valor)
          )}
        </td>
      `;

    } catch (error) {

      return `
        <td>
          0
        </td>
      `;
    }
  }


  // ==========================================================
  // VALOR NORMAL
  // ==========================================================

  return `
    <td>
      ${escaparHTML(valor)}
    </td>
  `;
}