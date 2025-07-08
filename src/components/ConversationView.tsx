import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Bot, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Play,
  Eye,
  Copy,
  Check
} from 'lucide-react';
import { Chat } from '../types/api';

interface ConversationViewProps {
  chat: Chat;
  isGenerating: boolean;
  onVideoSelect?: (videoUrl: string) => void;
}

export const ConversationView: React.FC<ConversationViewProps> = ({ 
  chat, 
  isGenerating, 
  onVideoSelect 
}) => {
  const [expandedJson, setExpandedJson] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const formatJsonForDisplay = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return jsonString;
    }
  };

  const handleVideoClick = (videoUrl: string) => {
    if (onVideoSelect) {
      onVideoSelect(videoUrl);
    }
  };

  return (
    <div className="h-full bg-card-bg flex flex-col">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-border-color">
        <h3 className="text-sm sm:text-base font-semibold text-text-primary">Conversation</h3>
        <p className="text-xs text-text-secondary mt-1">
          {chat.messages.length} message{chat.messages.length === 1 ? '' : 's'}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
        <AnimatePresence>
          {chat.messages.map((message, index) => (
            <div key={message.id} className="space-y-3">
              {/* User Message */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex gap-2 sm:gap-3"
              >
                <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
                  <User size={12} className="text-accent sm:w-[14px] sm:h-[14px]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="bg-primary rounded-lg p-2 sm:p-3 border border-border-color">
                    <p className="text-xs sm:text-sm text-text-primary">{message.prompt}</p>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-xs text-text-secondary">
                    <Clock size={8} className="sm:w-[10px] sm:h-[10px]" />
                    {formatTimestamp(message.timestamp)}
                  </div>
                </div>
              </motion.div>

              {/* AI Response */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.05 }}
                className="flex gap-2 sm:gap-3"
              >
                <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-green-400/10 border border-green-400/20 flex items-center justify-center">
                  <Bot size={12} className="text-green-400 sm:w-[14px] sm:h-[14px]" />
                </div>
                <div className="flex-1 min-w-0">
                  {message.isGenerating ? (
                    <div className="bg-hover-bg rounded-lg p-2 sm:p-3 border border-border-color">
                      <div className="flex items-center gap-2 mb-2">
                        <Loader2 size={12} className="animate-spin text-accent sm:w-[14px] sm:h-[14px]" />
                        <span className="text-xs sm:text-sm text-accent">Generating...</span>
                      </div>
                      <div className="w-full bg-border-color rounded-full h-1.5">
                        <motion.div
                          className="bg-accent h-1.5 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${message.generationProgress || 0}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                      <p className="text-xs text-text-secondary mt-1">
                        {Math.round(message.generationProgress || 0)}% complete
                      </p>
                    </div>
                  ) : message.apiResponse ? (
                    <div className="space-y-2">
                      {/* Success Status */}
                      <div className="flex items-center gap-1.5 text-xs text-green-400">
                        <CheckCircle size={10} className="sm:w-3 sm:h-3" />
                        Animation generated successfully
                      </div>

                      {/* Video Preview Button */}
                      {message.apiResponse.videoSource && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleVideoClick(message.apiResponse!.videoSource)}
                          className="w-full bg-hover-bg rounded-lg border border-border-color overflow-hidden hover:border-accent/30 transition-colors"
                        >
                          <div className="flex items-center gap-2 p-2 sm:p-3">
                            <div className="w-8 h-8 bg-accent/10 border border-accent/20 rounded flex items-center justify-center">
                              <Play size={12} className="text-accent" />
                            </div>
                            <div className="flex-1 text-left">
                              <p className="text-xs font-medium text-text-primary">View Result</p>
                              <p className="text-xs text-text-secondary">Click to preview in main window</p>
                            </div>
                          </div>
                        </motion.button>
                      )}
                    </div>
                  ) : (
                    <div className="bg-red-400/10 rounded-lg p-2 sm:p-3 border border-red-400/20">
                      <div className="flex items-center gap-1.5 text-xs text-red-400">
                        <AlertCircle size={10} className="sm:w-3 sm:h-3" />
                        Generation failed
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          ))}
        </AnimatePresence>

        {/* Empty State */}
        {chat.messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mb-3">
              <Bot size={16} className="text-accent" />
            </div>
            <p className="text-sm font-medium text-text-primary mb-1">Start the conversation</p>
            <p className="text-xs text-text-secondary">
              Send your first prompt to begin generating animations
            </p>
          </div>
        )}
      </div>
    </div>
  );
};