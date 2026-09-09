// ============================================================
// MERCADOS
// ============================================================


// ============================================================
// CARGAR MERCADOS
// ============================================================

function cargarMercados(
  data,
  equipoLocalId,
  equipoVisitanteId,
  nombreEquipoLocal = "Local",
  nombreEquipoVisitante = "Visitante",
) {
  try {
    if (!data) {
      console.error("No existen datos de análisis para calcular mercados.");
      return;
    }

    renderizarMercados(
      data,
      nombreEquipoLocal,
      nombreEquipoVisitante,
      equipoLocalId,
      equipoVisitanteId,
    );

  } catch (error) {
    console.error("Error cargando mercados:", error);

    const contenedor = document.getElementById("mercados");

    if (contenedor) {
      contenedor.innerHTML = `
        <div class="error-estadisticas">
          No se pudieron cargar los mercados.
        </div>
      `;
    }
  }
}


// ============================================================
// OBTENER PARTIDOS HISTÓRICOS
// ============================================================

function obtenerPartidosHistoricos(datos) {
  if (Array.isArray(datos)) {
    return datos;
  }

  if (Array.isArray(datos?.partidos)) {
    return datos.partidos;
  }

  return [];
}


// ============================================================
// OBTENER RESULTADOS HISTÓRICOS
// ============================================================

function obtenerResultadosHistoricos(partidos) {
  const resultado = {
    victorias: 0,
    empates: 0,
    derrotas: 0,
    partidos: 0,
  };

  if (!Array.isArray(partidos)) {
    return resultado;
  }

  partidos.forEach((partido) => {
    if (!partido) {
      return;
    }

    const tipoResultado = partido.resultado;

    if (tipoResultado === "Victoria") {
      resultado.victorias += 1;
      resultado.partidos += 1;

    } else if (tipoResultado === "Empate") {
      resultado.empates += 1;
      resultado.partidos += 1;

    } else if (tipoResultado === "Derrota") {
      resultado.derrotas += 1;
      resultado.partidos += 1;
    }
  });

  return resultado;
}


// ============================================================
// OBTENER ID DE EQUIPO DE UN PARTIDO
// ============================================================

function obtenerIdEquipoLocalPartido(partido) {
  return Number(
    partido?.home_team_id
  );
}


function obtenerIdEquipoVisitantePartido(partido) {
  return Number(
    partido?.away_team_id
  );
}


// ============================================================
// OBTENER GOLES MARCADOS POR UN EQUIPO
// ============================================================

function obtenerGolesEquipo(partido, equipoId) {
  if (!partido) {
    return null;
  }

  const id = Number(equipoId);

  const idLocal = obtenerIdEquipoLocalPartido(partido);
  const idVisitante = obtenerIdEquipoVisitantePartido(partido);

  const golesLocal = Number(partido?.marcador_local);
  const golesVisitante = Number(partido?.marcador_visitante);

  if (
    !Number.isFinite(golesLocal) ||
    !Number.isFinite(golesVisitante)
  ) {
    return null;
  }

  if (Number.isFinite(id) && idLocal === id) {
    return golesLocal;
  }

  if (Number.isFinite(id) && idVisitante === id) {
    return golesVisitante;
  }

  return null;
}


// ============================================================
// OBTENER GOLES RECIBIDOS POR UN EQUIPO
// ============================================================

function obtenerGolesRecibidosEquipo(partido, equipoId) {
  if (!partido) {
    return null;
  }

  const id = Number(equipoId);

  const idLocal = obtenerIdEquipoLocalPartido(partido);
  const idVisitante = obtenerIdEquipoVisitantePartido(partido);

  const golesLocal = Number(partido?.marcador_local);
  const golesVisitante = Number(partido?.marcador_visitante);

  if (
    !Number.isFinite(golesLocal) ||
    !Number.isFinite(golesVisitante)
  ) {
    return null;
  }

  if (Number.isFinite(id) && idLocal === id) {
    return golesVisitante;
  }

  if (Number.isFinite(id) && idVisitante === id) {
    return golesLocal;
  }

  return null;
}


