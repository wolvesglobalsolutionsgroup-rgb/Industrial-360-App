# ESPECIFICACIÓN DE ARQUITECTURA TÉCNICA MAESTRA: SISTEMA DE FIRMA ELECTRÓNICA REGISTRADA (SUSCERTE N° 045) Y PROTOCOLO DE ENLACE DISCIPLINAR PAR-A-PAR (EMISOR ↔ RECEPTOR)

**Proyecto:** Industrial Control 360 — The Oil & Gas Operating System  
**Ubicación del Documento:** `docs/architecture/SISTEMA_FIRMAS_DIGITALES_Y_WORKFLOW_EMISOR_RECEPTOR.md`  
**Estado:** Especificación Técnica Maestra v1.0 — Producción / Enterprise Grade  
**Normativa y Estándares de Referencia:**  
- **Ley de Mensajes de Datos y Firmas Electrónicas de Venezuela** (Gaceta Oficial N° 37.076).  
- **Norma SUSCERTE N° 045** (Requisitos Técnicos para Proveedores de Servicios de Certificación, Firma Electrónica Registrada y Sellado de Tiempo).  
- **Normas PDVSA SIHO / HSE**: SI-S-04 (Gerencia del Riesgo), Permisos de Trabajo Seguro (PTS/PTW SIHO-A), AST HO-H-02.  
- **Norma PDVSA Ambiente**: MA-01-02-12 (Evaluación Ambiental y Manejo de Desechos).  
- **Norma PDVSA Inspección y Contratos**: PIC-03-01-19 (Medición, Valuación y Liquidación de Obras/Servicios).  

---

## ÍNDICE GENERAL

