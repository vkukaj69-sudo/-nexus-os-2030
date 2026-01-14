
import React, { useState } from 'react';
import { Users, ShieldAlert, CreditCard, Trash2, Search, Filter, Mail, CheckCircle, Ban, Zap } from 'lucide-react';

interface MockUser {
  id: string;
  email: string;
  tier: 'Spark' | 'Pro' | 'Agency';
  status: 'active' | 'suspended';
  unitsUsed: number;
  lastActive: string;
}

export const UserManagement: React.FC = () => {
  const [users] = useState<MockUser[]>([
    { id: 'u1', email: 'creator_alpha@gmail.com', tier: 'Pro', status: 'active', unitsUsed: 412, lastActive: '2m ago' },
    { id: 'u2', email: 'agency_nexus@tech.io', tier: 'Agency', status: 'active', unitsUsed: 1890, lastActive: '14m ago' },
    { id: 'u3', email: 'free_trial_user@hotmail.com', tier: 'Spark', status: 'suspended', unitsUsed: 100, lastActive: '2 days ago' },
  ]);

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-1000 pb-32">
      <header className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="space-y-2">
          <h1 className="text-5xl font-black text-white tracking-tighter">Citizen Ledger</h1>
          <p className="text-gray-400 text-xl font-bold uppercase tracking-widest">Global User & Subscription Management</p>
        </div>
        <div className="flex gap-4">
           <div className="glass-card px-8 py-4 flex items-center gap-4 bg-white/5 border-white/10">
              <Users size={24} className="text-violet-400" />
              <div>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Total Active</p>
                <p className="text-2xl font-black text-white">1,248</p>
              </div>
           </div>
        </div>
      </header>

      <div className="glass-card overflow-hidden border-2 border-white/10 bg-black/40 shadow-2xl rounded-[3rem]">
        <div className="p-8 border-b border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="relative flex-1 w-full">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500" />
              <input 
                placeholder="Search by email or node ID..."
                className="w-full pl-16 pr-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-violet-500/50"
              />
           </div>
           <div className="flex gap-4">
              <button className="p-4 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all"><Filter size={20}/></button>
              <button className="px-8 py-4 bg-violet-600 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-violet-500 transition-all">Broadcast Update</button>
           </div>
        </div>

        <table className="w-full text-left border-collapse">
           <thead>
             <tr className="border-b border-white/10 text-[11px] font-black text-gray-500 uppercase tracking-[0.3em]">
               <th className="px-10 py-6">User Node</th>
               <th className="px-10 py-6">Protocol Tier</th>
               <th className="px-10 py-6">Units (MOM)</th>
               <th className="px-10 py-6">Security Status</th>
               <th className="px-10 py-6 text-right">Actions</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-white/5">
              {users.map(user => (
                <tr key={user.id} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center font-black text-sm border border-white/20">
                          {user.email.charAt(0).toUpperCase()}
                       </div>
                       <div>
                          <p className="text-white font-black text-lg">{user.email}</p>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">ID: {user.id}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      user.tier === 'Agency' ? 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30' :
                      user.tier === 'Pro' ? 'bg-violet-500/10 text-violet-400 border-violet-500/30' :
                      'bg-blue-500/10 text-blue-400 border-blue-500/30'
                    }`}>
                      {user.tier} Tier
                    </span>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-3">
                       <Zap size={16} className="text-amber-400" />
                       <span className="text-lg font-black text-white">{user.unitsUsed}</span>
                       <span className="text-xs text-gray-500">/ 2500</span>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-3">
                       <span className={`w-2 h-2 rounded-full ${user.status === 'active' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,1)]' : 'bg-red-500'}`} />
                       <span className={`text-[11px] font-black uppercase tracking-widest ${user.status === 'active' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {user.status === 'active' ? 'Clear' : 'Revoked'}
                       </span>
                    </div>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <div className="flex justify-end gap-3">
                       <button className="p-3 bg-white/5 border border-white/10 rounded-xl text-gray-500 hover:text-white transition-all"><Mail size={18}/></button>
                       <button className="p-3 bg-white/5 border border-white/10 rounded-xl text-gray-500 hover:text-red-400 transition-all"><Ban size={18}/></button>
                    </div>
                  </td>
                </tr>
              ))}
           </tbody>
        </table>
        
        <div className="p-10 bg-white/[0.01] border-t border-white/10 flex justify-between items-center">
           <p className="text-[11px] text-gray-500 font-bold uppercase tracking-[0.3em]">Showing {users.length} of 1,248 active nodes</p>
           <div className="flex gap-2">
              <button className="px-6 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-gray-400">Previous</button>
              <button className="px-6 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-white">Next</button>
           </div>
        </div>
      </div>
    </div>
  );
};