// ============================================================
// CONSTRUIR RESULTADOS DEL MERCADO
// ============================================================

function construirResultadoMercado(
  data,
  equipoLocalId,
  equipoVisitanteId,
) {
  const equipo1 = data?.equipo_1 || {};
  const equipo2 = data?.equipo_2 || {};

  const partidosLocalGeneral =
    obtenerPartidosHistoricos(
      equipo1.general
    );

  const partidosLocalCasa =
    obtenerPartidosHistoricos(
      equipo1.como_local
    );

  const partidosVisitanteGeneral =
    obtenerPartidosHistoricos(
      equipo2.general
    );

  const partidosVisitanteFuera =
    obtenerPartidosHistoricos(
      equipo2.como_visitante
    );

  const generalLocal =
    obtenerResultadosHistoricos(
      partidosLocalGeneral
    );

  const localCasa =
    obtenerResultadosHistoricos(
      partidosLocalCasa
    );

  const generalVisitante =
    obtenerResultadosHistoricos(
      partidosVisitanteGeneral
    );

  const visitanteFuera =
    obtenerResultadosHistoricos(
      partidosVisitanteFuera
    );

  return {
    equipo_local: {
      id: Number(equipoLocalId),

      general: generalLocal,

      local: localCasa,

      partidos_general: partidosLocalGeneral,

      partidos_local: partidosLocalCasa,
    },

    equipo_visitante: {
      id: Number(equipoVisitanteId),

      general: generalVisitante,

      visitante: visitanteFuera,

      partidos_general: partidosVisitanteGeneral,

      partidos_visitante: partidosVisitanteFuera,
    },
  };
}


// ============================================================
// RENDERIZAR MERCADOS
// ============================================================

function renderizarMercados(
  data,
  nombreEquipoLocal,
  nombreEquipoVisitante,
  equipoLocalId,
  equipoVisitanteId,
) {
  const contenedor = document.getElementById("mercados");

  if (!contenedor) {
    return;
  }

  const resultado = construirResultadoMercado(
    data,
    equipoLocalId,
    equipoVisitanteId,
  );

  if (!resultado) {
    contenedor.innerHTML = "";
    return;
  }

  contenedor.innerHTML = `
    <section class="mercados-seccion">

      <h2 class="titulo-seccion">
        MERCADOS
      </h2>


      <!-- ================================================== -->
      <!-- POPULARES -->
      <!-- ================================================== -->

      <h3 class="subtitulo-mercado">
        POPULARES
      </h3>


      <!-- ================================================== -->
      <!-- RESULTADO DEL PARTIDO -->
      <!-- ================================================== -->

      <h3 class="subtitulo-mercado">
        RESULTADO DEL PARTIDO
      </h3>

      ${crearTablaResultado(
        resultado,
        nombreEquipoLocal,
        nombreEquipoVisitante,
      )}


      <!-- ================================================== -->
      <!-- DOBLE OPORTUNIDAD -->
      <!-- ================================================== -->

      <h3 class="subtitulo-mercado">
        DOBLE OPORTUNIDAD
      </h3>

      ${crearTablaDobleOportunidad(
        resultado,
        nombreEquipoLocal,
        nombreEquipoVisitante,
      )}


      <!-- ================================================== -->
      <!-- MÁS / MENOS -->
      <!-- ================================================== -->

      <h3 class="subtitulo-mercado">
        MÁS / MENOS
      </h3>


      <h4 class="subtitulo-mercado">
        TOTAL DE GOLES
      </h4>

      ${crearTablaMasMenosTotal(
        resultado,
        nombreEquipoLocal,
        nombreEquipoVisitante,
      )}


      <h4 class="subtitulo-mercado">
        GOLES MARCADOS POR EL LOCAL
      </h4>

      ${crearTablaMasMenosGolesLocal(
        resultado,
        nombreEquipoLocal,
        nombreEquipoVisitante,
      )}


      <h4 class="subtitulo-mercado">
        GOLES MARCADOS POR EL VISITANTE
      </h4>

      ${crearTablaMasMenosGolesVisitante(
        resultado,
        nombreEquipoLocal,
        nombreEquipoVisitante,
      )}

    </section>
  `;
}