1. [VISIÓN GENERAL Y ARQUITECTURA DE INTEGRACIÓN](#1-visión-general-y-arquitectura-de-integración)
2. [ARQUITECTURA 1: SISTEMA DE FIRMA ELECTRÓNICA REGISTRADA END-TO-END (NORMA SUSCERTE N° 045)](#2-arquitectura-1-sistema-de-firma-electrónica-registrada-end-to-end-norma-suscerte-n-045)
3. [ARQUITECTURA 2: PROTOCOLO DE ENLACE PAR-A-PAR "EMISOR ↔ RECEPTOR" (CONEXIÓN DISCIPLINAR)](#3-arquitectura-2-protocolo-de-enlace-par-a-par-emisor--receptor-conexión-disciplinar)
4. [MODELADO DE DATOS FIRESTORE Y ESQUEMA DE SEGURIDAD](#4-modelado-de-datos-firestore-y-esquema-de-seguridad)
5. [MATRIZ DE IMPLEMENTACIÓN TÉCNICA Y COMPLIANCE](#5-matriz-de-implementación-técnica-y-compliance)

---

## 1. VISIÓN GENERAL Y ARQUITECTURA DE INTEGRACIÓN

**Industrial Control 360** integra dos capas críticas para la certeza jurídica, operativa y administrativa en contratos de la industria petrolera y petroquímica:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        INDUSTRIAL CONTROL 360 - CAPA ENTERPRISE                        │
├────────────────────────────────────────────────────────┬───────────────────────────────┤
│    SISTEMA DE FIRMA ELECTRÓNICA REGISTRADA (SUSCERTE)  │   ENLACE DISCIPLINAR PAR-A-PAR│
│  - Captura Vectorial Trazada + Imagen PNG Saneada      │  - SIHO / HSE (PTS, AST)      │
│  - Autenticación 2FA / PIN OTP (Argon2id Hashing)     │  - QA / QC (Juntas, NDT)      │
│  - Par de Llaves RSA-4096 / ECDSA (Cert. X.509 v3)     │  - Ambiente (MA-01-02-12)     │
│  - Estampado SHA-256 + QR + TSA TimeStamping           │  - Contratos (PIC-03-01-19)   │
│  - Bóveda Data Escrow Inmutable WORM                   │  - Notificaciones Real-Time   │
└────────────────────────────────────────────────────────┴───────────────────────────────┘
```

---

## 2. ARQUITECTURA 1: SISTEMA DE FIRMA ELECTRÓNICA REGISTRADA END-TO-END (NORMA SUSCERTE N° 045)

### 2.1 Marco Legal, Criptográfico y Modelo de Confianza PKI

El módulo de Firma Digital de Industrial Control 360 se diseña bajo estricto cumplimiento con la **Ley de Mensajes de Datos y Firmas Electrónicas (GO N° 37.076)** y la **Norma SUSCERTE N° 045** para Proveedores de Servicios de Certificación (PSC).

#### Principios Fundamentales Implementados:
1. **Atribución e Identidad:** Vinculación unívoca del firmante mediante Cédula de Identidad / Pasaporte, RIF, Huella dactilar/PIN y token de autenticación.
2. **Integridad del Mensaje de Datos:** Uso del algoritmo estándar **SHA-256** (Secure Hash Algorithm 256 bits) para garantizar que cualquier modificación posterior invalide la firma.
3. **No Repudio:** La combinación del PIN OTP hash, certificado X.509 v3, IP de firma, geolocalización GPS y sello de tiempo TSA impide que el emisor niegue la emisión del documento.
4. **Resguardo Inalterable (Data Escrow):** Custodia de evidencias digitales en depósito inmutable (WORM - Write Once, Read Many).

---

### 2.2 Registro y Perfil de Firma Digital por Usuario

Cada usuario de la plataforma (Inspectores, Supervisores, Custodios, Gerentes y Fiscales) debe completar su **Perfil de Firma Digital Registrada** antes de poder firmar cualquier documento oficial.

#### Componentes del Perfil (`digital_signature_profile`):
1. **Firma Trazada (Canvas Vectorial):** Captura directa en pantalla táctil o mouse con muestreo de velocidad, presión y coordenadas SVG.
2. **Firma Subida (Imagen Oficial):** Carga de archivo PNG transparente, sometido a saneamiento automático antimalware.
3. **PIN OTP Criptográfico de 6 dígitos:** Código secreto personal requerido al momento del estampado de firma (Almacenado Hash Argon2id).
4. **Token Criptográfico / Par de Llaves X.509:** Llave Pública en Firestore; Llave Privada cifrada con AES-256-GCM.

```typescript
export interface UserSignatureProfile {
  userId: string;
  orgId: string;
  identityDocument: {
    type: 'V' | 'E' | 'J' | 'P';
    number: string;
    fullName: string;
    cargo: string;
    colegioProfesional?: string;
  };
  signatureVectorUrl: string;
  signaturePngUrl: string;
  pinHash: string;
  publicKeyPem: string;
  isVerifiedByAdmin: boolean;
  verifiedAt?: string;
  verifiedByUserId?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

### 2.3 Estampado de Inmutabilidad SHA-256, Código QR y Data Escrow WORM

1. **Compilación del Documento PDF Final:** El motor renderiza el documento completo incorporando las imágenes de las firmas, nombres, cédulas, cargos y timestamps.
2. **Generación del HASH SHA-256:** Se calcula el digest unívoco del archivo PDF resultante.
3. **Estampado del Código QR Dinámico:** Se inserta un código QR en el pie de página con la URI de verificación pública: `https://app.industrialcontrol360.com/verify-signature/{documentHash}`.
4. **Data Escrow WORM:** El archivo final y sus evidencias se registran con política de inmutabilidad (Object Lock / WORM) en Firebase Storage durante 10 años conforme al Código de Comercio.

---

## 3. ARQUITECTURA 2: PROTOCOLO DE ENLACE PAR-A-PAR "EMISOR ↔ RECEPTOR" (CONEXIÓN DISCIPLINAR)

### 3.1 Topología y Filosofía de Enlace Peer-to-Peer Disciplinar

```
                   TOPOLOGÍA ENLACE PAR-A-PAR POR DISCIPLINAS
                   
        CONTRATISTA (EMISOR)                           CLIENTE OPERADOR (RECEPTOR)
 ┌────────────────────────────────┐                 ┌────────────────────────────────┐
 │ Inspector SIHO Contratista     │◄──[SIHO/HSE]───►│ Custodio / SIHO PDVSA-Chevron  │
 ├────────────────────────────────┤                 ├────────────────────────────────┤
 │ Inspector QA/QC Contratista    │◄──[QA/QC]──────►│ Inspector QA/QC Cliente        │
 ├────────────────────────────────┤                 ├────────────────────────────────┤
 │ Coordinador Ambiental          │◄──[AMBIENTE]───►│ Fiscal Ambiental (MA-01-02-12)  │
 ├────────────────────────────────┤                 ├────────────────────────────────┤
 │ Planificador / Ing. Residente  │◄──[CONTRATOS]──►│ Fiscal de Contrato / Ing. Insp.│
 └────────────────────────────────┘                 └────────────────────────────────┘
```

### 3.2 Matriz Operativa de Interacción por Disciplinas

| Disciplina | Rol Emisor (Contratista) | Rol Receptor (Cliente Operador) | Artefactos Intercambiados | Normativa PDVSA / Int. |
| :--- | :--- | :--- | :--- | :--- |
| **SIHO / HSE** | Inspector / Superv. SIHO | Custodio Instalación / Superv. SIHO PDVSA-Chevron | PTS / PTW, AST HO-H-02, Minutas 5 Min, Pruebas de Gas, Incidentes | PDVSA SI-S-04 / OSHA 1910 |
| **QA / QC** | Inspector QA/QC / NDT | Inspector QA/QC Cliente / NDT Level III | Isométricos Liberados, Reportes VT/UT/RT, Dossier de Soldadura | ASME B31.3 / API 1104 / ASTM |
| **Ambiente** | Coordinador Ambiental | Inspector / Fiscal Ambiental Cliente | Manifiestos de Desechos, Caracterización de Efluentes, Planes Manejo | PDVSA MA-01-02-12 / RAS |
| **Contratos** | Planificador / Gerente Obra | Fiscal de Contrato / Ing. Residente Cliente | Valuaciones PIC-03-01-19, Actas de Medición, Reclamos Stand-By, MOC | PDVSA PIC-03-01-19 / FIDIC |

---

## 4. MODELADO DE DATOS FIRESTORE Y ESQUEMA DE SEGURIDAD

```text
/organizations/{orgId}
  ├── /users/{userId}
  │     └── /signature_profile
  └── /projects/{projectId}
        ├── /signature_requests/{requestId}
        │     └── /signature_logs/{logId}
        ├── /peer_enlinks/{enlinkId}
        │     └── /audited_threads/{threadId}
        └── /data_escrow_vault/{escrowId}
```

---

## 5. MATRIZ DE IMPLEMENTACIÓN TÉCNICA Y COMPLIANCE

| Módulo / Funcionalidad | Componente Frontend / Service | Servicio Backend / Storage | Norma / Ley Requerida |
| :--- | :--- | :--- | :--- |
| **Perfil Firma Vectorial** | `SignatureCanvasModal.tsx` | Firebase Storage (`/signatures/`) | Ley Mensajes de Datos Vzla |
| **Autenticación PIN OTP** | `OtpPinInput.tsx` | Argon2id Hash / Cloud Functions | Norma SUSCERTE N° 045 |
| **Estampado SHA-256 & QR** | `PdfSignatureStamper.ts` | `pdf-lib` + `qrcode` SVG Engine | ISO/IEC 18014 / SUSCERTE |
| **Data Escrow WORM** | `DataEscrowVaultService.ts` | AWS S3 Object Lock / Firebase Storage | Código de Comercio Vzla (10 años) |
| **Tableros Enlace Cliente** | `ClientPeerReviewConsole.tsx` | Firestore Collection Group Queries | Normas PDVSA SIHO / QAQC / PIC |
