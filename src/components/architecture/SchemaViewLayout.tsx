import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Download,
  Layers,
  Info,
  ShieldCheck,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Crosshair,
  X
} from 'lucide-react';

export interface ArchitectureSection {
  title: string;
  badge?: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
}

export interface SchemaViewLayoutProps {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  badgeColor?: string;
  svgSrc: string;
  svgAlt: string;
  overview: string;
  keyPoints: { label: string; desc: string; type?: 'info' | 'warning' | 'success' }[];
  sections: ArchitectureSection[];
  rules?: string[];
  techStack?: string[];
}

export const SchemaViewLayout: React.FC<SchemaViewLayoutProps> = ({
  title,
  subtitle,
  category,
  badgeColor = 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  svgSrc,
  svgAlt,
  overview,
  keyPoints,
  sections,
  rules,
  techStack,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'rules'>('overview');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const viewportRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoomLevel((prev) => +(prev * 1.25).toFixed(3));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(0.01, +(prev / 1.25).toFixed(3)));

  const handleCenter = () => {
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
  };

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };


  // Zoom infini avec la molette de la souris
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    setZoomLevel((prev) => {
      const nextZoom = prev * zoomFactor;
      return Math.max(0.01, Math.min(nextZoom, 500));
    });
  }, []);

  // Pan / Drag de la souris
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  return (
    <div className={`flex flex-col lg:flex-row h-full w-full bg-[#0b0d13] text-[#e6edf3] overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50 bg-[#0b0d13]' : ''}`}>
      {/* SVG Architecture Viewer Panel */}
      <div className="flex-1 flex flex-col bg-[#05070a] relative overflow-hidden min-h-0 border-b lg:border-b-0 lg:border-r border-[#21262d]">

        {/* Fullscreen Close Button */}
        {isFullscreen && (
          <div className="absolute top-4 right-4 z-30">
            <button
              onClick={() => setIsFullscreen(false)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#161b22]/90 hover:bg-[#21262d] border border-[#30363d] text-gray-200 hover:text-white text-xs font-medium shadow-lg backdrop-blur-md transition-all cursor-pointer"
              title="Fermer le plein écran (Échap)"
            >
              <X className="w-4 h-4 text-red-400" />
              <span>Fermer</span>
            </button>
          </div>
        )}

        {/* SVG Viewport / Canvas */}
        <div
          ref={viewportRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`flex-1 overflow-hidden relative flex items-center justify-center bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:16px_16px] select-none ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
        >
          <div
            className="flex items-center justify-center pointer-events-none will-change-transform"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoomLevel})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.1s ease-out'
            }}
          >
            <div className="bg-[#0f141c] p-3 sm:p-5 rounded-xl border border-[#30363d] shadow-2xl relative group">
              <img
                src={svgSrc}
                alt={svgAlt}
                className="max-h-[85vh] w-auto max-w-[85vw] object-contain rounded drop-shadow-md select-none pointer-events-none"
                draggable={false}
              />
            </div>
          </div>
        </div>

        {/* Bottom Floating Toolbar */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0d1117]/90 border border-[#30363d] shadow-2xl backdrop-blur-md text-gray-300">
          <button
            onClick={handleZoomOut}
            className="p-2 text-gray-400 hover:text-white hover:bg-[#21262d] rounded-lg transition-colors cursor-pointer"
            title="Zoom Arrière"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <span className="text-[11px] font-mono text-gray-400 px-1 min-w-[50px] text-center select-none">
            {Math.round(zoomLevel * 100)}%
          </span>

          <button
            onClick={handleZoomIn}
            className="p-2 text-gray-400 hover:text-white hover:bg-[#21262d] rounded-lg transition-colors cursor-pointer"
            title="Zoom Avant"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-[#30363d] mx-1" />

          <button
            onClick={handleCenter}
            className="p-2 text-gray-400 hover:text-white hover:bg-[#21262d] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            title="Centrer le schéma"
          >
            <Crosshair className="w-4 h-4" />
          </button>


          <button
            onClick={toggleFullscreen}
            className="p-2 text-gray-400 hover:text-white hover:bg-[#21262d] rounded-lg transition-colors cursor-pointer"
            title={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-red-400" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

      </div>

      {/* RIGHT PANEL: Architecture Documentation & Details */}
      <div className={`w-full lg:w-[480px] xl:w-[540px] 2xl:w-[580px] flex flex-col bg-[#0d1117] overflow-hidden flex-shrink-0 ${isFullscreen ? 'hidden' : ''}`}>

        {/* Header */}
        <div className="p-5 border-b border-[#21262d] bg-[#161b22]/70 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-[11px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full border ${badgeColor}`}>
              {category}
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-red-500 flex-shrink-0" />
            {title}
          </h1>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#21262d] bg-[#0d1117] px-4 pt-2 gap-1 text-xs font-medium">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-2 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'overview'
                ? 'border-red-500 text-white bg-[#161b22]/50 rounded-t'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-[#161b22]/20 rounded-t'
            }`}
          >
            <Info className="w-3.5 h-3.5 text-blue-400" />
            Vue d'ensemble
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`px-3 py-2 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'details'
                ? 'border-red-500 text-white bg-[#161b22]/50 rounded-t'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-[#161b22]/20 rounded-t'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-purple-400" />
            Détails & Composants
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-3 py-2 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'rules'
                ? 'border-red-500 text-white bg-[#161b22]/50 rounded-t'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-[#161b22]/20 rounded-t'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Règles & Principes
          </button>
        </div>

        {/* Documentation Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar text-sm">
          {activeTab === 'overview' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Executive Summary */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
                <h3 className="text-xs uppercase font-semibold text-gray-400 tracking-wider mb-2 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-blue-400" /> Description du Schéma
                </h3>
                <p className="text-gray-400 italic text-xs sm:text-sm leading-relaxed">
                  À enrichir
                </p>
              </div>

              {/* Key Highlights / Pillars */}
              <div className="space-y-3">
                <h3 className="text-xs uppercase font-semibold text-gray-400 tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Points Clés d'Architecture
                </h3>
                <div className="p-4 rounded-lg border border-[#30363d] bg-[#161b22]/60">
                  <p className="text-gray-400 italic text-xs leading-relaxed">
                    À enrichir
                  </p>
                </div>
              </div>

              {/* Tech Stack & Tags */}
              <div>
                <h3 className="text-xs uppercase font-semibold text-gray-400 tracking-wider mb-2 flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-amber-400" /> Technologies & Outils Associés
                </h3>
                <div className="p-4 rounded-lg border border-[#30363d] bg-[#161b22]/60">
                  <p className="text-gray-400 italic text-xs leading-relaxed">
                    À enrichir
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'details' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="rounded-lg border border-[#30363d] bg-[#161b22] overflow-hidden">
                <div className="px-4 py-3 bg-[#21262d]/50 border-b border-[#30363d] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-400" />
                    <span className="font-semibold text-white text-xs sm:text-sm">
                      Détails des composants
                    </span>
                  </div>
                </div>
                <div className="p-4 text-xs sm:text-sm text-gray-400 italic leading-relaxed">
                  À enrichir
                </div>
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="p-4 rounded-lg bg-[#161b22] border border-[#30363d] text-gray-400 italic text-xs leading-relaxed">
                À enrichir
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SchemaViewLayout;
