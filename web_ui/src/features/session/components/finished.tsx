'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Volume2, Heart, Download, Share2 } from 'lucide-react';
import SpeechDeliveryTab from './tabs/SpeechDeliveryTab';
import TranscriptAnalysisTab from './tabs/TranscriptAnalysisTab';
import BiometricsTab from './tabs/BiometricsTab';
import type { FinishedState } from '@/lib/session';

const FinishedPage = ({ state }: { state: FinishedState }) => {
  const [activeTab, setActiveTab] = useState<'delivery' | 'transcript' | 'biometrics'>('delivery');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Analysis Results</h1>
            <p className="text-slate-600">Comprehensive speech and delivery analysis</p>
          </motion.div>
        </div>
      </header>

      {/* Tabs Navigation */}
      <div className="sticky top-20 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8">
            {[
              { id: 'delivery', label: 'Speech Delivery', icon: Mic },
              { id: 'transcript', label: 'Transcript Analysis', icon: Volume2 },
              { id: 'biometrics', label: 'Health & Behavior', icon: Heart },
            ].map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-2 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'delivery' && <SpeechDeliveryTab key="delivery" state={state} />}
          {activeTab === 'transcript' && <TranscriptAnalysisTab key="transcript" state={state} />}
          {activeTab === 'biometrics' && <BiometricsTab key="biometrics" state={state} />}
        </AnimatePresence>
      </div>

      {/* Footer Action Buttons */}
      <div className="max-w-7xl mx-auto p-6 flex gap-4 justify-end">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-900 font-semibold transition-colors"
        >
          <Share2 className="w-4 h-4" />
          Share Results
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
        >
          <Download className="w-4 h-4" />
          Export Report
        </motion.button>
      </div>
    </div>
  );
};

export default FinishedPage;