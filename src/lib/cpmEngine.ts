/**
 * Industrial Control 360 - CPM (Critical Path Method) & EVM (Earned Value Management) Engine
 * Conforme a PMI PMBOK, AACE International 29R-03 (Forensic Schedule Analysis) y PDVSA PIP-03-01-02
 */

export interface ScheduleTask {
  id: string;
  wbsCode: string;
  wbsName: string;
  code: string;
  name: string;
  durationDays: number;
  predecessorIds: string[];
  percentComplete: number; // 0 to 100
  plannedCostUsd: number; // BAC for this task
  actualCostUsd: number; // AC for this task
  startDate?: string; // YYYY-MM-DD
  finishDate?: string;
}

export interface CpmCalculatedTask extends ScheduleTask {
  earlyStart: number; // ES (days from start)
  earlyFinish: number; // EF = ES + duration
  lateStart: number; // LS
  lateFinish: number; // LF = LS + duration
  totalFloat: number; // TF = LS - ES
  freeFloat: number; // FF
  isCritical: boolean; // TF <= 0

  calcEarlyStart: string;
  calcEarlyFinish: string;
  calcLateStart: string;
  calcLateFinish: string;

  // EVM
  bac: number; // Budget at Completion
  pv: number; // Planned Value
  ev: number; // Earned Value = BAC * % complete
  ac: number; // Actual Cost
  cv: number; // Cost Variance = EV - AC
  sv: number; // Schedule Variance = EV - PV
  cpi: number; // CPI = EV / AC
  spi: number; // SPI = EV / PV
  eac: number; // Estimate at Completion
}

export interface EvmProjectSummary {
  totalBac: number;
  totalPv: number;
  totalEv: number;
  totalAc: number;
  cv: number;
  sv: number;
  cpi: number;
  spi: number;
  eac: number;
  etc: number;
  vac: number;
  criticalTasksCount: number;
  totalTasksCount: number;
  projectStartDate: string;
  projectFinishDate: string;
  projectDurationDays: number;
  overallPercentComplete: number;
}

