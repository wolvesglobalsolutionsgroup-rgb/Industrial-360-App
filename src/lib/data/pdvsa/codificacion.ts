export interface PDVSACodeStandardParams {
  // Grupo 1: Identificación del Proyecto (AABBCCDDEE)
  filialAA: string;         // e.g. 'A1' (E&P), 'D1' (Gas), 'E1' (Refinación), 'T0' (INTEVEP), 'WGS'
  aceBB: string;            // e.g. 'A0' (Occidente), 'C0' (Oriente), 'E0' (Costa Afuera), 'EP'
  areaGeograficaCC: string; // e.g. '01' (Jose/Jusepín), '02' (Furrial), '14' (Punta de Mata), 'JUS'
  anioDD: string;           // e.g. '26'
  consecutivoEE: string;    // e.g. '01', 'A1', 'AA'

  // Grupo 2: Identificación de la Actividad (FFGHI)
  instalacionFF: string;    // Anexo D e.g. 'CW' (CPF), 'GD' (Gasoducto), 'TQ' (Patio Tanques), 'PB' (Planta Compresora)
  subproyectoG: number;     // 0 to 9
  faseH: string;            // 'V' (Visualizar), 'C' (Conceptualizar), 'D' (Definir), 'I' (Implantar), 'O' (Operar)
  actividadI: string;       // '1' (Comunicación), '2' (Planificación), '3' (Ingeniería), '4' (Calidad), '5' (Contratación), '6' (Procura)

  // Grupo 3: Identificación del Documento (JKLLMMM)
  disciplinaJ: string;      // 'G', 'P', 'M', 'E', 'C', 'I', 'Q', 'N', 'O', 'H', 'S', 'T'
  tipoDocK: string;         // 'D' (Documento), 'P' (Plano)
  productoLL: string;       // Anexo E/F e.g. '01' (Memoria), '12' (P&ID), '03' (Isométrico)
  correlativoMMM: number;   // 001 to 999
  revision: string;         // 'A', 'B', 'C', '0', '1', '2'
}

// ---------------------------------------------------------------------------
// ANEXO C: CATÁLOGO FILIAL O NEGOCIO (AA), ACE (BB) Y ÁREA GEOGRÁFICA (CC)
// ---------------------------------------------------------------------------
export const PDVSA_FILIALES_C = [
  { code: 'A1', label: 'A1 — Exploración y Producción (E&P)' },
  { code: 'B1', label: 'B1 — Comercio y Suministro' },
  { code: 'D1', label: 'D1 — PDVSA Gas' },
  { code: 'E1', label: 'E1 — Refinación' },
  { code: 'F1', label: 'F1 — Holding PDVSA (HPDV)' },
  { code: 'G1', label: 'G1 — Palmaven' },
  { code: 'H1', label: 'H1 — Corporación Venezolana del Petróleo (CVP)' },
  { code: 'I1', label: 'I1 — PDVSA Gas Comunal' },
  { code: 'J1', label: 'J1 — PDVSA Industrial' },
  { code: 'K1', label: 'K1 — Ingeniería y Construcción' },
  { code: 'L1', label: 'L1 — PDVSA Servicios' },
  { code: 'M1', label: 'M1 — PDVSA América' },
  { code: 'N1', label: 'N1 — PDV Marina (OPMR)' },
  { code: 'P1', label: 'P1 — Dirección Ejecutiva Faja del Orinoco' },
  { code: 'Q1', label: 'Q1 — PDVSA Agrícola' },
  { code: 'R1', label: 'R1 — Petrobicentenario' },
  { code: 'S1', label: 'S1 — D.E. Proyecto Socialista Orinoco (PSO)' },
  { code: 'T1', label: 'T1 — D.E. Nuevos Desarrollos' },
  { code: 'U1', label: 'U1 — PDVSA Asfalto' },
  { code: 'V1', label: 'V1 — Venfleet Product' },
  { code: 'W1', label: 'W1 — Gerencia Corporativa de Logística' },
  { code: 'T0', label: 'T0 — INTEVEP (Centro de Investigación)' },
  { code: 'WGS', label: 'WGS — Wolves Global Solutions / Contratista Operativa' }
];

