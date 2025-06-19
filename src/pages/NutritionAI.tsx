import { useState, useRef, useEffect } from 'react';
import { IoSend, IoRefresh } from 'react-icons/io5';
import { RiRobot2Line } from 'react-icons/ri';
import { MdPerson, MdFoodBank } from 'react-icons/md';
import ReactMarkdown from 'react-markdown';
import nutritionService, { NutritionService, Message } from '../services/nutritionService';
import userSettings from '../utils/userSettings';

const NutritionAI = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showIcrModal, setShowIcrModal] = useState(false);
  const [tempIcrRatio, setTempIcrRatio] = useState(10);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Get user's ICR ratio from localStorage
  const [userIcrRatio, setUserIcrRatio] = useState(10);
  
  // Load ICR ratio from user settings
  useEffect(() => {
    const icrRatio = userSettings.getUserIcrRatio();
    setUserIcrRatio(icrRatio);
    setTempIcrRatio(icrRatio);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = NutritionService.formatMessage(input.trim(), 'user');
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await nutritionService.getNutritionInfo(userMessage.content, userIcrRatio);
      const aiMessage: Message = NutritionService.formatMessage(response.message, 'ai');
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('[NutritionAI] Error:', error);
      const errorMessage: Message = NutritionService.formatMessage(
        "Sorry, I couldn't retrieve the nutrition information. Please try again later.",
        'ai'
      );
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Example food suggestions with high carb options for ICR calculations
  const exampleFoods = [
    "1 cup of white rice",
    "large baked potato with skin",
    "2 slices of whole wheat bread",
    "1 cup pasta with tomato sauce",
    "1 medium banana",
    "1 bowl of breakfast cereal with milk"
  ];

  const handleExampleClick = (example: string) => {
    setInput(example);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-gradient-to-br from-[#F5F5DC] to-[#E8DCC4]">
      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_1px_1px,#8B7355_1px,transparent_0)] bg-[length:40px_40px]" />
      {/* Added relative positioning to ensure proper scroll container boundaries */}
      <div className="flex-grow flex flex-col max-w-4xl w-full mx-auto p-4 relative">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg p-6 mb-4 text-center border border-[#8B7355]/10">
          <h1 className="text-2xl font-bold text-[#8B7355] mb-1">Diabetes Nutrition AI</h1>
          <p className="text-[#8B7355]/80 text-sm">Get nutrition information and insulin requirements for any food</p>
          <div className="mt-2 flex items-center justify-center">
            <span className="text-sm text-[#8B7355]/80 mr-2">Your ICR Ratio: 1:{userIcrRatio}</span>
            <button
              onClick={() => setShowIcrModal(true)}
              className="text-xs bg-[#8B7355]/10 hover:bg-[#8B7355]/20 text-[#8B7355] px-2 py-1 rounded-full transition-colors"
            >
              Change
            </button>
          </div>
        </div>

        {/* Modified scroll container with fixed height and improved scroll behavior */}
        <div className="flex-grow bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg p-6 mb-4 border border-[#8B7355]/10 flex flex-col" style={{ height: '0' }}>
          <div className="overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-[#8B7355]/20 scrollbar-track-transparent">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-[#8B7355]/70">
                <MdFoodBank className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-center">Ask about the nutrition values and insulin requirements for any food</p>
                <p className="text-sm mt-2 opacity-75">
                  Type a food name or try one of these examples to get nutrition info with ICR (Insulin-to-Carb Ratio) calculations:
                </p>
                <div className="flex flex-wrap gap-2 mt-4 justify-center">
                  {exampleFoods.map((food, index) => (
                    <button 
                      key={index}
                      onClick={() => handleExampleClick(food)}
                      className="bg-[#8B7355]/10 hover:bg-[#8B7355]/20 text-[#8B7355] px-3 py-1.5 rounded-full text-sm transition-colors duration-200"
                    >
                      {food}
                    </button>
                  ))}
                </div>
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
              placeholder="Enter food name, portion and description..."
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
      
      {/* ICR Modal */}
      {showIcrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-xl font-bold text-[#8B7355] mb-4">Update Insulin-to-Carb Ratio</h3>
            <p className="text-sm text-[#8B7355]/80 mb-4">
              Your ICR ratio determines how many grams of carbohydrates one unit of insulin covers.
            </p>
            
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-[#8B7355]">1 unit of insulin covers:</span>
                <span className="px-3 py-1 bg-[#8B7355]/10 rounded-lg text-[#8B7355] font-medium">
                  {tempIcrRatio} grams
                </span>
              </div>
              
              <input
                type="range"
                min="1"
                max="30"
                value={tempIcrRatio}
                onChange={(e) => setTempIcrRatio(parseInt(e.target.value))}
                className="w-full h-2 bg-[#D4C5B9] rounded-lg appearance-none cursor-pointer accent-[#8B7355]"
              />
              
              <div className="flex justify-between text-xs text-[#8B7355]/70 mt-1">
                <span>1g</span>
                <span>15g</span>
                <span>30g</span>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowIcrModal(false)}
                className="px-4 py-2 border border-[#8B7355]/30 text-[#8B7355] rounded-xl hover:bg-[#8B7355]/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setUserIcrRatio(tempIcrRatio);
                  
                  // Update using the user settings utility
                  userSettings.updateUserIcrRatio(tempIcrRatio);
                  
                  setShowIcrModal(false);
                }}
                className="px-4 py-2 bg-gradient-to-r from-[#8B7355] to-[#A68A64] text-white rounded-xl hover:shadow-md transition-all"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NutritionAI;