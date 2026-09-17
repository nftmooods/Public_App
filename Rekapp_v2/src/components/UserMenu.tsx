import React, { useState } from 'react';
import { User, Settings, LogOut, Key, Crown, ChevronDown } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface UserMenuProps {
  onOpenApiKeys: () => void;
  onOpenProfile: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ onOpenApiKeys, onOpenProfile }) => {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'pro': return 'text-blue-600 bg-blue-100';
      case 'enterprise': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPlanLabel = (plan: string) => {
    switch (plan) {
      case 'pro': return 'Pro';
      case 'enterprise': return 'Enterprise';
      default: return 'Free';
    }
  };

  const displayName = user.profile?.name || user.email?.split('@')[0] || 'Utilisateur';
  const plan = user.profile?.subscription_plan || 'free';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
          <span className="text-white font-medium text-sm">
            {getInitials(displayName)}
          </span>
        </div>
        <div className="hidden md:block text-left">
          <div className="text-sm font-medium text-gray-900">{displayName}</div>
          <div className="flex items-center space-x-2">
            <span className={`text-xs px-2 py-0.5 rounded-full ${getPlanColor(plan)}`}>
              {getPlanLabel(plan)}
            </span>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">
                    {getInitials(displayName)}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">{displayName}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getPlanColor(plan)}`}>
                      {getPlanLabel(plan)}
                    </span>
                    {plan !== 'free' && (
                      <Crown className="w-3 h-3 text-yellow-500" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-2">
              <button
                onClick={() => {
                  onOpenProfile();
                  setIsOpen(false);
                }}
                className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
              >
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">Profil</span>
              </button>

              <button
                onClick={() => {
                  onOpenApiKeys();
                  setIsOpen(false);
                }}
                className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Key className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">Clés API</span>
                <div className="ml-auto">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsOpen(false);
                }}
                className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">Paramètres</span>
              </button>
            </div>

            <div className="p-2 border-t border-gray-100">
              <button
                onClick={() => {
                  signOut();
                  setIsOpen(false);
                }}
                className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-red-50 rounded-lg transition-colors text-red-600"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Se déconnecter</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserMenu;