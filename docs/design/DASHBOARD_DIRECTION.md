# Dashboard — Direccion de arte

Dark gamificada didactica estilo Duolingo. La aplicacion entrena al usuario en
ciberseguridad, asi que el Dashboard debe sentirse como un mapa de progreso
amable, NO como un panel forense frio.

## Principios
- Paleta oscura por defecto (la app puede estar en claro, pero el Dashboard
  fuerza dark para que no canse la vista en uso prolongado).
- Acentos vibrantes de la paleta del proyecto: violeta `#7C3AED`, rosa
  `#EC4899`, cyan `#06B6D4`, verde `#10B981`, ambar `#F59E0B`, rojo
  `#EF4444`. Color por modulo, nunca decorativo.
- Iconos Phosphor con `weight="fill"` dentro de circulos de color soft. Nada
  de iconos lineales sueltos.
- Tipografia: Bricolage Grotesque para titulares y numeros protagonistas,
  Inter para UI. Letras redondas, sin mono.
- Cards generosamente redondeadas (`--r-blob`, 22px). Sombras suaves dark
  con halo de color por modulo.
- Mascota Argus protagonista en el hero — anclaje emocional, no decoracion.

## Que hacemos
- Hero con anillo de Privacy Score grande y Argus al lado.
- Fila de stats gamificadas: racha (fuego animado), XP, nivel, logros.
- Quick Action card: proxima mision recomendada con CTA pill.
- Cards de modulo 2 columnas con icono enorme en circulo de color y halo
  sutil del mismo color al hacer hover.
- Banner CVE solo si hay criticos hoy.
- Estados completos: loading skeleton, empty con CTA, error legible.
- Datos reales: AuditorService, VaultService, NewsService ya conectados.

## Que NO hacemos
- Cero modo claro forzado: el dashboard siempre dark.
- Cero tipografias mono / brutalist / industrial.
- Cero glassmorphism por defecto.
- Cero gradientes morado-azul random — solo gradientes intencionales
  ligados al estado (success / warning / danger).
- Cero mockear: si el endpoint existe, se consume.
