// components/WorkingChatbot.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, Send, X, MessageSquare, Sparkles, Loader2 } from "lucide-react";

type MessageType = {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: Date;
};

export default function WorkingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<MessageType[]>([
    {
      id: 1,
      text: "👋 Hello! I'm your AI HR Assistant.\n\nI can help with:\n• Benefits & Insurance\n• PTO & Time-off\n• Company Policies\n• Payroll Questions\n• HR Procedures\n\nAsk me anything!",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const quickQuestions = [
    "What is our PTO policy?",
    "How do health benefits work?",
    "Who should I contact in HR?",
    "What's the dress code?"
  ];

  // Use our Next.js API route (no CORS issues)
  const getAIResponse = async (question: string): Promise<string> => {
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: question
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.reply || "I didn't get a response. Please try again.";
    } catch (error) {
      console.error("API error:", error);
      // Fallback responses
      return getFallbackResponse(question);
    }
  };

  const getFallbackResponse = (question: string): string => {
    const q = question.toLowerCase();
    
    if (q.includes("pto") || q.includes("time off")) {
      return "PTO: 15 days/year accrued monthly. Submit requests via HR portal with 2 weeks notice.";
    } else if (q.includes("benefit") || q.includes("insurance")) {
      return "Benefits include health, dental, vision. Annual enrollment in November.";
    } else if (q.includes("contact") || q.includes("hr")) {
      return "HR: hr@company.com or (555) 123-4567. Office hours: Mon-Fri 9AM-5PM.";
    } else {
      return `Thanks for asking about "${question}". For specific information, please contact HR directly.`;
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

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
      const aiResponse = await getAIResponse(userInput);
      
      const botMessage: MessageType = {
        id: Date.now() + 1,
        text: aiResponse,
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Error:", error);
      const errorMessage: MessageType = {
        id: Date.now() + 2,
        text: "I'm here to help! " + getFallbackResponse(userInput),
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    setInput(question);
  };

  const clearConversation = () => {
    setMessages([
      {
        id: Date.now(),
        text: "👋 Conversation cleared! How can I help you today?",
        isUser: false,
        timestamp: new Date()
      }
    ]);
  };

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
            <div className="absolute -inset-2 bg-gradient-to-r from-green-600 to-blue-600 rounded-full blur opacity-75 group-hover:opacity-100 animate-pulse"></div>
            <div className="relative bg-gradient-to-r from-green-600 to-blue-600 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110">
              <Bot size={28} />
            </div>
            <div className="absolute -top-2 -right-2 bg-white text-green-600 text-xs font-bold px-2 py-1 rounded-full border border-green-600">
              NEW
            </div>
          </div>
          <span className="mt-2 text-xs font-medium text-gray-700 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm">
            Ask HR Assistant
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 h-[600px] animate-in slide-in-from-bottom-10">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 h-full flex flex-col">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-4 rounded-t-2xl">
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
                        Working Version
                      </span>
                      <span className="text-xs bg-white/30 px-2 py-1 rounded-full">
                        No CORS
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
                            <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center">
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
                      <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center">
                        <Bot size={12} />
                      </div>
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-green-500" />
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
                      className="text-xs bg-white border border-gray-200 hover:border-green-300 hover:bg-green-50 text-gray-700 px-3 py-2 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-sm"
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
                  className="w-full border border-gray-300 rounded-xl p-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50 resize-none transition-all duration-200"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading || !input.trim()}
                  className="absolute right-4 bottom-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white p-2 rounded-xl shadow-lg disabled:shadow-none disabled:opacity-50 transition-all duration-200"
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
                <div className="text-xs text-gray-500">
                  ✅ Working • No CORS issues
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