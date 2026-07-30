import React, { useState, useRef, useEffect, useMemo } from 'react';
import DOMPurify from 'dompurify';
import { 
  ZoomIn, ZoomOut, RotateCcw, Maximize2, Minimize2, Layers, ShieldCheck, 
  CheckCircle2, XCircle, AlertTriangle, Download, Upload, Info, X, 
  FileText, Check, Grid, Eye, HardHat, FileCheck, Sparkles, Award, RefreshCw, FileCode2,
  MousePointer, Plus, Pencil, Trash2, Move, Undo2, Disc, Spline, Wrench
} from 'lucide-react';
import { collection, addDoc, updateDoc, doc, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { useProject } from '../../ProjectContext';
import { IsometricDrawing, IsometricJointNode, JointNdtStatus } from '../../lib/isometric/isometricTypes';
import { SAMPLE_ISOMETRICS } from '../../lib/isometric/sampleIsometrics';
import { generateAsBuiltPdf } from '../../lib/isometric/asBuiltPdfGenerator';

interface IsometricViewerProps {
  onJointSelect?: (joint: IsometricJointNode) => void;
  selectedJointId?: string | null;
  className?: string;
}

export default function IsometricViewer({ onJointSelect, selectedJointId, className = '' }: IsometricViewerProps) {
  const { currentProject, currentOrganization } = useProject();
  const orgId = currentOrganization?.id || 'semax_pino';
  const projId = currentProject?.id || 'all';

  // State
  const [selectedIsoIndex, setSelectedIsoIndex] = useState<number>(0);
  const [drawing, setDrawing] = useState<IsometricDrawing>(SAMPLE_ISOMETRICS[0]);
  
  // Custom SVG uploaded
  const [customSvgContent, setCustomSvgContent] = useState<string | null>(null);

  // Viewport zoom and pan
  const [zoom, setZoom] = useState<number>(100); // %
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showGrid, setShowGrid] = useState<boolean>(true);

  // Layer Toggling
  const [showGeometry, setShowGeometry] = useState<boolean>(true);
  const [showDimensions, setShowDimensions] = useState<boolean>(true);
  const [showJointNodes, setShowJointNodes] = useState<boolean>(true);
  const [showSpoolsLegend, setShowSpoolsLegend] = useState<boolean>(true);

  // Drawer modal for selected joint
  const [activeJoint, setActiveJoint] = useState<IsometricJointNode | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // Edit Joint form inside drawer
  const [editStatus, setEditStatus] = useState<JointNdtStatus>('Aprobado');
  const [editWelderStamp, setEditWelderStamp] = useState<string>('W-402');
  const [editWelderName, setEditWelderName] = useState<string>('José Pérez');
  const [editHeatNumber, setEditHeatNumber] = useState<string>('MTR-API-99482-B');
  const [editNdtMethod, setEditNdtMethod] = useState<'RT' | 'UT/PAUT' | 'PT' | 'MT' | 'VT'>('RT');
  const [editNdtReportNo, setEditNdtReportNo] = useState<string>('REP-RT-2026-081');
  const [editInspectorName, setEditInspectorName] = useState<string>('Ing. Marcos Silva');
  const [isSavingJoint, setIsSavingJoint] = useState<boolean>(false);

  // As-Built Liberation Export State
  const [isLiberating, setIsLiberating] = useState<boolean>(false);
  const [liberationSuccess, setLiberationSuccess] = useState<boolean>(false);

  // Vector Canvas Drawing Tools State (Sprint 10: Smart Canvas Engine)
  const [activeTool, setActiveTool] = useState<'select' | 'pipe' | 'elbow' | 'flange' | 'valve' | 'joint'>('select');
  const [draggedNode, setDraggedNode] = useState<{ id: string; startMouseX: number; startMouseY: number; initX: number; initY: number } | null>(null);
  const [draggedDimIndex, setDraggedDimIndex] = useState<{ index: number; startMouseX: number; startMouseY: number; initOffsetX: number; initOffsetY: number } | null>(null);
  const [editingText, setEditingText] = useState<{ type: 'dim' | 'joint' | 'spool'; idOrIndex: string | number; text: string } | null>(null);
  const [history, setHistory] = useState<IsometricDrawing[]>([]);

  const pushHistory = () => {
    setHistory(prev => [...prev, JSON.parse(JSON.stringify(drawing))]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setDrawing(last);
    setHistory(prev => prev.slice(0, prev.length - 1));
  };

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync drawing when user picks a sample drawing
  useEffect(() => {
    if (SAMPLE_ISOMETRICS[selectedIsoIndex]) {
      setDrawing(SAMPLE_ISOMETRICS[selectedIsoIndex]);
      setCustomSvgContent(null);
      handleFitToScreen();
    }
  }, [selectedIsoIndex]);

  // Sync with Firestore weld_joints if available
  useEffect(() => {
    if (!currentProject || currentProject.id === 'all') return;

    const targetPath = `organizations/${orgId}/projects/${currentProject.id}/weld_joints`;
    const q = query(collection(db, targetPath), where('isometric', '==', drawing.number));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) return;
      const firestoreJoints = snapshot.docs.map(doc => doc.data());
      
      // Merge status with local drawing joints
      setDrawing(prev => ({
        ...prev,
        joints: prev.joints.map(j => {
          const match = firestoreJoints.find((fj: any) => fj.tag === j.tag);
          if (match) {
            return {
              ...j,
              ndtStatus: match.ndtStatus || j.ndtStatus,
              welderStamp: match.welderStamp || j.welderStamp,
              heatNumber: match.heatNumber || j.heatNumber,
              ndtReportNo: match.ndtReportNo || j.ndtReportNo,
              inspectorName: match.inspectorName || j.inspectorName
            };
          }
          return j;
        })
      }));
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'weld_joints');
    });

    return () => unsubscribe();
  }, [drawing.number, currentProject, orgId]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = drawing.joints.length;
    const approved = drawing.joints.filter(j => j.ndtStatus === 'Aprobado').length;
    const rejected = drawing.joints.filter(j => j.ndtStatus === 'Rechazado').length;
    const pending = drawing.joints.filter(j => j.ndtStatus === 'Pendiente').length;
    const unWelded = drawing.joints.filter(j => j.ndtStatus === 'SinSoldar').length;
    const percentApproved = total > 0 ? Math.round((approved / total) * 100) : 0;
    const isReadyForLiberation = total > 0 && approved === total;

    return { total, approved, rejected, pending, unWelded, percentApproved, isReadyForLiberation };
  }, [drawing.joints]);

  // Handle Zoom
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 400));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 40));
  const handleResetZoom = () => {
    setZoom(100);
    setPan({ x: 0, y: 0 });
  };

  const handleFitToScreen = () => {
    setZoom(100);
    setPan({ x: 0, y: 0 });
  };

  // Mouse Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoom(prev => Math.min(prev + 15, 400));
    } else {
      setZoom(prev => Math.max(prev - 15, 40));
    }
  };

  // Canvas Click for Drawing Tool Component Insertion
  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (activeTool === 'select' || draggedNode || draggedDimIndex) return;

    const svgElement = e.currentTarget;
    const rect = svgElement.getBoundingClientRect();
    const scaleX = 850 / rect.width;
    const scaleY = 520 / rect.height;
    const clickX = Math.round((e.clientX - rect.left) * scaleX);
    const clickY = Math.round((e.clientY - rect.top) * scaleY);

    pushHistory();

    if (activeTool === 'pipe') {
      const newPath = {
        d: `M ${clickX - 50} ${clickY} L ${clickX + 50} ${clickY}`,
        type: 'pipe' as const,
        strokeWidth: 8,
        label: `Tramo Tubería ${drawing.lineTag.split('-')[0] || '12"'}`
      };
      setDrawing(prev => ({
        ...prev,
        svgPaths: {
          ...prev.svgPaths,
          geometry: [...prev.svgPaths.geometry, newPath]
        }
      }));
    } else if (activeTool === 'elbow') {
      const newPath = {
        d: `M ${clickX - 25} ${clickY - 25} Q ${clickX} ${clickY - 25} ${clickX + 25} ${clickY + 25}`,
        type: 'elbow' as const,
        strokeWidth: 8,
        label: 'Codo 90° LR'
      };
      setDrawing(prev => ({
        ...prev,
        svgPaths: {
          ...prev.svgPaths,
          geometry: [...prev.svgPaths.geometry, newPath]
        }
      }));
    } else if (activeTool === 'flange') {
      const newPath = {
        d: `M ${clickX} ${clickY - 20} L ${clickX} ${clickY + 20} M ${clickX - 6} ${clickY - 20} L ${clickX - 6} ${clickY + 20}`,
        type: 'flange' as const,
        strokeWidth: 5,
        label: 'Brida WN 150#'
      };
      setDrawing(prev => ({
        ...prev,
        svgPaths: {
          ...prev.svgPaths,
          geometry: [...prev.svgPaths.geometry, newPath]
        }
      }));
    } else if (activeTool === 'valve') {
      const newPath = {
        d: `M ${clickX - 18} ${clickY - 14} L ${clickX + 18} ${clickY + 14} L ${clickX + 18} ${clickY - 14} L ${clickX - 18} ${clickY + 14} Z`,
        type: 'valve' as const,
        strokeWidth: 4,
        label: 'Válvula Comporta'
      };
      setDrawing(prev => ({
        ...prev,
        svgPaths: {
          ...prev.svgPaths,
          geometry: [...prev.svgPaths.geometry, newPath]
        }
      }));
    } else if (activeTool === 'joint') {
      const newJoint: IsometricJointNode = {
        id: `joint_new_${Date.now()}`,
        tag: `J-0${drawing.joints.length + 1}`,
        x: clickX,
        y: clickY,
        spoolTag: drawing.spools[0]?.tag || 'SPL-01',
        type: 'BUTT',
        pipeSize: '12"',
        wallThicknessMm: 12.7,
        material: 'API 5L X52',
        heatNumber: 'MTR-FIELD-2026',
        wpsCode: 'WPS-PDVSA-01',
        welderStamp: 'W-402',
        welderName: 'José Pérez',
        weldDate: new Date().toISOString().split('T')[0],
        fitupStatus: 'Aprobado',
        vtStatus: 'Aprobado',
        ndtMethod: 'RT',
        ndtStatus: 'SinSoldar',
      };
      setDrawing(prev => ({
        ...prev,
        joints: [...prev.joints, newJoint]
      }));
    }
  };

  // Node Drag Handlers
  const handleJointPointerDown = (e: React.PointerEvent, joint: IsometricJointNode) => {
    e.stopPropagation();
    if (activeTool !== 'select') return;
    pushHistory();
    setDraggedNode({
      id: joint.id,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      initX: joint.x,
      initY: joint.y,
    });
  };

  // Dim Drag Handlers
  const handleDimPointerDown = (e: React.PointerEvent, idx: number, dim: any) => {
    e.stopPropagation();
    if (activeTool !== 'select') return;
    pushHistory();
    setDraggedDimIndex({
      index: idx,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      initOffsetX: dim.offsetX || 0,
      initOffsetY: dim.offsetY || -6,
    });
  };

  // Mouse Pan Start
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.joint-node-button')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  // Mouse Pan & Element Drag Move
  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedNode) {
      const scale = zoom / 100;
      const dx = Math.round((e.clientX - draggedNode.startMouseX) / scale);
      const dy = Math.round((e.clientY - draggedNode.startMouseY) / scale);
      setDrawing(prev => ({
        ...prev,
        joints: prev.joints.map(j => j.id === draggedNode.id ? { ...j, x: draggedNode.initX + dx, y: draggedNode.initY + dy } : j)
      }));
      return;
    }

    if (draggedDimIndex) {
      const scale = zoom / 100;
      const dx = Math.round((e.clientX - draggedDimIndex.startMouseX) / scale);
      const dy = Math.round((e.clientY - draggedDimIndex.startMouseY) / scale);
      setDrawing(prev => ({
        ...prev,
        svgPaths: {
          ...prev.svgPaths,
          dimensions: prev.svgPaths.dimensions.map((d, i) => i === draggedDimIndex.index ? {
            ...d,
            offsetX: draggedDimIndex.initOffsetX + dx,
            offsetY: draggedDimIndex.initOffsetY + dy
          } : d)
        }
      }));
      return;
    }

    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  // Save Text Edit from Inline Popover
  const handleSaveTextEdit = () => {
    if (!editingText) return;
    pushHistory();
    if (editingText.type === 'dim') {
      setDrawing(prev => ({
        ...prev,
        svgPaths: {
          ...prev.svgPaths,
          dimensions: prev.svgPaths.dimensions.map((d, i) => i === editingText.idOrIndex ? { ...d, label: editingText.text } : d)
        }
      }));
    } else if (editingText.type === 'joint') {
      setDrawing(prev => ({
        ...prev,
        joints: prev.joints.map(j => j.id === editingText.idOrIndex ? { ...j, tag: editingText.text } : j)
      }));
    } else if (editingText.type === 'spool') {
      setDrawing(prev => ({
        ...prev,
        spools: prev.spools.map(s => s.id === editingText.idOrIndex ? { ...s, description: editingText.text } : s)
      }));
    }
    setEditingText(null);
  };

  // Mouse Pan & Drag End
  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedNode(null);
    setDraggedDimIndex(null);
  };

  // Click Joint Node
  const handleJointClick = (joint: IsometricJointNode) => {
    setActiveJoint(joint);
    setEditStatus(joint.ndtStatus);
    setEditWelderStamp(joint.welderStamp);
    setEditWelderName(joint.welderName || 'José Pérez');
    setEditHeatNumber(joint.heatNumber);
    setEditNdtMethod(joint.ndtMethod);
    setEditNdtReportNo(joint.ndtReportNo || `REP-${joint.ndtMethod}-2026-001`);
    setEditInspectorName(joint.inspectorName || 'Ing. Marcos Silva');
    setIsDrawerOpen(true);

    if (onJointSelect) {
      onJointSelect(joint);
    }
  };

  // Save Joint Edits to State and Firestore
  const handleSaveJointEdits = async () => {
    if (!activeJoint) return;

    setIsSavingJoint(true);
    try {
      // Update local state
      const updatedJoints = drawing.joints.map(j => {
        if (j.id === activeJoint.id) {
          return {
            ...j,
            ndtStatus: editStatus,
            welderStamp: editWelderStamp,
            welderName: editWelderName,
            heatNumber: editHeatNumber,
            ndtMethod: editNdtMethod,
            ndtReportNo: editNdtReportNo,
            inspectorName: editInspectorName
          };
        }
        return j;
      });

      setDrawing(prev => ({ ...prev, joints: updatedJoints }));
      setActiveJoint(prev => prev ? {
        ...prev,
        ndtStatus: editStatus,
        welderStamp: editWelderStamp,
        welderName: editWelderName,
        heatNumber: editHeatNumber,
        ndtMethod: editNdtMethod,
        ndtReportNo: editNdtReportNo,
        inspectorName: editInspectorName
      } : null);

      // Save/sync to Firestore under multi-tenant path
      if (currentProject && currentProject.id !== 'all') {
        const targetPath = `organizations/${orgId}/projects/${currentProject.id}/weld_joints`;
        // Query existing doc by tag
        const q = query(collection(db, targetPath), where('tag', '==', activeJoint.tag));
        const snap = await getDocs(q);

        if (!snap.empty) {
          const docRef = doc(db, targetPath, snap.docs[0].id);
          await updateDoc(docRef, {
            ndtStatus: editStatus,
            welderStamp: editWelderStamp,
            heatNumber: editHeatNumber,
            ndtMethod: editNdtMethod,
            ndtReportNo: editNdtReportNo,
            inspectorName: editInspectorName,
            updatedAt: new Date().toISOString()
          });
        } else {
          await addDoc(collection(db, targetPath), {
            projectId: currentProject.id,
            orgId,
            tag: activeJoint.tag,
            isometric: drawing.number,
            type: activeJoint.type,
            pipeSize: activeJoint.pipeSize,
            wallThicknessMm: activeJoint.wallThicknessMm,
            material: activeJoint.material,
            heatNumber: editHeatNumber,
            wpsCode: activeJoint.wpsCode,
            welderStamp: editWelderStamp,
            process: 'GTAW',
            position: '6G',
            weldDate: new Date().toISOString().slice(0, 10),
            fitupStatus: 'Aprobado',
            vtStatus: 'Aprobado',
            ndtMethod: editNdtMethod,
            ndtStatus: editStatus,
            ndtReportNo: editNdtReportNo,
            inspectorName: editInspectorName,
            createdAt: new Date().toISOString()
          });
        }
      }

      setIsDrawerOpen(false);
    } catch (err) {
      console.error('Error updating joint in Firestore:', err);
    } finally {
      setIsSavingJoint(false);
    }
  };

  // Custom SVG File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCustomSvgContent(content);
      handleFitToScreen();
    };
    reader.readAsText(file);
  };

  // Export As-Built PDF for Chapter 6 Dossier
  const handleLiberateAsBuilt = async () => {
    setIsLiberating(true);
    setLiberationSuccess(false);

    try {
      const orgName = currentOrganization?.name || 'SEMAX PINO C.A.';
      const projName = currentProject?.name || 'Proyecto Tuberías y Recipientes PDVSA';

      // Generate PDF
      const { pdfBlob, hashSha256 } = await generateAsBuiltPdf(drawing, orgName, projName);

      // Save As-Built liberation record in Firestore
      if (currentProject && currentProject.id !== 'all') {
        const asBuiltPath = `organizations/${orgId}/projects/${currentProject.id}/isometric_asbuilts`;
        await addDoc(collection(db, asBuiltPath), {
          isometricNumber: drawing.number,
          lineTag: drawing.lineTag,
          lineDescription: drawing.title,
          totalJoints: drawing.joints.length,
          approvedJoints: stats.approved,
          liberatedAt: new Date().toISOString(),
          liberatedBy: 'Ing. Manuel Silva (QA/QC Manager)',
          hashSha256,
          projectId: currentProject.id,
          orgId,
          status: 'Liberado As-Built'
        });
      }

      // Download PDF file directly
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `AsBuilt_Isometrico_${drawing.number}_${drawing.lineTag.replace(/["\s]/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setLiberationSuccess(true);
    } catch (err) {
      console.error('Error liberating As-Built isometric:', err);
      alert('Error al generar el certificado As-Built.');
    } finally {
      setIsLiberating(false);
    }
  };

  // Get color by NDT status
  const getStatusColor = (status: JointNdtStatus) => {
    switch (status) {
      case 'Aprobado':
        return { bg: 'bg-emerald-500', text: 'text-emerald-500', border: 'border-emerald-500', fill: '#10b981', ring: 'ring-emerald-500/40' };
      case 'Rechazado':
        return { bg: 'bg-red-500', text: 'text-red-500', border: 'border-red-500', fill: '#ef4444', ring: 'ring-red-500/40' };
      case 'Pendiente':
        return { bg: 'bg-amber-500', text: 'text-amber-500', border: 'border-amber-500', fill: '#f59e0b', ring: 'ring-amber-500/40' };
      case 'SinSoldar':
      default:
        return { bg: 'bg-gray-400', text: 'text-gray-400', border: 'border-gray-400', fill: '#9ca3af', ring: 'ring-gray-400/40' };
    }
  };

  return (
    <div className={`flex flex-col bg-surface rounded-2xl border border-line shadow-sm overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''} ${className}`}>
      
      {/* HEADER TOOLBAR */}
      <div className="p-4 bg-surface-2 border-b border-line flex flex-wrap items-center justify-between gap-3">
        
        {/* Drawing Selector & Title */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
            <FileCode2 size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <select
                value={selectedIsoIndex}
                onChange={(e) => setSelectedIsoIndex(Number(e.target.value))}
                className="bg-surface font-bold text-ink text-sm border border-line rounded-lg px-2.5 py-1 outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
              >
                {SAMPLE_ISOMETRICS.map((iso, idx) => (
                  <option key={iso.id} value={idx}>
                    {iso.number} — {iso.lineTag}
                  </option>
                ))}
              </select>

              <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold border border-brand-500/20">
                {drawing.revision}
              </span>
            </div>
            <p className="text-xs text-ink-soft font-medium mt-0.5">
              {drawing.title} | Fluido: <span className="text-ink font-semibold">{drawing.fluidSystem}</span>
            </p>
          </div>
        </div>

        {/* NDT Status Progress Badge */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 bg-surface px-3 py-1.5 rounded-xl border border-line text-xs font-medium">
            <span className="text-ink-soft">Avance Juntas NDT:</span>
            <div className="w-20 bg-surface-2 rounded-full h-2 overflow-hidden border border-line">
              <div 
                className="bg-emerald-500 h-full transition-all duration-500" 
                style={{ width: `${stats.percentApproved}%` }}
              />
            </div>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {stats.approved}/{stats.total} ({stats.percentApproved}%)
            </span>
          </div>

          {/* As-Built Export Button */}
          {stats.isReadyForLiberation ? (
            <button
              onClick={handleLiberateAsBuilt}
              disabled={isLiberating}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-md transition-all cursor-pointer animate-pulse"
            >
              <FileCheck size={16} />
              {isLiberating ? 'Inyectando As-Built...' : 'Liberar e Inyectar Dossier Cap. 6 (PDF)'}
            </button>
          ) : (
            <span className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-xl font-bold border border-amber-500/20 flex items-center gap-1.5">
              <AlertTriangle size={14} />
              Inspección NDT Incompleta ({stats.approved}/{stats.total})
            </span>
          )}

          {/* Upload Custom SVG */}
          <label className="flex items-center gap-1.5 bg-surface hover:bg-surface-2 text-ink text-xs font-medium px-3 py-2 rounded-xl border border-line cursor-pointer transition-all">
            <Upload size={15} className="text-ink-soft" />
            <span className="hidden sm:inline">Cargar SVG/CAD</span>
            <input 
              type="file" 
              accept=".svg,.xml" 
              onChange={handleFileUpload} 
              className="hidden" 
            />
          </label>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-xl bg-surface hover:bg-surface-2 text-ink-soft border border-line transition-all cursor-pointer"
            title={isFullscreen ? 'Restaurar Pantalla' : 'Pantalla Completa'}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* CONTROL SUB-BAR (ZOOM, PAN, LAYERS) */}
      <div className="px-4 py-2 bg-surface border-b border-line flex flex-wrap items-center justify-between gap-2 text-xs">
        
        {/* Layer Toggles */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-ink-soft font-bold flex items-center gap-1">
            <Layers size={14} /> Capas:
          </span>

          <button
            onClick={() => setShowGeometry(!showGeometry)}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer text-xs ${
              showGeometry ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 shadow-sm' : 'bg-surface-2 text-ink-faint border border-line hover:text-ink'
            }`}
          >
            📐 Geometría
          </button>

          <button
            onClick={() => setShowDimensions(!showDimensions)}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer text-xs ${
              showDimensions ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40 shadow-sm' : 'bg-surface-2 text-ink-faint border border-line hover:text-ink'
            }`}
          >
            📏 Cotas
          </button>

          <button
            onClick={() => setShowJointNodes(!showJointNodes)}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer text-xs ${
              showJointNodes ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm' : 'bg-surface-2 text-ink-faint border border-line hover:text-ink'
            }`}
          >
            🏷️ Juntas NDT ({drawing.joints.length})
          </button>

          <button
            onClick={() => setShowSpoolsLegend(!showSpoolsLegend)}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer text-xs ${
              showSpoolsLegend ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm' : 'bg-surface-2 text-ink-faint border border-line hover:text-ink'
            }`}
          >
            🧩 Spools & BOM
          </button>

          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
              showGrid ? 'bg-surface-2 text-ink font-bold border border-line' : 'text-ink-faint'
            }`}
            title="Cuadrícula Isométrica"
          >
            <Grid size={14} />
          </button>
        </div>

        {/* Zoom & Viewport Controls & Vector Drawing Palette */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Drawing Tools Palette (Sprint 10: Smart Vector Canvas Engine) */}
          <div className="flex items-center gap-1 bg-surface-2 p-1 rounded-xl border border-line">
            <span className="text-[10px] font-bold text-ink-soft px-1.5 uppercase hidden xl:inline">Herramientas:</span>
            
            <button
              onClick={() => setActiveTool('select')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeTool === 'select' ? 'bg-brand-600 text-white shadow-xs' : 'text-ink-soft hover:bg-surface'
              }`}
              title="Seleccionar y Arrastrar Nodos/Cotas"
            >
              <MousePointer size={14} />
              <span className="hidden sm:inline">Cursor</span>
            </button>

            <button
              onClick={() => setActiveTool('pipe')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeTool === 'pipe' ? 'bg-brand-600 text-white shadow-xs' : 'text-ink-soft hover:bg-surface'
              }`}
              title="Insertar Tramo Tubería"
            >
              <Spline size={14} />
              <span className="hidden sm:inline">+Tubería</span>
            </button>

            <button
              onClick={() => setActiveTool('elbow')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeTool === 'elbow' ? 'bg-brand-600 text-white shadow-xs' : 'text-ink-soft hover:bg-surface'
              }`}
              title="Insertar Codo 90°"
            >
              <Disc size={14} />
              <span className="hidden sm:inline">+Codo</span>
            </button>

            <button
              onClick={() => setActiveTool('flange')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeTool === 'flange' ? 'bg-brand-600 text-white shadow-xs' : 'text-ink-soft hover:bg-surface'
              }`}
              title="Insertar Brida WN"
            >
              <Layers size={14} />
              <span className="hidden sm:inline">+Brida</span>
            </button>

            <button
              onClick={() => setActiveTool('valve')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeTool === 'valve' ? 'bg-brand-600 text-white shadow-xs' : 'text-ink-soft hover:bg-surface'
              }`}
              title="Insertar Válvula"
            >
              <Wrench size={14} />
              <span className="hidden sm:inline">+Válvula</span>
            </button>

            <button
              onClick={() => setActiveTool('joint')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeTool === 'joint' ? 'bg-emerald-600 text-white shadow-xs' : 'text-ink-soft hover:bg-surface'
              }`}
              title="Insertar Nueva Junta NDT"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">+Junta</span>
            </button>

            {history.length > 0 && (
              <button
                onClick={handleUndo}
                className="p-1.5 rounded-lg text-xs font-bold text-amber-500 hover:bg-amber-500/10 transition-all cursor-pointer flex items-center gap-1"
                title="Deshacer último cambio"
              >
                <Undo2 size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 bg-surface-2 px-2 py-1 rounded-xl border border-line">
            <button 
              onClick={handleZoomOut} 
              className="p-1 hover:bg-surface text-ink-soft hover:text-ink rounded cursor-pointer"
              title="Alejar"
            >
              <ZoomOut size={15} />
            </button>
            <span className="font-mono font-bold text-ink w-12 text-center text-xs">
              {zoom}%
            </span>
            <button 
              onClick={handleZoomIn} 
              className="p-1 hover:bg-surface text-ink-soft hover:text-ink rounded cursor-pointer"
              title="Acercar"
            >
              <ZoomIn size={15} />
            </button>
            <div className="w-px h-4 bg-line mx-1" />
            <button 
              onClick={handleFitToScreen} 
              className="p-1 hover:bg-surface text-ink-soft hover:text-ink rounded cursor-pointer flex items-center gap-1 font-medium"
              title="Centrar Plano"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CAD SVG CANVAS VIEWPORT */}
      <div 
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`relative w-full h-[540px] bg-[#0d1520] select-none overflow-hidden cursor-grab active:cursor-grabbing ${
          showGrid ? 'bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px]' : ''
        }`}
      >
        {/* SVG Container with Transform (Zoom & Pan) */}
        <div 
          className="absolute inset-0 flex items-center justify-center transition-transform duration-75 origin-center"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})`
          }}
        >
          {customSvgContent ? (
            /* Render Uploaded Custom SVG */
            <div 
              className="w-[850px] h-[500px] flex items-center justify-center text-white"
              dangerouslySetInnerHTML={{ 
                __html: DOMPurify.sanitize(customSvgContent, { 
                  USE_PROFILES: { svg: true },
                  FORBID_TAGS: ['script', 'foreignObject', 'filter', 'feComponentTransfer', 'feTurbulence'],
                  FORBID_ATTR: ['on*', 'href', 'xlink:href', 'javascript:*']
                }) 
              }} 
            />
          ) : (
            /* Render Native Isometric SVG Drawing */
            <div className="relative w-[850px] h-[520px]">
              
              {/* SVG CAD VECTOR GRAPHICS */}
              <svg 
                viewBox="0 0 850 520" 
                onClick={handleCanvasClick}
                className={`w-full h-full drop-shadow-lg ${activeTool !== 'select' ? 'cursor-crosshair' : ''}`}
              >
                <defs>
                  {/* Pipe Gradient */}
                  <linearGradient id="pipeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="50%" stopColor="#0284c7" />
                    <stop offset="100%" stopColor="#0369a1" />
                  </linearGradient>

                  {/* Dimension Arrowhead */}
                  <marker id="dimArrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
                  </marker>
                </defs>

                {/* LAYER 1: SPOOL BOUNDARY BOXES & LABELS */}
                {showSpoolsLegend && (
                  <g className="transition-opacity">
                    <rect 
                      x={110} 
                      y={105} 
                      width={650} 
                      height={375} 
                      fill="none" 
                      stroke="#38bdf8" 
                      strokeWidth={1} 
                      strokeDasharray="6 4" 
                      rx={12}
                    />
                    {drawing.spools.map((spool, idx) => (
                      <text 
                        key={spool.id} 
                        x={125} 
                        y={82 + idx * 16} 
                        fill="#38bdf8" 
                        fontSize={11} 
                        fontWeight="bold" 
                        fontFamily="monospace"
                        className="cursor-pointer hover:underline"
                        onDoubleClick={() => setEditingText({ type: 'spool', idOrIndex: spool.id, text: spool.description })}
                      >
                        • {spool.tag} — {spool.description} (Doble clic para editar)
                      </text>
                    ))}
                  </g>
                )}

                {/* LAYER 2: PIPELINE GEOMETRY */}
                {showGeometry && drawing.svgPaths.geometry.map((path, idx) => (
                  <g key={idx}>
                    <path
                      d={path.d}
                      fill="none"
                      stroke={path.type === 'flange' ? '#38bdf8' : path.type === 'valve' ? '#f59e0b' : 'url(#pipeGrad)'}
                      strokeWidth={path.strokeWidth || 8}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {path.label && (
                      <text 
                        x={200} 
                        y={370} 
                        fill="#94a3b8" 
                        fontSize={10} 
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        {path.label}
                      </text>
                    )}
                  </g>
                ))}

                {/* LAYER 3: DIMENSION LINES & ELEVATIONS */}
                {showDimensions && drawing.svgPaths.dimensions.map((dim, idx) => (
                  <g key={idx}>
                    <line
                      x1={dim.x1}
                      y1={dim.y1}
                      x2={dim.x2}
                      y2={dim.y2}
                      stroke="#64748b"
                      strokeWidth={1.5}
                      strokeDasharray="3 3"
                      markerStart="url(#dimArrow)"
                      markerEnd="url(#dimArrow)"
                    />
                    <text
                      x={(dim.x1 + dim.x2) / 2 + (dim.offsetX || 0)}
                      y={(dim.y1 + dim.y2) / 2 + (dim.offsetY || -6)}
                      fill="#cbd5e1"
                      fontSize={10}
                      fontFamily="monospace"
                      textAnchor="middle"
                      className="cursor-move hover:fill-brand-400 select-none"
                      onPointerDown={(e) => handleDimPointerDown(e, idx, dim)}
                      onDoubleClick={() => setEditingText({ type: 'dim', idOrIndex: idx, text: dim.label })}
                    >
                      {dim.label}
                    </text>
                  </g>
                ))}
              </svg>

              {/* LAYER 4: INTERACTIVE JOINT NODES OVERLAY */}
              {showJointNodes && drawing.joints.map((joint) => {
                const color = getStatusColor(joint.ndtStatus);
                const isSelected = selectedJointId === joint.id || activeJoint?.id === joint.id;

                return (
                  <div
                    key={joint.id}
                    style={{ left: `${joint.x}px`, top: `${joint.y}px` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group"
                    onPointerDown={(e) => handleJointPointerDown(e, joint)}
                  >
                    <button
                      onClick={() => handleJointClick(joint)}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setEditingText({ type: 'joint', idOrIndex: joint.id, text: joint.tag });
                      }}
                      className={`joint-node-button relative flex items-center justify-center p-1.5 rounded-full shadow-lg border-2 transition-all transform hover:scale-125 cursor-move ${
                        color.bg
                      } ${color.border} ${isSelected ? 'ring-4 ring-white shadow-2xl scale-125' : ''}`}
                    >
                      {/* Pulse Ring for Pending/Rejected */}
                      {joint.ndtStatus === 'Rechazado' && (
                        <span className="absolute -inset-1 rounded-full bg-red-500/50 animate-ping" />
                      )}
                      
                      <span className="text-[10px] font-extrabold text-white font-mono px-1">
                        {joint.tag}
                      </span>
                    </button>

                    {/* Hover Tooltip Card */}
                    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2.5 bg-slate-900/95 text-white text-xs rounded-xl shadow-2xl border border-slate-700 z-30">
                      <div className="flex items-center justify-between font-bold border-b border-slate-700 pb-1 mb-1">
                        <span>Junta {joint.tag}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${color.bg} text-white`}>
                          {joint.ndtStatus}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300">Spool: {joint.spoolTag}</p>
                      <p className="text-[11px] text-slate-300">Estampa: {joint.welderStamp}</p>
                      <p className="text-[11px] text-slate-300">Colada: {joint.heatNumber}</p>
                      <p className="text-[10px] text-emerald-400 font-mono mt-1">
                        NDT {joint.ndtMethod}: {joint.ndtReportNo || 'Pendiente'}
                      </p>
                    </div>
                  </div>
                );
              })}

              {/* LAYER 5: BOM LEGEND TABLE (BOTTOM RIGHT OVERLAY) */}
              {showSpoolsLegend && (
                <div className="absolute bottom-3 right-3 bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-xl p-3 text-white text-xs max-w-xs shadow-xl z-10 hidden sm:block">
                  <div className="flex items-center justify-between font-bold text-slate-200 border-b border-slate-700 pb-1 mb-1.5">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <FileText size={13} /> Lista de Materiales (BOM)
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{drawing.number}</span>
                  </div>

                  <div className="space-y-1 font-mono text-[10px] max-h-28 overflow-y-auto">
                    {drawing.bom.map((item) => (
                      <div key={item.itemNo} className="flex items-center justify-between gap-2 border-b border-slate-800/60 pb-0.5">
                        <span className="text-slate-300 truncate">
                          [{item.itemNo}] {item.description}
                        </span>
                        <span className="text-emerald-400 shrink-0 font-bold">
                          {item.qty} {item.nominalSize}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* NDT STATUS COLOR LEGEND BAR */}
        <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-white text-xs flex items-center gap-3 z-10">
          <span className="font-bold text-slate-300 text-[11px]">Leyenda Juntas:</span>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-[11px] text-slate-300">Aprobado</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="text-[11px] text-slate-300">Rechazado</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-[11px] text-slate-300">Pendiente</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-400" />
            <span className="text-[11px] text-slate-300">Sin Soldar</span>
          </div>
        </div>
      </div>

      {/* SUCCESS LIBERATION BANNER */}
      {liberationSuccess && (
        <div className="bg-emerald-500/10 border-t border-emerald-500/20 p-4 flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400">
          <div className="flex items-center gap-2 font-semibold">
            <Sparkles size={18} />
            <span>
              ¡Isométrico <strong className="font-mono">{drawing.number}</strong> liberado exitosamente e inyectado al Capítulo 6 del Dossier de Calidad!
            </span>
          </div>
          <button 
            onClick={() => setLiberationSuccess(false)}
            className="text-emerald-600 dark:text-emerald-400 hover:opacity-80 p-1"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* SLIDE-OVER DRAWER FOR JOINT & MTR TRACEABILITY */}
      {isDrawerOpen && activeJoint && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-surface h-full shadow-2xl border-l border-line flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            
            {/* DRAWER HEADER */}
            <div className="p-5 bg-surface-2 border-b border-line flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-extrabold text-ink font-mono">
                    Junta {activeJoint.tag}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold text-white ${getStatusColor(activeJoint.ndtStatus).bg}`}>
                    {activeJoint.ndtStatus}
                  </span>
                </div>
                <p className="text-xs text-ink-soft mt-0.5 font-medium">
                  {drawing.number} | Spool: <span className="font-mono text-ink">{activeJoint.spoolTag}</span> | Diámetro: <span className="font-bold text-ink">{activeJoint.pipeSize}</span>
                </p>
              </div>

              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 rounded-xl text-ink-soft hover:text-ink hover:bg-surface border border-line transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* DRAWER BODY */}
            <div className="p-6 space-y-6 flex-1">
              
              {/* SECTION 1: MTR MATERIAL TRACEABILITY */}
              <div className="bg-surface-2 border border-line rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-2">
                    <ShieldCheck className="text-emerald-600 dark:text-emerald-400" size={16} />
                    Trazabilidad de Colada MTR (Capítulo 3)
                  </h4>
                  <span className="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                    Certificado ASTM/API
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-ink-soft text-[11px] block">Número de Colada (Heat No.):</span>
                    <span className="font-mono font-bold text-ink">{activeJoint.heatNumber}</span>
                  </div>
                  <div>
                    <span className="text-ink-soft text-[11px] block">Especificación Material:</span>
                    <span className="font-semibold text-ink">{activeJoint.material}</span>
                  </div>
                  <div>
                    <span className="text-ink-soft text-[11px] block">Espesor Nominal:</span>
                    <span className="font-bold text-ink">{activeJoint.wallThicknessMm} mm</span>
                  </div>
                  <div>
                    <span className="text-ink-soft text-[11px] block">Procedimiento WPS:</span>
                    <span className="font-mono font-bold text-brand-600 dark:text-brand-400">{activeJoint.wpsCode}</span>
                  </div>
                </div>

                {/* Chemical & Mechanical Properties Summary */}
                <div className="pt-2 border-t border-line text-[11px] text-ink-soft space-y-1">
                  <p><strong className="text-ink">Análisis Químico MTR:</strong> C: 0.18%, Mn: 1.25%, P: 0.012%, S: 0.005%, CE: 0.38%</p>
                  <p><strong className="text-ink">Ensayos Mecánicos:</strong> YS: 360 MPa | TS: 520 MPa | Elongación: 28%</p>
                </div>
              </div>

              {/* SECTION 2: WELDER STAMP (WPQ) */}
              <div className="bg-surface-2 border border-line rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-2">
                    <HardHat className="text-amber-600 dark:text-amber-400" size={16} />
                    Estampa del Soldador (WPQ Calificado)
                  </h4>
                  <span className="text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded border border-amber-500/20">
                    API 1104 / ASME IX
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-ink-soft text-[11px] block">Estampa ID:</span>
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">{activeJoint.welderStamp}</span>
                  </div>
                  <div>
                    <span className="text-ink-soft text-[11px] block">Nombre del Soldador:</span>
                    <span className="font-semibold text-ink">{activeJoint.welderName || 'José Pérez'}</span>
                  </div>
                  <div>
                    <span className="text-ink-soft text-[11px] block">Calificación Posición:</span>
                    <span className="font-bold text-ink">6G (Todas)</span>
                  </div>
                  <div>
                    <span className="text-ink-soft text-[11px] block">Estado WPQ:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ Vigente</span>
                  </div>
                </div>
              </div>

              {/* SECTION 3: NDT INSPECTION REPORT & DICONDE */}
              <div className="bg-surface-2 border border-line rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-2">
                    <Award className="text-blue-600 dark:text-blue-400" size={16} />
                    Reporte NDT y DICONDE (Capítulo 4)
                  </h4>
                  <span className="text-[10px] font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">
                    {activeJoint.ndtMethod}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-ink-soft text-[11px] block">N° Reporte NDT:</span>
                    <span className="font-mono font-bold text-ink">{activeJoint.ndtReportNo || 'REP-PENDIENTE'}</span>
                  </div>
                  <div>
                    <span className="text-ink-soft text-[11px] block">Inspector ASNT Level II/III:</span>
                    <span className="font-semibold text-ink">{activeJoint.inspectorName || 'Ing. Marcos Silva'}</span>
                  </div>
                </div>

                {/* DICONDE Sample Film Preview if available */}
                {activeJoint.dicondeSampleId && (
                  <div className="mt-2 p-2 bg-slate-900 rounded-lg text-white text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
                      <span>DICONDE RT Scan Image</span>
                      <span className="text-emerald-400 font-bold">ASTM DICONDE Validated</span>
                    </div>
                    <div className="relative rounded overflow-hidden h-24 bg-black flex items-center justify-center">
                      <img 
                        src="https://images.unsplash.com/photo-1579551381283-29e568403543?auto=format&fit=crop&w=600&q=80" 
                        alt="DICONDE Radiography" 
                        className="w-full h-full object-cover filter grayscale contrast-125 brightness-90"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                        <span className="text-[10px] font-mono text-emerald-400 font-bold">
                          Junta {activeJoint.tag} — Pase de Raíz OK
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 4: EDIT JOINT FORM FOR INSPECTORS */}
              <div className="p-4 bg-surface rounded-xl border border-line space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-2">
                  <RefreshCw className="text-brand-600 dark:text-brand-400" size={15} />
                  Actualizar Dictamen NDT de Junta
                </h4>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-ink-soft font-bold mb-1">Estado Inspección NDT:</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as JointNdtStatus)}
                      className="w-full px-3 py-2 border border-line rounded-lg bg-surface text-ink font-bold outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="Aprobado">🟢 Aprobado (Libre de Defectos)</option>
                      <option value="Rechazado">🔴 Rechazado (En Reparación)</option>
                      <option value="Pendiente">🟡 Pendiente por Inspección NDT</option>
                      <option value="SinSoldar">⚪ Sin Soldar / Pendiente Fit-up</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-ink-soft font-bold mb-1">Estampa Soldador:</label>
                      <input
                        type="text"
                        value={editWelderStamp}
                        onChange={(e) => setEditWelderStamp(e.target.value)}
                        className="w-full px-3 py-2 border border-line rounded-lg bg-surface text-ink font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-ink-soft font-bold mb-1">Heat No. Colada MTR:</label>
                      <input
                        type="text"
                        value={editHeatNumber}
                        onChange={(e) => setEditHeatNumber(e.target.value)}
                        className="w-full px-3 py-2 border border-line rounded-lg bg-surface text-ink font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-ink-soft font-bold mb-1">Método NDT:</label>
                      <select
                        value={editNdtMethod}
                        onChange={(e) => setEditNdtMethod(e.target.value as any)}
                        className="w-full px-3 py-2 border border-line rounded-lg bg-surface text-ink font-semibold"
                      >
                        <option value="RT">RT (Radiografía)</option>
                        <option value="UT/PAUT">UT (Phased Array)</option>
                        <option value="VT">VT (Visual)</option>
                        <option value="PT">PT (Líquidos Penetrantes)</option>
                        <option value="MT">MT (Partículas Magnéticas)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-ink-soft font-bold mb-1">N° Reporte NDT:</label>
                      <input
                        type="text"
                        value={editNdtReportNo}
                        onChange={(e) => setEditNdtReportNo(e.target.value)}
                        className="w-full px-3 py-2 border border-line rounded-lg bg-surface text-ink font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* DRAWER FOOTER */}
            <div className="p-4 bg-surface-2 border-t border-line flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="px-4 py-2 border border-line rounded-xl text-xs font-semibold text-ink-soft hover:bg-surface transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveJointEdits}
                disabled={isSavingJoint}
                className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Check size={16} />
                {isSavingJoint ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* INLINE TEXT EDIT POPUP MODAL */}
      {editingText && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-surface border border-line rounded-2xl p-5 w-full max-w-md shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                <Pencil size={16} className="text-brand-500" />
                Edición Directa de Texto en Lienzo
              </h3>
              <button 
                onClick={() => setEditingText(null)}
                className="p-1 rounded-lg text-ink-soft hover:bg-surface-2 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-soft mb-1">
                Etiqueta / Texto ({editingText.type === 'dim' ? 'Cota' : editingText.type === 'joint' ? 'Etiqueta Junta' : 'Descripción Spool'}):
              </label>
              <input
                type="text"
                value={editingText.text}
                onChange={(e) => setEditingText({ ...editingText, text: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveTextEdit();
                  }
                }}
                autoFocus
                className="w-full px-3 py-2 bg-surface-2 border border-line rounded-xl text-sm font-mono text-ink outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingText(null)}
                className="px-3.5 py-1.5 border border-line rounded-xl text-xs font-semibold text-ink-soft hover:bg-surface cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveTextEdit}
                className="px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1"
              >
                <Check size={14} />
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
