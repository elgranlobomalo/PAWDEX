import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Image as ImageIcon, Activity, MessageSquare, Plus, ArrowLeft, Scale, Mic } from 'lucide-react';

export const HowToScreen = ({ onBack }: { onBack: () => void }) => {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const roadmapItems = [
    {
      id: 1,
      title: 'INITIALIZE SPECIMEN',
      description: 'Click the ADD NEW SPECIMEN button to register a new subject.',
      expandedDetails: 'Use the registration form to record key attributes such as breed, date of birth, age, and initial weight. You can also generate an AI avatar for the specimen directly within the registration modal using a custom prompt.',
      icon: <Plus className="text-white" size={24} />,
      color: 'bg-blue-500',
    },
    {
      id: 2,
      title: 'MONITOR & EDIT',
      description: 'The dashboard displays real-time health metrics. Reorder your specimens or edit their details.',
      expandedDetails: 'Monitor animated stat bars for Metabolism, Stress Level, Brain Activity, and System Load. Click the yellow pencil icon on the subject\'s avatar to open the editor and update their baseline profile anytime. Reorder subjects by dragging the grip icon.',
      icon: <Activity className="text-white" size={24} />,
      color: 'bg-red-500',
    },
    {
      id: 3,
      title: 'WEIGHT TRACKING',
      description: 'Track specimen weight over time with the dynamic chart. Toggle between KG and LB.',
      expandedDetails: 'Select KG or LB using the toggle button next to the weight input. Enter the value and click ADD. The chart automatically updates to display the new reading. If a mistake is made, use UNDO to remove the last entry.',
      icon: <Scale className="text-white" size={24} />,
      color: 'bg-orange-500',
    },
    {
      id: 4,
      title: 'MEDICAL LOGS',
      description: 'Switch to the LOGS tab to maintain an ongoing archive of documents.',
      expandedDetails: 'Upload medical documents, prescription records, and lab results. Each log entry can store important clinical data. Click on any record to view a detailed full-screen popup of the scanned data. You can also add schedule entries on the main dashboard.',
      icon: <FileText className="text-white" size={24} />,
      color: 'bg-green-500',
    },
    {
      id: 5,
      title: 'VISUAL ARCHIVE',
      description: 'Navigate to the VAULT tab to store visual data and photographic evidence.',
      expandedDetails: 'Photos can be uploaded to track physical changes or document interesting behaviors. These uploads are maintained in a 2-column tactical grid. Click thumbnails for full-resolution previews in the visualizer.',
      icon: <ImageIcon className="text-white" size={24} />,
      color: 'bg-purple-500',
    },
    {
      id: 6,
      title: 'AI & VOICE ASSIST',
      description: 'Use the FAQ button for AI chat, or the microphone for voice controls.',
      expandedDetails: 'Voice control allows hands-free interface operations—just click the microphone icon and speak your command. The AI assistant tab provides real-time expert guidance on operating the Pawdex, analyzing data, and troubleshooting.',
      icon: <Mic className="text-white" size={24} />,
      color: 'bg-yellow-500',
    }
  ];

  return (
    <motion.div
      key="howtoscreen"
      initial={{ scale: 1.1, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      className="absolute inset-[12px] z-40 bg-[#1a1a1a] flex flex-col p-6 overflow-hidden border-[8px] border-[#d6d3d1] shadow-[inset_0_0_50px_rgba(0,0,0,1)]"
    >
      <div className="flex items-center justify-between mb-8 pb-4 border-b-4 border-[#333]">
        <h1 className="text-3xl md:text-5xl font-black text-[#fbbf24] uppercase tracking-widest italic">
          OPERATING MANUAL
        </h1>
        <button
          onClick={onBack}
          className="h-12 px-4 bg-[#ef4444] border-4 border-black text-white font-black text-lg uppercase shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.2)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <ArrowLeft size={20} /> Back
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar relative">
        {/* Animated Background Grid */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

        <div className="max-w-3xl mx-auto flex flex-col gap-8 relative z-10 py-8">
          {/* Connecting Line */}
          <div className="absolute left-[38px] top-12 bottom-12 w-2 bg-[#333] shadow-[inset_0_0_10px_rgba(0,0,0,1)] z-0 rounded-full"></div>

          {roadmapItems.map((item, index) => {
            const isExpanded = expandedId === item.id;
            return (
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.15 + 0.2, type: 'spring', bounce: 0.4 }}
                key={item.id}
                className="flex gap-6 relative z-10 group cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
              >
                <div className={`w-20 h-20 shrink-0 ${item.color} border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] group-hover:scale-110 transition-transform duration-300 z-10 rotate-3 group-hover:rotate-0`}>
                  {item.icon}
                </div>
                <motion.div 
                  layout
                  className="flex-1 bg-[#2e2e2e] border-4 border-black p-4 md:p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] group-hover:-translate-y-2 group-hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transition-all flex flex-col justify-center overflow-hidden origin-top"
                >
                  <h2 className="text-xl md:text-2xl font-black text-white uppercase mb-2 flex items-center gap-2">
                    <span className="text-[#a8a29e] text-sm">PHASE {"0" + item.id} /</span> {item.title}
                  </h2>
                  <p className="text-[#a8a29e] font-bold text-sm md:text-base leading-relaxed">
                    {item.description}
                  </p>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                      >
                        <div className="pt-4 border-t-2 border-[#444]">
                          <p className="text-white font-medium text-sm md:text-base leading-relaxed">
                            {item.expandedDetails}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            );
          })}
          
          <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: roadmapItems.length * 0.15 + 0.4 }}
              className="mt-8 text-center p-8 bg-[#fbbf24] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform -rotate-1 cursor-pointer flex flex-col items-center justify-center group"
              onClick={onBack}
          >
            <h3 className="text-2xl font-black text-black uppercase group-hover:scale-110 transition-transform">SYSTEM READY</h3>
            <p className="text-black font-bold mt-2">You are now fully certified to operate the Pawdex. Click to acknowledge.</p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};
