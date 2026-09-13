# Plan de migración: probabilidades predictivas

## Propósito de este documento

Este archivo conserva el contexto técnico y las decisiones de migración para futuras sesiones de Codex, colaboradores y cuentas. Debe actualizarse al completar una fase, sin reescribir la historia de decisiones anteriores.

## 1. Objetivo general

Transformar la aplicación desde un visor de frecuencias históricas hacia un sistema que analice un fixture futuro verificable y entregue probabilidades predictivas con muestra, incertidumbre y calidad de datos explícitas.

El objetivo final es analizar un partido futuro mediante:

- `event_id`, cuando SofaScore lo proporcione;
- equipo local y visitante;
- fecha/hora de kickoff;
- competición;
- exclusivamente datos históricos disponibles antes del kickoff.

Las cuotas de casas de apuestas se usarán después para comparar valor; nunca para fabricar o ajustar la probabilidad estadística propia.

## 2. Arquitectura actual

```text
SofaScore API
  -> services/
  -> routes/
  -> Flask JSON
  -> static/js/app.js
  -> static/js/mercados.js calcula porcentajes
  -> interfaz HTML
```

La aplicación Flask registra blueprints en `app.py`.

- `POST /api/analizar`: recibe dos IDs, carga históricos y estadísticas de partidos terminados.
- `GET /api/partido/<event_id>/estadisticas`: carga estadísticas de un partido bajo demanda.
- `GET /api/partido/<event_id>/mercados`: endpoint histórico básico; el frontend actual no lo consume.
- `POST /api/fixture/analizar`: valida un fixture por `event_id`. Se añadió en Fase 1 y no reemplaza `/api/analizar`.

SofaScore aporta actualmente, mediante el cliente existente:

- información de equipo;
- histórico de eventos de equipo;
- información de un evento;
- estadísticas de partido;
- incidents;
- lineups.

No se ha verificado en el proyecto un endpoint para descubrir fixtures futuros. No inventar uno.

## 3. Archivos importantes

| Archivo | Responsabilidad |
|---|---|
| `app.py` | Inicializa Flask y registra blueprints. |
| `config.py` | API base, headers y parámetros actuales de historial. |
| `services/sofascore_api.py` | Único cliente HTTP SofaScore. |
| `services/partidos.py` | Descarga, filtra y normaliza históricos. |
| `services/equipos.py` | Construye listas general/local/visitante. |
| `services/estadisticas.py` | Procesa statistics, incidents, lineups y jugadores. |
| `services/fixtures.py` | Valida y normaliza fixture desde `/event/{id}`. |
| `routes/equipos.py` | Implementa `/api/analizar` y precarga estadísticas. |
| `routes/fixtures.py` | Implementa `/api/fixture/analizar`. |
| `static/js/app.js` | Solicita análisis y administra caché/localStorage. |
| `static/js/mercados.js` | Fórmulas actuales de frecuencia y renderizado de mercados. |
| `static/js/estadisticas.js` | Presenta estadísticas por partido. |
| `static/js/partidos.js` | Presenta históricos. |
| `tests/test_fixtures.py` | Tests de validación de fixture creados en Fase 1. |

## 4. Scripts obsoletos y scripts a conservar

Identificados como obsoletos para runtime actual, con funcionalidad migrada a servicios:

- `extraer_ultimos_partidos.py` -> `services/partidos.py` y `services/equipos.py`.
- `filtrar_localia.py` -> `services/partidos.py`.
- `extraer_estadisticas.py` -> `services/estadisticas.py`.
- `extraer_timeline.py` -> `services/estadisticas.py`.
- `extraer_estadisticas_jugadores.py` -> `services/estadisticas.py`.

No eliminar durante migración sin revisión separada. Que estén obsoletos para runtime no prueba que nadie los ejecute manualmente.

No eliminar:

- `extraer_cuotas.py`: extracción manual de cuotas Betano; no está integrada, pero su funcionalidad no fue reemplazada.
- `filtrar_cuotas.py`: filtrado manual de CSV Betano; depende del extractor y no fue reemplazado.
- `listar_estadisticas_jugadores.py`: herramienta manual para descubrir campos y frecuencia de stats de jugador.

No eliminar ningún archivo como parte de una fase estadística o de fixture.

## 5. Estado actual de migración

### Fase 1: completada en código

