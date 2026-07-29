# PLANTILLAS DE DOCUMENTOS PDVSA — ESTRUCTURA EXACTA
## Industrial Control 360 — Módulo de Generación Automática de Documentos

> **Propósito:** Documentar la estructura completa de 4 documentos PDVSA reales para crear templates generables por la app Industrial Control 360.
>
> **Documentos analizados:**
> 1. **PIC-01-03-05** — Codificación de Proyectos (Norma PDVSA)
> 2. **Plan de Calidad PDVSA San Tomé** — Aseguramiento de Calidad (Rev. A)
> 3. **Valuación 10 — Resumen de Ejecución** — Valuación de Obra (ROE)
> 4. **Cómputos Métricos (Ac0131302-Ce0d3-Cp02001-revB)** — Cómputos de Ingeniería

**Basado en:** Código existente en `src/lib/data/pdvsa/`, `src/lib/dossier/`, y normas PDVSA estándares CIED-PDVSA.

---

## 1. RESUMEN DE CÓDIGOS DE DOCUMENTO (PIC-01-03-05)

```
AABBCCDDEE-FFGHI-JKLLMMM-REV#
││││││││││ │││││ │││││││    │
││││││││││ │││││ │││││││    └─ Revisión (0, A, B, C...)
││││││││││ │││││ └┴┴┴┴┴──── Grupo 3: JKLLMMM (7 char)
││││││││││ │││││    ││││││
││││││││││ │││││    │││││└── Correlativo (MMM: 001-999)
││││││││││ │││││    │││└─── Producto (LL: Anexo E/F, 2 char)
││││││││││ │││││    │└──── Tipo Doc (K: D=Documento, P=Plano)
││││││││││ │││││    └───── Disciplina (J: G,P,M,E,C,I,Q...)
││││││││││ ││││└────────── Actividad (I: 1-6)
││││││││││ │││└─────────── Fase (H: V=Visualizar, C=Conceptualizar, D=Definir, I=Implantar, O=Operar)
││││││││││ ││└──────────── Subproyecto (G: 0-9)
││││││││││ │└───────────── Instalación (FF: Anexo D, 2 char)
││││││││││ └────────────── Grupo 2: FFGHI (5 char)
││││││││││
│││││││││└── Consecutivo Proyecto (EE: 01, A1, AA...)
││││││││└─── Año (DD: 26=2026)
│││││││└──── Área Geográfica (CC: 01=Jose/Jusepín, 14=Punta de Mata...)
││││││└───── ACE / Área Corporativa (BB: A0=Occidente, C0=Oriente...)
│││││└────── Filial (AA: A1=E&P, D1=Gas, E1=Refinación, WGS=Contratista)
││││└─────── Grupo 1: AABBCCDDEE (10 char)
│││└────────
││└─────────
│└──────────
└───────────

**Código Simplificado de Campo:** FILIAL-ACE-PROYECTO-FASE_DISC-TIPO_DOC-CORRELATIVO-REV
  Ejemplo: WGS-EP-JUS-DM-MEM-0001-REV0