function parseDateStr(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(dateStr: string, days: number): string {
  const dt = parseDateStr(dateStr);
  dt.setDate(dt.getDate() + days);
  return formatDateStr(dt);
}

/**
 * Calculates Forward Pass, Backward Pass, Total Float, Free Float, Critical Path (CPM) and EVM Metrics
 */
export function calculateCpmAndEvm(
  tasks: ScheduleTask[],
  projectStartDateStr: string = '2026-08-01'
): { calculatedTasks: CpmCalculatedTask[]; summary: EvmProjectSummary } {
  if (!tasks || tasks.length === 0) {
    return {
      calculatedTasks: [],
      summary: {
        totalBac: 0,
        totalPv: 0,
        totalEv: 0,
        totalAc: 0,
        cv: 0,
        sv: 0,
        cpi: 1,
        spi: 1,
        eac: 0,
        etc: 0,
        vac: 0,
        criticalTasksCount: 0,
        totalTasksCount: 0,
        projectStartDate: projectStartDateStr,
        projectFinishDate: projectStartDateStr,
        projectDurationDays: 0,
        overallPercentComplete: 0
      }
    };
  }

  // Map task ID to internal object
  const taskMap = new Map<string, {
    task: ScheduleTask;
    es: number;
    ef: number;
    ls: number;
    lf: number;
    successors: string[];
  }>();

  tasks.forEach(t => {
    taskMap.set(t.id, {
      task: t,
      es: 0,
      ef: 0,
      ls: Infinity,
      lf: Infinity,
      successors: []
    });
  });

  // Build successors map
  tasks.forEach(t => {
    t.predecessorIds.forEach(predId => {
      const predObj = taskMap.get(predId);
      if (predObj) {
        predObj.successors.push(t.id);
      }
    });
  });

  // --- FORWARD PASS (Early Start & Early Finish) ---
  let changed = true;
  let iterations = 0;
  const maxIterations = tasks.length * 5;

  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;

    tasks.forEach(t => {
      const obj = taskMap.get(t.id)!;
      let maxPredEf = 0;

      t.predecessorIds.forEach(predId => {
        const predObj = taskMap.get(predId);
        if (predObj && predObj.ef > maxPredEf) {
          maxPredEf = predObj.ef;
        }
      });

      const newEs = maxPredEf;
      const newEf = newEs + Math.max(1, t.durationDays);

      if (newEs !== obj.es || newEf !== obj.ef) {
        obj.es = newEs;
        obj.ef = newEf;
        changed = true;
      }
    });
  }

  // Calculate total project duration
  let projectDuration = 0;
  taskMap.forEach(obj => {
    if (obj.ef > projectDuration) {
      projectDuration = obj.ef;
    }
  });

  // --- BACKWARD PASS (Late Start & Late Finish) ---
  // Initialize LF for end tasks (tasks with no successors) to projectDuration
  taskMap.forEach(obj => {
    if (obj.successors.length === 0) {
      obj.lf = projectDuration;
      obj.ls = obj.lf - Math.max(1, obj.task.durationDays);
    }
  });

  changed = true;
  iterations = 0;

  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;

    tasks.forEach(t => {
      const obj = taskMap.get(t.id)!;
      if (obj.successors.length > 0) {
        let minSuccLs = Infinity;

        obj.successors.forEach(succId => {
          const succObj = taskMap.get(succId);
          if (succObj && succObj.ls < minSuccLs) {
            minSuccLs = succObj.ls;
          }
        });

        if (minSuccLs !== Infinity) {
          const newLf = minSuccLs;
          const newLs = newLf - Math.max(1, t.durationDays);

          if (newLf !== obj.lf || newLs !== obj.ls) {
            obj.lf = newLf;
            obj.ls = newLs;
            changed = true;
          }
        }
      }
    });
  }

  // Calculate Float and EVM Metrics
  let totalBac = 0;
  let totalPv = 0;
  let totalEv = 0;
  let totalAc = 0;
  let criticalCount = 0;

  const calculatedTasks: CpmCalculatedTask[] = tasks.map(t => {
    const obj = taskMap.get(t.id)!;
    const totalFloat = Math.max(0, obj.ls - obj.es);

    let minSuccEs = projectDuration;
    if (obj.successors.length > 0) {
      minSuccEs = Math.min(...obj.successors.map(sId => taskMap.get(sId)?.es ?? projectDuration));
    }
    const freeFloat = Math.max(0, minSuccEs - obj.ef);

    const isCritical = totalFloat <= 0.001;
    if (isCritical) criticalCount++;

    const calcEarlyStart = addDays(projectStartDateStr, obj.es);
    const calcEarlyFinish = addDays(projectStartDateStr, obj.ef);
    const calcLateStart = addDays(projectStartDateStr, obj.ls);
    const calcLateFinish = addDays(projectStartDateStr, obj.lf);

    // EVM Calculations
    const bac = t.plannedCostUsd || 0;
    // Planned Value is estimated based on schedule elapsed time vs total task duration
    const progressFactor = t.percentComplete / 100;
    const pv = bac * Math.min(1, Math.max(progressFactor, (obj.es / (projectDuration || 1))));
    const ev = bac * progressFactor;
    const ac = t.actualCostUsd || (ev > 0 ? ev * 1.02 : 0);

    const cv = ev - ac;
    const sv = ev - pv;
    const cpi = ac > 0 ? ev / ac : 1.0;
    const spi = pv > 0 ? ev / pv : 1.0;
    const eac = cpi > 0 ? bac / cpi : bac;

    totalBac += bac;
    totalPv += pv;
    totalEv += ev;
    totalAc += ac;

    return {
      ...t,
      earlyStart: obj.es,
      earlyFinish: obj.ef,
      lateStart: obj.ls,
      lateFinish: obj.lf,
      totalFloat,
      freeFloat,
      isCritical,
      calcEarlyStart,
      calcEarlyFinish,
      calcLateStart,
      calcLateFinish,
      bac,
      pv,
      ev,
      ac,
      cv,
      sv,
      cpi,
      spi,
      eac
    };
  });

  const overallCv = totalEv - totalAc;
  const overallSv = totalEv - totalPv;
  const overallCpi = totalAc > 0 ? totalEv / totalAc : 1.0;
  const overallSpi = totalPv > 0 ? totalEv / totalPv : 1.0;
  const overallEac = overallCpi > 0 ? totalBac / overallCpi : totalBac;
  const overallEtc = overallEac - totalAc;
  const overallVac = totalBac - overallEac;
  const overallPct = totalBac > 0 ? Math.round((totalEv / totalBac) * 100) : 0;

  const projectFinishDate = addDays(projectStartDateStr, projectDuration);

  const summary: EvmProjectSummary = {
    totalBac,
    totalPv,
    totalEv,
    totalAc,
    cv: overallCv,
    sv: overallSv,
    cpi: Math.round(overallCpi * 1000) / 1000,
    spi: Math.round(overallSpi * 1000) / 1000,
    eac: overallEac,
    etc: overallEtc,
    vac: overallVac,
    criticalTasksCount: criticalCount,
    totalTasksCount: tasks.length,
    projectStartDate: projectStartDateStr,
    projectFinishDate,
    projectDurationDays: projectDuration,
    overallPercentComplete: overallPct
  };

  return { calculatedTasks, summary };
}