Se añadió contrato y validación de fixture futuro:

- `services/fixtures.py` consulta solamente `obtener_evento(event_id)` del cliente existente.
- valida IDs local/visitante, kickoff ISO 8601 y competición si SofaScore la entrega;
- devuelve `event_id`, IDs, `kickoff_at`, `competicion` y `fixture_verificado`;
- impide valores declarados que no coincidan con el evento remoto;
- añadió `POST /api/fixture/analizar`;
- `/api/analizar` permanece sin cambios funcionales.

Tests escritos: fixture válido, evento inexistente, IDs incorrectos, kickoff inconsistente y competición ausente.

Limitación actual de verificación: suite no pudo ejecutarse en entorno local porque el entorno virtual apunta a un intérprete inexistente y el Python disponible no tiene Flask. No reparar dependencias dentro de una fase funcional sin autorización explícita.

## 6. Problemas estadísticos actuales

- El sistema compara dos historiales; no modela fixture futuro concreto.
- Muestra máxima usual: 10 general y 10 por localía. Puede producir `1/1 = 100%`.
- Casi todos mercados usan frecuencia simple: `aciertos / válidos`.
- No hay intervalos, incertidumbre, tamaño de muestra efectivo ni calibración.
- General y casa/fuera se solapan; frontend intenta descontar eventos duplicados al combinar, pero diseño debe usar muestras disjuntas desde origen.
- No hay ajuste por recencia, fuerza rival, competición, alineación futura, lesiones o suspensiones.
- No hay modelo entrenado, Poisson, Beta-Binomial, Dirichlet, regresión ni backtest.
- Mercados de jugador usan apariciones históricas; no garantizan disponibilidad en fixture futuro.
- `localStorage` puede mostrar análisis viejo sin expiración.
- Cuotas Betano no llegan al frontend ni participan en cálculos actuales.
- Posesión no está incluida en `ESTADISTICAS_SELECCIONADAS`.
- Carga actual puede ejecutar hasta tres peticiones de detalle por histórico: estadísticas, incidents y lineups.

## 7. Arquitectura objetivo

```text
Fixture verificado
  -> ingesta de datos pre-kickoff
  -> payloads crudos y normalización
  -> dataset histórico temporal
  -> features: localía, recencia, cobertura
  -> modelo por mercado
  -> probabilidad, muestra, incertidumbre, calidad
  -> API
  -> frontend solo presenta
  -> cuotas independientes: implícita, margen, edge, EV
```

Responsabilidades objetivo:

- `services/`: cliente SofaScore, fixture, ingesta, normalización, histórico, features, modelos, probabilidades y cuotas.
- `routes/`: contratos HTTP; no fórmulas complejas.
- `utils/`: fechas, validación y helpers estadísticos pequeños.
- `static/js/`: solicitud y presentación; no cálculo de modelo.

Persistencia futura propuesta: SQLite inicialmente. No implementada todavía.

## 8. Metodología estadística propuesta

### Corte temporal y leakage

Para fixture con kickoff `T`:

```text
Solo usar eventos con kickoff_at < T.
```

Nunca usar estadísticas, incidents, lineup real, resultado, cuota posterior o rating recalculado con el fixture objetivo.

### Recencia

Peso por histórico `i`:

```text
w_i = exp(-ln(2) * edad_dias_i / h)
```

Probar semividas `h` de 30, 60, 90 y 120 días mediante backtesting. No fijar una semivida por intuición.

Tamaño de muestra efectivo:

```text
n_efectivo = (sum(w_i)^2) / sum(w_i^2)
```

### Localía sin doble conteo

Usar segmentos disjuntos:

- local futuro: partidos en casa y fuera;
- visitante futuro: partidos fuera y en casa.

Ejemplo ataque local:

```text
mu_local =
(sum(w_i * Y_i en casa) + lambda * sum(w_i * Y_i fuera))
/
(sum(w_i en casa) + lambda * sum(w_i en fuera))
```

`lambda` debe ajustarse con backtesting.

### Suavizado

Para mercados binarios, baseline recomendado: Beta-Binomial.

```text
p ~ Beta(alpha_0, beta_0)

P = (alpha_0 + exitos_ponderados)
  / (alpha_0 + beta_0 + n_efectivo)
```

Para 1X2: Dirichlet-Multinomial, para asegurar que probabilidades sumen 1.

