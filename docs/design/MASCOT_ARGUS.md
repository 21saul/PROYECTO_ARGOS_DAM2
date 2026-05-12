# Argus — Mascota oficial de ARGOS

> **Tagline:** *Siempre te ve, siempre te cuida.*

Argus es un titán-chibi multi-ojo inspirado en **Argos Panoptes**, el guardián
mitológico de los cien ojos. No es terror — es un protector cálido. Cute pero
imponente. Su superpoder narrativo son los **ojos**: están en su cara, en su
capucha, en sus hombreras y en un gran sigilo en el pecho.

## 1. Anatomía SVG

ViewBox: `0 0 120 120`. Proporciones chibi (head:body ≈ 1:1).

| Pieza            | Selector / clase           | Coordenadas (cx,cy)     | Rol                         |
|------------------|----------------------------|-------------------------|-----------------------------|
| Halo místico     | `.halo`                    | 60, 48 · r=44           | Aura de guardián            |
| Sombra suelo     | `.floor-shadow`            | 60, 114 · rx=34 ry=3.6  | Anclaje                     |
| Manto / cuerpo   | `.body` (path)             | 30→90 base · 96→24 abajo| Silueta principal           |
| Pauldron izq.    | `.body ellipse`            | 22, 80 · rx=11 ry=10    | Hombrera porta-ojo          |
| Pauldron der.    | `.body ellipse`            | 98, 80 · rx=11 ry=10    | Hombrera porta-ojo          |
| Brazo izq.       | `.arm.arm-left`            | 16, 94 · r=6            | Mano expresiva              |
| Brazo der.       | `.arm.arm-right`           | 104, 94 · r=6           | Mano expresiva              |
| Capucha          | `.hood` (path)             | arc top hood            | Marco místico               |
| Cara             | `.face`                    | 60, 52 · rx=26 ry=26    | Soporte de ojos principales |
| **Ojo forehead** | `.eye-forehead`            | 60, 28 · r=3.2          | Tercer ojo ornamental       |
| **Ojo izq.**     | `.eye-main.eye-left`       | 46, 56 · rx=7 ry=8.5    | Mirada principal            |
| **Ojo der.**     | `.eye-main.eye-right`      | 74, 56 · rx=7 ry=8.5    | Mirada principal            |
| Cejas            | `.brow-left` / `.brow-right` | 34→52 / 86→68         | Cambian por mood            |
| Boca             | `.mouth`                   | 52→68 · y≈75            | Cambia por mood             |
| Mejillas         | `.cheeks circle`           | 36, 66 + 84, 66         | Visibles en happy / excited |
| **Ojo pauldron izq.** | `.eye-pauldron-left`  | 22, 80 · r=2.8          | Hombrera secundaria         |
| **Ojo pauldron der.** | `.eye-pauldron-right` | 98, 80 · r=2.8          | Hombrera secundaria         |
| **Sigil pecho**  | `.eye-sigil`               | 60, 94 · rx=6.5 ry=4.5  | Marca firma de Argus        |

**Total: 6 ojos** (2 principales + 1 frente + 2 hombros + 1 sigil pecho).

## 2. API del componente

```ts
import { ArgusComponent, ArgusMood } from '@shared/components/argus/argus.component';

@Input() size: number;                     // px, default 80
@Input() mood: ArgusMood;                  // default 'idle'
@Input() theme: 'dark' | 'light';          // default 'dark'
```

```html
<app-argus [size]="120" mood="happy"   theme="dark"></app-argus>
<app-argus [size]="64"  mood="loading" theme="light"></app-argus>
```

## 3. Estados de ánimo (8 + alias)

| Mood       | Cuándo usarlo                              | Animación clave           |
|------------|--------------------------------------------|---------------------------|
| `idle`     | Reposo, dashboard sin acción               | Bob suave + parpadeo 5s   |
| `happy`    | Score alto, logro recién obtenido          | Hop + cheeks + arco boca  |
| `thinking` | Consultando backend, análisis en proceso   | Tilt cabeza + mano arriba |
| `loading`  | Escaneo / streaming de datos               | Radar sweep entre ojos    |
| `success`  | Misión completada, badge desbloqueado      | Burst + sparkles          |
| `error`    | CVE crítico, brecha detectada              | Glitch shake + ceño       |
| `sleeping` | Modo descanso, app inactiva                | Lids cerrados + Zzz       |
| `excited`  | Subida de nivel, celebración fuerte        | Jump spring + cheeks      |
| `alert`    | Alias de `error` (retrocompatibilidad)     | Mismo que `error`         |

## 4. Sistema de color · CSS variables

Tokens declarados en el scope `:host` del componente. Misma silueta en ambos
temas — solo cambia paleta y temperatura de luz.

### Dark — Cosmic Guardian (default)

