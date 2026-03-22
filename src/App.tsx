/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Image as ImageIcon, Download, Send, Loader2, Info, LayoutGrid, ChevronLeft, ChevronRight } from 'lucide-react';

const EXAMPLE_IMAGES = [
  'v.png', 'v2.png', 'v3.png', 'v4.png', 'v5.png', 'v6.png',
  'v7.png', 'v8.png', 'v9.png', 'v.10.png', 'v11.png', 'v.12.png'
];

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUiMode, setIsUiMode] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const nextGalleryImage = () => setGalleryIndex((prev) => (prev + 1) % EXAMPLE_IMAGES.length);
  const prevGalleryImage = () => setGalleryIndex((prev) => (prev - 1 + EXAMPLE_IMAGES.length) % EXAMPLE_IMAGES.length);

  const handleDownload = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `bol-ai-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error downloading image:", error);
      window.open(url, '_blank'); // Fallback
    }
  };

  const UI_DESIGN_PROMPT_PREFIX = `Analyze the uploaded UI design image carefully and generate a detailed, high-quality prompt that can be used to recreate a similar user interface design. Do not describe the image directly. Instead, create a prompt that includes:
1. The overall theme (e.g. futuristic, minimal, modern, glassmorphism, cyberpunk).
2. The color scheme (mention only color styles like neon blue, dark black background, gradient pink-purple, etc.).
3. Button design details (shape, color, glow, hover effect).
4. Typography and heading style (e.g. gradient text, rounded bold fonts, spacing).
5. Card and component styling (e.g. rounded corners, glowing outlines, shadows, image placeholders).
6. Layout and spacing (e.g. centered design, mobile-first layout, responsive look).
7. Special effects like glassmorphism, neon glow, blurred panels, hover animations.
⚠️ Do not mention any real text, app names, numbers, labels, or actual UI content. Focus only on style and design language.

