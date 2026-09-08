// ============================================================
// PARTIDOS
// ============================================================

// ============================================================
// MOSTRAR PARTIDOS
// ============================================================

function mostrarPartidos(contenedorId, partidos, equipoObjetivoId) {
  const contenedor = document.getElementById(contenedorId);

  if (!contenedor) {
    console.error(`No existe el contenedor: ${contenedorId}`);

    return;
  }

  contenedor.innerHTML = "";

  // ==========================================================
  // SIN PARTIDOS
  // ==========================================================

  if (!Array.isArray(partidos) || partidos.length === 0) {
    contenedor.innerHTML = `
            <div class="vacio">
                No hay partidos disponibles.
            </div>
        `;

    return;
  }

  // ==========================================================
  // RECORRER PARTIDOS
  // ==========================================================

  partidos.forEach((partido, indice) => {
    const eventId = partido.event_id;

    const idUnico = `${contenedorId}-${eventId}-${indice}`;

    // ======================================================
    // RESULTADO
    // ======================================================

    let claseResultado = "";

    if (partido.resultado === "Victoria") {
      claseResultado = "victoria";
    } else if (partido.resultado === "Empate") {
      claseResultado = "empate";
    } else if (partido.resultado === "Derrota") {
      claseResultado = "derrota";
    }

    // ======================================================
    // IDs
    // ======================================================

    const objetivoId = partido.equipo_objetivo_id ?? equipoObjetivoId ?? "";

    const homeId = partido.home_team_id ?? "";

    const awayId = partido.away_team_id ?? "";

    // ======================================================
    // HTML
    // ======================================================

    const html = `
                <div
                    class="partido"
                    id="partido-${idUnico}"
                >

                    <div
                        class="partido-cabecera"
                        onclick="toggleEstadisticas(
                            '${idUnico}',
                            ${eventId},
                            '${escaparHTML(objetivoId)}',
                            '${escaparHTML(homeId)}',
                            '${escaparHTML(awayId)}'
                        )"
                    >

                        <span
                            class="flecha"
                            id="flecha-${idUnico}"
                        >
                            ▶
                        </span>


                        <div class="fecha">
                            ${escaparHTML(partido.fecha)}
                        </div>


                        <div class="equipos-partido">

                            <div class="nombre-equipo">
                                ${escaparHTML(partido.local_equipo)}
                            </div>


                            <div class="marcador">
                                ${escaparHTML(partido.marcador_local)}
                                -
                                ${escaparHTML(partido.marcador_visitante)}
                            </div>


                            <div
                                class="nombre-equipo visitante"
                            >
                                ${escaparHTML(partido.visitante_equipo)}
                            </div>

                        </div>


                        <div
                            class="resultado ${claseResultado}"
                        >
                            ${escaparHTML(partido.resultado)}
                        </div>


                        <div class="competicion">
                            ${escaparHTML(partido.torneo)}
                        </div>

                    </div>


                    <div
                        class="estadisticas"
                        id="stats-${idUnico}"
                    >

                        <div
                            class="estadisticas-contenido"
                            id="stats-content-${idUnico}"
                        >
                        </div>

                    </div>

                </div>
            `;

    contenedor.innerHTML += html;
  });
}