No implementar todavía modelos, priors ni intervalos.

### Rival

No aplicar ajuste rival ahora. Proyecto no tiene dataset completo y verificable de competición.

Solo considerar Elo o modelo ataque/defensa tras tener cobertura histórica completa por competición, cálculo estrictamente prepartido y backtest.

## 9. Mercados prioritarios

Primera ola, cuando exista baseline backend:

1. 1X2.
2. Doble oportunidad.
3. Más/Menos goles.
4. Ambos anotan.
5. Corners totales.
6. Tarjetas totales.
7. Tiros totales.

Segunda ola:

- tiros a puerta;
- faltas, offsides, pases;
- mercados por equipo;
- hándicap y medio tiempo, tras backtest.

No predictivos inicialmente:

- goles, tiros, tarjetas y asistencias de jugador;
- primer anotador;
- combinadas de jugadores;
- eventos raros: autogol, doble penal, roja y penal, triplete, marcador correcto raro.

## 10. Plan por fases

| Fase | Alcance | Estado |
|---|---|---|
| 1 | Contrato y validación fixture futuro | Implementada; tests bloqueados por entorno. |
| 2 | Persistencia de payloads y normalización histórica | Pendiente. |
| 3 | Construcción muestra temporal, localía disjunta y recencia | Pendiente. |
| 4 | Baseline backend Beta-Binomial/Dirichlet para mercados prioritarios | Pendiente. |
| 5 | Frontend consume probabilidades backend; `mercados.js` solo renderiza | Pendiente. |
| 6 | Registro predicciones, settlement, calibración y backtesting | Pendiente. |
| 7 | Conteos Poisson/Negative Binomial solo si supera baseline | Pendiente. |
| 8 | Integración independiente cuotas, margen, edge y EV | Pendiente. |
| 9 | Mercados de jugador tras validar lineup/minutos futuros | Pendiente. |

## 11. Fase actualmente pendiente

Fase 2: diseñar e implementar persistencia de payloads crudos y datos normalizados. No comenzar sin una solicitud explícita para Fase 2.

Antes de Fase 2, decidir y verificar entorno de pruebas Python. Esa reparación es trabajo de entorno, no parte automática de la migración funcional.

## 12. Reglas para futuras modificaciones

1. No modificar fórmulas actuales hasta tener baseline backend y backtest comparable.
2. Mantener `/api/analizar` funcionando durante toda migración.
3. No sustituir endpoint actual por `/api/fixture/analizar` todavía.
4. No inventar endpoints ni campos de SofaScore.
5. Usar solo datos verificables y disponibles antes del kickoff.
6. Evitar data leakage en ingesta, features, modelos, backtest y cuotas.
7. No usar cuotas para fabricar, ajustar ni entrenar probabilidad estadística.
8. No añadir modelos complejos sin superar baseline fuera de muestra.
9. No hacer grandes refactorizaciones fuera de fase actual.
10. No eliminar archivos durante migración.
11. Mantener contrato JSON claro: probabilidad, muestra, incertidumbre y calidad de datos separados.
12. Añadir tests antes o junto con cada nueva validación/modelo.

## 13. Decisiones tomadas

- Fixture se valida contra `/event/{id}` ya disponible en cliente SofaScore.
- `kickoff_at` normalizado UTC será cutoff temporal futuro.
- Los datos de competición se usan solo si `tournament.name` existe en respuesta verificada.
- Fixture declarado con campos contradictorios debe fallar; no corregir silenciosamente entrada usuario.
- Betano seguirá separado hasta fase de cuotas.
- La migración será incremental; no reescritura total.
- Prioridad: robustez estadística, trazabilidad y prevención leakage antes de amplitud de mercados.

## 14. No modificar todavía

- `static/js/mercados.js` y sus fórmulas actuales.
- Cálculos de mercados existentes.
- Integración Betano, `extraer_cuotas.py` o `filtrar_cuotas.py`.
- Modelos Beta-Binomial, Dirichlet, Poisson, Negative Binomial o regresiones.
- Backtesting, calibración, edge, EV o persistencia SQLite.
- Frontend actual, salvo una fase futura explícita.
- `/api/analizar` y sus contratos existentes.
- Scripts marcados para conservar: `extraer_cuotas.py`, `filtrar_cuotas.py`, `listar_estadisticas_jugadores.py`.