export const PDVSA_ACES_C = [
  { code: 'A0', label: 'A0 — Occidente / Mercado Nacional / Paraguaná' },
  { code: 'B0', label: 'B0 — Ingeniería y Proyectos / Oriente / El Palito' },
  { code: 'C0', label: 'C0 — Oriente / Refinería Puerto La Cruz / AIT' },
  { code: 'D0', label: 'D0 — Centro / Centro Occidente / Gestión Refinación' },
  { code: 'E0', label: 'E0 — Costa Afuera / Llanera / Centro Único Recobro' },
  { code: 'F0', label: 'F0 — Operaciones Acuáticas / Andina / CIED' },
  { code: 'G0', label: 'G0 — Faja División Ayacucho / Consultoría Jurídica' },
  { code: 'H0', label: 'H0 — Faja División Carabobo / Recursos Humanos' },
  { code: 'I0', label: 'I0 — Faja División Junín / Planificación' },
  { code: 'J0', label: 'J0 — Terminales, Oleoductos y Almacenamiento' },
  { code: 'EP', label: 'EP — Exploración y Producción (Acrónimo Corto)' },
  { code: 'RN', label: 'RN — Refinación y Petroquímica (Acrónimo Corto)' },
  { code: 'GA', label: 'GA — Gas y Líquidos (Acrónimo Corto)' }
];

export const PDVSA_AREAS_GEOGRAFICAS_C = [
  { code: '01', label: '01 — Jose / Jusepín / Bachaquero Lago / Paria / Amuay / El Tigre' },
  { code: '02', label: '02 — Furrial / Bachaquero Tierra / Deltana / Cardón / Los Teques' },
  { code: '03', label: '03 — Orocual / Bajo Grande / Golfo Paria / San Joaquín / Tía Juana' },
  { code: '04', label: '04 — El Carito / Barua - Motatán / Punta Pescador / Santa Bárbara' },
  { code: '05', label: '05 — Pirital / Cabimas / Blanquilla / Los Andes / Campo Soto' },
  { code: '06', label: '06 — Manresa / Centro Sur Lago / Golfo Triste / Campo Santa Rosa' },
  { code: '07', label: '07 — La Ceiba / Ceuta - Treco / Golfo Venezuela / Anaco' },
  { code: '08', label: '08 — La Vieja / Dabajuro / Falcón NE / Guárico' },
  { code: '09', label: '09 — Cerro Pelao / Franquera / Güiria / Yaracuy' },
  { code: '10', label: '10 — Quiamare / Carúpano / Trujillo / Campo El Toco' },
  { code: '11', label: '11 — Rusio Viejo / Cumaná / Maturín' },
  { code: '12', label: '12 — Tacata / Irapa / La Salina' },
  { code: '13', label: '13 — Maturín / Macuro / Lagocinco' },
  { code: '14', label: '14 — Punta de Mata / Puerto de Hierro / Lagomar' },
  { code: '15', label: '15 — Musipán / La Vela de Coro / Lagomedio' },
  { code: '16', label: '16 — Caripito / Los Taques / Lagunillas Lago' },
  { code: '17', label: '17 — Santa Bárbara / Punto Fijo / Lagunillas Tierra' },
  { code: '18', label: '18 — El Tejero / Araya / Mara' },
  { code: '19', label: '19 — Sucre / Mene Mauroa' },
  { code: '20', label: '20 — Nueva Esparta / Moporo' },
  { code: 'JUS', label: 'JUS — Campo Jusepín (Acrónimo Corto)' },
  { code: 'BCN', label: 'BCN — Distrito Barinas (Acrónimo Corto)' },
  { code: 'LUN', label: 'LUN — Lago Unare / Costero (Acrónimo Corto)' }
];

