import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  RotateCw, 
  Check, 
  Download, 
  Sliders, 
  Image as ImageIcon,
  Crop as CropIcon,
  Sun,
  Contrast,
  Palette
} from 'lucide-react';

interface ImageEditorProps {
  imageUrl: string;
  onClose: () => void;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({ imageUrl, onClose }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  
  // Filters
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [grayscale, setGrayscale] = useState(0);
  const [sepia, setSepia] = useState(0);
  
  const [activeTab, setActiveTab] = useState<'crop' | 'filters'>('crop');

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getEditedImage = async () => {
    try {
      const image = await createImage(imageUrl);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) return null;

      // Set canvas size to the cropped area size
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;

      // Apply filters to context
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) grayscale(${grayscale}%) sepia(${sepia}%)`;

      // Draw the cropped and rotated image
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);

      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );

      return canvas.toDataURL('image/jpeg');
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const handleDownload = async () => {
    const editedImageUrl = await getEditedImage();
    if (editedImageUrl) {
      const link = document.createElement('a');
      link.download = `bol-ai-edited-${Date.now()}.jpg`;
      link.href = editedImageUrl;
      link.click();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-labelledby="editor-title"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-neon-blue/20 rounded-xl flex items-center justify-center border border-neon-blue/30">
            <ImageIcon className="w-6 h-6 text-neon-blue" aria-hidden="true" />
          </div>
          <div>
            <h2 id="editor-title" className="text-xl font-display font-bold text-white">Bol-AI Editor</h2>
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Refine Your Vision</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="Close editor"
        >
          <X className="w-6 h-6" aria-hidden="true" />
        </button>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 relative bg-black/40">
        <div className="absolute inset-0">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropComplete}
            style={{
              containerStyle: {
                background: 'transparent',
              },
              cropAreaStyle: {
                border: '2px solid rgba(0, 255, 255, 0.5)',
                boxShadow: '0 0 0 9999em rgba(0, 0, 0, 0.85)',
              }
            }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="bg-zinc-900/80 border-t border-white/10 p-6 space-y-6">
        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-black/40 rounded-2xl border border-white/5 w-fit mx-auto">
          <button 
            onClick={() => setActiveTab('crop')}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'crop' ? 'bg-neon-blue text-black' : 'text-white/40 hover:text-white'
            }`}
          >
            <CropIcon className="w-4 h-4" /> Crop & Rotate
          </button>
          <button 
            onClick={() => setActiveTab('filters')}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'filters' ? 'bg-neon-purple text-white' : 'text-white/40 hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4" /> Filters
          </button>
        </div>

        <div className="max-w-2xl mx-auto">
          {activeTab === 'crop' ? (
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Zoom</span>
                    <span className="text-[10px] text-neon-blue font-bold">{Math.round(zoom * 100)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min={1} 
                    max={3} 
                    step={0.1} 
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full accent-neon-blue focus:outline-none focus:ring-2 focus:ring-neon-blue"
                    aria-label="Zoom level"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Rotation</span>
                    <span className="text-[10px] text-neon-blue font-bold">{rotation}°</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <input 
                    type="range" 
                    min={0} 
                    max={360} 
                    value={rotation}
                    onChange={(e) => setRotation(Number(e.target.value))}
                    className="flex-1 accent-neon-blue focus:outline-none focus:ring-2 focus:ring-neon-blue"
                    aria-label="Rotation angle"
                  />
                  <button 
                    onClick={() => setRotation((prev) => (prev + 90) % 360)}
                    className="p-2 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-all focus:outline-none focus:ring-2 focus:ring-white"
                    aria-label="Rotate 90 degrees clockwise"
                  >
                    <RotateCw className="w-4 h-4" aria-hidden="true" />
                  </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold flex items-center gap-2">
                    <Sun className="w-3 h-3" /> Brightness
                  </span>
                  <span className="text-[10px] text-neon-purple font-bold">{brightness}%</span>
                </div>
                <input 
                  type="range" 
                  min={0} 
                  max={200} 
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-full accent-neon-purple focus:outline-none focus:ring-2 focus:ring-neon-purple"
                  aria-label="Brightness level"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold flex items-center gap-2">
                    <Contrast className="w-3 h-3" aria-hidden="true" /> Contrast
                  </span>
                  <span className="text-[10px] text-neon-purple font-bold">{contrast}%</span>
                </div>
                <input 
                  type="range" 
                  min={0} 
                  max={200} 
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="w-full accent-neon-purple focus:outline-none focus:ring-2 focus:ring-neon-purple"
                  aria-label="Contrast level"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold flex items-center gap-2">
                    <Palette className="w-3 h-3" aria-hidden="true" /> Grayscale
                  </span>
                  <span className="text-[10px] text-neon-purple font-bold">{grayscale}%</span>
                </div>
                <input 
                  type="range" 
                  min={0} 
                  max={100} 
                  value={grayscale}
                  onChange={(e) => setGrayscale(Number(e.target.value))}
                  className="w-full accent-neon-purple focus:outline-none focus:ring-2 focus:ring-neon-purple"
                  aria-label="Grayscale level"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold flex items-center gap-2">
                    <Palette className="w-3 h-3" aria-hidden="true" /> Sepia
                  </span>
                  <span className="text-[10px] text-neon-purple font-bold">{sepia}%</span>
                </div>
                <input 
                  type="range" 
                  min={0} 
                  max={100} 
                  value={sepia}
                  onChange={(e) => setSepia(Number(e.target.value))}
                  className="w-full accent-neon-purple focus:outline-none focus:ring-2 focus:ring-neon-purple"
                  aria-label="Sepia level"
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-4 pt-4">
          <button 
            onClick={onClose}
            className="px-8 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={handleDownload}
            className="px-12 py-3 rounded-2xl bg-neon-blue text-black font-bold flex items-center gap-2 hover:bg-white transition-all shadow-[0_0_30px_rgba(0,255,255,0.3)]"
          >
            <Download className="w-5 h-5" /> Download Edited
          </button>
        </div>
      </div>
    </motion.div>
  );
};
