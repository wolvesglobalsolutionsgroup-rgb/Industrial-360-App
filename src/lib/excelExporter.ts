import * as XLSX from 'xlsx';
import { TakeoffItem } from '../components/engineering/QuantityTakeoff';
import { ApuItem, calculateApuUnitCost } from '../pages/ApuEstimation';

/**
 * Utility to export Quantity Takeoffs (Cómputos Métricos) to native .xlsx Excel with corporate formatting
 */
export function exportQuantityTakeoffsToXlsx(
  takeoffs: TakeoffItem[],
  projectName: string = 'Proyecto Industrial PDVSA',
  orgName: string = 'PROINTECA C.A. / PDVSA'
) {
  const wb = XLSX.utils.book_new();

  // Create Header Membrete rows
  const aoaData: any[][] = [
    [orgName, '', '', '', '', '', '', '', '', '', ''],
    ['LIBRO OFICIAL DE CÓMPUTOS MÉTRICOS Y METRADOS (SIDCON)', '', '', '', '', '', '', '', '', '', ''],
    [`Proyecto: ${projectName}`, '', '', '', `Fecha de Emisión: ${new Date().toLocaleDateString()}`, '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', ''], // blank row
    [
      'Partida WBS',
      'Descripción del Ítem',
      'Ubicación / Tramo',
      'Unidad',
      'N° Piezas',
      'Largo (m)',
      'Ancho (m)',
      'Alto / Esp. (m)',
      'Cantidad Total',
      'Notas de Campo',
      'Estado SIDCON'
    ]
  ];

  // Add Data Rows starting at row index 6 (1-based row index in Excel: 6)
  takeoffs.forEach((t, index) => {
    aoaData.push([
      t.wbsCode,
      t.description,
      t.location,
      t.unit,
      t.count,
      t.lengthM,
      t.widthM,
      t.heightOrThicknessM,
      t.totalQuantity,
      t.notes || '',
      t.status
    ]);
  });

  // Add Total Row
  const lastDataRowIndex = 5 + takeoffs.length;

  aoaData.push([
    'TOTAL GENERAL',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    { f: `SUM(I6:I${lastDataRowIndex})` },
    '',
    ''
  ]);

  const ws = XLSX.utils.aoa_to_sheet(aoaData);

  // Auto-adjust Column Widths
  ws['!cols'] = [
    { wch: 16 }, // WBS
    { wch: 42 }, // Desc
    { wch: 22 }, // Ubicacion
    { wch: 10 }, // Unidad
    { wch: 12 }, // Piezas
    { wch: 12 }, // Largo
    { wch: 12 }, // Ancho
    { wch: 14 }, // Alto
    { wch: 18 }, // Total
    { wch: 28 }, // Notas
    { wch: 18 }  // Status
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Cómputos Métricos');

  // Export File
  const cleanProjName = projectName.replace(/[^a-zA-Z0-9_-]/g, '_');
  XLSX.writeFile(wb, `Libro_Computos_Metricos_${cleanProjName}.xlsx`);
}

/**
 * Utility to export APUs (Análisis de Precios Unitarios) to native .xlsx Excel with corporate formatting
 */
export function exportApuPresupuestoToXlsx(
  apus: ApuItem[],
  projectName: string = 'Proyecto Industrial PDVSA',
  orgName: string = 'PROINTECA C.A. / PDVSA'
) {
  const wb = XLSX.utils.book_new();

  // --- SHEET 1: RESUMEN DE PRESUPUESTO APU ---
  const resumenRows: any[][] = [
    [orgName, '', '', '', '', '', '', '', ''],
    ['PRESUPUESTO OFICIAL DE ANÁLISIS DE PRECIOS UNITARIOS (APU & BC3)', '', '', '', '', '', '', '', ''],
    [`Proyecto: ${projectName}`, '', '', '', `Fecha: ${new Date().toLocaleDateString()}`, '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''], // Blank
    [
      'Código APU',
      'Título de la Partida',
      'Unidad',
      'Mano de Obra ($)',
      'Equipos ($)',
      'Materiales ($)',
      'Subtotal Directo ($)',
      'Indirectos & Ganancia ($)',
      'Precio Unitario ($)'
    ]
  ];

  apus.forEach((apu, index) => {
    const calc = calculateApuUnitCost(apu);
    const excelRow = 6 + index;

    resumenRows.push([
      apu.code,
      apu.title,
      apu.unit,
      calc.laborTotal,
      calc.equipTotal,
      calc.matTotal,
      { f: `SUM(D${excelRow}:F${excelRow})` },
      calc.indirectTotal,
      { f: `G${excelRow}+H${excelRow}` }
    ]);
  });

  const lastDataRow = 5 + apus.length;

  resumenRows.push([
    'TOTAL PRESUPUESTO UNITARIO',
    '',
    '',
    { f: `SUM(D6:D${lastDataRow})` },
    { f: `SUM(E6:E${lastDataRow})` },
    { f: `SUM(F6:F${lastDataRow})` },
    { f: `SUM(G6:G${lastDataRow})` },
    { f: `SUM(H6:H${lastDataRow})` },
    { f: `SUM(I6:I${lastDataRow})` }
  ]);

  const wsResumen = XLSX.utils.aoa_to_sheet(resumenRows);

  wsResumen['!cols'] = [
    { wch: 16 }, // Codigo
    { wch: 45 }, // Titulo
    { wch: 10 }, // Unidad
    { wch: 20 }, // Labor
    { wch: 20 }, // Equip
    { wch: 20 }, // Mat
    { wch: 22 }, // Subtotal
    { wch: 24 }, // Indirectos
    { wch: 24 }  // Total
  ];

  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen APU');

  // --- SHEET 2: DESGLOSE DETALLADO DE INSUMOS ---
  const desgloseRows: any[][] = [
    [orgName, '', '', '', '', '', ''],
    ['MATRIZ DETALLADA DE DESGLOSE DE INSUMOS (MANO DE OBRA, EQUIPOS, MATERIALES)', '', '', '', '', '', ''],
    ['', '', '', '', '', '', ''],
    ['Partida APU', 'Rubro / Tipo', 'Descripción del Insumo', 'Cantidad / Cant. Per Unit', 'Unidad', 'Tarifa Unit. ($)', 'Costo Parcial ($)']
  ];

  apus.forEach(apu => {
    // Labor
    apu.labor.forEach(l => {
      desgloseRows.push([
        `${apu.code} - ${apu.title}`,
        'Mano de Obra',
        l.category,
        l.count,
        'pers',
        l.baseSalaryDailyUsd,
        l.count * l.baseSalaryDailyUsd
      ]);
    });
    // Equipment
    apu.equipment.forEach(e => {
      desgloseRows.push([
        `${apu.code} - ${apu.title}`,
        'Equipos y Maquinaria',
        e.name,
        e.hoursActive,
        'hrs',
        e.hourlyRateActiveUsd,
        e.hoursActive * e.hourlyRateActiveUsd
      ]);
    });
    // Materials
    apu.materials.forEach(m => {
      desgloseRows.push([
        `${apu.code} - ${apu.title}`,
        'Materiales e Insumos',
        m.description,
        m.quantityPerUnit,
        m.unit,
        m.unitPriceUsd,
        m.quantityPerUnit * m.unitPriceUsd
      ]);
    });
  });

  const wsDesglose = XLSX.utils.aoa_to_sheet(desgloseRows);
  wsDesglose['!cols'] = [
    { wch: 30 },
    { wch: 20 },
    { wch: 35 },
    { wch: 16 },
    { wch: 10 },
    { wch: 18 },
    { wch: 18 }
  ];

  XLSX.utils.book_append_sheet(wb, wsDesglose, 'Desglose Insumos');

  const cleanProjName = projectName.replace(/[^a-zA-Z0-9_-]/g, '_');
  XLSX.writeFile(wb, `Presupuesto_APU_PROINTECA_${cleanProjName}.xlsx`);
}
