/**
 * User Menu Component
 * Dropdown menu showing user info and logout option
 */

import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, ChevronDown, Settings, Moon, Sun } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface UserMenuProps {
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export default function UserMenu({ isDarkMode = false, onToggleDarkMode }: UserMenuProps) {
  const { user, logout, isLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fecha o menu ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Extrai as iniciais do email ou nome
  const getInitials = () => {
    if (user?.user_metadata?.name) {
      const name = user.user_metadata.name as string;
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.slice(0, 2).toUpperCase() || 'U';
  };

  // Nome para exibir
  const displayName = (user?.user_metadata?.name as string) || user?.email?.split('@')[0] || 'Usuario';

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
  };

  if (!user) return null;

  return (
    <div ref={menuRef} className="relative">
      {/* Botao do menu */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
          {getInitials()}
        </div>

        {/* Nome (oculto em mobile) */}
        <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-200 max-w-[120px] truncate">
          {displayName}
        </span>

        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Menu dropdown */}
      {isOpen && (
        <>
          {/* Overlay invisivel */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-20 animate-fade-in">
            {/* Info do usuario */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium">
                  {getInitials()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {displayName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                </div>
              </div>
            </div>

            {/* Opcoes */}
            <div className="py-2">
              {/* Toggle Dark Mode */}
              {onToggleDarkMode && (
                <button
                  onClick={() => {
                    onToggleDarkMode();
                  }}
                  className="w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {isDarkMode ? (
                    <Sun className="w-5 h-5 text-amber-500" />
                  ) : (
                    <Moon className="w-5 h-5 text-gray-500" />
                  )}
                  <span className="text-sm text-gray-700 dark:text-gray-200">
                    {isDarkMode ? 'Modo claro' : 'Modo escuro'}
                  </span>
                </button>
              )}

              {/* Configuracoes (placeholder) */}
              <button
                className="w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors opacity-50 cursor-not-allowed"
                disabled
              >
                <Settings className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-700 dark:text-gray-200">Configuracoes</span>
                <span className="text-xs text-gray-400 ml-auto">Em breve</span>
              </button>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 dark:border-gray-700 my-2" />

            {/* Logout */}
            <div className="py-2">
              <button
                onClick={handleLogout}
                disabled={isLoading}
                className="w-full px-4 py-2 flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium">Sair</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
