import React, { useState, useEffect } from 'react';
import { AuditLogEntry, CurrentUser, UserRole } from '../types';
import { 
  ShieldCheck, ShieldAlert, Lock, User, RefreshCw, 
  Download, Filter, Search, CheckCircle2, XCircle, AlertTriangle 
} from 'lucide-react';

interface SecurityAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: CurrentUser;
}

export const SecurityAuditModal: React.FC<SecurityAuditModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [filterOutcome, setFilterOutcome] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [forbiddenMessage, setForbiddenMessage] = useState<string | null>(null);

  const isAuthorized = currentUser.role === 'ADMIN';

  useEffect(() => {
    if (isOpen && isAuthorized) {
      loadAuditLogs();
    }
  }, [isOpen, currentUser.role, isAuthorized]);

  const loadAuditLogs = async () => {
    setIsLoading(true);
    setForbiddenMessage(null);
    try {
      const res = await fetch('/api/audit-logs', {
        headers: {
          'x-user-role': currentUser.role,
          'x-user-name': currentUser.name,
          'x-user-id': currentUser.id,
        },
      });

      if (res.status === 403) {
        const err = await res.json();
        setForbiddenMessage(err.message || 'Access Forbidden (HTTP 403): Audit log inspection is restricted to System Administrators.');
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.auditLogs || []);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredLogs = auditLogs.filter((log) => {
    if (filterOutcome !== 'ALL' && log.outcome !== filterOutcome) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.actorName.toLowerCase().includes(q) ||
      log.actorRole.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      (log.resourceId && log.resourceId.toLowerCase().includes(q))
    );
  });

  const exportLogsAsJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `findsafe-audit-trail-${new Date().toISOString()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // RBAC Matrix Table Definitions
  const rbacMatrix = [
    { capability: 'View Public Case Registry & Alerts', public: true, inv: true, admin: true },
    { capability: 'Submit Public Sighting Reports', public: true, inv: true, admin: true },
    { capability: 'AI Age Progression Simulation', public: false, inv: true, admin: true },
    { capability: 'Duplicate Case Detection & Merging', public: false, inv: true, admin: true },
    { capability: 'Dispatch Emergency Broadcasts (WEA/Signage)', public: false, inv: false, admin: true },
    { capability: 'Inspect System Audit Logs & Forensics', public: false, inv: false, admin: true },
    { capability: 'System Configuration & User Management', public: false, inv: false, admin: true },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-5xl w-full p-6 space-y-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Security Architecture & RBAC Audit Trail
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                CJIS COMPLIANT
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Cryptographic audit logging, role permissions matrix, and backend authorization telemetry.
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/80 transition"
          >
            ✕
          </button>
        </div>

        {/* Current Active Persona Status */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-sm">
              {currentUser.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">{currentUser.name}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {currentUser.role}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Badge #{currentUser.badgeNumber || 'N/A'} • {currentUser.organization}
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-400">
            Backend Authorization: <strong className="text-emerald-400">Enforced via Express Middleware (HTTP 403)</strong>
          </div>
        </div>

        {/* RBAC Capabilities Matrix Table */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-white uppercase tracking-wider block">
            Role-Based Access Control (RBAC) Permission Matrix
          </span>
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 border-b border-slate-800 text-[11px] font-mono text-slate-400">
                <tr>
                  <th className="p-3">Platform Capability</th>
                  <th className="p-3 text-center">PUBLIC_USER</th>
                  <th className="p-3 text-center">INVESTIGATOR</th>
                  <th className="p-3 text-center">ADMIN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {rbacMatrix.map((row, i) => (
                   <tr key={i} className="hover:bg-slate-900/40">
                     <td className="p-3 font-medium text-white">{row.capability}</td>
                     <td className="p-3 text-center">
                       {row.public ? <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-600 mx-auto" />}
                     </td>
                     <td className="p-3 text-center">
                       {row.inv ? <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-600 mx-auto" />}
                     </td>
                     <td className="p-3 text-center">
                       {row.admin ? <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-600 mx-auto" />}
                     </td>
                   </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Log Section */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-white uppercase tracking-wider block">
                Security Audit Log Stream ({auditLogs.length} Events)
              </span>
              <p className="text-[11px] text-slate-400">
                Every sensitive query, perimeter breach, age progression, and authorization block is permanently logged.
              </p>
            </div>

            {isAuthorized && (
              <div className="flex items-center gap-2">
                <button
                  onClick={loadAuditLogs}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  title="Refresh Audit Logs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={exportLogsAsJson}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Export JSON</span>
                </button>
              </div>
            )}
          </div>

          {!isAuthorized ? (
            <div className="p-8 text-center bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <Lock className="w-8 h-8 text-amber-400 mx-auto" />
              <h4 className="text-sm font-bold text-white">Audit Log Restricted</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Direct inspection of cryptographic server audit logs is restricted to Administrators.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Search & Filter bar */}
              <div className="flex flex-col sm:flex-row gap-2 text-xs">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search logs by action, actor, role, or resource..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  {['ALL', 'SUCCESS', 'FORBIDDEN'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setFilterOutcome(status)}
                      className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold border transition ${
                        filterOutcome === status
                          ? status === 'FORBIDDEN'
                            ? 'bg-rose-600/30 text-rose-300 border-rose-500/50'
                            : 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Logs Stream Table */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-900 border-b border-slate-800 text-[10px] text-slate-400 sticky top-0">
                    <tr>
                      <th className="p-2.5">Timestamp</th>
                      <th className="p-2.5">Actor</th>
                      <th className="p-2.5">Action</th>
                      <th className="p-2.5">Outcome</th>
                      <th className="p-2.5">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-[11px]">
                    {filteredLogs.map((log) => {
                      const isForbidden = log.outcome === 'FORBIDDEN';

                      return (
                        <tr
                          key={log.id}
                          className={`hover:bg-slate-900/50 ${
                            isForbidden ? 'bg-rose-950/20 text-rose-300' : 'text-slate-300'
                          }`}
                        >
                          <td className="p-2.5 text-slate-500 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </td>
                          <td className="p-2.5 whitespace-nowrap font-bold text-white">
                            {log.actorName} <span className="text-[10px] text-slate-400">({log.actorRole})</span>
                          </td>
                          <td className="p-2.5 whitespace-nowrap">
                            <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-200 border border-slate-700">
                              {log.action}
                            </span>
                          </td>
                          <td className="p-2.5 whitespace-nowrap">
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                isForbidden
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              }`}
                            >
                              {log.outcome}
                            </span>
                          </td>
                          <td className="p-2.5 text-slate-400 max-w-xs truncate" title={log.details}>
                            {log.details}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
