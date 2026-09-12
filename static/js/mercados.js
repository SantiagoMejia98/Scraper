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


function obtenerLadoEquipoPartido(partido, equipoId) {
  const idEquipo = Number(equipoId);
  const idLocal = obtenerIdEquipoLocalPartido(partido);
  const idVisitante = obtenerIdEquipoVisitantePartido(partido);

  if (!Number.isFinite(idEquipo)) {
    return null;
  }

  if (idLocal === idEquipo) {
    return "local";
  }

  if (idVisitante === idEquipo) {
    return "visitante";
  }

  return null;
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

      ${crearTablaMarcadorCorrecto(
        resultado,
        nombreEquipoLocal,
        nombreEquipoVisitante,
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
        Más/Menos Goles en Primer Tiempo
      </h3>

      ${crearTablaMasMenosTotal(
        resultado,
        nombreEquipoLocal,
        nombreEquipoVisitante,
        "1ST",
        4.5,
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
        Más/Menos Goles en Primer Tiempo ${escaparHTML(nombreEquipoLocal)}
      </h3>

      ${crearTablaMasMenosGolesEquipoPrimerTiempo(
        resultado,
        nombreEquipoLocal,
        nombreEquipoVisitante,
        "local",
      )}

      <h3 class="subtitulo-mercado">
        Más/Menos Goles en Primer Tiempo ${escaparHTML(nombreEquipoVisitante)}
      </h3>

      ${crearTablaMasMenosGolesEquipoPrimerTiempo(
        resultado,
        nombreEquipoLocal,
        nombreEquipoVisitante,
        "visitante",
      )}

      <h3 class="subtitulo-mercado">
        Más/Menos Goles en Segundo Tiempo
      </h3>

      ${crearTablaMasMenosTotal(
        resultado,
        nombreEquipoLocal,
        nombreEquipoVisitante,
        "2ND",
        4.5,
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

      <h3 class="subtitulo-mercado">
        Estadísticas
      </h3>

      <h4 class="subtitulo-mercado">
        Tiros al arco
      </h4>

      ${crearMercadoTirosAlArcoJugadores(
        resultado,
        nombreEquipoLocal,
        nombreEquipoVisitante,
      )}

      <h4 class="subtitulo-mercado">
        Tiros
      </h4>

      ${crearMercadoTirosTotalesJugadores(
        resultado,
        nombreEquipoLocal,
        nombreEquipoVisitante,
      )}

      <h4 class="subtitulo-mercado">
        Atajadas del arquero
      </h4>

      ${crearMercadoAtajadasPorteros(
        resultado,
        nombreEquipoLocal,
        nombreEquipoVisitante,
      )}

      <h4 class="subtitulo-mercado">
        Asistencias
      </h4>

      ${crearMercadoAsistenciasJugadores(
        resultado,
        nombreEquipoLocal,
        nombreEquipoVisitante,
      )}

      <h4 class="subtitulo-mercado">
        Faltas cometidas
      </h4>

      ${crearMercadoFaltasCometidasJugadores(
        resultado,
        nombreEquipoLocal,
        nombreEquipoVisitante,
      )}

      <h4 class="subtitulo-mercado">
        Faltas recibidas
      </h4>

      ${crearMercadoFaltasRecibidasJugadores(
        resultado,
        nombreEquipoLocal,
        nombreEquipoVisitante,
      )}

      <h4 class="subtitulo-mercado">
        Pases
      </h4>

      ${crearMercadoPasesJugadores(
        resultado,
        nombreEquipoLocal,
        nombreEquipoVisitante,
      )}

      <h4 class="subtitulo-mercado">
        Entradas
      </h4>

      ${crearMercadoEntradasJugadores(
        resultado,
        nombreEquipoLocal,
        nombreEquipoVisitante,
      )}

      <h4 class="subtitulo-mercado">
        Fueras de juego
      </h4>

      ${crearMercadoFuerasDeJuegoJugadores(
        resultado,
        nombreEquipoLocal,
        nombreEquipoVisitante,
      )}

      <h3 class="subtitulo-mercado">
        Goles
      </h3>

      <details class="mercado-jugador-colapsable">
        <summary>Goleador</summary>
        ${crearMercadoGolesJugadores(
          resultado,
          nombreEquipoLocal,
          nombreEquipoVisitante,
        )}
      </details>

      <details class="mercado-jugador-colapsable">
        <summary>Anotar</summary>
        ${crearMercadoAnotarJugadores(
          resultado,
          nombreEquipoLocal,
          nombreEquipoVisitante,
        )}
      </details>

      <details class="mercado-jugador-colapsable">
        <summary>Jugador que anota o da una asistencia</summary>
        ${crearMercadoAnotaOAsisteJugadores(
          resultado,
          nombreEquipoLocal,
          nombreEquipoVisitante,
        )}
      </details>

      <details class="mercado-jugador-colapsable">
        <summary>Goleador múltiple</summary>
        ${crearMercadoGoleadorMultiple(
          resultado,
          nombreEquipoLocal,
          nombreEquipoVisitante,
        )}
      </details>

      <details class="mercado-jugador-colapsable">
        <summary>Primer anotador del equipo local</summary>
        ${crearMercadoPrimerAnotadorEquipo(
          nombreEquipoLocal,
          resultado?.equipo_local?.partidos_general || [],
          resultado?.equipo_local?.partidos_local || [],
          resultado?.equipo_local?.id,
          "Como local",
        )}
      </details>

      <details class="mercado-jugador-colapsable">
        <summary>Primer anotador del equipo visitante</summary>
        ${crearMercadoPrimerAnotadorEquipo(
          nombreEquipoVisitante,
          resultado?.equipo_visitante?.partidos_general || [],
          resultado?.equipo_visitante?.partidos_visitante || [],
          resultado?.equipo_visitante?.id,
          "Como visitante",
        )}
      </details>

      <h3 class="subtitulo-mercado">
        Tarjetas / Otros
      </h3>

      <details class="mercado-jugador-colapsable">
        <summary>Tarjetas del jugador</summary>
        ${crearMercadoTarjetasJugadores(
          resultado,
          nombreEquipoLocal,
          nombreEquipoVisitante,
        )}
      </details>

      <details class="mercado-jugador-colapsable">
        <summary>El jugador golpea al palo</summary>
        ${crearMercadoGolpeaAlPaloJugadores(
          resultado,
          nombreEquipoLocal,
          nombreEquipoVisitante,
        )}
      </details>

      <h2 class="titulo-seccion">
        Tiros de esquina
      </h2>

      <h3 class="subtitulo-mercado">Tiros de esquina Menos/Más</h3>
      ${crearTablaMasMenosCorners(resultado, nombreEquipoLocal, nombreEquipoVisitante, "FT", null, 16.5)}

      <h3 class="subtitulo-mercado">Tiros de esquina en Primer Tiempo Más/Menos</h3>
      ${crearTablaMasMenosCorners(resultado, nombreEquipoLocal, nombreEquipoVisitante, "1ST", null, 10.5)}

      <h3 class="subtitulo-mercado">${escaparHTML(nombreEquipoLocal)} Tiros de esquina Menos/Más</h3>
      ${crearTablaMasMenosCorners(resultado, nombreEquipoLocal, nombreEquipoVisitante, "FT", "equipo", 10.5, "local")}

      <h3 class="subtitulo-mercado">${escaparHTML(nombreEquipoVisitante)} Tiros de esquina Menos/Más</h3>
      ${crearTablaMasMenosCorners(resultado, nombreEquipoLocal, nombreEquipoVisitante, "FT", "equipo", 10.5, "visitante")}

      <h3 class="subtitulo-mercado">Primer Tiempo Equipo con más tiros de esquina</h3>
      ${crearTablaEquipoMasCorners(resultado, nombreEquipoLocal, nombreEquipoVisitante, "1ST")}

      <h3 class="subtitulo-mercado">Primer Tiempo ${escaparHTML(nombreEquipoLocal)} Tiros de esquina Menos/Más</h3>
      ${crearTablaMasMenosCorners(resultado, nombreEquipoLocal, nombreEquipoVisitante, "1ST", "equipo", 10.5, "local")}

      <h3 class="subtitulo-mercado">Primer Tiempo ${escaparHTML(nombreEquipoVisitante)} Tiros de esquina Menos/Más</h3>
      ${crearTablaMasMenosCorners(resultado, nombreEquipoLocal, nombreEquipoVisitante, "1ST", "equipo", 10.5, "visitante")}

      <h3 class="subtitulo-mercado">Tiros de esquina en Segundo Tiempo Más/Menos</h3>
      ${crearTablaMasMenosCorners(resultado, nombreEquipoLocal, nombreEquipoVisitante, "2ND", null, 16.5)}

      <h3 class="subtitulo-mercado">Equipo con más Tiros de esquina</h3>
      ${crearTablaEquipoMasCorners(resultado, nombreEquipoLocal, nombreEquipoVisitante, "FT")}

      <h3 class="subtitulo-mercado">Tiempo con Más Tiros de Esquina</h3>
      ${crearTablaTiempoConMasCorners(resultado, nombreEquipoLocal, nombreEquipoVisitante)}

      <h3 class="subtitulo-mercado">Total de Tiros de esquina</h3>
      ${crearTablaRangosCorners(resultado, nombreEquipoLocal, nombreEquipoVisitante, [
        { etiqueta: "0-5", minimo: 0, maximo: 5 },
        { etiqueta: "6-8", minimo: 6, maximo: 8 },
        { etiqueta: "9-11", minimo: 9, maximo: 11 },
        { etiqueta: "12-14", minimo: 12, maximo: 14 },
        { etiqueta: "15+", minimo: 15, maximo: null },
      ])}

      <h3 class="subtitulo-mercado">Rango de Tiros de Esquina</h3>
      ${crearTablaRangosCorners(resultado, nombreEquipoLocal, nombreEquipoVisitante, [
        { etiqueta: "0", minimo: 0, maximo: 0 },
        { etiqueta: "1-3", minimo: 1, maximo: 3 },
        { etiqueta: "4-6", minimo: 4, maximo: 6 },
        { etiqueta: "7-9", minimo: 7, maximo: 9 },
        { etiqueta: "10-12", minimo: 10, maximo: 12 },
        { etiqueta: "13-15", minimo: 13, maximo: 15 },
        { etiqueta: "16-18", minimo: 16, maximo: 18 },
        { etiqueta: "19+", minimo: 19, maximo: null },
      ])}

      <h3 class="subtitulo-mercado">Tiros de Esquina Marcador Correcto</h3>
      ${crearTablaMarcadorCorrectoCorners(resultado, nombreEquipoLocal, nombreEquipoVisitante)}

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
        Tarjetas totales Más/Menos Primer Tiempo
      </h3>

      ${crearTablaMasMenosTarjetasPrimerTiempo(
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

      <h3 class="subtitulo-mercado">
        Hándicap - Tarjetas
      </h3>

      ${crearTablaHandicapTarjetas(
        resultado,
        nombreEquipoLocal,
        nombreEquipoVisitante,
      )}

      <h3 class="subtitulo-mercado">Equipo con más tarjetas</h3>
      ${crearTablaMasTarjetas(resultado, nombreEquipoLocal, nombreEquipoVisitante)}

      <h3 class="subtitulo-mercado">${escaparHTML(nombreEquipoLocal)} Tarjeta roja</h3>
      ${crearTablaTarjetaRojaEquipo(resultado, nombreEquipoLocal, nombreEquipoVisitante, "local")}

      <h3 class="subtitulo-mercado">${escaparHTML(nombreEquipoVisitante)} Tarjeta roja</h3>
      ${crearTablaTarjetaRojaEquipo(resultado, nombreEquipoLocal, nombreEquipoVisitante, "visitante")}

      <h3 class="subtitulo-mercado">Equipo que recibe la próxima tarjeta 1</h3>
      ${crearTablaProximaTarjeta(resultado, nombreEquipoLocal, nombreEquipoVisitante)}

      <h3 class="subtitulo-mercado">${escaparHTML(nombreEquipoLocal)} Total de tarjetas en el Primer Tiempo (Más/Menos)</h3>
      ${crearTablaTarjetasEquipoPrimerTiempo(resultado, nombreEquipoLocal, nombreEquipoVisitante, "local")}

      <h3 class="subtitulo-mercado">${escaparHTML(nombreEquipoVisitante)} Total de tarjetas en el Primer Tiempo (Más/Menos)</h3>
      ${crearTablaTarjetasEquipoPrimerTiempo(resultado, nombreEquipoLocal, nombreEquipoVisitante, "visitante")}

      <h3 class="subtitulo-mercado">Tarjeta mostrada en ambos tiempos</h3>
      ${crearTablaTarjetasAmbosTiempos(resultado, nombreEquipoLocal, nombreEquipoVisitante)}

      <h3 class="subtitulo-mercado">Ambos equipos reciben una tarjeta en ambos tiempos</h3>
      ${crearTablaAmbosEquiposTarjetasAmbosTiempos(resultado, nombreEquipoLocal, nombreEquipoVisitante)}

      <h3 class="subtitulo-mercado">${escaparHTML(nombreEquipoLocal)} Segundo Tiempo Tarjetas Totales Más/Menos</h3>
      ${crearTablaTarjetasEquipoSegundoTiempo(resultado, nombreEquipoLocal, nombreEquipoVisitante, "local")}

      <h3 class="subtitulo-mercado">${escaparHTML(nombreEquipoVisitante)} Segundo Tiempo Tarjetas Totales Más/Menos</h3>
      ${crearTablaTarjetasEquipoSegundoTiempo(resultado, nombreEquipoLocal, nombreEquipoVisitante, "visitante")}

      <h3 class="subtitulo-mercado">Tarjeta roja Primer Tiempo</h3>
      ${crearTablaEventoTarjetas(resultado, nombreEquipoLocal, nombreEquipoVisitante, "roja_primero", true)}

      <h3 class="subtitulo-mercado">Tarjeta roja y Penal concedido</h3>
      ${crearTablaEventoTarjetas(resultado, nombreEquipoLocal, nombreEquipoVisitante, "roja_y_penal", true)}

      <h3 class="subtitulo-mercado">Tarjeta roja o Penal concedido</h3>
      ${crearTablaEventoTarjetas(resultado, nombreEquipoLocal, nombreEquipoVisitante, "roja_o_penal", false)}

      <h3 class="subtitulo-mercado">Tarjetas Rangos</h3>
      ${crearTablaRangosTarjetas(resultado, nombreEquipoLocal, nombreEquipoVisitante)}

      <h3 class="subtitulo-mercado">Tarjetas de medio tiempo/tiempo completo</h3>
      ${crearTablaMedioTiempoTiempoCompletoTarjetas(resultado, nombreEquipoLocal, nombreEquipoVisitante)}

      <h3 class="subtitulo-mercado">Tarjetas Marcador Correcto</h3>
      ${crearTablaMarcadorCorrectoTarjetas(resultado, nombreEquipoLocal, nombreEquipoVisitante)}

      <h2 class="titulo-seccion">
        Estadísticas
      </h2>

      <h3 class="subtitulo-mercado">Remates totales</h3>
      ${crearTablaMasMenosEstadistica(resultado, nombreEquipoLocal, nombreEquipoVisitante, "total shots", 15.5, 31.5)}

      <h3 class="subtitulo-mercado">${escaparHTML(nombreEquipoLocal)} Remates totales</h3>
      ${crearTablaMasMenosEstadistica(resultado, nombreEquipoLocal, nombreEquipoVisitante, "total shots", 9.5, 25.5, "local")}

      <h3 class="subtitulo-mercado">${escaparHTML(nombreEquipoVisitante)} Remates totales</h3>
      ${crearTablaMasMenosEstadistica(resultado, nombreEquipoLocal, nombreEquipoVisitante, "total shots", 9.5, 25.5, "visitante")}

      <h3 class="subtitulo-mercado">Tiros al Arco</h3>
      ${crearTablaMasMenosEstadistica(resultado, nombreEquipoLocal, nombreEquipoVisitante, "shots on target", 0.5, 15.5)}

      <h3 class="subtitulo-mercado">${escaparHTML(nombreEquipoLocal)} Tiros al Arco</h3>
      ${crearTablaMasMenosEstadistica(resultado, nombreEquipoLocal, nombreEquipoVisitante, "shots on target", 0.5, 9.5, "local")}

      <h3 class="subtitulo-mercado">${escaparHTML(nombreEquipoVisitante)} Tiros al Arco</h3>
      ${crearTablaMasMenosEstadistica(resultado, nombreEquipoLocal, nombreEquipoVisitante, "shots on target", 0.5, 9.5, "visitante")}

      <h3 class="subtitulo-mercado">Primer Tiempo Tiros al Arco</h3>
      ${crearTablaMasMenosEstadistica(resultado, nombreEquipoLocal, nombreEquipoVisitante, "shots on target", 0.5, 7.5, null, false, "1ST")}

      <h3 class="subtitulo-mercado">Total de Faltas Cometidas</h3>
      ${crearTablaMasMenosEstadistica(resultado, nombreEquipoLocal, nombreEquipoVisitante, "fouls", 10.5, 35.5)}

      <h3 class="subtitulo-mercado">${escaparHTML(nombreEquipoLocal)} Total de Faltas Cometidas</h3>
      ${crearTablaMasMenosEstadistica(resultado, nombreEquipoLocal, nombreEquipoVisitante, "fouls", 5.5, 25.5, "local")}

      <h3 class="subtitulo-mercado">${escaparHTML(nombreEquipoVisitante)} Total de Faltas Cometidas</h3>
      ${crearTablaMasMenosEstadistica(resultado, nombreEquipoLocal, nombreEquipoVisitante, "fouls", 5.5, 25.5, "visitante")}

      <h3 class="subtitulo-mercado">Total de Fueras de lugar</h3>
      ${crearTablaMasMenosEstadistica(resultado, nombreEquipoLocal, nombreEquipoVisitante, "offsides", 0.5, 6.5)}

      <h3 class="subtitulo-mercado">${escaparHTML(nombreEquipoLocal)} Total de Fueras de lugar</h3>
      ${crearTablaMasMenosEstadistica(resultado, nombreEquipoLocal, nombreEquipoVisitante, "offsides", 0.5, 6.5, "local")}

      <h3 class="subtitulo-mercado">${escaparHTML(nombreEquipoVisitante)} Total de Fueras de lugar</h3>
      ${crearTablaMasMenosEstadistica(resultado, nombreEquipoLocal, nombreEquipoVisitante, "offsides", 0.5, 6.5, "visitante")}

      <h3 class="subtitulo-mercado">Palo</h3>
      ${crearTablaMasMenosEstadistica(resultado, nombreEquipoLocal, nombreEquipoVisitante, "hit woodwork", 0.5, 1.5, null, true)}

      <h3 class="subtitulo-mercado">Total de Saques de meta</h3>
      ${crearTablaMasMenosEstadistica(resultado, nombreEquipoLocal, nombreEquipoVisitante, "goal kicks", 10.5, 35.5)}

      <h3 class="subtitulo-mercado">${escaparHTML(nombreEquipoLocal)} Total de Saques de meta</h3>
      ${crearTablaMasMenosEstadistica(resultado, nombreEquipoLocal, nombreEquipoVisitante, "goal kicks", 7.5, 25.5, "local")}

      <h3 class="subtitulo-mercado">${escaparHTML(nombreEquipoVisitante)} Total de Saques de meta</h3>
      ${crearTablaMasMenosEstadistica(resultado, nombreEquipoLocal, nombreEquipoVisitante, "goal kicks", 7.5, 25.5, "visitante")}

      <h3 class="subtitulo-mercado">Total de Saques de banda</h3>
      ${crearTablaMasMenosEstadistica(resultado, nombreEquipoLocal, nombreEquipoVisitante, "throw-ins", 15.5, 65.5, null, false, "FT", 2)}

      <h3 class="subtitulo-mercado">${escaparHTML(nombreEquipoLocal)} Total de Saques de banda</h3>
      ${crearTablaMasMenosEstadistica(resultado, nombreEquipoLocal, nombreEquipoVisitante, "throw-ins", 5.5, 35.5, "local", false, "FT", 2)}

      <h3 class="subtitulo-mercado">${escaparHTML(nombreEquipoVisitante)} Total de Saques de banda</h3>
      ${crearTablaMasMenosEstadistica(resultado, nombreEquipoLocal, nombreEquipoVisitante, "throw-ins", 5.5, 35.5, "visitante", false, "FT", 2)}

      <h3 class="subtitulo-mercado">Total de pases</h3>
      ${crearTablaMasMenosEstadistica(resultado, nombreEquipoLocal, nombreEquipoVisitante, "passes", 400.5, 1400.5, null, false, "FT", 50)}

      <h3 class="subtitulo-mercado">${escaparHTML(nombreEquipoLocal)} Total de pases</h3>
      ${crearTablaMasMenosEstadistica(resultado, nombreEquipoLocal, nombreEquipoVisitante, "passes", 100.5, 800.5, "local", false, "FT", 50)}

      <h3 class="subtitulo-mercado">${escaparHTML(nombreEquipoVisitante)} Total de pases</h3>
      ${crearTablaMasMenosEstadistica(resultado, nombreEquipoLocal, nombreEquipoVisitante, "passes", 100.5, 800.5, "visitante", false, "FT", 50)}

      <h3 class="subtitulo-mercado">Tackles totales</h3>
      ${crearTablaMasMenosEstadistica(resultado, nombreEquipoLocal, nombreEquipoVisitante, "total tackles", 10.5, 60.5, null, false, "FT", 2)}

      <h3 class="subtitulo-mercado">${escaparHTML(nombreEquipoLocal)} Tackles totales</h3>
      ${crearTablaMasMenosEstadistica(resultado, nombreEquipoLocal, nombreEquipoVisitante, "total tackles", 3.5, 35.5, "local", false, "FT", 2)}

      <h3 class="subtitulo-mercado">${escaparHTML(nombreEquipoVisitante)} Tackles totales</h3>
      ${crearTablaMasMenosEstadistica(resultado, nombreEquipoLocal, nombreEquipoVisitante, "total tackles", 3.5, 35.5, "visitante", false, "FT", 2)}

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

      <h2 class="titulo-seccion">
        Medio tiempo
      </h2>

      ${crearMercadosMedioTiempo(
        resultado,
        nombreEquipoLocal,
        nombreEquipoVisitante,
      )}

      <h2 class="titulo-seccion">
        Especiales
      </h2>

      ${crearMercadosEspeciales(
        resultado,
        nombreEquipoLocal,
        nombreEquipoVisitante,
      )}

      <h2 class="titulo-seccion">
        Hándicap
      </h2>

      ${crearMercadosHandicap(
        resultado,
        nombreEquipoLocal,
        nombreEquipoVisitante,
      )}

    </section>
  `;

  agregarProbabilidadCombinada(contenedor, resultado);
  configurarMercadosJugadoresColapsables(contenedor);
  configurarSeccionJugadoresColapsable(contenedor, "Goles");
  configurarSeccionJugadoresColapsable(contenedor, "Tarjetas / Otros");
  configurarSubmercadosColapsables(contenedor);
  configurarSeccionesColapsables(contenedor);
}


// ============================================================
// MERCADOS DE JUGADORES
// ============================================================

function crearMercadoTirosAlArcoJugadores(resultado, nombreLocal, nombreVisitante) {
  return crearMercadoTirosJugadores(
    resultado,
    nombreLocal,
    nombreVisitante,
    "onTargetScoringAttempt",
    [1, 2, 3, 4, 5, 6],
  );
}


function crearMercadoTirosTotalesJugadores(resultado, nombreLocal, nombreVisitante) {
  return crearMercadoTirosJugadores(
    resultado,
    nombreLocal,
    nombreVisitante,
    "totalShots",
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  );
}


function crearMercadoFaltasCometidasJugadores(resultado, nombreLocal, nombreVisitante) {
  return crearMercadoTirosJugadores(
    resultado,
    nombreLocal,
    nombreVisitante,
    "fouls",
    [1, 2, 3, 4, 5, 6],
  );
}


function crearMercadoFaltasRecibidasJugadores(resultado, nombreLocal, nombreVisitante) {
  return crearMercadoTirosJugadores(
    resultado,
    nombreLocal,
    nombreVisitante,
    "wasFouled",
    [1, 2, 3, 4, 5, 6],
  );
}


function crearMercadoPasesJugadores(resultado, nombreLocal, nombreVisitante) {
  return crearMercadoTirosJugadores(
    resultado,
    nombreLocal,
    nombreVisitante,
    "accuratePass",
    [50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150],
  );
}


function crearMercadoEntradasJugadores(resultado, nombreLocal, nombreVisitante) {
  return crearMercadoTirosJugadores(
    resultado,
    nombreLocal,
    nombreVisitante,
    "wonTackle",
    [1, 2, 3, 4, 5, 6],
  );
}


function crearMercadoFuerasDeJuegoJugadores(resultado, nombreLocal, nombreVisitante) {
  return crearMercadoTirosJugadores(
    resultado,
    nombreLocal,
    nombreVisitante,
    "totalOffside",
    [1, 2, 3, 4, 5, 6],
  );
}


function crearMercadoGolesJugadores(resultado, nombreLocal, nombreVisitante) {
  return `
    ${crearTablaGoleadoresEquipo(
      nombreLocal,
      resultado?.equipo_local?.partidos_general || [],
      resultado?.equipo_local?.partidos_local || [],
      resultado?.equipo_local?.id,
      "Como local",
    )}
    ${crearTablaGoleadoresEquipo(
      nombreVisitante,
      resultado?.equipo_visitante?.partidos_general || [],
      resultado?.equipo_visitante?.partidos_visitante || [],
      resultado?.equipo_visitante?.id,
      "Como visitante",
    )}
  `;
}


function crearMercadoAnotarJugadores(resultado, nombreLocal, nombreVisitante) {
  return `
    ${crearTablaAnotarEquipo(
      nombreLocal,
      resultado?.equipo_local?.partidos_general || [],
      resultado?.equipo_local?.partidos_local || [],
      resultado?.equipo_local?.id,
      "Como local",
    )}
    ${crearTablaAnotarEquipo(
      nombreVisitante,
      resultado?.equipo_visitante?.partidos_general || [],
      resultado?.equipo_visitante?.partidos_visitante || [],
      resultado?.equipo_visitante?.id,
      "Como visitante",
    )}
  `;
}


function crearMercadoAnotaOAsisteJugadores(resultado, nombreLocal, nombreVisitante) {
  return `
    ${crearTablaAnotaOAsisteEquipo(
      nombreLocal,
      resultado?.equipo_local?.partidos_general || [],
      resultado?.equipo_local?.partidos_local || [],
      resultado?.equipo_local?.id,
      "Como local",
    )}
    ${crearTablaAnotaOAsisteEquipo(
      nombreVisitante,
      resultado?.equipo_visitante?.partidos_general || [],
      resultado?.equipo_visitante?.partidos_visitante || [],
      resultado?.equipo_visitante?.id,
      "Como visitante",
    )}
  `;
}


function crearTablaAnotaOAsisteEquipo(nombreEquipo, partidosGeneral, partidosLocalidad, equipoId, etiquetaLocalidad) {
  const general = resumirAnotaOAsisteJugadores(partidosGeneral, equipoId);
  const localidad = resumirAnotaOAsisteJugadores(partidosLocalidad, equipoId);
  const porClave = new Map();

  general.forEach((jugador) => {
    porClave.set(jugador.clave, { nombre: jugador.nombre, general: jugador, localidad: null });
  });
  localidad.forEach((jugador) => {
    const actual = porClave.get(jugador.clave) || {
      nombre: jugador.nombre,
      general: null,
      localidad: null,
    };
    actual.localidad = jugador;
    porClave.set(jugador.clave, actual);
  });

  const jugadores = [...porClave.values()]
    .filter((jugador) => porcentajeTirosAlArcoJugadorNumero(jugador.general, 1) > 0
      || porcentajeTirosAlArcoJugadorNumero(jugador.localidad, 1) > 0)
    .sort((a, b) => porcentajePonderadoJugador(b, (dato) => porcentajeTirosAlArcoJugadorNumero(dato, 1))
      - porcentajePonderadoJugador(a, (dato) => porcentajeTirosAlArcoJugadorNumero(dato, 1))
      || porcentajeTirosAlArcoJugadorNumero(b.general, 1)
        - porcentajeTirosAlArcoJugadorNumero(a.general, 1)
      || a.nombre.localeCompare(b.nombre));

  if (!jugadores.length) {
    return `<div class="vacio">No hay goles ni asistencias de jugadores disponibles para ${escaparHTML(nombreEquipo)}.</div>`;
  }

  return `
    <div class="tabla-estadisticas-wrapper mercado-jugadores">
      <h4>${escaparHTML(nombreEquipo)}</h4>
      <table class="tabla-estadisticas">
        <thead>
          <tr>
            <th>Jugador</th>
            <th>Anota o da una asistencia</th>
          </tr>
        </thead>
        <tbody>
          ${jugadores.map((jugador) => `
            <tr>
              <td>
                ${escaparHTML(jugador.nombre)}<br>
                <small>${escaparHTML(etiquetaLocalidad)}: ${jugador.localidad?.partidos || 0} partidos<br>General: ${jugador.general?.partidos || 0} partidos</small>
              </td>
              <td>${formatearProbabilidadAnotaOAsiste(jugador, etiquetaLocalidad)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}


function formatearProbabilidadAnotaOAsiste(jugador, etiquetaLocalidad) {
  return `
    <small>Combinada</small><br>
    ${formatearPorcentajePonderadoJugador(jugador, (dato) => porcentajeTirosAlArcoJugadorNumero(dato, 1))}%<br>
    <small>${escaparHTML(etiquetaLocalidad)}</small><br>
    ${Math.round(porcentajeTirosAlArcoJugadorNumero(jugador.localidad, 1))}%<br>
    <small>General</small><br>
    ${Math.round(porcentajeTirosAlArcoJugadorNumero(jugador.general, 1))}%
  `;
}


function crearMercadoGoleadorMultiple(resultado, nombreLocal, nombreVisitante) {
  return `
    ${crearTablaGoleadorMultipleEquipo(
      nombreLocal,
      resultado?.equipo_local?.partidos_general || [],
      resultado?.equipo_local?.partidos_local || [],
      resultado?.equipo_local?.id,
      "Como local",
    )}
    ${crearTablaGoleadorMultipleEquipo(
      nombreVisitante,
      resultado?.equipo_visitante?.partidos_general || [],
      resultado?.equipo_visitante?.partidos_visitante || [],
      resultado?.equipo_visitante?.id,
      "Como visitante",
    )}
  `;
}


function crearTablaGoleadorMultipleEquipo(nombreEquipo, partidosGeneral, partidosLocalidad, equipoId, etiquetaLocalidad) {
  const general = resumirGoleadoresJugadores(partidosGeneral, equipoId);
  const localidad = resumirGoleadoresJugadores(partidosLocalidad, equipoId);
  const porClave = new Map();

  general.forEach((jugador) => {
    porClave.set(jugador.clave, { nombre: jugador.nombre, general: jugador, localidad: null });
  });
  localidad.forEach((jugador) => {
    const actual = porClave.get(jugador.clave) || {
      nombre: jugador.nombre,
      general: null,
      localidad: null,
    };
    actual.localidad = jugador;
    porClave.set(jugador.clave, actual);
  });

  const jugadores = [...porClave.values()]
    .filter((jugador) => (jugador.general?.goles || 0) > 0 || (jugador.localidad?.goles || 0) > 0)
    .sort((a, b) => porcentajePonderadoJugador(b, (dato) => porcentajeGoleadorMultiple(dato, 2))
      - porcentajePonderadoJugador(a, (dato) => porcentajeGoleadorMultiple(dato, 2))
      || porcentajeGoleadorMultiple(b.general, 2) - porcentajeGoleadorMultiple(a.general, 2)
      || (b.general?.goles || 0) - (a.general?.goles || 0)
      || a.nombre.localeCompare(b.nombre));

  if (!jugadores.length) {
    return `<div class="vacio">No hay goles de jugadores disponibles para ${escaparHTML(nombreEquipo)}.</div>`;
  }

  return `
    <div class="tabla-estadisticas-wrapper mercado-jugadores">
      <h4>${escaparHTML(nombreEquipo)}</h4>
      <table class="tabla-estadisticas">
        <thead>
          <tr>
            <th>Jugador</th>
            <th>2 o más goles</th>
            <th>Triplete</th>
          </tr>
        </thead>
        <tbody>
          ${jugadores.map((jugador) => `
            <tr>
              <td>
                ${escaparHTML(jugador.nombre)}<br>
                <small>${escaparHTML(etiquetaLocalidad)}: ${jugador.localidad?.goles || 0} goles en ${jugador.localidad?.partidos || 0} partidos<br>General: ${jugador.general?.goles || 0} goles en ${jugador.general?.partidos || 0} partidos</small>
              </td>
              <td>${formatearProbabilidadGoleadorMultiple(jugador, 2, etiquetaLocalidad)}</td>
              <td>${formatearProbabilidadGoleadorMultiple(jugador, 3, etiquetaLocalidad)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}


function porcentajeGoleadorMultiple(jugador, minimoGoles) {
  if (!jugador?.partidos) return 0;

  const partidosConMultiplete = (jugador.golesPorPartido || [])
    .filter((goles) => goles >= minimoGoles)
    .length;

  return (partidosConMultiplete / jugador.partidos) * 100;
}


function formatearProbabilidadGoleadorMultiple(jugador, minimoGoles, etiquetaLocalidad) {
  return `
    <small>Combinada</small><br>
    ${formatearPorcentajePonderadoJugador(jugador, (dato) => porcentajeGoleadorMultiple(dato, minimoGoles))}%<br>
    <small>${escaparHTML(etiquetaLocalidad)}</small><br>
    ${Math.round(porcentajeGoleadorMultiple(jugador.localidad, minimoGoles))}%<br>
    <small>General</small><br>
    ${Math.round(porcentajeGoleadorMultiple(jugador.general, minimoGoles))}%
  `;
}


function crearMercadoPrimerAnotadorEquipo(nombreEquipo, partidosGeneral, partidosLocalidad, equipoId, etiquetaLocalidad) {
  const general = resumirGoleadoresJugadores(partidosGeneral, equipoId);
  const localidad = resumirGoleadoresJugadores(partidosLocalidad, equipoId);
  const porClave = new Map();

  general.forEach((jugador) => {
    porClave.set(jugador.clave, { nombre: jugador.nombre, general: jugador, localidad: null });
  });
  localidad.forEach((jugador) => {
    const actual = porClave.get(jugador.clave) || {
      nombre: jugador.nombre,
      general: null,
      localidad: null,
    };
    actual.localidad = jugador;
    porClave.set(jugador.clave, actual);
  });

  const jugadores = [...porClave.values()]
    .filter((jugador) => (jugador.general?.goles || 0) > 0 || (jugador.localidad?.goles || 0) > 0)
    .sort((a, b) => porcentajePonderadoJugador(b, (dato) => porcentajeGoleador(dato, "primerGolEquipo"))
      - porcentajePonderadoJugador(a, (dato) => porcentajeGoleador(dato, "primerGolEquipo"))
      || porcentajeGoleador(b.general, "primerGolEquipo")
        - porcentajeGoleador(a.general, "primerGolEquipo")
      || (b.general?.goles || 0) - (a.general?.goles || 0)
      || a.nombre.localeCompare(b.nombre));

  if (!jugadores.length) {
    return `<div class="vacio">No hay goles de jugadores disponibles para ${escaparHTML(nombreEquipo)}.</div>`;
  }

  return `
    <div class="tabla-estadisticas-wrapper mercado-jugadores">
      <h4>${escaparHTML(nombreEquipo)}</h4>
      <table class="tabla-estadisticas">
        <thead>
          <tr>
            <th>Jugador</th>
            <th>Primer anotador del equipo</th>
          </tr>
        </thead>
        <tbody>
          ${jugadores.map((jugador) => `
            <tr>
              <td>
                ${escaparHTML(jugador.nombre)}<br>
                <small>${escaparHTML(etiquetaLocalidad)}: ${jugador.localidad?.goles || 0} goles en ${jugador.localidad?.partidos || 0} partidos<br>General: ${jugador.general?.goles || 0} goles en ${jugador.general?.partidos || 0} partidos</small>
              </td>
              <td>${formatearProbabilidadGoleador(jugador, "primerGolEquipo", etiquetaLocalidad)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}


function crearMercadoTarjetasJugadores(resultado, nombreLocal, nombreVisitante) {
  return `
    ${crearTablaTarjetasJugadoresEquipo(
      nombreLocal,
      resultado?.equipo_local?.partidos_general || [],
      resultado?.equipo_local?.partidos_local || [],
      resultado?.equipo_local?.id,
      "Como local",
    )}
    ${crearTablaTarjetasJugadoresEquipo(
      nombreVisitante,
      resultado?.equipo_visitante?.partidos_general || [],
      resultado?.equipo_visitante?.partidos_visitante || [],
      resultado?.equipo_visitante?.id,
      "Como visitante",
    )}
  `;
}


function crearMercadoGolpeaAlPaloJugadores(resultado, nombreLocal, nombreVisitante) {
  return crearMercadoTirosJugadores(
    resultado,
    nombreLocal,
    nombreVisitante,
    "hitWoodwork",
    [1],
  );
}


function crearTablaTarjetasJugadoresEquipo(nombreEquipo, partidosGeneral, partidosLocalidad, equipoId, etiquetaLocalidad) {
  const general = resumirTarjetasJugadores(partidosGeneral, equipoId);
  const localidad = resumirTarjetasJugadores(partidosLocalidad, equipoId);
  const porClave = new Map();

  general.forEach((jugador) => {
    porClave.set(jugador.clave, { nombre: jugador.nombre, general: jugador, localidad: null });
  });
  localidad.forEach((jugador) => {
    const actual = porClave.get(jugador.clave) || {
      nombre: jugador.nombre,
      general: null,
      localidad: null,
    };
    actual.localidad = jugador;
    porClave.set(jugador.clave, actual);
  });

  const jugadores = [...porClave.values()]
    .filter((jugador) => (jugador.general?.tarjetas || 0) > 0 || (jugador.localidad?.tarjetas || 0) > 0)
    .sort((a, b) => porcentajePonderadoJugador(b, (dato) => porcentajeGoleador(dato, "tarjeta"))
      - porcentajePonderadoJugador(a, (dato) => porcentajeGoleador(dato, "tarjeta"))
      || porcentajeGoleador(b.general, "tarjeta") - porcentajeGoleador(a.general, "tarjeta")
      || (b.general?.tarjetas || 0) - (a.general?.tarjetas || 0)
      || a.nombre.localeCompare(b.nombre));

  if (!jugadores.length) {
    return `<div class="vacio">No hay tarjetas de jugadores disponibles para ${escaparHTML(nombreEquipo)}.</div>`;
  }

  return `
    <div class="tabla-estadisticas-wrapper mercado-jugadores">
      <h4>${escaparHTML(nombreEquipo)}</h4>
      <table class="tabla-estadisticas">
        <thead>
          <tr>
            <th>Jugador</th>
            <th>Tarjeta</th>
            <th>Tarjeta roja</th>
            <th>1ra tarjeta</th>
          </tr>
        </thead>
        <tbody>
          ${jugadores.map((jugador) => `
            <tr>
              <td>
                ${escaparHTML(jugador.nombre)}<br>
                <small>${escaparHTML(etiquetaLocalidad)}: ${jugador.localidad?.tarjetas || 0} tarjetas en ${jugador.localidad?.partidos || 0} partidos<br>General: ${jugador.general?.tarjetas || 0} tarjetas en ${jugador.general?.partidos || 0} partidos</small>
              </td>
              <td>${formatearProbabilidadGoleador(jugador, "tarjeta", etiquetaLocalidad)}</td>
              <td>${formatearProbabilidadGoleador(jugador, "roja", etiquetaLocalidad)}</td>
              <td>${formatearProbabilidadGoleador(jugador, "primeraTarjetaPartido", etiquetaLocalidad)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}


function resumirTarjetasJugadores(partidos, equipoId) {
  const jugadores = new Map();

  (partidos || []).forEach((partido) => {
    const lado = obtenerLadoEquipoPartido(partido, equipoId);
    if (!lado) return;
    const lista = partido?.estadisticas?.jugadores?.[lado];
    if (!Array.isArray(lista)) return;

    lista.forEach((jugador) => {
      const minutos = Number(jugador?.minutesPlayed);
      if (!Number.isFinite(minutos) || minutos <= 0) return;

      const nombre = jugador?.jugador || "Jugador sin nombre";
      const clave = jugador?.player_id != null
        ? `id:${jugador.player_id}`
        : `nombre:${normalizarTextoJugador(nombre)}`;
      const actual = jugadores.get(clave) || {
        clave,
        nombre,
        partidos: 0,
        tarjetas: 0,
        tarjeta: 0,
        roja: 0,
        primeraTarjetaPartido: 0,
      };
      const tarjetas = Array.isArray(jugador?.tarjetas) ? jugador.tarjetas.length : 0;
      const roja = Number(jugador?.rojas) || 0;

      actual.partidos += 1;
      actual.tarjetas += tarjetas;
      actual.tarjeta += tarjetas > 0 ? 1 : 0;
      actual.roja += roja > 0 ? 1 : 0;
      actual.primeraTarjetaPartido += jugador?.primera_tarjeta_partido ? 1 : 0;
      jugadores.set(clave, actual);
    });
  });

  return [...jugadores.values()];
}


function crearTablaGoleadoresEquipo(nombreEquipo, partidosGeneral, partidosLocalidad, equipoId, etiquetaLocalidad) {
  const general = resumirGoleadoresJugadores(partidosGeneral, equipoId);
  const localidad = resumirGoleadoresJugadores(partidosLocalidad, equipoId);
  const porClave = new Map();

  general.forEach((jugador) => {
    porClave.set(jugador.clave, { nombre: jugador.nombre, general: jugador, localidad: null });
  });
  localidad.forEach((jugador) => {
    const actual = porClave.get(jugador.clave) || {
      nombre: jugador.nombre,
      general: null,
      localidad: null,
    };
    actual.localidad = jugador;
    porClave.set(jugador.clave, actual);
  });

  const goleadores = [...porClave.values()]
    .filter((jugador) => (jugador.general?.goles || 0) > 0 || (jugador.localidad?.goles || 0) > 0)
    .sort((a, b) => porcentajePonderadoJugador(b, (dato) => porcentajeGoleador(dato, "anota"))
      - porcentajePonderadoJugador(a, (dato) => porcentajeGoleador(dato, "anota"))
      || porcentajeGoleador(b.general, "anota") - porcentajeGoleador(a.general, "anota")
      || (b.general?.goles || 0) - (a.general?.goles || 0)
      || a.nombre.localeCompare(b.nombre));

  if (!goleadores.length) {
    return `<div class="vacio">No hay goles de jugadores disponibles para ${escaparHTML(nombreEquipo)}.</div>`;
  }

  return `
    <div class="tabla-estadisticas-wrapper mercado-jugadores">
      <h4>${escaparHTML(nombreEquipo)}</h4>
      <table class="tabla-estadisticas">
        <thead>
          <tr>
            <th>Jugador</th>
            <th>Anota en cualquier momento</th>
            <th>Primer gol</th>
            <th>Último gol</th>
          </tr>
        </thead>
        <tbody>
          ${goleadores.map((jugador) => `
            <tr>
              <td>
                ${escaparHTML(jugador.nombre)}<br>
                <small>${escaparHTML(etiquetaLocalidad)}: ${jugador.localidad?.goles || 0} goles en ${jugador.localidad?.partidos || 0} partidos<br>General: ${jugador.general?.goles || 0} goles en ${jugador.general?.partidos || 0} partidos</small>
              </td>
              <td>${formatearProbabilidadGoleador(jugador, "anota", etiquetaLocalidad)}</td>
              <td>${formatearProbabilidadGoleador(jugador, "primerGol", etiquetaLocalidad)}</td>
              <td>${formatearProbabilidadGoleador(jugador, "ultimoGol", etiquetaLocalidad)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}


function crearTablaAnotarEquipo(nombreEquipo, partidosGeneral, partidosLocalidad, equipoId, etiquetaLocalidad) {
  const general = resumirGoleadoresJugadores(partidosGeneral, equipoId);
  const localidad = resumirGoleadoresJugadores(partidosLocalidad, equipoId);
  const porClave = new Map();

  general.forEach((jugador) => {
    porClave.set(jugador.clave, { nombre: jugador.nombre, general: jugador, localidad: null });
  });
  localidad.forEach((jugador) => {
    const actual = porClave.get(jugador.clave) || {
      nombre: jugador.nombre,
      general: null,
      localidad: null,
    };
    actual.localidad = jugador;
    porClave.set(jugador.clave, actual);
  });

  const jugadores = [...porClave.values()]
    .filter((jugador) => (jugador.general?.goles || 0) > 0 || (jugador.localidad?.goles || 0) > 0)
    .sort((a, b) => porcentajePonderadoJugador(b, (dato) => porcentajeGoleador(dato, "primerTiempo"))
      - porcentajePonderadoJugador(a, (dato) => porcentajeGoleador(dato, "primerTiempo"))
      || porcentajeGoleador(b.general, "primerTiempo") - porcentajeGoleador(a.general, "primerTiempo")
      || a.nombre.localeCompare(b.nombre));

  if (!jugadores.length) {
    return `<div class="vacio">No hay goles de jugadores disponibles para ${escaparHTML(nombreEquipo)}.</div>`;
  }

  return `
    <div class="tabla-estadisticas-wrapper mercado-jugadores">
      <h4>${escaparHTML(nombreEquipo)}</h4>
      <table class="tabla-estadisticas">
        <thead>
          <tr>
            <th>Jugador</th>
            <th>1er tiempo</th>
            <th>En ambos tiempos</th>
          </tr>
        </thead>
        <tbody>
          ${jugadores.map((jugador) => `
            <tr>
              <td>
                ${escaparHTML(jugador.nombre)}<br>
                <small>${escaparHTML(etiquetaLocalidad)}: ${jugador.localidad?.partidos || 0} partidos<br>General: ${jugador.general?.partidos || 0} partidos</small>
              </td>
              <td>${formatearProbabilidadGoleador(jugador, "primerTiempo", etiquetaLocalidad)}</td>
              <td>${formatearProbabilidadGoleador(jugador, "ambosTiempos", etiquetaLocalidad)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}


function resumirGoleadoresJugadores(partidos, equipoId) {
  const jugadores = new Map();

  (partidos || []).forEach((partido) => {
    const lado = obtenerLadoEquipoPartido(partido, equipoId);
    if (!lado) return;
    const lista = partido?.estadisticas?.jugadores?.[lado];
    if (!Array.isArray(lista)) return;

    lista.forEach((jugador) => {
      const minutos = Number(jugador?.minutesPlayed);
      if (!Number.isFinite(minutos) || minutos <= 0) return;

      const nombre = jugador?.jugador || "Jugador sin nombre";
      const clave = jugador?.player_id != null
        ? `id:${jugador.player_id}`
        : `nombre:${normalizarTextoJugador(nombre)}`;
      const actual = jugadores.get(clave) || {
        clave,
        nombre,
        partidos: 0,
        goles: 0,
        golesPorPartido: [],
        anota: 0,
        primerGol: 0,
        primerGolEquipo: 0,
        ultimoGol: 0,
        primerTiempo: 0,
        ambosTiempos: 0,
      };

      const goles = Number(jugador?.goles) || 0;
      actual.partidos += 1;
      actual.goles += goles;
      actual.golesPorPartido.push(goles);
      actual.anota += goles > 0 ? 1 : 0;
      actual.primerGol += jugador?.primer_gol_partido ? 1 : 0;
      actual.primerGolEquipo += jugador?.primer_gol_equipo ? 1 : 0;
      actual.ultimoGol += jugador?.ultimo_gol_partido ? 1 : 0;
      actual.primerTiempo += (Number(jugador?.goles_1T) || 0) > 0 ? 1 : 0;
      actual.ambosTiempos += jugador?.anoto_ambos_tiempos ? 1 : 0;
      jugadores.set(clave, actual);
    });
  });

  return [...jugadores.values()];
}


function porcentajeGoleador(jugador, campo) {
  if (!jugador?.partidos) return 0;
  return (jugador[campo] / jugador.partidos) * 100;
}


function formatearProbabilidadGoleador(jugador, campo, etiquetaLocalidad) {
  const localidad = jugador.localidad;
  const general = jugador.general;

  return `
    <small>Combinada</small><br>
    ${formatearPorcentajePonderadoJugador(jugador, (dato) => porcentajeGoleador(dato, campo))}%<br>
    <small>${escaparHTML(etiquetaLocalidad)}</small><br>
    ${Math.round(porcentajeGoleador(localidad, campo))}%<br>
    <small>General</small><br>
    ${Math.round(porcentajeGoleador(general, campo))}%
  `;
}


function crearMercadoAtajadasPorteros(resultado, nombreLocal, nombreVisitante) {
  return crearMercadoTirosJugadores(
    resultado,
    nombreLocal,
    nombreVisitante,
    "saves",
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    true,
  );
}


function crearMercadoAsistenciasJugadores(resultado, nombreLocal, nombreVisitante) {
  return `
    ${crearMercadoTirosJugadores(
      resultado,
      nombreLocal,
      nombreVisitante,
      "goalAssist",
      [1, 2, 3, 4],
    )}

  `;
}


function crearMercadoCombinacionesAsistencias(resultado, nombreLocal, nombreVisitante) {
  return `
    ${crearTablaCombinacionesAsistenciasEquipo(
      nombreLocal,
      resultado?.equipo_local?.partidos_general || [],
      resultado?.equipo_local?.partidos_local || [],
      resultado?.equipo_local?.id,
      "Como local",
    )}
    ${crearTablaCombinacionesAsistenciasEquipo(
      nombreVisitante,
      resultado?.equipo_visitante?.partidos_general || [],
      resultado?.equipo_visitante?.partidos_visitante || [],
      resultado?.equipo_visitante?.id,
      "Como visitante",
    )}
  `;
}


function crearTablaCombinacionesAsistenciasEquipo(
  nombreEquipo,
  partidosGeneral,
  partidosLocalidad,
  equipoId,
  etiquetaLocalidad,
) {
  const asistentesGeneral = resumirAnotaOAsisteJugadores(
    partidosGeneral,
    equipoId,
  );
  const asistentesLocalidad = resumirAnotaOAsisteJugadores(
    partidosLocalidad,
    equipoId,
  );
  const candidatos = obtenerCandidatosAsistencias(
    asistentesGeneral,
    asistentesLocalidad,
  );
  const combinaciones = [];

  for (let indiceA = 0; indiceA < candidatos.length; indiceA += 1) {
    for (let indiceB = indiceA + 1; indiceB < candidatos.length; indiceB += 1) {
      const jugadorA = candidatos[indiceA];
      const jugadorB = candidatos[indiceB];
      const claves = [jugadorA.clave, jugadorB.clave];

      combinaciones.push({
        etiqueta: `${jugadorA.nombre} o ${jugadorB.nombre}`,
        localidad: calcularCombinacionAsistencias(
          partidosLocalidad,
          equipoId,
          claves,
        ),
        general: calcularCombinacionAsistencias(
          partidosGeneral,
          equipoId,
          claves,
        ),
      });
    }
  }

  combinaciones.sort((a, b) => porcentajePonderadoMuestras(b.localidad, b.general)
    - porcentajePonderadoMuestras(a.localidad, a.general)
    || b.general.porcentaje - a.general.porcentaje
    || b.localidad.partidos - a.localidad.partidos
    || b.general.partidos - a.general.partidos
    || a.etiqueta.localeCompare(b.etiqueta));

  if (!combinaciones.length) {
    return `<div class="vacio">No hay suficientes asistentes con historial para crear combinaciones de ${escaparHTML(nombreEquipo)}.</div>`;
  }

  return `
    <div class="tabla-estadisticas-wrapper mercado-jugadores">
      <h4>
        ${escaparHTML(nombreEquipo)}
        <span>${escaparHTML(etiquetaLocalidad)}</span>
      </h4>
      <table class="tabla-estadisticas">
        <thead>
          <tr>
            <th>Combinación</th>
            <th>Probabilidad</th>
          </tr>
        </thead>
        <tbody>
        ${combinaciones.map((combinacion) => `
          <tr><!--
            title="${escaparHTML(etiquetaLocalidad)}: ${formatearPorcentajeEntero(combinacion.localidad.porcentaje)} en ${combinacion.localidad.partidos} partidos. General: ${formatearPorcentajeEntero(combinacion.general.porcentaje)} en ${combinacion.general.partidos} partidos."
          >
            --><td>${escaparHTML(combinacion.etiqueta)}</td>
            <td>
              <small>Combinada</small><br>
              ${formatearPorcentajeEntero(porcentajePonderadoMuestras(combinacion.localidad, combinacion.general))}<br>
              <small>${escaparHTML(etiquetaLocalidad)} · ${combinacion.localidad.partidos} partidos</small><br>
              ${formatearPorcentajeEntero(combinacion.localidad.porcentaje)}<br>
              <small>General · ${combinacion.general.partidos} partidos</small><br>
              ${formatearPorcentajeEntero(combinacion.general.porcentaje)}
            </td>
          </tr>
        `).join("")}
        </tbody>
      </table>
    </div>
  `;
}


function obtenerCandidatosAsistencias(asistentesGeneral, asistentesLocalidad) {
  const candidatosPorClave = new Map();

  asistentesGeneral.forEach((jugador) => {
    candidatosPorClave.set(jugador.clave, {
      clave: jugador.clave,
      nombre: jugador.nombre,
      general: jugador,
      localidad: null,
    });
  });

  asistentesLocalidad.forEach((jugador) => {
    const actual = candidatosPorClave.get(jugador.clave) || {
      clave: jugador.clave,
      nombre: jugador.nombre,
      general: null,
      localidad: null,
    };
    actual.localidad = jugador;
    candidatosPorClave.set(jugador.clave, actual);
  });

  return [...candidatosPorClave.values()]
    .filter((jugador) => porcentajeTirosAlArcoJugadorNumero(jugador.general, 1) > 0
      || porcentajeTirosAlArcoJugadorNumero(jugador.localidad, 1) > 0)
    .sort((a, b) => porcentajePonderadoJugador(b, (dato) => porcentajeTirosAlArcoJugadorNumero(dato, 1))
      - porcentajePonderadoJugador(a, (dato) => porcentajeTirosAlArcoJugadorNumero(dato, 1))
      || porcentajeTirosAlArcoJugadorNumero(b.general, 1)
      - porcentajeTirosAlArcoJugadorNumero(a.general, 1)
      || (b.localidad?.partidos || 0) - (a.localidad?.partidos || 0)
      || (b.general?.partidos || 0) - (a.general?.partidos || 0)
      || a.nombre.localeCompare(b.nombre))
    .slice(0, 5);
}


function resumirAnotaOAsisteJugadores(partidos, equipoId) {
  const jugadores = new Map();

  (partidos || []).forEach((partido) => {
    const lado = obtenerLadoEquipoPartido(partido, equipoId);

    if (!lado) {
      return;
    }
    const lista = partido?.estadisticas?.jugadores?.[lado];

    if (!Array.isArray(lista)) {
      return;
    }

    lista.forEach((jugador) => {
      const minutos = Number(jugador?.minutesPlayed);

      if (!Number.isFinite(minutos) || minutos <= 0) {
        return;
      }

      const nombre = jugador?.jugador || "Jugador sin nombre";
      const clave = jugador?.player_id != null
        ? `id:${jugador.player_id}`
        : `nombre:${normalizarTextoJugador(nombre)}`;
      const actual = jugadores.get(clave) || {
        clave,
        nombre,
        partidos: 0,
        tiros: [],
      };

      actual.partidos += 1;
      actual.tiros.push(
        Number(jugador?.goles) >= 1 ||
        Number(jugador?.goalAssist) >= 1
          ? 1
          : 0,
      );
      jugadores.set(clave, actual);
    });
  });

  return [...jugadores.values()]
    .sort((a, b) => b.partidos - a.partidos || a.nombre.localeCompare(b.nombre));
}


function calcularCombinacionAsistencias(partidos, equipoId, clavesJugadores) {
  let validos = 0;
  let acertados = 0;

  (partidos || []).forEach((partido) => {
    const lado = obtenerLadoEquipoPartido(partido, equipoId);
    if (!lado) return;
    const jugadores = partido?.estadisticas?.jugadores?.[lado];
    if (!Array.isArray(jugadores)) return;

    const participantes = jugadores.filter((jugador) => {
      const minutos = Number(jugador?.minutesPlayed);
      if (!Number.isFinite(minutos) || minutos <= 0) return false;

      const clave = jugador?.player_id != null
        ? `id:${jugador.player_id}`
        : `nombre:${normalizarTextoJugador(jugador?.jugador)}`;
      return clavesJugadores.includes(clave);
    });

    if (!participantes.length) return;

    validos += 1;
    if (participantes.some((jugador) => (
      Number(jugador?.goles) >= 1 ||
      Number(jugador?.goalAssist) >= 1
    ))) {
      acertados += 1;
    }
  });

  return {
    partidos: validos,
    porcentaje: validos ? (acertados / validos) * 100 : 0,
  };
}


function formatearPorcentajeEntero(porcentaje) {
  return `${Math.round(porcentaje || 0)}%`;
}


function crearMercadoAsistenciasJugadoresAnterior(resultado, nombreLocal, nombreVisitante) {
  return crearMercadoTirosJugadores(
    resultado,
    nombreLocal,
    nombreVisitante,
    "goalAssist",
    [1, 2, 3, 4],
  );
}


function crearMercadoTirosJugadores(
  resultado,
  nombreLocal,
  nombreVisitante,
  campoEstadistica,
  lineas,
  soloPorteros = false,
) {
  const jugadoresLocalGeneral = resumirTirosAlArcoJugadores(
    resultado?.equipo_local?.partidos_general || [],
    resultado?.equipo_local?.id,
    campoEstadistica,
    soloPorteros,
  );
  const jugadoresLocalCasa = resumirTirosAlArcoJugadores(
    resultado?.equipo_local?.partidos_local || [],
    resultado?.equipo_local?.id,
    campoEstadistica,
    soloPorteros,
  );
  const jugadoresVisitanteGeneral = resumirTirosAlArcoJugadores(
    resultado?.equipo_visitante?.partidos_general || [],
    resultado?.equipo_visitante?.id,
    campoEstadistica,
    soloPorteros,
  );
  const jugadoresVisitanteFuera = resumirTirosAlArcoJugadores(
    resultado?.equipo_visitante?.partidos_visitante || [],
    resultado?.equipo_visitante?.id,
    campoEstadistica,
    soloPorteros,
  );

  return `
    ${crearTablaTirosAlArcoEquipo(
      nombreLocal,
      jugadoresLocalGeneral,
      jugadoresLocalCasa,
      "Como local",
      lineas,
    )}
    ${crearTablaTirosAlArcoEquipo(
      nombreVisitante,
      jugadoresVisitanteGeneral,
      jugadoresVisitanteFuera,
      "Como visitante",
      lineas,
    )}
  `;
}


function resumirTirosAlArcoJugadores(
  partidos,
  equipoId,
  campoEstadistica,
  soloPorteros = false,
) {
  const jugadores = new Map();

  (partidos || []).forEach((partido) => {
    const lado = obtenerLadoEquipoPartido(partido, equipoId);
    if (!lado) return;
    const lista = partido?.estadisticas?.jugadores?.[lado];
    if (!Array.isArray(lista)) return;

    lista.forEach((jugador) => {
      const posicion = String(jugador?.posicion || "").toUpperCase();
      if (soloPorteros && posicion !== "G") return;

      const minutos = Number(jugador?.minutesPlayed);
      if (!Number.isFinite(minutos) || minutos <= 0) return;

      const nombre = jugador?.jugador || "Jugador sin nombre";
      const clave = jugador?.player_id != null
        ? `id:${jugador.player_id}`
        : `nombre:${normalizarTextoJugador(nombre)}`;
      const actual = jugadores.get(clave) || {
        clave,
        nombre,
        partidos: 0,
        tiros: [],
      };
      const tiros = Number(jugador?.[campoEstadistica]);
      actual.partidos += 1;
      actual.tiros.push(Number.isFinite(tiros) ? tiros : 0);
      jugadores.set(clave, actual);
    });
  });

  return [...jugadores.values()]
    .sort((a, b) => b.partidos - a.partidos || a.nombre.localeCompare(b.nombre));
}


function normalizarTextoJugador(texto) {
  return String(texto || "").trim().toLocaleLowerCase();
}


function crearTablaTirosAlArcoEquipo(
  nombreEquipo,
  jugadoresGeneral,
  jugadoresLocalidad,
  etiquetaLocalidad,
  lineas,
) {
  const lineaOrden = lineas[0] || 1;

  const jugadoresPorClave = new Map();

  jugadoresGeneral.forEach((jugador) => {
    jugadoresPorClave.set(jugador.clave, {
      nombre: jugador.nombre,
      general: jugador,
      localidad: null,
    });
  });

  jugadoresLocalidad.forEach((jugador) => {
    const actual = jugadoresPorClave.get(jugador.clave) || {
      nombre: jugador.nombre,
      general: null,
      localidad: null,
    };
    actual.localidad = jugador;
    jugadoresPorClave.set(jugador.clave, actual);
  });

  const jugadores = [...jugadoresPorClave.values()]
    .sort((a, b) => {
      const porcentajePonderadoA = porcentajePonderadoJugador(
        a,
        (dato) => porcentajeTirosAlArcoJugadorNumero(dato, lineaOrden),
      );
      const porcentajePonderadoB = porcentajePonderadoJugador(
        b,
        (dato) => porcentajeTirosAlArcoJugadorNumero(dato, lineaOrden),
      );
      const porcentajeGeneralA = porcentajeTirosAlArcoJugadorNumero(
        a.general,
        lineaOrden,
      );
      const porcentajeGeneralB = porcentajeTirosAlArcoJugadorNumero(
        b.general,
        lineaOrden,
      );
      const partidosA = a.general?.partidos || 0;
      const partidosB = b.general?.partidos || 0;
      const partidosLocalidadA = a.localidad?.partidos || 0;
      const partidosLocalidadB = b.localidad?.partidos || 0;

      return porcentajePonderadoB - porcentajePonderadoA
        || porcentajeGeneralB - porcentajeGeneralA
        || partidosLocalidadB - partidosLocalidadA
        || partidosB - partidosA
        || a.nombre.localeCompare(b.nombre);
    });

  if (!jugadores.length) {
    return `<div class="vacio">No hay estadísticas de jugadores disponibles para ${escaparHTML(nombreEquipo)}.</div>`;
  }

  return `
    <div class="tabla-estadisticas-wrapper mercado-jugadores">
      <h4>${escaparHTML(nombreEquipo)}</h4>
      <table class="tabla-estadisticas">
        <thead>
          <tr>
            <th>Jugador</th>
            ${lineas.map((linea) => `<th>${linea}+</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${jugadores.map((jugador) => `
            <tr>
              <td>
                ${escaparHTML(jugador.nombre)}<br>
                <small>
                  ${escaparHTML(etiquetaLocalidad)}: ${jugador.localidad?.partidos || 0} partidos<br>
                  General: ${jugador.general?.partidos || 0} partidos
                </small>
              </td>
              ${lineas.map((linea) => `
                <td>
                  <small>Combinada</small><br>
                  ${formatearPorcentajePonderadoJugador(
                    jugador,
                    (dato) => porcentajeTirosAlArcoJugadorNumero(dato, linea),
                  )}%<br>
                  <small>${escaparHTML(etiquetaLocalidad)}</small><br>
                  ${porcentajeTirosAlArcoJugador(jugador.localidad, linea)}<br>
                  <small>General</small><br>
                  ${porcentajeTirosAlArcoJugador(jugador.general, linea)}
                </td>
              `).join("")}
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}


function porcentajeTirosAlArcoJugador(jugador, linea) {
  return `${Math.round(porcentajeTirosAlArcoJugadorNumero(jugador, linea))}%`;
}


function porcentajeTirosAlArcoJugadorNumero(jugador, linea) {
  if (!jugador || !jugador.partidos) {
    return 0;
  }

  const acertados = jugador.tiros
    .filter((tiros) => tiros >= linea)
    .length;

  return (acertados / jugador.partidos) * 100;
}


function porcentajePonderadoJugador(jugador, obtenerPorcentaje) {
  const porcentajeGeneral = obtenerPorcentaje(jugador?.general);
  const porcentajeLocalidad = obtenerPorcentaje(jugador.localidad);
  return porcentajePonderadoMuestras(
    {
      porcentaje: porcentajeLocalidad,
      partidos: jugador?.localidad?.partidos,
    },
    {
      porcentaje: porcentajeGeneral,
      partidos: jugador?.general?.partidos,
    },
  );
}


function porcentajePonderadoMuestras(localidad, general) {
  const porcentajeGeneral = Number(general?.porcentaje) || 0;
  const partidosLocalidad = Number(localidad?.partidos) || 0;
  const partidosGeneral = Number(general?.partidos) || 0;

  if (!partidosLocalidad) {
    return porcentajeGeneral;
  }

  const porcentajeLocalidad = Number(localidad?.porcentaje) || 0;
  const partidosGeneralExclusivos = Math.max(
    0,
    partidosGeneral - partidosLocalidad,
  );

  if (!partidosGeneralExclusivos) {
    return porcentajeLocalidad;
  }

  const aciertosGeneral = (porcentajeGeneral / 100) * partidosGeneral;
  const aciertosLocalidad = (porcentajeLocalidad / 100) * partidosLocalidad;
  const aciertosGeneralExclusivos = Math.max(
    0,
    aciertosGeneral - aciertosLocalidad,
  );
  const porcentajeGeneralExclusivo = (
    aciertosGeneralExclusivos / partidosGeneralExclusivos
  ) * 100;

  return (
    (porcentajeLocalidad * partidosLocalidad)
    + (porcentajeGeneralExclusivo * partidosGeneralExclusivos)
  ) / (partidosLocalidad + partidosGeneralExclusivos);
}


function formatearPorcentajePonderadoJugador(jugador, obtenerPorcentaje) {
  return Math.round(porcentajePonderadoJugador(jugador, obtenerPorcentaje));
}


// ============================================================
// MERCADOS DE HÁNDICAP
// ============================================================

function crearMercadosHandicap(resultado, local, visitante) {
  return `
    <h3 class="subtitulo-mercado">Hándicap Resultado del Partido</h3>
    ${crearTablaHandicapResultado(resultado, local, visitante, "FT", 4)}

    <h3 class="subtitulo-mercado">Hándicap Primer Tiempo</h3>
    ${crearTablaHandicapResultado(resultado, local, visitante, "1ST", 2)}
  `;
}


function crearTablaHandicapResultado(resultado, local, visitante, periodo, maximo) {
  const columnas = obtenerColumnasHistoricasMercados(resultado, local, visitante);
  const lineas = [];
  for (let handicap = -maximo; handicap <= maximo; handicap += 1) {
    if (handicap !== 0) {
      lineas.push(handicap);
    }
  }

  const etiquetaHandicap = (valor) => valor > 0 ? `+${valor}` : String(valor);
  const crearFila = (handicap, resultadoEsperado, etiqueta, handicapVisible = handicap) => `
    <tr>
      <td>${escaparHTML(etiqueta)} ${etiquetaHandicap(handicapVisible)}</td>
      ${columnas.map((columna) => `
        <td>${porcentajeHandicapResultado(
          columna.partidos,
          columna.equipoId,
          handicap,
          resultadoEsperado,
          periodo,
          resultado,
        )}</td>
      `).join("")}
    </tr>
  `;

  return `
    <div class="tabla-estadisticas-wrapper">
      <table class="tabla-estadisticas">
        <thead>
          <tr><th>Mercado</th>${crearEncabezadosColumnasMercados(columnas)}</tr>
        </thead>
        <tbody>
          ${lineas.map((handicap) => `
            ${crearFila(handicap, "local", `${local}`)}
            ${crearFila(handicap, "empate", "Empate")}
            ${crearFila(handicap, "visitante", `${visitante}`)}
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}


function porcentajeHandicapResultado(
  partidos,
  equipoId,
  handicap,
  resultadoEsperado,
  periodo,
  resultadoMercado,
) {
  let validos = 0;
  let acertados = 0;
  (partidos || []).forEach((partido) => {
    const goles = periodo === "FT"
      ? { local: Number(partido?.marcador_local), visitante: Number(partido?.marcador_visitante) }
      : obtenerGolesPorPeriodo(partido, periodo);

    if (!goles || !Number.isFinite(goles.local) || !Number.isFinite(goles.visitante)) return;
    validos += 1;
    // En la columna de empate se conserva el hándicap del local, igual que
    // en el mercado europeo de tres resultados.
    const equipoConHandicap = resultadoEsperado === "visitante"
      ? resultadoMercado?.equipo_visitante?.id
      : resultadoMercado?.equipo_local?.id;

    const esEquipoDelMercado = Number(equipoId) === Number(equipoConHandicap);

    const ladoEquipo = obtenerLadoEquipoPartido(partido, equipoId);
    if (!ladoEquipo) return;
    const ladoRival = ladoEquipo === "local" ? "visitante" : "local";
    const golesEquipo = goles[ladoEquipo];
    const golesRival = goles[ladoRival];

    // El hándicap se aplica al equipo del mercado. Cuando la columna es del
    // rival, el mismo ajuste se aplica al rival de ese historial.
    const golesEquipoAjustados = golesEquipo + (esEquipoDelMercado ? handicap : 0);
    const golesRivalAjustados = golesRival + (esEquipoDelMercado ? 0 : handicap);
    const resultadoEquipo = golesEquipoAjustados > golesRivalAjustados
      ? "gana"
      : golesEquipoAjustados < golesRivalAjustados
        ? "pierde"
        : "empata";

    const esperado = resultadoEsperado === "empate"
      ? "empata"
      : esEquipoDelMercado
        ? "gana"
        : "pierde";

    if (resultadoEquipo === esperado) acertados += 1;
  });
  return porcentajeMercado(acertados, validos);
}


// ============================================================
// MERCADOS ESPECIALES
// ============================================================

function crearMercadosEspeciales(resultado, local, visitante) {
  const siNo = [["Sí", true], ["No", false]];
  const margenes = [
    [`${local} gana por exactamente 1 gol`, ["local", 1]],
    [`${local} gana por 2 goles exactamente`, ["local", 2]],
    [`${local} gana por 3 goles o más`, ["local", 3]],
    ["Empate", ["empate", 0]],
    [`${visitante} gana por exactamente 1 gol`, ["visitante", 1]],
    [`${visitante} gana por 2 goles exactamente`, ["visitante", 2]],
    [`${visitante} gana por 3 goles o más`, ["visitante", 3]],
  ];
  const curso = [
    [`${local} anota primero y gana`, ["local", "equipo"]],
    [`${local} anota primero y empata`, ["local", "empate"]],
    [`${local} anota primero y pierde`, ["local", "rival"]],
    [`${visitante} anota primero y gana`, ["visitante", "equipo"]],
    [`${visitante} anota primero y empata`, ["visitante", "empate"]],
    [`${visitante} anota primero y pierde`, ["visitante", "rival"]],
    ["Sin goles", ["sin_goles", null]],
  ];

  return `
    <h3 class="subtitulo-mercado">Penal concedido</h3>
    ${crearTablaEspecial(resultado, local, visitante, siNo, (p, id, opcion) =>
      (obtenerTotalEventoEspecial(p, "FT", "timeline:penales_causados") > 0) === opcion)}

    <h3 class="subtitulo-mercado">Autogol</h3>
    ${crearTablaEspecial(resultado, local, visitante, siNo, (p, id, opcion) =>
      (obtenerTotalEventoEspecial(p, "FT", "timeline:autogoles") > 0) === opcion)}

    <h3 class="subtitulo-mercado">Margen del Triunfo</h3>
    ${crearTablaEspecial(resultado, local, visitante, margenes, (p, id, opcion) =>
      coincideMargenTriunfo(resultado, p, id, opcion[0], opcion[1]))}

    <h3 class="subtitulo-mercado">Penal concedido Primer Tiempo</h3>
    ${crearTablaEspecial(resultado, local, visitante, siNo, (p, id, opcion) =>
      (obtenerTotalEventoEspecial(p, "1ST", "timeline:penales_causados") > 0) === opcion)}

    <h3 class="subtitulo-mercado">${escaparHTML(local)} Penal concedido</h3>
    ${crearTablaEspecial(resultado, local, visitante, [["Sí", true]], (p, id, opcion) =>
      tienePenalConcedidoEquipo(p, id) === opcion, "local")}

    <h3 class="subtitulo-mercado">${escaparHTML(visitante)} Penal concedido</h3>
    ${crearTablaEspecial(resultado, local, visitante, [["Sí", true]], (p, id, opcion) =>
      tienePenalConcedidoEquipo(p, id) === opcion, "visitante")}

    <h3 class="subtitulo-mercado">Dos penales concedidos</h3>
    ${crearTablaEspecial(resultado, local, visitante, [["Sí", true]], (p, id, opcion) =>
      (obtenerTotalEventoEspecial(p, "FT", "timeline:penales_causados") >= 2) === opcion)}

    <h3 class="subtitulo-mercado">Ambos equipos ganan un penal</h3>
    ${crearTablaEspecial(resultado, local, visitante, [["Sí", true]], (p, id, opcion) =>
      ambosEquiposTienenPenal(p) === opcion)}

    <h3 class="subtitulo-mercado">Curso del juego</h3>
    ${crearTablaEspecial(resultado, local, visitante, curso, (p, id, opcion) =>
      coincideCursoJuego(resultado, p, id, opcion))}
  `;
}


function crearTablaEspecial(resultado, local, visitante, opciones, evaluar, objetivo) {
  const todas = obtenerColumnasHistoricasMercados(resultado, local, visitante);
  const columnas = objetivo === "local" ? todas.slice(0, 2) : objetivo === "visitante" ? todas.slice(2) : todas;
  return `<div class="tabla-estadisticas-wrapper"><table class="tabla-estadisticas"><thead><tr><th>Mercado</th>${crearEncabezadosColumnasMercados(columnas)}</tr></thead><tbody>${opciones.map(([etiqueta, opcion]) => `<tr><td>${escaparHTML(etiqueta)}</td>${columnas.map((columna) => `<td>${porcentajeEspecial(columna.partidos, columna.equipoId, opcion, evaluar)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}


function porcentajeEspecial(partidos, equipoId, opcion, evaluar) {
  let validos = 0;
  let acertados = 0;
  (partidos || []).forEach((partido) => {
    if (!Array.isArray(partido?.estadisticas?.periodos)) return;
    validos += 1;
    if (evaluar(partido, equipoId, opcion)) acertados += 1;
  });
  return porcentajeMercado(acertados, validos);
}


function obtenerTotalEventoEspecial(partido, periodo, clave) {
  const dato = obtenerEstadisticaPartido(partido, periodo, clave);
  return dato ? dato.local + dato.visitante : 0;
}


function tienePenalConcedidoEquipo(partido, equipoId) {
  const dato = obtenerEstadisticaPartido(partido, "FT", "timeline:penales_causados");
  const lado = obtenerLadoEquipoPartido(partido, equipoId);
  if (!dato || !lado) return false;
  return dato[lado] > 0;
}


function ambosEquiposTienenPenal(partido) {
  const dato = obtenerEstadisticaPartido(partido, "FT", "timeline:penales_causados");
  return Boolean(dato && dato.local > 0 && dato.visitante > 0);
}


function coincideMargenTriunfo(resultadoMercado, partido, equipoId, equipoMercado, margen) {
  const golesEquipo = obtenerGolesEquipo(partido, equipoId);
  const golesRival = obtenerGolesRecibidosEquipo(partido, equipoId);

  if (!Number.isFinite(golesEquipo) || !Number.isFinite(golesRival)) {
    return false;
  }

  const diferencia = Math.abs(golesEquipo - golesRival);
  if (equipoMercado === "empate") return diferencia === 0;

  const ladoDelSujeto = resultadoEsperadoParaEquipo(
    resultadoMercado,
    equipoId,
    equipoMercado,
  );
  const sujetoGana = ladoDelSujeto === "equipo"
    ? golesEquipo > golesRival
    : golesRival > golesEquipo;

  return sujetoGana && (margen === 3 ? diferencia >= 3 : diferencia === margen);
}


function coincideCursoJuego(resultado, partido, equipoId, opcion) {
  const primero = obtenerEstadoPrimerGol(partido, equipoId);
  if (opcion[0] === "sin_goles") return primero === "sin_goles";

  // La opción se expresa desde el próximo partido (local o visitante), pero
  // `partido.resultado` está expresado desde la perspectiva del equipo de la
  // columna histórica. Convertimos ambos eventos a esa misma perspectiva.
  const ladoDelSujeto = resultadoEsperadoParaEquipo(
    resultado,
    equipoId,
    opcion[0],
  );

  let resultadoEsperado;

  if (opcion[1] === "empate") {
    resultadoEsperado = "Empate";
  } else {
    const sujetoGana = opcion[1] === "equipo";
    const equipoDeLaColumnaGana = ladoDelSujeto === "equipo"
      ? sujetoGana
      : !sujetoGana;
    resultadoEsperado = equipoDeLaColumnaGana ? "Victoria" : "Derrota";
  }

  return primero === ladoDelSujeto
    && partido?.resultado === resultadoEsperado;
}


// ============================================================
// MERCADOS DE MEDIO TIEMPO
// ============================================================

function crearMercadosMedioTiempo(resultado, local, visitante) {
  const opcionesResultado = [
    [local, "local"],
    ["Empate", "empate"],
    [visitante, "visitante"],
  ];

  const opcionesDoble = [
    [`${local} o Empate`, ["local", "empate"]],
    [`${local} o ${visitante}`, ["local", "visitante"]],
    [`${visitante} o Empate`, ["visitante", "empate"]],
  ];

  const opcionesMedioCompleto = [
    [`${local} / ${local}`, ["local", "local"]],
    [`${local} / Empate`, ["local", "empate"]],
    [`${local} / ${visitante}`, ["local", "visitante"]],
    [`Empate / ${local}`, ["empate", "local"]],
    ["Empate / Empate", ["empate", "empate"]],
    [`Empate / ${visitante}`, ["empate", "visitante"]],
    [`${visitante} / ${local}`, ["visitante", "local"]],
    [`${visitante} / Empate`, ["visitante", "empate"]],
    [`${visitante} / ${visitante}`, ["visitante", "visitante"]],
  ];

  const opcionesDobleMedioCompleto = opcionesDoble.flatMap(([etiqueta1, valores1]) =>
    opcionesDoble.map(([etiqueta2, valores2]) => [
      `${etiqueta1} / ${etiqueta2}`,
      [valores1, valores2],
    ])
  );

  return `
    <h3 class="subtitulo-mercado">Resultado Primer Tiempo</h3>
    ${crearTablaMedioTiempo(resultado, local, visitante, opcionesResultado, (p, id, opcion) =>
      obtenerResultadoPeriodoEquipo(p, id, "1ST") === resultadoEsperadoParaEquipo(resultado, id, opcion))}

    <h3 class="subtitulo-mercado">Primer Tiempo - Doble Oportunidad</h3>
    ${crearTablaMedioTiempo(resultado, local, visitante, opcionesDoble, (p, id, opcion) =>
      opcion
        .map((resultadoMercado) => resultadoEsperadoParaEquipo(resultado, id, resultadoMercado))
        .includes(obtenerResultadoPeriodoEquipo(p, id, "1ST")))}

    <h3 class="subtitulo-mercado">Gana cualquiera de los tiempos</h3>
    ${crearTablaMedioTiempo(resultado, local, visitante, [[local, "local"], [visitante, "visitante"]], (p, id, opcion) => {
      const resultadoEsperado = resultadoEsperadoParaEquipo(resultado, id, opcion);
      return obtenerResultadoPeriodoEquipo(p, id, "1ST") === resultadoEsperado ||
        obtenerResultadoPeriodoEquipo(p, id, "2ND") === resultadoEsperado;
    })}

    <h3 class="subtitulo-mercado">Resultado Medio Tiempo o Tiempo Completo</h3>
    ${crearTablaMedioTiempo(resultado, local, visitante, opcionesMedioCompleto, (p, id, opcion) =>
      obtenerResultadoPeriodoEquipo(p, id, "1ST") === resultadoEsperadoParaEquipo(resultado, id, opcion[0]) &&
      obtenerResultadoPeriodoEquipo(p, id, "FT") === resultadoEsperadoParaEquipo(resultado, id, opcion[1]))}

    <h3 class="subtitulo-mercado">Medio Tiempo/Tiempo Completo - Doble oportunidad</h3>
    ${crearTablaMedioTiempo(resultado, local, visitante, opcionesDobleMedioCompleto, (p, id, opcion) =>
      opcion[0].map((valor) => resultadoEsperadoParaEquipo(resultado, id, valor)).includes(obtenerResultadoPeriodoEquipo(p, id, "1ST")) &&
      opcion[1].map((valor) => resultadoEsperadoParaEquipo(resultado, id, valor)).includes(obtenerResultadoPeriodoEquipo(p, id, "FT")))}

    <h3 class="subtitulo-mercado">Gol anotado en ambos tiempos</h3>
    ${crearTablaMedioTiempo(resultado, local, visitante, [["Sí", true], ["No", false]], (p, id, opcion) =>
      (obtenerTotalGolesPartido(p, "1ST") > 0 && obtenerTotalGolesPartido(p, "2ND") > 0) === opcion)}

    <h3 class="subtitulo-mercado">Ambos equipos anotan en el Primer Tiempo/Segundo Tiempo</h3>
    ${crearTablaMedioTiempo(resultado, local, visitante, [["Sí / Sí", [true, true]], ["Sí / No", [true, false]], ["No / Sí", [false, true]], ["No / No", [false, false]]], (p, id, opcion) =>
      ambosAnotanPeriodo(p, "1ST") === opcion[0] && ambosAnotanPeriodo(p, "2ND") === opcion[1])}

    <h3 class="subtitulo-mercado">Tiempo con Más Goles</h3>
    ${crearTablaMedioTiempo(resultado, local, visitante, [["Primer Tiempo", "1ST"], ["Segundo Tiempo", "2ND"], ["Empate", "empate"]], (p, id, opcion) =>
      obtenerTiempoConMasGoles(p) === opcion)}

    <h3 class="subtitulo-mercado">${escaparHTML(local)} Gana Ambos Tiempos</h3>
    ${crearTablaMedioTiempo(resultado, local, visitante, [["Sí", true], ["No", false]], (p, id, opcion) =>
      (obtenerResultadoPeriodoEquipo(p, id, "1ST") === "equipo" && obtenerResultadoPeriodoEquipo(p, id, "2ND") === "equipo") === opcion, "local")}

    <h3 class="subtitulo-mercado">${escaparHTML(visitante)} Gana Ambos Tiempos</h3>
    ${crearTablaMedioTiempo(resultado, local, visitante, [["Sí", true], ["No", false]], (p, id, opcion) =>
      (obtenerResultadoPeriodoEquipo(p, id, "1ST") === "equipo" && obtenerResultadoPeriodoEquipo(p, id, "2ND") === "equipo") === opcion, "visitante")}

    <h3 class="subtitulo-mercado">Resultado Segundo Tiempo</h3>
    ${crearTablaMedioTiempo(resultado, local, visitante, opcionesResultado, (p, id, opcion) =>
      obtenerResultadoPeriodoEquipo(p, id, "2ND") === resultadoEsperadoParaEquipo(resultado, id, opcion))}

    <h3 class="subtitulo-mercado">Segundo Tiempo - Doble Oportunidad</h3>
    ${crearTablaMedioTiempo(resultado, local, visitante, opcionesDoble, (p, id, opcion) =>
      opcion
        .map((resultadoMercado) => resultadoEsperadoParaEquipo(resultado, id, resultadoMercado))
        .includes(obtenerResultadoPeriodoEquipo(p, id, "2ND")))}

    <h3 class="subtitulo-mercado">Ambos equipos anotan en el Segundo Tiempo</h3>
    ${crearTablaMedioTiempo(resultado, local, visitante, [["Sí", true], ["No", false]], (p, id, opcion) =>
      ambosAnotanPeriodo(p, "2ND") === opcion)}
  `;
}


function crearTablaMedioTiempo(resultado, local, visitante, opciones, evaluar, objetivo) {
  const todas = obtenerColumnasHistoricasMercados(resultado, local, visitante);
  const columnas = objetivo === "local" ? todas.slice(0, 2) :
    objetivo === "visitante" ? todas.slice(2) : todas;

  return `<div class="tabla-estadisticas-wrapper"><table class="tabla-estadisticas"><thead><tr><th>Mercado</th>${crearEncabezadosColumnasMercados(columnas)}</tr></thead><tbody>${opciones.map(([etiqueta, opcion]) => `<tr><td>${escaparHTML(etiqueta)}</td>${columnas.map((columna) => `<td>${porcentajeMedioTiempo(columna.partidos, columna.equipoId, opcion, evaluar)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}


function porcentajeMedioTiempo(partidos, equipoId, opcion, evaluar) {
  let validos = 0;
  let acertados = 0;
  (partidos || []).forEach((partido) => {
    if (!obtenerGolesPorPeriodo(partido, "1ST") || !obtenerGolesPorPeriodo(partido, "2ND")) return;
    validos += 1;
    if (evaluar(partido, equipoId, opcion)) acertados += 1;
  });
  return porcentajeMercado(acertados, validos);
}


function obtenerGolesPorPeriodo(partido, periodo) {
  return obtenerEstadisticaPartido(partido, periodo, "timeline:goles");
}


function obtenerResultadoPeriodoEquipo(partido, equipoId, periodo) {
  let goles = periodo === "FT"
    ? { local: Number(partido?.marcador_local), visitante: Number(partido?.marcador_visitante) }
    : obtenerGolesPorPeriodo(partido, periodo);
  if (!goles || !Number.isFinite(goles.local) || !Number.isFinite(goles.visitante)) return null;
  const lado = obtenerLadoEquipoPartido(partido, equipoId);
  if (!lado) return null;
  const ladoRival = lado === "local" ? "visitante" : "local";
  const propios = goles[lado];
  const rival = goles[ladoRival];
  return propios > rival ? "equipo" : propios < rival ? "rival" : "empate";
}


// Convierte el resultado absoluto del enfrentamiento (local/empate/visitante)
// a la perspectiva del equipo de cada columna histórica.
function resultadoEsperadoParaEquipo(resultado, equipoId, resultadoMercado) {
  if (resultadoMercado === "empate") return "empate";

  const esEquipoLocal = Number(equipoId) === Number(resultado?.equipo_local?.id);
  const ganaElEquipo =
    (resultadoMercado === "local" && esEquipoLocal) ||
    (resultadoMercado === "visitante" && !esEquipoLocal);

  return ganaElEquipo ? "equipo" : "rival";
}


function ambosAnotanPeriodo(partido, periodo) {
  const goles = obtenerGolesPorPeriodo(partido, periodo);
  return goles ? goles.local > 0 && goles.visitante > 0 : null;
}


function obtenerTiempoConMasGoles(partido) {
  const primero = obtenerTotalGolesPartido(partido, "1ST");
  const segundo = obtenerTotalGolesPartido(partido, "2ND");
  if (primero === null || segundo === null) return null;
  return primero > segundo ? "1ST" : primero < segundo ? "2ND" : "empate";
}


// ============================================================
// PROBABILIDAD COMBINADA
// ============================================================

function agregarProbabilidadCombinada(contenedor, resultado) {
  const pesos = obtenerPesosHistoricosUnicos(resultado);

  contenedor.querySelectorAll(".tabla-estadisticas").forEach((tabla) => {
    const encabezado = tabla.querySelector("thead > tr");
    const filas = [...tabla.querySelectorAll("tbody > tr")];

    // Solo las tablas estándar de equipos tienen las cuatro referencias:
    // local general, local casa, visitante fuera y visitante general.
    if (!encabezado || encabezado.cells.length !== 5 || !filas.length) {
      return;
    }

    const primeraFila = filas[0];
    if (primeraFila.cells.length !== 5) {
      return;
    }

    const nuevaCabecera = document.createElement("th");
    nuevaCabecera.className = "cabecera-probabilidad-combinada";
    nuevaCabecera.innerHTML = "Probabilidad<br>combinada";
    encabezado.append(nuevaCabecera);

    filas.forEach((fila) => {
      const celda = document.createElement("td");
      celda.className = "probabilidad-combinada";
      const porcentajes = [...fila.cells]
        .slice(1, 5)
        .map((celdaHistorica) => extraerPorcentajesCelda(celdaHistorica.textContent)[0]);

      const probabilidad = calcularProbabilidadCombinada(
        porcentajes,
        pesos,
      );

      celda.textContent = probabilidad === null
        ? "N/D"
        : `${formatearPorcentaje(probabilidad)}`;
      celda.dataset.probabilidadCombinada = probabilidad === null
        ? ""
        : String(probabilidad);
      fila.append(celda);
    });

    const cuerpo = tabla.querySelector("tbody");

    if (cuerpo) {
      filas
        .sort((filaA, filaB) => {
          const textoA = filaA.querySelector(
            ".probabilidad-combinada",
          )?.dataset.probabilidadCombinada;
          const textoB = filaB.querySelector(
            ".probabilidad-combinada",
          )?.dataset.probabilidadCombinada;
          const valorA = textoA ? Number(textoA) : Number.NaN;
          const valorB = textoB ? Number(textoB) : Number.NaN;
          const probabilidadA = Number.isFinite(valorA) ? valorA : -1;
          const probabilidadB = Number.isFinite(valorB) ? valorB : -1;

          return probabilidadB - probabilidadA;
        })
        .forEach((fila) => cuerpo.append(fila));
    }
  });
}


function obtenerPesosHistoricosUnicos(resultado) {
  const ids = (partidos) => new Set((partidos || [])
    .map((partido) => partido?.event_id)
    .filter((eventId) => eventId !== null && eventId !== undefined)
    .map(Number));
  const cantidadExclusiva = (general, localidad) => [...general]
    .filter((eventId) => !localidad.has(eventId))
    .length;

  const localGeneral = ids(resultado?.equipo_local?.partidos_general);
  const localCasa = ids(resultado?.equipo_local?.partidos_local);
  const visitanteGeneral = ids(resultado?.equipo_visitante?.partidos_general);
  const visitanteFuera = ids(resultado?.equipo_visitante?.partidos_visitante);

  return {
    localCasa: localCasa.size,
    localGeneralExclusivo: cantidadExclusiva(localGeneral, localCasa),
    visitanteFuera: visitanteFuera.size,
    visitanteGeneralExclusivo: cantidadExclusiva(
      visitanteGeneral,
      visitanteFuera,
    ),
  };
}


function calcularProbabilidadCombinada(porcentajes, pesos) {
  const [localGeneral, localCasa, visitanteFuera, visitanteGeneral] = porcentajes;
  const probabilidadLocal = combinarPorcentajesHistoricos(
    localCasa,
    pesos.localCasa,
    localGeneral,
    pesos.localGeneralExclusivo,
  );
  const probabilidadVisitante = combinarPorcentajesHistoricos(
    visitanteFuera,
    pesos.visitanteFuera,
    visitanteGeneral,
    pesos.visitanteGeneralExclusivo,
  );

  if (probabilidadLocal === null && probabilidadVisitante === null) {
    return null;
  }

  if (probabilidadLocal === null) return probabilidadVisitante;
  if (probabilidadVisitante === null) return probabilidadLocal;

  return (probabilidadLocal + probabilidadVisitante) / 2;
}


function combinarPorcentajesHistoricos(
  porcentajeLocalidad,
  partidosLocalidad,
  porcentajeGeneral,
  partidosGeneralExclusivos,
) {
  const tieneLocalidad = Number.isFinite(porcentajeLocalidad)
    && partidosLocalidad > 0;
  const tieneGeneral = Number.isFinite(porcentajeGeneral)
    && partidosGeneralExclusivos > 0;

  if (!tieneLocalidad && !tieneGeneral) return null;
  if (!tieneLocalidad) return porcentajeGeneral;
  if (!tieneGeneral) return porcentajeLocalidad;

  return (
    (porcentajeLocalidad * partidosLocalidad)
    + (porcentajeGeneral * partidosGeneralExclusivos)
  ) / (partidosLocalidad + partidosGeneralExclusivos);
}


function extraerPorcentajesCelda(texto) {
  return [...String(texto || "").matchAll(/(\d+(?:[.,]\d+)?)%/g)]
    .map((coincidencia) => Number(coincidencia[1].replace(",", ".")))
    .filter(Number.isFinite);
}


function configurarSeccionesColapsables(contenedor) {
  const encabezados = contenedor.querySelectorAll(
    ".mercados-seccion > .titulo-seccion",
  );

  encabezados.forEach((encabezado) => {
    const contenidos = [];
    let elemento = encabezado.nextElementSibling;

    while (elemento && elemento.tagName !== "H2") {
      contenidos.push(elemento);
      elemento = elemento.nextElementSibling;
    }

    if (contenidos.length === 0) {
      return;
    }

    const indicador = document.createElement("span");
    indicador.className = "indicador-seccion";
    indicador.setAttribute("aria-hidden", "true");
    encabezado.append(indicador);

    const alternar = () => {
      const contraida = encabezado.getAttribute("aria-expanded") === "false";
      const expandida = contraida;

      encabezado.setAttribute("aria-expanded", String(expandida));
      contenidos.forEach((contenido) => {
        contenido.hidden = !expandida;
      });
      indicador.textContent = expandida ? "⌃" : "⌄";
    };

    encabezado.classList.add("titulo-seccion-colapsable");
    encabezado.setAttribute("role", "button");
    encabezado.setAttribute("tabindex", "0");
    encabezado.setAttribute("aria-expanded", "false");
    contenidos.forEach((contenido) => {
      contenido.hidden = true;
    });
    indicador.textContent = "⌄";

    encabezado.addEventListener("click", alternar);
    encabezado.addEventListener("keydown", (evento) => {
      if (evento.key === "Enter" || evento.key === " ") {
        evento.preventDefault();
        alternar();
      }
    });
  });
}


function configurarSubmercadosColapsables(contenedor) {
  const encabezados = [...contenedor.querySelectorAll(
    ".mercados-seccion > .subtitulo-mercado",
  )];

  encabezados.forEach((encabezado) => {
    const detalle = document.createElement("details");
    detalle.className = "mercado-jugador-colapsable";

    const resumen = document.createElement("summary");
    resumen.textContent = encabezado.textContent.trim();
    detalle.append(resumen);

    encabezado.before(detalle);
    let elemento = encabezado.nextElementSibling;
    encabezado.remove();

    while (
      elemento
      && elemento.tagName !== "H2"
      && elemento.tagName !== "H3"
    ) {
      const siguiente = elemento.nextElementSibling;
      detalle.append(elemento);
      elemento = siguiente;
    }
  });
}


function configurarMercadosJugadoresColapsables(contenedor) {
  const encabezadoJugadores = [...contenedor.querySelectorAll(
    ".mercados-seccion > .titulo-seccion",
  )].find((encabezado) => encabezado.textContent.trim() === "Jugadores");

  if (!encabezadoJugadores) {
    return;
  }

  const encabezadoEstadisticas = [...encabezadoJugadores.parentElement.children]
    .find((elemento) => (
      elemento.tagName === "H3"
      && elemento.textContent.trim() === "Estadísticas"
    ));

  if (!encabezadoEstadisticas) {
    return;
  }

  const seccionEstadisticas = document.createElement("details");
  seccionEstadisticas.className = "jugadores-estadisticas-colapsable";

  const resumenEstadisticas = document.createElement("summary");
  resumenEstadisticas.textContent = encabezadoEstadisticas.textContent.trim();
  seccionEstadisticas.append(resumenEstadisticas);

  encabezadoEstadisticas.before(seccionEstadisticas);
  let elemento = encabezadoEstadisticas.nextElementSibling;
  encabezadoEstadisticas.remove();

  while (
    elemento
    && elemento.tagName !== "H2"
    && elemento.tagName !== "H3"
  ) {
    const siguiente = elemento.nextElementSibling;
    seccionEstadisticas.append(elemento);
    elemento = siguiente;
  }

  seccionEstadisticas.querySelectorAll(":scope > h4").forEach((encabezado) => {
    const detalle = document.createElement("details");
    detalle.className = "mercado-jugador-colapsable";

    const resumen = document.createElement("summary");
    resumen.textContent = encabezado.textContent.trim();
    detalle.append(resumen);

    encabezado.before(detalle);
    elemento = encabezado.nextElementSibling;
    encabezado.remove();

    while (
      elemento
      && elemento.tagName !== "H2"
      && elemento.tagName !== "H4"
    ) {
      const siguiente = elemento.nextElementSibling;
      detalle.append(elemento);
      elemento = siguiente;
    }
  });
}


function configurarSeccionJugadoresColapsable(contenedor, titulo) {
  const encabezadoSeccion = [...contenedor.querySelectorAll(
    ".mercados-seccion > .subtitulo-mercado",
  )].find((encabezado) => encabezado.textContent.trim() === titulo);

  if (!encabezadoSeccion) {
    return;
  }

  const seccion = document.createElement("details");
  seccion.className = "jugadores-estadisticas-colapsable";

  const resumen = document.createElement("summary");
  resumen.textContent = encabezadoSeccion.textContent.trim();
  seccion.append(resumen);

  encabezadoSeccion.before(seccion);
  let elemento = encabezadoSeccion.nextElementSibling;
  encabezadoSeccion.remove();

  while (
    elemento
    && elemento.tagName !== "H2"
    && elemento.tagName !== "H3"
  ) {
    const siguiente = elemento.nextElementSibling;
    seccion.append(elemento);
    elemento = siguiente;
  }
}


function crearTablaMasMenosCorners(resultado, local, visitante, periodo, tipo, maximo, objetivo) {
  const base=obtenerColumnasHistoricasMercados(resultado,local,visitante);
  const columnas=tipo==="equipo"
    ? obtenerColumnasEquipoYRival(resultado,local,visitante,objetivo)
    : base;
  const lineas=[];for(let linea=.5;linea<=maximo;linea+=1)lineas.push(linea);
  return `<div class="tabla-estadisticas-wrapper"><table class="tabla-estadisticas"><thead><tr><th>Mercado</th>${crearEncabezadosColumnasMercados(columnas)}</tr></thead><tbody>${lineas.map(linea=>`<tr><td>Más ${formatearLinea(linea)}</td>${columnas.map(c=>`<td>${porcentajeCorners(c.partidos,periodo,c.tipoEstadistica||tipo,linea,true,c.equipoId)}</td>`).join("")}</tr><tr><td>Menos ${formatearLinea(linea)}</td>${columnas.map(c=>`<td>${porcentajeCorners(c.partidos,periodo,c.tipoEstadistica||tipo,linea,false,c.equipoId)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}

function crearTablaMasMenosEstadistica(resultado, local, visitante, estadisticaKey, minimo, maximo, objetivo, contarFaltantesComoCero = false, periodo = "FT", paso = 1) {
  const base = obtenerColumnasHistoricasMercados(resultado, local, visitante);
  const columnas = objetivo
    ? obtenerColumnasEquipoYRival(resultado, local, visitante, objetivo)
    : base;
  const lineas = [];

  for (let linea = minimo; linea <= maximo; linea += paso) {
    lineas.push(linea);
  }

  return `
    <div class="tabla-estadisticas-wrapper">
      <table class="tabla-estadisticas">
        <thead><tr><th>Mercado</th>${crearEncabezadosColumnasMercados(columnas)}</tr></thead>
        <tbody>
          ${lineas.map((linea) => `
            <tr>
              <td>Más ${formatearLinea(linea)}</td>
              ${columnas.map((columna) => `<td>${porcentajeEstadistica(
                columna.partidos,
                estadisticaKey,
                linea,
                true,
                columna.equipoId,
                columna.tipoEstadistica || objetivo,
                contarFaltantesComoCero,
                periodo,
              )}</td>`).join("")}
            </tr>
            <tr>
              <td>Menos ${formatearLinea(linea)}</td>
              ${columnas.map((columna) => `<td>${porcentajeEstadistica(
                columna.partidos,
                estadisticaKey,
                linea,
                false,
                columna.equipoId,
                columna.tipoEstadistica || objetivo,
                contarFaltantesComoCero,
                periodo,
              )}</td>`).join("")}
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}


function obtenerColumnasEquipoYRival(resultado, local, visitante, objetivo) {
  const esLocal = objetivo === "local";
  const equipo = esLocal ? resultado?.equipo_local : resultado?.equipo_visitante;
  const rival = esLocal ? resultado?.equipo_visitante : resultado?.equipo_local;
  const nombreEquipo = esLocal ? local : visitante;
  const nombreRival = esLocal ? visitante : local;
  const partidosEquipoLocalidad = esLocal
    ? equipo?.partidos_local || []
    : equipo?.partidos_visitante || [];
  const partidosRivalLocalidad = esLocal
    ? rival?.partidos_visitante || []
    : rival?.partidos_local || [];
  const etiquetaEquipo = esLocal ? "Casa" : "Fuera";
  const etiquetaRival = esLocal ? "Fuera" : "Casa";

  return [
    {
      partidos: equipo?.partidos_general || [],
      equipoId: equipo?.id,
      nombre: nombreEquipo,
      condicion: "General",
      tipoEstadistica: "equipo",
    },
    {
      partidos: partidosEquipoLocalidad,
      equipoId: equipo?.id,
      nombre: nombreEquipo,
      condicion: etiquetaEquipo,
      tipoEstadistica: "equipo",
    },
    {
      partidos: rival?.partidos_general || [],
      equipoId: rival?.id,
      nombre: `Rival de ${nombreRival}`,
      condicion: "General",
      tipoEstadistica: "rival",
    },
    {
      partidos: partidosRivalLocalidad,
      equipoId: rival?.id,
      nombre: `Rival de ${nombreRival}`,
      condicion: etiquetaRival,
      tipoEstadistica: "rival",
    },
  ];
}

function crearTablaEquipoMasCorners(resultado, local, visitante, periodo) {
  const columnas = obtenerColumnasHistoricasMercados(resultado, local, visitante);
  const equipoLocalId = Number(resultado?.equipo_local?.id);

  const filas = [
    { etiqueta: local, resultadoLocal: "equipo", resultadoVisitante: "rival" },
    { etiqueta: "Empate", resultadoLocal: "empate", resultadoVisitante: "empate" },
    { etiqueta: visitante, resultadoLocal: "rival", resultadoVisitante: "equipo" },
  ];

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
          ${filas.map((fila) => `
            <tr>
              <td>${escaparHTML(fila.etiqueta)}</td>
              ${columnas.map((columna) => {
                const esEquipoLocal = Number(columna.equipoId) === equipoLocalId;
                const esperado = esEquipoLocal
                  ? fila.resultadoLocal
                  : fila.resultadoVisitante;

                return `<td>${porcentajeEquipoMasCorners(
                  columna.partidos,
                  periodo,
                  columna.equipoId,
                  esperado,
                )}</td>`;
              }).join("")}
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function crearTablaTiempoConMasCorners(resultado, local, visitante) {
  const columnas = obtenerColumnasHistoricasMercados(resultado, local, visitante);
  const filas = [
    { etiqueta: "Primer Tiempo", esperado: "primer_tiempo" },
    { etiqueta: "Empate", esperado: "empate" },
    { etiqueta: "Segundo Tiempo", esperado: "segundo_tiempo" },
  ];

  return `
    <div class="tabla-estadisticas-wrapper">
      <table class="tabla-estadisticas">
        <thead><tr><th>Mercado</th>${crearEncabezadosColumnasMercados(columnas)}</tr></thead>
        <tbody>
          ${filas.map((fila) => `
            <tr>
              <td>${fila.etiqueta}</td>
              ${columnas.map((columna) => `<td>${porcentajeTiempoConMasCorners(columna.partidos, fila.esperado)}</td>`).join("")}
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function crearTablaRangosCorners(resultado, local, visitante, rangos) {
  const columnas = obtenerColumnasHistoricasMercados(resultado, local, visitante);

  return `
    <div class="tabla-estadisticas-wrapper">
      <table class="tabla-estadisticas">
        <thead><tr><th>Mercado</th>${crearEncabezadosColumnasMercados(columnas)}</tr></thead>
        <tbody>
          ${rangos.map((rango) => `
            <tr>
              <td>${rango.etiqueta}</td>
              ${columnas.map((columna) => `<td>${porcentajeRangoTotalCorners(columna.partidos, rango.minimo, rango.maximo)}</td>`).join("")}
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function crearTablaMarcadorCorrectoCorners(resultado, local, visitante) {
  const columnas = obtenerColumnasHistoricasMercados(resultado, local, visitante);
  const equipoLocalId = Number(resultado?.equipo_local?.id);
  const marcadores = [];

  for (let cornersLocal = 0; cornersLocal <= 10; cornersLocal += 1) {
    for (let cornersVisitante = 0; cornersVisitante <= 10; cornersVisitante += 1) {
      marcadores.push({ local: cornersLocal, visitante: cornersVisitante });
    }
  }

  return `
    <div class="tabla-estadisticas-wrapper">
      <table class="tabla-estadisticas">
        <thead><tr><th>Marcador</th>${crearEncabezadosColumnasMercados(columnas)}</tr></thead>
        <tbody>
          ${marcadores.map((marcador) => `
            <tr>
              <td>${marcador.local}-${marcador.visitante}</td>
              ${columnas.map((columna) => {
                const invertir = Number(columna.equipoId) !== equipoLocalId;
                const cornersEquipo = invertir ? marcador.visitante : marcador.local;
                const cornersRival = invertir ? marcador.local : marcador.visitante;

                return `<td>${porcentajeMarcadorCorrectoCorners(
                  columna.partidos,
                  columna.equipoId,
                  cornersEquipo,
                  cornersRival,
                )}</td>`;
              }).join("")}
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function crearTablaMarcadorCorrectoTarjetas(resultado, local, visitante) {
  const columnas=[
    {partidos:resultado?.equipo_local?.partidos_general||[],equipoId:resultado?.equipo_local?.id,titulo:`${local}<br>General`,invertir:false},
    {partidos:resultado?.equipo_local?.partidos_local||[],equipoId:resultado?.equipo_local?.id,titulo:`${local}<br>Casa`,invertir:false},
    {partidos:resultado?.equipo_visitante?.partidos_visitante||[],equipoId:resultado?.equipo_visitante?.id,titulo:`${visitante}<br>Fuera`,invertir:true},
    {partidos:resultado?.equipo_visitante?.partidos_general||[],equipoId:resultado?.equipo_visitante?.id,titulo:`${visitante}<br>General`,invertir:true},
  ];
  const marcadores=[[1,0],[2,0],[2,1],[3,1],[3,2],[4,2],[4,3],[0,0],[1,1],[2,2],[3,3],[0,1],[0,2],[1,2],[0,3],[1,3],[2,3],[0,4],[1,4],[2,4],[3,4],[1,5],[2,5],[3,5]];
  return `<div class="tabla-estadisticas-wrapper"><table class="tabla-estadisticas"><thead><tr><th>Marcador</th>${columnas.map(c=>`<th>${formatearTituloTarjetas(c.titulo)}</th>`).join("")}</tr></thead><tbody>${marcadores.map(([tarjetasLocal,tarjetasVisitante])=>`<tr><td>${tarjetasLocal}-${tarjetasVisitante}</td>${columnas.map(c=>`<td>${porcentajeMarcadorCorrectoTarjetas(c.partidos,c.equipoId,c.invertir?tarjetasVisitante:tarjetasLocal,c.invertir?tarjetasLocal:tarjetasVisitante)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}

function crearTablaRangosTarjetas(resultado, local, visitante) {
  const columnas=obtenerColumnasHistoricasMercados(resultado,local,visitante);
  const rangos=[{etiqueta:"0",min:0,max:0},{etiqueta:"1-2",min:1,max:2},{etiqueta:"3-4",min:3,max:4},{etiqueta:"5-6",min:5,max:6},{etiqueta:"7-8",min:7,max:8},{etiqueta:"9-10",min:9,max:10},{etiqueta:"11+",min:11,max:null}];
  return `<div class="tabla-estadisticas-wrapper"><table class="tabla-estadisticas"><thead><tr><th>Mercado</th>${crearEncabezadosColumnasMercados(columnas)}</tr></thead><tbody>${rangos.map(r=>`<tr><td>${r.etiqueta}</td>${columnas.map(c=>`<td>${porcentajeRangoTarjetas(c.partidos,r.min,r.max)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}

function crearTablaMedioTiempoTiempoCompletoTarjetas(resultado,local,visitante) {
  const columnas=[
    {partidos:resultado?.equipo_local?.partidos_general||[],equipoId:resultado?.equipo_local?.id,titulo:`${local}<br>General`,equipo:"local",rival:"visitante"},
    {partidos:resultado?.equipo_local?.partidos_local||[],equipoId:resultado?.equipo_local?.id,titulo:`${local}<br>Casa`,equipo:"local",rival:"visitante"},
    {partidos:resultado?.equipo_visitante?.partidos_visitante||[],equipoId:resultado?.equipo_visitante?.id,titulo:`${visitante}<br>Fuera`,equipo:"visitante",rival:"local"},
    {partidos:resultado?.equipo_visitante?.partidos_general||[],equipoId:resultado?.equipo_visitante?.id,titulo:`${visitante}<br>General`,equipo:"visitante",rival:"local"},
  ];
  const opciones=[local,"Empate",visitante];
  const resultadoEsperado = (columna, opcion) => {
    if (opcion === "Empate") return "empate";

    return resultadoEsperadoParaEquipo(
      resultado,
      columna.equipoId,
      opcion === local ? "local" : "visitante",
    );
  };

  return `<div class="tabla-estadisticas-wrapper"><table class="tabla-estadisticas"><thead><tr><th>Medio tiempo / Tiempo completo</th>${columnas.map(c=>`<th>${formatearTituloTarjetas(c.titulo)}</th>`).join("")}</tr></thead><tbody>${opciones.flatMap(primero=>opciones.map(completo=>`<tr><td>${escaparHTML(primero)} / ${escaparHTML(completo)}</td>${columnas.map(c=>`<td>${porcentajeMedioTiempoTiempoCompletoTarjetas(c.partidos,c.equipoId,resultadoEsperado(c,primero),resultadoEsperado(c,completo))}</td>`).join("")}</tr>`)).join("")}</tbody></table></div>`;
}

function crearTablaEventoTarjetas(resultado, local, visitante, tipo, incluirNo) {
  const columnas=obtenerColumnasHistoricasMercados(resultado,local,visitante);
  const filas=incluirNo?["Sí","No"]:["Sí"];
  return tablaTarjetasSimple(columnas,filas,(partidos,opcion)=>porcentajeEventoTarjetas(partidos,tipo,opcion==="Sí"));
}

function crearTablaTarjetasAmbosTiempos(resultado, local, visitante) {
  const columnas=obtenerColumnasHistoricasMercados(resultado,local,visitante);
  return tablaTarjetasSimple(columnas,["Sí","No"],(p,opcion)=>porcentajeTarjetasAmbosTiempos(p,opcion==="Sí"));
}

function crearTablaAmbosEquiposTarjetasAmbosTiempos(resultado, local, visitante) {
  const columnas=obtenerColumnasHistoricasMercados(resultado,local,visitante);
  return tablaTarjetasSimple(columnas,["Sí"],p=>porcentajeAmbosEquiposTarjetasAmbosTiempos(p));
}

function crearTablaTarjetasEquipoSegundoTiempo(resultado,local,visitante,objetivo) {
  const columnas=obtenerColumnasEquipoYRival(resultado,local,visitante,objetivo);
  const lineas=[]; for(let linea=.5;linea<=4.5;linea+=1)lineas.push(linea);
  return `<div class="tabla-estadisticas-wrapper"><table class="tabla-estadisticas"><thead><tr><th>Mercado</th>${crearEncabezadosColumnasMercados(columnas)}</tr></thead><tbody>${lineas.map(linea=>`<tr><td>Más ${formatearLinea(linea)}</td>${columnas.map(c=>`<td>${porcentajeTarjetasEquipoSegundoTiempo(c.partidos,c.equipoId,linea,true,c.tipoEstadistica)}</td>`).join("")}</tr><tr><td>Menos ${formatearLinea(linea)}</td>${columnas.map(c=>`<td>${porcentajeTarjetasEquipoSegundoTiempo(c.partidos,c.equipoId,linea,false,c.tipoEstadistica)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}

function crearTablaProximaTarjeta(resultado, local, visitante) {
  const columnas = [
    { partidos: resultado?.equipo_local?.partidos_general || [], equipoId: resultado?.equipo_local?.id, titulo: `${local}<br>General` },
    { partidos: resultado?.equipo_local?.partidos_local || [], equipoId: resultado?.equipo_local?.id, titulo: `${local}<br>Casa` },
    { partidos: resultado?.equipo_visitante?.partidos_visitante || [], equipoId: resultado?.equipo_visitante?.id, titulo: `${visitante}<br>Fuera` },
    { partidos: resultado?.equipo_visitante?.partidos_general || [], equipoId: resultado?.equipo_visitante?.id, titulo: `${visitante}<br>General` },
  ];
  const filas = [[local, "local"], ["Sin amonestaciones", "sin_tarjetas"], [visitante, "visitante"]];
  return `<div class="tabla-estadisticas-wrapper"><table class="tabla-estadisticas"><thead><tr><th>Mercado</th>${columnas.map(c=>`<th>${c.titulo}</th>`).join("")}</tr></thead><tbody>${filas.map(([etiqueta,estado])=>`<tr><td>${escaparHTML(etiqueta)}</td>${columnas.map(c=>{const esperado=estado==="sin_tarjetas"?estado:resultadoEsperadoParaEquipo(resultado,c.equipoId,estado);return `<td>${porcentajeProximaTarjeta(c.partidos,c.equipoId,esperado)}</td>`;}).join("")}</tr>`).join("")}</tbody></table></div>`;
}

function crearTablaTarjetasEquipoPrimerTiempo(resultado, local, visitante, objetivo) {
  const columnas = obtenerColumnasEquipoYRival(resultado, local, visitante, objetivo);
  const lineas = [];
  for (let linea = 0.5; linea <= 4.5; linea += 1) lineas.push(linea);
  return `<div class="tabla-estadisticas-wrapper"><table class="tabla-estadisticas"><thead><tr><th>Mercado</th>${crearEncabezadosColumnasMercados(columnas)}</tr></thead><tbody>${lineas.map(linea=>`<tr><td>Más ${formatearLinea(linea)}</td>${columnas.map(c=>`<td>${porcentajeTarjetasEquipoPrimerTiempo(c.partidos,c.equipoId,linea,true,c.tipoEstadistica)}</td>`).join("")}</tr><tr><td>Menos ${formatearLinea(linea)}</td>${columnas.map(c=>`<td>${porcentajeTarjetasEquipoPrimerTiempo(c.partidos,c.equipoId,linea,false,c.tipoEstadistica)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}

function crearTablaHandicapTarjetas(resultado, local, visitante) {
  const columnas = obtenerColumnasHistoricasMercados(resultado, local, visitante);
  const opciones = [
    { etiqueta: `${local} -0.5`, equipo: "local", handicap: -0.5 },
    { etiqueta: `${visitante} +0.5`, equipo: "visitante", handicap: 0.5 },
    { etiqueta: `${local} +0.5`, equipo: "local", handicap: 0.5 },
    { etiqueta: `${visitante} -0.5`, equipo: "visitante", handicap: -0.5 },
    { etiqueta: `${local} +1.5`, equipo: "local", handicap: 1.5 },
    { etiqueta: `${visitante} -1.5`, equipo: "visitante", handicap: -1.5 },
    { etiqueta: `${local} +2.5`, equipo: "local", handicap: 2.5 },
    { etiqueta: `${visitante} -2.5`, equipo: "visitante", handicap: -2.5 },
    { etiqueta: `${local} +3.5`, equipo: "local", handicap: 3.5 },
    { etiqueta: `${visitante} -3.5`, equipo: "visitante", handicap: -3.5 },
  ];

  return `<div class="tabla-estadisticas-wrapper"><table class="tabla-estadisticas"><thead><tr><th>Mercado</th>${crearEncabezadosColumnasMercados(columnas)}</tr></thead><tbody>${opciones.map(opcion => `<tr><td>${escaparHTML(opcion.etiqueta)}</td>${columnas.map(columna => `<td>${porcentajeHandicapTarjetas(columna.partidos, columna.equipoId, opcion.equipo === "local" ? resultado?.equipo_local?.id : resultado?.equipo_visitante?.id, opcion.handicap)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}


function crearTablaMasTarjetas(resultado, local, visitante) {
  const columnas = obtenerColumnasHistoricasMercados(resultado, local, visitante);
  return tablaTarjetasSimple(columnas, [local, "Empate", visitante], (partidos, opcion, columna) => {
    const resultadoMercado = opcion === local
      ? "local"
      : opcion === visitante
        ? "visitante"
        : "empate";
    const esperado = resultadoEsperadoParaEquipo(
      resultado,
      columna.equipoId,
      resultadoMercado,
    );
    return porcentajeResultadoTarjetas(partidos, columna.equipoId, esperado);
  });
}

function crearTablaTarjetaRojaEquipo(resultado, local, visitante, objetivo) {
  const columnas = obtenerColumnasEquipoYRival(resultado, local, visitante, objetivo);
  return tablaTarjetasSimple(
    columnas,
    ["Sí", "No"],
    (p, opcion, columna) => porcentajeRojaEquipo(
      p,
      columna.equipoId,
      opcion === "Sí",
      columna.tipoEstadistica,
    ),
  );
}

function tablaTarjetasSimple(columnas, filas, calcular) {
  return `<div class="tabla-estadisticas-wrapper"><table class="tabla-estadisticas"><thead><tr><th>Mercado</th>${columnas.map(c=>`<th>${formatearTituloTarjetas(c.titulo || `${c.nombre}<br>${c.condicion}`)}</th>`).join("")}</tr></thead><tbody>${filas.map(f=>`<tr><td>${escaparHTML(f)}</td>${columnas.map(c=>`<td>${calcular(c.partidos,f,c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}

function formatearTituloTarjetas(titulo) {
  return String(titulo)
    .split("<br>")
    .map(escaparHTML)
    .join("<br>");
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
  const columnas = obtenerColumnasEquipoYRival(resultado, local, visitante, objetivo);
  const lineas = [];
  for (let linea = 0.5; linea <= 4.5; linea += 1) lineas.push(linea);

  return `
    <div class="tabla-estadisticas-wrapper">
      <table class="tabla-estadisticas">
        <thead><tr><th>Mercado</th>${crearEncabezadosColumnasMercados(columnas)}</tr></thead>
        <tbody>${lineas.map((linea) => `
          <tr><td>Más ${formatearLinea(linea)}</td>${columnas.map((columna) => `<td>${porcentajeTarjetasEquipo(columna.partidos, columna.equipoId, linea, true, columna.tipoEstadistica)}</td>`).join("")}</tr>
          <tr><td>Menos ${formatearLinea(linea)}</td>${columnas.map((columna) => `<td>${porcentajeTarjetasEquipo(columna.partidos, columna.equipoId, linea, false, columna.tipoEstadistica)}</td>`).join("")}</tr>
        `).join("")}</tbody>
      </table>
    </div>
  `;
}


function porcentajeTarjetasEquipo(partidos, equipoId, linea, esMas, tipo = "equipo") {
  if (!Array.isArray(partidos) || partidos.length === 0) return "N/D";
  let validos = 0;
  let acertados = 0;

  partidos.forEach((partido) => {
    const tarjetas = partido?.estadisticas?.eventos_jugadores?.tarjetas;
    const lado = obtenerLadoEquipoPartido(partido, equipoId);
    if (!Array.isArray(tarjetas) || !lado) return;
    validos += 1;
    const ladoObjetivo = tipo === "rival"
      ? lado === "local" ? "visitante" : "local"
      : lado;
    const total = tarjetas.filter((tarjeta) => tarjeta?.equipo === ladoObjetivo).length;
    if (esMas ? total > linea : total < linea) acertados += 1;
  });

  return porcentajeMercado(acertados, validos);
}

function porcentajeResultadoTarjetas(partidos, equipoId, esperado) {
  let validos = 0;
  let acertados = 0;

  (partidos || []).forEach((partido) => {
    const tarjetas = obtenerResumenTarjetas(partido);
    if (!tarjetas) return;

    const ladoEquipo = obtenerLadoEquipoPartido(partido, equipoId);
    if (!ladoEquipo) return;
    const ladoRival = ladoEquipo === "local" ? "visitante" : "local";
    const resultado = resultadoTarjetas(
      tarjetas[ladoEquipo],
      tarjetas[ladoRival],
    );

    validos += 1;
    if (resultado === esperado) acertados += 1;
  });

  return porcentajeMercado(acertados, validos);
}

function porcentajeHandicapTarjetas(partidos, equipoId, equipoMercadoId, handicap) {
  let validos = 0;
  let acertados = 0;
  (partidos || []).forEach((partido) => {
    const resumen = obtenerResumenTarjetas(partido);
    if (resumen === null) return;

    const ladoEquipo = obtenerLadoEquipoPartido(partido, equipoId);
    if (!ladoEquipo) return;
    const ladoRival = ladoEquipo === "local" ? "visitante" : "local";
    const esEquipoDelMercado = Number(equipoId) === Number(equipoMercadoId);
    const tarjetasEquipo = resumen[ladoEquipo];
    const tarjetasRival = resumen[ladoRival];
    const tarjetasEquipoAjustadas = tarjetasEquipo
      + (esEquipoDelMercado ? handicap : 0);
    const tarjetasRivalAjustadas = tarjetasRival
      + (esEquipoDelMercado ? 0 : handicap);

    validos += 1;
    const ganaEquipoDelMercado = esEquipoDelMercado
      ? tarjetasEquipoAjustadas > tarjetasRivalAjustadas
      : tarjetasRivalAjustadas > tarjetasEquipoAjustadas;
    if (ganaEquipoDelMercado) acertados += 1;
  });
  return porcentajeMercado(acertados, validos);
}

function porcentajeRojaEquipo(partidos, equipoId, si, tipo = "equipo") {
  let v=0,a=0; (partidos||[]).forEach(p=>{const t=p?.estadisticas?.eventos_jugadores?.tarjetas; const lado=obtenerLadoEquipoPartido(p,equipoId); if(!Array.isArray(t)||!lado)return; v++; const ladoObjetivo=tipo==="rival"?(lado==="local"?"visitante":"local"):lado; const roja=t.some(x=>x?.equipo===ladoObjetivo&&(x?.tipo==="Roja"||x?.tipo==="Segunda amarilla")); if(roja===si)a++;}); return porcentajeMercado(a,v);
}


function crearTablaMasMenosTarjetasPrimerTiempo(resultado, local, visitante) {
  const columnas = obtenerColumnasHistoricasMercados(resultado, local, visitante);
  const lineas = [];
  for (let linea = 0.5; linea <= 4.5; linea += 1) lineas.push(linea);
  return `<div class="tabla-estadisticas-wrapper"><table class="tabla-estadisticas"><thead><tr><th>Mercado</th>${crearEncabezadosColumnasMercados(columnas)}</tr></thead><tbody>${lineas.map(linea => `<tr><td>Más ${formatearLinea(linea)}</td>${columnas.map(c => `<td>${porcentajeTarjetasPrimerTiempo(c.partidos,linea,true)}</td>`).join("")}</tr><tr><td>Menos ${formatearLinea(linea)}</td>${columnas.map(c => `<td>${porcentajeTarjetasPrimerTiempo(c.partidos,linea,false)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
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

            <td>${escaparHTML(nombreEquipoLocal)}</td>

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

            <td>Empate</td>

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

            <td>${escaparHTML(nombreEquipoVisitante)}</td>

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

            <td>${escaparHTML(nombreEquipoLocal)} o Empate</td>

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

            <td>Empate o ${escaparHTML(nombreEquipoVisitante)}</td>

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

            <td>${escaparHTML(nombreEquipoLocal)} o ${escaparHTML(nombreEquipoVisitante)}</td>

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
      equipoId: resultado?.equipo_local?.id,
      nombre: nombreEquipoLocal,
      condicion: "General",
    },
    {
      partidos: resultado?.equipo_local?.partidos_local || [],
      equipoId: resultado?.equipo_local?.id,
      nombre: nombreEquipoLocal,
      condicion: "Casa",
    },
    {
      partidos: resultado?.equipo_visitante?.partidos_visitante || [],
      equipoId: resultado?.equipo_visitante?.id,
      nombre: nombreEquipoVisitante,
      condicion: "Fuera",
    },
    {
      partidos: resultado?.equipo_visitante?.partidos_general || [],
      equipoId: resultado?.equipo_visitante?.id,
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

  const marcadores = [
    ...obtenerMarcadoresCorrectos("local"),
    ...obtenerMarcadoresCorrectos("empate"),
    ...obtenerMarcadoresCorrectos("visitante"),
  ];

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
  periodo = "FT",
  lineaMaxima = 9.5,
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

  for (let linea = 0.5; linea <= lineaMaxima; linea += 1) {
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
                true,
                periodo,
              );

            const menosLocalGeneral =
              calcularPorcentajeTotalGoles(
                partidosLocalGeneral,
                linea,
                false,
                periodo,
              );

            const masLocalCasa =
              calcularPorcentajeTotalGoles(
                partidosLocalCasa,
                linea,
                true,
                periodo,
              );

            const menosLocalCasa =
              calcularPorcentajeTotalGoles(
                partidosLocalCasa,
                linea,
                false,
                periodo,
              );

            const masVisitanteFuera =
              calcularPorcentajeTotalGoles(
                partidosVisitanteFuera,
                linea,
                true,
                periodo,
              );

            const menosVisitanteFuera =
              calcularPorcentajeTotalGoles(
                partidosVisitanteFuera,
                linea,
                false,
                periodo,
              );

            const masVisitanteGeneral =
              calcularPorcentajeTotalGoles(
                partidosVisitanteGeneral,
                linea,
                true,
                periodo,
              );

            const menosVisitanteGeneral =
              calcularPorcentajeTotalGoles(
                partidosVisitanteGeneral,
                linea,
                false,
                periodo,
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
// MÁS / MENOS — GOLES DEL EQUIPO EN PRIMER TIEMPO
// ============================================================

function crearTablaMasMenosGolesEquipoPrimerTiempo(
  resultado,
  nombreEquipoLocal,
  nombreEquipoVisitante,
  equipoObjetivo,
) {
  const equipoLocalId = resultado?.equipo_local?.id;
  const equipoVisitanteId = resultado?.equipo_visitante?.id;
  const esLocal = equipoObjetivo === "local";

  const columnas = esLocal
    ? [
        { partidos: resultado?.equipo_local?.partidos_general || [], equipoId: equipoLocalId, nombre: nombreEquipoLocal, condicion: "General · Marcados", tipo: "marcados" },
        { partidos: resultado?.equipo_local?.partidos_local || [], equipoId: equipoLocalId, nombre: nombreEquipoLocal, condicion: "Casa · Marcados", tipo: "marcados" },
        { partidos: resultado?.equipo_visitante?.partidos_visitante || [], equipoId: equipoVisitanteId, nombre: nombreEquipoVisitante, condicion: "Fuera · Recibidos", tipo: "recibidos" },
        { partidos: resultado?.equipo_visitante?.partidos_general || [], equipoId: equipoVisitanteId, nombre: nombreEquipoVisitante, condicion: "General · Recibidos", tipo: "recibidos" },
      ]
    : [
        { partidos: resultado?.equipo_visitante?.partidos_general || [], equipoId: equipoVisitanteId, nombre: nombreEquipoVisitante, condicion: "General · Marcados", tipo: "marcados" },
        { partidos: resultado?.equipo_visitante?.partidos_visitante || [], equipoId: equipoVisitanteId, nombre: nombreEquipoVisitante, condicion: "Fuera · Marcados", tipo: "marcados" },
        { partidos: resultado?.equipo_local?.partidos_local || [], equipoId: equipoLocalId, nombre: nombreEquipoLocal, condicion: "Casa · Recibidos", tipo: "recibidos" },
        { partidos: resultado?.equipo_local?.partidos_general || [], equipoId: equipoLocalId, nombre: nombreEquipoLocal, condicion: "General · Recibidos", tipo: "recibidos" },
      ];

  const lineas = [0.5, 1.5, 2.5, 3.5];

  const crearFila = (esMas, linea) => `
    <tr>
      <td>${esMas ? "Más" : "Menos"} ${formatearLinea(linea)}</td>
      ${columnas.map((columna) => `
        <td>${porcentajeGolesEquipoPrimerTiempo(
          columna.partidos,
          columna.equipoId,
          columna.tipo,
          linea,
          esMas,
        )}</td>
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
              <th>${escaparHTML(columna.nombre)}<br>${columna.condicion}</th>
            `).join("")}
          </tr>
        </thead>
        <tbody>
          ${lineas.map((linea) => `${crearFila(true, linea)}${crearFila(false, linea)}`).join("")}
        </tbody>
      </table>
    </div>
  `;
}


function porcentajeGolesEquipoPrimerTiempo(
  partidos,
  equipoId,
  tipo,
  linea,
  esMas,
) {
  let validos = 0;
  let acertados = 0;

  (partidos || []).forEach((partido) => {
    const goles = obtenerEstadisticaPartido(
      partido,
      "1ST",
      "timeline:goles",
    );

    if (!goles) {
      return;
    }

    const ladoEquipo = obtenerLadoEquipoPartido(partido, equipoId);
    if (!ladoEquipo) {
      return;
    }
    const ladoRival = ladoEquipo === "local" ? "visitante" : "local";
    const golesEquipo = goles[ladoEquipo];
    const golesRival = goles[ladoRival];
    const valor = tipo === "marcados" ? golesEquipo : golesRival;

    validos += 1;

    if (esMas ? valor > linea : valor < linea) {
      acertados += 1;
    }
  });

  return porcentajeMercado(acertados, validos);
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


function porcentajeTarjetasPrimerTiempo(partidos, linea, esMas) {
  let validos = 0;
  let acertados = 0;
  (partidos || []).forEach((partido) => {
    const tarjetas = partido?.estadisticas?.eventos_jugadores?.tarjetas;
    if (!Array.isArray(tarjetas)) return;
    validos += 1;
    const total = tarjetas.filter((tarjeta) => Number(tarjeta?.minuto) <= 45).length;
    if (esMas ? total > linea : total < linea) acertados += 1;
  });
  return porcentajeMercado(acertados, validos);
}

function porcentajeProximaTarjeta(partidos, equipoId, esperado) {
  let validos=0, acertados=0;
  (partidos||[]).forEach(partido=>{const tarjetas=partido?.estadisticas?.eventos_jugadores?.tarjetas; const lado=obtenerLadoEquipoPartido(partido,equipoId); if(!Array.isArray(tarjetas)||!lado)return; validos++; const primera=tarjetas[0]; const estado=!primera?"sin_tarjetas":primera.equipo===lado?"equipo":"rival"; if(estado===esperado)acertados++;});
  return porcentajeMercado(acertados,validos);
}

function porcentajeTarjetasEquipoPrimerTiempo(partidos,equipoId,linea,esMas,tipo="equipo") {
  let validos=0,acertados=0;
  (partidos||[]).forEach(partido=>{const tarjetas=partido?.estadisticas?.eventos_jugadores?.tarjetas; const lado=obtenerLadoEquipoPartido(partido,equipoId); if(!Array.isArray(tarjetas)||!lado)return; validos++; const ladoObjetivo=tipo==="rival"?(lado==="local"?"visitante":"local"):lado; const total=tarjetas.filter(t=>t?.equipo===ladoObjetivo&&Number(t?.minuto)<=45).length; if(esMas?total>linea:total<linea)acertados++;});
  return porcentajeMercado(acertados,validos);
}

function obtenerTarjetasPorTiempo(partido) {
  const tarjetas=partido?.estadisticas?.eventos_jugadores?.tarjetas;
  if(!Array.isArray(tarjetas))return null;
  const resumen={local:{primero:0,segundo:0},visitante:{primero:0,segundo:0}};
  tarjetas.forEach(t=>{if(!resumen[t?.equipo])return; const tiempo=Number(t?.minuto)<=45?"primero":"segundo"; resumen[t.equipo][tiempo]+=1;});
  return resumen;
}

function porcentajeTarjetasAmbosTiempos(partidos,esperado) {
  let v=0,a=0;(partidos||[]).forEach(p=>{const t=obtenerTarjetasPorTiempo(p);if(!t)return;v++;const cumple=t.local.primero+t.visitante.primero>0&&t.local.segundo+t.visitante.segundo>0;if(cumple===esperado)a++;});return porcentajeMercado(a,v);
}

function porcentajeAmbosEquiposTarjetasAmbosTiempos(partidos) {
  let v=0,a=0;(partidos||[]).forEach(p=>{const t=obtenerTarjetasPorTiempo(p);if(!t)return;v++;if(t.local.primero>0&&t.local.segundo>0&&t.visitante.primero>0&&t.visitante.segundo>0)a++;});return porcentajeMercado(a,v);
}

function porcentajeTarjetasEquipoSegundoTiempo(partidos,equipoId,linea,esMas,tipo="equipo") {
  let v=0,a=0;(partidos||[]).forEach(p=>{const t=obtenerTarjetasPorTiempo(p);const lado=obtenerLadoEquipoPartido(p,equipoId);if(!t||!lado)return;v++;const ladoObjetivo=tipo==="rival"?(lado==="local"?"visitante":"local"):lado;const total=t[ladoObjetivo].segundo;if(esMas?total>linea:total<linea)a++;});return porcentajeMercado(a,v);
}

function obtenerTotalPenalesConcedidos(partido) {
  const filas=partido?.estadisticas?.periodos;
  if(!Array.isArray(filas))return null;
  const fila=filas.find(f=>f?.periodo==="FT"&&f?.estadistica_key==="timeline:penales_causados");
  if(!fila)return null;
  const local=Number(fila.local),visitante=Number(fila.visitante);
  return Number.isFinite(local)&&Number.isFinite(visitante)?local+visitante:null;
}

function porcentajeEventoTarjetas(partidos,tipo,esperado) {
  let v=0,a=0;(partidos||[]).forEach(p=>{const tarjetas=p?.estadisticas?.eventos_jugadores?.tarjetas;const penales=obtenerTotalPenalesConcedidos(p);if(!Array.isArray(tarjetas)||penales===null)return;v++;const roja=tarjetas.some(t=>t?.tipo==="Roja"||t?.tipo==="Segunda amarilla");const rojaPrimero=tarjetas.some(t=>(t?.tipo==="Roja"||t?.tipo==="Segunda amarilla")&&Number(t?.minuto)<=45);const penal=penales>0;const cumple=tipo==="roja_primero"?rojaPrimero:tipo==="roja_y_penal"?roja&&penal:roja||penal;if(cumple===esperado)a++;});return porcentajeMercado(a,v);
}

function porcentajeRangoTarjetas(partidos,min,max) {
  let v=0,a=0;(partidos||[]).forEach(p=>{const t=obtenerResumenTarjetas(p);if(!t)return;v++;if(t.total>=min&&(max===null||t.total<=max))a++;});return porcentajeMercado(a,v);
}

function resultadoTarjetas(a,b) { return a>b?"equipo":a<b?"rival":"empate"; }

function porcentajeMedioTiempoTiempoCompletoTarjetas(partidos,equipoId,esperadoPrimero,esperadoCompleto) {
  let v=0,a=0;(partidos||[]).forEach(p=>{const t=obtenerTarjetasPorTiempo(p);const lado=obtenerLadoEquipoPartido(p,equipoId);if(!t||!lado)return;v++;const rival=lado==="local"?"visitante":"local";const primero=resultadoTarjetas(t[lado].primero,t[rival].primero);const completo=resultadoTarjetas(t[lado].primero+t[lado].segundo,t[rival].primero+t[rival].segundo);if(primero===esperadoPrimero&&completo===esperadoCompleto)a++;});return porcentajeMercado(a,v);
}

function porcentajeMarcadorCorrectoTarjetas(partidos,equipoId,esperadoEquipo,esperadoRival) {
  let v=0,a=0;(partidos||[]).forEach(p=>{const t=obtenerResumenTarjetas(p);const lado=obtenerLadoEquipoPartido(p,equipoId);if(!t||!lado)return;v++;const rival=lado==="local"?"visitante":"local";if(t[lado]===esperadoEquipo&&t[rival]===esperadoRival)a++;});return porcentajeMercado(a,v);
}

function obtenerCornersPartido(partido,periodo) {
  const filas=partido?.estadisticas?.periodos;
  if(!Array.isArray(filas))return null;
  const fila=filas.find(f=>(f?.periodo===periodo||(periodo==="FT"&&f?.periodo==="ALL"))&&f?.estadistica_key==="corner kicks");
  if(!fila)return null;
  const local=Number(fila.local),visitante=Number(fila.visitante);
  return Number.isFinite(local)&&Number.isFinite(visitante)?{local,visitante}:null;
}

function obtenerEstadisticaPartido(partido, periodo, estadisticaKey) {
  const filas = partido?.estadisticas?.periodos;

  if (!Array.isArray(filas)) {
    return null;
  }

  const fila = filas.find((item) => (
    (item?.periodo === periodo || (periodo === "FT" && item?.periodo === "ALL")) &&
    item?.estadistica_key === estadisticaKey
  ));

  if (!fila) {
    return null;
  }

  const local = Number(fila.local);
  const visitante = Number(fila.visitante);

  return Number.isFinite(local) && Number.isFinite(visitante)
    ? { local, visitante }
    : null;
}

function porcentajeCorners(partidos,periodo,tipo,linea,esMas,equipoId) {
  let v=0,a=0;(partidos||[]).forEach(p=>{const corners=obtenerCornersPartido(p,periodo);const lado=obtenerLadoEquipoPartido(p,equipoId);if(!corners||!lado)return;v++;const ladoRival=lado==="local"?"visitante":"local";const total=tipo==="equipo"?corners[lado]:tipo==="rival"?corners[ladoRival]:corners.local+corners.visitante;if(esMas?total>linea:total<linea)a++;});return porcentajeMercado(a,v);
}

function porcentajeEstadistica(partidos, estadisticaKey, linea, esMas, equipoId, objetivo, contarFaltantesComoCero = false, periodo = "FT") {
  let validos = 0;
  let acertados = 0;

  (partidos || []).forEach((partido) => {
    const estadistica = obtenerEstadisticaPartido(partido, periodo, estadisticaKey);

    let valor;

    if (!estadistica) {
      if (!contarFaltantesComoCero) {
        return;
      }

      valor = 0;
    } else {
      const ladoEquipo = obtenerLadoEquipoPartido(partido, equipoId);

      if (!ladoEquipo) {
        return;
      }

      if (objetivo === "rival") {
        const ladoRival = ladoEquipo === "local" ? "visitante" : "local";
        valor = estadistica[ladoRival];
      } else if (objetivo) {
        valor = estadistica[ladoEquipo];
      } else {
        valor = estadistica.local + estadistica.visitante;
      }
    }

    validos += 1;

    if (esMas ? valor > linea : valor < linea) {
      acertados += 1;
    }
  });

  return porcentajeMercado(acertados, validos);
}

function porcentajeEquipoMasCorners(partidos, periodo, equipoId, esperado) {
  let validos = 0;
  let acertados = 0;

  (partidos || []).forEach((partido) => {
    const corners = obtenerCornersPartido(partido, periodo);

    if (!corners) {
      return;
    }

    const ladoEquipo = obtenerLadoEquipoPartido(partido, equipoId);

    if (!ladoEquipo) {
      return;
    }
    const ladoRival = ladoEquipo === "local" ? "visitante" : "local";
    const resultado = corners[ladoEquipo] > corners[ladoRival]
      ? "equipo"
      : corners[ladoEquipo] < corners[ladoRival]
        ? "rival"
        : "empate";

    validos += 1;

    if (resultado === esperado) {
      acertados += 1;
    }
  });

  return porcentajeMercado(acertados, validos);
}

function porcentajeTiempoConMasCorners(partidos, esperado) {
  let validos = 0;
  let acertados = 0;

  (partidos || []).forEach((partido) => {
    const primerTiempo = obtenerCornersPartido(partido, "1ST");
    const segundoTiempo = obtenerCornersPartido(partido, "2ND");

    if (!primerTiempo || !segundoTiempo) {
      return;
    }

    const totalPrimerTiempo = primerTiempo.local + primerTiempo.visitante;
    const totalSegundoTiempo = segundoTiempo.local + segundoTiempo.visitante;
    const resultado = totalPrimerTiempo > totalSegundoTiempo
      ? "primer_tiempo"
      : totalPrimerTiempo < totalSegundoTiempo
        ? "segundo_tiempo"
        : "empate";

    validos += 1;

    if (resultado === esperado) {
      acertados += 1;
    }
  });

  return porcentajeMercado(acertados, validos);
}

function porcentajeRangoTotalCorners(partidos, minimo, maximo) {
  let validos = 0;
  let acertados = 0;

  (partidos || []).forEach((partido) => {
    const corners = obtenerCornersPartido(partido, "FT");

    if (!corners) {
      return;
    }

    const total = corners.local + corners.visitante;
    validos += 1;

    if (total >= minimo && (maximo === null || total <= maximo)) {
      acertados += 1;
    }
  });

  return porcentajeMercado(acertados, validos);
}

function porcentajeMarcadorCorrectoCorners(partidos, equipoId, cornersEquipo, cornersRival) {
  let validos = 0;
  let acertados = 0;

  (partidos || []).forEach((partido) => {
    const corners = obtenerCornersPartido(partido, "FT");

    if (!corners) {
      return;
    }

    const ladoEquipo = obtenerLadoEquipoPartido(partido, equipoId);

    if (!ladoEquipo) {
      return;
    }
    const ladoRival = ladoEquipo === "local" ? "visitante" : "local";

    validos += 1;

    if (
      corners[ladoEquipo] === cornersEquipo &&
      corners[ladoRival] === cornersRival
    ) {
      acertados += 1;
    }
  });

  return porcentajeMercado(acertados, validos);
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
  periodo = "FT",
) {
  if (!Array.isArray(partidos) || partidos.length === 0) {
    return "N/D";
  }

  let validos = 0;
  let acertados = 0;

  partidos.forEach((partido) => {

    const total = obtenerTotalGolesPartido(
      partido,
      periodo,
    );

    if (total === null) {
      return;
    }

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
// TOTAL DE GOLES DE UN PARTIDO POR PERIODO
// ============================================================

function obtenerTotalGolesPartido(partido, periodo = "FT") {
  if (periodo === "FT") {
    const golesLocal = Number(partido?.marcador_local);
    const golesVisitante = Number(partido?.marcador_visitante);

    return Number.isFinite(golesLocal) && Number.isFinite(golesVisitante)
      ? golesLocal + golesVisitante
      : null;
  }

  const goles = obtenerEstadisticaPartido(
    partido,
    periodo,
    "timeline:goles",
  );

  return goles
    ? goles.local + goles.visitante
    : null;
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
