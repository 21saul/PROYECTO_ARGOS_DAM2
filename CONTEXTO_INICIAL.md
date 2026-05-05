# 🛡️ ARGOS — Contexto Inicial del Proyecto

> **Suite de Ciberseguridad Zero-Knowledge para el Usuario Doméstico**  
> Trabajo de Fin de Grado · Desarrollo de Aplicaciones Multiplataforma (DAM)  
> Año académico 2025-2026

---

## 1. Visión General

**ARGOS** es una aplicación móvil y web multiplataforma que actúa como *entrenador personal de ciberseguridad*. Su misión es doble: **proteger activamente** los datos del usuario doméstico y **formarle progresivamente** para que entienda y gestione su propia seguridad digital.

El paradigma fundamental es el de **Zero-Knowledge**: el servidor actúa exclusivamente como almacén de blobs cifrados opacos. En ningún momento el backend puede descifrar los datos del usuario. La confianza se desplaza del servidor al cliente.

### ¿Por qué existe ARGOS?

| Dato | Fuente |
|---|---|
| 122.223 incidentes gestionados en España en 2025 (+26 % vs. 2024) | INCIBE 2025 |
| El 60 % de las brechas involucran el factor humano | Verizon DBIR 2025 |
| Aumento del 400 % en ataques de QRishing en 2025 | Tendencia sectorial 2025 |
| El 28 % de los usuarios ha sufrido phishing y aún no sabe detectarlo | Estudio de mercado 2025 |

No existe en el mercado hispanohablante ninguna herramienta B2C que unifique **protección inmediata + formación continua + gamificación** bajo un modelo freemium en español.

---

## 2. Público Objetivo

- **Target principal:** Usuarios domésticos de 25 a 65 años con uso intensivo digital pero sin conocimientos técnicos.
- **Target secundario:** Estudiantes de informática / ciberseguridad que quieran orientar su formación.
- **Modelo de negocio:** Freemium. Funcionalidades core gratuitas; módulos avanzados (Asistente IA, análisis ilimitados) bajo suscripción Premium.

---

## 3. Los 5 Módulos Funcionales

### 3.1 🔐 Bóveda Cifrada (Zero-Knowledge Vault)
Gestor de contraseñas, notas seguras y archivos cifrados. El cifrado y descifrado ocurre **exclusivamente en el cliente** mediante AES-256-GCM (Web Crypto API). El servidor solo almacena blobs en `LONGBLOB`. La clave de cifrado se deriva de la contraseña maestra con **Argon2id** (RFC 9106, 64 MB RAM/iteración), lo que hace los ataques de fuerza bruta en GPU económicamente inviables.

- **Capacidad gratuita:** hasta 20 entradas.
- **Funciones:** generador de contraseñas, carpetas organizativas, sincronización multi-dispositivo, acceso por biometría (Capacitor Biometric Auth).
- **Ventaja diferencial vs. Bitwarden:** Argon2id desde el día 0 (Bitwarden usa PBKDF2, no memory-hard). Interfaz en español con guías pedagógicas integradas.

### 3.2 📊 Auditor de Vida Digital (Privacy Score Engine)
Calcula una puntuación de seguridad del usuario de **0 a 100** basada en tres pilares:

| Pilar | Tecnología | Zero-Knowledge |
|---|---|---|
| Identidad (filtraciones) | API HIBP v3 + k-anonymity SHA-1 | ✅ Solo se envían 5 chars del hash |
| Contraseñas (calidad) | Entropía de Shannon + hash SHA-256 local | ✅ Análisis 100% en cliente |
| Dispositivo (configuración) | Capacitor Device + Biometric Auth | ✅ No se transmiten datos |

Fórmula de puntuación:
```
Score_Identidad   = MAX(0, 100 - filtraciones × 20)
Score_Contraseñas = MAX(0, 100 - reutilizadas × 25 - débiles × 10)
Score_Dispositivo = 100 (biometría+bloqueo) | 60 (solo PIN) | 20 (sin protección)
Score_Final       = media ponderada de los tres pilares
```
Genera un **plan de acción semanal** personalizado y un informe exportable en PDF.

### 3.3 🎣 Analizador Educativo de Phishing (Threat Intel Orchestrator)
Pipeline multi-API en serie para el análisis de URLs sospechosas:

1. **Google Safe Browsing API v4** — listas de malware, phishing y software no deseado.
2. **PhishTank (Cisco Talos)** — base de datos colaborativa de URLs de phishing.
3. **Análisis heurístico local** — edad del dominio (RDAP), detección de typosquatting (distancia Damerau-Levenshtein), detección de ataques homógrafo IDN (Unicode multialfabeto).
4. **VirusTotal API v3** — capa final opcional, consenso de +70 motores antivirus.

