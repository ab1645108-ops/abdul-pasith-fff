import React, { useState, useEffect } from 'react';
import { MissingPerson, SightingLead, CurrentUser, AgeProgressionRecord, UserAccount } from './types';
import { INITIAL_MISSING_PERSONS, INITIAL_SIGHTINGS } from './data/mockPersons';
import { SYSTEM_USERS } from './data/featureMockData';
import { Navbar } from './components/Navbar';
import { PublicPortal } from './components/PublicPortal';
import { SightingScanner } from './components/SightingScanner';
import { CaseRegistry } from './components/CaseRegistry';
import { AlertPackageGenerator } from './components/AlertPackageGenerator';
import { AssistantChat } from './components/AssistantChat';
import { ReportPersonModal } from './components/ReportPersonModal';
import { SubmitSightingModal } from './components/SubmitSightingModal';
import { PrintableFlyerModal } from './components/PrintableFlyerModal';
import { AgeProgressionModal } from './components/AgeProgressionModal';
import { AlertsHub } from './components/AlertsHub';
import { DuplicateCaseReview } from './components/DuplicateCaseReview';
import { SecurityAuditModal } from './components/SecurityAuditModal';
import { AuthModal } from './components/AuthModal';
import { UserProfileModal } from './components/UserProfileModal';
import { AdminUserManagement } from './components/AdminUserManagement';
import { AccessDeniedBanner } from './components/AccessDeniedBanner';
import { checkAuthMe, logoutUser, getStoredUser } from './services/authService';
import { Bell } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'scanner' | 'cases' | 'alerts' | 'duplicates' | 'assistant' | 'users'
  >('cases');

  const [missingPersons, setMissingPersons] = useState<MissingPerson[]>(INITIAL_MISSING_PERSONS);
  const [sightings, setSightings] = useState<SightingLead[]>(INITIAL_SIGHTINGS);

  // Active RBAC user state (defaults to Lead Investigator or stored session)
  const [currentUser, setCurrentUser] = useState<CurrentUser>(SYSTEM_USERS[0]);

  // Auth & Profile Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Modals & Navigation Contexts
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSightingModalOpen, setIsSightingModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [ageProgressionPerson, setAgeProgressionPerson] = useState<MissingPerson | null>(null);

  const [flyerPerson, setFlyerPerson] = useState<MissingPerson | null>(null);
  const [flyerAgedData, setFlyerAgedData] = useState<{ photoUrl?: string; targetAge?: number } | null>(null);

  const [scannerPersonId, setScannerPersonId] = useState<string | undefined>(undefined);
  const [activeTargetPerson, setActiveTargetPerson] = useState<MissingPerson | undefined>(undefined);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Restore authenticated session on mount
  useEffect(() => {
    async function restoreSession() {
      const stored = getStoredUser();
      if (stored) {
        setCurrentUser(stored);
      }
      try {
        const verified = await checkAuthMe();
        if (verified) {
          setCurrentUser(verified);
        }
      } catch (err) {
        console.warn('Session verification error:', err);
      }
    }
    restoreSession();
  }, []);

  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    showToast(`Welcome back, ${user.name} (${user.role}). Access granted.`);

    // Role-based redirect (Module 1 Requirement 5)
    if (user.role === 'ADMIN') {
      setActiveTab('users');
    } else if (user.role === 'INVESTIGATOR') {
      setActiveTab('cases');
    } else {
      setActiveTab('cases');
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    // Revert to citizen/guest persona and prevent back button exposure
    const guestUser: CurrentUser = {
      id: 'usr_guest',
      name: 'Public User',
      email: 'public@findsafe.ai',
      role: 'CITIZEN',
      status: 'active',
    };
    setCurrentUser(guestUser);
    setActiveTab('cases');
    showToast('Logged out successfully. Please sign in to access protected tools.');
    setAuthModalMode('login');
    setIsAuthModalOpen(true);
  };

  const handleVerifyCase = (personId: string, notes: string) => {
    const actorBadge = currentUser.badgeNumber ? ` (${currentUser.badgeNumber})` : '';
    const verifiedByStr = `${currentUser.name}${actorBadge}`;
    const now = new Date().toISOString();

    setMissingPersons((prev) =>
      prev.map((p) =>
        p.id === personId
          ? {
              ...p,
              isVerified: true,
              verifiedBy: verifiedByStr,
              verifiedAt: now,
              verificationNotes: notes,
              publicStatusStage: 'VERIFIED',
            }
          : p
      )
    );

    showToast(`Case verified with official SAR stamp by ${currentUser.name}.`);
  };

  const handleAddPerson = (newPerson: MissingPerson) => {
    setMissingPersons((prev) => [newPerson, ...prev]);
    showToast(`Case #${newPerson.caseNumber} registered successfully for ${newPerson.name}.`);
    setActiveTab('cases');
  };

  const handleLeadVerified = (newLead: SightingLead) => {
    setSightings((prev) => [newLead, ...prev]);
    showToast(`Lead logged: Verified match for ${newLead.personName} (${newLead.confidenceScore}% confidence).`);
  };

  const handleCasesMerged = (primaryId: string, candidateId: string) => {
    setMissingPersons((prev) => {
      const candidate = prev.find((p) => p.id === candidateId);
      return prev
        .filter((p) => p.id !== candidateId)
        .map((p) => {
          if (p.id === primaryId && candidate) {
            return {
              ...p,
              summary: `${p.summary} [Merged supplementary intel from Case #${candidate.caseNumber}: ${candidate.summary}]`,
              medicalConditions: Array.from(
                new Set([...(p.medicalConditions || []), ...(candidate.medicalConditions || [])])
              ),
            };
          }
          return p;
        });
    });
    showToast(`Dossier #${candidateId} merged into Primary Case #${primaryId}. Duplicate removed from active registry.`);
  };

  const handleScanForPerson = (personId: string) => {
    setScannerPersonId(personId);
    setActiveTab('scanner');
  };

  const handleGenerateAlertsForPerson = (person: MissingPerson) => {
    setActiveTargetPerson(person);
    setActiveTab('alerts');
  };

  const handleMarkStatus = (personId: string, newStatus: 'Active' | 'Located Safe') => {
    setMissingPersons((prev) =>
      prev.map((p) => (p.id === personId ? { ...p, status: newStatus } : p))
    );
    showToast(`Case updated: ${newStatus}`);
  };

  const handleUpdatePerson = (updatedPerson: MissingPerson) => {
    setMissingPersons((prev) =>
      prev.map((p) => (p.id === updatedPerson.id ? updatedPerson : p))
    );
    showToast(`Case #${updatedPerson.caseNumber} (${updatedPerson.name}) updated: Marked ${updatedPerson.status}.`);
  };

  const handleOpenPrintFlyer = (person: MissingPerson, agedPhotoUrl?: string, targetAge?: number) => {
    setFlyerPerson(person);
    if (agedPhotoUrl && targetAge) {
      setFlyerAgedData({ photoUrl: agedPhotoUrl, targetAge });
    } else {
      setFlyerAgedData(null);
    }
  };

  const handleAgeProgressionGenerated = (record: AgeProgressionRecord) => {
    const subjectName = record.personName || 'Subject';
    showToast(`AI Age Progression completed for ${subjectName} (Target Age: ${record.targetAge}).`);
    setFlyerAgedData({
      photoUrl: record.progressedPhotoUrl || record.agedPhotoUrl,
      targetAge: record.targetAge,
    });
  };

  const handleSwitchUser = (user: CurrentUser) => {
    setCurrentUser(user);
    showToast(`Active persona switched to ${user.name} (${user.role}).`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenSightingModal={() => setIsSightingModalOpen(true)}
        activeCasesCount={missingPersons.filter((p) => p.status === 'Active').length}
        pendingLeadsCount={sightings.filter((s) => s.status === 'High Priority').length}
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
        onOpenAuditModal={() => setIsAuditModalOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onOpenAuthModal={() => {
          setAuthModalMode('login');
          setIsAuthModalOpen(true);
        }}
        onLogout={handleLogout}
        unreadAlertsCount={2}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {(currentUser.role === 'PUBLIC_USER' || currentUser.role === 'CITIZEN') ? (
          <>
            {activeTab === 'users' && (
              <AccessDeniedBanner
                requiredRole="Administrator"
                currentRole={currentUser.role}
                onGoBack={() => setActiveTab('cases')}
                onLoginPrompt={() => {
                  setAuthModalMode('login');
                  setIsAuthModalOpen(true);
                }}
              />
            )}

            {(activeTab === 'alerts' || activeTab === 'duplicates') && (
              <AccessDeniedBanner
                requiredRole="Investigator or Administrator"
                currentRole={currentUser.role}
                onGoBack={() => setActiveTab('cases')}
                onLoginPrompt={() => {
                  setAuthModalMode('login');
                  setIsAuthModalOpen(true);
                }}
              />
            )}

            {activeTab !== 'users' && activeTab !== 'alerts' && activeTab !== 'duplicates' && (
              <PublicPortal
                missingPersons={missingPersons}
                sightings={sightings}
                onOpenReportModal={() => setIsReportModalOpen(true)}
                onOpenSightingModal={(preselectedPersonId) => {
                  setScannerPersonId(preselectedPersonId);
                  setIsSightingModalOpen(true);
                }}
                onOpenPrintFlyer={(person) => handleOpenPrintFlyer(person)}
                currentUser={currentUser}
                onSwitchToOfficial={() => handleSwitchUser(SYSTEM_USERS[0])}
                onLeadVerified={handleLeadVerified}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                preselectedPersonId={scannerPersonId}
              />
            )}
          </>
        ) : (
          <>
            {activeTab === 'users' && (
              currentUser.role === 'ADMIN' ? (
                <AdminUserManagement
                  currentUser={currentUser}
                  onOpenAuditLogs={() => setIsAuditModalOpen(true)}
                />
              ) : (
                <AccessDeniedBanner
                  requiredRole="Administrator"
                  currentRole={currentUser.role}
                  onGoBack={() => setActiveTab('cases')}
                />
              )
            )}

            {activeTab === 'cases' && (
              <CaseRegistry
                missingPersons={missingPersons}
                sightings={sightings}
                onSelectPerson={(person) => setActiveTargetPerson(person)}
                onScanForPerson={handleScanForPerson}
                onGenerateAlertsForPerson={handleGenerateAlertsForPerson}
                onPrintFlyer={(person) => handleOpenPrintFlyer(person)}
                onMarkStatus={handleMarkStatus}
                onAgeProgression={(person) => setAgeProgressionPerson(person)}
                currentUser={currentUser}
                onVerifyCase={handleVerifyCase}
                onUpdatePerson={handleUpdatePerson}
              />
            )}

            {activeTab === 'scanner' && (
              <SightingScanner
                missingPersons={missingPersons}
                onLeadVerified={handleLeadVerified}
                onSelectPerson={(person) => {
                  setActiveTargetPerson(person);
                  setActiveTab('cases');
                }}
                preselectedPersonId={scannerPersonId}
              />
            )}

            {activeTab === 'alerts' && (
              <AlertsHub
                missingPersons={missingPersons}
                currentUser={currentUser}
                onGenerateFlyer={(person: MissingPerson) => handleOpenPrintFlyer(person)}
              />
            )}

            {activeTab === 'duplicates' && (
              <DuplicateCaseReview
                missingPersons={missingPersons}
                currentUser={currentUser}
                onCasesMerged={handleCasesMerged}
                onUpdateCases={(updated: MissingPerson[]) => setMissingPersons(updated)}
              />
            )}

            {activeTab === 'assistant' && (
              <AssistantChat
                missingPersons={missingPersons}
                activePerson={activeTargetPerson}
              />
            )}
          </>
        )}
      </main>

      {/* Persistent Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-6 text-xs text-slate-400 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${currentUser.role === 'PUBLIC_USER' ? 'bg-blue-400' : 'bg-rose-500'}`} />
            <span className="font-semibold text-slate-200">
              {currentUser.role === 'PUBLIC_USER' 
                ? 'FindSafe Public Community Safety & Reporting Portal' 
                : 'FindSafe Enterprise SAR Operations & Forensics System'}
            </span>
            <span>— {currentUser.role === 'PUBLIC_USER' ? 'Public Citizen Access' : 'AI Detection & Law Enforcement Intelligence'}</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
            <span>ROLE: {currentUser.role}</span>
            <span>•</span>
            <span>{currentUser.role === 'PUBLIC_USER' ? 'DATA PRIVACY COMPLIANT' : 'CJIS COMPLIANT'}</span>
          </div>
        </div>
      </footer>

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 shadow-2xl text-xs animate-in slide-in-from-bottom-3">
          <Bell className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modals */}
      {isReportModalOpen && (
        <ReportPersonModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          onSubmit={handleAddPerson}
          currentUser={currentUser}
        />
      )}

      {isSightingModalOpen && (
        <SubmitSightingModal
          isOpen={isSightingModalOpen}
          onClose={() => {
            setIsSightingModalOpen(false);
            setScannerPersonId(undefined);
          }}
          missingPersons={missingPersons}
          onSubmitLead={handleLeadVerified}
          currentUser={currentUser}
          preselectedPersonId={scannerPersonId}
        />
      )}

      {flyerPerson && (
        <PrintableFlyerModal
          person={flyerPerson}
          onClose={() => {
            setFlyerPerson(null);
            setFlyerAgedData(null);
          }}
          agedPhotoUrl={flyerAgedData?.photoUrl}
          agedTargetAge={flyerAgedData?.targetAge}
        />
      )}

      {ageProgressionPerson && (
        <AgeProgressionModal
          isOpen={ageProgressionPerson !== null}
          onClose={() => setAgeProgressionPerson(null)}
          person={ageProgressionPerson}
          currentUser={currentUser}
          onAgeProgressionGenerated={handleAgeProgressionGenerated}
        />
      )}

      {isAuditModalOpen && (
        <SecurityAuditModal
          isOpen={isAuditModalOpen}
          onClose={() => setIsAuditModalOpen(false)}
          currentUser={currentUser}
        />
      )}

      {/* Module 1: Authentication & Profile Modals */}
      {isAuthModalOpen && (
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
          initialMode={authModalMode}
        />
      )}

      {isProfileModalOpen && (
        <UserProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          currentUser={currentUser}
          onProfileUpdated={(updated) => {
            setCurrentUser(updated);
            showToast('Profile updated successfully.');
          }}
        />
      )}
    </div>
  );
}