Style to emulate: `;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);

    const finalPrompt = isUiMode ? `${UI_DESIGN_PROMPT_PREFIX}${prompt}` : prompt;

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: finalPrompt }),
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Raw response:", text);
        throw new Error(`Server Error: ${text.substring(0, 50)}... Make sure the server is running.`);
      }
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to start image generation');
      }

      const taskId = data.task_id;
      if (!taskId) {
        throw new Error('No task ID returned from server.');
      }

      // Poll for status
      let isComplete = false;
      let attempts = 0;
      const maxAttempts = 30; // 30 * 2s = 60 seconds max

      while (!isComplete && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;

        const statusRes = await fetch(`/api/tasks/${taskId}`);
        if (!statusRes.ok) continue;

        let statusData;
        try {
          statusData = await statusRes.json();
        } catch (e) {
          console.error("Failed to parse status response:", e);
          continue;
        }
        
        if (statusData.task_status === "SUCCEED") {
          if (statusData.output_images && statusData.output_images.length > 0) {
            setGeneratedImage(statusData.output_images[0]);
            isComplete = true;
          } else {
            throw new Error("ModelScope succeeded but returned no images.");
          }
        } else if (statusData.task_status === "FAILED") {
          throw new Error("ModelScope failed to generate image.");
        }
      }

      if (!isComplete) {
        throw new Error("Generation Timeout. Please try again.");
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen font-sans selection:bg-neon-blue/30">
      {/* Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-neon-blue/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-neon-purple/10 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5" />
      </div>

      <header className="container mx-auto px-6 py-8 flex justify-between items-center">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-neon-blue to-neon-purple rounded-xl flex items-center justify-center shadow-lg shadow-neon-blue/20">
            <Sparkles className="text-white w-6 h-6" />
          </div>
          <h1 className="text-2xl font-display font-bold tracking-tight">
            BOL-<span className="text-neon-blue">AI</span>
          </h1>
        </motion.div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
          <a href="#" className="hover:text-neon-blue transition-colors">Generator</a>
          <a href="#gallery" className="hover:text-neon-blue transition-colors">Gallery</a>
          <a href="#" className="hover:text-neon-blue transition-colors">Pricing</a>
        </nav>
      </header>

      <main className="container mx-auto px-6 pt-12 pb-24">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-display font-bold mb-6 leading-tight"
          >
            Create Amazing <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-purple">Images</span> With <br /> AI
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-white/50 text-lg max-w-2xl mx-auto"
          >
            Type what you want to see, and our advanced AI will create it for you instantly.
          </motion.p>
        </div>

        {/* Generator Section */}
        <div className="max-w-3xl mx-auto mb-24">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-3xl p-2 flex flex-col md:flex-row gap-2 shadow-2xl shadow-black/50"
          >
            <input 
              type="text" 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={isUiMode ? "Describe the UI style you want to recreate..." : "Describe what you want to see..."}
              className="flex-1 bg-transparent px-6 py-4 outline-none text-white placeholder:text-white/20 font-medium"
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            />
            <button 
              onClick={() => setIsUiMode(!isUiMode)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${isUiMode ? 'bg-neon-blue text-black' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
            >
              <LayoutGrid className="w-4 h-4" />
              UI MODE
            </button>
            <button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className="bg-gradient-to-r from-neon-blue to-neon-purple px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {isGenerating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Generate
                  <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </motion.div>

          {/* Result Display */}
          <AnimatePresence mode="wait">
            {(generatedImage || isGenerating || error) && (
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mt-12"
              >
                <div className="glass rounded-[2rem] overflow-hidden aspect-square md:aspect-video relative group">
                  {isGenerating ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/40 backdrop-blur-md">
                      <div className="relative">
                        <div className="w-16 h-16 border-4 border-neon-blue/20 border-t-neon-blue rounded-full animate-spin" />
                        <Sparkles className="absolute inset-0 m-auto text-neon-blue w-6 h-6 animate-pulse" />
                      </div>
                      <p className="text-neon-blue font-medium tracking-widest uppercase text-xs">Generating Image...</p>
                    </div>
                  ) : error ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center">
                      <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                        <Info className="text-red-500 w-8 h-8" />
                      </div>
                      <p className="text-red-400 font-medium">{error}</p>
                      <button onClick={handleGenerate} className="text-sm text-white/40 hover:text-white underline">Try Again</button>
                    </div>
                  ) : (
                    <>
                      <img 
                        src={generatedImage!} 
                        alt="Generated" 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                        <div className="flex justify-between items-center w-full">
                          <p className="text-sm text-white/70 line-clamp-1 max-w-[70%] italic">"{prompt}"</p>
                          <button 
                            onClick={() => handleDownload(generatedImage!)}
                            className="p-3 bg-white/10 backdrop-blur-md rounded-xl hover:bg-white/20 transition-colors cursor-pointer"
                          >
                            <Download className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Gallery Section */}
        <section id="gallery" className="mt-32">
          <div className="flex items-center gap-4 mb-12">
            <LayoutGrid className="text-neon-purple w-6 h-6" />
            <h3 className="text-3xl font-display font-bold">Gallery</h3>
          </div>
          
          <div className="relative w-full h-[500px] flex items-center justify-center overflow-hidden" style={{ perspective: '1000px' }}>
            {/* Left Button */}
            <button onClick={prevGalleryImage} className="absolute left-4 md:left-12 z-50 p-4 glass rounded-full hover:bg-white/10 transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </button>

            <div className="relative w-[280px] h-[280px] md:w-[400px] md:h-[400px] flex items-center justify-center" style={{ transformStyle: 'preserve-3d' }}>
              <AnimatePresence initial={false}>
                {EXAMPLE_IMAGES.map((img, idx) => {
                  let offset = idx - galleryIndex;
                  if (offset > EXAMPLE_IMAGES.length / 2) offset -= EXAMPLE_IMAGES.length;
                  if (offset < -EXAMPLE_IMAGES.length / 2) offset += EXAMPLE_IMAGES.length;

                  if (Math.abs(offset) > 3) return null;

                  return (
                    <motion.div
                      key={idx}
                      className="absolute w-full h-full rounded-3xl overflow-hidden glass border border-white/10 shadow-2xl"
                      initial={false}
                      animate={{
                        x: offset * (window.innerWidth < 768 ? 120 : 220),
                        scale: 1 - Math.abs(offset) * 0.2,
                        zIndex: 10 - Math.abs(offset),
                        rotateY: offset * -25,
                        opacity: 1 - Math.abs(offset) * 0.25,
                      }}
                      transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                    >
                      <img 
                        src={`/examples/${img}`} 
                        alt={`Gallery ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://picsum.photos/seed/ai${idx}/800/800`;
                        }}
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end p-6">
                        <button 
                          onClick={() => handleDownload(`/examples/${img}`)}
                          className="p-3 bg-white/20 backdrop-blur-md rounded-xl hover:bg-white/30 transition-colors ml-auto"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Right Button */}
            <button onClick={nextGalleryImage} className="absolute right-4 md:right-12 z-50 p-4 glass rounded-full hover:bg-white/10 transition-colors">
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
          
          <div className="mt-12 p-8 glass rounded-3xl border-dashed border-white/10 text-center">
            <p className="text-white/40 text-sm mb-4">
              To add your own images, place them in the <code className="text-neon-blue">public/examples/</code> folder with names like <code className="text-neon-blue">v.png</code>, <code className="text-neon-blue">v2.png</code>, etc.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 py-12">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3 opacity-50">
            <Sparkles className="w-5 h-5" />
            <span className="font-display font-bold">BOL-AI</span>
          </div>
          <p className="text-white/30 text-sm">© 2026 Bol-Ai IMG Generator. All rights reserved.</p>
          <div className="flex gap-6 text-white/30 text-sm">
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
            <a href="#" className="hover:text-white transition-colors">Discord</a>
            <a href="#" className="hover:text-white transition-colors">API</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
