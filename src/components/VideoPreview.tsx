import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Download, Share2, RotateCcw, Eye } from 'lucide-react';
import { GenerateResponse } from '../types/api';
import { ApiService } from '../services/api';
import { User } from '../services/auth';
import { SSEService } from '../services/sse';
import { v4 as uuidv4 } from 'uuid';

interface VideoPreviewProps {
  isGenerating: boolean;
  generationProgress: number;
  videoUrl?: string;
  onRegenerate: () => void;
  prompt?: string;
  apiResponse?: GenerateResponse;
  currentMessage?: string;
  onVideoSelect?: (videoUrl: string) => void;
  user?: User | null;
  chatId?: number | null;
  onCustomRunComplete?: (msg: any) => void;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({
  isGenerating,
  generationProgress,
  videoUrl,
  onRegenerate,
  prompt,
  apiResponse,
  currentMessage = '',
  onVideoSelect,
  user,
  chatId,
  onCustomRunComplete
}) => {
  const [showJson, setShowJson] = useState(false);
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [editableCode, setEditableCode] = useState(apiResponse?.generatedCode || '');
  const [isRunningCustom, setIsRunningCustom] = useState(false);
  const [customProgress, setCustomProgress] = useState(0);
  const [customLog, setCustomLog] = useState('');

  // Update editableCode when apiResponse changes
  React.useEffect(() => {
    setEditableCode(apiResponse?.generatedCode || '');
  }, [apiResponse?.generatedCode]);

  const handleDownload = () => {
    if (videoUrl) {
      const downloadUrl = `${videoUrl}?download=true`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'animation.mp4';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleShare = async () => {
    if (videoUrl) {
      try {
        if (navigator.share) {
          await navigator.share({
            title: 'AI Generated Animation',
            text: prompt || 'Check out this AI generated animation!',
            url: videoUrl,
          });
        } else {
          // Fallback: copy to clipboard
          await navigator.clipboard.writeText(videoUrl);
          // You could show a toast notification here
          console.log('Video URL copied to clipboard');
        }
      } catch (error) {
        console.error('Error sharing:', error);
        // Fallback: copy to clipboard
        try {
          await navigator.clipboard.writeText(videoUrl);
          console.log('Video URL copied to clipboard');
        } catch (clipboardError) {
          console.error('Failed to copy to clipboard:', clipboardError);
        }
      }
    }
  };

  const LoadingState = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-primary/80 backdrop-blur-sm">
      <div className="text-center space-y-6 max-w-md px-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="mx-auto"
        >
          <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full" />
        </motion.div>
        
        <div className="space-y-3">
          <p className="text-text-primary font-medium text-lg">Creating your animation...</p>
          {prompt && (
            <p className="text-text-secondary text-sm px-3 py-2 bg-card-bg rounded-lg border border-border-color">
              "{prompt}"
            </p>
          )}
        </div>

        {/* Live Generation Updates */}
        <div className="w-full max-w-lg">
          <div className="bg-card-bg border border-border-color rounded-lg overflow-hidden">
            <div className="p-3 border-b border-border-color bg-primary">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-text-primary">Processing</span>
              </div>
            </div>
            <div className="h-32 flex items-center justify-center bg-primary p-4">
              {currentMessage ? (
                <motion.div
                  key={currentMessage}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <p className="text-sm text-text-primary">{currentMessage}</p>
                </motion.div>
              ) : (
                <div className="text-center">
                  <div className="w-5 h-5 mx-auto mb-2 opacity-50 animate-pulse bg-accent rounded-full" />
                  <p className="text-xs text-text-secondary">Initializing...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const JsonView = () => (
    <div className="absolute inset-0 bg-primary p-4 overflow-auto">
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-text-primary mb-2">Animation Structure</h3>
          <pre className="bg-card-bg border border-border-color rounded-lg p-3 text-xs text-text-secondary overflow-auto">
            {apiResponse?.jsonRepresentation ? 
              JSON.stringify(JSON.parse(apiResponse.jsonRepresentation), null, 2) : 
              'No data available'
            }
          </pre>
        </div>
      </div>
    </div>
  );

  const CodeEditorView = () => (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 flex flex-col">
        <h3 className="text-sm font-medium text-text-primary mb-2">Generated Code</h3>
        <textarea
          className="bg-card-bg border border-border-color rounded-lg p-3 text-xs text-text-secondary overflow-auto w-full h-full font-mono flex-1 resize-none"
          value={editableCode}
          onChange={e => setEditableCode(e.target.value)}
          style={{ fontFamily: 'monospace', minHeight: 0, height: '100%' }}
        />
      </div>
      <div className="mt-4 flex justify-end gap-2">
        {isRunningCustom && (
          <span className="text-xs text-accent">Running...</span>
        )}
        <button
          className="px-4 py-2 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover transition-colors"
          onClick={() => runUserCode(editableCode)}
          disabled={isRunningCustom}
        >
          Run
        </button>
      </div>
      {isRunningCustom && (
        <div className="mt-4 bg-hover-bg rounded-lg border border-border-color p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-accent">Generating...</span>
            <span className="text-xs text-text-secondary">{customProgress}%</span>
          </div>
          <div className="w-full bg-border-color rounded-full h-1.5 mb-2">
            <div
              className="bg-accent h-1.5 rounded-full"
              style={{ width: `${customProgress}%` }}
            />
          </div>
          <div className="text-xs text-text-secondary whitespace-pre-wrap max-h-32 overflow-auto">
            {customLog}
          </div>
        </div>
      )}
    </div>
  );

  const runUserCode = async (code: string) => {
    if (!user) {
      alert('User not found. Please login or refresh.');
      return;
    }
    setIsRunningCustom(true);
    setCustomProgress(0);
    setCustomLog('');
    const conversationId = uuidv4();
    // Add a new message to chat (optimistic UI)
    const newMessage = {
      id: Date.now().toString(),
      prompt: 'Custom code run', // Do not show code in chat
      timestamp: new Date(),
      isGenerating: true,
      generationProgress: 0,
      conversationId,
      logs: [],
      // customCode: code // Do not include code in chat message
    };
    if (onCustomRunComplete) {
      onCustomRunComplete({ ...newMessage }); // Add to chat as generating
    }
    // Subscribe to SSE logs
    const sse = SSEService.getInstance();
    sse.subscribe(conversationId, (msg: string) => {
      setCustomLog(msg);
      // Optionally parse progress from msg if available
      // setCustomProgress(...)
    });
    try {
      const resp = await ApiService.runCustomCode(
        code,
        user,
        chatId || 0,
        conversationId
      );
      // Unsubscribe from SSE
      sse.unsubscribe(conversationId);
      // Add completed message to chat
      const completedMessage = {
        ...newMessage,
        isGenerating: false,
        generationProgress: 100,
        apiResponse: resp,
        logs: [customLog],
        // prompt: 'Custom code run' // Already set
      };
      if (onCustomRunComplete) {
        onCustomRunComplete(completedMessage);
      }
      setCustomProgress(100);
      setCustomLog('');
      setShowCodeEditor(false); // Switch to video preview after run
    } catch (err: any) {
      sse.unsubscribe(conversationId);
      setCustomLog('Failed to run custom code: ' + (err?.message || err));
      if (onCustomRunComplete) {
        onCustomRunComplete({ ...newMessage, isGenerating: false, generationProgress: 0, logs: [customLog] });
      }
      setShowCodeEditor(false); // Switch to video preview on error
    } finally {
      setIsRunningCustom(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card-bg rounded-2xl border border-border-color overflow-hidden h-full flex flex-col"
    >
      {/* Video Container */}
      <div className="relative flex-1 bg-primary min-h-0 flex flex-col">
        {showCodeEditor && (apiResponse) ? (
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 flex flex-col">
              <h3 className="text-sm font-medium text-text-primary mb-2">Generated Code</h3>
              <textarea
                className="bg-card-bg border border-border-color rounded-lg p-3 text-xs text-text-secondary overflow-auto w-full h-full font-mono flex-1 resize-none"
                value={editableCode}
                onChange={e => setEditableCode(e.target.value)}
                style={{ fontFamily: 'monospace', minHeight: 0, height: '100%' }}
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              {isRunningCustom && (
                <span className="text-xs text-accent">Running...</span>
              )}
              <button
                className="px-4 py-2 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover transition-colors"
                onClick={() => runUserCode(editableCode)}
                disabled={isRunningCustom}
              >
                Run
              </button>
            </div>
            {isRunningCustom && (
              <div className="mt-4 bg-hover-bg rounded-lg border border-border-color p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-accent">Generating...</span>
                  <span className="text-xs text-text-secondary">{customProgress}%</span>
                </div>
                <div className="w-full bg-border-color rounded-full h-1.5 mb-2">
                  <div
                    className="bg-accent h-1.5 rounded-full"
                    style={{ width: `${customProgress}%` }}
                  />
                </div>
                <div className="text-xs text-text-secondary whitespace-pre-wrap max-h-32 overflow-auto">
                  {customLog}
                </div>
              </div>
            )}
          </div>
        ) : videoUrl && !isGenerating ? (
          <video
            key={videoUrl} // Force re-render when video URL changes
            className="w-full h-full object-contain"
            controls
            poster={`${videoUrl}?t=1`}
          >
            <source src={videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : isGenerating ? (
          <LoadingState />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto">
                <Play size={32} className="text-accent ml-1" />
              </div>
              <div className="space-y-2">
                <p className="text-text-primary font-medium">Preview will appear here</p>
                <p className="text-sm text-text-secondary max-w-sm">
                  Your generated animation will be displayed in this area
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      {(videoUrl || isGenerating || apiResponse) && (
        <div className="p-4 border-t border-border-color bg-card-bg">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover 
                         text-white rounded-lg font-medium transition-colors duration-200 text-sm"
                disabled={isGenerating || !videoUrl}
              >
                <Download size={16} />
                Download
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 bg-hover-bg hover:bg-border-color 
                         text-text-primary rounded-lg font-medium transition-colors duration-200 text-sm"
                disabled={isGenerating || !videoUrl}
              >
                <Share2 size={16} />
                Share
              </motion.button>

              {/* Code Editor Toggle */}
              {apiResponse && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowCodeEditor(!showCodeEditor)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium 
                           transition-colors duration-200 text-sm ${
                    showCodeEditor 
                      ? 'bg-accent text-white' 
                      : 'bg-hover-bg hover:bg-border-color text-text-primary'
                  }`}
                  disabled={isGenerating}
                >
                  <Eye size={16} />
                  {showCodeEditor ? 'Video' : 'Code'}
                </motion.button>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onRegenerate}
              className="flex items-center gap-2 px-4 py-2 text-text-secondary hover:text-text-primary
                       hover:bg-hover-bg rounded-lg transition-all duration-200 text-sm"
              disabled={isGenerating}
            >
              <RotateCcw size={16} />
              Regenerate
            </motion.button>
          </div>
        </div>
      )}
    </motion.div>
  );
};