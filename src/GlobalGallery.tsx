import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { Pet } from './data';

export const GlobalGallery = ({ pets, onBack }: { pets: Pet[], onBack: () => void }) => {
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string, date: string, petName: string } | null>(null);

  // Filter out pets that do not have photos
  const petsWithPhotos = pets.filter(p => (p as any).photos && (p as any).photos.length > 0);

  return (
    <motion.div
      key="globalgalleryscreen"
      initial={{ scale: 1.1, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      className="absolute inset-[12px] z-40 bg-[#1a1a1a] flex flex-col p-6 overflow-hidden border-[8px] border-[#d6d3d1] shadow-[inset_0_0_50px_rgba(0,0,0,1)]"
    >
      <div className="flex items-center justify-between mb-8 pb-4 border-b-4 border-[#333]">
        <h1 className="text-3xl md:text-5xl font-black text-[#3b82f6] uppercase tracking-widest italic flex items-center gap-4">
          <ImageIcon size={40} className="text-[#3b82f6]" />
          GLOBAL GALLERY
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

        <div className="relative z-10 py-8 flex flex-col gap-12">
          {petsWithPhotos.length === 0 ? (
            <div className="text-center text-[#a8a29e] font-bold text-xl uppercase mt-20">
              NO VISUAL DATA ARCHIVED YET.
            </div>
          ) : (
            petsWithPhotos.map((pet, index) => (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                key={pet.id}
                className="flex flex-col gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-cover bg-center shrink-0" style={{ backgroundImage: `url(${pet.avatarUrl})` }} />
                  <h2 className="text-2xl font-black text-white uppercase tracking-widest px-2 py-1" style={{ backgroundColor: pet.colorHex }}>
                    {pet.name}'S ARCHIVE
                  </h2>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {(pet as any).photos.map((photo: any) => (
                    <motion.div 
                      key={photo.id}
                      whileHover={{ scale: 1.05, rotate: Math.random() * 4 - 2 }}
                      className="aspect-square border-4 border-black bg-[#e7e5e4] shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] relative group overflow-hidden cursor-pointer"
                      onClick={() => setSelectedPhoto({ url: photo.url, date: photo.date, petName: pet.name })}
                    >
                      <div className="absolute inset-0 bg-cover bg-center transition-transform group-hover:scale-110" style={{ backgroundImage: `url(${photo.url})` }}></div>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm p-2 text-center font-bold text-[10px] text-white uppercase truncate">
                        {photo.date}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Full Screen Preview Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative max-w-4xl max-h-[80vh] w-full border-[8px] border-black bg-[#1a1a1a] shadow-[0_0_50px_rgba(0,0,0,0.8)]"
              onClick={e => e.stopPropagation()}
            >
              <div className="h-12 bg-black flex items-center justify-between px-4 border-b-4 border-white/20">
                 <span className="text-white font-black tracking-widest uppercase flex items-center gap-2">
                   <ImageIcon size={16} className="text-[#3b82f6]"/>
                   {selectedPhoto.petName}_VISUAL_{selectedPhoto.date.replace(/\//g, '')}
                 </span>
                 <button onClick={() => setSelectedPhoto(null)} className="w-8 h-8 bg-red-600 border-2 border-white flex items-center justify-center text-white font-bold hover:bg-red-500 shadow-[2px_2px_0px_0px_rgba(255,255,255,0.5)] active:translate-y-[1px] active:translate-x-[1px] active:shadow-none transition-all cursor-pointer z-20 text-sm">X</button>
              </div>
              <div className="p-4 bg-black flex justify-center items-center h-[calc(80vh-3rem)]">
                <img src={selectedPhoto.url} alt="Gallery Preview" className="max-w-full max-h-full object-contain border-4 border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