/**
 * Sample EPC Schedule Dataset for Oil & Gas Pipelines
 */
export const SAMPLE_SCHEDULE_TASKS: ScheduleTask[] = [
  {
    id: 'ACT-01',
    wbsCode: 'ING-01',
    wbsName: 'Ingeniería de Detalle',
    code: 'ING-CAD-001',
    name: 'Ingeniería de Detalle y Rutas de Alineación Isométricas',
    durationDays: 15,
    predecessorIds: [],
    percentComplete: 100,
    plannedCostUsd: 45000,
    actualCostUsd: 44200
  },
  {
    id: 'ACT-02',
    wbsCode: 'PRO-01',
    wbsName: 'Procuraduría de Materiales',
    code: 'PRO-TUB-001',
    name: 'Procura de Tubería 16" API 5L X65 PSL2 y Válvulas de Bola',
    durationDays: 30,
    predecessorIds: ['ACT-01'],
    percentComplete: 90,
    plannedCostUsd: 380000,
    actualCostUsd: 385000
  },
  {
    id: 'ACT-03',
    wbsCode: 'CIV-01',
    wbsName: 'Obras Civiles y Mov. Tierra',
    code: 'CIV-MOV-001',
    name: 'Deforestación, Desmonte y Apertura de Derecho de Vía (DDV)',
    durationDays: 20,
    predecessorIds: ['ACT-01'],
    percentComplete: 85,
    plannedCostUsd: 95000,
    actualCostUsd: 92000
  },
  {
    id: 'ACT-04',
    wbsCode: 'CIV-02',
    wbsName: 'Obras Civiles y Mov. Tierra',
    code: 'CIV-EXC-001',
    name: 'Excavación de Zanja para Tubería 16" (K0+000 a K12+500)',
    durationDays: 25,
    predecessorIds: ['ACT-03'],
    percentComplete: 60,
    plannedCostUsd: 140000,
    actualCostUsd: 148000
  },
  {
    id: 'ACT-05',
    wbsCode: 'MEC-01',
    wbsName: 'Construcción Mecánica',
    code: 'MEC-SOL-001',
    name: 'Tendido, Punteado y Soldadura de Juntas de Tubería 16"',
    durationDays: 35,
    predecessorIds: ['ACT-02', 'ACT-04'],
    percentComplete: 45,
    plannedCostUsd: 290000,
    actualCostUsd: 305000
  },
  {
    id: 'ACT-06',
    wbsCode: 'MEC-02',
    wbsName: 'Control de Calidad QA/QC',
    code: 'MEC-NDT-001',
    name: 'Inspección NDT 100% Gammagrafía (RT) y Ultrasonido (UT)',
    durationDays: 20,
    predecessorIds: ['ACT-05'],
    percentComplete: 40,
    plannedCostUsd: 65000,
    actualCostUsd: 62000
  },
  {
    id: 'ACT-07',
    wbsCode: 'MEC-03',
    wbsName: 'Protección Anticorrosiva',
    code: 'MEC-REV-001',
    name: 'Revestimiento Tricapa de Juntas de Campo (Mantas Termocontraíbles)',
    durationDays: 15,
    predecessorIds: ['ACT-06'],
    percentComplete: 25,
    plannedCostUsd: 52000,
    actualCostUsd: 50000
  },
  {
    id: 'ACT-08',
    wbsCode: 'CIV-03',
    wbsName: 'Relleno y Tapado',
    code: 'CIV-REL-001',
    name: 'Bajada de Tubería, Relleno Compactado y Reforestación',
    durationDays: 18,
    predecessorIds: ['ACT-07'],
    percentComplete: 10,
    plannedCostUsd: 78000,
    actualCostUsd: 75000
  },
  {
    id: 'ACT-09',
    wbsCode: 'PRE-01',
    wbsName: 'Pruebas Hidrostáticas',
    code: 'PRE-HID-001',
    name: 'Prueba de Presión Hidrostática a 1.25 DP (ASME B31.4)',
    durationDays: 12,
    predecessorIds: ['ACT-08'],
    percentComplete: 0,
    plannedCostUsd: 88000,
    actualCostUsd: 0
  },
  {
    id: 'ACT-10',
    wbsCode: 'PRE-02',
    wbsName: 'Puesta en Servicio',
    code: 'PRE-COM-001',
    name: 'Secado con Aire Deshidratado, Calibración con Marrano e Inercia',
    durationDays: 10,
    predecessorIds: ['ACT-09'],
    percentComplete: 0,
    plannedCostUsd: 42000,
    actualCostUsd: 0
  }
];