```css
--mascot-body-1: #2d2a5e;   /* indigo cósmico profundo  */
--mascot-body-2: #1a1b3a;   /* navy noche               */
--mascot-hood-1: #1f1b4a;   /* capucha exterior         */
--mascot-hood-2: #0f0d2a;   /* capucha sombra           */
--mascot-face-1: #3a3670;   /* cara luminosa            */
--mascot-face-2: #2a2658;   /* cara sombra              */
--mascot-eye-bg: #0a0817;   /* fondo de ojo profundo    */
--mascot-iris-1: #5dc8ff;   /* iris claro               */
--mascot-iris-2: #00d4ff;   /* iris cyan eléctrico      */
--mascot-pupil:  #061018;   /* pupila                   */
--mascot-glow:   #00d4ff;   /* halo y sparkles          */
--mascot-rim:    #7b5cd6;   /* violeta neon (rim light) */
--mascot-line:   #c4b8ff;   /* cejas, boca, Zzz         */
--mascot-cheek:  #ec4899;   /* rosa mejillas            */
--mascot-floor:  rgba(0,0,0,0.45);
```

### Light — Friendly Guardian

```css
--mascot-body-1: #7dd87d;   /* mint vibrante            */
--mascot-body-2: #4dd0c8;   /* turquesa fresco          */
--mascot-hood-1: #5dd8a8;
--mascot-hood-2: #38b88a;
--mascot-face-1: #f3fff6;   /* casi blanco              */
--mascot-face-2: #c8eed4;
--mascot-eye-bg: #1a3a2a;
--mascot-iris-1: #8dd6ff;
--mascot-iris-2: #5bb3ff;   /* azul cielo sereno        */
--mascot-pupil:  #0a2030;
--mascot-glow:   #5bb3ff;
--mascot-rim:    #ff8c5a;   /* coral cálido             */
--mascot-line:   #1f4a3a;
--mascot-cheek:  #ffb3a0;
--mascot-floor:  rgba(40,80,60,0.22);
```

## 5. Anatomía animatable (Lottie / Rive)

Si se exporta el SVG a Lottie o Rive, mantener estos grupos como **capas
aisladas** para conservar animación independiente:

- `.halo`
- `.floor-shadow`
- `.body` (manto + 2 pauldrons agrupados)
- `.arms.arm-left` y `.arm-right` (individuales — la izquierda anima a la
  barbilla en `thinking`)
- `.hood`
- `.face`
- `.eye-forehead`, `.eye-pauldron-left`, `.eye-pauldron-right` (3 ojos
  secundarios — cada uno con su propio loop de pulse)
- `.eye-main.eye-left` y `.eye-main.eye-right` (incluyen iris, pupila,
  shine y lid como subcapas para parpadeo y mirada)
- `.brow-left` / `.brow-right` (cambiar `d` path por mood)
- `.mouth` (cambiar `d` path por mood)
- `.cheeks` (toggle opacity)
- `.eye-sigil` (sub-elementos: anillos, almendra, iris, pupila, marcas
  radiales)
- `.zzz` y `.sparkles` (visibilidad condicional por mood)

**Ejes mínimos a exponer en Rive state machine:**

- `mood` (enum: 8 estados)
- `theme` (enum: dark | light) — controla swap de paleta
- `lookX` (-1..1) — desplazamiento iris horizontal
- `lookY` (-1..1) — desplazamiento iris vertical
- `blinkTrigger` — pulso manual de parpadeo
- `sigilPulseTrigger` — pulso de marca firma

## 6. Variantes de uso

Todas viven en `docs/design/mascot-showcase.html` (showcase visual completo).

- **App icon 1024×1024** — esquinas redondeadas iOS (~22% radius), fondo
  radial cosmic. Mascota centrada al 75% del canvas.
- **Sticker pack (5 piezas)** — pill con mascota a 44px + microcopy
  (`¡Bien hecho!` · `¡Subiste de nivel!` · `Déjame ver…` · `¡Cuidado!` ·
  `Modo descanso`).
- **Empty state** — Argus en `mood="loading"` a 180px con CTA *Lanzar escaneo*.
- **Onboarding hero** — Argus en `mood="happy"` a 260px sobre fondo radial
  cosmic. Frase de bienvenida en Bricolage Grotesque.

## 7. Auditoría final · pencilplaybook + ai-graphic-design

- ✅ **Thumbnail 32×32** — silueta hooded con sigil de pecho sigue legible.
  Verificado en `docs/design/mascot-showcase.html` sección *9 · Thumbnail test*.
- ✅ **Paleta dual** — misma silueta y proporciones; cambia solo color y
  temperatura. Personalidad reconocible en ambos modos.
- ✅ **Ojos memorables** — son el rasgo dominante. 6 ojos en disposición
  asimétrica narrativa (face + frente + hombros + pecho). El sigilo de pecho
  funciona como firma incluso si la mascota se recorta a busto.
- ✅ **Coherencia narrativa** — las 8 expresiones comparten anatomía y solo
  varían cejas, boca, posición de iris, opacidad de mejillas y comportamiento
  de ojos secundarios. Mismo personaje en todos los estados.
- ✅ **Diferenciación** — no se confunde con Duo (Duolingo), Octocat, Linear
  ni Slack. El motivo multi-ojo + manto guardián es ownable.
- ✅ **Sin emojis · sin tipografía mono en la mascota · sin gradientes morado-
  azul random** — paleta intencional, glow cyan o azul sereno según tema.