// ============================================================
// RESULTADO DEL PARTIDO
// ============================================================

function crearTablaResultado(
  resultado,
  nombreEquipoLocal,
  nombreEquipoVisitante,
) {
  const localGeneral =
    resultado?.equipo_local?.general || {};

  const localCasa =
    resultado?.equipo_local?.local || {};

  const visitanteGeneral =
    resultado?.equipo_visitante?.general || {};

  const visitanteFuera =
    resultado?.equipo_visitante?.visitante || {};

  return `
    <div class="tabla-estadisticas-wrapper">

      <table class="tabla-estadisticas">

        <thead>
          <tr>

            <th></th>

            <th>
              ${escaparHTML(nombreEquipoLocal)}
              <br>
              General
            </th>

            <th>
              ${escaparHTML(nombreEquipoLocal)}
              <br>
              Casa
            </th>

            <th>
              ${escaparHTML(nombreEquipoVisitante)}
              <br>
              Fuera
            </th>

            <th>
              ${escaparHTML(nombreEquipoVisitante)}
              <br>
              General
            </th>

          </tr>
        </thead>

        <tbody>

          <tr>

            <td>Victorias</td>

            <td>
              ${porcentajeMercado(
                localGeneral.victorias,
                localGeneral.partidos
              )}
            </td>

            <td>
              ${porcentajeMercado(
                localCasa.victorias,
                localCasa.partidos
              )}
            </td>

            <td>
              ${porcentajeMercado(
                visitanteFuera.victorias,
                visitanteFuera.partidos
              )}
            </td>

            <td>
              ${porcentajeMercado(
                visitanteGeneral.victorias,
                visitanteGeneral.partidos
              )}
            </td>

          </tr>


          <tr>

            <td>Empates</td>

            <td>
              ${porcentajeMercado(
                localGeneral.empates,
                localGeneral.partidos
              )}
            </td>

            <td>
              ${porcentajeMercado(
                localCasa.empates,
                localCasa.partidos
              )}
            </td>

            <td>
              ${porcentajeMercado(
                visitanteFuera.empates,
                visitanteFuera.partidos
              )}
            </td>

            <td>
              ${porcentajeMercado(
                visitanteGeneral.empates,
                visitanteGeneral.partidos
              )}
            </td>

          </tr>


          <tr>

            <td>Derrotas</td>

            <td>
              ${porcentajeMercado(
                localGeneral.derrotas,
                localGeneral.partidos
              )}
            </td>

            <td>
              ${porcentajeMercado(
                localCasa.derrotas,
                localCasa.partidos
              )}
            </td>

            <td>
              ${porcentajeMercado(
                visitanteFuera.derrotas,
                visitanteFuera.partidos
              )}
            </td>

            <td>
              ${porcentajeMercado(
                visitanteGeneral.derrotas,
                visitanteGeneral.partidos
              )}
            </td>

          </tr>


          <tr>

            <td>Partidos</td>

            <td>
              ${valorMercado(
                localGeneral.partidos
              )}
            </td>

            <td>
              ${valorMercado(
                localCasa.partidos
              )}
            </td>

            <td>
              ${valorMercado(
                visitanteFuera.partidos
              )}
            </td>

            <td>
              ${valorMercado(
                visitanteGeneral.partidos
              )}
            </td>

          </tr>

        </tbody>

      </table>

    </div>
  `;
}


// ============================================================
// DOBLE OPORTUNIDAD
// ============================================================