// ---------------------------------------------------------------------------
// ANEXO D: LISTA DE INSTALACIONES (FF)
// ---------------------------------------------------------------------------
export const PDVSA_INSTALACIONES_D = [
  { code: 'CW', label: 'CW — Centro de Procesamiento de Fluidos (CPF)' },
  { code: 'GD', label: 'GD — Gasoducto' },
  { code: 'OD', label: 'OD — Oleoducto' },
  { code: 'PB', label: 'PB — Planta Compresora de Gas' },
  { code: 'TQ', label: 'TQ — Patio de Tanques / Almacenamiento' },
  { code: 'EB', label: 'EB — Estación de Bombeo' },
  { code: 'XH', label: 'XH — Estación de Descarga' },
  { code: 'EF', label: 'EF — Estación de Flujo' },
  { code: 'XA', label: 'XA — Estación de Medición y Regulación (EMR)' },
  { code: 'XB', label: 'XB — Estación de Regulación Primaria (ERP)' },
  { code: 'UG', label: 'UG — Acometidas' },
  { code: 'AC', label: 'AC — Acueducto' },
  { code: 'AH', label: 'AH — Aeropuerto / Helipuerto' },
  { code: 'AM', label: 'AM — Almacén de Materiales' },
  { code: 'LB', label: 'LB — Análisis de Muestras de Crudo' },
  { code: 'AT', label: 'AT — Astillero' },
  { code: 'BL', label: 'BL — Base Logística' },
  { code: 'CK', label: 'CK — Cabezales Húmedos' },
  { code: 'CT', label: 'CT — Cabezales Secos' },
  { code: 'CD', label: 'CD — Canal de Drenaje' },
  { code: 'CB', label: 'CB — Central de Bomberos' },
  { code: 'CS', label: 'CS — Centro de Salud' },
  { code: 'SG', label: 'SG — Centro de Servicios Generales' },
  { code: 'CO', label: 'CO — Centro Operativo' },
  { code: 'EA', label: 'EA — Edificio Administrativo' },
  { code: 'EE', label: 'EE — Estación de Distribución Eléctrica' },
  { code: 'ED', label: 'ED — Estación de Drenaje' },
  { code: 'FF', label: 'FF — Estación de Flujo Flotante' },
  { code: 'EN', label: 'EN — Estación de Mantenimiento' },
  { code: 'ER', label: 'ER — Estación de Rebombeo o Reforzadora' },
  { code: 'XI', label: 'XI — Estación de Recolección' },
  { code: 'EC', label: 'EC — Estación de Telecomunicaciones' },
  { code: 'XE', label: 'XE — Estación de Válvulas Automáticas' },
  { code: 'XD', label: 'XD — Estación Inicial' },
  { code: 'XF', label: 'XF — Estación Terminal' },
  { code: 'FS', label: 'FS — Floating Production Storage and Offloading (FPSO)' },
  { code: 'GI', label: 'GI — Gasoducto de Exportación' },
  { code: 'GS', label: 'GS — Gasoducto Submarino' },
  { code: 'JK', label: 'JK — Jacket / Estructura Costa Afuera' },
  { code: 'LA', label: 'LA — Laboratorio de Ensayo' },
  { code: 'LT', label: 'LT — Línea de Transmisión Eléctrica' },
  { code: 'MS', label: 'MS — Manifolds Submarinos' },
  { code: 'MC', label: 'MC — Mejorador de Crudo Extra Pesado' },
  { code: 'MO', label: 'MO — Monoboya de Carga' },
  { code: 'MU', label: 'MU — Muelle / Embarcadero' },
  { code: 'MA', label: 'MA — Múltiple de Agua' },
  { code: 'MB', label: 'MB — Múltiple de Bombeo' },
  { code: 'MD', label: 'MD — Múltiple de Diluente' },
  { code: 'MG', label: 'MG — Múltiple de Gas' },
  { code: 'MP', label: 'MP — Múltiple de Producción' },
  { code: 'TR', label: 'TR — Plataforma Central de Procesos' },
  { code: 'TO', label: 'TO — Plataforma Cabezales de Pozos' },
  { code: 'TK', label: 'TK — Plataforma de Compresión' },
  { code: 'XN', label: 'XN — Plataforma de Perforación' },
  { code: 'XK', label: 'XK — Plataforma de Producción' },
  { code: 'SP', label: 'SP — Plataforma de Producción Costa Afuera' },
  { code: 'AP', label: 'AP — Planta de Amina (Endulzamiento)' },
  { code: 'PC', label: 'PC — Planta de Asfalto' },
  { code: 'PD', label: 'PD — Planta de Azufre' },
  { code: 'PF', label: 'PF — Planta de Coquefacción (Coking)' },
  { code: 'PG', label: 'PG — Planta Craqueo Catalítico (FCC)' },
  { code: 'PH', label: 'PH — Planta de Destilación' },
  { code: 'PI', label: 'PI — Planta Distribución Combustible (Llenadero)' },
  { code: 'PJ', label: 'PJ — Planta de Endulzamiento de Gas' },
  { code: 'XY', label: 'XY — Planta Extracción Líquidos Gas Natural (LGN)' },
  { code: 'PW', label: 'PW — Planta de Fraccionamiento' },
  { code: 'PX', label: 'PX — Planta de Gas Licuado (GLP)' },
  { code: 'XM', label: 'XM — Planta GNL (Gas Natural Licuado)' },
  { code: 'PK', label: 'PK — Planta Hidroconversión' },
  { code: 'PL', label: 'PL — Planta Hidrógeno' },
  { code: 'PM', label: 'PM — Planta Hidrotratamiento / Hidrocraqueo' },
  { code: 'PN', label: 'PN — Planta Inyección Química' },
  { code: 'PO', label: 'PO — Planta Inyección Vapor' },
  { code: 'PP', label: 'PP — Planta Inyección Agua' },
  { code: 'PY', label: 'PY — Planta Lubricantes' },
  { code: 'PR', label: 'PR — Planta Potabilización Agua' },
  { code: 'GH', label: 'GH — Planta Punto de Rocío' },
  { code: 'PZ', label: 'PZ — Planta Reformado Catalítico' },
  { code: 'RF', label: 'RF — Planta Refrigeración' },
  { code: 'TA', label: 'TA — Planta Tratamiento Aguas Aceitosas' },
  { code: 'TB', label: 'TB — Planta Tratamiento Aguas Ácidas' },
  { code: 'TC', label: 'TC — Planta Tratamiento Aguas Proceso' },
  { code: 'TD', label: 'TD — Planta Tratamiento Aguas Residuales' },
  { code: 'XJ', label: 'XJ — Planta Termoeléctrica' },
  { code: 'DU', label: 'DU — Poliducto' },
  { code: 'CG', label: 'CG — Pozo Productor Crudo y Gas' },
  { code: 'GG', label: 'GG — Pozo Productor Gas' },
  { code: 'RC', label: 'RC — Red Distribución Crudo' },
  { code: 'RD', label: 'RD — Red Distribución Combustible' },
  { code: 'RG', label: 'RG — Red Distribución Gas' },
  { code: 'RE', label: 'RE — Red Distribución Eléctrica' },
  { code: 'UD', label: 'UD — Red Gas Doméstico' },
  { code: 'RI', label: 'RI — Riser (Tubería Ascendente)' },
  { code: 'SI', label: 'SI — Servicios Industriales' },
  { code: 'SE', label: 'SE — Subestación Eléctrica' },
  { code: 'TL', label: 'TL — Taller Mecánico / Fabricación' },
  { code: 'UB', label: 'UB — Terminal Almacenamiento y Embarque Líquidos' },
  { code: 'VN', label: 'VN — Vialidad / Accesos' }
];