El módulo no se limita a emitir un veredicto: **explica al usuario por qué una URL es peligrosa** y le enseña a detectarlas de forma autónoma en el futuro.

- **Capacidad gratuita:** 5 análisis/mes.

### 3.4 🗺️ Roadmap de Aprendizaje Gamificado (Meta-Academia)
5 itinerarios de formación en ciberseguridad, completamente en español:

| # | Itinerario | Perfil |
|---|---|---|
| 1 | 🌱 Principiante Absoluto | Sin conocimientos previos |
| 2 | 🌐 Pentest Web | Interés en hacking ético web |
| 3 | 🐧 Hardening Linux | Administración y bastionado |
| 4 | 🛡️ Defensa SOC | Analista de seguridad defensiva |
| 5 | 🔴 Red Team Intro | Hacking ofensivo ético |

Cada nodo incluye: **teoría en español + laboratorio externo** (TryHackMe, HTB Academy, PortSwigger) + **mini-quiz** de validación.

**Mecánicas de gamificación** (basadas en la Teoría de Aversión a la Pérdida de Kahneman & Tversky):
- Rachas diarias (streak) · XP y niveles · Logros desbloqueables
- Gráfico de radar de habilidades (Chart.js) con 5 dimensiones: Linux, Web, Redes, Criptografía, OSINT.

### 3.5 📰 Panel de Noticias y Alertas CVE (Automated Threat Feed)
Sistema automatizado de inteligencia de amenazas domésticas, orquestado con **n8n (self-hosted en Docker)**:

- **CVEs críticos:** Consulta diaria a la NVD (NIST) API 2.0, filtrada por `cvssV3Severity: CRITICAL` y productos domésticos (Windows, Android, iOS, Chrome, routers).
- **Noticias RSS:** INCIBE, Hispasec, BleepingComputer, The Hacker News.
- Cada alerta incluye una **explicación en lenguaje natural** y un plan de acción concreto para el usuario no técnico.

---

## 4. Stack Tecnológico

### Frontend
| Tecnología | Versión | Rol |
|---|---|---|
| Ionic | 8 | Framework de UI multiplataforma (iOS, Android, Web) |
| Angular | 17+ | Framework SPA subyacente |
| Capacitor | 6 | Acceso a APIs nativas del dispositivo |
| Tailwind CSS | 4 | Sistema de estilos utility-first |
| Chart.js | Latest | Gráficos (radar de habilidades, progreso) |

### Backend
| Tecnología | Versión | Rol |
|---|---|---|
| CodeIgniter 4 | Latest | Framework PHP REST API |
| PHP | 8.2+ | Lenguaje del servidor |
| CI Shield | Latest | Autenticación JWT + 2FA TOTP |
| MariaDB | 10.11 | Base de datos relacional |

### Infraestructura y DevOps
| Tecnología | Rol |
|---|---|
| ddev | Entorno de desarrollo local (Docker-based) |
| n8n (self-hosted) | Orquestación de flujos RSS y CVE |
| VPS Hetzner | Despliegue en producción |
| Docker | Aislamiento de contenedores (n8n, CI4) |

### Criptografía (Zero-Knowledge)
| Componente | Algoritmo | Estándar |
|---|---|---|
| KDF | Argon2id (64 MB RAM/iter) | RFC 9106 · OWASP Password Storage CS |
| Cifrado simétrico | AES-256-GCM | NIST FIPS 197 · Web Crypto API (SubtleCrypto) |
| Verificación filtraciones | k-anonymity SHA-1 (5 chars) | HIBP API v3 |

---

## 5. Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────┐
│                   CLIENTE (Ionic 8)                  │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │  Bóveda     │  │  Auditor     │  │  Phishing  │  │
│  │  AES-256-GCM│  │  Score       │  │  Pipeline  │  │
│  │  Argon2id   │  │  Local-Only  │  │  Multi-API │  │
│  └──────┬──────┘  └──────┬───────┘  └─────┬──────┘  │
│         │   Web Crypto API (SubtleCrypto)  │         │
└─────────┼─────────────────────────────────┼─────────┘
          │ HTTPS / JWT (solo blobs cifrados)│
┌─────────▼─────────────────────────────────▼─────────┐
│             BACKEND (CodeIgniter 4 + PHP 8.2)        │
│  REST API  │  CI Shield (JWT+2FA)  │  MariaDB BLOBS  │
└─────────────────────────┬───────────────────────────┘
                          │
          ┌───────────────▼──────────────┐
          │   n8n (Docker self-hosted)    │
          │  CVE Feed (NVD API 2.0)       │
          │  RSS Feed (INCIBE, THN...)    │
          └──────────────────────────────┘
