import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Terminal, Trash2, Plus, Bell, BellOff } from 'lucide-react';
import { Pet } from './data';

export interface AlertItem {
  id: string;
  type: string;
  time: string;
  description: string;
  petId: string;
}

export const defaultAlertTypes = [
  'WALK TIME',
  'FOOD TIME',
  'VET APPOINTMENT',
  'VACCINATION',
  'GROOMING',
  'MEDICATION',
  'FLEA TREATMENT'
];

export const AlertsScreen = ({ pets, alerts, setAlerts, onBack }: { pets: Pet[], alerts: AlertItem[], setAlerts: (alerts: AlertItem[]) => void, onBack: () => void }) => {
  const [newAlertType, setNewAlertType] = useState(defaultAlertTypes[0]);

  const [newAlertTime, setNewAlertTime] = useState('');
  const [newAlertDesc, setNewAlertDesc] = useState('');
  const [newAlertPetId, setNewAlertPetId] = useState(pets[0]?.id || '');
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const handleRequestPermission = () => {
    if ('Notification' in window) {
      try {
        Notification.requestPermission().then(perm => {
          setPermission(perm);
          if (perm !== 'granted') {
             alert('Notification permission was denied. Please allow it in your browser settings.');
          }
        }).catch(err => {
          console.error(err);
          alert('Push notifications could not be enabled. Please try opening the app in a new tab.');
        });
      } catch (err) {
         console.error(err);
         alert('Push notifications could not be enabled. Please try opening the app in a new tab.');
      }
    } else {
      alert("Push notifications are not supported in this browser.");
    }
  };

  const handleAddAlert = () => {
    if (!newAlertTime) return;
    const newAlert: AlertItem = {
      id: Date.now().toString(),
      type: newAlertType,
      time: newAlertTime,
      description: newAlertDesc,
      petId: newAlertPetId
    };
    setAlerts([...alerts, newAlert]);
    setNewAlertTime('');
    setNewAlertDesc('');
  };

  const handleDeleteAlert = (id: string) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  return (
    <motion.div
      key="alertsscreen"
      initial={{ scale: 1.1, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      className="absolute inset-[12px] z-40 flex items-center justify-center p-4 overflow-hidden border-[8px] border-[#d6d3d1] shadow-[inset_0_0_50px_rgba(0,0,0,1)] bg-[#292524]"
    >
      {/* Pet Registry Background */}
      <div className="absolute inset-0 bg-[#292524] opacity-40 mix-blend-multiply pointer-events-none"></div>
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '4px 4px' }}></div>
      <div className="scanlines absolute inset-0 pointer-events-none opacity-20 z-0"></div>

      {/* Floating Metal Screen */}
      <motion.div 
        initial={{ y: 50, scale: 0.9, rotateX: 10 }}
        animate={{ y: 0, scale: 1, rotateX: 0 }}
        transition={{ duration: 0.6, type: 'spring', bounce: 0.4 }}
        className="w-full max-w-4xl bg-[#111] border-8 border-[#444] shadow-[0_0_50px_rgba(34,197,94,0.3),inset_0_0_20px_rgba(0,0,0,1)] relative z-10 flex flex-col max-h-[90vh] perspective-1000"
        style={{
          boxShadow: 'inset 0 0 40px #000, 0 20px 50px rgba(0,0,0,0.8), 0 0 0 4px #222'
        }}
      >
        {/* Metal Bezel Details */}
        <div className="absolute top-2 left-2 w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_#ef4444]"></div>
        <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-[#444] shadow-inner"></div>
        <div className="absolute bottom-2 left-2 w-3 h-3 rounded-full bg-[#444] shadow-inner"></div>
        <div className="absolute bottom-2 right-2 w-3 h-3 rounded-full bg-[#444] shadow-inner"></div>
        
        {/* Header Bar */}
        <div className="h-16 border-b-4 border-[#333] flex items-center justify-between px-8 bg-gradient-to-r from-[#222] to-[#111]">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-black text-[#22c55e] uppercase tracking-widest flex items-center gap-3 drop-shadow-[0_0_8px_#22c55e]">
              <Terminal size={24} />
              SYSTEM_ALERTS
            </h1>
            <button
              onClick={handleRequestPermission}
              className={`flex items-center gap-2 px-3 py-1 text-xs font-mono font-bold uppercase transition-colors cursor-pointer ${
                permission === 'granted' 
                  ? 'text-[#22c55e] bg-[#22c55e]/10 border border-[#22c55e]' 
                  : 'text-gray-400 bg-black border border-gray-600 hover:text-white hover:border-gray-400'
              }`}
            >
              {permission === 'granted' ? <Bell size={14} /> : <BellOff size={14} />}
              {permission === 'granted' ? 'PUSH_ENABLED' : 'ENABLE_PUSH'}
            </button>
          </div>
          <button
            onClick={onBack}
            className="h-10 px-4 bg-[#333] border-2 border-[#555] text-white font-bold text-sm uppercase hover:bg-[#444] active:bg-[#222] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg"
          >
            <ArrowLeft size={16} /> RETURN
          </button>
        </div>

        {/* Console / Text Box Area */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0">
          {/* Left: Input Console */}
          <div className="md:w-1/3 border-b-4 md:border-b-0 md:border-r-4 border-[#333] p-6 flex flex-col gap-6 bg-[#0a0a0a]">
            <div className="flex flex-col gap-2">
              <label className="text-[#22c55e] text-xs font-mono font-bold tracking-widest">
                &gt; SELECT_UNIT
              </label>
              <select 
                value={newAlertPetId}
                onChange={e => setNewAlertPetId(e.target.value)}
                className="bg-black border-2 border-[#22c55e] text-[#22c55e] p-2 font-mono text-sm focus:outline-none focus:shadow-[0_0_10px_#22c55e]"
              >
                {pets.map(p => <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[#22c55e] text-xs font-mono font-bold tracking-widest">
                &gt; ALERT_TYPE
              </label>
              <select 
                value={newAlertType}
                onChange={e => setNewAlertType(e.target.value)}
                className="bg-black border-2 border-[#22c55e] text-[#22c55e] p-2 font-mono text-sm focus:outline-none focus:shadow-[0_0_10px_#22c55e]"
              >
                {defaultAlertTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[#22c55e] text-xs font-mono font-bold tracking-widest">
                &gt; TIME_PARAMS
              </label>
              <input 
                type="text"
                placeholder="e.g. DAILY 18:00 or 10/25 09:00"
                value={newAlertTime}
                onChange={e => setNewAlertTime(e.target.value)}
                className="bg-black border-2 border-[#22c55e] text-[#22c55e] p-2 font-mono text-sm focus:outline-none focus:shadow-[0_0_10px_#22c55e] placeholder:text-[#22c55e]/30"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[#22c55e] text-xs font-mono font-bold tracking-widest">
                &gt; DESCRIPTION (OPTIONAL)
              </label>
              <input 
                type="text"
                placeholder="..."
                value={newAlertDesc}
                onChange={e => setNewAlertDesc(e.target.value)}
                className="bg-black border-2 border-[#22c55e] text-[#22c55e] p-2 font-mono text-sm focus:outline-none focus:shadow-[0_0_10px_#22c55e] placeholder:text-[#22c55e]/30"
              />
            </div>

            <button 
              onClick={handleAddAlert}
              className="mt-auto h-12 bg-[#22c55e]/20 border-2 border-[#22c55e] text-[#22c55e] font-mono font-bold hover:bg-[#22c55e] hover:text-black hover:shadow-[0_0_15px_#22c55e] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus size={18} /> INSTALL_ROUTINE
            </button>
          </div>

          {/* Right: Active Alerts Log */}
          <div className="md:w-2/3 p-6 bg-black flex flex-col font-mono overflow-hidden">
            <div className="text-[#22c55e] text-sm font-bold tracking-widest mb-4 pb-2 border-b-2 border-[#22c55e]/30 flex justify-between">
              <span>ACTIVE_DIRECTIVES</span>
              <span>[{alerts.length}]</span>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 pr-2">
              <AnimatePresence>
                {alerts.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="text-[#22c55e]/50 italic text-sm mt-4 text-center"
                  >
                    NO ACTIVE DIRECTIVES LOGGED. AWAITING INPUT...
                  </motion.div>
                ) : (
                  alerts.map(alert => {
                    const pet = pets.find(p => p.id === alert.petId);
                    return (
                      <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20, scale: 0.95 }}
                        className="bg-[#22c55e]/10 border border-[#22c55e]/50 p-4 flex justify-between items-start group hover:bg-[#22c55e]/20 hover:border-[#22c55e] transition-all"
                      >
                        <div className="flex flex-col gap-1">
                          <div className="text-[#22c55e] font-bold flex items-center gap-2 text-sm">
                            <span className="opacity-50">[{pet?.name.toUpperCase()}]</span> 
                            <span className="drop-shadow-[0_0_2px_#22c55e]">{alert.type}</span>
                          </div>
                          <div className="text-[#22c55e] text-xs">
                            <span className="opacity-50">T: </span> {alert.time}
                          </div>
                          {alert.description && (
                            <div className="text-[#22c55e]/70 text-xs italic mt-1 font-sans">
                              "{alert.description}"
                            </div>
                          )}
                        </div>
                        <button 
                          onClick={() => handleDeleteAlert(alert.id)}
                          className="text-[#22c55e]/50 hover:text-red-500 hover:drop-shadow-[0_0_5px_#ef4444] transition-all cursor-pointer p-1"
                          title="PURGE_RECORD"
                        >
                          <Trash2 size={16} />
                        </button>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
