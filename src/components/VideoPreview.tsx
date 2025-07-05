import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Download, Share2, RotateCcw, Eye } from 'lucide-react';
import { GenerateResponse } from '../types/api';

interface VideoPreviewProps {
  isGenerating: boolean;
  generationProgress: number;
  videoUrl?: string;
  onRegenerate: () => void;
  prompt?: string;
  apiResponse?: GenerateResponse;
  currentMessage?: string;
  onVideoSelect?: (videoUrl: string) => void;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({
  isGenerating,
  generationProgress,
  videoUrl,
  onRegenerate,
  prompt,
  apiResponse,
  currentMessage = '',
  onVideoSelect
}) => {
  const [showJson, setShowJson] = useState(false);

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card-bg rounded-2xl border border-border-color overflow-hidden h-full flex flex-col"
    >
      {/* Video Container */}
      <div className="relative flex-1 bg-primary min-h-0">
        {showJson && apiResponse ? (
          <JsonView />
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

              {/* JSON Toggle */}
              {apiResponse && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowJson(!showJson)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium 
                           transition-colors duration-200 text-sm ${
                    showJson 
                      ? 'bg-accent text-white' 
                      : 'bg-hover-bg hover:bg-border-color text-text-primary'
                  }`}
                  disabled={isGenerating}
                >
                  <Eye size={16} />
                  {showJson ? 'Video' : 'Structure'}
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