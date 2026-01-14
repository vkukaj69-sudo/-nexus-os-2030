'use client';
import { useState } from 'react';
import { Brain, LayoutDashboard, Bot, Database, GitBranch, Shield, Users, Workflow, Bell, BarChart3, Plug, Settings, ChevronLeft, ChevronRight } from 'lucide-react';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/', active: true },
  { icon: Bot, label: 'Agents', href: '/agents' },
  { icon: Database, label: 'Memory', href: '/memory' },
  { icon: GitBranch, label: 'Knowledge', href: '/knowledge' },
  { icon: Workflow, label: 'Workflows', href: '/workflows' },
  { icon: Users, label: 'Teams', href: '/teams' },
  { icon: Shield, label: 'Security', href: '/security' },
  { icon: BarChart3, label: 'Analytics', href: '/analytics' },
  { icon: Bell, label: 'Notifications', href: '/notifications' },
  { icon: Plug, label: 'Plugins', href: '/plugins' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const sidebarClass = collapsed ? 'w-16' : 'w-64';

  return (
    <aside className={sidebarClass + ' h-screen bg-nexus-800 border-r border-nexus-700 flex flex-col transition-all duration-300'}>
      <div className="h-16 flex items-center justify-center border-b border-nexus-700">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-nexus-400 to-purple-600 flex items-center justify-center">
          <Brain className="w-6 h-6 text-white" />
        </div>
        {!collapsed && <span className="ml-3 font-bold text-white">NEXUS</span>}
      </div>
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <a key={item.label} href={item.href} className={'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ' + (item.active ? 'bg-nexus-400/10 text-nexus-300 border border-nexus-400/30' : 'text-gray-400 hover:text-white hover:bg-nexus-700')}>
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </a>
          );
        })}
      </nav>
      <div className="p-2 border-t border-nexus-700">
        <button onClick={function() { setCollapsed(!collapsed); }} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-nexus-700 transition-colors">
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          {!collapsed && <span className="text-sm">Collapse</span>}
        </button>
      </div>
      <div className="p-2 border-t border-nexus-700">
        <a href="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-nexus-700 transition-colors">
          <Settings className="w-5 h-5" />
          {!collapsed && <span className="text-sm font-medium">Settings</span>}
        </a>
      </div>
    </aside>
  );
}
