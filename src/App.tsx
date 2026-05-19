/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { initialPets, Pet, RecordItem } from './data';
import { Activity, Beaker, FileText, Plus, Settings, Upload, ActivitySquare, Pill, Image as ImageIcon, Sparkles, HelpCircle, Send, GripVertical, Heart, Zap, Flame, Brain, AlertTriangle, Cpu, BookOpen, Minimize2, Maximize2, Mic, MicOff, Pencil } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { GoogleGenAI } from '@google/genai';
import { HowToScreen } from './HowToScreen';
import { GlobalGallery } from './GlobalGallery';
import { AlertsScreen, AlertItem } from './AlertsScreen';

const PixelQuestion = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 7 9" fill="currentColor" style={{ shapeRendering: 'crispEdges' }}>
     <rect x="2" y="0" width="3" height="1" />
     <rect x="1" y="1" width="1" height="2" />
     <rect x="5" y="1" width="1" height="3" />
     <rect x="4" y="4" width="1" height="1" />
     <rect x="3" y="5" width="1" height="1" />
     <rect x="3" y="7" width="1" height="2" />
  </svg>
);

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'app' | 'howTo' | 'globalGallery' | 'alerts'>('home');
  const [pets, setPets] = useState<Pet[]>(initialPets);
  const [alerts, setAlerts] = useState<AlertItem[]>([
    { id: '1', type: 'VACCINATION', time: '2026-06-15 10:00', description: 'Yearly Booster', petId: initialPets[0]?.id || '' },
    { id: '2', type: 'WALK TIME', time: 'DAILY 17:00', description: 'Evening Park Walk', petId: initialPets[1]?.id || '' },
  ]);
  const [activeToast, setActiveToast] = useState<AlertItem | null>(null);
  const [isToastExpanded, setIsToastExpanded] = useState(false);

  React.useEffect(() => {
    // Mock Calendar API integration for background push notifications
    const mockGoogleCalendarPush = async (alert: AlertItem) => {
      console.log(`[MOCK GOOGLE CALENDAR API] Synced alert ${alert.id} to Google Calendar.`);
      console.log(`[MOCK GOOGLE CALENDAR API] Registered background event hook for: ${alert.time}`);
      
      // Simulate real background push notification if permitted
      if ('Notification' in window && Notification.permission === 'granted') {
        // We simulate a background background push triggering after 8 seconds
        setTimeout(() => {
           const petName = pets.find(p => p.id === alert.petId)?.name || 'UNKNOWN';
           new Notification(`CALENDAR SYNC: ${alert.type}`, {
             body: `[${petName}] ${alert.description}. (Mock BG Push)`,
             icon: pets.find(p => p.id === alert.petId)?.avatarUrl || '/favicon.ico'
           });
        }, 8000);
      }
    };

    // Simulate an alert firing after 2.5 seconds
    if (alerts.length > 0 && !activeToast) {
      const timer = setTimeout(() => {
        const theAlert = alerts[0];
        setActiveToast(theAlert);
        setIsToastExpanded(false); // start minimized
        
        // Trigger native PWA Push Notification if permitted
        if ('Notification' in window && Notification.permission === 'granted') {
          const petName = pets.find(p => p.id === theAlert.petId)?.name || 'UNKNOWN';
          new Notification(`PAWDEX ALERT: ${theAlert.type}`, {
            body: `[${petName}] ${theAlert.description || 'Action required.'}`,
            icon: pets.find(p => p.id === theAlert.petId)?.avatarUrl || '/favicon.ico'
          });
        }

        // Trigger our mock Calendar Push Protocol
        mockGoogleCalendarPush(theAlert);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [alerts, activeToast, pets]);

  const [activePet, setActivePet] = useState<Pet | null>(pets.length > 0 ? pets[0] : null);
  const [activeTab, setActiveTab] = useState<'status' | 'medical' | 'gallery'>('status');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPetId, setEditingPetId] = useState<string | null>(null);

  const openAddModal = () => {
    setEditingPetId(null);
    setNewPetName('');
    setNewPetType('CAT');
    setNewPetBreed('');
    setNewPetColor('');
    setNewPetDob('');
    setNewPetAge('');
    setNewPetWeight('');
    setNewPetGender('MALE');
    setGeneratedAvatar(null);
    setAvatarPrompt('');
    setIsModalOpen(true);
  };

  const openEditModal = () => {
    if (!activePet) return;
    setEditingPetId(activePet.id);
    setNewPetName(activePet.name);
    setNewPetType(activePet.type.toUpperCase());
    setNewPetBreed(activePet.breed || '');
    setNewPetColor(activePet.color || '');
    setNewPetDob(activePet.dob || '');
    setNewPetAge(activePet.age.replace(' years', ''));
    setNewPetGender(activePet.gender.toUpperCase());
    setNewPetWeight(activePet.weight.length > 0 ? activePet.weight[activePet.weight.length - 1].toString() : '');
    setGeneratedAvatar(activePet.avatarUrl !== '/favicon.ico' ? activePet.avatarUrl : null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPetId(null);
    setGeneratedAvatar(null);
  };

  const [isUploadDocModalOpen, setIsUploadDocModalOpen] = useState(false);
  const [isUploadPhotoModalOpen, setIsUploadPhotoModalOpen] = useState(false);
  const [avatarPrompt, setAvatarPrompt] = useState("");
  const [referenceImage, setReferenceImage] = useState<{ mimeType: string, data: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAvatar, setGeneratedAvatar] = useState<string | null>(null);
  const [previewMedia, setPreviewMedia] = useState<{ type: 'record', record: RecordItem } | { type: 'photo', photo: { id: string, url: string, date: string } } | null>(null);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'model', text: string}[]>([
    { role: 'model', text: 'GREETINGS. I AM PAWDEX FAQ BOT. HOW MAY I ASSIST YOUR SPECIMENS TODAY?' }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const [newPetName, setNewPetName] = useState("");
  const [newPetType, setNewPetType] = useState("CAT");
  const [newPetBreed, setNewPetBreed] = useState("");
  const [newPetColor, setNewPetColor] = useState("");
  const [newPetDob, setNewPetDob] = useState("");
  const [newPetAge, setNewPetAge] = useState("");
  const [newPetGender, setNewPetGender] = useState("MALE");
  const [newPetWeight, setNewPetWeight] = useState("");

  const startListening = () => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Search by voice is not supported in this browser.");
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setChatInput((prev) => prev ? prev + ' ' + transcript : transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      if (event.error === 'not-allowed') {
        alert("Microphone access was denied. Please allow it in the browser settings and try again.");
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const [newWeightInput, setNewWeightInput] = useState("");
  const [weightUnit, setWeightUnit] = useState<'KG' | 'LB'>('KG');

  const handleAddWeight = () => {
    if (!activePet || !newWeightInput || isNaN(Number(newWeightInput))) return;
    let weightVal = Number(newWeightInput);
    if (weightUnit === 'LB') {
       weightVal = Number((weightVal * 0.453592).toFixed(1));
    }
    const updatedPets = pets.map(p => 
      p.id === activePet.id ? { ...p, weight: [...p.weight, weightVal] } : p
    );
    setPets(updatedPets);
    setActivePet(updatedPets.find(p => p.id === activePet.id) || null);
    setNewWeightInput('');
  };

  const handleDeleteLastWeight = () => {
    if (!activePet || activePet.weight.length === 0) return;
    const updatedPets = pets.map(p => 
      p.id === activePet.id ? { ...p, weight: p.weight.slice(0, -1) } : p
    );
    setPets(updatedPets);
    setActivePet(updatedPets.find(p => p.id === activePet.id) || null);
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    const newUserMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', text: newUserMsg }]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: [
          { role: 'user', parts: [{ text: "You are the PAWDEX FAQ Bot. Answer briefly and directly using uppercase letters." }] },
          ...chatMessages.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
          { role: 'user', parts: [{ text: newUserMsg }] }
        ]
      });
      setChatMessages(prev => [...prev, { role: 'model', text: response.text || 'ERROR: UNABLE TO COMPUTE' }]);
    } catch (e) {
      console.error(e);
      setChatMessages(prev => [...prev, { role: 'model', text: 'CONNECTION FAILED. PLEASE TRY AGAIN.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleReferenceImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64String = result.split(',')[1];
        setReferenceImage({ mimeType: file.type, data: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const playPetSound = (pet: Pet) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      const seed = pet.id.length * 10 + pet.name.charCodeAt(0);
      
      if (pet.type === 'Dog') {
        osc.type = 'sawtooth';
        const baseFreq = pet.attributes.personality.includes('TIMID') ? 300 : Math.max(100, 150 + (seed % 100));
        osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, ctx.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.15);
      } else {
        osc.type = 'triangle';
        const freq1 = 600 + (seed % 300);
        const freq2 = 1200 + (seed % 400);
        
        osc.frequency.setValueAtTime(freq1, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq2, ctx.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.1);
        gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch(e) {
      console.error(e);
    }
  };

  const handleGenerateAvatar = async () => {
    if (!avatarPrompt) return;
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const parts: any[] = [];
      if (referenceImage) {
        parts.push({
          inlineData: {
            mimeType: referenceImage.mimeType,
            data: referenceImage.data
          }
        });
        parts.push({ text: `Using the provided image as reference, generate a new image: A 16-bit retro brutalist pixel art portrait of a pet, ${avatarPrompt}, solid gray background, facing forward.` });
      } else {
        parts.push({ text: `A 16-bit retro brutalist pixel art portrait of a pet, ${avatarPrompt}, solid gray background, facing forward.` });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts }
      });
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          setGeneratedAvatar(`data:image/jpeg;base64,${part.inlineData.data}`);
          break;
        }
      }
    } catch (e) {
      console.error(e);
      alert("Failed to generate avatar.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = (id: string) => {
    const updatedPets = pets.filter((p) => p.id !== id);
    setPets(updatedPets);
    if (activePet?.id === id) {
      setActivePet(updatedPets.length > 0 ? updatedPets[0] : null);
    }
  };

  const handleUpdateSchedule = (id: string, field: 'time' | 'activity', value: string) => {
    if (!activePet) return;
    const updatedPets = pets.map(p => 
      p.id === activePet.id ? {
        ...p,
        schedule: p.schedule.map(s => s.id === id ? { ...s, [field]: value } : s)
      } : p
    );
    setPets(updatedPets);
    setActivePet(updatedPets.find(p => p.id === activePet.id) || null);
  };

  const handleUpdateAttribute = (key: string, value: string) => {
    if (!activePet) return;
    const updatedPets = pets.map(p => 
      p.id === activePet.id ? { ...p, attributes: { ...p.attributes, [key]: value } } : p
    );
    setPets(updatedPets);
    setActivePet(updatedPets.find(p => p.id === activePet.id) || null);
  };

  const handleUpdateField = (field: keyof Pet, value: string) => {
    if (!activePet) return;
    const updatedPets = pets.map(p => 
      p.id === activePet.id ? { ...p, [field]: value } : p
    );
    setPets(updatedPets);
    setActivePet(updatedPets.find(p => p.id === activePet.id) || null);
  };

  const handleAddScheduleItem = () => {
    if (!activePet) return;
    const newItem = { id: Date.now().toString(), time: '00:00', activity: 'NEW ENTRY' };
    const updatedPets = pets.map(p => 
      p.id === activePet.id ? { ...p, schedule: [...p.schedule, newItem] } : p
    );
    setPets(updatedPets);
    setActivePet(updatedPets.find(p => p.id === activePet.id) || null);
  };

  const handleDeleteScheduleItem = (itemId: string) => {
    if (!activePet) return;
    const updatedPets = pets.map(p => 
      p.id === activePet.id ? { ...p, schedule: p.schedule.filter(s => s.id !== itemId) } : p
    );
    setPets(updatedPets);
    setActivePet(updatedPets.find(p => p.id === activePet.id) || null);
  };

  const handleDeleteRecord = (recordId: string) => {
    if (!activePet) return;
    const updatedPets = pets.map(p => 
      p.id === activePet.id ? { ...p, records: p.records.filter(r => r.id !== recordId) } : p
    );
    setPets(updatedPets);
    setActivePet(updatedPets.find(p => p.id === activePet.id) || null);
  };

  const handleDeletePhoto = (photoId: string) => {
    if (!activePet) return;
    const updatedPets = pets.map(p => 
      p.id === activePet.id ? { ...p, photos: p.photos.filter(ph => ph.id !== photoId) } : p
    );
    setPets(updatedPets);
    setActivePet(updatedPets.find(p => p.id === activePet.id) || null);
  };

  const chartData = activePet ? activePet.weight.map((w, i) => {
    let displayWeight = w;
    if (weightUnit === 'LB') {
      displayWeight = Number((w * 2.20462).toFixed(1));
    }
    return { month: `M${i+1}`, weight: displayWeight };
  }) : [];

  return (
    <div className="min-h-screen bg-[#222] p-4 flex items-center justify-center font-mono text-[#1a1a1a] select-none">
      {/* Main Main Device Container */}
      <div className="w-[1024px] h-[768px] max-w-full bg-[#d6d3d1] flex flex-col p-4 overflow-hidden relative border-[12px] border-[#1a1a1a] shadow-[inset_-8px_-8px_0px_#444,inset_8px_8px_0px_#777]">
        
        {/* Device Rivets */}
        <div className="absolute top-2 left-4 w-4 h-4 rounded-full bg-[#1a1a1a] opacity-30"></div>
        <div className="absolute top-2 right-4 w-4 h-4 rounded-full bg-[#1a1a1a] opacity-30"></div>
        <div className="absolute bottom-2 left-4 w-4 h-4 rounded-full bg-[#1a1a1a] opacity-30"></div>
        <div className="absolute bottom-2 right-4 w-4 h-4 rounded-full bg-[#1a1a1a] opacity-30"></div>

      <AnimatePresence>
        {activeToast && currentScreen === 'home' && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: 50, width: isToastExpanded ? 288 : 160 }}
            animate={{ opacity: 1, y: 0, x: 0, width: isToastExpanded ? 288 : 160 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`absolute top-8 right-8 z-[100] bg-black border-[4px] border-[#22c55e] p-2 shadow-[0_0_20px_rgba(34,197,94,0.5),8px_8px_0px_#1a1a1a] flex flex-col`}
          >
            <div className={`flex items-center justify-between ${isToastExpanded ? 'mb-1 pb-1 border-b-2 border-[#22c55e]/30' : ''}`}>
              <span className={`text-[#22c55e] font-black tracking-widest uppercase flex items-center gap-2 ${isToastExpanded ? 'text-xs' : 'text-[10px]'}`}>
                <AlertTriangle size={isToastExpanded ? 14 : 12} className="animate-pulse" />
                {isToastExpanded ? 'SYSTEM_ALERT' : 'ALERT'}
              </span>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setIsToastExpanded(!isToastExpanded)}
                  className="text-[#22c55e] hover:text-white font-bold"
                  title={isToastExpanded ? "Minimize" : "Enlarge"}
                >
                  {isToastExpanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                </button>
                <button 
                  onClick={() => setActiveToast(null)}
                  className="text-white hover:text-red-500 font-bold ml-1"
                  style={{fontSize: '10px'}}
                >
                  [X]
                </button>
              </div>
            </div>
            {isToastExpanded && (
              <div className="text-[#22c55e] font-mono text-sm font-bold flex flex-col gap-1 mt-1">
                <span className="opacity-75">[{pets.find(p => p.id === activeToast.petId)?.name || 'UNKNOWN'}] {activeToast.type}</span>
                <span className="text-white">{activeToast.description || 'Action Required.'}</span>
                <span className="text-xs text-[#22c55e]/50 mt-1">T: {activeToast.time}</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {currentScreen === 'home' && (
          <motion.div
            key="homescreen"
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="absolute inset-[12px] z-40 bg-[#ef4444] flex flex-col items-center justify-center p-8 text-center"
          >
            <motion.div 
               animate={{ y: [-10, 10, -10] }}
               transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
               className="text-5xl md:text-7xl font-black tracking-tighter text-white uppercase italic mb-8 drop-shadow-[8px_8px_0_rgba(0,0,0,1)]"
            >
              PAWDEX // V1.0.4
            </motion.div>
            <div className="flex flex-col gap-4 w-full max-w-sm">
              <button 
                onClick={() => setCurrentScreen('app')}
                 className="h-14 bg-[#3b82f6] border-4 border-black hover:border-transparent text-white font-black text-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 hover:shadow-[0_0_20px_#3b82f6,12px_12px_0px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all flex items-center justify-center gap-3 cursor-pointer uppercase group"
              >
                <Cpu size={24} className="group-hover:scale-110 transition-transform"/> Initiate PAWDEX
              </button>
              <button 
                onClick={() => setCurrentScreen('alerts')}
                 className="h-14 bg-[#0ea5e9] border-4 border-black hover:border-transparent text-white font-black text-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 hover:shadow-[0_0_20px_#0ea5e9,12px_12px_0px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all flex items-center justify-center gap-3 cursor-pointer uppercase group relative"
              >
                <AlertTriangle size={24} className="group-hover:scale-110 transition-transform"/> ALERTS
                {alerts.length > 0 && (
                  <span className="absolute -top-3 -right-3 w-8 h-8 bg-red-600 border-2 border-white rounded-full flex items-center justify-center text-sm shadow-[0_0_10px_red] animate-pulse">
                    {alerts.length}
                  </span>
                )}
              </button>
              <button 
                 onClick={() => setCurrentScreen('howTo')}
                 className="h-14 bg-[#fbbf24] border-4 border-black hover:border-transparent text-black font-black text-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 hover:shadow-[0_0_20px_#fbbf24,12px_12px_0px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all flex items-center justify-center gap-3 cursor-pointer uppercase group"
              >
                <BookOpen size={24} className="group-hover:scale-110 transition-transform"/> HOW TO USE?
              </button>
              <button 
                 onClick={() => setCurrentScreen('globalGallery')}
                 className="h-14 bg-[#e7e5e4] border-4 border-black hover:border-transparent text-black font-black text-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 hover:shadow-[0_0_20px_#e7e5e4,12px_12px_0px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all flex items-center justify-center gap-3 cursor-pointer uppercase group"
              >
                <ImageIcon size={24} className="group-hover:scale-110 transition-transform"/> Gallery
              </button>
            </div>
          </motion.div>
        )}
        
        {currentScreen === 'howTo' && (
          <HowToScreen onBack={() => setCurrentScreen('home')} />
        )}

        {currentScreen === 'globalGallery' && (
          <GlobalGallery pets={pets} onBack={() => setCurrentScreen('home')} />
        )}

        {currentScreen === 'alerts' && (
          <AlertsScreen pets={pets} alerts={alerts} setAlerts={setAlerts} onBack={() => setCurrentScreen('home')} />
        )}

        {currentScreen === 'app' && (
          <motion.div
            key="appscreen"
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="flex flex-col h-full w-full relative z-10"
          >
          {/* Header Banner */}
        <header className="h-16 shrink-0 flex items-center justify-between px-6 bg-[#ef4444] border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-4 relative z-10">
          <div className="text-2xl md:text-3xl font-black tracking-tighter text-white uppercase italic">
            PAWDEX // V1.0.4
          </div>
          <div className="hidden md:flex gap-4">
            <div className="flex items-center gap-2 bg-[#991b1b] px-3 py-1 border-2 border-black">
              <div className="w-3 h-3 bg-[#22c55e] border border-black animate-pulse"></div>
              <span className="text-xs text-white font-bold">SYSTEM OK</span>
            </div>
            <div className="flex items-center gap-2 bg-[#991b1b] px-3 py-1 border-2 border-black">
              <span className="text-xs text-white font-bold">{pets.length} UNITS CONNECTED</span>
            </div>
            <button 
              onClick={() => setIsChatbotOpen(!isChatbotOpen)}
              className={`text-white border-2 border-black px-3 py-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-all cursor-pointer font-bold text-xs flex items-center justify-center gap-2 ${isChatbotOpen ? 'bg-black text-[#f59e0b]' : 'bg-[#3b82f6]'}`}
            >
              <PixelQuestion size={14} /> <span className="uppercase">FAQ</span>
            </button>
          </div>
        </header>

        <main className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden relative z-10 w-full">
          {/* Left Panel: Roster & Nav */}
          <motion.aside 
            initial={false}
            animate={{ width: isChatbotOpen ? "14rem" : "16rem" }}
            transition={{ ease: "easeInOut", duration: 0.3 }}
            className="shrink-0 flex flex-col relative overflow-hidden"
          >
            <div className={`flex-1 flex flex-col gap-3 h-full pr-1 overflow-y-auto w-full`}>
              <div className="flex-1 bg-[#292524]/60 backdrop-blur-md shadow-[inset_0_8px_16px_rgba(0,0,0,0.8)] border-4 border-black p-3 flex flex-col gap-2 relative overflow-hidden">
                <div className="absolute inset-0 bg-[#292524] opacity-40 mix-blend-multiply pointer-events-none"></div>
                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '4px 4px' }}></div>
                <Reorder.Group axis="y" values={pets} onReorder={setPets} className="relative z-10 flex flex-col gap-2 flex-1 overflow-y-auto pr-1 pb-4">
                  <div className="text-[10px] text-[rgba(255,255,255,0.5)] mb-1 font-bold uppercase tracking-widest shrink-0">Pet Registry</div>
                  {pets.map(pet => (
                  <Reorder.Item key={pet.id} value={pet} className="relative group">
                    <div className="flex items-center gap-1 w-full border-2 border-black p-1 transition-all group-hover:-translate-y-1 group-hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none bg-[#e7e5e4] hover:bg-[#fbbf24]">
                      <div className="cursor-grab active:cursor-grabbing p-1 opacity-50 hover:opacity-100 flex items-center justify-center shrink-0">
                        <GripVertical size={16} />
                      </div>
                      <button
                        onClick={() => { setActivePet(pet); playPetSound(pet); }}
                        className={`flex-1 flex items-center gap-2 p-1 text-left cursor-pointer transition-all ${
                          activePet?.id === pet.id 
                            ? 'bg-[#ef4444] text-white' 
                            : 'bg-transparent text-[#1a1a1a]'
                        }`}
                      >
                        <div 
                          className={`w-10 h-10 flex shrink-0 items-center justify-center bg-cover bg-center ${activePet?.id === pet.id ? 'border-2 border-white' : 'border-2 border-black'}`}
                          style={{ backgroundImage: `url(${pet.avatarUrl})` }}
                        >
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className={`font-black text-sm truncate ${activePet?.id === pet.id ? 'text-white' : 'text-black'}`}>{pet.name}</span>
                          <span className={`text-[10px] truncate ${activePet?.id === pet.id ? 'opacity-80 underline' : 'opacity-60'}`}>UNIT {pet.id.substring(0,3).toUpperCase()} / {pet.type.toUpperCase()}</span>
                        </div>
                        {/* Animated Data Bars */}
                        <div className="ml-auto shrink-0 flex items-end gap-[2px] h-5 opacity-70">
                          <div className={`w-1.5 h-[100%] animate-[pulse_1s_ease-in-out_infinite] ${activePet?.id === pet.id ? 'bg-white' : 'bg-black'}`}></div>
                          <div className={`w-1.5 h-[60%] animate-[pulse_1.5s_ease-in-out_infinite] ${activePet?.id === pet.id ? 'bg-white' : 'bg-black'}`}></div>
                          <div className={`w-1.5 h-[80%] animate-[pulse_1.2s_ease-in-out_infinite] ${activePet?.id === pet.id ? 'bg-white' : 'bg-black'}`}></div>
                        </div>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(pet.id); }}
                        className="absolute -top-2 -right-2 flex items-center justify-center p-1 bg-black text-[#ef4444] hover:text-white hover:bg-[#ef4444] transition-all hidden group-hover:flex border border-black z-20 cursor-pointer hover:-translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:translate-x-[1px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none"
                        title="DECOMMISSION UNIT"
                      >
                        <span className="font-bold text-[10px] uppercase">DEL</span>
                      </button>
                    </div>
                  </Reorder.Item>
                ))}
                </Reorder.Group>
              </div>

              <button
                onClick={openAddModal}
                className="shrink-0 h-10 mb-2 mr-2 bg-[#3b82f6] border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-white font-black text-sm flex items-center justify-center gap-2 transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none cursor-pointer pointer-events-auto">
                <span>[+]</span> ADD NEW SPECIMEN
              </button>
            </div>
          </motion.aside>

          {/* Right Panel: Main Screen */}
          <section className="flex-1 flex flex-col gap-4 min-w-0 overflow-y-auto md:overflow-hidden">
            {activePet ? (
              <>
            {/* Top Screen Container */}
            <div className="flex-[1.6] min-h-0 bg-[#fdfcf0] border-4 border-black relative p-4 md:p-6 shadow-[inset_4px_4px_10px_rgba(0,0,0,0.1)] flex flex-col md:flex-row gap-4 md:gap-6 overflow-y-auto">
              {/* Pet Focus Image & Stats */}
              <div className="w-full md:w-1/2 flex flex-col justify-center items-center relative mt-4 md:mt-0">
                <div 
                  className="w-40 h-40 md:w-48 md:h-48 border-4 border-black bg-[#d6d3d1] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative flex items-center justify-center bg-cover bg-center shrink-0 group"
                  style={{ backgroundImage: `url(${activePet.avatarUrl})` }}
                >
                  <div className="absolute inset-0 bg-white/10 mix-blend-overlay pointer-events-none"></div>
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: "100%" }}
                    transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
                    className="absolute top-0 left-0 w-full bg-white/20 border-b border-white/50 pointer-events-none"
                  />
                  <button
                    onClick={openEditModal}
                    className="absolute -top-3 -right-3 w-8 h-8 bg-[#fbbf24] border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:translate-x-[1px] active:shadow-none hover:-translate-y-[2px] transition-all z-20 opacity-0 group-hover:opacity-100 cursor-pointer"
                    title="EDIT RECORD"
                  >
                    <Pencil size={14} className="text-black" />
                  </button>
                  <div className="absolute -bottom-8 bg-[#fbbf24] px-4 py-1 border-2 border-black font-black text-xs md:text-sm whitespace-nowrap z-10 flex flex-col items-center shadow-[4px_4px_0_0_#000]">
                    <span>{activePet.name.toUpperCase()} // {activePet.age}</span>
                    <span className="text-[8px] md:text-[10px] opacity-80 mt-0.5">{activePet.breed || 'UNKNOWN BREED'} | {activePet.color || 'NO COLOR'} | {activePet.dob ? `DOB: ${activePet.dob}` : 'NO DOB'}</span>
                  </div>
                </div>

                <div className="mt-8 md:mt-10 w-full grid grid-cols-2 gap-4 px-2 max-w-sm">
                  <div className="flex flex-col justify-end">
                    <span className="text-[10px] font-bold uppercase text-[#1a1a1a] flex items-center gap-1 whitespace-nowrap overflow-hidden text-ellipsis"><Heart size={12}/> Heart Rate</span>
                    <div className="h-3 bg-[#e7e5e4] border-2 border-black mt-1 p-0.5 shrink-0">
                      <div className="h-full bg-[#ef4444] animate-pulse" style={{ width: `${60 + (activePet.id.length * 5)}%` }}></div>
                    </div>
                  </div>
                  <div className="flex flex-col justify-end">
                    <span className="text-[10px] font-bold uppercase text-[#1a1a1a] flex items-center gap-1 whitespace-nowrap overflow-hidden text-ellipsis"><Zap size={12}/> Metabolism</span>
                    <div className="h-3 bg-[#e7e5e4] border-2 border-black mt-1 p-0.5 shrink-0">
                      <div className="h-full bg-[#22c55e]" style={{ width: `${Math.min(100, 40 + (activePet.weight[0] * 2))}%` }}></div>
                    </div>
                  </div>
                  <div className="flex flex-col justify-end">
                    <span className="text-[10px] font-bold uppercase text-[#1a1a1a] flex items-center gap-1 whitespace-nowrap overflow-hidden text-ellipsis"><Flame size={12}/> Stress Level</span>
                    <div className="h-3 bg-[#e7e5e4] border-2 border-black mt-1 p-0.5 shrink-0">
                      <div className="h-full bg-[#f97316]" style={{ width: `${activePet.attributes.personality.includes('SPICY') || activePet.attributes.energyLevel === 'HIGH' ? 85 : 35}%` }}></div>
                    </div>
                  </div>
                  <div className="flex flex-col justify-end">
                    <span className="text-[10px] font-bold uppercase text-[#1a1a1a] flex items-center gap-1 whitespace-nowrap overflow-hidden text-ellipsis"><Brain size={12}/> Cognition</span>
                    <div className="h-3 bg-[#e7e5e4] border-2 border-black mt-1 p-0.5 shrink-0">
                      <div className="h-full bg-[#3b82f6]" style={{ width: `${Math.min(100, 50 + (activePet.name.length * 8))}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pet Details / Terminal */}
              <div className="w-full md:w-1/2 md:border-l-4 md:border-black md:border-dashed md:pl-6 flex flex-col gap-4 pb-4 md:pb-0 overflow-y-auto">
                <div className="bg-black text-[#22c55e] p-3 text-xs leading-tight font-bold border-2 border-[#22c55e] font-mono break-words shrink-0">
                  &gt;&gt; SCANNING VITAL SIGNS...<br/>
                  &gt;&gt; STATUS: NOMINAL<br/>
                  &gt;&gt; GENDER: {activePet.gender.toUpperCase()}<br/>
                  &gt;&gt; NOTES: {activePet.notes.toUpperCase()}
                </div>
                
                <div className="flex-1 flex flex-col gap-4 mt-2 min-h-0 overflow-y-auto pr-2 pb-2">
                  <div className="flex flex-col gap-2">
                    <div className="text-xs font-black uppercase text-[#ef4444] underline flex items-center gap-1 shrink-0">
                      <Settings size={14}/> Daily Schedule/Attributes
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      {activePet.schedule.map(item => (
                        <div key={item.id} className="flex justify-between items-center text-xs py-1 border-b-2 border-black/20 opacity-80 font-bold shrink-0 group hover:opacity-100 transition-opacity">
                          <input 
                            value={item.time} 
                            onChange={(e) => handleUpdateSchedule(item.id, 'time', e.target.value)}
                            className="bg-transparent border-b border-transparent focus:border-black/30 hover:border-black/10 focus:outline-none w-14 text-[#1a1a1a] uppercase px-1 transition-colors"
                          />
                          <input 
                            value={item.activity} 
                            onChange={(e) => handleUpdateSchedule(item.id, 'activity', e.target.value)}
                            className="bg-transparent border-b border-transparent focus:border-black/30 hover:border-black/10 focus:outline-none flex-1 text-right text-[#1a1a1a] uppercase px-1 transition-colors"
                          />
                          <button 
                            onClick={() => handleDeleteScheduleItem(item.id)}
                            className="opacity-0 group-hover:opacity-100 bg-red-600 text-white w-4 h-4 ml-2 flex items-center justify-center border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:bg-red-500 transition-all hover:-translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:translate-x-[1px] active:shadow-none cursor-pointer"
                            title="Delete Schedule Entry"
                          >
                            x
                          </button>
                        </div>
                      ))}
                      <button 
                        onClick={handleAddScheduleItem}
                        className="text-[10px] font-bold text-[#3b82f6] uppercase flex items-center justify-center border-2 border-dashed border-[#3b82f6] p-1 mt-1 transition-all hover:bg-[#3b82f6]/10 hover:-translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(59,130,246,0.5)] active:translate-y-[1px] active:translate-x-[1px] active:shadow-none cursor-pointer"
                      >
                        + Add Schedule Entry
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      <div className="flex flex-col">
                        <label className="text-[9px] uppercase font-bold text-[#3b82f6] leading-tight mb-0.5">DIET</label>
                        <input 
                          value={activePet.diet} 
                          onChange={(e) => handleUpdateField('diet', e.target.value)}
                          className="bg-[#e7e5e4] border-[1px] border-black p-1 text-[10px] font-bold focus:outline-none focus:bg-white focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] text-[#1a1a1a] uppercase transition-colors shadow-inner"
                        />
                      </div>
                      {Object.entries(activePet.attributes).map(([key, value]) => (
                        <div key={key} className="flex flex-col">
                          <label className="text-[9px] uppercase font-bold text-[#3b82f6] leading-tight mb-0.5">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                          <input 
                            value={value} 
                            onChange={(e) => handleUpdateAttribute(key, e.target.value)}
                            className="bg-[#e7e5e4] border-[1px] border-black p-1 text-[10px] font-bold focus:outline-none focus:bg-white focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] text-[#1a1a1a] uppercase transition-colors shadow-inner"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row: Tab Navigation & Content Container */}
            <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-4">
               
               {/* Tab Controls (Action Buttons) */}
               <div className="w-full md:w-1/3 shrink-0 flex flex-col gap-4 pb-2 pr-2">
                 <button 
                   onClick={() => setActiveTab('status')} 
                   className={`flex-1 shrink-0 min-h-[3rem] tracking-tight ${activeTab === 'status' ? 'bg-[#10b981] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-[#fbbf24] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'} border-4 border-black flex items-center justify-center gap-2 font-black text-xs md:text-sm uppercase p-2 transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none cursor-pointer`}
                 >
                   <Activity size={16}/> Status
                 </button>
                 <button 
                   onClick={() => setActiveTab('medical')} 
                   className={`flex-1 shrink-0 min-h-[3rem] tracking-tight ${activeTab === 'medical' ? 'bg-[#10b981] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-[#fbbf24] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'} border-4 border-black flex items-center justify-center gap-2 font-black text-xs md:text-sm uppercase p-2 transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none cursor-pointer`}
                 >
                   <Beaker size={16}/> Records
                 </button>
                 <button 
                   onClick={() => setActiveTab('gallery')} 
                   className={`flex-1 shrink-0 min-h-[3rem] tracking-tight ${activeTab === 'gallery' ? 'bg-[#10b981] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-[#fbbf24] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'} border-4 border-black flex items-center justify-center gap-2 font-black text-xs md:text-sm uppercase p-2 transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none cursor-pointer`}
                 >
                   <ImageIcon size={16}/> Gallery
                 </button>
               </div>

               {/* Tab Content (Medical / Data) */}
               <div className="flex-1 bg-[#78716c] border-4 border-black p-4 flex flex-col gap-2 min-w-0 overflow-y-auto shadow-[inset_0_4px_8px_rgba(0,0,0,0.5)]">
                 
                 {activeTab === 'status' ? (
                   <div className="h-full flex flex-col">
                     <div className="text-[10px] text-white font-bold uppercase mb-1 shrink-0">MASS TRACKING ({weightUnit}) // SYSTEM_GRAPH</div>
                     <div className="flex-1 w-full bg-[#1a1a1a] border-2 border-black p-2 min-h-0">
                       <ResponsiveContainer width="100%" height="100%">
                         <LineChart data={chartData}>
                           <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                           <XAxis dataKey="month" stroke="#a8a29e" tick={{fontFamily: 'monospace', fontSize: 10, fill: '#a8a29e'}} />
                           <YAxis stroke="#a8a29e" domain={['auto', 'auto']} tick={{fontFamily: 'monospace', fontSize: 10, fill: '#a8a29e'}} width={35} />
                           <Tooltip 
                             contentStyle={{ backgroundColor: '#e7e5e4', border: '2px solid #000', color: '#1a1a1a', fontFamily: 'monospace', fontSize: 12, fontWeight: 'bold' }}
                             itemStyle={{ color: '#ef4444' }}
                             formatter={(value: any) => [`${value} ${weightUnit}`, 'Weight']}
                           />
                           <Line type="stepAfter" dataKey="weight" stroke="#22c55e" strokeWidth={3} dot={{ r: 3, fill: '#fbbf24', stroke: '#000', strokeWidth: 2 }} />
                         </LineChart>
                       </ResponsiveContainer>
                     </div>

                     {/* Weight Editing Controls */}
                     <div className="mt-2 shrink-0 flex items-center justify-between gap-2 border-2 border-black bg-[#e7e5e4] p-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]">
                       <div className="flex flex-1 items-center gap-1">
                         <input 
                           type="number" 
                           step="0.1"
                           value={newWeightInput}
                           onChange={(e) => setNewWeightInput(e.target.value)}
                           placeholder={`WEIGHT`} 
                           className="bg-white border-2 border-black px-2 py-1 text-xs font-bold w-full uppercase focus:outline-none focus:ring-1 focus:ring-blue-500"
                         />
                         <button
                           onClick={() => setWeightUnit(u => u === 'KG' ? 'LB' : 'KG')}
                           className="bg-[#d6d3d1] border-2 border-black text-[#1a1a1a] font-black text-[10px] px-2 py-1 uppercase whitespace-nowrap cursor-pointer hover:bg-white active:translate-y-[1px] active:translate-x-[1px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all ml-1"
                           title="Toggle Unit"
                         >
                           {weightUnit}
                         </button>
                       </div>
                       <div className="flex flex-1 items-center gap-1">
                         <button 
                           onClick={handleAddWeight}
                           className="bg-[#22c55e] flex-1 border-2 border-black text-black font-black text-[10px] px-3 py-1 hover:bg-green-400 active:translate-y-[1px] active:translate-x-[1px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all uppercase whitespace-nowrap cursor-pointer text-center"
                         >
                           ADD
                         </button>
                         <button 
                           onClick={handleDeleteLastWeight}
                           className="bg-red-600 flex-1 border-2 border-black text-white font-black text-[10px] px-3 py-1 hover:bg-red-500 active:translate-y-[1px] active:translate-x-[1px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all uppercase whitespace-nowrap cursor-pointer text-center"
                           title="Delete Last Entry"
                         >
                           UNDO
                         </button>
                       </div>
                     </div>

                   </div>
                 ) : activeTab === 'medical' ? (
                   <div className="h-full flex flex-col">
                     <div className="text-[10px] text-white font-bold uppercase mb-2 shrink-0">MEDICAL RECORDS / VAXX_STORAGE</div>
                     <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto pr-1 pb-4 pt-1 pl-1">
                       {/* Upload Button */}
                       <button onClick={() => setIsUploadDocModalOpen(true)} className="aspect-square bg-transparent border-2 border-black border-dashed flex flex-col justify-center items-center p-2 text-white opacity-60 transition-all hover:opacity-100 hover:bg-black/10 group shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] cursor-pointer hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none">
                         <div className="text-2xl font-black mb-1 group-hover:scale-125 transition-transform">+</div>
                         <span className="text-[10px] font-bold text-center">UPLOAD DOCUMENT</span>
                       </button>

                       {activePet.records && activePet.records.map(record => (
                         <div key={record.id} onClick={() => setPreviewMedia({ type: 'record', record })} className="aspect-square bg-[#e7e5e4] border-2 border-black p-2 flex flex-col items-center justify-between text-[#1a1a1a] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] relative group hover:bg-white transition-all cursor-pointer hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none">
                           <button 
                             onClick={(e) => { e.stopPropagation(); handleDeleteRecord(record.id); }} 
                             className="absolute top-1 right-1 w-5 h-5 bg-red-600 border-2 border-black flex items-center justify-center text-[10px] text-white font-black opacity-0 group-hover:opacity-100 hover:bg-red-500 z-10 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer hover:-translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:translate-x-[1px] active:shadow-none" 
                             title="DELETE RECORD"
                           >
                             X
                           </button>
                           <div className="w-full flex justify-between items-start">
                              <FileText size={14} className="opacity-50"/>
                              {record.iconType === 'pill' ? <Pill size={14} className="text-[#ef4444]" /> : <Activity size={14} className="text-[#3b82f6]" />}
                           </div>
                           <div className="flex-1 flex items-center justify-center w-full">
                             <div className="w-8 h-10 border-2 border-black bg-white shadow-sm flex flex-col p-1 gap-[2px] relative overflow-hidden">
                               {record.iconType === 'pill' ? (
                                 <>
                                   <div className="w-full h-[2px] bg-black/30"></div>
                                   <div className="w-3/4 h-[2px] bg-black/30"></div>
                                   <div className="w-full h-[2px] bg-black/30"></div>
                                 </>
                               ) : (
                                 <>
                                   <div className="absolute inset-0 bg-[#3b82f6] opacity-20"></div>
                                   <div className="w-3 h-3 rounded-full border border-black bg-white z-10 m-auto mt-[10px]"></div>
                                 </>
                               )}
                             </div>
                           </div>
                           <div className="w-full text-center">
                             <span className="text-[9px] font-black leading-none block truncate" title={`${activePet.name}_${record.name}`}>{activePet.name}_{record.name}</span>
                             <span className="text-[7px] opacity-60 block mt-[2px] font-bold">{record.date} - {record.size}</span>
                           </div>
                         </div>
                       ))}
                     </div>
                   </div>
                 ) : (
                   <div className="h-full flex flex-col">
                     <div className="text-[10px] text-white font-bold uppercase mb-2 shrink-0">PHOTO GALLERY / VISUAL_DATA</div>
                     <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto pr-1 pb-4 pt-1 pl-1">
                       {/* Upload Photo Button */}
                       <button onClick={() => setIsUploadPhotoModalOpen(true)} className="aspect-square bg-transparent border-2 border-black border-dashed flex flex-col justify-center items-center p-2 text-white opacity-60 transition-all hover:opacity-100 hover:bg-black/10 group shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] cursor-pointer hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none">
                         <div className="text-2xl font-black mb-1 group-hover:scale-125 transition-transform">+</div>
                         <span className="text-[10px] font-bold text-center">ADD PHOTO</span>
                       </button>

                       {activePet.photos?.map(photo => (
                         <div key={photo.id} onClick={() => setPreviewMedia({ type: 'photo', photo })} className="aspect-square border-2 border-black bg-[#e7e5e4] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] relative group overflow-hidden cursor-pointer hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-all">
                           <button 
                             onClick={(e) => { e.stopPropagation(); handleDeletePhoto(photo.id); }} 
                             className="absolute top-1 right-1 w-6 h-6 bg-red-600 border-2 border-black flex items-center justify-center text-[10px] text-white font-black opacity-0 group-hover:opacity-100 hover:bg-red-500 z-10 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer hover:-translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:translate-x-[1px] active:shadow-none" 
                             title="DELETE PHOTO"
                           >
                             X
                           </button>
                           <div className="absolute inset-0 bg-cover bg-center transition-transform group-hover:scale-110" style={{ backgroundImage: `url(${photo.url})` }}></div>
                           <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm p-1 text-center font-bold text-[8px] text-white uppercase truncate">
                             VISUAL_{photo.date.replace(/\//g, '')}
                           </div>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}
               </div>
            </div>
            </>
            ) : (
              <div className="flex-1 bg-[#fdfcf0] border-4 border-black relative p-6 shadow-[inset_4px_4px_10px_rgba(0,0,0,0.1)] flex flex-col items-center justify-center text-center">
                 <div className="w-24 h-24 border-4 border-black bg-[#d6d3d1] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative flex items-center justify-center mb-6">
                    <ActivitySquare className="text-[#a8a29e]" size={48} />
                 </div>
                 <h2 className="text-2xl font-black uppercase mb-2 text-[#a8a29e]">NO SUBJECT SELECTED</h2>
                 <p className="text-sm font-bold text-[#a8a29e] max-w-sm">
                    Registry is empty or no subject is currently selected. Add a new specimen to begin monitoring vitals.
                 </p>
                 <button 
                   onClick={openAddModal}
                   className="mt-8 shrink-0 h-12 px-6 bg-[#3b82f6] border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-white font-black text-sm flex items-center justify-center gap-2 active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-all cursor-pointer hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                   <span>[+]</span> ADD NEW SPECIMEN
                 </button>
              </div>
            )}
          </section>

          {/* Chatbot Side Panel */}
          <AnimatePresence>
          {isChatbotOpen && (
            <motion.aside 
              initial={{ opacity: 0, width: 0, marginLeft: 0 }}
              animate={{ opacity: 1, width: "16rem", marginLeft: 0 }}
              exit={{ opacity: 0, width: 0, marginLeft: 0 }}
              transition={{ ease: "easeInOut", duration: 0.3 }}
              className="shrink-0 flex flex-col bg-[#292524] border-4 border-black relative overflow-hidden shadow-[inset_4px_4px_10px_rgba(0,0,0,0.5)] z-20"
            >
              <div className="w-64 flex-1 flex flex-col">
              <div className="scanlines absolute inset-0 pointer-events-none opacity-20"></div>
              {/* Header */}
              <div className="h-10 bg-[#3b82f6] border-b-4 border-black flex items-center justify-between px-3 shrink-0 relative z-10">
                <div className="flex items-center gap-2 text-white">
                  <PixelQuestion size={16} />
                  <span className="font-black text-sm uppercase tracking-widest">FAQ BOT</span>
                </div>
                <button 
                  onClick={() => setIsChatbotOpen(false)}
                  className="w-5 h-5 bg-black text-white hover:text-red-500 flex items-center justify-center text-xs font-bold border-2 border-transparent hover:border-white transition-all cursor-pointer"
                >
                  X
                </button>
              </div>
              
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 relative z-10 font-mono">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'self-end items-end' : 'self-start items-start'}`}>
                    <span className="text-[8px] text-[rgba(255,255,255,0.5)] font-bold mb-1 uppercase tracking-widest">
                      {msg.role === 'user' ? 'OPERATOR' : 'FAQ_SYS'}
                    </span>
                    <div className={`p-2 border-2 border-black text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${msg.role === 'user' ? 'bg-[#22c55e] text-black font-bold' : 'bg-[#e7e5e4] text-[#1a1a1a] font-bold'}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex flex-col max-w-[85%] self-start items-start">
                    <span className="text-[8px] text-[rgba(255,255,255,0.5)] font-bold mb-1 uppercase tracking-widest">FAQ_SYS</span>
                    <div className="p-2 border-2 border-black text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-[#e7e5e4] text-[#1a1a1a] font-bold flex gap-1 items-center">
                      <div className="w-2 h-2 bg-black animate-bounce rounded-full"></div>
                      <div className="w-2 h-2 bg-black animate-bounce rounded-full" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-black animate-bounce rounded-full" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-3 bg-[#44403c] border-t-4 border-black shrink-0 relative z-10">
                <form onSubmit={handleChatSubmit} className="flex gap-2">
                  <div className="flex-1 relative flex">
                     <input 
                       type="text" 
                       value={chatInput}
                       onChange={(e) => setChatInput(e.target.value)}
                       placeholder="ENTER QUERY..."
                       className="w-full bg-[#1a1a1a] text-[#22c55e] border-2 border-black p-2 pr-10 text-xs font-bold uppercase focus:outline-none focus:ring-2 focus:ring-[#f59e0b] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.8)] placeholder:text-[#22c55e]/30"
                     />
                     <button
                       type="button"
                       onClick={startListening}
                       className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#22c55e] hover:text-[#fbbf24] transition-colors cursor-pointer ${isListening ? 'animate-pulse text-[#fbbf24]' : ''}`}
                       title="Voice Input"
                     >
                       {isListening ? <Mic size={16} /> : <MicOff size={16} className="opacity-50" />}
                     </button>
                  </div>
                  <button 
                    type="submit"
                    disabled={isChatLoading || (!chatInput.trim() && !isListening)}
                    className="bg-[#ef4444] text-white border-2 border-black p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:translate-x-[1px] active:shadow-none transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <Send size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </form>
              </div>
              </div>
            </motion.aside>
          )}
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="h-4 md:h-10 mt-4 shrink-0 flex items-center justify-between px-4 bg-[#44403c] border-4 border-black z-10 relative shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex gap-4 items-center">
            <button 
               onClick={() => setCurrentScreen('home')}
               className="w-4 h-4 bg-[#ef4444] rounded-full border-2 border-black shadow-[inset_1px_1px_2px_rgba(255,255,255,0.4),1px_1px_0px_rgba(0,0,0,1)] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.5),0px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:translate-x-[1px] transition-all cursor-pointer hover:bg-red-400 hover:-translate-y-[2px] hover:shadow-[inset_1px_1px_2px_rgba(255,255,255,0.4),3px_3px_0px_rgba(0,0,0,1)]"
               title="Emergency Override / Master Switch"
            ></button>
          </div>
          <div className="text-[10px] text-[#a8a29e] font-bold">SERIAL: PDX-1996-002345 // BUILT IN MUMBAI</div>
        </footer>

        {/* Decorative background lines */}
        <div className="absolute top-20 right-8 w-1 h-20 bg-black opacity-10 blur-[1px] rotate-12 pointer-events-none"></div>
        <div className="absolute bottom-32 left-10 w-1 h-32 bg-black opacity-5 blur-[2px] -rotate-45 pointer-events-none"></div>
        
        {isUploadDocModalOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]">
            <div className="w-full max-w-sm bg-[#d6d3d1] border-[8px] border-[#1a1a1a] shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] flex flex-col relative overflow-hidden">
               <div className="scanlines absolute inset-0 pointer-events-none opacity-20"></div>
               <div className="h-10 bg-black flex items-center justify-between px-4 border-b-4 border-white/20 relative z-10">
                 <span className="text-[#fbbf24] font-black tracking-widest uppercase">UPLOAD DATA</span>
                 <button onClick={() => setIsUploadDocModalOpen(false)} className="w-6 h-6 bg-red-600 border-2 border-white flex items-center justify-center text-white font-bold hover:bg-red-500 shadow-[2px_2px_0px_0px_rgba(255,255,255,0.5)] active:translate-y-[1px] active:translate-x-[1px] active:shadow-none transition-all text-xs cursor-pointer hover:-translate-y-[2px] hover:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.5)]">X</button>
               </div>
               <div className="p-6 flex flex-col gap-4 relative z-10">
                 <div className="flex flex-col gap-1">
                   <label className="text-[10px] font-bold text-red-600 underline uppercase tracking-widest">DOCUMENT ALIAS</label>
                   <input className="bg-[#e7e5e4] border-2 border-black p-2 font-bold uppercase focus:ring-2 focus:ring-[#f59e0b] shadow-inner" placeholder="RX_RECORD.PDF" />
                 </div>
                 <div className="flex flex-col gap-1">
                   <label className="text-[10px] font-bold text-red-600 underline uppercase tracking-widest">FILE INPUT</label>
                   <div className="bg-[#e7e5e4] border-2 border-black border-dashed h-24 flex flex-col items-center justify-center relative cursor-pointer hover:bg-gray-300 transition-colors">
                     <Upload size={24} className="opacity-50 mb-1" />
                     <span className="text-[10px] font-black uppercase opacity-70">CLICK TO SELECT FILE (.PDF, .IMG)</span>
                     <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" />
                   </div>
                 </div>
                 <button 
                   onClick={() => setIsUploadDocModalOpen(false)} 
                   className="mt-4 h-10 bg-[#3b82f6] border-4 border-black text-white font-black text-sm uppercase hover:bg-blue-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                 >
                   CONFIRM UPLOAD
                 </button>
               </div>
            </div>
          </div>
        )}

        {isModalOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]">
            <div className="w-full max-w-lg bg-[#d6d3d1] border-[8px] border-[#1a1a1a] shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] flex flex-col relative overflow-hidden">
               <div className="scanlines absolute inset-0 pointer-events-none opacity-20"></div>
               {/* header */}
               <div className="h-12 bg-black flex items-center justify-between px-4 border-b-4 border-white/20 relative z-10">
                 <span className="text-[#fbbf24] font-black tracking-widest uppercase">{editingPetId ? 'EDIT SPECIMEN' : 'INITIALIZE NEW SPECIMEN'}</span>
                 <button onClick={closeModal} className="w-6 h-6 bg-red-600 border-2 border-white flex items-center justify-center text-white font-bold hover:bg-red-500 shadow-[2px_2px_0px_0px_rgba(255,255,255,0.5)] active:translate-y-[1px] active:translate-x-[1px] active:shadow-none transition-all cursor-pointer hover:-translate-y-[2px] hover:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.5)]">X</button>
               </div>
               {/* body */}
               <div className="p-4 md:p-6 flex flex-col gap-4 relative z-10 overflow-y-auto max-h-[85vh] md:max-h-[80vh]">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-red-600 underline uppercase tracking-widest">SPECIMEN NAME</label>
                      <input value={newPetName} onChange={e => setNewPetName(e.target.value)} className="bg-[#e7e5e4] border-2 border-black p-2 font-bold uppercase focus:ring-2 focus:ring-[#f59e0b] shadow-inner text-xs" placeholder="UNKNOWN" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-red-600 underline uppercase tracking-widest">CLASSIFICATION</label>
                      <select value={newPetType} onChange={e => setNewPetType(e.target.value)} className="bg-[#e7e5e4] border-2 border-black p-2 font-bold uppercase focus:ring-2 focus:ring-[#f59e0b] shadow-inner text-xs">
                        <option>CAT</option>
                        <option>DOG</option>
                        <option>BIRD</option>
                        <option>RABBIT</option>
                        <option>REPTILE</option>
                        <option>FISH</option>
                        <option>HAMSTER</option>
                        <option>GUINEA PIG</option>
                        <option>OTHER</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-red-600 underline uppercase tracking-widest">BREED</label>
                      <input value={newPetBreed} onChange={e => setNewPetBreed(e.target.value)} className="bg-[#e7e5e4] border-2 border-black p-2 font-bold uppercase focus:ring-2 focus:ring-[#f59e0b] shadow-inner text-xs" placeholder="UNKNOWN" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-red-600 underline uppercase tracking-widest">PRIMARY COLOR</label>
                      <input value={newPetColor} onChange={e => setNewPetColor(e.target.value)} className="bg-[#e7e5e4] border-2 border-black p-2 font-bold uppercase focus:ring-2 focus:ring-[#f59e0b] shadow-inner text-xs" placeholder="UNKNOWN" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-red-600 underline uppercase tracking-widest">D.O.B / ADOPTION DATE</label>
                      <input value={newPetDob} onChange={e => setNewPetDob(e.target.value)} type="date" className="bg-[#e7e5e4] border-2 border-black p-2 font-bold uppercase focus:ring-2 focus:ring-[#f59e0b] shadow-inner text-xs" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-red-600 underline uppercase tracking-widest">WEIGHT (KG)</label>
                      <input value={newPetWeight} onChange={e => setNewPetWeight(e.target.value)} type="number" step="0.1" className="bg-[#e7e5e4] border-2 border-black p-2 font-bold uppercase focus:ring-2 focus:ring-[#f59e0b] shadow-inner text-xs" placeholder="0.0" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-red-600 underline uppercase tracking-widest">AGE (YRS)</label>
                      <input value={newPetAge} onChange={e => setNewPetAge(e.target.value)} type="number" className="bg-[#e7e5e4] border-2 border-black p-2 font-bold uppercase focus:ring-2 focus:ring-[#f59e0b] shadow-inner text-xs" placeholder="0" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-red-600 underline uppercase tracking-widest">GENDER</label>
                      <select value={newPetGender} onChange={e => setNewPetGender(e.target.value)} className="bg-[#e7e5e4] border-2 border-black p-2 font-bold uppercase focus:ring-2 focus:ring-[#f59e0b] shadow-inner text-xs">
                        <option>MALE</option>
                        <option>FEMALE</option>
                        <option>UNKNOWN</option>
                      </select>
                    </div>
                 </div>
                 <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-red-600 underline uppercase tracking-widest flex justify-between items-center">
                      <span>VISUAL ASSET (AI GENERATED)</span>
                      {isGenerating && <span className="text-[#3b82f6] animate-pulse">GENERATING...</span>}
                    </label>
                    <div className="w-full h-32 bg-[#1a1a1a] border-4 border-black shadow-[inset_0_4px_8px_rgba(0,0,0,0.8)] relative flex flex-col items-center justify-center overflow-hidden mb-1">
                      <div className="scanlines absolute inset-0 pointer-events-none opacity-30"></div>
                      {generatedAvatar ? (
                        <>
                          <div className="absolute inset-0 bg-contain bg-no-repeat bg-center opacity-90" style={{ backgroundImage: `url(${generatedAvatar})` }}></div>
                          <div className="absolute inset-x-0 bottom-0 bg-black/80 backdrop-blur-sm p-1 flex justify-between items-center border-t border-black/50">
                            <span className="text-[8px] font-bold text-[#22c55e] uppercase tracking-widest">GENERATION_SUCCESS</span>
                            <span className="text-[8px] font-bold text-[#a8a29e]">128x128.PNG</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center text-center p-2 z-10">
                          <ImageIcon size={24} className="text-[#a8a29e] mb-2 opacity-30" />
                          <span className="text-[10px] text-[#a8a29e] font-black uppercase tracking-widest opacity-50">NO AVATAR DATA</span>
                          <span className="text-[8px] text-[#a8a29e] font-bold uppercase mt-1 opacity-30">USE GENERATOR BELOW TO CREATE ASSET</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                       <input 
                         className="bg-[#e7e5e4] border-2 border-black p-2 font-bold focus:ring-2 focus:ring-[#22c55e] shadow-inner text-xs" 
                         placeholder="E.g. Fluffy dog with a bandana" 
                         value={avatarPrompt}
                         onChange={(e) => setAvatarPrompt(e.target.value)}
                       />
                       <div className="flex gap-2">
                         <div className="flex-1 flex flex-col items-center justify-center bg-[#e7e5e4] border-2 border-black font-bold focus-within:ring-2 focus-within:ring-[#22c55e] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-all px-4 py-2 relative overflow-hidden cursor-pointer group hover:bg-gray-300">
                           {referenceImage ? (
                             <span className="text-xs uppercase text-[#22c55e] whitespace-nowrap">REFERENCE UPLOADED ✓</span>
                           ) : (
                             <span className="text-[10px] uppercase whitespace-nowrap">UPLOAD REF PNG/JPG (OPTIONAL)</span>
                           )}
                           <input type="file" accept="image/*" onChange={handleReferenceImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                         </div>
                         <button 
                           onClick={handleGenerateAvatar}
                           disabled={isGenerating || !avatarPrompt}
                           className="flex items-center justify-center gap-2 bg-[#3b82f6] text-white border-2 border-black font-bold focus-within:ring-2 focus-within:ring-[#22c55e] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-all px-4 cursor-pointer hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed">
                           <Sparkles size={14} />
                           <span className="text-xs uppercase whitespace-nowrap">GENERATE</span>
                         </button>
                       </div>
                    </div>
                 </div>
                  <button 
                   onClick={() => {
                     if (editingPetId) {
                       const updatedPets = pets.map(p => {
                         if (p.id === editingPetId) {
                           return {
                             ...p,
                             name: newPetName || 'UNKNOWN',
                             type: newPetType,
                             breed: newPetBreed || undefined,
                             color: newPetColor || undefined,
                             dob: newPetDob || undefined,
                             age: newPetAge ? `${newPetAge} years` : '0',
                             gender: newPetGender as 'Male' | 'Female' | 'Unknown',
                             avatarUrl: generatedAvatar || p.avatarUrl,
                             // Only update weight if it's explicitly typed and different
                             weight: newPetWeight && String(newPetWeight) !== String(p.weight[p.weight.length - 1] || '') 
                               ? [...p.weight, Number(newPetWeight)] 
                               : p.weight
                           };
                         }
                         return p;
                       });
                       setPets(updatedPets);
                       const updatedActivePet = updatedPets.find(p => p.id === activePet?.id);
                       if (updatedActivePet) setActivePet(updatedActivePet);
                     } else {
                       const newPet: Pet = {
                         id: Date.now().toString(),
                         name: newPetName || 'UNKNOWN',
                         type: newPetType,
                         breed: newPetBreed || undefined,
                         color: newPetColor || undefined,
                         dob: newPetDob || undefined,
                         age: newPetAge ? `${newPetAge} years` : '0',
                         gender: newPetGender as 'Male' | 'Female' | 'Unknown',
                         weight: newPetWeight ? [Number(newPetWeight)] : [],
                         diet: 'Not set',
                         notes: '',
                         avatarUrl: generatedAvatar || '/favicon.ico',
                         colorHex: '#3b82f6',
                         schedule: [],
                         attributes: {
                           energyLevel: 'UNKNOWN',
                           favoriteToy: 'UNKNOWN',
                           allergies: 'NONE',
                           microchipID: 'PENDING',
                           lastBath: 'UNKNOWN',
                           personality: 'UNKNOWN'
                         },
                         records: [],
                         photos: []
                       };
                       setPets([...pets, newPet]);
                       setActivePet(newPet);
                     }
                     closeModal();
                   }} 
                   className="mt-6 h-12 bg-[#22c55e] border-4 border-black text-black font-black text-lg uppercase hover:bg-[#16a34a] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                 >
                   <Upload size={20} /> {editingPetId ? 'SAVE CHANGES' : 'REGISTER SPECIMEN'}
                 </button>
               </div>
            </div>
          </div>
        )}

        {isUploadPhotoModalOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]">
            <div className="w-full max-w-sm bg-[#d6d3d1] border-[8px] border-[#1a1a1a] shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] flex flex-col relative overflow-hidden">
               <div className="scanlines absolute inset-0 pointer-events-none opacity-20"></div>
               <div className="h-10 bg-black flex items-center justify-between px-4 border-b-4 border-white/20 relative z-10">
                 <span className="text-white font-black tracking-widest uppercase">UPLOAD PHOTO</span>
                 <button onClick={() => setIsUploadPhotoModalOpen(false)} className="w-6 h-6 bg-red-600 border-2 border-white flex items-center justify-center text-white font-bold hover:bg-red-500 shadow-[2px_2px_0px_0px_rgba(255,255,255,0.5)] active:translate-y-[1px] active:translate-x-[1px] active:shadow-none transition-all text-xs cursor-pointer hover:-translate-y-[2px] hover:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.5)]">X</button>
               </div>
               <div className="p-6 flex flex-col gap-4 relative z-10">
                 <div className="flex flex-col gap-1">
                   <label className="text-[10px] font-bold text-red-600 underline uppercase tracking-widest">PHOTO ALIAS</label>
                   <input className="bg-[#e7e5e4] border-2 border-black p-2 font-bold uppercase focus:ring-2 focus:ring-[#10b981] shadow-inner" placeholder="VISUAL_DATA_01" />
                 </div>
                 <div className="flex flex-col gap-1">
                   <label className="text-[10px] font-bold text-red-600 underline uppercase tracking-widest">FILE INPUT</label>
                   <div className="bg-[#e7e5e4] border-2 border-black border-dashed h-24 flex flex-col items-center justify-center relative cursor-pointer hover:bg-gray-300 transition-colors">
                     <ImageIcon size={24} className="opacity-50 mb-1" />
                     <span className="text-[10px] font-black uppercase opacity-70">CLICK TO SELECT (.PNG, .JPG)</span>
                     <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" />
                   </div>
                 </div>
                 <button 
                   onClick={() => setIsUploadPhotoModalOpen(false)} 
                   className="mt-4 h-10 bg-[#10b981] border-4 border-black text-black font-black text-sm uppercase hover:bg-green-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                 >
                   CONFIRM UPLOAD
                 </button>
               </div>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        <AnimatePresence>
        {previewMedia && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.4, duration: 0.4 }}
              className="w-full max-w-2xl bg-[#d6d3d1] border-[8px] border-[#1a1a1a] shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] flex flex-col relative overflow-hidden"
            >
               <div className="scanlines absolute inset-0 pointer-events-none opacity-20 z-10"></div>
               <div className="h-12 bg-black flex items-center justify-between px-4 border-b-4 border-white/20 relative z-20">
                 <span className="text-[#3b82f6] font-black tracking-widest uppercase flex items-center gap-2">
                   {previewMedia.type === 'record' ? <FileText size={16} /> : <ImageIcon size={16}/>}
                   DATASET PREVIEW: {previewMedia.type === 'record' ? previewMedia.record.name : `VISUAL_${previewMedia.photo.date.replace(/\//g, '')}`}
                 </span>
                 <button onClick={() => setPreviewMedia(null)} className="w-6 h-6 bg-red-600 border-2 border-white flex items-center justify-center text-white font-bold hover:bg-red-500 shadow-[2px_2px_0px_0px_rgba(255,255,255,0.5)] active:translate-y-[1px] active:translate-x-[1px] active:shadow-none transition-all cursor-pointer hover:-translate-y-[2px] hover:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.5)] z-20 text-xs">X</button>
               </div>
               
               <div className="p-4 bg-[#e7e5e4] flex flex-col relative z-20">
                 {previewMedia.type === 'record' ? (
                   <div className="aspect-[3/4] w-full max-h-[60vh] bg-white border-2 border-black flex flex-col p-8 relative overflow-hidden">
                     {/* Document Header */}
                     <div className="border-b-4 border-black pb-4 mb-4 flex justify-between items-end">
                       <div>
                         <h2 className="text-3xl font-black uppercase">{activePet?.name}</h2>
                         <p className="text-sm font-bold opacity-60">ID: {activePet?.id.toUpperCase()}</p>
                       </div>
                       <div className="text-right">
                         <div className="text-xl font-black">{previewMedia.record.name}</div>
                         <div className="text-sm font-bold opacity-60">DATE: {previewMedia.record.date}</div>
                       </div>
                     </div>
                     {/* Document Content Stub */}
                     <div className="flex-1 flex flex-col gap-4">
                       <div className="h-4 bg-black/10 w-full animate-pulse"></div>
                       <div className="h-4 bg-black/10 w-5/6 animate-pulse" style={{ animationDelay: '0.1s'}}></div>
                       <div className="h-4 bg-black/10 w-full animate-pulse" style={{ animationDelay: '0.2s'}}></div>
                       <div className="h-4 bg-black/10 w-4/5 animate-pulse" style={{ animationDelay: '0.3s'}}></div>
                       <div className="mt-8 flex items-center justify-center border-4 border-dashed border-black/20 p-8">
                         {previewMedia.record.iconType === 'pill' ? <Pill size={48} className="opacity-20" /> : <Activity size={48} className="opacity-20" />}
                       </div>
                       <div className="h-4 bg-black/10 w-full animate-pulse mt-auto"></div>
                     </div>
                     {/* Stamped */}
                     <div className="absolute bottom-8 right-8 text-red-500 font-black text-4xl border-4 border-red-500 p-2 transform -rotate-12 opacity-80 pointer-events-none">VERIFIED</div>
                   </div>
                 ) : (
                   <div className="w-full max-h-[60vh] h-[500px] bg-black border-2 border-black flex items-center justify-center p-2">
                     <img src={previewMedia.photo.url} alt="Specimen Visual Data" className="max-w-full max-h-full object-contain border-2 border-white/20" />
                   </div>
                 )}
               </div>
            </motion.div>
          </div>
        )}
        </AnimatePresence>

          </motion.div>
        )}
      </AnimatePresence>

      </div>
    </div>
  );
}