function crearTablaDobleOportunidad(
  resultado,
  nombreEquipoLocal,
  nombreEquipoVisitante,
) {
  const localGeneral =
    resultado?.equipo_local?.general || {};

  const localCasa =
    resultado?.equipo_local?.local || {};

  const visitanteGeneral =
    resultado?.equipo_visitante?.general || {};

  const visitanteFuera =
    resultado?.equipo_visitante?.visitante || {};

  return `
    <div class="tabla-estadisticas-wrapper">

      <table class="tabla-estadisticas">

        <thead>
          <tr>

            <th></th>

            <th>
              ${escaparHTML(nombreEquipoLocal)}
              <br>
              General
            </th>

            <th>
              ${escaparHTML(nombreEquipoLocal)}
              <br>
              Casa
            </th>

            <th>
              ${escaparHTML(nombreEquipoVisitante)}
              <br>
              Fuera
            </th>

            <th>
              ${escaparHTML(nombreEquipoVisitante)}
              <br>
              General
            </th>

          </tr>
        </thead>

        <tbody>

          <tr>

            <td>1X - Local o Empate</td>

            <td>
              ${porcentajeDobleOportunidad(
                localGeneral.victorias,
                localGeneral.empates,
                localGeneral.partidos
              )}
            </td>

            <td>
              ${porcentajeDobleOportunidad(
                localCasa.victorias,
                localCasa.empates,
                localCasa.partidos
              )}
            </td>

            <td>
              ${porcentajeDobleOportunidad(
                visitanteFuera.derrotas,
                visitanteFuera.empates,
                visitanteFuera.partidos
              )}
            </td>

            <td>
              ${porcentajeDobleOportunidad(
                visitanteGeneral.derrotas,
                visitanteGeneral.empates,
                visitanteGeneral.partidos
              )}
            </td>

          </tr>


          <tr>

            <td>X2 - Visitante o Empate</td>

            <td>
              ${porcentajeDobleOportunidad(
                localGeneral.derrotas,
                localGeneral.empates,
                localGeneral.partidos
              )}
            </td>

            <td>
              ${porcentajeDobleOportunidad(
                localCasa.derrotas,
                localCasa.empates,
                localCasa.partidos
              )}
            </td>

            <td>
              ${porcentajeDobleOportunidad(
                visitanteFuera.victorias,
                visitanteFuera.empates,
                visitanteFuera.partidos
              )}
            </td>

            <td>
              ${porcentajeDobleOportunidad(
                visitanteGeneral.victorias,
                visitanteGeneral.empates,
                visitanteGeneral.partidos
              )}
            </td>

          </tr>


          <tr>

            <td>12 - Local o Visitante</td>

            <td>
              ${porcentajeDobleOportunidad(
                localGeneral.victorias,
                localGeneral.derrotas,
                localGeneral.partidos
              )}
            </td>

            <td>
              ${porcentajeDobleOportunidad(
                localCasa.victorias,
                localCasa.derrotas,
                localCasa.partidos
              )}
            </td>

            <td>
              ${porcentajeDobleOportunidad(
                visitanteFuera.victorias,
                visitanteFuera.derrotas,
                visitanteFuera.partidos
              )}
            </td>

            <td>
              ${porcentajeDobleOportunidad(
                visitanteGeneral.victorias,
                visitanteGeneral.derrotas,
                visitanteGeneral.partidos
              )}
            </td>

          </tr>

        </tbody>

      </table>

    </div>
  `;
}


// ============================================================
// MÁS / MENOS — TOTAL DE GOLES
// ============================================================

