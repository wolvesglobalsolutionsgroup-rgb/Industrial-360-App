import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export async function seedDemoData(force = false): Promise<{ success: boolean; message: string }> {
  try {
    // Check if projects already exist unless forced
    if (!force) {
      const snap = await getDocs(collection(db, 'projects'));
      if (!snap.empty) {
        return { success: true, message: 'La base de datos ya contiene proyectos registrados.' };
      }
    }

    // 1. Projects
    const projects = [
      {
        id: 'PROJ-001',
        name: 'IPC Reemplazo Oleoducto 16" Jusepín - San Mateo',
        description: 'Reemplazo de 12.5 km de tubería API 5L Gr. X52 Sch 40, incluyendo cruces especiales, válvulas de seccionamiento y pruebas hidrostáticas a 1480 PSI.',
        budget: 1450000,
        advancePercent: 48,
        startDate: '2026-01-15',
        status: 'en_campo',
        ownerId: 'demo_admin',
        orgId: 'default_org',
        createdAt: new Date().toISOString()
      },
      {
        id: 'PROJ-002',
        name: 'Mantenimiento Mayor Tren K-101 Planta Compresora San Joaquín',
        description: 'Overhaul completo de turbocompresor K-101, sustitución de cabezales de succión, cambio de válvulas de recirculación e inspección NDT 100% de soldaduras.',
        budget: 820000,
        advancePercent: 22,
        startDate: '2026-03-01',
        status: 'en_campo',
        ownerId: 'demo_admin',
        orgId: 'default_org',
        createdAt: new Date().toISOString()
      },
      {
        id: 'PROJ-003',
        name: 'Adecuación Estación de Flujo Bare-1 Faja Petrolífera del Orinoco',
        description: 'Sustitución de colectores de producción de crudo pesado, instalación de separadores multifásicos y sistema automatizado F&G.',
        budget: 2100000,
        advancePercent: 85,
        startDate: '2025-09-10',
        status: 'en_campo',
        ownerId: 'demo_admin',
        orgId: 'default_org',
        createdAt: new Date().toISOString()
      }
    ];

    for (const p of projects) {
      await setDoc(doc(db, 'projects', p.id), p, { merge: true });
    }

    // 2. Tasks / WBS
    const tasks = [
      {
        id: 'TASK-001',
        projectId: 'PROJ-001',
        wbsCode: 'WBS-1.1',
        title: 'Movilización de Equipos y Preparación de Terreno (Frente Jusepín)',
        description: 'Acondicionamiento de patio de acopio, movilización de grúas, plantas de soldar y equipos pesados.',
        specialty: 'Civil',
        unit: '%',
        plannedQuantity: 100,
        executedQuantity: 100,
        unitCost: 45000,
        status: 'terminada',
        priority: 'medium',
        crewName: 'Cuadrilla Movilización',
        frontName: 'Frente Jusepín',
        ptwRequired: false,
        startDate: '2026-01-15',
        dueDate: '2026-01-25',
        subtasks: [
          { id: 'st-1', text: 'Permisología ambiental aprobada', completed: true },
          { id: 'st-2', text: 'Inspección de equipos pesados', completed: true }
        ]
      },
      {
        id: 'TASK-002',
        projectId: 'PROJ-001',
        wbsCode: 'WBS-1.2',
        title: 'Tendido y Cimentación de Zanja Tubería API 5L 16"',
        description: 'Excavación de zanja 1.50m de profundidad, conformado de cama de arena y alineación de tubos.',
        specialty: 'Civil',
        unit: 'm',
        plannedQuantity: 12500,
        executedQuantity: 7200,
        unitCost: 42,
        status: 'en_campo',
        priority: 'high',
        crewName: 'Cuadrilla Movimiento de Tierra',
        frontName: 'Frente San Mateo',
        ptwRequired: true,
        startDate: '2026-01-26',
        dueDate: '2026-03-30',
        subtasks: [
          { id: 'st-3', text: 'Cama de arena tramo 0-5km', completed: true },
          { id: 'st-4', text: 'Zanjado tramo 5-10km', completed: false }
        ]
      },
      {
        id: 'TASK-003',
        projectId: 'PROJ-001',
        wbsCode: 'WBS-1.3',
        title: 'Soldadura Proceso SMAW/GMAW Juntas de Campo (ASME B31.4)',
        description: 'Ejecución de soldadura de pase de raíz, relleno y presentación en tubería API 5L X52.',
        specialty: 'Mecánica',
        unit: 'junta',
        plannedQuantity: 480,
        executedQuantity: 210,
        unitCost: 380,
        status: 'en_campo',
        priority: 'urgent',
        crewName: 'Cuadrilla Soldadura Alfa',
        frontName: 'Frente Canal de Riego',
        ptwRequired: true,
        startDate: '2026-02-01',
        dueDate: '2026-04-15',
        subtasks: [
          { id: 'st-5', text: 'Prueba de homologación de soldadores CIV', completed: true }
        ]
      },
      {
        id: 'TASK-004',
        projectId: 'PROJ-001',
        wbsCode: 'WBS-1.4',
        title: 'Ensayos No Destructivos NDT (UT/Gammagrafía) al 100%',
        description: 'Evaluación radiográfica y ultrasonido industrial según norma API 1104 / ASME B31.4.',
        specialty: 'QA/QC',
        unit: 'inspección',
        plannedQuantity: 480,
        executedQuantity: 205,
        unitCost: 110,
        status: 'en_campo',
        priority: 'high',
        crewName: 'Inspectores NDT Level II',
        frontName: 'Frente Canal de Riego',
        ptwRequired: true,
        startDate: '2026-02-05',
        dueDate: '2026-04-20'
      },
      {
        id: 'TASK-005',
        projectId: 'PROJ-001',
        wbsCode: 'WBS-1.5',
        title: 'Aplicación de Revestimiento Mantas Canusa y Protección Catódica',
        description: 'Chorreado de arena SSPC-SP10 y colocación de termocontraíbles anticorrosivos.',
        specialty: 'Mecánica',
        unit: 'junta',
        plannedQuantity: 480,
        executedQuantity: 180,
        unitCost: 140,
        status: 'planificada',
        priority: 'medium',
        crewName: 'Cuadrilla Revestimiento',
        frontName: 'Frente San Mateo',
        ptwRequired: false,
        startDate: '2026-03-01',
        dueDate: '2026-05-01'
      },
      {
        id: 'TASK-006',
        projectId: 'PROJ-002',
        wbsCode: 'WBS-2.1',
        title: 'Aislamiento, Parada y Despresurización Tren K-101',
        description: 'Bloqueo e etiquetado LOTO de líneas de gas de proceso de 24". Purga con Nitrógeno seco.',
        specialty: 'SIHO-A',
        unit: 'global',
        plannedQuantity: 1,
        executedQuantity: 1,
        unitCost: 35000,
        status: 'terminada',
        priority: 'urgent',
        crewName: 'Seguridad e Inspección',
        frontName: 'Planta San Joaquín',
        ptwRequired: true,
        startDate: '2026-03-01',
        dueDate: '2026-03-03'
      },
      {
        id: 'TASK-007',
        projectId: 'PROJ-002',
        wbsCode: 'WBS-2.2',
        title: 'Desmontaje y Revisión Interna Válvulas de Control 12" ANSI 600',
        description: 'Mantenimiento de actuadores neumáticos y reemplazo de empaquetaduras Teflon/Graphite.',
        specialty: 'Instrumentación',
        unit: 'valvula',
        plannedQuantity: 8,
        executedQuantity: 2,
        unitCost: 4500,
        status: 'en_campo',
        priority: 'high',
        crewName: 'Especialistas Instrumentación',
        frontName: 'Patio K-101',
        ptwRequired: true,
        startDate: '2026-03-04',
        dueDate: '2026-03-20'
      },
      {
        id: 'TASK-008',
        projectId: 'PROJ-002',
        wbsCode: 'WBS-2.3',
        title: 'Purga de Cabezales y Suministro de N2 Seco',
        description: 'Suministro de cisterna de Nitrógeno para barrido de gas amargo.',
        specialty: 'Mecánica',
        unit: 'evento',
        plannedQuantity: 1,
        executedQuantity: 0,
        unitCost: 12000,
        status: 'bloqueada',
        priority: 'urgent',
        crewName: 'Cuadrilla Mecánica',
        frontName: 'Patio K-101',
        restrictionNotes: 'Retraso en transporte de cisterna N2 por transportista externo. Pendiente aprobación ETT.'
      }
    ];

    for (const t of tasks) {
      await setDoc(doc(db, 'tasks', t.id), t, { merge: true });
    }

    // 3. Welds (Juntas NDT)
    const welds = [
      {
        id: 'W-001',
        projectId: 'PROJ-001',
        jointNumber: 'J-001',
        lineCode: '16"-OL-JUS-01',
        welderId: 'CIV-1845236',
        welderName: 'José R. Colmenares',
        diameter: 16,
        schedule: 'Sch 40',
        process: 'SMAW/GMAW',
        ndtStatus: 'APROBADO',
        ndtType: 'Gammagrafía (RT)',
        reportNumber: 'REP-NDT-2026-012',
        inspectedDate: '2026-02-10'
      },
      {
        id: 'W-002',
        projectId: 'PROJ-001',
        jointNumber: 'J-002',
        lineCode: '16"-OL-JUS-01',
        welderId: 'CIV-1845236',
        welderName: 'José R. Colmenares',
        diameter: 16,
        schedule: 'Sch 40',
        process: 'SMAW/GMAW',
        ndtStatus: 'APROBADO',
        ndtType: 'Gammagrafía (RT)',
        reportNumber: 'REP-NDT-2026-012',
        inspectedDate: '2026-02-10'
      },
      {
        id: 'W-003',
        projectId: 'PROJ-001',
        jointNumber: 'J-003',
        lineCode: '16"-OL-JUS-01',
        welderId: 'CIV-2011498',
        welderName: 'Carlos M. Salazar',
        diameter: 16,
        schedule: 'Sch 40',
        process: 'SMAW/GMAW',
        ndtStatus: 'RECHAZADO',
        defectType: 'Falta de penetración en raíz (API 1104 Sec. 9)',
        reportNumber: 'REP-NDT-2026-015',
        inspectedDate: '2026-02-12'
      }
    ];

    for (const w of welds) {
      await setDoc(doc(db, 'welds', w.id), w, { merge: true });
    }

    // 4. PTWs (Permisos de Trabajo Seguro)
    const ptws = [
      {
        id: 'PTW-101',
        projectId: 'PROJ-001',
        ptwNumber: 'PTW-2026-089',
        type: 'Trabajo en Caliente / Soldadura',
        location: 'Frente Canal de Riego Km 4+200',
        status: 'ACTIVO',
        applicant: 'Ing. Manuel Rivas',
        gasTestResult: '0.0% LEL, 20.9% O2, 0 PPM H2S',
        issueDate: '2026-07-26',
        expiryDate: '2026-07-26'
      },
      {
        id: 'PTW-102',
        projectId: 'PROJ-002',
        ptwNumber: 'PTW-2026-090',
        type: 'Izamiento de Carga Crítica',
        location: 'Patio K-101 San Joaquín',
        status: 'ACTIVO',
        applicant: 'Miguel Pérez',
        gasTestResult: 'N/A',
        issueDate: '2026-07-26',
        expiryDate: '2026-07-26'
      }
    ];

    for (const ptw of ptws) {
      await setDoc(doc(db, 'ptws', ptw.id), ptw, { merge: true });
    }

    // 5. Valuations
    const valuations = [
      {
        id: 'VAL-001',
        projectId: 'PROJ-001',
        valNumber: 'VAL-001',
        period: 'Quincena 1 - Enero 2026',
        amount: 185000,
        certifiedAmount: 185000,
        status: 'COBRADA',
        date: '2026-01-31'
      },
      {
        id: 'VAL-002',
        projectId: 'PROJ-001',
        valNumber: 'VAL-002',
        period: 'Quincena 2 - Enero 2026',
        amount: 210000,
        certifiedAmount: 205000,
        status: 'CERTIFICADA',
        date: '2026-02-15'
      },
      {
        id: 'VAL-003',
        projectId: 'PROJ-001',
        valNumber: 'VAL-003',
        period: 'Quincena 1 - Febrero 2026',
        amount: 195000,
        certifiedAmount: 0,
        status: 'EN_REVISION',
        date: '2026-02-28'
      }
    ];

    for (const v of valuations) {
      await setDoc(doc(db, 'valuations', v.id), v, { merge: true });
    }

    return {
      success: true,
      message: 'Base de datos demo poblada con éxito (3 Proyectos, Partidas WBS, Juntas NDT, Permisos PTW y Valuaciones).'
    };
  } catch (error: any) {
    console.error('Error seeding demo data:', error);
    return { success: false, message: `Error al sembrar datos: ${error?.message || error}` };
  }
}