- ✅ **Vectorial-friendly · líneas limpias** — toda la mascota está en
  paths/circles/ellipses puros + 4 gradientes y 1 filtro bloom.

## 8. Archivos

| Archivo                                                | Propósito                          |
|--------------------------------------------------------|------------------------------------|
| `frontend/src/app/shared/components/argus/argus.component.ts` | Componente Angular standalone     |
| `docs/design/MASCOT_ARGUS.md`                          | Este documento                     |
| `docs/design/mascot-showcase.html`                     | Showcase visual standalone         |

## 9. Consumers actuales

- `frontend/src/app/dashboard/dashboard.page.html:94` — `[mood]="scoreMood()"`,
  retorna `'happy' | 'idle' | 'alert'` (subset compatible)
- `frontend/src/app/onboarding/onboarding.page.html:16` — `mood="happy"`

Ambos siguen funcionando sin cambios. Nuevos consumers pueden usar cualquiera
de los 8 moods.

---

## 10. Argus-eye — el ojo escolta flotante

**Componente:** `ArgusEyeComponent` (`<app-argus-eye>`).
Pintado en el shell de la app (`app.component.html:7`). Acompaña al usuario
fuera de las rutas de auth.

### 10.1 Narrativa

Uno de los cien ojos de Argus, **desprendido** del cuerpo principal y libre
en pantalla. Funciona como herald / scout: cuando el usuario lo toca,
suelta un consejo de ciberseguridad. Se puede arrastrar por la pantalla y
recuerda su posición en `localStorage`.

### 10.2 Cambio de dirección

Antes: ojo blanco horizontal con dos alas de pluma estilo angelical.

Ahora: **sigilo cósmico vertical** — almendra vertical (lente místico)
enmarcada por anillo runic con 4 marcas cardinales, idéntica a la firma del
sigil del pecho de la mascota principal. Las alas se reemplazaron por **2
partículas orbitales** (mini-ojos satélite) que giran alrededor del marco
en sentido horario.

### 10.3 Anatomía SVG (viewBox 120×140 · render 68×80)

| Pieza             | Clase / selector       | Coords (cx,cy · r)      | Animación               |
|-------------------|------------------------|-------------------------|-------------------------|
| Halo cósmico      | `.halo`                | 60,70 · r=58            | `haloPulse` 3.6s        |
| Orbital sup-der.  | `.orbit.orbit-tr`      | 96,24 · r=4             | `orbitCW` 6.5s + pulse  |
| Orbital inf-izq.  | `.orbit.orbit-bl`      | 24,116 · r=4            | `orbitCW` 6.5s (+1.1s)  |
| Anillo exterior   | `circle`               | 60,70 · r=40            | (estático)              |
| Anillo interior   | `circle`               | 60,70 · r=32            | (estático)              |
| Cardinal ticks    | `.cardinals`           | N/S/E/W                 | `cardinalSpin` 16s lin. |
| Almendra ojo      | `.almond`              | 60,70 · rx=18 ry=28     | (estático)              |
| Iris              | `.iris`                | 60,70 · r=12            | `irisBreathe` 3s        |
| Pupila            | `.pupil`               | 60,70 · r=6.5           | (estático)              |
| Destello shine    | `.shine` + secundario  | 55,63 + 64,76           | (estático)              |
| Párpado           | `.lid` rect            | x=42 y=42 w=36          | `blink` 6s              |
| Sombra suelo      | `.ground-shadow`       | 60,132 · rx=28 ry=3.5   | `shadowPulse` 3.4s      |

### 10.4 Estados del componente

- **Idle** — float + halo respira + iris respira + cardinales rotando
  + orbitales orbitando + parpadeo cada 6s.
- **Talking** — escala 1.06 + parpadeo rápido (`blinkTalk` 1.4s) +
  cardinales aceleran a 4s + burbuja con el consejo.
- **Dragging** — sin animación de hover, escala 1.08, drop-shadow más
  intenso en color violeta del frame.

### 10.5 Tokens dual-theme

Declarados en `:host`. Cambia el iris (cyan vs azul cielo), el frame
(violeta vs coral) y el fondo de burbuja (oscuro vs casi blanco).
Misma silueta y proporciones en ambos modos.

```css
/* DARK (default) */
--eye-frame:  #7b5cd6;  --eye-iris-2: #00d4ff;
--eye-glow:   #00d4ff;  --eye-pupil:  #061018;

/* LIGHT */
--eye-frame:  #ff8c5a;  --eye-iris-2: #5bb3ff;
--eye-glow:   #5bb3ff;  --eye-pupil:  #0a2030;
```

### 10.6 Interacción (sin cambios)

- Drag con threshold 6px (distingue tap de drag)
- Posición persistida en `localStorage` key `argos-eye-position`
- Tap → tip random de un catálogo de 20 consejos
- Auto-cierre del bubble a los 4s
- Click fuera cierra el bubble
- Rutas ocultas: `/onboarding`, `/login`, `/register`
- Resize del viewport mantiene el ojo dentro del área visible
- Bounds de drag: 76×88 px (acomodan las partículas orbitales)
