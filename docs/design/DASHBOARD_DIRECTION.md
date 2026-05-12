# Dashboard — Direccion de arte

Hibrido brutalist + mascota Argus. El Dashboard se lee como un panel forense
donde Argus (mascota) actua de ancla emocional y todo lo demas es dato.

## Reglas duras
- Grid editorial real: una columna ancha de "estado del sistema" + columna
  estrecha de "telemetria". No mar de cards iguales.
- Tipografia operacional: numeros con `tabular-nums`, escala display
  Bricolage Grotesque para tituleras, mono (Inter mono fallback / system mono)
  reservada a metricas, timestamps y codigos CVE.
- Color funcional, NO decorativo. Acento unico por estado (ok, warn, danger).
  Cero gradientes morado-azul. Cero glassmorphism por defecto.
- Bordes nitidos (1px), radios pequenos (`--r-md` max), sombras planas. Las
  sombras blandas estan prohibidas en superficies de datos.
- Cada metrica viaja con su contexto: fuente, timestamp o delta. Nada flota
  sin etiqueta.
- Estados completos: loading skeleton, empty state, error, ok, success.
- Responsive intencional: mobile 1 col, tablet 2 col, desktop 12 col grid.
- Accesibilidad AA: foco visible, aria-labels en metricas, contraste >= 4.5.

## Que NO hacemos
- No gradientes radiales en el hero.
- No particle network decorativa.
- No emoji animado en el saludo.
- No cards-dentro-de-cards.
- No mockear datos cuando hay endpoint real.

## Que SI hacemos
- Hero = "Argus esta vigilando esto" con score y sparkline de 8 semanas.
- Feed de telemetria con conteos reales: vault, CVE hoy, ultima auditoria.
- Bloque de breaking CVE si el backend lo expone.
- Modulos jerarquizados por rango funcional (defensa / diagnostico /
  analisis / inteligencia / entrenamiento), no como rejilla uniforme.
