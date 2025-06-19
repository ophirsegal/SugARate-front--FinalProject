import { useState, useRef, useEffect } from 'react';
import { IoSend, IoRefresh } from 'react-icons/io5';
import { RiRobot2Line } from 'react-icons/ri';
import { MdPerson } from 'react-icons/md';
import ReactMarkdown from 'react-markdown';
import aiChatService, { AIChatService, Message } from '../services/aiChatService';

const AIchat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = AIChatService.formatMessage(input.trim(), 'user');
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await aiChatService.sendMessage(userMessage.content);
      const aiMessage: Message = AIChatService.formatMessage(response.message, 'ai');
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('[AIchat] Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-gradient-to-br from-[#F5F5DC] to-[#E8DCC4]">
      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_1px_1px,#8B7355_1px,transparent_0)] bg-[length:40px_40px]" />
      {/* Added relative positioning to ensure proper scroll container boundaries */}
      <div className="flex-grow flex flex-col max-w-4xl w-full mx-auto p-4 relative">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg p-6 mb-4 text-center border border-[#8B7355]/10">
          <h1 className="text-2xl font-bold text-[#8B7355] mb-1">AI Health Assistant</h1>
          <p className="text-[#8B7355]/80 text-sm">Get personalized diabetes management advice</p>
        </div>

        {/* Modified scroll container with fixed height and improved scroll behavior */}
        <div className="flex-grow bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg p-6 mb-4 border border-[#8B7355]/10 flex flex-col" style={{ height: '0' }}>
          <div className="overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-[#8B7355]/20 scrollbar-track-transparent">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-[#8B7355]/70">
                <RiRobot2Line className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-center">Start a conversation with your AI Health Assistant</p>
                <p className="text-sm mt-2 opacity-75">
                  Ask about diabetes management, nutrition advice, or health tips
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start gap-3 ${message.type === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md ${
                        message.type === 'ai' ? 'bg-[#8B7355]' : 'bg-[#A68A64]'
                      }`}
                    >
                      {message.type === 'ai' ? (
                        <RiRobot2Line className="w-5 h-5 text-white" />
                      ) : (
                        <MdPerson className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div className={`flex-grow max-w-[80%] ${message.type === 'user' ? 'text-right' : ''}`}>
                      <div
                        className={`inline-block rounded-2xl px-4 py-2 shadow-sm ${
                          message.type === 'ai'
                            ? 'bg-[#8B7355]/10 text-[#8B7355] border border-[#8B7355]/10'
                            : 'bg-gradient-to-r from-[#8B7355] to-[#A68A64] text-white'
                        }`}
                      >
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                      <div className="text-xs text-[#8B7355]/60 mt-1">
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#8B7355] rounded-full animate-bounce opacity-60" />
                    <div
                      className="w-2 h-2 bg-[#8B7355] rounded-full animate-bounce opacity-80"
                      style={{ animationDelay: '0.2s' }}
                    />
                    <div
                      className="w-2 h-2 bg-[#8B7355] rounded-full animate-bounce"
                      style={{ animationDelay: '0.4s' }}
                    />
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        <div className="relative">
          <form
            onSubmit={handleSubmit}
            className="relative bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-[#8B7355]/10"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about diabetes management..."
              className="w-full pl-4 pr-12 py-4 bg-transparent rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8B7355] placeholder-[#8B7355]/50"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-gradient-to-r from-[#8B7355] to-[#A68A64] text-white hover:shadow-lg disabled:opacity-50 disabled:hover:shadow-none transition-all duration-200"
            >
              {isLoading ? (
                <IoRefresh className="w-5 h-5 animate-spin" />
              ) : (
                <IoSend className="w-5 h-5" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIchat;