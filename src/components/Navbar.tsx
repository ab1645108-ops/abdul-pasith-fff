import React, { useState } from 'react';
import { 
  ShieldAlert, Eye, Users, Compass, Megaphone, MessageSquareText, 
  PlusCircle, Radio, Camera, GitMerge, ShieldCheck, UserCheck, ChevronDown, Lock,
  Sparkles, LogOut, User as UserIcon, UserCog, LogIn
} from 'lucide-react';
import { CurrentUser, UserRole } from '../types';
import { SYSTEM_USERS } from '../data/featureMockData';

interface NavbarProps {
  activeTab: 'scanner' | 'cases' | 'alerts' | 'duplicates' | 'assistant' | 'users';
  setActiveTab: (tab: 'scanner' | 'cases' | 'alerts' | 'duplicates' | 'assistant' | 'users') => void;
  onOpenReportModal: () => void;
  onOpenSightingModal: () => void;
  activeCasesCount: number;
  pendingLeadsCount: number;
  currentUser: CurrentUser;
  onSwitchUser: (user: CurrentUser) => void;
  onOpenAuditModal: () => void;
  onOpenProfileModal?: () => void;
  onOpenAuthModal?: () => void;
  onLogout?: () => void;
  unreadAlertsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenReportModal,
  onOpenSightingModal,
  activeCasesCount,
  pendingLeadsCount,
  currentUser,
  onSwitchUser,
  onOpenAuditModal,
  onOpenProfileModal,
  onOpenAuthModal,
  onLogout,
  unreadAlertsCount = 2,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'INVESTIGATOR':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'CITIZEN':
      case 'PUBLIC_USER':
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    }
  };

  const isPublic = currentUser.role === 'PUBLIC_USER' || currentUser.role === 'CITIZEN';

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-slate-100 shadow-md">
      {/* Emergency Global Ticker Bar */}
      <div className={`border-b px-4 py-1.5 text-xs flex items-center justify-between ${
        isPublic 
          ? 'bg-blue-950/80 border-blue-900/60 text-blue-200' 
          : 'bg-rose-950/80 border-rose-900/60 text-rose-200'
      }`}>
        <div className="flex items-center gap-2 overflow-hidden">
          <span className={`flex h-2 w-2 rounded-full animate-ping shrink-0 ${isPublic ? 'bg-blue-400' : 'bg-rose-500'}`} />
          <span className="font-semibold uppercase tracking-wider text-[11px] shrink-0 font-mono">
            {isPublic ? 'PUBLIC COMMUNITY REPORTING DESK:' : 'CRITICAL SAR COMMAND TERMINAL:'}
          </span>
          <span className="truncate text-xs">
            {isPublic
              ? 'Civilian Access Tier — Report Missing Family, Submit Sighting/Found Person Tips, and Track Case Reference Status.'
              : `4 Active Bulletins | ${activeCasesCount} Active Missing Profiles | Classified Investigation Dossiers & Verification Online`}
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-[11px] shrink-0">
          {!isPublic ? (
            <button
              onClick={onOpenAuditModal}
              className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>RBAC & Audit Trail</span>
            </button>
          ) : (
            <button
              onClick={() => onSwitchUser(SYSTEM_USERS[0])}
              className="flex items-center gap-1.5 text-amber-300 hover:text-amber-200 font-semibold transition"
            >
              <Lock className="w-3 h-3" />
              <span>Investigator Sign-in</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer shrink-0" onClick={() => setActiveTab('cases')}>
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr flex items-center justify-center shadow-lg ${
              isPublic 
                ? 'from-blue-600 to-indigo-500 shadow-blue-900/40' 
                : 'from-rose-600 to-amber-500 shadow-rose-900/40'
            }`}>
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white font-sans">
                  Find<span className={isPublic ? 'text-blue-400' : 'text-rose-400'}>Safe</span>
                </span>
                <span className={`px-2 py-0.5 text-[10px] font-semibold border rounded-full ${
                  isPublic 
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' 
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                }`}>
                  {isPublic ? 'PUBLIC SAFETY PORTAL' : 'SAR OPERATIONS CENTER'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                {isPublic ? 'Citizen Missing Person Registration & Found Tip Desk' : 'Sworn SAR Law Enforcement & AI Forensic Operations'}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden xl:flex items-center gap-1">
            {!isPublic ? (
              <>
                <button
                  id="nav-cases-btn"
                  onClick={() => setActiveTab('cases')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'cases'
                      ? 'bg-rose-600/20 text-rose-300 border border-rose-500/40 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-amber-400" />
                  <span>Cases & Dossiers</span>
                  <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-slate-800 text-slate-300 font-mono">
                    {activeCasesCount}
                  </span>
                </button>

                <button
                  id="nav-scanner-btn"
                  onClick={() => setActiveTab('scanner')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'scanner'
                      ? 'bg-rose-600/20 text-rose-300 border border-rose-500/40 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5 text-rose-400" />
                  <span>AI Matcher</span>
                </button>

                <button
                  id="nav-alerts-btn"
                  onClick={() => setActiveTab('alerts')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'alerts'
                      ? 'bg-rose-600/20 text-rose-300 border border-rose-500/40 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Megaphone className="w-3.5 h-3.5 text-yellow-400" />
                  <span>Alerts Hub</span>
                  {unreadAlertsCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  )}
                </button>

                <button
                  id="nav-duplicates-btn"
                  onClick={() => setActiveTab('duplicates')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'duplicates'
                      ? 'bg-rose-600/20 text-rose-300 border border-rose-500/40 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <GitMerge className="w-3.5 h-3.5 text-purple-400" />
                  <span>Deduplication</span>
                </button>

                <button
                  id="nav-assistant-btn"
                  onClick={() => setActiveTab('assistant')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'assistant'
                      ? 'bg-rose-600/20 text-rose-300 border border-rose-500/40 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <MessageSquareText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>SAR AI</span>
                </button>

                {currentUser.role === 'ADMIN' && (
                  <button
                    id="nav-admin-users-btn"
                    onClick={() => setActiveTab('users')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === 'users'
                        ? 'bg-rose-600/20 text-rose-300 border border-rose-500/40 shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <UserCog className="w-3.5 h-3.5 text-rose-400" />
                    <span>User Management</span>
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab('cases')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activeTab === 'cases'
                      ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40'
                      : 'text-slate-300 hover:text-white hover:bg-slate-850'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />
                  <span>Public Bulletins</span>
                </button>

                <button
                  id="nav-public-aimatch-btn"
                  onClick={() => setActiveTab('scanner')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activeTab === 'scanner'
                      ? 'bg-rose-600/20 text-rose-300 border border-rose-500/40 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-850'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>AI Match Operation</span>
                  <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    LIVE
                  </span>
                </button>

                <button
                  onClick={onOpenReportModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Report Missing</span>
                </button>

                <button
                  onClick={onOpenSightingModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800"
                >
                  <Camera className="w-3.5 h-3.5 text-amber-400" />
                  <span>Found Person / Sighting</span>
                </button>
              </>
            )}
          </nav>

          {/* Right Action Tools & RBAC Switcher */}
          <div className="flex items-center gap-2">
            {/* Direct Profile Button */}
            {onOpenProfileModal && (
              <button
                onClick={onOpenProfileModal}
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs transition"
                title="View / Edit Profile"
              >
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>Profile</span>
              </button>
            )}

            {/* Direct Logout Button */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-rose-300 hover:text-rose-200 border border-slate-700 text-xs transition"
                title="Sign Out / Logout"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span>Logout</span>
              </button>
            )}

            {/* Direct Auth / Sign In Modal Trigger */}
            {onOpenAuthModal && (
              <button
                onClick={onOpenAuthModal}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-semibold transition"
                title="Sign In / Register Account"
              >
                <LogIn className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}

            {/* RBAC Active Persona Selector */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-750 border border-slate-700 text-left transition shadow-sm"
              >
                <div className="w-6 h-6 rounded-lg bg-slate-700 border border-slate-600 flex items-center justify-center text-[10px] font-bold text-slate-200">
                  {currentUser.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="hidden sm:block leading-tight">
                  <span className="text-xs font-semibold text-white block truncate max-w-[110px]">
                    {currentUser.name}
                  </span>
                  <span className={`text-[9px] font-mono px-1 rounded border ${getRoleBadgeColor(currentUser.role)}`}>
                    {currentUser.role}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              {/* Persona Switcher Dropdown */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-2.5 z-50 space-y-2 text-xs">
                  {/* User Profile Header in Menu */}
                  <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs truncate">{currentUser.name}</span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${getRoleBadgeColor(currentUser.role)}`}>
                        {currentUser.role}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono block truncate mt-0.5">{currentUser.email}</span>
                    {currentUser.agency && (
                      <span className="text-[10px] text-slate-500 block truncate mt-0.5">{currentUser.agency}</span>
                    )}

                    <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-slate-800">
                      {onOpenProfileModal && (
                        <button
                          type="button"
                          onClick={() => {
                            onOpenProfileModal();
                            setIsUserMenuOpen(false);
                          }}
                          className="flex-1 py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-center font-semibold text-[11px] flex items-center justify-center gap-1 transition"
                        >
                          <UserIcon className="w-3 h-3 text-slate-400" />
                          <span>View Profile</span>
                        </button>
                      )}
                      {onLogout && (
                        <button
                          type="button"
                          onClick={() => {
                            onLogout();
                            setIsUserMenuOpen(false);
                          }}
                          className="flex-1 py-1 px-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 border border-rose-800/50 text-center font-semibold text-[11px] flex items-center justify-center gap-1 transition"
                        >
                          <LogOut className="w-3 h-3 text-rose-400" />
                          <span>Sign Out</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Admin Shortcut */}
                  {currentUser.role === 'ADMIN' && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('users');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full p-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-750 text-left flex items-center justify-between transition"
                    >
                      <div className="flex items-center gap-2">
                        <UserCog className="w-4 h-4 text-rose-400" />
                        <span className="font-semibold text-xs">Admin User Management</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">RBAC</span>
                    </button>
                  )}

                  {/* Switch Role Simulator Section */}
                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block px-1 mb-1.5">
                      Switch Role Simulator
                    </span>
                    <div className="space-y-1">
                      {SYSTEM_USERS.map((u) => {
                        const isActive = currentUser.id === u.id || (!currentUser.id?.startsWith('usr_custom') && currentUser.role === u.role);
                        const roleTitle = u.role === 'INVESTIGATOR' ? 'Investigator' : u.role === 'ADMIN' ? 'Admin' : 'Public User';
                        const roleDesc = u.role === 'INVESTIGATOR' 
                          ? 'Case Dossiers, Sighting Analysis & Forensics' 
                          : u.role === 'ADMIN' 
                          ? 'Command Center, Audit Logs & Broadcasts' 
                          : 'Public Portal & Community Sighting Reports';
                        return (
                          <button
                            key={u.id}
                            onClick={() => {
                              onSwitchUser(u);
                              setIsUserMenuOpen(false);
                            }}
                            className={`w-full p-2 rounded-xl text-left flex items-start gap-2.5 transition ${
                              isActive
                                ? 'bg-slate-800 border border-slate-600'
                                : 'hover:bg-slate-850 text-slate-400 hover:text-white'
                            }`}
                          >
                            <div className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                              {roleTitle.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-white text-xs truncate">{roleTitle}</span>
                                <span className={`text-[9px] font-mono px-1 rounded border ${getRoleBadgeColor(u.role)}`}>
                                  {u.role}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 truncate">{roleDesc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between px-1">
                    <button
                      onClick={() => {
                        onOpenAuditModal();
                        setIsUserMenuOpen(false);
                      }}
                      className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Inspect Audit Logs</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Sighting CTA */}
            <button
              id="btn-submit-sighting-nav"
              onClick={onOpenSightingModal}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Report an eyewitness sighting"
            >
              <Camera className="w-3.5 h-3.5 text-amber-400" />
              <span>Sighting</span>
              {pendingLeadsCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400" />
              )}
            </button>

            {/* Report Missing CTA */}
            <button
              id="btn-report-missing-nav"
              onClick={onOpenReportModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-900/30 transition active:scale-95"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Report Missing</span>
              <span className="sm:hidden">Report</span>
            </button>
          </div>
        </div>

        {/* Responsive Secondary Scrollable Sub-Navigation */}
        <div className="flex xl:hidden items-center justify-start py-2 border-t border-slate-800/80 text-xs overflow-x-auto gap-1.5">
          {!isPublic ? (
            <>
              <button
                onClick={() => setActiveTab('cases')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg shrink-0 ${
                  activeTab === 'cases' ? 'bg-rose-600/30 text-rose-300 font-bold' : 'text-slate-400'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Cases ({activeCasesCount})</span>
              </button>
              <button
                onClick={() => setActiveTab('scanner')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg shrink-0 ${
                  activeTab === 'scanner' ? 'bg-rose-600/30 text-rose-300 font-bold' : 'text-slate-400'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>AI Match</span>
              </button>
              <button
                onClick={() => setActiveTab('alerts')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg shrink-0 ${
                  activeTab === 'alerts' ? 'bg-rose-600/30 text-rose-300 font-bold' : 'text-slate-400'
                }`}
              >
                <Megaphone className="w-3.5 h-3.5" />
                <span>Alerts Hub</span>
              </button>
              <button
                onClick={() => setActiveTab('duplicates')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg shrink-0 ${
                  activeTab === 'duplicates' ? 'bg-rose-600/30 text-rose-300 font-bold' : 'text-slate-400'
                }`}
              >
                <GitMerge className="w-3.5 h-3.5" />
                <span>Deduplication</span>
              </button>
              <button
                onClick={() => setActiveTab('assistant')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg shrink-0 ${
                  activeTab === 'assistant' ? 'bg-rose-600/30 text-rose-300 font-bold' : 'text-slate-400'
                }`}
              >
                <MessageSquareText className="w-3.5 h-3.5" />
                <span>SAR AI</span>
              </button>

              {currentUser.role === 'ADMIN' && (
                <button
                  onClick={() => setActiveTab('users')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg shrink-0 ${
                    activeTab === 'users' ? 'bg-rose-600/30 text-rose-300 font-bold' : 'text-slate-400'
                  }`}
                >
                  <UserCog className="w-3.5 h-3.5" />
                  <span>Users</span>
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={() => setActiveTab('cases')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg shrink-0 ${
                  activeTab === 'cases' ? 'bg-blue-600/30 text-blue-300 font-bold' : 'text-slate-400'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Bulletins</span>
              </button>
              <button
                onClick={() => setActiveTab('scanner')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg shrink-0 ${
                  activeTab === 'scanner' ? 'bg-rose-600/30 text-rose-300 font-bold' : 'text-slate-400'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>AI Match</span>
              </button>
              <button
                onClick={onOpenReportModal}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg shrink-0 text-rose-300 bg-rose-950/40 border border-rose-800"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Report</span>
              </button>
              <button
                onClick={onOpenSightingModal}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg shrink-0 text-amber-300 bg-amber-950/40 border border-amber-800"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Found Tip</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
