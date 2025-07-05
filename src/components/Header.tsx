import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, User, LogOut, MessageSquare, Menu } from 'lucide-react';

interface HeaderProps {
  user: any;
  onLogin: () => void;
  onLogout: () => void;
  onChatHistoryToggle?: () => void;
  isChatHistoryOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  user, 
  onLogin, 
  onLogout, 
  onChatHistoryToggle,
  isChatHistoryOpen 
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card-bg border-b border-border-color px-3 sm:px-4 lg:px-6 py-3 sm:py-4 relative z-30"
    >
      <div className="flex items-center justify-between">
        {/* Left side - Logo and Chat History Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Chat History Toggle - Mobile only */}
          {onChatHistoryToggle && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onChatHistoryToggle}
              className="lg:hidden p-2 rounded-lg bg-hover-bg border border-border-color hover:border-accent/30 transition-colors"
            >
              <MessageSquare size={18} className={isChatHistoryOpen ? 'text-accent' : 'text-text-secondary'} />
            </motion.button>
          )}

          {/* Logo and Title */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-accent/10 border border-accent/20">
              <Sparkles className="text-accent" size={20} />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-text-primary">
                AI Animation Studio
              </h1>
              <p className="text-xs text-text-secondary hidden sm:block">Create magic with AI</p>
            </div>
          </div>
        </div>

        {/* User Section */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg bg-hover-bg border border-border-color hover:border-accent/30 transition-colors"
              >
                {user.picture ? (
                  <img 
                    src={user.picture} 
                    alt={user.name}
                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
                    <User size={12} className="text-accent sm:w-4 sm:h-4" />
                  </div>
                )}
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-text-primary">
                    {user.isGuest ? 'Guest User' : user.name}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {user.isGuest ? 'Not signed in' : user.email}
                  </p>
                </div>
              </motion.button>

              {/* Dropdown */}
              {isDropdownOpen && (
                <>
                  {/* Backdrop */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  
                  {/* Dropdown content */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-48 bg-card-bg border border-border-color rounded-lg shadow-lg z-50"
                  >
                    <div className="p-3 border-b border-border-color">
                      <p className="text-sm font-medium text-text-primary">
                        {user.isGuest ? 'Guest User' : user.name}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {user.isGuest ? 'Sign in to save your work' : user.email}
                      </p>
                    </div>
                    
                    <div className="p-2">
                      {user.isGuest ? (
                        <button
                          onClick={() => {
                            onLogin();
                            setIsDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-hover-bg rounded-lg transition-colors"
                        >
                          <User size={14} />
                          Sign in with Google
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            onLogout();
                            setIsDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-hover-bg rounded-lg transition-colors"
                        >
                          <LogOut size={14} />
                          Sign out
                        </button>
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onLogin}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg font-medium transition-colors text-sm"
            >
              <User size={16} />
              <span className="hidden sm:inline">Sign in with Google</span>
              <span className="sm:hidden">Sign in</span>
            </motion.button>
          )}
        </div>
      </div>
    </motion.header>
  );
};