// ---------------------------------------------------------------------------
// FASES DEL PROYECTO (H)
// ---------------------------------------------------------------------------
export const PDVSA_FASES_H = [
  { code: 'V', label: 'V — Visualizar (Fase FEL-1)' },
  { code: 'C', label: 'C — Conceptualizar (Fase FEL-2)' },
  { code: 'D', label: 'D — Definir / Ingeniería de Detalle (Fase FEL-3)' },
  { code: 'I', label: 'I — Implantar / Construcción y Procura' },
  { code: 'O', label: 'O — Operar / Arranque y Operación' }
];

// ---------------------------------------------------------------------------
// CLASIFICACIÓN POR ACTIVIDAD (I)
// ---------------------------------------------------------------------------
export const PDVSA_ACTIVIDADES_I = [
  { code: '1', label: '1 — Comunicación y Gestión Documental' },
  { code: '2', label: '2 — Planificación y Control (Presupuesto y Desembolsos)' },
  { code: '3', label: '3 — Ingeniería' },
  { code: '4', label: '4 — Gestión de la Calidad' },
  { code: '5', label: '5 — Contratación' },
  { code: '6', label: '6 — Procura' }
];

// ---------------------------------------------------------------------------
// DISCIPLINAS (J)
// ---------------------------------------------------------------------------
export const PDVSA_DISCIPLINAS_J = [
  { code: 'G', label: 'G — General / Gerencia de Proyecto' },
  { code: 'P', label: 'P — Procesos / Operaciones' },
  { code: 'M', label: 'M — Mecánica / Tuberías' },
  { code: 'E', label: 'E — Electricidad' },
  { code: 'C', label: 'C — Civil / Estructuras / Arquitectura' },
  { code: 'I', label: 'I — Instrumentación y Control' },
  { code: 'Q', label: 'Q — Calidad / Aseguramiento' },
  { code: 'N', label: 'N — Naval / Marítimo' },
  { code: 'O', label: 'O — Geodesia / Topografía / Batimetría' },
  { code: 'H', label: 'H — Ambiente e Higiene Ocupacional (AHO)' },
  { code: 'S', label: 'S — Seguridad Industrial (SIAHO/SIHO-A)' },
  { code: 'T', label: 'T — Telecomunicaciones' }
];

