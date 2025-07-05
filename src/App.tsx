import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { Header } from './components/Header';
import { PromptInput } from './components/PromptInput';
import { VideoPreview } from './components/VideoPreview';
import { ChatHistory } from './components/ChatHistory';
import { ConversationView } from './components/ConversationView';
import { StatusIndicator } from './components/StatusIndicator';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ApiService } from './services/api';
import { AuthService, User } from './services/auth';
import { SSEService } from './services/sse';
import { Chat, ChatMessage, ChatListItem } from './types/api';

type Status = 'idle' | 'generating' | 'success' | 'error';

function App() {
  const [activeSection, setActiveSection] = useState('new');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isChatHistoryOpen, setIsChatHistoryOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [currentChatId, setCurrentChatId] = useState<number | null>(null);
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sseService] = useState(() => SSEService.getInstance());
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | undefined>(undefined);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth and load user
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);

        // Get current user or create guest user (synchronous)
        let currentUser = AuthService.getCurrentUser();
        if (!currentUser) {
          currentUser = AuthService.createGuestUser();
        }
        setUser(currentUser);

        // Initialize Google Auth in background (don't wait for it)
        AuthService.initializeGoogleAuth().catch(error => {
          console.warn('Google Auth initialization failed:', error);
        });

        // Load chats for this user
        await loadChats(currentUser);
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        // Create guest user as fallback
        const guestUser = AuthService.createGuestUser();
        setUser(guestUser);
        await loadChats(guestUser);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const loadChats = async (currentUser: User | null = user) => {
    try {
      const chatList = await ApiService.getAllChats(currentUser);
      setChats(chatList);
    } catch (error) {
      console.error('Failed to load chats:', error);
    }
  };

  const loadChatHistory = async (chatId: number) => {
    try {
      const history = await ApiService.getChatHistory(user, chatId);

      // Convert to our Chat format
      const messages: ChatMessage[] = history.map(item => ({
        id: item.id.toString(),
        prompt: item.prompt,
        timestamp: new Date(item.createdAt),
        isGenerating: false,
        generationProgress: 100,
        apiResponse: {
          id: item.id,
          prompt: item.prompt,
          userId: item.userId,
          chatId: item.chatId,
          conversationId: '',
          jsonRepresentation: item.jsonRepresentation,
          generatedCode: '',
          videoSource: item.videoSource,
          createdAt: item.createdAt
        }
      }));

      const chat: Chat = {
        id: chatId.toString(),
        title: chats.find(c => c.id === chatId)?.title || 'Chat',
        messages,
        lastUpdated: new Date(),
        latestVideoUrl: messages[messages.length - 1]?.apiResponse?.videoSource
      };

      setCurrentChat(chat);
      setCurrentChatId(chatId);

      // Set the video preview to the latest video from this chat
      if (chat.latestVideoUrl) {
        setSelectedVideoUrl(chat.latestVideoUrl);
      } else {
        setSelectedVideoUrl(undefined);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  // Generate a chat title from the first prompt
  const generateChatTitle = (prompt: string): string => {
    const words = prompt.split(' ').slice(0, 6);
    return words.join(' ') + (prompt.split(' ').length > 6 ? '...' : '');
  };

  // Real API generation process with SSE logs
  const handleGenerateAnimation = async (prompt: string) => {
    let chatToUpdate = currentChat;
    let chatId = currentChatId || 0; // Use 0 for new chats
    const conversationId = uuidv4();

    // Hide preview when starting new generation
    setSelectedVideoUrl(undefined);

    // If no current chat, create a new one
    if (!currentChat) {
      const newChat: Chat = {
        id: '0',
        title: generateChatTitle(prompt),
        messages: [],
        lastUpdated: new Date(),
      };

      chatToUpdate = newChat;
      setCurrentChat(newChat);
      setCurrentChatId(0);
    }

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      prompt,
      timestamp: new Date(),
      isGenerating: true,
      generationProgress: 0,
      conversationId,
      logs: [],
    };

    // Add message to current chat
    const updatedChat = {
      ...chatToUpdate!,
      messages: [...chatToUpdate!.messages, newMessage],
      lastUpdated: new Date(),
    };

    setCurrentChat(updatedChat);
    setIsGenerating(true);
    setStatus('generating');
    setError(null);
    setCurrentMessage('');

    // Subscribe to SSE for this conversation
    sseService.subscribe(conversationId, (message: string) => {
      setCurrentMessage(message);
    });

    try {
      // Call the real API with conversationId and user auth
      const response = await ApiService.generateAnimation(prompt, user, chatId, conversationId);

      // Validate response before using it
      if (!response) {
        throw new Error('No response received from server');
      }

      // Ensure required fields exist
      const validatedResponse = {
        id: response.id || 0,
        prompt: response.prompt || prompt,
        userId: response.userId || '',
        chatId: response.chatId || chatId,
        conversationId: response.conversationId || conversationId,
        jsonRepresentation: response.jsonRepresentation || '{}',
        generatedCode: response.generatedCode || '',
        videoSource: response.videoSource || '',
        createdAt: response.createdAt || new Date().toISOString()
      };

      const completedMessage: ChatMessage = {
        ...newMessage,
        isGenerating: false,
        generationProgress: 100,
        apiResponse: validatedResponse
      };

      const finalChat = {
        ...updatedChat,
        id: validatedResponse.chatId.toString(),
        messages: updatedChat.messages.map(msg =>
          msg.id === newMessage.id ? completedMessage : msg
        ),
        latestVideoUrl: validatedResponse.videoSource,
        lastUpdated: new Date(),
      };

      setCurrentChat(finalChat);
      setCurrentChatId(validatedResponse.chatId);

      // Only set video URL if it exists
      if (validatedResponse.videoSource) {
        setSelectedVideoUrl(validatedResponse.videoSource);
      }

      setIsGenerating(false);
      setStatus('success');
      setCurrentMessage('');

      // Unsubscribe from SSE
      sseService.unsubscribe(conversationId);

      // Reload chats to get updated list
      loadChats();

      // Reset status after 3 seconds
      setTimeout(() => setStatus('idle'), 3000);

    } catch (err) {
      setIsGenerating(false);
      setStatus('error');

      // Better error handling
      let errorMessage = 'Failed to generate animation';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }

      setError(errorMessage);

      // Update message with error state
      const erroredMessage: ChatMessage = {
        ...newMessage,
        isGenerating: false,
        generationProgress: 0,
      };

      const errorChat = {
        ...updatedChat,
        messages: updatedChat.messages.map(msg =>
          msg.id === newMessage.id ? erroredMessage : msg
        ),
        lastUpdated: new Date(),
      };

      setCurrentChat(errorChat);
      setCurrentMessage('');

      // Unsubscribe from SSE
      sseService.unsubscribe(conversationId);

      // Reset status after 5 seconds
      setTimeout(() => {
        setStatus('idle');
        setError(null);
      }, 5000);
    }
  };

  const handleRegenerate = () => {
    if (!isGenerating && currentChat && currentChat.messages.length > 0) {
      const lastMessage = currentChat.messages[currentChat.messages.length - 1];
      handleGenerateAnimation(lastMessage.prompt);
    }
  };

  const handleSelectChat = (chatItem: ChatListItem) => {
    loadChatHistory(chatItem.id);
    setActiveSection('new');
    setIsChatHistoryOpen(false); // Close mobile chat history
  };

  const handleNewChat = () => {
    setCurrentChat(null);
    setCurrentChatId(null);
    setSelectedVideoUrl(undefined);
    setActiveSection('new');
    setError(null);
    setCurrentMessage('');
    setIsChatHistoryOpen(false); // Close mobile chat history
  };

  const handleStarChat = (chatId: string) => {
    // TODO: Implement star functionality with API
    console.log('Star chat:', chatId);
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      await ApiService.deleteChat(user, parseInt(chatId));

      // Remove from local state
      setChats(prev => prev.filter(chat => chat.id.toString() !== chatId));

      // If this was the current chat, clear it
      if (currentChat?.id === chatId) {
        setCurrentChat(null);
        setCurrentChatId(null);
        setSelectedVideoUrl(undefined);
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
  };

  const handleVideoSelect = (videoUrl: string) => {
    setSelectedVideoUrl(videoUrl);
  };

  const handleLogin = async () => {
    try {
      const loggedInUser = await AuthService.signInWithGoogle(user || undefined);
      setUser(loggedInUser);

      // Reload chats for the logged-in user
      loadChats(loggedInUser);

      // Clear current chat since we're switching users
      setCurrentChat(null);
      setCurrentChatId(null);
      setSelectedVideoUrl(undefined);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = () => {
    AuthService.signOut();

    // Create new guest user
    const guestUser = AuthService.createGuestUser();
    setUser(guestUser);

    // Clear current state
    setCurrentChat(null);
    setCurrentChatId(null);
    setSelectedVideoUrl(undefined);
    setChats([]);

    // Load chats for guest user
    loadChats(guestUser);
  };

  // Close mobile menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (isMobileOpen) {
        setIsMobileOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMobileOpen]);

  const getLatestResponse = () => {
    if (!currentChat || currentChat.messages.length === 0) return undefined;

    // Find the latest message with a successful response
    for (let i = currentChat.messages.length - 1; i >= 0; i--) {
      const message = currentChat.messages[i];
      if (message.apiResponse) {
        return message.apiResponse;
      }
    }
    return undefined;
  };

  const getLatestMessage = () => {
    if (!currentChat || currentChat.messages.length === 0) return null;
    return currentChat.messages[currentChat.messages.length - 1];
  };

  const renderMainContent = () => {
    switch (activeSection) {
      case 'new':
        return (
          <div className="flex flex-col h-full">
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col lg:flex-row min-h-0">
              {/* Video Preview Area */}
              <div className="flex-1 flex flex-col p-3 sm:p-4 lg:p-6 pb-2 sm:pb-3 min-h-0">
                {/* Status Indicator */}
                <AnimatePresence>
                  {(status !== 'idle' || error) && (
                    <div className="mb-3 sm:mb-4">
                      <StatusIndicator
                        status={status}
                        message={error || undefined}
                      />
                    </div>
                  )}
                </AnimatePresence>

                {/* Video Preview */}
                <div className="flex-1 min-h-0">
                  {currentChat ? (
                    <VideoPreview
                      isGenerating={getLatestMessage()?.isGenerating || false}
                      generationProgress={getLatestMessage()?.generationProgress || 0}
                      videoUrl={selectedVideoUrl}
                      onRegenerate={handleRegenerate}
                      prompt={getLatestMessage()?.prompt}
                      apiResponse={getLatestResponse()}
                      currentMessage={currentMessage}
                      onVideoSelect={handleVideoSelect}
                    />
                  ) : (
                    <WelcomeScreen />
                  )}
                </div>
              </div>

              {/* Conversation View - Hidden on mobile, shown on larger screens */}
              {currentChat && (
                <div className="hidden lg:block w-80 border-l border-border-color">
                  <ConversationView
                    chat={currentChat}
                    isGenerating={isGenerating}
                    onVideoSelect={handleVideoSelect}
                  />
                </div>
              )}
            </div>

            {/* Prompt Input Area */}
            <div className="p-3 sm:p-4 lg:p-6 pt-2 sm:pt-3">
              <PromptInput
                onSubmit={handleGenerateAnimation}
                isGenerating={isGenerating}
                hasMessages={currentChat ? currentChat.messages.length > 0 : false}
              />
            </div>
          </div>
        );

      case 'starred':
        const starredChats = chats.filter(chat => chat.starred);
        return (
          <div className="flex items-center justify-center h-full p-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-xl sm:text-2xl">⭐</span>
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-text-primary mb-1 sm:mb-2">Starred Animations</h2>
              <p className="text-sm sm:text-base text-text-secondary">
                {starredChats.length === 0
                  ? 'Your favorite animations will appear here'
                  : `${starredChats.length} starred animation${starredChats.length === 1 ? '' : 's'}`
                }
              </p>
            </motion.div>
          </div>
        );

      case 'settings':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto p-3 sm:p-4 lg:p-6"
          >
            <div className="bg-card-bg rounded-2xl border border-border-color p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-text-primary mb-4 sm:mb-6">Settings</h2>

              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-text-primary mb-2 sm:mb-3">User Information</h3>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm text-text-secondary">User Type</span>
                      <span className="text-xs sm:text-sm text-text-primary">
                        {user?.isGuest ? 'Guest User' : 'Authenticated User'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm text-text-secondary">User ID</span>
                      <span className="text-xs sm:text-sm text-text-primary font-mono bg-primary px-2 py-1 rounded">
                        {user?.id || 'Not available'}
                      </span>
                    </div>
                    {user && !user.isGuest && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm text-text-secondary">Name</span>
                          <span className="text-xs sm:text-sm text-text-primary">{user.name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm text-text-secondary">Email</span>
                          <span className="text-xs sm:text-sm text-text-primary">{user.email}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-text-primary mb-2 sm:mb-3">API Configuration</h3>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm text-text-secondary">Base URL</span>
                      <span className="text-xs sm:text-sm text-text-primary font-mono bg-primary px-2 py-1 rounded">
                        localhost:8080
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm text-text-secondary">Authentication</span>
                      <span className="text-xs sm:text-sm text-text-primary">
                        {user?.isGuest ? 'Guest Mode' : 'JWT Token'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-text-primary mb-2 sm:mb-3">Generation Settings</h3>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm text-text-secondary">Video Quality</span>
                      <select className="bg-primary border border-border-color rounded-lg px-2 py-1 sm:px-3 sm:py-1 text-xs sm:text-sm text-text-primary">
                        <option>HD (720p)</option>
                        <option>Full HD (1080p)</option>
                        <option>4K (2160p)</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm text-text-secondary">Frame Rate</span>
                      <select className="bg-primary border border-border-color rounded-lg px-2 py-1 sm:px-3 sm:py-1 text-xs sm:text-sm text-text-primary">
                        <option>24 FPS</option>
                        <option>30 FPS</option>
                        <option>60 FPS</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-text-primary mb-2 sm:mb-3">Preferences</h3>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm text-text-secondary">Auto-save generations</span>
                      <input type="checkbox" className="accent-accent" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm text-text-secondary">Show real-time updates</span>
                      <input type="checkbox" className="accent-accent" defaultChecked />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  // Show loading screen while initializing
  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary text-text-primary flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Initializing AI Animation Studio...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary text-text-primary">
      <div className="flex flex-col h-screen">
        {/* Header */}
        <Header
          user={user}
          onLogin={handleLogin}
          onLogout={handleLogout}
          onChatHistoryToggle={() => setIsChatHistoryOpen(!isChatHistoryOpen)}
          isChatHistoryOpen={isChatHistoryOpen}
        />

        <div className="flex flex-1 overflow-hidden relative">

          {/* Chat History Panel - Mobile overlay or desktop sidebar */}
          <AnimatePresence>
            {isChatHistoryOpen && (
              <div className="fixed inset-0 z-50 lg:hidden">
                {/* Mobile overlay background */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/50"
                  onClick={() => setIsChatHistoryOpen(false)}
                />

                {/* Chat history content */}
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="absolute left-0 top-0 h-full w-80 max-w-[85vw] bg-card-bg border-r border-border-color shadow-2xl overflow-hidden"
                >
                  <ChatHistory
                    chats={chats}
                    onSelectChat={handleSelectChat}
                    onNewChat={handleNewChat}
                    onStarChat={handleStarChat}
                    onDeleteChat={handleDeleteChat}
                    currentChatId={currentChat?.id}
                    onClose={() => setIsChatHistoryOpen(false)}
                  />
                </motion.div>

              </div>
            )}
          </AnimatePresence>

          {/* Desktop Chat History Panel */}
          <div className="hidden lg:block w-80 border-r border-border-color bg-card-bg">
            <ChatHistory
              chats={chats}
              onSelectChat={handleSelectChat}
              onNewChat={handleNewChat}
              onStarChat={handleStarChat}
              onDeleteChat={handleDeleteChat}
              currentChatId={currentChat?.id}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="h-full"
              >
                {renderMainContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;