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
// OBTENER QUIÉN MARCÓ EL PRIMER GOL DEL PARTIDO
// ============================================================

function obtenerEstadoPrimerGol(partido, equipoId) {
  if (!partido) {
    return null;
  }

  const flags =
    partido?.estadisticas?.eventos_jugadores?.flags;

  const primerGol =
    flags?.primer_gol_equipo;

  const idEquipo = Number(equipoId);
  const idLocal = obtenerIdEquipoLocalPartido(partido);
  const idVisitante = obtenerIdEquipoVisitantePartido(partido);

  if (
    (primerGol === "local" || primerGol === "visitante") &&
    Number.isFinite(idEquipo)
  ) {
    const equipoMarcoPrimero = primerGol === "local"
      ? idLocal
      : idVisitante;

    if (equipoMarcoPrimero === idEquipo) {
      return "equipo";
    }

    if (
      (idLocal === idEquipo || idVisitante === idEquipo) &&
      equipoMarcoPrimero !== idEquipo
    ) {
      return "rival";
    }
  }

  if (
    flags &&
    Object.prototype.hasOwnProperty.call(
      flags,
      "primer_gol_equipo"
    ) &&
    primerGol === null
  ) {
    return "sin_goles";
  }

  const golesLocal = Number(partido?.marcador_local);
  const golesVisitante = Number(partido?.marcador_visitante);

  if (
    Number.isFinite(golesLocal) &&
    Number.isFinite(golesVisitante) &&
    golesLocal === 0 &&
    golesVisitante === 0
  ) {
    return "sin_goles";
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
        Mercados
      </h2>


      <h2 class="titulo-seccion">
        Populares
      </h2>

      <h3 class="subtitulo-mercado">
        Resultado del partido
      </h3>

      ${crearTablaResultado(
        resultado,
        nombreEquipoLocal,
        nombreEquipoVisitante,
      )}


      <h3 class="subtitulo-mercado">
        Doble oportunidad
      </h3>

      ${crearTablaDobleOportunidad(
        resultado,
        nombreEquipoLocal,
        nombreEquipoVisitante,
      )}


      <h3 class="subtitulo-mercado">
        Marcador correcto
      </h3>

      <h4 class="subtitulo-mercado">
        Victoria de ${escaparHTML(nombreEquipoLocal)}
      </h4>

      ${crearTablaMarcadorCorrecto(
        resultado,
        nombreEquipoLocal,
        nombreEquipoVisitante,
        "local",
      )}


      <h4 class="subtitulo-mercado">
        Empates
      </h4>

      ${crearTablaMarcadorCorrecto(
        resultado,
        nombreEquipoLocal,
        nombreEquipoVisitante,
        "empate",
      )}


      <h4 class="subtitulo-mercado">
        Victoria de ${escaparHTML(nombreEquipoVisitante)}
      </h4>

      ${crearTablaMarcadorCorrecto(
        resultado,
        nombreEquipoLocal,
        nombreEquipoVisitante,
        "visitante",
      )}


      <h2 class="titulo-seccion">
        Más/Menos
      </h2>

      <h3 class="subtitulo-mercado">
        Goles totales Más/Menos
      </h3>

      ${crearTablaMasMenosTotal(
        resultado,
        nombreEquipoLocal,
        nombreEquipoVisitante,
      )}


      <h3 class="subtitulo-mercado">
        ${escaparHTML(nombreEquipoLocal)} - Goles totales Más/Menos
      </h3>

      ${crearTablaMasMenosGolesLocal(
        resultado,
        nombreEquipoLocal,
        nombreEquipoVisitante,
      )}

      <h3 class="subtitulo-mercado">
        ${escaparHTML(nombreEquipoVisitante)} - Goles totales Más/Menos
      </h3>

      ${crearTablaMasMenosGolesVisitante(
        resultado,
        nombreEquipoLocal,
        nombreEquipoVisitante,
      )}

      <h3 class="subtitulo-mercado">
        Resultado del partido o Goles totales Más/Menos
      </h3>

      ${crearTablaResultadoOGolesTotales(
        resultado,
        nombreEquipoLocal,
        nombreEquipoVisitante,
      )}

      <h3 class="subtitulo-mercado">
        Resultado del partido o Ambos equipos anotan
      </h3>

      ${crearTablaResultadoAmbosAnotan(
        resultado,
        nombreEquipoLocal,
        nombreEquipoVisitante,
        "o",
      )}

      <h2 class="titulo-seccion">
        Jugadores
      </h2>

      <h2 class="titulo-seccion">
        Tiros de esquina
      </h2>

      <h2 class="titulo-seccion">
        Tarjetas
      </h2>

      <h3 class="subtitulo-mercado">
        Tarjetas totales Más/Menos
      </h3>

      ${crearTablaMasMenosTarjetas(
        resultado,
        nombreEquipoLocal,
        nombreEquipoVisitante,
      )}

      <h3 class="subtitulo-mercado">
        Ambos equipos reciben una tarjeta
      </h3>

      ${crearTablaAmbosEquiposTarjetas(
        resultado,
        nombreEquipoLocal,
        nombreEquipoVisitante,
        1,
      )}

      <h3 class="subtitulo-mercado">
        Ambos equipos reciben 2 o más tarjetas
      </h3>

      ${crearTablaAmbosEquiposTarjetas(
        resultado,
        nombreEquipoLocal,
        nombreEquipoVisitante,
        2,
      )}

      <h3 class="subtitulo-mercado">
        Tarjetas rojas totales Más/Menos
      </h3>

      ${crearTablaMasMenosTarjetasRojas(
        resultado,
        nombreEquipoLocal,
        nombreEquipoVisitante,
      )}

      <h3 class="subtitulo-mercado">
        ${escaparHTML(nombreEquipoLocal)} Tarjetas totales Más/Menos
      </h3>

      ${crearTablaMasMenosTarjetasEquipo(
        resultado,
        nombreEquipoLocal,
        nombreEquipoVisitante,
        "local",
      )}

      <h3 class="subtitulo-mercado">
        ${escaparHTML(nombreEquipoVisitante)} Tarjetas totales Más/Menos
      </h3>

      ${crearTablaMasMenosTarjetasEquipo(
        resultado,
        nombreEquipoLocal,
        nombreEquipoVisitante,
        "visitante",
      )}

      <h3 class="subtitulo-mercado">Equipo con más tarjetas</h3>
      ${crearTablaMasTarjetas(resultado, nombreEquipoLocal, nombreEquipoVisitante)}

      <h3 class="subtitulo-mercado">${escaparHTML(nombreEquipoLocal)} Tarjeta roja</h3>
      ${crearTablaTarjetaRojaEquipo(resultado, nombreEquipoLocal, nombreEquipoVisitante, "local")}

      <h3 class="subtitulo-mercado">${escaparHTML(nombreEquipoVisitante)} Tarjeta roja</h3>
      ${crearTablaTarjetaRojaEquipo(resultado, nombreEquipoLocal, nombreEquipoVisitante, "visitante")}

      <h2 class="titulo-seccion">
        Estadísticas
      </h2>

      <h2 class="titulo-seccion">
        Goles
      </h2>

      <h3 class="subtitulo-mercado">
        Ambos anotan
      </h3>

      ${crearTablaAmbosAnotan(
        resultado,
        nombreEquipoLocal,
        nombreEquipoVisitante,
      )}

      <h3 class="subtitulo-mercado">
        Ambos equipos anotan o Más de goles
      </h3>

      ${crearTablaAmbosAnotanOMasGoles(
        resultado,
        nombreEquipoLocal,
        nombreEquipoVisitante,
      )}

      <h3 class="subtitulo-mercado">
        Próximo gol (Gol 1)
      </h3>

      ${crearTablaProximoGol(
        resultado,
        nombreEquipoLocal,
        nombreEquipoVisitante,
      )}

      <h3 class="subtitulo-mercado">
        Resultado del partido con Más/Menos
      </h3>

      ${crearTablaResultadoMasMenos(
        resultado,
        nombreEquipoLocal,
        nombreEquipoVisitante,
      )}

      <h3 class="subtitulo-mercado">
        Ambos anotan y Más/Menos
      </h3>

      ${crearTablaAmbosAnotanMasMenos(
        resultado,
        nombreEquipoLocal,
        nombreEquipoVisitante,
      )}

      <h3 class="subtitulo-mercado">
        Doble oportunidad con Más/Menos
      </h3>

      ${crearTablaDobleOportunidadMasMenos(
        resultado,
        nombreEquipoLocal,
        nombreEquipoVisitante,
      )}

      <h3 class="subtitulo-mercado">
        Doble oportunidad / Ambos equipos anotan
      </h3>

      ${crearTablaDobleOportunidadAmbosAnotan(
        resultado,
        nombreEquipoLocal,
        nombreEquipoVisitante,
      )}

      <h3 class="subtitulo-mercado">
        Total de goles
      </h3>

      ${crearTablaRangosTotalGoles(
        resultado,
        nombreEquipoLocal,
        nombreEquipoVisitante,
      )}

      <h3 class="subtitulo-mercado">
        Total de goles (extra)
      </h3>

      ${crearTablaRangosExtraTotalGoles(
        resultado,
        nombreEquipoLocal,
        nombreEquipoVisitante,
      )}

      <h3 class="subtitulo-mercado">
        Total de goles par/impar
      </h3>

      ${crearTablaParidadTotalGoles(
        resultado,
        nombreEquipoLocal,
        nombreEquipoVisitante,
      )}

      <h3 class="subtitulo-mercado">
        Total de goles del equipo
      </h3>

      ${crearTablaTotalGolesEquipo(
        resultado,
        nombreEquipoLocal,
        nombreEquipoVisitante,
        "local",
      )}

      ${crearTablaTotalGolesEquipo(
        resultado,
        nombreEquipoLocal,
        nombreEquipoVisitante,
        "visitante",
      )}

    </section>
  `;
}


function crearTablaMasTarjetas(resultado, local, visitante) {
  const columnas = obtenerColumnasHistoricasMercados(resultado, local, visitante);
  return tablaTarjetasSimple(columnas, [local, "Empate", visitante], (p, opcion) => porcentajeResultadoTarjetas(p, opcion === local ? "local" : opcion === visitante ? "visitante" : "Empate"));
}

function crearTablaTarjetaRojaEquipo(resultado, local, visitante, objetivo) {
  const equipo = objetivo === "local" ? resultado?.equipo_local : resultado?.equipo_visitante;
  const columnas = [{ partidos: equipo?.partidos_general || [], titulo: "General" }, { partidos: objetivo === "local" ? equipo?.partidos_local || [] : equipo?.partidos_visitante || [], titulo: objetivo === "local" ? "Casa" : "Fuera" }];
  return tablaTarjetasSimple(columnas, ["Sí", "No"], (p, opcion) => porcentajeRojaEquipo(p, equipo?.id, opcion === "Sí"));
}

function tablaTarjetasSimple(columnas, filas, calcular) {
  return `<div class="tabla-estadisticas-wrapper"><table class="tabla-estadisticas"><thead><tr><th>Mercado</th>${columnas.map(c=>`<th>${escaparHTML(c.titulo || `${c.nombre}<br>${c.condicion}`)}</th>`).join("")}</tr></thead><tbody>${filas.map(f=>`<tr><td>${escaparHTML(f)}</td>${columnas.map(c=>`<td>${calcular(c.partidos,f)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}

// ============================================================
// TARJETAS TOTALES MÁS / MENOS
// ============================================================

function crearTablaMasMenosTarjetas(
  resultado,
  nombreEquipoLocal,
  nombreEquipoVisitante,
) {
  const columnas = obtenerColumnasHistoricasMercados(
    resultado,
    nombreEquipoLocal,
    nombreEquipoVisitante,
  );

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

            ${crearEncabezadosColumnasMercados(columnas)}
          </tr>
        </thead>

        <tbody>

          ${lineas.map((linea) => `
            <tr>
              <td>Más ${formatearLinea(linea)}</td>

              ${columnas.map((columna) => `
                <td>${porcentajeTotalTarjetas(columna.partidos, linea, true)}</td>
              `).join("")}
            </tr>

            <tr>
              <td>Menos ${formatearLinea(linea)}</td>

              ${columnas.map((columna) => `
                <td>${porcentajeTotalTarjetas(columna.partidos, linea, false)}</td>
              `).join("")}
            </tr>
          `).join("")}

        </tbody>

      </table>

    </div>
  `;
}


function crearTablaMasMenosTarjetasEquipo(resultado, local, visitante, objetivo) {
  const esLocal = objetivo === "local";
  const equipo = esLocal ? resultado?.equipo_local : resultado?.equipo_visitante;
  const nombre = esLocal ? local : visitante;
  const condicion = esLocal ? "Casa" : "Fuera";
  const columnas = [
    { partidos: equipo?.partidos_general || [], equipoId: equipo?.id, titulo: `${nombre} General` },
    { partidos: esLocal ? equipo?.partidos_local || [] : equipo?.partidos_visitante || [], equipoId: equipo?.id, titulo: `${nombre} ${condicion}` },
  ];
  const lineas = [];
  for (let linea = 0.5; linea <= 4.5; linea += 1) lineas.push(linea);

  return `
    <div class="tabla-estadisticas-wrapper">
      <table class="tabla-estadisticas">
        <thead><tr><th>Mercado</th>${columnas.map((columna) => `<th>${escaparHTML(columna.titulo)}</th>`).join("")}</tr></thead>
        <tbody>${lineas.map((linea) => `
          <tr><td>Más ${formatearLinea(linea)}</td>${columnas.map((columna) => `<td>${porcentajeTarjetasEquipo(columna.partidos, columna.equipoId, linea, true)}</td>`).join("")}</tr>
          <tr><td>Menos ${formatearLinea(linea)}</td>${columnas.map((columna) => `<td>${porcentajeTarjetasEquipo(columna.partidos, columna.equipoId, linea, false)}</td>`).join("")}</tr>
        `).join("")}</tbody>
      </table>
    </div>
  `;
}


function porcentajeTarjetasEquipo(partidos, equipoId, linea, esMas) {
  if (!Array.isArray(partidos) || partidos.length === 0) return "N/D";
  let validos = 0;
  let acertados = 0;

  partidos.forEach((partido) => {
    const tarjetas = partido?.estadisticas?.eventos_jugadores?.tarjetas;
    const idLocal = obtenerIdEquipoLocalPartido(partido);
    const lado = idLocal === Number(equipoId) ? "local" : "visitante";
    if (!Array.isArray(tarjetas)) return;
    validos += 1;
    const total = tarjetas.filter((tarjeta) => tarjeta?.equipo === lado).length;
    if (esMas ? total > linea : total < linea) acertados += 1;
  });

  return porcentajeMercado(acertados, validos);
}

function porcentajeResultadoTarjetas(partidos, opcion) {
  let v=0,a=0; (partidos||[]).forEach(p=>{const t=obtenerResumenTarjetas(p); if(!t)return; v++; const r=t.local>t.visitante?"local":t.local<t.visitante?"visitante":"Empate"; if(r===opcion)a++;}); return porcentajeMercado(a,v);
}

function porcentajeRojaEquipo(partidos, equipoId, si) {
  let v=0,a=0; (partidos||[]).forEach(p=>{const t=p?.estadisticas?.eventos_jugadores?.tarjetas; if(!Array.isArray(t))return; v++; const lado=obtenerIdEquipoLocalPartido(p)===Number(equipoId)?"local":"visitante"; const roja=t.some(x=>x?.equipo===lado&&(x?.tipo==="Roja"||x?.tipo==="Segunda amarilla")); if(roja===si)a++;}); return porcentajeMercado(a,v);
}


// ============================================================
// TARJETAS ROJAS TOTALES MÁS / MENOS
// ============================================================

function crearTablaMasMenosTarjetasRojas(
  resultado,
  nombreEquipoLocal,
  nombreEquipoVisitante,
) {
  const columnas = obtenerColumnasHistoricasMercados(
    resultado,
    nombreEquipoLocal,
    nombreEquipoVisitante,
  );

  const lineas = [];

  for (let linea = 0.5; linea <= 5.5; linea += 1) {
    lineas.push(linea);
  }

  return `
    <div class="tabla-estadisticas-wrapper">
      <table class="tabla-estadisticas">
        <thead>
          <tr>
            <th>Mercado</th>
            ${crearEncabezadosColumnasMercados(columnas)}
          </tr>
        </thead>
        <tbody>
          ${lineas.map((linea) => `
            <tr>
              <td>Más ${formatearLinea(linea)}</td>
              ${columnas.map((columna) => `
                <td>${porcentajeTarjetasRojas(columna.partidos, linea, true)}</td>
              `).join("")}
            </tr>
            <tr>
              <td>Menos ${formatearLinea(linea)}</td>
              ${columnas.map((columna) => `
                <td>${porcentajeTarjetasRojas(columna.partidos, linea, false)}</td>
              `).join("")}
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}


// ============================================================
// AMBOS EQUIPOS RECIBEN TARJETAS
// ============================================================

function crearTablaAmbosEquiposTarjetas(
  resultado,
  nombreEquipoLocal,
  nombreEquipoVisitante,
  minimoTarjetas,
) {
  const columnas = obtenerColumnasHistoricasMercados(
    resultado,
    nombreEquipoLocal,
    nombreEquipoVisitante,
  );

  return `
    <div class="tabla-estadisticas-wrapper">

      <table class="tabla-estadisticas">

        <thead>
          <tr>
            <th>Mercado</th>

            ${crearEncabezadosColumnasMercados(columnas)}
          </tr>
        </thead>

        <tbody>

          <tr>
            <td>Sí</td>

            ${columnas.map((columna) => `
              <td>
                ${porcentajeAmbosEquiposTarjetas(
                  columna.partidos,
                  minimoTarjetas,
                  true,
                )}
              </td>
            `).join("")}
          </tr>

          <tr>
            <td>No</td>

            ${columnas.map((columna) => `
              <td>
                ${porcentajeAmbosEquiposTarjetas(
                  columna.partidos,
                  minimoTarjetas,
                  false,
                )}
              </td>
            `).join("")}
          </tr>

        </tbody>

      </table>

    </div>
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
// RANGOS DE TOTAL DE GOLES
// ============================================================

function crearTablaRangosTotalGoles(
  resultado,
  nombreEquipoLocal,
  nombreEquipoVisitante,
) {
  const rangos = [
    { etiqueta: "0-2", minimo: 0, maximo: 2 },
    { etiqueta: "0-3", minimo: 0, maximo: 3 },
    { etiqueta: "0-4", minimo: 0, maximo: 4 },
    { etiqueta: "1-2", minimo: 1, maximo: 2 },
    { etiqueta: "1-3", minimo: 1, maximo: 3 },
    { etiqueta: "1-4", minimo: 1, maximo: 4 },
    { etiqueta: "1-5", minimo: 1, maximo: 5 },
    { etiqueta: "2-4", minimo: 2, maximo: 4 },
    { etiqueta: "2-5", minimo: 2, maximo: 5 },
    { etiqueta: "2-6", minimo: 2, maximo: 6 },
    { etiqueta: "3-4", minimo: 3, maximo: 4 },
    { etiqueta: "3-5", minimo: 3, maximo: 5 },
    { etiqueta: "3-6", minimo: 3, maximo: 6 },
    { etiqueta: "5-6", minimo: 5, maximo: 6 },
  ];

  return crearTablaRangosGoles(
    resultado,
    nombreEquipoLocal,
    nombreEquipoVisitante,
    rangos,
  );
}


// ============================================================
// RANGOS EXTRA DE TOTAL DE GOLES
// ============================================================

function crearTablaRangosExtraTotalGoles(
  resultado,
  nombreEquipoLocal,
  nombreEquipoVisitante,
) {
  const rangos = [
    { etiqueta: "0-1", minimo: 0, maximo: 1 },
    { etiqueta: "2-3", minimo: 2, maximo: 3 },
    { etiqueta: "4-6", minimo: 4, maximo: 6 },
    { etiqueta: "7+", minimo: 7, maximo: null },
  ];

  return crearTablaRangosGoles(
    resultado,
    nombreEquipoLocal,
    nombreEquipoVisitante,
    rangos,
  );
}


// ============================================================
// TABLA REUTILIZABLE DE RANGOS DE GOLES
// ============================================================

function crearTablaRangosGoles(
  resultado,
  nombreEquipoLocal,
  nombreEquipoVisitante,
  rangos,
) {
  const columnas = obtenerColumnasHistoricasMercados(
    resultado,
    nombreEquipoLocal,
    nombreEquipoVisitante,
  );

  return `
    <div class="tabla-estadisticas-wrapper">

      <table class="tabla-estadisticas">

        <thead>
          <tr>
            <th>Mercado</th>

            ${crearEncabezadosColumnasMercados(columnas)}
          </tr>
        </thead>

        <tbody>

          ${rangos.map((rango) => `
            <tr>
              <td>${rango.etiqueta}</td>

              ${columnas.map((columna) => `
                <td>
                  ${porcentajeTotalGolesRango(
                    columna.partidos,
                    rango.minimo,
                    rango.maximo,
                  )}
                </td>
              `).join("")}
            </tr>
          `).join("")}

        </tbody>

      </table>

    </div>
  `;
}


// ============================================================
// TOTAL DE GOLES PAR / IMPAR
// ============================================================

function crearTablaParidadTotalGoles(
  resultado,
  nombreEquipoLocal,
  nombreEquipoVisitante,
) {
  const columnas = obtenerColumnasHistoricasMercados(
    resultado,
    nombreEquipoLocal,
    nombreEquipoVisitante,
  );

  return `
    <div class="tabla-estadisticas-wrapper">

      <table class="tabla-estadisticas">

        <thead>
          <tr>
            <th>Mercado</th>

            ${crearEncabezadosColumnasMercados(columnas)}
          </tr>
        </thead>

        <tbody>

          <tr>
            <td>Impar</td>

            ${columnas.map((columna) => `
              <td>${porcentajeTotalGolesParidad(columna.partidos, "impar")}</td>
            `).join("")}
          </tr>

          <tr>
            <td>Par</td>

            ${columnas.map((columna) => `
              <td>${porcentajeTotalGolesParidad(columna.partidos, "par")}</td>
            `).join("")}
          </tr>

        </tbody>

      </table>

    </div>
  `;
}


// ============================================================
// COLUMNAS ESTÁNDAR DE HISTORIAL PARA MERCADOS
// ============================================================

function obtenerColumnasHistoricasMercados(
  resultado,
  nombreEquipoLocal,
  nombreEquipoVisitante,
) {
  return [
    {
      partidos: resultado?.equipo_local?.partidos_general || [],
      nombre: nombreEquipoLocal,
      condicion: "General",
    },
    {
      partidos: resultado?.equipo_local?.partidos_local || [],
      nombre: nombreEquipoLocal,
      condicion: "Casa",
    },
    {
      partidos: resultado?.equipo_visitante?.partidos_visitante || [],
      nombre: nombreEquipoVisitante,
      condicion: "Fuera",
    },
    {
      partidos: resultado?.equipo_visitante?.partidos_general || [],
      nombre: nombreEquipoVisitante,
      condicion: "General",
    },
  ];
}


function crearEncabezadosColumnasMercados(columnas) {
  return columnas.map((columna) => `
    <th>
      ${escaparHTML(columna.nombre)}
      <br>
      ${columna.condicion}
    </th>
  `).join("");
}


// ============================================================
// PRÓXIMO GOL (GOL 1)
// ============================================================

function crearTablaProximoGol(
  resultado,
  nombreEquipoLocal,
  nombreEquipoVisitante,
) {
  const equipoLocalId =
    resultado?.equipo_local?.id;

  const equipoVisitanteId =
    resultado?.equipo_visitante?.id;

  const columnas = [
    {
      partidos: resultado?.equipo_local?.partidos_general || [],
      equipoId: equipoLocalId,
      nombre: nombreEquipoLocal,
      condicion: "General",
      resultadoLocal: "equipo",
      resultadoVisitante: "rival",
    },
    {
      partidos: resultado?.equipo_local?.partidos_local || [],
      equipoId: equipoLocalId,
      nombre: nombreEquipoLocal,
      condicion: "Casa",
      resultadoLocal: "equipo",
      resultadoVisitante: "rival",
    },
    {
      partidos: resultado?.equipo_visitante?.partidos_visitante || [],
      equipoId: equipoVisitanteId,
      nombre: nombreEquipoVisitante,
      condicion: "Fuera",
      resultadoLocal: "rival",
      resultadoVisitante: "equipo",
    },
    {
      partidos: resultado?.equipo_visitante?.partidos_general || [],
      equipoId: equipoVisitanteId,
      nombre: nombreEquipoVisitante,
      condicion: "General",
      resultadoLocal: "rival",
      resultadoVisitante: "equipo",
    },
  ];

  const crearFila = (etiqueta, tipoResultado) => `
    <tr>
      <td>${escaparHTML(etiqueta)}</td>

      ${columnas.map((columna) => `
        <td>
          ${porcentajeProximoGol(
            columna.partidos,
            columna.equipoId,
            tipoResultado === "sin_goles"
              ? "sin_goles"
              : columna[tipoResultado],
          )}
        </td>
      `).join("")}
    </tr>
  `;

  return `
    <div class="tabla-estadisticas-wrapper">

      <table class="tabla-estadisticas">

        <thead>
          <tr>
            <th>Mercado</th>

            ${columnas.map((columna) => `
              <th>
                ${escaparHTML(columna.nombre)}
                <br>
                ${columna.condicion}
              </th>
            `).join("")}
          </tr>
        </thead>

        <tbody>
          ${crearFila(nombreEquipoLocal, "resultadoLocal")}
          ${crearFila("Sin goles", "sin_goles")}
          ${crearFila(nombreEquipoVisitante, "resultadoVisitante")}
        </tbody>

      </table>

    </div>
  `;
}


// ============================================================
// MARCADOR CORRECTO
// ============================================================

function crearTablaMarcadorCorrecto(
  resultado,
  nombreEquipoLocal,
  nombreEquipoVisitante,
  seccion,
) {
  const equipoLocalId =
    resultado?.equipo_local?.id;

  const equipoVisitanteId =
    resultado?.equipo_visitante?.id;

  const columnas = [
    {
      partidos: resultado?.equipo_local?.partidos_general || [],
      equipoId: equipoLocalId,
      nombre: nombreEquipoLocal,
      condicion: "General",
      invertirMarcador: false,
    },
    {
      partidos: resultado?.equipo_local?.partidos_local || [],
      equipoId: equipoLocalId,
      nombre: nombreEquipoLocal,
      condicion: "Casa",
      invertirMarcador: false,
    },
    {
      partidos: resultado?.equipo_visitante?.partidos_visitante || [],
      equipoId: equipoVisitanteId,
      nombre: nombreEquipoVisitante,
      condicion: "Fuera",
      invertirMarcador: true,
    },
    {
      partidos: resultado?.equipo_visitante?.partidos_general || [],
      equipoId: equipoVisitanteId,
      nombre: nombreEquipoVisitante,
      condicion: "General",
      invertirMarcador: true,
    },
  ];

  const marcadores = obtenerMarcadoresCorrectos(seccion);

  return `
    <div class="tabla-estadisticas-wrapper">

      <table class="tabla-estadisticas">

        <thead>
          <tr>
            <th>Marcador</th>

            ${columnas.map((columna) => `
              <th>
                ${escaparHTML(columna.nombre)}
                <br>
                ${columna.condicion}
              </th>
            `).join("")}
          </tr>
        </thead>

        <tbody>

          ${marcadores.map((marcador) => `
            <tr>
              <td>${marcador.local}-${marcador.visitante}</td>

              ${columnas.map((columna) => `
                <td>
                  ${porcentajeMarcadorCorrecto(
                    columna.partidos,
                    columna.equipoId,
                    columna.invertirMarcador
                      ? marcador.visitante
                      : marcador.local,
                    columna.invertirMarcador
                      ? marcador.local
                      : marcador.visitante,
                  )}
                </td>
              `).join("")}
            </tr>
          `).join("")}

        </tbody>

      </table>

    </div>
  `;
}


function obtenerMarcadoresCorrectos(seccion) {
  const marcadores = [];

  if (seccion === "local") {
    for (let golesLocal = 1; golesLocal <= 6; golesLocal += 1) {
      for (
        let golesVisitante = 0;
        golesVisitante < golesLocal;
        golesVisitante += 1
      ) {
        marcadores.push({
          local: golesLocal,
          visitante: golesVisitante,
        });
      }
    }
  }

  if (seccion === "empate") {
    for (let goles = 0; goles <= 6; goles += 1) {
      marcadores.push({
        local: goles,
        visitante: goles,
      });
    }
  }

  if (seccion === "visitante") {
    for (let golesLocal = 0; golesLocal <= 5; golesLocal += 1) {
      for (
        let golesVisitante = golesLocal + 1;
        golesVisitante <= 6;
        golesVisitante += 1
      ) {
        marcadores.push({
          local: golesLocal,
          visitante: golesVisitante,
        });
      }
    }
  }

  return marcadores;
}


// ============================================================
// DOBLE OPORTUNIDAD / AMBOS EQUIPOS ANOTAN
// ============================================================

function crearTablaDobleOportunidadAmbosAnotan(
  resultado,
  nombreEquipoLocal,
  nombreEquipoVisitante,
) {
  const equipoLocalId =
    resultado?.equipo_local?.id;

  const equipoVisitanteId =
    resultado?.equipo_visitante?.id;

  const columnas = [
    {
      partidos: resultado?.equipo_local?.partidos_general || [],
      equipoId: equipoLocalId,
      nombre: nombreEquipoLocal,
      condicion: "General",
      localOEmpate: ["victoria", "empate"],
      visitanteOEmpate: ["derrota", "empate"],
    },
    {
      partidos: resultado?.equipo_local?.partidos_local || [],
      equipoId: equipoLocalId,
      nombre: nombreEquipoLocal,
      condicion: "Casa",
      localOEmpate: ["victoria", "empate"],
      visitanteOEmpate: ["derrota", "empate"],
    },
    {
      partidos: resultado?.equipo_visitante?.partidos_visitante || [],
      equipoId: equipoVisitanteId,
      nombre: nombreEquipoVisitante,
      condicion: "Fuera",
      localOEmpate: ["derrota", "empate"],
      visitanteOEmpate: ["victoria", "empate"],
    },
    {
      partidos: resultado?.equipo_visitante?.partidos_general || [],
      equipoId: equipoVisitanteId,
      nombre: nombreEquipoVisitante,
      condicion: "General",
      localOEmpate: ["derrota", "empate"],
      visitanteOEmpate: ["victoria", "empate"],
    },
  ];

  const opciones = [
    {
      etiqueta: `${nombreEquipoLocal} o ${nombreEquipoVisitante}`,
      resultados: ["victoria", "derrota"],
    },
    {
      etiqueta: `${nombreEquipoLocal} o Empate`,
      resultados: "localOEmpate",
    },
    {
      etiqueta: `${nombreEquipoVisitante} o Empate`,
      resultados: "visitanteOEmpate",
    },
  ];

  const crearFila = (opcion, ambosAnotan) => `
    <tr>
      <td>
        ${escaparHTML(opcion.etiqueta)} y
        ${ambosAnotan ? "Sí" : "No"}
      </td>

      ${columnas.map((columna) => `
        <td>
          ${porcentajeDobleOportunidadAmbosAnotan(
            columna.partidos,
            columna.equipoId,
            Array.isArray(opcion.resultados)
              ? opcion.resultados
              : columna[opcion.resultados],
            ambosAnotan,
          )}
        </td>
      `).join("")}
    </tr>
  `;

  return `
    <div class="tabla-estadisticas-wrapper">

      <table class="tabla-estadisticas">

        <thead>
          <tr>
            <th>Mercado</th>

            ${columnas.map((columna) => `
              <th>
                ${escaparHTML(columna.nombre)}
                <br>
                ${columna.condicion}
              </th>
            `).join("")}
          </tr>
        </thead>

        <tbody>

          ${opciones.map((opcion) => `
            ${crearFila(opcion, true)}
            ${crearFila(opcion, false)}
          `).join("")}

        </tbody>

      </table>

    </div>
  `;
}


// ============================================================
// DOBLE OPORTUNIDAD CON MÁS / MENOS
// ============================================================

function crearTablaDobleOportunidadMasMenos(
  resultado,
  nombreEquipoLocal,
  nombreEquipoVisitante,
) {
  const equipoLocalId =
    resultado?.equipo_local?.id;

  const equipoVisitanteId =
    resultado?.equipo_visitante?.id;

  const columnas = [
    {
      partidos: resultado?.equipo_local?.partidos_general || [],
      equipoId: equipoLocalId,
      nombre: nombreEquipoLocal,
      condicion: "General",
      localOEmpate: ["victoria", "empate"],
      visitanteOEmpate: ["derrota", "empate"],
    },
    {
      partidos: resultado?.equipo_local?.partidos_local || [],
      equipoId: equipoLocalId,
      nombre: nombreEquipoLocal,
      condicion: "Casa",
      localOEmpate: ["victoria", "empate"],
      visitanteOEmpate: ["derrota", "empate"],
    },
    {
      partidos: resultado?.equipo_visitante?.partidos_visitante || [],
      equipoId: equipoVisitanteId,
      nombre: nombreEquipoVisitante,
      condicion: "Fuera",
      localOEmpate: ["derrota", "empate"],
      visitanteOEmpate: ["victoria", "empate"],
    },
    {
      partidos: resultado?.equipo_visitante?.partidos_general || [],
      equipoId: equipoVisitanteId,
      nombre: nombreEquipoVisitante,
      condicion: "General",
      localOEmpate: ["derrota", "empate"],
      visitanteOEmpate: ["victoria", "empate"],
    },
  ];

  const lineas = [];

  for (let linea = 0.5; linea <= 6.5; linea += 1) {
    lineas.push(linea);
  }

  const opciones = [
    {
      etiqueta: `${nombreEquipoLocal} o ${nombreEquipoVisitante}`,
      resultados: ["victoria", "derrota"],
    },
    {
      etiqueta: `${nombreEquipoLocal} o Empate`,
      resultados: "localOEmpate",
    },
    {
      etiqueta: `${nombreEquipoVisitante} o Empate`,
      resultados: "visitanteOEmpate",
    },
  ];

  const crearFila = (opcion, esMas, linea) => `
    <tr>
      <td>
        ${escaparHTML(opcion.etiqueta)} y ${esMas ? "Más" : "Menos"}
        ${formatearLinea(linea)}
      </td>

      ${columnas.map((columna) => `
        <td>
          ${porcentajeDobleOportunidadMasMenos(
            columna.partidos,
            columna.equipoId,
            Array.isArray(opcion.resultados)
              ? opcion.resultados
              : columna[opcion.resultados],
            linea,
            esMas,
          )}
        </td>
      `).join("")}
    </tr>
  `;

  return `
    <div class="tabla-estadisticas-wrapper">

      <table class="tabla-estadisticas">

        <thead>
          <tr>
            <th>Mercado</th>

            ${columnas.map((columna) => `
              <th>
                ${escaparHTML(columna.nombre)}
                <br>
                ${columna.condicion}
              </th>
            `).join("")}
          </tr>
        </thead>

        <tbody>

          ${lineas.map((linea) => opciones.map((opcion) => `
            ${crearFila(opcion, true, linea)}
            ${crearFila(opcion, false, linea)}
          `).join("")).join("")}

        </tbody>

      </table>

    </div>
  `;
}


// ============================================================
// RESULTADO DEL PARTIDO Y/O AMBOS EQUIPOS ANOTAN
// ============================================================

function crearTablaResultadoAmbosAnotan(
  resultado,
  nombreEquipoLocal,
  nombreEquipoVisitante,
  operador,
) {
  const equipoLocalId =
    resultado?.equipo_local?.id;

  const equipoVisitanteId =
    resultado?.equipo_visitante?.id;

  const columnas = [
    {
      partidos: resultado?.equipo_local?.partidos_general || [],
      equipoId: equipoLocalId,
      nombre: nombreEquipoLocal,
      condicion: "General",
      resultadoLocal: "victoria",
      resultadoVisitante: "derrota",
      resultadoEmpate: "empate",
    },
    {
      partidos: resultado?.equipo_local?.partidos_local || [],
      equipoId: equipoLocalId,
      nombre: nombreEquipoLocal,
      condicion: "Casa",
      resultadoLocal: "victoria",
      resultadoVisitante: "derrota",
      resultadoEmpate: "empate",
    },
    {
      partidos: resultado?.equipo_visitante?.partidos_visitante || [],
      equipoId: equipoVisitanteId,
      nombre: nombreEquipoVisitante,
      condicion: "Fuera",
      resultadoLocal: "derrota",
      resultadoVisitante: "victoria",
      resultadoEmpate: "empate",
    },
    {
      partidos: resultado?.equipo_visitante?.partidos_general || [],
      equipoId: equipoVisitanteId,
      nombre: nombreEquipoVisitante,
      condicion: "General",
      resultadoLocal: "derrota",
      resultadoVisitante: "victoria",
      resultadoEmpate: "empate",
    },
  ];

  const separador = operador === "y" ? "/" : "o";

  const crearFila = (etiqueta, tipoResultado, ambosAnotan) => `
    <tr>
      <td>
        ${escaparHTML(etiqueta)} ${separador}
        ${ambosAnotan ? "Sí" : "No"}
      </td>

      ${columnas.map((columna) => `
        <td>
          ${porcentajeResultadoAmbosAnotan(
            columna.partidos,
            columna.equipoId,
            columna[tipoResultado],
            ambosAnotan,
            operador,
          )}
        </td>
      `).join("")}
    </tr>
  `;

  return `
    <div class="tabla-estadisticas-wrapper">

      <table class="tabla-estadisticas">

        <thead>
          <tr>
            <th>Mercado</th>

            ${columnas.map((columna) => `
              <th>
                ${escaparHTML(columna.nombre)}
                <br>
                ${columna.condicion}
              </th>
            `).join("")}
          </tr>
        </thead>

        <tbody>
          ${crearFila(nombreEquipoLocal, "resultadoLocal", true)}
          ${crearFila(nombreEquipoLocal, "resultadoLocal", false)}
          ${crearFila("Empate", "resultadoEmpate", true)}
          ${crearFila("Empate", "resultadoEmpate", false)}
          ${crearFila(nombreEquipoVisitante, "resultadoVisitante", true)}
          ${crearFila(nombreEquipoVisitante, "resultadoVisitante", false)}
        </tbody>

      </table>

    </div>
  `;
}


// ============================================================
// RESULTADO DEL PARTIDO O GOLES TOTALES MÁS / MENOS
// ============================================================

function crearTablaResultadoOGolesTotales(
  resultado,
  nombreEquipoLocal,
  nombreEquipoVisitante,
) {
  const equipoLocalId =
    resultado?.equipo_local?.id;

  const equipoVisitanteId =
    resultado?.equipo_visitante?.id;

  const columnas = [
    {
      partidos: resultado?.equipo_local?.partidos_general || [],
      equipoId: equipoLocalId,
      nombre: nombreEquipoLocal,
      condicion: "General",
      resultadoLocal: "victoria",
      resultadoVisitante: "derrota",
      resultadoEmpate: "empate",
    },
    {
      partidos: resultado?.equipo_local?.partidos_local || [],
      equipoId: equipoLocalId,
      nombre: nombreEquipoLocal,
      condicion: "Casa",
      resultadoLocal: "victoria",
      resultadoVisitante: "derrota",
      resultadoEmpate: "empate",
    },
    {
      partidos: resultado?.equipo_visitante?.partidos_visitante || [],
      equipoId: equipoVisitanteId,
      nombre: nombreEquipoVisitante,
      condicion: "Fuera",
      resultadoLocal: "derrota",
      resultadoVisitante: "victoria",
      resultadoEmpate: "empate",
    },
    {
      partidos: resultado?.equipo_visitante?.partidos_general || [],
      equipoId: equipoVisitanteId,
      nombre: nombreEquipoVisitante,
      condicion: "General",
      resultadoLocal: "derrota",
      resultadoVisitante: "victoria",
      resultadoEmpate: "empate",
    },
  ];

  const lineas = [];

  for (let linea = 0.5; linea <= 6.5; linea += 1) {
    lineas.push(linea);
  }

  const crearFila = (etiqueta, tipoResultado, esMas, linea) => `
    <tr>
      <td>
        ${escaparHTML(etiqueta)} o ${esMas ? "Más" : "Menos"}
        ${formatearLinea(linea)}
      </td>

      ${columnas.map((columna) => `
        <td>
          ${porcentajeResultadoOGolesTotales(
            columna.partidos,
            columna.equipoId,
            columna[tipoResultado],
            linea,
            esMas,
          )}
        </td>
      `).join("")}
    </tr>
  `;

  return `
    <div class="tabla-estadisticas-wrapper">

      <table class="tabla-estadisticas">

        <thead>
          <tr>
            <th>Mercado</th>

            ${columnas.map((columna) => `
              <th>
                ${escaparHTML(columna.nombre)}
                <br>
                ${columna.condicion}
              </th>
            `).join("")}
          </tr>
        </thead>

        <tbody>

          ${lineas.map((linea) => `
            ${crearFila(nombreEquipoLocal, "resultadoLocal", true, linea)}
            ${crearFila(nombreEquipoLocal, "resultadoLocal", false, linea)}
            ${crearFila("Empate", "resultadoEmpate", true, linea)}
            ${crearFila("Empate", "resultadoEmpate", false, linea)}
            ${crearFila(nombreEquipoVisitante, "resultadoVisitante", true, linea)}
            ${crearFila(nombreEquipoVisitante, "resultadoVisitante", false, linea)}
          `).join("")}

        </tbody>

      </table>

    </div>
  `;
}


// ============================================================
// RESULTADO DEL PARTIDO CON MÁS / MENOS
// ============================================================

function crearTablaResultadoMasMenos(
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

  const columnas = [
    {
      partidos: partidosLocalGeneral,
      equipoId: equipoLocalId,
      nombre: nombreEquipoLocal,
      condicion: "General",
      resultadoLocal: "victoria",
      resultadoVisitante: "derrota",
      resultadoEmpate: "empate",
    },
    {
      partidos: partidosLocalCasa,
      equipoId: equipoLocalId,
      nombre: nombreEquipoLocal,
      condicion: "Casa",
      resultadoLocal: "victoria",
      resultadoVisitante: "derrota",
      resultadoEmpate: "empate",
    },
    {
      partidos: partidosVisitanteFuera,
      equipoId: equipoVisitanteId,
      nombre: nombreEquipoVisitante,
      condicion: "Fuera",
      resultadoLocal: "derrota",
      resultadoVisitante: "victoria",
      resultadoEmpate: "empate",
    },
    {
      partidos: partidosVisitanteGeneral,
      equipoId: equipoVisitanteId,
      nombre: nombreEquipoVisitante,
      condicion: "General",
      resultadoLocal: "derrota",
      resultadoVisitante: "victoria",
      resultadoEmpate: "empate",
    },
  ];

  const crearFila = (etiqueta, tipoResultado, esMas, linea) => `
    <tr>
      <td>
        ${escaparHTML(etiqueta)} y ${esMas ? "Más" : "Menos"}
        ${formatearLinea(linea)}
      </td>

      ${columnas.map((columna) => `
        <td>
          ${porcentajeResultadoMasMenos(
            columna.partidos,
            columna.equipoId,
            columna[tipoResultado],
            linea,
            esMas,
          )}
        </td>
      `).join("")}
    </tr>
  `;

  return `
    <div class="tabla-estadisticas-wrapper">

      <table class="tabla-estadisticas">

        <thead>
          <tr>
            <th>Mercado</th>

            ${columnas.map((columna) => `
              <th>
                ${escaparHTML(columna.nombre)}
                <br>
                ${columna.condicion}
              </th>
            `).join("")}
          </tr>
        </thead>

        <tbody>

          ${lineas.map((linea) => `
            ${crearFila(nombreEquipoLocal, "resultadoLocal", true, linea)}
            ${crearFila(nombreEquipoLocal, "resultadoLocal", false, linea)}
            ${crearFila(nombreEquipoVisitante, "resultadoVisitante", true, linea)}
            ${crearFila(nombreEquipoVisitante, "resultadoVisitante", false, linea)}
            ${crearFila("Empate", "resultadoEmpate", true, linea)}
            ${crearFila("Empate", "resultadoEmpate", false, linea)}
          `).join("")}

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
// CALCULAR RESULTADO DEL PARTIDO CON MÁS / MENOS
// ============================================================

function porcentajeResultadoMasMenos(
  partidos,
  equipoId,
  resultadoEsperado,
  linea,
  esMas,
) {
  if (!Array.isArray(partidos) || partidos.length === 0) {
    return "N/D";
  }

  let validos = 0;
  let acertados = 0;

  partidos.forEach((partido) => {
    const golesEquipo =
      obtenerGolesEquipo(
        partido,
        equipoId
      );

    const golesRival =
      obtenerGolesRecibidosEquipo(
        partido,
        equipoId
      );

    if (
      !Number.isFinite(golesEquipo) ||
      !Number.isFinite(golesRival)
    ) {
      return;
    }

    validos += 1;

    const resultado = golesEquipo > golesRival
      ? "victoria"
      : golesEquipo < golesRival
        ? "derrota"
        : "empate";

    const total = golesEquipo + golesRival;
    const cumpleLinea = esMas
      ? total > linea
      : total < linea;

    if (
      resultado === resultadoEsperado &&
      cumpleLinea
    ) {
      acertados += 1;
    }
  });

  return porcentajeMercado(
    acertados,
    validos
  );
}


// ============================================================
// CALCULAR DOBLE OPORTUNIDAD CON MÁS / MENOS
// ============================================================

function porcentajeDobleOportunidadMasMenos(
  partidos,
  equipoId,
  resultadosEsperados,
  linea,
  esMas,
) {
  if (!Array.isArray(partidos) || partidos.length === 0) {
    return "N/D";
  }

  let validos = 0;
  let acertados = 0;

  partidos.forEach((partido) => {
    const golesEquipo =
      obtenerGolesEquipo(
        partido,
        equipoId
      );

    const golesRival =
      obtenerGolesRecibidosEquipo(
        partido,
        equipoId
      );

    if (
      !Number.isFinite(golesEquipo) ||
      !Number.isFinite(golesRival)
    ) {
      return;
    }

    validos += 1;

    const resultado = golesEquipo > golesRival
      ? "victoria"
      : golesEquipo < golesRival
        ? "derrota"
        : "empate";

    const total = golesEquipo + golesRival;
    const cumpleLinea = esMas
      ? total > linea
      : total < linea;

    if (
      resultadosEsperados.includes(resultado) &&
      cumpleLinea
    ) {
      acertados += 1;
    }
  });

  return porcentajeMercado(
    acertados,
    validos
  );
}


// ============================================================
// CALCULAR DOBLE OPORTUNIDAD Y AMBOS EQUIPOS ANOTAN
// ============================================================

function porcentajeDobleOportunidadAmbosAnotan(
  partidos,
  equipoId,
  resultadosEsperados,
  ambosAnotanEsperado,
) {
  if (!Array.isArray(partidos) || partidos.length === 0) {
    return "N/D";
  }

  let validos = 0;
  let acertados = 0;

  partidos.forEach((partido) => {
    const golesEquipo =
      obtenerGolesEquipo(
        partido,
        equipoId
      );

    const golesRival =
      obtenerGolesRecibidosEquipo(
        partido,
        equipoId
      );

    if (
      !Number.isFinite(golesEquipo) ||
      !Number.isFinite(golesRival)
    ) {
      return;
    }

    validos += 1;

    const resultado = golesEquipo > golesRival
      ? "victoria"
      : golesEquipo < golesRival
        ? "derrota"
        : "empate";

    const anotaronAmbos =
      golesEquipo > 0 && golesRival > 0;

    if (
      resultadosEsperados.includes(resultado) &&
      anotaronAmbos === ambosAnotanEsperado
    ) {
      acertados += 1;
    }
  });

  return porcentajeMercado(
    acertados,
    validos
  );
}


// ============================================================
// CALCULAR RESULTADO DEL PARTIDO Y/O AMBOS EQUIPOS ANOTAN
// ============================================================

function porcentajeResultadoAmbosAnotan(
  partidos,
  equipoId,
  resultadoEsperado,
  ambosAnotanEsperado,
  operador,
) {
  if (!Array.isArray(partidos) || partidos.length === 0) {
    return "N/D";
  }

  let validos = 0;
  let acertados = 0;

  partidos.forEach((partido) => {
    const golesEquipo =
      obtenerGolesEquipo(
        partido,
        equipoId
      );

    const golesRival =
      obtenerGolesRecibidosEquipo(
        partido,
        equipoId
      );

    if (
      !Number.isFinite(golesEquipo) ||
      !Number.isFinite(golesRival)
    ) {
      return;
    }

    validos += 1;

    const resultado = golesEquipo > golesRival
      ? "victoria"
      : golesEquipo < golesRival
        ? "derrota"
        : "empate";

    const anotaronAmbos =
      golesEquipo > 0 && golesRival > 0;

    const cumpleResultado =
      resultado === resultadoEsperado;

    const cumpleAmbosAnotan =
      anotaronAmbos === ambosAnotanEsperado;

    const cumpleMercado = operador === "y"
      ? cumpleResultado && cumpleAmbosAnotan
      : cumpleResultado || cumpleAmbosAnotan;

    if (cumpleMercado) {
      acertados += 1;
    }
  });

  return porcentajeMercado(
    acertados,
    validos
  );
}


// ============================================================
// CALCULAR PORCENTAJE DE PRÓXIMO GOL
// ============================================================

function porcentajeProximoGol(
  partidos,
  equipoId,
  resultadoEsperado,
) {
  if (!Array.isArray(partidos) || partidos.length === 0) {
    return "N/D";
  }

  let validos = 0;
  let acertados = 0;

  partidos.forEach((partido) => {
    const estado =
      obtenerEstadoPrimerGol(
        partido,
        equipoId
      );

    if (estado === null) {
      return;
    }

    validos += 1;

    if (estado === resultadoEsperado) {
      acertados += 1;
    }
  });

  return porcentajeMercado(
    acertados,
    validos
  );
}


// ============================================================
// CALCULAR RESULTADO DEL PARTIDO O GOLES TOTALES
// ============================================================

function porcentajeResultadoOGolesTotales(
  partidos,
  equipoId,
  resultadoEsperado,
  linea,
  esMas,
) {
  if (!Array.isArray(partidos) || partidos.length === 0) {
    return "N/D";
  }

  let validos = 0;
  let acertados = 0;

  partidos.forEach((partido) => {
    const golesEquipo =
      obtenerGolesEquipo(
        partido,
        equipoId
      );

    const golesRival =
      obtenerGolesRecibidosEquipo(
        partido,
        equipoId
      );

    if (
      !Number.isFinite(golesEquipo) ||
      !Number.isFinite(golesRival)
    ) {
      return;
    }

    validos += 1;

    const resultado = golesEquipo > golesRival
      ? "victoria"
      : golesEquipo < golesRival
        ? "derrota"
        : "empate";

    const total = golesEquipo + golesRival;
    const cumpleLinea = esMas
      ? total > linea
      : total < linea;

    if (
      resultado === resultadoEsperado ||
      cumpleLinea
    ) {
      acertados += 1;
    }
  });

  return porcentajeMercado(
    acertados,
    validos
  );
}


// ============================================================
// AMBOS EQUIPOS ANOTAN
// ============================================================

function crearTablaAmbosAnotan(
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

          <tr>
            <td>Sí</td>

            <td>${porcentajeAmbosAnotan(partidosLocalGeneral, true)}</td>
            <td>${porcentajeAmbosAnotan(partidosLocalCasa, true)}</td>
            <td>${porcentajeAmbosAnotan(partidosVisitanteFuera, true)}</td>
            <td>${porcentajeAmbosAnotan(partidosVisitanteGeneral, true)}</td>
          </tr>

          <tr>
            <td>No</td>

            <td>${porcentajeAmbosAnotan(partidosLocalGeneral, false)}</td>
            <td>${porcentajeAmbosAnotan(partidosLocalCasa, false)}</td>
            <td>${porcentajeAmbosAnotan(partidosVisitanteFuera, false)}</td>
            <td>${porcentajeAmbosAnotan(partidosVisitanteGeneral, false)}</td>
          </tr>

        </tbody>

      </table>

    </div>
  `;
}


// ============================================================
// AMBOS EQUIPOS ANOTAN Y MÁS / MENOS
// ============================================================

function crearTablaAmbosAnotanMasMenos(
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

  const columnas = [
    {
      partidos: partidosLocalGeneral,
      nombre: nombreEquipoLocal,
      condicion: "General",
    },
    {
      partidos: partidosLocalCasa,
      nombre: nombreEquipoLocal,
      condicion: "Casa",
    },
    {
      partidos: partidosVisitanteFuera,
      nombre: nombreEquipoVisitante,
      condicion: "Fuera",
    },
    {
      partidos: partidosVisitanteGeneral,
      nombre: nombreEquipoVisitante,
      condicion: "General",
    },
  ];

  const lineas = [];

  for (let linea = 2.5; linea <= 6.5; linea += 1) {
    lineas.push(linea);
  }

  const crearFila = (ambosAnotan, esMas, linea) => `
    <tr>
      <td>
        ${ambosAnotan ? "Sí" : "No"} y
        ${esMas ? "Más" : "Menos"} ${formatearLinea(linea)}
      </td>

      ${columnas.map((columna) => `
        <td>
          ${porcentajeAmbosAnotanMasMenos(
            columna.partidos,
            ambosAnotan,
            linea,
            esMas,
          )}
        </td>
      `).join("")}
    </tr>
  `;

  return `
    <div class="tabla-estadisticas-wrapper">

      <table class="tabla-estadisticas">

        <thead>
          <tr>
            <th>Mercado</th>

            ${columnas.map((columna) => `
              <th>
                ${escaparHTML(columna.nombre)}
                <br>
                ${columna.condicion}
              </th>
            `).join("")}
          </tr>
        </thead>

        <tbody>

          ${lineas.map((linea) => `
            ${crearFila(true, true, linea)}
            ${crearFila(false, true, linea)}
            ${crearFila(true, false, linea)}
            ${crearFila(false, false, linea)}
          `).join("")}

        </tbody>

      </table>

    </div>
  `;
}


// ============================================================
// TOTAL DE GOLES DE UN EQUIPO
// ============================================================

function crearTablaTotalGolesEquipo(
  resultado,
  nombreEquipoLocal,
  nombreEquipoVisitante,
  equipoObjetivo,
) {
  const equipoLocalId =
    resultado?.equipo_local?.id;

  const equipoVisitanteId =
    resultado?.equipo_visitante?.id;

  const esLocal = equipoObjetivo === "local";

  const columnas = esLocal
    ? [
        {
          partidos: resultado?.equipo_local?.partidos_general || [],
          equipoId: equipoLocalId,
          nombre: nombreEquipoLocal,
          condicion: "General · Marcados",
          tipo: "marcados",
        },
        {
          partidos: resultado?.equipo_local?.partidos_local || [],
          equipoId: equipoLocalId,
          nombre: nombreEquipoLocal,
          condicion: "Casa · Marcados",
          tipo: "marcados",
        },
        {
          partidos: resultado?.equipo_visitante?.partidos_visitante || [],
          equipoId: equipoVisitanteId,
          nombre: nombreEquipoVisitante,
          condicion: "Fuera · Recibidos",
          tipo: "recibidos",
        },
        {
          partidos: resultado?.equipo_visitante?.partidos_general || [],
          equipoId: equipoVisitanteId,
          nombre: nombreEquipoVisitante,
          condicion: "General · Recibidos",
          tipo: "recibidos",
        },
      ]
    : [
        {
          partidos: resultado?.equipo_visitante?.partidos_general || [],
          equipoId: equipoVisitanteId,
          nombre: nombreEquipoVisitante,
          condicion: "General · Marcados",
          tipo: "marcados",
        },
        {
          partidos: resultado?.equipo_visitante?.partidos_visitante || [],
          equipoId: equipoVisitanteId,
          nombre: nombreEquipoVisitante,
          condicion: "Fuera · Marcados",
          tipo: "marcados",
        },
        {
          partidos: resultado?.equipo_local?.partidos_local || [],
          equipoId: equipoLocalId,
          nombre: nombreEquipoLocal,
          condicion: "Casa · Recibidos",
          tipo: "recibidos",
        },
        {
          partidos: resultado?.equipo_local?.partidos_general || [],
          equipoId: equipoLocalId,
          nombre: nombreEquipoLocal,
          condicion: "General · Recibidos",
          tipo: "recibidos",
        },
      ];

  const totales = [
    { etiqueta: "0", minimo: 0, maximo: 0 },
    { etiqueta: "1", minimo: 1, maximo: 1 },
    { etiqueta: "2", minimo: 2, maximo: 2 },
    { etiqueta: "3", minimo: 3, maximo: 3 },
    { etiqueta: "4+", minimo: 4, maximo: null },
  ];

  return `
    <div class="tabla-estadisticas-wrapper">

      <table class="tabla-estadisticas">

        <thead>
          <tr>
            <th>Goles</th>

            ${columnas.map((columna) => `
              <th>
                ${escaparHTML(columna.nombre)}
                <br>
                ${columna.condicion}
              </th>
            `).join("")}
          </tr>
        </thead>

        <tbody>

          ${totales.map((total) => `
            <tr>
              <td>${total.etiqueta}</td>

              ${columnas.map((columna) => `
                <td>
                  ${porcentajeGolesEquipoRango(
                    columna.partidos,
                    columna.equipoId,
                    columna.tipo,
                    total.minimo,
                    total.maximo,
                  )}
                </td>
              `).join("")}
            </tr>
          `).join("")}

        </tbody>

      </table>

    </div>
  `;
}


// ============================================================
// AMBOS EQUIPOS ANOTAN O MÁS DE GOLES
// ============================================================

function crearTablaAmbosAnotanOMasGoles(
  resultado,
  nombreEquipoLocal,
  nombreEquipoVisitante,
) {
  const columnas = [
    {
      partidos: resultado?.equipo_local?.partidos_general || [],
      nombre: nombreEquipoLocal,
      condicion: "General",
    },
    {
      partidos: resultado?.equipo_local?.partidos_local || [],
      nombre: nombreEquipoLocal,
      condicion: "Casa",
    },
    {
      partidos: resultado?.equipo_visitante?.partidos_visitante || [],
      nombre: nombreEquipoVisitante,
      condicion: "Fuera",
    },
    {
      partidos: resultado?.equipo_visitante?.partidos_general || [],
      nombre: nombreEquipoVisitante,
      condicion: "General",
    },
  ];

  const lineas = [];

  for (let linea = 2.5; linea <= 6.5; linea += 1) {
    lineas.push(linea);
  }

  const crearFila = (cumpleMercado, linea) => `
    <tr>
      <td>
        ${cumpleMercado ? "Sí" : "No"}
      </td>

      ${columnas.map((columna) => `
        <td>
          ${porcentajeAmbosAnotanOMasGoles(
            columna.partidos,
            linea,
            cumpleMercado,
          )}
        </td>
      `).join("")}
    </tr>
  `;

  return `
    <div class="tabla-estadisticas-wrapper">

      <table class="tabla-estadisticas">

        <thead>
          <tr>
            <th>Mercado</th>

            ${columnas.map((columna) => `
              <th>
                ${escaparHTML(columna.nombre)}
                <br>
                ${columna.condicion}
              </th>
            `).join("")}
          </tr>
        </thead>

        <tbody>

          ${lineas.map((linea) => `
            <tr>
              <td colspan="5">
                Ambos equipos anotan o Más de ${formatearLinea(linea)}
              </td>
            </tr>
            ${crearFila(true, linea)}
            ${crearFila(false, linea)}
          `).join("")}

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
              Fuera
              <br>
              Recibidos
            </th>

            <th>
              ${escaparHTML(nombreEquipoVisitante)}
              <br>
              General
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
              Casa
              <br>
              Recibidos
            </th>

            <th>
              ${escaparHTML(nombreEquipoLocal)}
              <br>
              General
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
                  ${masLocalCasa}
                </td>

                <td>
                  ${masLocalGeneral}
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
                  ${menosLocalCasa}
                </td>

                <td>
                  ${menosLocalGeneral}
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
// CALCULAR PORCENTAJE DE AMBOS EQUIPOS ANOTAN
// ============================================================

function porcentajeAmbosAnotan(
  partidos,
  ambosAnotan,
) {
  if (!Array.isArray(partidos) || partidos.length === 0) {
    return "N/D";
  }

  let validos = 0;
  let acertados = 0;

  partidos.forEach((partido) => {
    const golesLocal = Number(partido?.marcador_local);
    const golesVisitante = Number(partido?.marcador_visitante);

    if (
      !Number.isFinite(golesLocal) ||
      !Number.isFinite(golesVisitante)
    ) {
      return;
    }

    validos += 1;

    const anotaronAmbos =
      golesLocal > 0 && golesVisitante > 0;

    if (anotaronAmbos === ambosAnotan) {
      acertados += 1;
    }
  });

  return porcentajeMercado(
    acertados,
    validos
  );
}


// ============================================================
// CALCULAR AMBOS ANOTAN CON MÁS / MENOS
// ============================================================

function porcentajeAmbosAnotanMasMenos(
  partidos,
  ambosAnotan,
  linea,
  esMas,
) {
  if (!Array.isArray(partidos) || partidos.length === 0) {
    return "N/D";
  }

  let validos = 0;
  let acertados = 0;

  partidos.forEach((partido) => {
    const golesLocal = Number(partido?.marcador_local);
    const golesVisitante = Number(partido?.marcador_visitante);

    if (
      !Number.isFinite(golesLocal) ||
      !Number.isFinite(golesVisitante)
    ) {
      return;
    }

    validos += 1;

    const anotaronAmbos =
      golesLocal > 0 && golesVisitante > 0;

    const total = golesLocal + golesVisitante;
    const cumpleLinea = esMas
      ? total > linea
      : total < linea;

    if (
      anotaronAmbos === ambosAnotan &&
      cumpleLinea
    ) {
      acertados += 1;
    }
  });

  return porcentajeMercado(
    acertados,
    validos
  );
}


// ============================================================
// CALCULAR AMBOS ANOTAN O MÁS DE GOLES
// ============================================================

function porcentajeAmbosAnotanOMasGoles(
  partidos,
  linea,
  cumpleMercadoEsperado,
) {
  if (!Array.isArray(partidos) || partidos.length === 0) {
    return "N/D";
  }

  let validos = 0;
  let acertados = 0;

  partidos.forEach((partido) => {
    const golesLocal = Number(partido?.marcador_local);
    const golesVisitante = Number(partido?.marcador_visitante);

    if (
      !Number.isFinite(golesLocal) ||
      !Number.isFinite(golesVisitante)
    ) {
      return;
    }

    validos += 1;

    const anotaronAmbos =
      golesLocal > 0 && golesVisitante > 0;

    const total = golesLocal + golesVisitante;
    const masGoles = total > linea;
    const cumpleMercado = anotaronAmbos || masGoles;

    if (cumpleMercado === cumpleMercadoEsperado) {
      acertados += 1;
    }
  });

  return porcentajeMercado(
    acertados,
    validos
  );
}


// ============================================================
// CALCULAR PORCENTAJE DE UN RANGO DE GOLES TOTALES
// ============================================================

function porcentajeTotalGolesRango(
  partidos,
  minimo,
  maximo,
) {
  if (!Array.isArray(partidos) || partidos.length === 0) {
    return "N/D";
  }

  let validos = 0;
  let acertados = 0;

  partidos.forEach((partido) => {
    const golesLocal = Number(partido?.marcador_local);
    const golesVisitante = Number(partido?.marcador_visitante);

    if (
      !Number.isFinite(golesLocal) ||
      !Number.isFinite(golesVisitante)
    ) {
      return;
    }

    validos += 1;

    const total = golesLocal + golesVisitante;
    const cumpleMinimo = total >= minimo;
    const cumpleMaximo =
      maximo === null || total <= maximo;

    if (cumpleMinimo && cumpleMaximo) {
      acertados += 1;
    }
  });

  return porcentajeMercado(
    acertados,
    validos
  );
}


// ============================================================
// OBTENER TARJETAS DE UN PARTIDO
// ============================================================

function obtenerResumenTarjetas(partido) {
  const tarjetas =
    partido?.estadisticas?.eventos_jugadores?.tarjetas;

  if (!Array.isArray(tarjetas)) {
    return null;
  }

  const resumen = {
    local: 0,
    visitante: 0,
    total: 0,
  };

  tarjetas.forEach((tarjeta) => {
    const equipo = tarjeta?.equipo;

    if (equipo !== "local" && equipo !== "visitante") {
      return;
    }

    resumen[equipo] += 1;
    resumen.total += 1;
  });

  return resumen;
}


// ============================================================
// CALCULAR PORCENTAJE DE TARJETAS ROJAS
// ============================================================

function porcentajeTarjetasRojas(
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
    const tarjetas =
      partido?.estadisticas?.eventos_jugadores?.tarjetas;

    if (!Array.isArray(tarjetas)) {
      return;
    }

    validos += 1;

    const rojas = tarjetas.filter((tarjeta) =>
      tarjeta?.tipo === "Roja" ||
      tarjeta?.tipo === "Segunda amarilla"
    ).length;

    const cumpleLinea = esMas
      ? rojas > linea
      : rojas < linea;

    if (cumpleLinea) {
      acertados += 1;
    }
  });

  return porcentajeMercado(
    acertados,
    validos
  );
}


// ============================================================
// CALCULAR PORCENTAJE DE TARJETAS TOTALES
// ============================================================

function porcentajeTotalTarjetas(
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
    const resumen = obtenerResumenTarjetas(partido);

    if (resumen === null) {
      return;
    }

    validos += 1;

    const cumpleLinea = esMas
      ? resumen.total > linea
      : resumen.total < linea;

    if (cumpleLinea) {
      acertados += 1;
    }
  });

  return porcentajeMercado(
    acertados,
    validos
  );
}


// ============================================================
// CALCULAR TARJETAS PARA AMBOS EQUIPOS
// ============================================================

function porcentajeAmbosEquiposTarjetas(
  partidos,
  minimoTarjetas,
  cumpleMercadoEsperado,
) {
  if (!Array.isArray(partidos) || partidos.length === 0) {
    return "N/D";
  }

  let validos = 0;
  let acertados = 0;

  partidos.forEach((partido) => {
    const resumen = obtenerResumenTarjetas(partido);

    if (resumen === null) {
      return;
    }

    validos += 1;

    const cumpleMercado =
      resumen.local >= minimoTarjetas &&
      resumen.visitante >= minimoTarjetas;

    if (cumpleMercado === cumpleMercadoEsperado) {
      acertados += 1;
    }
  });

  return porcentajeMercado(
    acertados,
    validos
  );
}


// ============================================================
// CALCULAR PORCENTAJE DE PARIDAD DE GOLES TOTALES
// ============================================================

function porcentajeTotalGolesParidad(
  partidos,
  paridad,
) {
  if (!Array.isArray(partidos) || partidos.length === 0) {
    return "N/D";
  }

  let validos = 0;
  let acertados = 0;

  partidos.forEach((partido) => {
    const golesLocal = Number(partido?.marcador_local);
    const golesVisitante = Number(partido?.marcador_visitante);

    if (
      !Number.isFinite(golesLocal) ||
      !Number.isFinite(golesVisitante)
    ) {
      return;
    }

    validos += 1;

    const total = golesLocal + golesVisitante;
    const esPar = total % 2 === 0;

    if (
      (paridad === "par" && esPar) ||
      (paridad === "impar" && !esPar)
    ) {
      acertados += 1;
    }
  });

  return porcentajeMercado(
    acertados,
    validos
  );
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
// CALCULAR PORCENTAJE DE GOLES EXACTOS O POR RANGO DEL EQUIPO
// ============================================================

function porcentajeGolesEquipoRango(
  partidos,
  equipoId,
  tipo,
  minimo,
  maximo,
) {
  if (!Array.isArray(partidos) || partidos.length === 0) {
    return "N/D";
  }

  let validos = 0;
  let acertados = 0;

  partidos.forEach((partido) => {
    const goles = tipo === "marcados"
      ? obtenerGolesEquipo(partido, equipoId)
      : obtenerGolesRecibidosEquipo(partido, equipoId);

    if (!Number.isFinite(goles)) {
      return;
    }

    validos += 1;

    const cumpleMinimo = goles >= minimo;
    const cumpleMaximo =
      maximo === null || goles <= maximo;

    if (cumpleMinimo && cumpleMaximo) {
      acertados += 1;
    }
  });

  return porcentajeMercado(
    acertados,
    validos
  );
}


// ============================================================
// CALCULAR PORCENTAJE DE MARCADOR CORRECTO
// ============================================================

function porcentajeMarcadorCorrecto(
  partidos,
  equipoId,
  golesEquipoEsperados,
  golesRivalEsperados,
) {
  if (!Array.isArray(partidos) || partidos.length === 0) {
    return "N/D";
  }

  let validos = 0;
  let acertados = 0;

  partidos.forEach((partido) => {
    const golesEquipo =
      obtenerGolesEquipo(
        partido,
        equipoId
      );

    const golesRival =
      obtenerGolesRecibidosEquipo(
        partido,
        equipoId
      );

    if (
      !Number.isFinite(golesEquipo) ||
      !Number.isFinite(golesRival)
    ) {
      return;
    }

    validos += 1;

    if (
      golesEquipo === golesEquipoEsperados &&
      golesRival === golesRivalEsperados
    ) {
      acertados += 1;
    }
  });

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
