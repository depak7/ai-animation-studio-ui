import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Star, 
  Trash2, 
  Play, 
  Clock,
  Plus,
  MessageSquare,
  X
} from 'lucide-react';
import { ChatListItem } from '../types/api';

interface ChatHistoryProps {
  chats: ChatListItem[];
  onSelectChat: (chat: ChatListItem) => void;
  onNewChat: () => void;
  onStarChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  currentChatId?: string;
  onClose?: () => void;
}

export const ChatHistory: React.FC<ChatHistoryProps> = ({ 
  chats, 
  onSelectChat, 
  onNewChat,
  onStarChat,
  onDeleteChat,
  currentChatId,
  onClose
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredChats = chats.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="h-full bg-card-bg flex flex-col w-full">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-border-color">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-text-primary">Chats</h2>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onNewChat}
              className="p-2 rounded-lg bg-accent hover:bg-accent-hover text-white transition-colors duration-200"
            >
              <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
            </motion.button>
            
            {/* Close button for mobile */}
            {onClose && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="lg:hidden p-2 rounded-lg bg-hover-bg border border-border-color text-text-secondary hover:text-text-primary transition-colors duration-200"
              >
                <X size={16} />
              </motion.button>
            )}
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary sm:w-4 sm:h-4" />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 sm:pl-9 pr-3 sm:pr-4 py-2 bg-primary border border-border-color rounded-lg
                     text-text-primary placeholder-text-secondary text-sm
                     focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent
                     transition-all duration-200"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto w-full">
        <AnimatePresence>
          {filteredChats.map((chat, index) => (
            <motion.div
              key={chat.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: index * 0.02 }}
              className={`group p-3 sm:p-4 border-b border-border-color cursor-pointer transition-all duration-200 w-full ${
                currentChatId === chat.id.toString()
                  ? 'bg-accent/10 border-l-2 border-l-accent'
                  : 'hover:bg-hover-bg'
              }`}
              onClick={() => onSelectChat(chat)}
            >
              <div className="flex items-start gap-2 sm:gap-3">
                {/* Icon */}
                <div className="flex-shrink-0 mt-1">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
                    <MessageSquare size={12} className="text-accent sm:w-[14px] sm:h-[14px]" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary mb-1 line-clamp-2">
                    {chat.title}
                  </p>
                  
                  <div className="flex items-center gap-2 text-xs text-text-secondary mb-2">
                    <Clock size={8} className="sm:w-[10px] sm:h-[10px]" />
                    {formatTimestamp(chat.updatedAt)}
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2">
                    <Play size={6} className="text-green-400 sm:w-2 sm:h-2" />
                    <span className="text-xs text-green-400">
                      Ready
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onStarChat(chat.id.toString());
                    }}
                    className={`p-1 rounded transition-colors ${
                      chat.starred ? 'text-yellow-400' : 'text-text-secondary hover:text-yellow-400'
                    }`}
                  >
                    <Star size={10} fill={chat.starred ? 'currentColor' : 'none'} className="sm:w-3 sm:h-3" />
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChat(chat.id.toString());
                    }}
                    className="p-1 rounded text-text-secondary hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={10} className="sm:w-3 sm:h-3" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Empty State */}
        {filteredChats.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-4 text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mb-3">
              {searchQuery ? <Search size={16} className="text-accent sm:w-5 sm:h-5" /> : <MessageSquare size={16} className="text-accent sm:w-5 sm:h-5" />}
            </div>
            <p className="text-text-primary font-medium mb-1 text-sm">
              {searchQuery ? 'No chats found' : 'No chats yet'}
            </p>
            <p className="text-xs text-text-secondary">
              {searchQuery ? 'Try adjusting your search' : 'Start a new conversation to see your chat history'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};