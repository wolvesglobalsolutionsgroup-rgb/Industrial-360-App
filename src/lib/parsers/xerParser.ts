export interface ParsedXerTask {
  code: string;
  name: string;
  unit: string;
  plannedQuantity: number;
  executedQuantity: number;
  unitCost: number;
  startDate: string;
  endDate: string;
  status: string;
}

export function parseXerFile(fileContent: string): ParsedXerTask[] {
  const lines = fileContent.split(/\r?\n/);
  const tasks: ParsedXerTask[] = [];

  let currentTable = '';
  let taskFields: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split('\t');
    const rowType = parts[0];

    if (rowType === '%T') {
      currentTable = parts[1] || '';
      taskFields = [];
    } else if (rowType === '%F') {
      if (currentTable === 'TASK') {
        taskFields = parts.slice(1);
      }
    } else if (rowType === '%R') {
      if (currentTable === 'TASK' && taskFields.length > 0) {
        const values = parts.slice(1);
        const taskObj: Record<string, string> = {};
        taskFields.forEach((field, index) => {
          taskObj[field] = values[index] || '';
        });

        const code = taskObj['task_code'] || `P6-${tasks.length + 1}`;
        const name = taskObj['task_name'] || 'Actividad P6';
        const physComplete = parseFloat(taskObj['phys_complete_pct'] || '0') || 0;
        const targetDrtn = parseFloat(taskObj['target_drtn_hr_cnt'] || '80') || 80;
        
        let startDate = taskObj['target_start_date'] || taskObj['early_start_date'] || new Date().toISOString().split('T')[0];
        let endDate = taskObj['target_end_date'] || taskObj['early_end_date'] || new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0];

        // Format dates if they contain timestamp
        if (startDate.includes(' ')) startDate = startDate.split(' ')[0];
        if (endDate.includes(' ')) endDate = endDate.split(' ')[0];

        const plannedQuantity = targetDrtn > 0 ? targetDrtn : 100;
        const executedQuantity = Math.round((plannedQuantity * (physComplete / 100)) * 100) / 100;

        tasks.push({
          code,
          name,
          unit: 'hrs',
          plannedQuantity,
          executedQuantity,
          unitCost: 120, // valor estándar de costo/hora de ingeniería/equipo
          startDate,
          endDate,
          status: physComplete >= 100 ? 'Completado' : (physComplete > 0 ? 'En Progreso' : 'Pendiente')
        });
      }
    }
  }

  return tasks;
}
