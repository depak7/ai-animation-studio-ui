import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface StatusIndicatorProps {
  status: 'idle' | 'generating' | 'success' | 'error';
  message?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, message }) => {
  if (status === 'idle') return null;

  const statusConfig = {
    generating: {
      icon: Loader2,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      borderColor: 'border-accent/20',
      animation: 'animate-spin',
    },
    success: {
      icon: CheckCircle,
      color: 'text-green-400',
      bgColor: 'bg-green-400/10',
      borderColor: 'border-green-400/20',
      animation: '',
    },
    error: {
      icon: AlertCircle,
      color: 'text-red-400',
      bgColor: 'bg-red-400/10',
      borderColor: 'border-red-400/20',
      animation: '',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex items-center gap-3 p-3 rounded-lg border ${config.bgColor} ${config.borderColor}`}
    >
      <Icon size={18} className={`${config.color} ${config.animation}`} />
      <span className="text-sm font-medium text-text-primary">
        {message || 
          (status === 'generating' ? 'Generating animation...' :
           status === 'success' ? 'Animation generated successfully!' :
           'Failed to generate animation')
        }
      </span>
    </motion.div>
  );
};