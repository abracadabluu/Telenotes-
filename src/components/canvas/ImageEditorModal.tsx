import React, { useState, useRef, useEffect } from 'react';
import { RotateCw, FlipHorizontal, FlipVertical, Sliders, PenTool, Check, X, Undo, Sparkles } from 'lucide-react';

interface ImageEditorModalProps {
  imageUrl: string;
  onSave: (editedImageUrl: string) => void;
  onClose: () => void;
}

export const ImageEditorModal: React.FC<ImageEditorModalProps> = ({ imageUrl, onSave, onClose }) => {
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);

  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [filterMode, setFilterMode] = useState<'normal' | 'sepia' | 'grayscale' | 'vintage' | 'teal'>('normal');

  const [activeTab, setActiveTab] = useState<'adjust' | 'draw' | 'filters'>('adjust');
  const [drawColor, setDrawColor] = useState('#38bdf8');
  const [brushSize, setBrushSize] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingLayerRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => {
      imgRef.current = img;
      renderImage();
    };
  }, [imageUrl]);

  useEffect(() => {
    renderImage();
  }, [rotation, flipH, flipV, brightness, contrast, saturation, filterMode]);

  const renderImage = () => {
    if (!canvasRef.current || !imgRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imgRef.current;
    const isRotatedQuarter = rotation % 180 !== 0;

    canvas.width = isRotatedQuarter ? img.height : img.width;
    canvas.height = isRotatedQuarter ? img.width : img.height;

    if (drawingLayerRef.current) {
      if (drawingLayerRef.current.width !== canvas.width || drawingLayerRef.current.height !== canvas.height) {
        drawingLayerRef.current.width = canvas.width;
        drawingLayerRef.current.height = canvas.height;
      }
    }

    ctx.save();

    // Filters
    let filterStr = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    if (filterMode === 'sepia') filterStr += ' sepia(70%)';
    if (filterMode === 'grayscale') filterStr += ' grayscale(100%)';
    if (filterMode === 'vintage') filterStr += ' sepia(40%) contrast(115%) brightness(95%)';
    if (filterMode === 'teal') filterStr += ' hue-rotate(160deg) saturate(120%)';

    ctx.filter = filterStr;

    // Transforms
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.restore();

    // Composite drawing overlay if exists
    if (drawingLayerRef.current) {
      ctx.drawImage(drawingLayerRef.current, 0, 0);
    }
  };

  // Drawing event handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTab !== 'draw' || !drawingLayerRef.current) return;
    setIsDrawing(true);
    const rect = drawingLayerRef.current.getBoundingClientRect();
    const scaleX = drawingLayerRef.current.width / rect.width;
    const scaleY = drawingLayerRef.current.height / rect.height;

    const ctx = drawingLayerRef.current.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = brushSize * scaleX;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || activeTab !== 'draw' || !drawingLayerRef.current) return;
    const rect = drawingLayerRef.current.getBoundingClientRect();
    const scaleX = drawingLayerRef.current.width / rect.width;
    const scaleY = drawingLayerRef.current.height / rect.height;

    const ctx = drawingLayerRef.current.getContext('2d');
    if (!ctx) return;
    ctx.lineTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
    ctx.stroke();

    // render to main canvas
    renderImage();
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const clearDrawing = () => {
    if (!drawingLayerRef.current) return;
    const ctx = drawingLayerRef.current.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, drawingLayerRef.current.width, drawingLayerRef.current.height);
      renderImage();
    }
  };

  const handleSave = () => {
    if (!canvasRef.current) return;
    const editedUrl = canvasRef.current.toDataURL('image/jpeg', 0.92);
    onSave(editedUrl);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-between">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
        <button
          type="button"
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors"
        >
          <X size={20} />
        </button>
        <span className="text-sm font-semibold text-slate-100">Photo Studio</span>
        <button
          type="button"
          onClick={handleSave}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-white rounded-lg text-xs font-semibold shadow-md active:scale-95 transition-all"
        >
          <Check size={16} />
          <span>Done</span>
        </button>
      </div>

      {/* Canvas Viewport */}
      <div className="flex-1 relative flex items-center justify-center p-4 overflow-hidden">
        <div className="relative max-h-[55vh] max-w-[90vw] flex items-center justify-center rounded-xl overflow-hidden shadow-2xl border border-slate-800">
          <canvas
            ref={canvasRef}
            className="max-h-[55vh] max-w-[90vw] object-contain block"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
          <canvas ref={drawingLayerRef} className="hidden" />
        </div>
      </div>

      {/* Editor Controls & Tools */}
      <div className="bg-slate-900/95 border-t border-slate-800 p-4 space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-center gap-2 p-1 bg-slate-950/60 rounded-xl max-w-sm mx-auto">
          <button
            type="button"
            onClick={() => setActiveTab('adjust')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'adjust' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders size={14} />
            <span>Adjust</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('filters')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'filters' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles size={14} />
            <span>Filters</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('draw')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'draw' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PenTool size={14} />
            <span>Annotate</span>
          </button>
        </div>

        {/* Tab Subpanels */}
        {activeTab === 'adjust' && (
          <div className="space-y-3 max-w-md mx-auto">
            {/* Quick Rotate & Flip */}
            <div className="flex items-center justify-center gap-4 py-1">
              <button
                type="button"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 rounded-lg"
              >
                <RotateCw size={14} />
                <span>Rotate 90°</span>
              </button>
              <button
                type="button"
                onClick={() => setFlipH((f) => !f)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs ${
                  flipH ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
              >
                <FlipHorizontal size={14} />
                <span>Flip H</span>
              </button>
              <button
                type="button"
                onClick={() => setFlipV((f) => !f)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs ${
                  flipV ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
              >
                <FlipVertical size={14} />
                <span>Flip V</span>
              </button>
            </div>

            {/* Sliders */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Brightness</span>
                  <span>{brightness}%</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="160"
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-full accent-sky-500"
                />
              </div>
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Contrast</span>
                  <span>{contrast}%</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="160"
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="w-full accent-sky-500"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'filters' && (
          <div className="flex items-center justify-center gap-2 overflow-x-auto py-1">
            {[
              { id: 'normal', name: 'Original' },
              { id: 'vintage', name: 'Vintage' },
              { id: 'sepia', name: 'Sepia Warm' },
              { id: 'grayscale', name: 'Noir B&W' },
              { id: 'teal', name: 'Cyber Teal' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterMode(f.id as typeof filterMode)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  filterMode === f.id
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {f.name}
              </button>
            ))}
          </div>
        )}

        {activeTab === 'draw' && (
          <div className="flex items-center justify-between max-w-md mx-auto text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Color:</span>
              {['#38bdf8', '#ef4444', '#10b981', '#f59e0b', '#ffffff', '#000000'].map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setDrawColor(color)}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                    drawColor === color ? 'scale-110 border-white' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            <div className="flex items-center gap-3">
              <input
                type="range"
                min="2"
                max="16"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-20 accent-sky-500"
              />
              <button
                type="button"
                onClick={clearDrawing}
                className="flex items-center gap-1 text-slate-400 hover:text-rose-400 transition-colors"
              >
                <Undo size={14} />
                <span>Clear</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