function crearTablaMasMenosTotal(
  resultado,
  nombreEquipoLocal,
  nombreEquipoVisitante,
) {
  const partidosLocalGeneral =
    resultado?.equipo_local?.partidos_general || [];

  const partidosLocalCasa =
    resultado?.equipo_local?.partidos_local || [];

  const partidosVisitanteGeneral =
    resultado?.equipo_visitante?.partidos_general || [];

  const partidosVisitanteFuera =
    resultado?.equipo_visitante?.partidos_visitante || [];

  const lineas = [];

  for (let linea = 0.5; linea <= 9.5; linea += 1) {
    lineas.push(linea);
  }

  return `
    <div class="tabla-estadisticas-wrapper">

      <table class="tabla-estadisticas">

        <thead>
          <tr>

            <th>Mercado</th>

            <th>
              ${escaparHTML(nombreEquipoLocal)}
              <br>
              General
            </th>

            <th>
              ${escaparHTML(nombreEquipoLocal)}
              <br>
              Casa
            </th>

            <th>
              ${escaparHTML(nombreEquipoVisitante)}
              <br>
              Fuera
            </th>

            <th>
              ${escaparHTML(nombreEquipoVisitante)}
              <br>
              General
            </th>

          </tr>
        </thead>

        <tbody>

          ${lineas.map((linea) => {

            const masLocalGeneral =
              calcularPorcentajeTotalGoles(
                partidosLocalGeneral,
                linea,
                true
              );

            const menosLocalGeneral =
              calcularPorcentajeTotalGoles(
                partidosLocalGeneral,
                linea,
                false
              );

            const masLocalCasa =
              calcularPorcentajeTotalGoles(
                partidosLocalCasa,
                linea,
                true
              );

            const menosLocalCasa =
              calcularPorcentajeTotalGoles(
                partidosLocalCasa,
                linea,
                false
              );

            const masVisitanteFuera =
              calcularPorcentajeTotalGoles(
                partidosVisitanteFuera,
                linea,
                true
              );

            const menosVisitanteFuera =
              calcularPorcentajeTotalGoles(
                partidosVisitanteFuera,
                linea,
                false
              );

            const masVisitanteGeneral =
              calcularPorcentajeTotalGoles(
                partidosVisitanteGeneral,
                linea,
                true
              );

            const menosVisitanteGeneral =
              calcularPorcentajeTotalGoles(
                partidosVisitanteGeneral,
                linea,
                false
              );

            return `

              <tr>

                <td>
                  Más ${formatearLinea(linea)}
                </td>

                <td>
                  ${masLocalGeneral}
                </td>

                <td>
                  ${masLocalCasa}
                </td>

                <td>
                  ${masVisitanteFuera}
                </td>

                <td>
                  ${masVisitanteGeneral}
                </td>

              </tr>


              <tr>

                <td>
                  Menos ${formatearLinea(linea)}
                </td>

                <td>
                  ${menosLocalGeneral}
                </td>

                <td>
                  ${menosLocalCasa}
                </td>

                <td>
                  ${menosVisitanteFuera}
                </td>

                <td>
                  ${menosVisitanteGeneral}
                </td>

              </tr>

            `;
          }).join("")}

        </tbody>

      </table>

    </div>
  `;
}


// ============================================================
// MÁS / MENOS — GOLES MARCADOS POR EL LOCAL
//
// LÓGICA:
//
// LOCAL GENERAL:
//   Goles que marca el equipo local en TODOS sus partidos.
//
// LOCAL CASA:
//   Goles que marca el equipo local solamente jugando en casa.
//
// VISITANTE GENERAL:
//   Goles que RECIBE el equipo visitante en TODOS sus partidos.
//
// VISITANTE FUERA:
//   Goles que RECIBE el equipo visitante jugando fuera.
//
// Esto permite comparar ATAQUE DEL LOCAL
// contra DEFENSA DEL VISITANTE.
// ============================================================

