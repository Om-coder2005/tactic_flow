import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Activity, Users, Video } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);

  return (
    <div className="min-h-screen bg-[#fffdf7] text-retro-ink font-sans selection:bg-[#ffd400] selection:text-black">
      {/* Texture Overlay */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/clean-gray-paper.png')] mix-blend-multiply z-0" />
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] mix-blend-multiply z-0" />

      {/* Header */}
      <header className="relative z-10 p-6 flex justify-between items-center border-b-[3px] border-black bg-[#fffdf7]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#ffd400] border-[3px] border-black flex items-center justify-center transform -rotate-3 shadow-[4px_4px_0_#121212]">
            <span className="text-black font-black text-xl italic tracking-tighter">TF</span>
          </div>
          <h1 className="text-xl font-black font-display tracking-tighter">
            TACTIC<span className="text-retro-mustard">FLOW</span>
          </h1>
        </div>
        <div>
          {isAuthenticated ? (
            <button 
              onClick={() => navigate('/boards')}
              className="px-6 py-2 bg-black text-white font-black uppercase text-sm rounded-lg border-2 border-black hover:bg-transparent hover:text-black transition-colors"
            >
              Dashboard
            </button>
          ) : (
            <button 
              onClick={() => navigate('/auth')}
              className="px-6 py-2 bg-[#ffd400] text-black font-black uppercase text-sm rounded-lg border-[3px] border-black shadow-[4px_4px_0_#121212] hover:translate-y-1 hover:shadow-[0_0_0_#121212] transition-all"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 px-6 py-24 md:py-32 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
        <div className="flex-1 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block px-4 py-2 border-[3px] border-black rounded-full font-bold text-sm uppercase bg-white shadow-[4px_4px_0_#121212] rotate-2"
          >
            v1.0 Now Live
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-[0.9]"
          >
            The Modern <br />
            <span className="text-retro-mustard drop-shadow-[4px_4px_0_#121212]">Tactical</span> <br />
            Whiteboard
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl font-medium max-w-xl text-surface-700"
          >
            Designed for elite coaches, analysts, and content creators. Draw tactics, generate AI insights, and present with power.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-4 pt-4"
          >
            <button 
              onClick={() => navigate('/boards')}
              className="flex items-center gap-2 px-8 py-4 bg-retro-burgundy text-white font-black uppercase tracking-wide text-lg rounded-xl border-[3px] border-black shadow-[6px_6px_0_#121212] hover:translate-y-1 hover:shadow-[0_0_0_#121212] transition-all"
            >
              Start Drafting <ArrowRight className="w-5 h-5" />
            </button>
            <a 
              href="https://github.com/Om-coder2005/tactic_flow" 
              target="_blank"
              rel="noreferrer"
              className="flex items-center px-8 py-4 bg-white text-black font-black uppercase tracking-wide text-lg rounded-xl border-[3px] border-black shadow-[6px_6px_0_#121212] hover:translate-y-1 hover:shadow-[0_0_0_#121212] transition-all"
            >
              View Source
            </a>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
          animate={{ opacity: 1, scale: 1, rotate: 2 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
          className="flex-1 w-full max-w-2xl"
        >
          {/* Faux Interface Mockup */}
          <div className="aspect-[4/3] w-full bg-grass-600 rounded-3xl border-[4px] border-black shadow-[12px_12px_0_#121212] relative overflow-hidden flex flex-col">
            <div className="h-12 border-b-[4px] border-black bg-[#fffdf7] flex items-center px-4 gap-2">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-black" />
                <div className="w-3 h-3 rounded-full bg-yellow-400 border-2 border-black" />
                <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-black" />
              </div>
              <div className="mx-auto px-4 py-1 border-2 border-black rounded-lg text-[10px] font-black uppercase bg-white">
                Project_Final.tactics
              </div>
            </div>
            
            <div className="flex-1 relative bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-90 p-8 flex items-center justify-center">
              {/* Pitch mockup lines */}
              <div className="absolute inset-4 border-4 border-white/40 rounded-xl" />
              <div className="absolute left-1/2 top-4 bottom-4 w-1 bg-white/40 -translate-x-1/2" />
              <div className="absolute left-1/2 top-1/2 w-32 h-32 border-4 border-white/40 rounded-full -translate-x-1/2 -translate-y-1/2" />
              
              {/* Fake players */}
              <div className="absolute top-[30%] left-[20%] w-8 h-8 rounded-full bg-retro-blue border-[3px] border-black shadow-[4px_4px_0_#121212] flex items-center justify-center text-white font-bold">9</div>
              <div className="absolute top-[40%] right-[30%] w-8 h-8 rounded-full bg-retro-burgundy border-[3px] border-black shadow-[4px_4px_0_#121212] flex items-center justify-center text-white font-bold">10</div>
              <div className="absolute top-[60%] left-[40%] w-8 h-8 rounded-full bg-retro-blue border-[3px] border-black shadow-[4px_4px_0_#121212] flex items-center justify-center text-white font-bold">7</div>
              
              {/* Fake arrow */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M25 35 Q 50 20 68 38" fill="none" stroke="white" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#arrow)" />
                <defs>
                  <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="white" />
                  </marker>
                </defs>
              </svg>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Features Section */}
      <section className="border-t-[4px] border-black bg-white py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: 'AI Insights', icon: Activity, desc: 'Generate coaching, analytical, and creator insights instantly using multi-frame spatial analysis.' },
              { title: 'Full Export', icon: Video, desc: 'Export high-resolution images or animated sequences of your tactics to share on social media.' },
              { title: 'Cloud Sync', icon: Users, desc: 'Save your projects securely to the cloud and access them from any device, anywhere.' }
            ].map((f, i) => (
              <div key={i} className="p-8 border-[3px] border-black rounded-2xl bg-[#fffdf7] shadow-[8px_8px_0_#121212] hover:-translate-y-2 hover:shadow-[12px_12px_0_#121212] transition-all">
                <div className="w-14 h-14 bg-[#ffd400] border-[3px] border-black rounded-xl mb-6 flex items-center justify-center shadow-[4px_4px_0_#121212]">
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black uppercase mb-3">{f.title}</h3>
                <p className="text-surface-600 font-medium leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
