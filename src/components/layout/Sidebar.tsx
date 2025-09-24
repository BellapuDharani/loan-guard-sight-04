import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FileText, 
  Upload, 
  Clock, 
  Settings, 
  LogOut, 
  Shield,
  Users,
  AlertTriangle,
  BarChart3,
  Plus
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  role?: 'user' | 'officer';
}

const navItems: NavItem[] = [
  // Borrower navigation
  { icon: FileText, label: 'My Loans', href: '/dashboard', role: 'user' },
  { icon: Upload, label: 'Upload Proof', href: '/upload', role: 'user' },
  { icon: Clock, label: 'Verification Status', href: '/status', role: 'user' },
  
  // Officer navigation
  { icon: BarChart3, label: 'Dashboard', href: '/officer/dashboard', role: 'officer' },
  { icon: Users, label: 'Loan Management', href: '/officer/loans', role: 'officer' },
  { icon: Plus, label: 'Upload Loans', href: '/officer/loan-management', role: 'officer' },
  { icon: AlertTriangle, label: 'Alerts', href: '/officer/alerts', role: 'officer' },
  { icon: Shield, label: 'Verification', href: '/officer/verification', role: 'officer' },
  
  // Common
  { icon: Settings, label: 'Settings', href: '/settings' },
];

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const filteredNavItems = navItems.filter(item => 
    !item.role || item.role === user?.role
  );

  return (
    <div className="sidebar-nav flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">Loan Guard</h1>
            <p className="text-xs text-sidebar-foreground/60">Proof of Concept</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-primary">
              {user?.name?.charAt(0) || user?.username?.charAt(0)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-xs text-sidebar-foreground/60 capitalize">
              {user?.role === 'user' ? 'Borrower' : 'Loan Officer'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3">
        <div className="space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          onClick={logout}
          className="w-full justify-start text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-foreground/10"
        >
          <LogOut className="w-4 h-4 mr-3" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};