// ---------------------------------------------------------------------------
// TIPOS DE DOCUMENTO (K)
// ---------------------------------------------------------------------------
export const PDVSA_TIPOS_K = [
  { code: 'D', label: 'D — Documento (Memoria, Informe, Especificación, Requisición)' },
  { code: 'P', label: 'P — Plano (Diagrama, Layout, Isométrico, Detalle)' }
];

// ---------------------------------------------------------------------------
// ANEXO E Y F: CATÁLOGO POR PRODUCTO (LL)
// ---------------------------------------------------------------------------
export const PDVSA_PRODUCTOS_LL = [
  { code: '01', label: '01 — Memoria de Cálculo / DSD1 / APP / Estudio Caracterización' },
  { code: '02', label: '02 — Estimado Carga Alivio / DSD2 / Balance Masa & Energía / Diagrama Unifilar' },
  { code: '03', label: '03 — Descripción del Proceso / Lista Materiales / Isométrico / Ruta Cables' },
  { code: '04', label: '04 — Evaluación Hidráulica / Lista Equipos / Sección Transversal / P&ID' },
  { code: '05', label: '05 — Filosofía Operación / Lista Cables / Localización / Esquemático Control' },
  { code: '06', label: '06 — Hojas de Datos Proceso / Lista Líneas / Perfil Longitudinal / Descargas' },
  { code: '07', label: '07 — Requerimiento Catalizadores / Sistema Alivio / Puesta Tierra' },
  { code: '08', label: '08 — Hojas Datos Corrientes / Válvulas y Accesorios / Cortocircuito / Cartografía' },
  { code: '09', label: '09 — Balance Masa & Energía / Conexiones Existentes / Flujo Carga / Planta & Vistas' },
  { code: '10', label: '10 — Sumario Corrientes / Tratamiento Aguas / Arranque Motores / Subsidencia' },
  { code: '11', label: '11 — Esquemas Volumétricos / Dispersión & Radiación / Armónicos / Paneles Control' },
  { code: '12', label: '12 — Memoria Cálculo Tuberías / Drenajes Abiertos-Cerrados / P&ID / Puesta Tierra' },
  { code: '13', label: '13 — Diagrama Flujo Proceso (DFP) / Flexibilidad Tuberías / Diagrama Trifilar' },
  { code: '14', label: '14 — Lista Tie-Ins / Facilidades Recepción y Despacho / Alumbrado' },
  { code: '15', label: '15 — Paso Crítico Procura / Selección Revestimiento / Parada Emergencia (ESD)' },
  { code: '16', label: '16 — Requerimiento Almacenamiento / Especificaciones Materiales' },
  { code: '17', label: '17 — Lista Preliminar Líneas / Hojas Datos Equipos / Filosofía Protecciones' },
  { code: '18', label: '18 — Alcance Trabajos Mecánicos / Filosofía Operación Sistema Eléctrico' },
  { code: '19', label: '19 — Sistema Protección Contra Incendios / Arquitectura Sistema Control' },
  { code: '20', label: '20 — Requerimientos Servicios Industriales / Especificaciones Equipos' },
  { code: '21', label: '21 — Análisis Constructibilidad / Hojas Datos Materiales' },
  { code: '22', label: '22 — Alcance Trabajos Civiles y Eléctricos' },
  { code: '23', label: '23 — Principios Operación, Mantenimiento y Confiabilidad' },
  { code: '24', label: '24 — Grado Definición Proyecto (PRDI)' },
  { code: '25', label: '25 — Lista General de Materiales y Suministros' },
  // Acrónimos directos de 3 letras reusables en visualización corta:
  { code: 'MEM', label: 'MEM — Memoria de Cálculo' },
  { code: 'ESP', label: 'ESP — Especificación Técnica' },
  { code: 'ISO', label: 'ISO — Plano Isométrico' },
  { code: 'DET', label: 'DET — Detalles Constructivos' },
  { code: 'PLA', label: 'PLA — Plano General / Layout' },
  { code: 'INF', label: 'INF — Informe Técnico / Evaluación' },
  { code: 'CRN', label: 'CRN — Cronograma de Ejecución' },
  { code: 'PTD', label: 'PTD — Procedimiento de Trabajo Seguro' }
];

