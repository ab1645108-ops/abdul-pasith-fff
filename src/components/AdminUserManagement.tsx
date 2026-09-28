import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Filter, Shield, UserCheck, UserX, ShieldAlert,
  Clock, Mail, Building, Phone, AlertTriangle, CheckCircle2,
  RefreshCw, Sparkles, MoreVertical, Eye, Lock
} from 'lucide-react';
import { UserAccount, UserRole, AccountStatus, CurrentUser } from '../types';
import { 
  adminFetchUsers, 
  adminUpdateRole, 
  adminUpdateStatus, 
  adminEditUserDetails 
} from '../services/authService';

interface AdminUserManagementProps {
  currentUser: CurrentUser;
  onOpenAuditLogs?: () => void;
}

export const AdminUserManagement: React.FC<AdminUserManagementProps> = ({
  currentUser,
  onOpenAuditLogs,
}) => {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Selected user for details/edit modal
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const loadUsers = async () => {
    setIsLoading(true);
    const res = await adminFetchUsers({
      search: searchTerm,
      role: roleFilter,
      status: statusFilter,
    });
    setIsLoading(false);

    if (res.users) {
      setUsers(res.users);
    } else if (res.error) {
      showToast(res.error, 'error');
    }
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers();
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    const res = await adminUpdateRole(userId, newRole);
    if (res.success && res.user) {
      setUsers((prev) => prev.map((u) => (u.id === userId ? res.user! : u)));
      showToast(`User role updated to ${newRole}`);
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser(res.user);
      }
    } else {
      showToast(res.error || 'Failed to update user role', 'error');
    }
  };

  const handleStatusToggle = async (user: UserAccount) => {
    const newStatus: AccountStatus = user.status === 'active' ? 'inactive' : 'active';
    const res = await adminUpdateStatus(user.id, newStatus);
    if (res.success && res.user) {
      setUsers((prev) => prev.map((u) => (u.id === user.id ? res.user! : u)));
      showToast(`User account status updated to ${newStatus}`);
      if (selectedUser && selectedUser.id === user.id) {
        setSelectedUser(res.user);
      }
    } else {
      showToast(res.error || 'Failed to update account status', 'error');
    }
  };

  const getRoleBadge = (role: UserRole) => {
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

  const getStatusBadge = (status: AccountStatus) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'suspended':
        return 'bg-red-500/20 text-red-300 border-red-500/40';
      case 'inactive':
      default:
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Never / Pending';
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        dateStyle: 'short',
        timeStyle: 'short',
      });
    } catch {
      return dateStr;
    }
  };

  // Metrics
  const totalCount = users.length;
  const activeCount = users.filter((u) => u.status === 'active').length;
  const adminCount = users.filter((u) => u.role === 'ADMIN').length;
  const investigatorCount = users.filter((u) => u.role === 'INVESTIGATOR').length;
  const citizenCount = users.filter((u) => u.role === 'CITIZEN' || u.role === 'PUBLIC_USER').length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-rose-600/10 via-amber-500/5 to-transparent blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-rose-600/20 border border-rose-500/30 text-rose-400">
                <Users className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold tracking-tight text-white">
                Admin User Management & RBAC Directory
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Authorized administrators can provision roles, activate/deactivate accounts, inspect login timestamps, and maintain compliance security logs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onOpenAuditLogs && (
              <button
                onClick={onOpenAuditLogs}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1.5"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Audit Logs</span>
              </button>
            )}

            <button
              onClick={loadUsers}
              disabled={isLoading}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 transition"
              title="Refresh Directory"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-rose-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6">
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">Total Users</span>
            <span className="text-xl font-bold text-white mt-1 block">{totalCount}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">Active Status</span>
            <span className="text-xl font-bold text-emerald-400 mt-1 block">{activeCount}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">Administrators</span>
            <span className="text-xl font-bold text-rose-400 mt-1 block">{adminCount}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">Investigators</span>
            <span className="text-xl font-bold text-blue-400 mt-1 block">{investigatorCount}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">Citizens/Users</span>
            <span className="text-xl font-bold text-slate-200 mt-1 block">{citizenCount}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search name, email, badge..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition"
          />
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Role Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Administrator</option>
              <option value="INVESTIGATOR">Investigator</option>
              <option value="CITIZEN">Citizen/User</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
            >
              <option value="ALL">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMsg && (
        <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 animate-in fade-in ${
          toastMsg.type === 'success' 
            ? 'bg-emerald-950/80 border-emerald-800 text-emerald-200' 
            : 'bg-rose-950/80 border-rose-800 text-rose-200'
        }`}>
          {toastMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Users Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Login</th>
                <th className="py-3 px-4">Registered</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map((user) => {
                const isCurrentAdmin = user.id === currentUser.id;
                return (
                  <tr key={user.id} className="hover:bg-slate-850/60 transition group">
                    {/* User Column */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-white shrink-0">
                          {user.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-white flex items-center gap-1.5">
                            <span>{user.name}</span>
                            {isCurrentAdmin && (
                              <span className="text-[10px] text-amber-400 font-mono font-normal">(You)</span>
                            )}
                          </div>
                          <span className="text-slate-400 text-[11px] font-mono">{user.email}</span>
                          {(user.badgeNumber || user.agency) && (
                            <span className="text-[10px] text-slate-500 block truncate max-w-[200px]">
                              {[user.badgeNumber, user.agency].filter(Boolean).join(' • ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Role Column */}
                    <td className="py-3.5 px-4">
                      <select
                        value={user.role === 'PUBLIC_USER' ? 'CITIZEN' : user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                        disabled={isCurrentAdmin}
                        className={`text-[11px] font-mono font-bold px-2 py-1 rounded-lg border focus:outline-none ${getRoleBadge(user.role)} bg-slate-900`}
                        title={isCurrentAdmin ? "Cannot change your own role" : "Change user role"}
                      >
                        <option value="CITIZEN">CITIZEN</option>
                        <option value="INVESTIGATOR">INVESTIGATOR</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>

                    {/* Status Column */}
                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(user.status)}`}>
                        {user.status.toUpperCase()}
                      </span>
                    </td>

                    {/* Last Login */}
                    <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px]">
                      {formatDate(user.last_login)}
                    </td>

                    {/* Registered Date */}
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {formatDate(user.created_at)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedUser(user)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 transition"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusToggle(user)}
                          disabled={isCurrentAdmin}
                          className={`p-1.5 rounded-lg border transition ${
                            user.status === 'active'
                              ? 'bg-amber-950/40 border-amber-800/60 text-amber-300 hover:bg-amber-900/60'
                              : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/60'
                          } disabled:opacity-40 disabled:cursor-not-allowed`}
                          title={
                            isCurrentAdmin
                              ? "Cannot deactivate your own administrator account"
                              : user.status === 'active' ? "Deactivate Account" : "Activate Account"
                          }
                        >
                          {user.status === 'active' ? (
                            <UserX className="w-3.5 h-3.5" />
                          ) : (
                            <UserCheck className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {users.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                    No users found matching current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-white">
                  {selectedUser.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">{selectedUser.name}</h3>
                  <span className="text-[11px] text-slate-400 font-mono">{selectedUser.email}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-850">
                <span className="text-slate-400">Account ID:</span>
                <span className="font-mono text-slate-200">{selectedUser.id}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-850">
                <span className="text-slate-400">Role:</span>
                <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${getRoleBadge(selectedUser.role)}`}>
                  {selectedUser.role}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-850">
                <span className="text-slate-400">Status:</span>
                <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusBadge(selectedUser.status)}`}>
                  {selectedUser.status.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-850">
                <span className="text-slate-400">Badge / Agency:</span>
                <span className="text-slate-200">{[selectedUser.badgeNumber, selectedUser.agency].filter(Boolean).join(' • ') || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-850">
                <span className="text-slate-400">Organization:</span>
                <span className="text-slate-200">{selectedUser.organization || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-850">
                <span className="text-slate-400">Phone:</span>
                <span className="text-slate-200">{selectedUser.phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-850">
                <span className="text-slate-400">Registered Date:</span>
                <span className="font-mono text-slate-200">{formatDate(selectedUser.created_at)}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Last Login:</span>
                <span className="font-mono text-slate-200">{formatDate(selectedUser.last_login)}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
