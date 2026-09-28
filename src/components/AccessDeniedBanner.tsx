import React from 'react';
import { ShieldAlert, Lock, ArrowLeft, LogIn } from 'lucide-react';
import { UserRole } from '../types';

interface AccessDeniedBannerProps {
  requiredRole: string;
  currentRole: UserRole;
  onGoBack: () => void;
  onLoginPrompt?: () => void;
}

export const AccessDeniedBanner: React.FC<AccessDeniedBannerProps> = ({
  requiredRole,
  currentRole,
  onGoBack,
  onLoginPrompt,
}) => {
  return (
    <div className="max-w-2xl mx-auto my-12 p-8 rounded-3xl bg-slate-900 border border-rose-500/30 shadow-2xl text-center relative overflow-hidden animate-in fade-in">
      <div className="absolute top-0 right-0 w-64 h-64 bg-rose-600/10 blur-3xl pointer-events-none" />

      <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mb-5 shadow-lg shadow-rose-950/40">
        <Lock className="w-8 h-8" />
      </div>

      <span className="px-3 py-1 text-[11px] font-mono font-bold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 inline-block mb-3">
        HTTP 403 • ACCESS DENIED
      </span>

      <h2 className="text-2xl font-bold text-white tracking-tight mb-2">
        Restricted Command Resource
      </h2>

      <p className="text-slate-300 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed mb-6">
        You do not have the required security clearance to access this module. 
        This section is restricted to personnel holding authorized <span className="text-rose-400 font-semibold">{requiredRole}</span> credentials.
      </p>

      <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs font-mono text-slate-400 max-w-md mx-auto mb-6 text-left space-y-1.5">
        <div className="flex justify-between">
          <span>Active Role:</span>
          <span className="text-amber-400 font-bold">{currentRole}</span>
        </div>
        <div className="flex justify-between">
          <span>Required Clearance:</span>
          <span className="text-rose-400 font-bold">{requiredRole}</span>
        </div>
        <div className="flex justify-between">
          <span>Policy Enforcement:</span>
          <span className="text-slate-300">RBAC Token Authorization</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={onGoBack}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Permitted Dashboard</span>
        </button>

        {onLoginPrompt && (
          <button
            onClick={onLoginPrompt}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-950/50 transition flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In with Authorized Account</span>
          </button>
        )}
      </div>
    </div>
  );
};