// ---------------------------------------------------------------------------
// FORMATTERS & PARSERS (PIC-01-03-05 SECTION 7.1)
// ---------------------------------------------------------------------------

/**
 * Genera el Código Oficial Estándar Norma PDVSA PIC-01-03-05 Sec 7.1.1
 * Estructura: AABBCCDDEE-FFGHI-JKLLMMM-REV#
 * Ejemplo: A1A0012601-CW0D3-MD01001-REV0
 */
export function formatPDVSACodeStandard(params: PDVSACodeStandardParams): string {
  const AA = (params.filialAA || 'A1').padStart(2, '0').substring(0, 2);
  const BB = (params.aceBB || 'A0').padStart(2, '0').substring(0, 2);
  const CC = (params.areaGeograficaCC || '01').padStart(2, '0').substring(0, 2);
  const DD = (params.anioDD || '26').padStart(2, '0').substring(0, 2);
  const EE = (params.consecutivoEE || '01').padStart(2, '0').substring(0, 2);

  const grupo1 = `${AA}${BB}${CC}${DD}${EE}`;

  const FF = (params.instalacionFF || 'CW').padStart(2, '0').substring(0, 2);
  const G = String(params.subproyectoG ?? 0).substring(0, 1);
  const H = (params.faseH || 'D').substring(0, 1);
  const I = (params.actividadI || '3').substring(0, 1);

  const grupo2 = `${FF}${G}${H}${I}`;

  const J = (params.disciplinaJ || 'M').substring(0, 1);
  const K = (params.tipoDocK || 'D').substring(0, 1);
  const LL = (params.productoLL || '01').padStart(2, '0').substring(0, 2);
  const MMM = String(params.correlativoMMM || 1).padStart(3, '0').substring(0, 3);

  const grupo3 = `${J}${K}${LL}${MMM}`;
  const rev = (params.revision || '0').toUpperCase();

  return `${grupo1}-${grupo2}-${grupo3}-REV${rev}`;
}

/**
 * Genera el Código Simplificado de Campo
 * Estructura: FILIAL-ACE-PROY-FASE_DISC-TIPO-CORRELATIVO-REV
 * Ejemplo: WGS-EP-JUS-DM-MEM-0001-REV0
 */
export function formatPDVSACodeShort(params: Partial<PDVSACodeStandardParams> & {
  filialShort?: string;
  aceShort?: string;
  proyShort?: string;
  tipoDocShort?: string;
}): string {
  const filial = params.filialShort || params.filialAA || 'WGS';
  const ace = params.aceShort || params.aceBB || 'EP';
  const proy = params.proyShort || params.areaGeograficaCC || 'JUS';
  const fase = params.faseH || 'D';
  const disc = params.disciplinaJ || 'M';
  const tipoDoc = params.tipoDocShort || params.productoLL || 'MEM';
  const corr = String(params.correlativoMMM || 1).padStart(4, '0');
  const rev = (params.revision || '0').toUpperCase();

  return `${filial}-${ace}-${proy}-${fase}${disc}-${tipoDoc}-${corr}-REV${rev}`;
}

/**
 * Analiza y decodifica un código PDVSA (Standard o Simplificado)
 */