function crearTablaMasMenosGolesLocal(
  resultado,
  nombreEquipoLocal,
  nombreEquipoVisitante,
) {
  const equipoLocalId =
    resultado?.equipo_local?.id;

  const equipoVisitanteId =
    resultado?.equipo_visitante?.id;

  const partidosLocalGeneral =
    resultado?.equipo_local?.partidos_general || [];

  const partidosLocalCasa =
    resultado?.equipo_local?.partidos_local || [];

  const partidosVisitanteGeneral =
    resultado?.equipo_visitante?.partidos_general || [];

  const partidosVisitanteFuera =
    resultado?.equipo_visitante?.partidos_visitante || [];

  const lineas = [];

  for (let linea = 0.5; linea <= 6.5; linea += 1) {
    lineas.push(linea);
  }

  return `
    <div class="tabla-estadisticas-wrapper">

      <table class="tabla-estadisticas">

        <thead>

          <tr>

            <th>Mercado</th>

            <th>
              ${escaparHTML(nombreEquipoLocal)}
              <br>
              General
              <br>
              Marcados
            </th>

            <th>
              ${escaparHTML(nombreEquipoLocal)}
              <br>
              Casa
              <br>
              Marcados
            </th>

            <th>
              ${escaparHTML(nombreEquipoVisitante)}
              <br>
              General
              <br>
              Recibidos
            </th>

            <th>
              ${escaparHTML(nombreEquipoVisitante)}
              <br>
              Fuera
              <br>
              Recibidos
            </th>

          </tr>

        </thead>

        <tbody>

          ${lineas.map((linea) => {

            const masLocalGeneral =
              porcentajeGolesEquipo(
                partidosLocalGeneral,
                equipoLocalId,
                linea,
                "mas",
                "marcados"
              );

            const menosLocalGeneral =
              porcentajeGolesEquipo(
                partidosLocalGeneral,
                equipoLocalId,
                linea,
                "menos",
                "marcados"
              );

            const masLocalCasa =
              porcentajeGolesEquipo(
                partidosLocalCasa,
                equipoLocalId,
                linea,
                "mas",
                "marcados"
              );

            const menosLocalCasa =
              porcentajeGolesEquipo(
                partidosLocalCasa,
                equipoLocalId,
                linea,
                "menos",
                "marcados"
              );

            const masVisitanteGeneral =
              porcentajeGolesEquipo(
                partidosVisitanteGeneral,
                equipoVisitanteId,
                linea,
                "mas",
                "recibidos"
              );

            const menosVisitanteGeneral =
              porcentajeGolesEquipo(
                partidosVisitanteGeneral,
                equipoVisitanteId,
                linea,
                "menos",
                "recibidos"
              );

            const masVisitanteFuera =
              porcentajeGolesEquipo(
                partidosVisitanteFuera,
                equipoVisitanteId,
                linea,
                "mas",
                "recibidos"
              );

            const menosVisitanteFuera =
              porcentajeGolesEquipo(
                partidosVisitanteFuera,
                equipoVisitanteId,
                linea,
                "menos",
                "recibidos"
              );

            return `

              <tr>

                <td>
                  Más ${formatearLinea(linea)}
                </td>

                <td>
                  ${masLocalGeneral}
                </td>

                <td>
                  ${masLocalCasa}
                </td>

                <td>
                  ${masVisitanteGeneral}
                </td>

                <td>
                  ${masVisitanteFuera}
                </td>

              </tr>


              <tr>

                <td>
                  Menos ${formatearLinea(linea)}
                </td>

                <td>
                  ${menosLocalGeneral}
                </td>

                <td>
                  ${menosLocalCasa}
                </td>

                <td>
                  ${menosVisitanteGeneral}
                </td>

                <td>
                  ${menosVisitanteFuera}
                </td>

              </tr>

            `;
          }).join("")}

        </tbody>

      </table>

    </div>
  `;
}


// ============================================================
// MÁS / MENOS — GOLES MARCADOS POR EL VISITANTE
//
// LÓGICA:
//
// VISITANTE GENERAL:
//   Goles que marca el visitante en TODOS sus partidos.
//
// VISITANTE FUERA:
//   Goles que marca el visitante jugando fuera.
//
// LOCAL GENERAL:
//   Goles que RECIBE el local en TODOS sus partidos.
//
// LOCAL CASA:
//   Goles que RECIBE el local jugando en casa.
//
// Esto permite comparar ATAQUE DEL VISITANTE
// contra DEFENSA DEL LOCAL.
// ============================================================

