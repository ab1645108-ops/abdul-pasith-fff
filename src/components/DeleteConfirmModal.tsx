import React from 'react';
import { MissingPerson } from '../types';
import { AlertTriangle, Trash2, X, ShieldAlert } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: MissingPerson | null;
  onConfirmDelete: (personId: string) => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  person,
  onConfirmDelete,
}) => {
  if (!isOpen || !person) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-rose-900/60 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Delete Case Report</h2>
              <span className="text-[10px] font-mono text-rose-400">
                CASE REF #{person.caseNumber}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Person Card Preview */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
          <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 shrink-0">
            <img src={person.photoUrl} alt={person.name} className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-white truncate">{person.name}</h4>
            <p className="text-xs text-slate-400">
              {person.age} y/o • {person.alertType} Alert • {person.lastSeenLocation.name}
            </p>
            {person.publicTrackingCode && (
              <span className="text-[10px] font-mono text-slate-500 block">
                Tracking: {person.publicTrackingCode}
              </span>
            )}
          </div>
        </div>

        {/* Warning text */}
        <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-200 space-y-1.5 leading-relaxed">
          <div className="flex items-center gap-1.5 font-bold text-rose-300">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>Permanent System-Wide Deletion:</span>
          </div>
          <p>
            Are you sure you want to delete this case report? Once deleted, the case dossier will be <strong>immediately removed from the Public Safety Portal, Investigator Case Registry, and Admin Command Systems</strong>.
          </p>
        </div>

        {/* Action buttons */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold transition"
          >
            Keep Report / Cancel
          </button>

          <button
            type="button"
            onClick={() => {
              onConfirmDelete(person.id);
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-lg shadow-rose-950/50"
          >
            <Trash2 className="w-4 h-4" />
            <span>Confirm & Delete Case</span>
          </button>
        </div>
      </div>
    </div>
  );
};
