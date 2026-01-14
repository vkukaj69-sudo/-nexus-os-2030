
import React from 'react';
import { AlertTriangle, X, ShieldAlert } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'danger' | 'warning';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  type = 'danger'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-md glass-card bg-black border-2 border-white/10 shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden rounded-[3rem] animate-in zoom-in-95 duration-300">
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="p-10 space-y-8">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-2xl ${
              type === 'danger' ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
            }`}>
              {type === 'danger' ? <ShieldAlert size={40} /> : <AlertTriangle size={40} />}
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white uppercase tracking-tight leading-none">{title}</h3>
              <p className="text-gray-400 font-medium leading-relaxed">{message}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`w-full py-4 rounded-2xl font-black text-[12px] uppercase tracking-widest transition-all shadow-xl ${
                type === 'danger' 
                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/20' 
                  : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20'
              }`}
            >
              {confirmLabel}
            </button>
            <button
              onClick={onClose}
              className="w-full py-4 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 rounded-2xl font-black text-[12px] uppercase tracking-widest transition-all"
            >
              {cancelLabel}
            </button>
          </div>
        </div>

        <div className="p-4 bg-white/[0.02] border-t border-white/5 text-center">
           <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.4em]">Neural Authorization Required</p>
        </div>
      </div>
    </div>
  );
};
