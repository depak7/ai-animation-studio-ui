import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Zap, Palette, Video, ArrowRight } from 'lucide-react';

export const WelcomeScreen: React.FC = () => {
  const features = [
    {
      icon: Sparkles,
      title: "AI-Powered Generation",
      description: "Transform your ideas into stunning 2D animations using advanced AI"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Generate professional animations in seconds, not hours"
    },
    {
      icon: Palette,
      title: "Creative Freedom",
      description: "Describe any scene and watch it come to life with vibrant visuals"
    },
    {
      icon: Video,
      title: "High Quality Output",
      description: "Export your animations as high-resolution MP4 videos"
    }
  ];

  const slogans = [
    "Animate your ideas into flows.",
    "From prompt to motion — flowcharts reimagined."
  ];

  return (
    <div className="h-full flex items-center justify-center p-3 sm:p-4 lg:p-8 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto text-center w-full"
      >
        {/* Header */}
        <div className="mb-6 sm:mb-8 lg:mb-12">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 lg:mb-6"
          >
            <div className="p-2 sm:p-3 rounded-xl lg:rounded-2xl bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/20">
              <Sparkles className="text-accent" size={20} />
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold bg-gradient-to-r from-text-primary to-accent bg-clip-text text-transparent">
              AI Animation Studio
            </h1>
          </motion.div>
          
          {/* Slogans */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="space-y-1 sm:space-y-2 lg:space-y-3 mb-4 sm:mb-6 lg:mb-8"
          >
            {slogans.map((slogan, index) => (
              <motion.p
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                className="text-base sm:text-lg lg:text-2xl font-medium text-accent leading-relaxed"
              >
                {slogan}
              </motion.p>
            ))}
          </motion.div>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="text-sm sm:text-base lg:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed px-2 sm:px-4"
          >
            Transform your creative vision into stunning 2D animations with the power of AI. 
            Simply describe what you want to see, and watch it come to life.
          </motion.p>
        </div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8 lg:mb-12"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 + index * 0.1, duration: 0.5 }}
              className="bg-card-bg rounded-xl border border-border-color p-3 sm:p-4 lg:p-6 hover:border-accent/30 transition-colors duration-300"
            >
              <div className="flex items-start gap-2 sm:gap-3 lg:gap-4">
                <div className="p-1.5 sm:p-2 rounded-lg bg-accent/10 border border-accent/20 flex-shrink-0">
                  <feature.icon size={16} className="text-accent sm:w-[18px] sm:h-[18px] lg:w-5 lg:h-5" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-text-primary mb-1 sm:mb-2 text-sm sm:text-base">{feature.title}</h3>
                  <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">{feature.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="mt-4 sm:mt-6 lg:mt-8"
        >
          <div className="flex items-center justify-center gap-2 text-sm sm:text-base text-text-secondary mb-2">
            <span>Start by typing your animation idea in the prompt box below</span>
            <ArrowRight size={14} className="text-accent sm:w-4 sm:h-4" />
          </div>
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="text-xl sm:text-2xl"
          >
            ↓
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}