function crearTablaMasMenosGolesVisitante(
  resultado,
  nombreEquipoLocal,
  nombreEquipoVisitante,
) {
  const equipoLocalId =
    resultado?.equipo_local?.id;

  const equipoVisitanteId =
    resultado?.equipo_visitante?.id;

  const partidosLocalGeneral =
    resultado?.equipo_local?.partidos_general || [];

  const partidosLocalCasa =
    resultado?.equipo_local?.partidos_local || [];

  const partidosVisitanteGeneral =
    resultado?.equipo_visitante?.partidos_general || [];

  const partidosVisitanteFuera =
    resultado?.equipo_visitante?.partidos_visitante || [];

  const lineas = [];

  for (let linea = 0.5; linea <= 6.5; linea += 1) {
    lineas.push(linea);
  }

  return `
    <div class="tabla-estadisticas-wrapper">

      <table class="tabla-estadisticas">

        <thead>

          <tr>

            <th>Mercado</th>

            <th>
              ${escaparHTML(nombreEquipoVisitante)}
              <br>
              General
              <br>
              Marcados
            </th>

            <th>
              ${escaparHTML(nombreEquipoVisitante)}
              <br>
              Fuera
              <br>
              Marcados
            </th>

            <th>
              ${escaparHTML(nombreEquipoLocal)}
              <br>
              General
              <br>
              Recibidos
            </th>

            <th>
              ${escaparHTML(nombreEquipoLocal)}
              <br>
              Casa
              <br>
              Recibidos
            </th>

          </tr>

        </thead>

        <tbody>

          ${lineas.map((linea) => {

            const masVisitanteGeneral =
              porcentajeGolesEquipo(
                partidosVisitanteGeneral,
                equipoVisitanteId,
                linea,
                "mas",
                "marcados"
              );

            const menosVisitanteGeneral =
              porcentajeGolesEquipo(
                partidosVisitanteGeneral,
                equipoVisitanteId,
                linea,
                "menos",
                "marcados"
              );

            const masVisitanteFuera =
              porcentajeGolesEquipo(
                partidosVisitanteFuera,
                equipoVisitanteId,
                linea,
                "mas",
                "marcados"
              );

            const menosVisitanteFuera =
              porcentajeGolesEquipo(
                partidosVisitanteFuera,
                equipoVisitanteId,
                linea,
                "menos",
                "marcados"
              );

            const masLocalGeneral =
              porcentajeGolesEquipo(
                partidosLocalGeneral,
                equipoLocalId,
                linea,
                "mas",
                "recibidos"
              );

            const menosLocalGeneral =
              porcentajeGolesEquipo(
                partidosLocalGeneral,
                equipoLocalId,
                linea,
                "menos",
                "recibidos"
              );

            const masLocalCasa =
              porcentajeGolesEquipo(
                partidosLocalCasa,
                equipoLocalId,
                linea,
                "mas",
                "recibidos"
              );

            const menosLocalCasa =
              porcentajeGolesEquipo(
                partidosLocalCasa,
                equipoLocalId,
                linea,
                "menos",
                "recibidos"
              );

            return `

              <tr>

                <td>
                  Más ${formatearLinea(linea)}
                </td>

                <td>
                  ${masVisitanteGeneral}
                </td>

                <td>
                  ${masVisitanteFuera}
                </td>

                <td>
                  ${masLocalGeneral}
                </td>

                <td>
                  ${masLocalCasa}
                </td>

              </tr>


              <tr>

                <td>
                  Menos ${formatearLinea(linea)}
                </td>

                <td>
                  ${menosVisitanteGeneral}
                </td>

                <td>
                  ${menosVisitanteFuera}
                </td>

                <td>
                  ${menosLocalGeneral}
                </td>

                <td>
                  ${menosLocalCasa}
                </td>

              </tr>

            `;
          }).join("")}

        </tbody>

      </table>

    </div>
  `;
}


// ============================================================
// CALCULAR MÁS / MENOS DE GOLES TOTALES
// ============================================================

function calcularPorcentajeTotalGoles(
  partidos,
  linea,
  esMas,
) {
  if (!Array.isArray(partidos) || partidos.length === 0) {
    return "N/D";
  }

  let validos = 0;
  let acertados = 0;

  partidos.forEach((partido) => {

    const golesLocal =
      Number(partido?.marcador_local);

    const golesVisitante =
      Number(partido?.marcador_visitante);

    if (
      !Number.isFinite(golesLocal) ||
      !Number.isFinite(golesVisitante)
    ) {
      return;
    }

    const total =
      golesLocal + golesVisitante;

    validos += 1;

    if (esMas) {
      if (total > linea) {
        acertados += 1;
      }
    } else {
      if (total < linea) {
        acertados += 1;
      }
    }
  });

  if (validos === 0) {
    return "N/D";
  }

  return porcentajeMercado(
    acertados,
    validos
  );
}


