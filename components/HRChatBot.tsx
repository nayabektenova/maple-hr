"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, Send, X, MessageSquare, Sparkles, Loader2 } from "lucide-react";

type MessageType = {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: Date;
};

export default function HRChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<MessageType[]>([
    {
      id: 1,
      text: "👋 Hello! I'm your AI HR Assistant powered by Gemma 2B. I can help you with:\n• Benefits & Insurance\n• PTO & Time-off\n• Company Policies\n• Payroll Questions\n• HR Procedures\n\nHow can I help you today?",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [model] = useState("google/gemma-2b-it"); // Using Gemma 2B
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Quick questions for HR
  const quickQuestions = [
    "What is our PTO policy?",
    "How do health benefits work?",
    "Who should I contact in HR?",
    "What's the dress code?",
    "How do I submit expenses?",
    "When is payday?"
  ];

  // Function to call Hugging Face API
  const callHuggingFaceAPI = async (prompt: string): Promise<string> => {
    const API_TOKEN = process.env.NEXT_PUBLIC_HUGGINGFACE_TOKEN;
    
    if (!API_TOKEN) {
      return "⚠️ API token not configured. Please add your Hugging Face token to .env.local file.";
    }

    try {
      const response = await fetch(
        `https://api-inference.huggingface.co/models/${model}`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${API_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: prompt,
            parameters: {
              max_new_tokens: 400,
              temperature: 0.7,
              top_p: 0.95,
              top_k: 50,
              repetition_penalty: 1.1,
              do_sample: true,
              return_full_text: false
            },
            options: {
              use_cache: true,
              wait_for_model: true
            }
          }),
        }
      );

      if (response.status === 503) {
        return "⏳ The AI model is loading. This can take 20-30 seconds on first request. Please wait a moment and try again.";
      }

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`API Error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      
      // Handle different response formats
      if (Array.isArray(data) && data[0]?.generated_text) {
        return data[0].generated_text.trim();
      } else if (data.generated_text) {
        return data.generated_text.trim();
      } else if (typeof data === 'string') {
        return data.trim();
      } else {
        console.log("Unexpected response format:", data);
        return "I received a response but couldn't process it. Please try again.";
      }
    } catch (error: any) {
      console.error("API Call Error:", error);
      
      if (error.message.includes("Failed to fetch")) {
        return "🌐 Network error. Please check your internet connection.";
      } else if (error.message.includes("429")) {
        return "⏸️ Rate limit exceeded. Please wait a minute before trying again.";
      } else if (error.message.includes("401")) {
        return "🔐 Invalid API token. Please check your Hugging Face token.";
      } else {
        return `❌ Error: ${error.message}. Please try again.`;
      }
    }
  };

  // Send message handler
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    // Add user message
    const userMessage: MessageType = {
      id: Date.now(),
      text: input,
      isUser: true,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    const userInput = input;
    setInput("");
    setIsLoading(true);

    try {
      // Create HR-focused prompt
      const prompt = `You are an expert HR Assistant at a modern company. 
You provide accurate, helpful, and professional answers about HR topics.

CONTEXT:
- Company has standard 15 days PTO, accruing monthly
- Health benefits include medical, dental, vision
- Payday is every other Friday
- HR contact: hr@company.com or (555) 123-4567
- Business casual dress code

QUESTION: ${userInput}

Provide a helpful, concise answer suitable for employees. If you don't know specific details, suggest contacting HR directly.`;

      const aiResponse = await callHuggingFaceAPI(prompt);
      
      // Add AI response
      const botMessage: MessageType = {
        id: Date.now() + 1,
        text: aiResponse,
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
      
    } catch (error) {
      console.error("Send message error:", error);
      const errorMessage: MessageType = {
        id: Date.now() + 2,
        text: "Sorry, I encountered an unexpected error. Please try again or contact HR directly.",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle quick question click
  const handleQuickQuestion = (question: string) => {
    setInput(question);
  };

  // Clear conversation
  const clearConversation = () => {
    setMessages([
      {
        id: Date.now(),
        text: "👋 Conversation cleared! How can I help you with HR questions today?",
        isUser: false,
        timestamp: new Date()
      }
    ]);
  };

  // Format time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex flex-col items-center group"
          aria-label="Open HR Assistant"
        >
          <div className="relative">
            <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur opacity-75 group-hover:opacity-100 animate-pulse"></div>
            <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110">
              <Bot size={28} />
            </div>
            <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-bounce">
              FREE
            </div>
          </div>
          <span className="mt-2 text-xs font-medium text-gray-700 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm">
            HR Assistant
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 h-[600px] animate-in slide-in-from-bottom-10">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 h-full flex flex-col">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                    <Bot size={24} />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">HR Assistant</h2>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-white/30 px-2 py-1 rounded-full flex items-center gap-1">
                        <Sparkles size={10} />
                        Gemma 2B AI
                      </span>
                      <span className="text-xs bg-green-500/30 px-2 py-1 rounded-full">
                        100% Free
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={clearConversation}
                    className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors"
                    title="Clear chat"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="hover:bg-white/20 p-2 rounded-full transition-colors"
                    aria-label="Close"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[85%] rounded-2xl p-4 ${
                    message.isUser
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-none"
                      : "bg-gray-50 border border-gray-100 text-gray-800 rounded-bl-none"
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {message.isUser ? (
                          <>
                            <div className="w-6 h-6 bg-blue-300 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold">U</span>
                            </div>
                            <span className="text-xs font-medium">You</span>
                          </>
                        ) : (
                          <>
                            <div className="w-6 h-6 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                              <Bot size={12} />
                            </div>
                            <span className="text-xs font-medium">HR Assistant</span>
                          </>
                        )}
                      </div>
                      <span className="text-xs opacity-70">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">
                      {message.text.split('\n').map((line, i) => (
                        <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-bl-none p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                        <Bot size={12} />
                      </div>
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                        <span className="text-sm text-gray-600">Thinking...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Questions */}
            {messages.length <= 2 && (
              <div className="px-4 py-3 border-t border-b bg-gray-50/50">
                <p className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
                  <MessageSquare size={12} />
                  Try asking:
                </p>
                <div className="flex flex-wrap gap-2">
                  {quickQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickQuestion(question)}
                      disabled={isLoading}
                      className="text-xs bg-white border border-gray-200 hover:border-purple-300 hover:bg-purple-50 text-gray-700 px-3 py-2 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-sm"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="p-4">
              <div className="relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Ask about benefits, policies, time-off..."
                  disabled={isLoading}
                  rows={2}
                  className="w-full border border-gray-300 rounded-xl p-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50 resize-none transition-all duration-200"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading || !input.trim()}
                  className="absolute right-4 bottom-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white p-2 rounded-xl shadow-lg disabled:shadow-none disabled:opacity-50 transition-all duration-200"
                  aria-label="Send message"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </div>
              
              <div className="flex items-center justify-between mt-3">
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <span>Powered by</span>
                  <a 
                    href="https://huggingface.co/google/gemma-2b-it" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:text-purple-700 hover:underline font-medium"
                  >
                    Gemma 2B
                  </a>
                  <span>• Free tier</span>
                </div>
                <div className="text-xs text-gray-500">
                  {messages.length - 1} messages
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}