export function parsePDVSACode(code: string): {
  isValid: boolean;
  type: 'standard_pic' | 'short_field' | 'unknown';
  grupo1?: { filial: string; ace: string; areaGeo: string; anio: string; consecutivo: string };
  grupo2?: { instalacion: string; subproyecto: string; fase: string; actividad: string };
  grupo3?: { disciplina: string; tipoDoc: string; producto: string; correlativo: string };
  revision?: string;
  details?: Record<string, string>;
} {
  const clean = code.trim().toUpperCase();

  // Pattern 1: Standard PIC-01-03-05 (10-5-7 chars) e.g. A1A0012601-CW0D3-MD01001-REV0
  const stdMatch = clean.match(/^([A-Z0-9]{10})-([A-Z0-9]{5})-([A-Z0-9]{7})(?:-REV([A-Z0-9]+))?$/);
  if (stdMatch) { // Standard code match
    const g1 = stdMatch[1];
    const g2 = stdMatch[2];
    const g3 = stdMatch[3];
    const rev = stdMatch[4] || '0';

    const filialCode = g1.substring(0, 2);
    const aceCode = g1.substring(2, 4);
    const areaGeoCode = g1.substring(4, 6);
    const anio = '20' + g1.substring(6, 8);
    const consecutivo = g1.substring(8, 10);

    const instalacionCode = g2.substring(0, 2);
    const subproy = g2.substring(2, 3);
    const faseCode = g2.substring(3, 4);
    const actividadCode = g2.substring(4, 5);

    const discCode = g3.substring(0, 1);
    const tipoDocCode = g3.substring(1, 2);
    const prodCode = g3.substring(2, 4);
    const corr = g3.substring(4, 7);

    const filialObj = PDVSA_FILIALES_C.find(f => f.code === filialCode);
    const aceObj = PDVSA_ACES_C.find(a => a.code === aceCode);
    const areaGeoObj = PDVSA_AREAS_GEOGRAFICAS_C.find(ag => ag.code === areaGeoCode);
    const instObj = PDVSA_INSTALACIONES_D.find(i => i.code === instalacionCode);
    const faseObj = PDVSA_FASES_H.find(f => f.code === faseCode);
    const actObj = PDVSA_ACTIVIDADES_I.find(a => a.code === actividadCode);
    const discObj = PDVSA_DISCIPLINAS_J.find(d => d.code === discCode);
    const tipoObj = PDVSA_TIPOS_K.find(t => t.code === tipoDocCode);

    return {
      isValid: true,
      type: 'standard_pic',
      grupo1: { filial: filialCode, ace: aceCode, areaGeo: areaGeoCode, anio, consecutivo },
      grupo2: { instalacion: instalacionCode, subproyecto: subproy, fase: faseCode, actividad: actividadCode },
      grupo3: { disciplina: discCode, tipoDoc: tipoDocCode, producto: prodCode, correlativo: corr },
      revision: rev,
      details: {
        'Filial / Negocio': filialObj ? filialObj.label : filialCode,
        'Área Corporativa (ACE)': aceObj ? aceObj.label : aceCode,
        'Área Geográfica': areaGeoObj ? areaGeoObj.label : areaGeoCode,
        'Año / Consecutivo': `${anio} / #${consecutivo}`,
        'Instalación (Anexo D)': instObj ? instObj.label : instalacionCode,
        'Fase (FEL)': faseObj ? faseObj.label : faseCode,
        'Clasificación Actividad': actObj ? actObj.label : actividadCode,
        'Disciplina Técnica': discObj ? discObj.label : discCode,
        'Tipo Documento': tipoObj ? tipoObj.label : tipoDocCode,
        'Producto (Anexo E/F)': prodCode,
        'Correlativo': corr,
        'Revisión': `REV ${rev}`
      }
    };
  }

  // Pattern 2: Short Field Format e.g. WGS-EP-JUS-DM-MEM-0001-REV0
  const parts = clean.split('-');
  if (parts.length >= 5) {
    const filial = parts[0];
    const negocio = parts[1];
    const proyecto = parts[2];
    const faseDisc = parts[3];
    const fase = faseDisc.charAt(0);
    const disc = faseDisc.charAt(1) || 'G';
    const tipoDoc = parts[4];
    const corr = parts[5] || '0001';
    const rev = parts[6] ? parts[6].replace('REV', '') : '0';

    const faseObj = PDVSA_FASES_H.find(f => f.code === fase);
    const discObj = PDVSA_DISCIPLINAS_J.find(d => d.code === disc);

    return {
      isValid: true,
      type: 'short_field',
      grupo1: { filial, ace: negocio, areaGeo: proyecto, anio: 'N/A', consecutivo: '01' },
      grupo2: { instalacion: 'CW', subproyecto: '0', fase, actividad: '3' },
      grupo3: { disciplina: disc, tipoDoc: 'D', producto: tipoDoc, correlativo: corr },
      revision: rev,
      details: {
        'Filial / Contratista': filial,
        'Negocio / ACE': negocio,
        'Proyecto / Campo': proyecto,
        'Fase de Proyecto': faseObj ? faseObj.label : fase,
        'Disciplina': discObj ? discObj.label : disc,
        'Tipo Documento': tipoDoc,
        'Correlativo': corr,
        'Revisión': `REV ${rev}`
      }
    };
  }

  return { isValid: false, type: 'unknown' };
}