// ============================================================
// CALCULAR MÁS / MENOS DE GOLES DE UN EQUIPO
//
// objetivo:
//
// "marcados"
//   -> goles que marca el equipo.
//
// "recibidos"
//   -> goles que recibe el equipo.
//
// modo:
//
// "mas"
//   -> estrictamente mayor que la línea.
//
// "menos"
//   -> estrictamente menor que la línea.
//
// Ejemplo:
//
// Más 2.5
//   -> goles >= 3
//
// Menos 2.5
//   -> goles <= 2
// ============================================================

function porcentajeGolesEquipo(
  partidos,
  equipoId,
  linea,
  modo,
  objetivo,
) {
  if (!Array.isArray(partidos) || partidos.length === 0) {
    return "N/D";
  }

  let validos = 0;
  let acertados = 0;

  partidos.forEach((partido) => {

    let goles = null;

    if (objetivo === "marcados") {

      goles =
        obtenerGolesEquipo(
          partido,
          equipoId
        );

    } else if (objetivo === "recibidos") {

      goles =
        obtenerGolesRecibidosEquipo(
          partido,
          equipoId
        );
    }

    if (!Number.isFinite(goles)) {
      return;
    }

    validos += 1;

    if (modo === "mas") {

      if (goles > linea) {
        acertados += 1;
      }

    } else if (modo === "menos") {

      if (goles < linea) {
        acertados += 1;
      }
    }
  });

  if (validos === 0) {
    return "N/D";
  }

  return porcentajeMercado(
    acertados,
    validos
  );
}


// ============================================================
// FORMATEAR LÍNEA
// ============================================================

function formatearLinea(linea) {
  const numero = Number(linea);

  if (!Number.isFinite(numero)) {
    return "N/D";
  }

  return numero.toFixed(1);
}


// ============================================================
// PORCENTAJE DOBLE OPORTUNIDAD
// ============================================================

function porcentajeDobleOportunidad(
  resultado1,
  resultado2,
  partidos,
) {
  if (
    resultado1 === null ||
    resultado1 === undefined ||
    resultado2 === null ||
    resultado2 === undefined ||
    partidos === null ||
    partidos === undefined ||
    partidos === "" ||
    Number(partidos) === 0
  ) {
    return "N/D";
  }

  const porcentaje =
    (
      (
        Number(resultado1) +
        Number(resultado2)
      ) /
      Number(partidos)
    ) *
    100;

  return formatearPorcentaje(
    porcentaje
  );
}


// ============================================================
// PORCENTAJE MERCADO
// ============================================================

function porcentajeMercado(
  valor,
  partidos,
) {
  if (
    valor === null ||
    valor === undefined ||
    valor === "" ||
    partidos === null ||
    partidos === undefined ||
    partidos === "" ||
    Number(partidos) === 0
  ) {
    return "N/D";
  }

  const porcentaje =
    (
      Number(valor) /
      Number(partidos)
    ) *
    100;

  return formatearPorcentaje(
    porcentaje
  );
}


// ============================================================
// FORMATEAR PORCENTAJE
// ============================================================

function formatearPorcentaje(porcentaje) {
  if (!Number.isFinite(Number(porcentaje))) {
    return "N/D";
  }

  const numero = Number(porcentaje);

  return `${numero % 1 === 0
    ? numero
    : numero.toFixed(1)}%`;
}


// ============================================================
// VALOR MERCADO
// ============================================================

function valorMercado(valor) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return "N/D";
  }

  return escaparHTML(
    String(valor)
  );
}


// ============================================================
// ESCAPAR HTML
// ============================================================

function escaparHTML(valor) {
  return String(valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}