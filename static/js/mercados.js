async function cargarMercados(
  eventId,
  equipoLocalId,
  equipoVisitanteId,
  nombreEquipoLocal = "Local",
  nombreEquipoVisitante = "Visitante",
) {
  try {
    const url =
      `/api/partido/${eventId}/mercados` +
      `?equipo_local_id=${equipoLocalId}` +
      `&equipo_visitante_id=${equipoVisitanteId}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Error HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    renderizarMercados(data, nombreEquipoLocal, nombreEquipoVisitante);
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

function renderizarMercados(data, nombreEquipoLocal, nombreEquipoVisitante) {
  const contenedor = document.getElementById("mercados");

  if (!contenedor) {
    return;
  }

  const resultado = data?.mercados?.populares?.resultado_partido;

  if (!resultado) {
    contenedor.innerHTML = "";
    return;
  }

  contenedor.innerHTML = `
    <section class="mercados-seccion">

      <h2 class="titulo-seccion">
        MERCADOS
      </h2>

      <h3 class="subtitulo-mercado">
        POPULARES
      </h3>

      <h3 class="subtitulo-mercado">
        RESULTADO DEL PARTIDO
      </h3>

      ${crearTablaResultado(
        resultado,
        nombreEquipoLocal,
        nombreEquipoVisitante,
      )}

    </section>
  `;
}

function crearTablaResultado(
  resultado,
  nombreEquipoLocal,
  nombreEquipoVisitante,
) {
  const localGeneral = resultado?.equipo_local?.general || {};

  const localCasa = resultado?.equipo_local?.local || {};

  const visitanteGeneral = resultado?.equipo_visitante?.general || {};

  const visitanteFuera = resultado?.equipo_visitante?.visitante || {};

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
                localGeneral.partidos,
              )}
            </td>

            <td>
              ${porcentajeMercado(localCasa.victorias, localCasa.partidos)}
            </td>

            <td>
              ${porcentajeMercado(
                visitanteFuera.victorias,
                visitanteFuera.partidos,
              )}
            </td>

            <td>
              ${porcentajeMercado(
                visitanteGeneral.victorias,
                visitanteGeneral.partidos,
              )}
            </td>

          </tr>


          <tr>

            <td>Empates</td>

            <td>
              ${porcentajeMercado(localGeneral.empates, localGeneral.partidos)}
            </td>

            <td>
              ${porcentajeMercado(localCasa.empates, localCasa.partidos)}
            </td>

            <td>
              ${porcentajeMercado(
                visitanteFuera.empates,
                visitanteFuera.partidos,
              )}
            </td>

            <td>
              ${porcentajeMercado(
                visitanteGeneral.empates,
                visitanteGeneral.partidos,
              )}
            </td>

          </tr>


          <tr>

            <td>Derrotas</td>

            <td>
              ${porcentajeMercado(localGeneral.derrotas, localGeneral.partidos)}
            </td>

            <td>
              ${porcentajeMercado(localCasa.derrotas, localCasa.partidos)}
            </td>

            <td>
              ${porcentajeMercado(
                visitanteFuera.derrotas,
                visitanteFuera.partidos,
              )}
            </td>

            <td>
              ${porcentajeMercado(
                visitanteGeneral.derrotas,
                visitanteGeneral.partidos,
              )}
            </td>

          </tr>


          <tr>

            <td>Partidos</td>

            <td>
              ${valorMercado(localGeneral.partidos)}
            </td>

            <td>
              ${valorMercado(localCasa.partidos)}
            </td>

            <td>
              ${valorMercado(visitanteFuera.partidos)}
            </td>

            <td>
              ${valorMercado(visitanteGeneral.partidos)}
            </td>

          </tr>

        </tbody>

      </table>

    </div>
  `;
}

function porcentajeMercado(valor, partidos) {
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

  const porcentaje = (Number(valor) / Number(partidos)) * 100;

  return `${porcentaje % 1 === 0 ? porcentaje : porcentaje.toFixed(1)}%`;
}

function valorMercado(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return "N/D";
  }

  return escaparHTML(String(valor));
}

function escaparHTML(valor) {
  return String(valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
