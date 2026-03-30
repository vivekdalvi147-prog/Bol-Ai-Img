import * as React from 'react';
import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { motion, AnimatePresence } from 'motion/react';
import { Settings as SettingsIcon, ToggleLeft, ToggleRight, Activity, ShieldAlert, UserCircle, ShieldCheck, LogOut, AlertTriangle, Loader2, Sparkles } from 'lucide-react';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import './index.css';

// Admin Panel Component
function AdminPanel({ maintenanceMode, isEnhanceGlobal, isTxtToImgGlobal, isImgToImgGlobal, userLimit, onUpdateSettings }: any) {
  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto py-12 px-6"
    >
      <div className="flex items-center gap-4 mb-12">
        <div className="w-16 h-16 bg-neon-purple/20 rounded-2xl flex items-center justify-center border border-neon-purple/30 shadow-[0_0_30px_rgba(176,38,255,0.2)]">
          <SettingsIcon className="w-8 h-8 text-neon-purple" />
        </div>
        <div>
          <h2 className="text-4xl font-display font-bold text-white">Admin Control Center</h2>
          <p className="text-neon-purple font-bold tracking-widest uppercase text-[10px] mt-1">System Override & Governance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Maintenance Mode */}
        <div className="glass p-8 rounded-[2rem] border border-white/10 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-5 h-5 text-neon-blue" />
            <h3 className="text-xl font-bold text-white">System Status</h3>
          </div>
          
          <div className="space-y-4">
            {[
              { label: 'Operational', value: 0, desc: 'All systems go. Normal operation.' },
              { label: 'Maintenance', value: 1, desc: 'Full lockdown. Generation disabled.' },
              { label: 'Soft Maintenance', value: 2, desc: 'Warnings active but systems open.' }
            ].map((mode) => (
              <button
                key={mode.value}
                onClick={() => onUpdateSettings({ maintenanceMode: mode.value })}
                className={`w-full p-4 rounded-2xl border transition-all text-left group ${
                  maintenanceMode === mode.value 
                    ? 'bg-neon-blue/10 border-neon-blue/50 shadow-[0_0_20px_rgba(0,255,255,0.1)]' 
                    : 'bg-white/5 border-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-bold ${maintenanceMode === mode.value ? 'text-neon-blue' : 'text-white/70'}`}>{mode.label}</span>
                  {maintenanceMode === mode.value && <div className="w-2 h-2 rounded-full bg-neon-blue animate-pulse" />}
                </div>
                <p className="text-[10px] text-white/40 leading-relaxed">{mode.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Feature Toggles */}
        <div className="glass p-8 rounded-[2rem] border border-white/10 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <ShieldAlert className="w-5 h-5 text-neon-purple" />
            <h3 className="text-xl font-bold text-white">Feature Governance</h3>
          </div>

          <div className="space-y-4">
            {[
              { label: 'Bol-AI Enhance', key: 'isEnhanceGlobal', current: isEnhanceGlobal },
              { label: 'Text-to-Image', key: 'isTxtToImgGlobal', current: isTxtToImgGlobal },
              { label: 'Image-to-Image', key: 'isImgToImgGlobal', current: isImgToImgGlobal }
            ].map((feature) => (
              <div key={feature.key} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                <div>
                  <p className="text-sm font-bold text-white">{feature.label}</p>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest">{feature.current ? 'Active' : 'Disabled'}</p>
                </div>
                <button 
                  onClick={() => onUpdateSettings({ [feature.key]: !feature.current })}
                  className={`p-2 rounded-xl transition-all ${feature.current ? 'text-neon-blue bg-neon-blue/10' : 'text-white/20 bg-white/5'}`}
                >
                  {feature.current ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* User Limits */}
        <div className="glass p-8 rounded-[2rem] border border-white/10 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <UserCircle className="w-5 h-5 text-neon-blue" />
            <h3 className="text-xl font-bold text-white">User Limits</h3>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
              <p className="text-sm font-bold text-white mb-2">Daily Generation Limit</p>
              <div className="flex items-center gap-4">
                <input 
                  type="number" 
                  value={userLimit}
                  onChange={(e) => onUpdateSettings({ userLimit: parseInt(e.target.value) || 1 })}
                  className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white w-24 outline-none focus:border-neon-blue transition-colors"
                />
                <p className="text-[10px] text-white/40 uppercase tracking-widest">Generations per user per day</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 p-8 glass rounded-[2rem] border border-red-500/20 bg-red-500/5">
        <div className="flex items-center gap-3 mb-4">
          <ShieldCheck className="w-6 h-6 text-red-500" />
          <h3 className="text-xl font-bold text-white">Security Protocol</h3>
        </div>
        <p className="text-sm text-white/60 leading-relaxed">
          Changes made here take effect globally and immediately. Ensure all system overrides are verified before deployment.
        </p>
      </div>
    </motion.section>
  );
}

class AdminErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    (this as any).state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("AdminErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if ((this as any).state.hasError) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-red-500/50 rounded-2xl p-8 max-w-md w-full text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
            <p className="text-zinc-400 mb-6">
              {(this as any).state.error?.message || "An unexpected error occurred."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return (this as any).props.children;
  }
}

function AdminApp() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(0);
  const [isEnhanceGlobal, setIsEnhanceGlobal] = useState(true);
  const [isTxtToImgGlobal, setIsTxtToImgGlobal] = useState(true);
  const [isImgToImgGlobal, setIsImgToImgGlobal] = useState(true);
  const [userLimit, setUserLimit] = useState(10);
  const [showToast, setShowToast] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        const isAdminUser = userData?.role === 'admin' || user.email === 'vivekdalvi147@gmail.com' || user.uid === '2cwK3E4SSvezZRop3VE14lbfJdc2';
        setIsAdmin(isAdminUser);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    const unsubscribe = onSnapshot(doc(db, 'settings', 'general'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setMaintenanceMode(data.maintenanceMode ?? 0);
        setIsEnhanceGlobal(data.isEnhanceGlobal ?? true);
        setIsTxtToImgGlobal(data.isTxtToImgGlobal ?? true);
        setIsImgToImgGlobal(data.isImgToImgGlobal ?? true);
        setUserLimit(data.userLimit ?? 10);
      }
    });

    return () => unsubscribe();
  }, [isAdmin]);

  const handleUpdateSettings = async (newSettings: any) => {
    try {
      await setDoc(doc(db, 'settings', 'general'), newSettings, { merge: true });
      setShowToast("Settings updated successfully!");
      setTimeout(() => setShowToast(null), 3000);
    } catch (e) {
      console.error("Failed to update settings:", e);
      setShowToast("Failed to update settings.");
      setTimeout(() => setShowToast(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-neon-blue animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center border border-red-500/20 mb-8">
          <ShieldAlert className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-3xl font-display font-bold text-white mb-4 text-center">Access Restricted</h1>
        <p className="text-white/40 text-center max-w-md mb-8">
          This sector is reserved for system administrators. Unauthorized access attempts are logged.
        </p>
        <button 
          onClick={() => window.location.href = '/'}
          className="px-8 py-3 bg-white/5 border border-white/10 rounded-2xl text-white font-bold hover:bg-white/10 transition-all"
        >
          Return to Base
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-neon-blue/30">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.location.href = '/'}>
            <div className="w-10 h-10 bg-gradient-to-br from-neon-blue to-neon-purple rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(0,255,255,0.3)] group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-display font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">Bol-AI</span>
          </div>
          
          <button 
            onClick={() => signOut(auth).then(() => window.location.href = '/')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Logout</span>
          </button>
        </div>
      </nav>

      <main className="pt-24 pb-12">
        <AdminPanel 
          maintenanceMode={maintenanceMode}
          isEnhanceGlobal={isEnhanceGlobal}
          isTxtToImgGlobal={isTxtToImgGlobal}
          isImgToImgGlobal={isImgToImgGlobal}
          userLimit={userLimit}
          onUpdateSettings={handleUpdateSettings}
        />
      </main>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100]"
          >
            <div className="glass px-6 py-3 rounded-2xl border border-neon-blue/30 flex items-center gap-3 shadow-[0_0_30px_rgba(0,255,255,0.2)]">
              <div className="w-2 h-2 rounded-full bg-neon-blue animate-pulse" />
              <span className="text-sm font-bold text-white tracking-wide">{showToast}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <AdminErrorBoundary>
      <AdminApp />
    </AdminErrorBoundary>
  );
}
