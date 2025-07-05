import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, Sparkles } from 'lucide-react';

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  isGenerating: boolean;
  hasMessages?: boolean;
}

export const PromptInput: React.FC<PromptInputProps> = ({ 
  onSubmit, 
  isGenerating, 
  hasMessages = false 
}) => {
  const [prompt, setPrompt] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isGenerating) {
      onSubmit(prompt.trim());
      setPrompt('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [prompt]);

  const examplePrompts = [
    "A floating geometric cube rotating in 3D space",
    "Colorful particles forming a spiral galaxy",
    "Abstract shapes morphing into patterns",
    "Minimalist logo animation with smooth transitions"
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card-bg rounded-xl sm:rounded-2xl border border-border-color"
    >
      {/* Example Prompts - Only show when input is empty and no messages */}
      {!prompt && !hasMessages && (
        <div className="p-3 sm:p-4 pb-0">
          <div className="flex items-center gap-2 mb-2 sm:mb-3">
            <Sparkles size={12} className="text-accent sm:w-[14px] sm:h-[14px]" />
            <span className="text-xs sm:text-sm font-medium text-text-primary">Try these examples:</span>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {examplePrompts.map((example, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setPrompt(example)}
                className="text-xs px-2 py-1 sm:px-2.5 sm:py-1.5 bg-primary border border-border-color rounded-full
                         text-text-secondary hover:text-text-primary hover:border-accent/30
                         transition-all duration-200"
              >
                {example}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-3 sm:p-4">
        <div className="flex gap-2 sm:gap-3 items-end">
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe the animation you want to create..."
              className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-primary border border-border-color rounded-lg sm:rounded-xl 
                       text-text-primary placeholder-text-secondary resize-none text-sm sm:text-base
                       focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent
                       transition-all duration-200 min-h-[40px] sm:min-h-[44px] lg:min-h-[52px] max-h-32"
              disabled={isGenerating}
              rows={1}
            />
          </div>
          
          <motion.button
            type="submit"
            disabled={!prompt.trim() || isGenerating}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`
              flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 rounded-lg sm:rounded-xl font-medium
              transition-all duration-200 flex-shrink-0
              ${prompt.trim() && !isGenerating
                ? 'bg-accent hover:bg-accent-hover text-white shadow-lg shadow-accent/25'
                : 'bg-border-color text-text-secondary cursor-not-allowed'
              }
            `}
          >
            {isGenerating ? (
              <Loader2 size={16} className="animate-spin sm:w-[18px] sm:h-[18px]" />
            ) : (
              <Send size={16} className="sm:w-[18px] sm:h-[18px]" />
            )}
          </motion.button>
        </div>
        
        {/* Character Count and Instructions */}
        <div className="flex items-center justify-between mt-2 text-xs text-text-secondary">
          <div>
            {prompt.length > 0 && `${prompt.length}/1000 characters`}
          </div>
          <div className="hidden sm:block">
            Press Enter to send, Shift+Enter for new line
          </div>
        </div>
      </form>
    </motion.div>
  );
};