# Boveda — Direccion de arte

Claymorphism suave sobre bento generoso. Pedagogica y calida, NO infantil. La
diversion vive en personalizacion, logros reales y motion que celebra acciones
correctas — no en confeti gratuito ni niveles vacios.

**Coherencia con el Dashboard.** Misma paleta dark (`primary #7C3AED`,
`secondary #EC4899`, `accent #06B6D4`, success/warning/danger heredados). Misma
tipografia (Bricolage Grotesque en numeros y titulos, Inter en UI). Mismo pack
de iconos: Phosphor `weight="fill"` en circulos soft, cero mezcla. Argus
protagonista como en el Dashboard, pero aqui comenta el Health Score.

**Vault-scope (lo que se anade).** Radios +1 nivel (`--r-vault-blob` 28px en
cards principales, 20px secundarios). Sombras soft-lifted con halo de color
por categoria, no planas. Motion 240-320ms con `--ease-spring` reservado a
logros; resto `--ease-smooth`. Paleta gamificacion derivada (no inventada):
`--vault-health-good/mid/bad`. `--vault-accent` personalizable (4-6 presets,
persiste por usuario en localStorage).

**Gamificacion honesta.** "Salud de la Boveda" 0-100 sobre metricas reales
(% unicas, % fuertes, % sin hit HIBP, dias desde ultima auditoria). Logros
vinculados a acciones de seguridad reales (rotar tras leak, eliminar
reutilizadas, activar 2FA). Cero XP, cero niveles, cero streaks de apertura,
cero confeti generico.

**Lo que NO hacemos.** Glassmorphism por defecto, gradientes random,
mono/industrial, segundo pack de iconos. Mascota interrumpiendo flujos
criticos (alta, borrado, password visible). Mockear datos: VaultService
conectado, todo viene del backend real.