```

> ⚠️ **Principio Zero-Knowledge:** El servidor **nunca** recibe datos en texto claro. Solo almacena y sincroniza estados cifrados opacos.

---

## 6. Módulo Extra: Asistente IA

Un chatbot pedagógico accesible desde cualquier módulo. El backend actúa como proxy hacia una API de LLM.

- **Modelo recomendado MVP:** GPT-4o-mini (OpenAI) — ~0.15$/M tokens entrada. Con 30€ cubre el TFG completo.
- **Alternativa Premium:** Claude Haiku 4.5 (Anthropic) — mejor en razonamiento estructurado.
- **Alternativa Self-Hosted:** Ollama + Llama 3.1 8B en VPS (demuestra conocimiento avanzado de privacidad).
- **Rol:** Solo explica y educa. No emite veredictos de amenazas (eso lo hace el Analizador de Phishing con APIs reales).
- **Disponibilidad:** Solo en tier Premium.

---

## 7. Modelo Freemium

| Funcionalidad | Free | Premium |
|---|---|---|
| Bóveda Cifrada | ✅ (20 entradas) | ✅ Ilimitada |
| Auditor de Vida Digital | ✅ Básico | ✅ Completo + PDF |
| Analizador de Phishing | ✅ 5 análisis/mes | ✅ Ilimitado |
| Roadmap (itinerario Principiante) | ✅ | ✅ Todos los itinerarios |
| Panel CVE y Noticias | ✅ | ✅ |
| Asistente IA | ❌ | ✅ |

---

## 8. KPIs de Calidad (Criterios de Evaluación TFG)

| Indicador | Umbral Mínimo |
|---|---|
| Cobertura de tests unitarios | > 70 % |
| Latencia de la API | < 300 ms (p95) |
| Vulnerabilidades críticas (escáneres) | 0 detectadas |
| Onboarding del usuario | < 10 minutos |

---

## 9. Análisis Competitivo Resumido

| | Norton/Bitdefender | TryHackMe/HTB | Bitwarden | **ARGOS** |
|---|---|---|---|---|
| Formación en español | ❌ | ❌ | ❌ | ✅ |
| Gamificación | ❌ | Parcial | ❌ | ✅ |
| Zero-Knowledge (Argon2id) | ❌ | N/A | ⚠️ (PBKDF2) | ✅ |
| Privacy Score personalizado | ❌ | ❌ | ❌ | ✅ |
| Análisis de phishing educativo | ❌ | ❌ | ❌ | ✅ |
| Modelo B2C freemium | ✅ | Parcial | ✅ | ✅ |

---

## 10. Estructura del Documento TFG (modeloProxecto)

El documento académico final seguirá la estructura obligatoria de 10 puntos:

```
1. Título
2. Índice
3. Objetivos          ← Verbo infinitivo + objeto + finalidad (mín. 3 específicos)
4. Justificación      ← Necesidad, finalidad, problemáticas, exigencias
5. Plan de Trabajo    ← Fichas por etapa (título, ref, objetivos tácticos, tareas,
                         dificultades, resultados, duración, RRHH, RRMM, presupuesto)
6. Calendario         ← Diagrama Gantt / PERT
7. Evaluación         ← KPIs y procedimientos de control
8. Presupuesto        ← Balance neto = 0 (ingresos = gastos)
9. Conclusiones
10. Anexos            ← Diagramas, código, manual de despliegue
```

---

## 11. Riesgos Técnicos Identificados

| Riesgo | Mitigación |
|---|---|
| Vulnerabilidades en n8n (CVE-2026-21858 y similares) | Docker aislado, solo localhost, actualización continua, deshabilitar webhooks no usados |
| Límites de tasa de APIs externas (VirusTotal, HIBP) | Orquestación con n8n + caché de resultados en MariaDB |
| Google Safe Browsing solo para uso no comercial | Documentado; migración a Web Risk API en versión comercial |
| Latencia del Asistente IA en modelo self-hosted | Separación clara entre MVP (API externa) y demo técnica (Ollama) |

---

## 12. Líneas de Investigación Futuras (para Conclusiones TFG)

- Integración con servicios de identidad descentralizada (DID / Web3).
- Módulo de análisis de red doméstica (reemplazaría el pilar de dispositivo con datos reales de tráfico).
- Exportación de Privacy Score como credencial verificable para RRHH o auditorías.
- Expansión del Asistente IA con memoria de sesión y perfil de usuario persistente.
- Certificación del módulo criptográfico bajo FIPS 140-3.

---

*Documento generado como referencia fundacional del proyecto ARGOS.*  
*Última actualización: Abril 2026.*