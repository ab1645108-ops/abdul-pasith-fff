import React, { useState, useEffect } from 'react';
import { SystemAlert, SystemAlertType, MissingPerson, CurrentUser } from '../types';
import { 
  Megaphone, Bell, ShieldAlert, Radio, AlertTriangle, CheckCircle2, 
  Send, Volume2, VolumeX, Filter, Eye, Lock, Layers, Smartphone 
} from 'lucide-react';

interface AlertsHubProps {
  missingPersons: MissingPerson[];
  currentUser: CurrentUser;
  onSelectPerson?: (person: MissingPerson) => void;
  onGenerateFlyer?: (person: MissingPerson) => void;
}

export const AlertsHub: React.FC<AlertsHubProps> = ({
  missingPersons,
  currentUser,
  onSelectPerson,
  onGenerateFlyer,
}) => {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [deliveryReceipt, setDeliveryReceipt] = useState<any | null>(null);
  const [forbiddenMessage, setForbiddenMessage] = useState<string | null>(null);

  // Broadcast Form State
  const [bcastTitle, setBcastTitle] = useState('');
  const [bcastMessage, setBcastMessage] = useState('');
  const [bcastType, setBcastType] = useState<SystemAlertType>('AMBER_ALERT');
  const [bcastSeverity, setBcastSeverity] = useState<'CRITICAL' | 'HIGH' | 'INFO'>('CRITICAL');
  const [bcastPersonId, setBcastPersonId] = useState<string>(missingPersons[0]?.id || '');
  const [bcastChannels, setBcastChannels] = useState<string[]>([
    'WEA Cellular',
    'CHP Highway Signage',
    'CAD Dispatch',
  ]);
  const [bcastAudience, setBcastAudience] = useState<'PUBLIC' | 'FIRST_RESPONDERS' | 'INVESTIGATORS'>('PUBLIC');

  const isAuthorizedToBroadcast = currentUser.role === 'ADMIN';

  useEffect(() => {
    loadAlerts();
  }, [currentUser.role]);

  const loadAlerts = async () => {
    try {
      const res = await fetch('/api/alerts', {
        headers: {
          'x-user-role': currentUser.role,
          'x-user-name': currentUser.name,
          'x-user-id': currentUser.id,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
      }
    } catch (err) {
      console.error('Failed to load alerts:', err);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/alerts/${id}/read`, { method: 'PATCH' });
      if (res.ok) {
        setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, isRead: true } : a)));
      }
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
  };

  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      // Audio context may require user gesture
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setForbiddenMessage(null);
    setDeliveryReceipt(null);

    const linkedPerson = missingPersons.find((p) => p.id === bcastPersonId);

    try {
      const res = await fetch('/api/alerts/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser.role,
          'x-user-name': currentUser.name,
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          type: bcastType,
          severity: bcastSeverity,
          title: bcastTitle,
          message: bcastMessage,
          personId: bcastPersonId || undefined,
          personName: linkedPerson?.name || undefined,
          locationName: linkedPerson?.lastSeenLocation.name || 'Regional Broadcast Area',
          channels: bcastChannels,
          targetAudience: bcastAudience,
        }),
      });

      if (res.status === 403) {
        const err = await res.json();
        setForbiddenMessage(err.message || 'Access Denied (HTTP 403): Only System Administrators or Dispatch Commanders can issue emergency broadcasts.');
        return;
      }

      if (!res.ok) {
        throw new Error('Failed to dispatch broadcast.');
      }

      const data = await res.json();
      if (data.alert) {
        setAlerts((prev) => [data.alert, ...prev]);
        setDeliveryReceipt(data.broadcastDeliveryStats);
        playChime();
        setBcastTitle('');
        setBcastMessage('');
      }
    } catch (err: any) {
      console.error('Broadcast error:', err);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filterSeverity === 'ALL') return true;
    return a.severity === filterSeverity;
  });

  const getAlertBadge = (type: SystemAlertType) => {
    switch (type) {
      case 'AMBER_ALERT':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">AMBER ALERT</span>;
      case 'SILVER_ALERT':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">SILVER ALERT</span>;
      case 'HIGH_CONFIDENCE_SIGHTING':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">SIGHTING MATCH</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">INCIDENT ALERT</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <Megaphone className="w-5 h-5" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Real-Time Incident & Broadcast Alerts Hub
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                FEATURE 4 ACTIVE
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Centralized emergency communications, Wireless Emergency Alerts (WEA), and field incident stream.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title={soundEnabled ? 'Mute Alert Sound' : 'Enable Alert Sound'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>

            <button
              id="btn-dispatch-emergency-broadcast"
              onClick={() => setIsBroadcastModalOpen(true)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-md ${
                isAuthorizedToBroadcast
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {isAuthorizedToBroadcast ? <Send className="w-4 h-4" /> : <Lock className="w-4 h-4 text-amber-400" />}
              <span>{isAuthorizedToBroadcast ? 'Dispatch Broadcast' : 'Dispatch Broadcast (Admin Only)'}</span>
            </button>
          </div>
        </div>
      </div>

      {forbiddenMessage && (
        <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{forbiddenMessage}</span>
        </div>
      )}

      {/* Delivery Receipt Confirmation Banner */}
      {deliveryReceipt && (
        <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-800/80 text-emerald-200 text-xs flex items-start justify-between gap-4 animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="text-sm font-bold text-white block">
                Regional Emergency Broadcast Transmitted Successfully
              </strong>
              <p className="opacity-90">
                Dispatched across cellular towers, Department of Transportation signage, and CAD mobile dispatch terminals.
              </p>
              <div className="flex flex-wrap gap-4 text-[11px] font-mono text-emerald-300 pt-1">
                <span>• Est. Cellular Devices Paged: <strong>{deliveryReceipt.devicesNotifiedEst.toLocaleString()}</strong></span>
                <span>• Police Patrol CAD Units Paged: <strong>{deliveryReceipt.firstResponderUnitsPaged}</strong></span>
                <span>• Broadcast Time: {new Date(deliveryReceipt.broadcastTimestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setDeliveryReceipt(null)}
            className="text-emerald-400 hover:text-white font-mono text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter and Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-slate-400">Filter Severity:</span>
          {['ALL', 'CRITICAL', 'HIGH', 'INFO'].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold border transition ${
                filterSeverity === sev
                  ? 'bg-rose-600/30 text-rose-300 border-rose-500/50'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        <button
          onClick={handleMarkAllRead}
          className="text-slate-400 hover:text-white text-xs underline font-medium self-start sm:self-auto"
        >
          Mark all as read
        </button>
      </div>

      {/* Alerts Stream Grid */}
      <div className="space-y-3">
        {filteredAlerts.map((alert) => {
          const isCritical = alert.severity === 'CRITICAL';
          const isHigh = alert.severity === 'HIGH';

          return (
            <div
              key={alert.id}
              className={`p-4 rounded-2xl border transition-all text-xs space-y-2 relative ${
                !alert.isRead
                  ? isCritical
                    ? 'bg-rose-950/30 border-rose-800/80 shadow-lg shadow-rose-950/20'
                    : 'bg-slate-900 border-slate-700'
                  : 'bg-slate-950 border-slate-800/80 opacity-75'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {getAlertBadge(alert.type)}
                  <h3 className="text-sm font-bold text-white leading-tight">{alert.title}</h3>
                  {!alert.isRead && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                  )}
                </div>

                <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                  <span>{new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span>•</span>
                  <span>{new Date(alert.timestamp).toLocaleDateString()}</span>
                  {!alert.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(alert.id)}
                      className="ml-2 text-rose-400 hover:underline"
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              </div>

              <p className="text-slate-200 text-xs leading-relaxed">
                {alert.message}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <span>Broadcast Channels:</span>
                  <div className="flex gap-1.5">
                    {alert.broadcastChannels?.map((ch) => (
                      <span key={ch} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                        {ch}
                      </span>
                    ))}
                  </div>
                </div>

                {alert.personName && (
                  <span className="font-mono text-slate-300">
                    Case Subject: <strong className="text-rose-400">{alert.personName}</strong>
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {filteredAlerts.length === 0 && (
          <div className="p-10 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400">
            No alerts found matching the selected severity level.
          </div>
        )}
      </div>

      {/* Broadcast Dispatch Modal */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Radio className="w-4 h-4 text-rose-400" />
                  Dispatch Regional Emergency Alert Broadcast
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Authorized Commander Console: Wireless Emergency Alerts (WEA) & Highway Signage
                </p>
              </div>
              <button
                onClick={() => setIsBroadcastModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Alert Headline</label>
                <input
                  type="text"
                  required
                  value={bcastTitle}
                  onChange={(e) => setBcastTitle(e.target.value)}
                  placeholder="e.g., URGENT AMBER ALERT: 7 y/o Male Sighted Near Roseville Transit Depot"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Alert Protocol</label>
                  <select
                    value={bcastType}
                    onChange={(e) => setBcastType(e.target.value as SystemAlertType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-rose-500"
                  >
                    <option value="AMBER_ALERT">AMBER Alert (Child)</option>
                    <option value="SILVER_ALERT">Silver Alert (Senior / Dementia)</option>
                    <option value="HIGH_CONFIDENCE_SIGHTING">Verified Eyewitness Sighting</option>
                    <option value="CASE_UPDATE">Case Update Bulletin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Severity Level</label>
                  <select
                    value={bcastSeverity}
                    onChange={(e) => setBcastSeverity(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-rose-500"
                  >
                    <option value="CRITICAL">CRITICAL (Immediate Siren / WEA)</option>
                    <option value="HIGH">HIGH Priority</option>
                    <option value="INFO">Informational Bulletin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Linked Missing Person Profile</label>
                <select
                  value={bcastPersonId}
                  onChange={(e) => setBcastPersonId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-rose-500"
                >
                  <option value="">-- General Incident Alert --</option>
                  {missingPersons.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} (#{p.caseNumber})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Broadcast Message Body (under 180 chars recommended for WEA)</label>
                <textarea
                  rows={3}
                  required
                  value={bcastMessage}
                  onChange={(e) => setBcastMessage(e.target.value)}
                  placeholder="Missing child last seen wearing yellow raincoat. Unidentified grey SUV seen nearby. Report sightings immediately if seen."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Transmission Channels</label>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {['WEA Cellular', 'CHP Highway Signage', 'CAD Dispatch', 'Social Media Feeds'].map((ch) => {
                    const checked = bcastChannels.includes(ch);
                    return (
                      <label key={ch} className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setBcastChannels((prev) =>
                              checked ? prev.filter((c) => c !== ch) : [...prev, ch]
                            );
                          }}
                          className="accent-rose-500"
                        />
                        <span className="text-slate-200">{ch}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBroadcastModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isAuthorizedToBroadcast}
                  className={`px-4 py-2 rounded-xl text-white font-bold flex items-center gap-1.5 ${
                    isAuthorizedToBroadcast ? 'bg-rose-600 hover:bg-rose-500' : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Transmit Broadcast Alert</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
