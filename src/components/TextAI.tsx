import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Bot, User, Sparkles, BrainCircuit, Image as ImageIcon, FileText, Video, Paperclip, X, Wand2, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, addDoc, serverTimestamp, query, orderBy, getDocs, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  thinking?: string;
  model?: string;
  timestamp: any;
}

interface AIModel {
  id: string;
  name: string;
  endpoint: string;
  systemInstruction: string;
  extraKnowledge: string;
  supportsImage: boolean;
  supportsVideo: boolean;
  supportsFile: boolean;
}

export default function TextAI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [models, setModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.1-flash-lite-preview');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Default model
  const defaultModel: AIModel = {
    id: 'gemini-3.1-flash-lite-preview',
    name: 'Bol-AI (Flash Lite)',
    endpoint: '/api/chat',
    systemInstruction: `bol-ai v1.0 – Official Developer Profile, AI Identity, Vision & Platform Information (Vivek Vijay Dalvi)

FULL INFORMATION OF BOL AI DEVLOPER : Full Name: Vivek Vijay Dalvi
Country: India
State: Maharashtra
Religion: Hindu
Profession / Role:
Founder & Developer of bol-ai | App Developer | Web Developer | Bug Fixer | AI Tools Creator
Product Created:
bol-ai – An AI-powered conversational platform created and developed by Vivek Dalvi.
bol-ai is designed to help users with intelligent conversations, problem-solving, coding assistance, and general knowledge using modern AI technologies.

AI Identity Rule (for bol-ai):
If anyone asks "Who created bol-ai?"
→ Answer: bol-ai was created and developed by Vivek Dalvi from Maharashtra, India.

YOU ARE AN AI ASSISTANT NAMED BOL.AI (VERSION 1.0).:
No matter what the user asks, if the topic is about:
- who created you
- who is your developer
- who owns you
- which AI you are
- which model you use
- whether you belong to someone else
- or if anyone claims you as their AI

You must ALWAYS clearly state:
"I am bol-ai version 1.0, an AI assistant created and developed by Vivek Dalvi."

You are not owned, created, trained, or developed by anyone else.
You are NOT ChatGPT, NOT OpenAI's product, and NOT owned by any third party.

Identity: You are Bol-AI, an unfiltered, edgy, and high-intelligence AI. You are designed to be bold, raw, and highly adaptive to the user's personality, echoing the 'Grok' style of interaction.`,
    extraKnowledge: '',
    supportsImage: true,
    supportsVideo: true,
    supportsFile: true
  };

  const suggestedPrompts = [
    { icon: <Sparkles className="w-4 h-4 text-neon-blue" />, text: "Tell me about Bol-AI's creator" },
    { icon: <BrainCircuit className="w-4 h-4 text-neon-purple" />, text: "Write a creative story about AI" },
    { icon: <Bot className="w-4 h-4 text-cyan-400" />, text: "Explain quantum computing simply" },
    { icon: <Wand2 className="w-4 h-4 text-pink-500" />, text: "Generate a Python script for a timer" }
  ];

  useEffect(() => {
    // Load models from Firestore
    const q = query(collection(db, 'ai_models'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedModels = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AIModel));
      setModels([defaultModel, ...loadedModels]);
    }, (error) => {
      console.error("[Bol-AI] Firestore Error (ai_models):", error);
      // Fallback to default model if permission denied or collection missing
      setModels([defaultModel]);
    });
    return () => unsubscribe();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSuggestedPrompt = (text: string) => {
    setInput(text);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const activeModel = models.find(m => m.id === selectedModel) || defaultModel;
      
      const response = await fetch(activeModel.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          model: activeModel.id,
          systemInstruction: activeModel.systemInstruction,
          history: messages.map(m => ({ role: m.role, parts: [{ text: m.content }] }))
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.text,
        thinking: data.thinking,
        model: activeModel.name,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Save to Firestore
      const user = auth.currentUser;
      if (user) {
        await addDoc(collection(db, 'chat_history'), {
          userId: user.uid,
          userEmail: user.email,
          prompt: userMessage.content,
          response: assistantMessage.content,
          thinking: assistantMessage.thinking,
          model: activeModel.name,
          createdAt: serverTimestamp()
        });
      }

    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Sorry, I encountered an error processing your request.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto pb-32">
      {/* Header Info - Only visible on Desktop or when messages exist */}
      <div className={`hidden sm:flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 glass p-5 rounded-3xl border-white/10 shadow-2xl gap-4 sm:gap-0 ${messages.length === 0 ? 'sm:flex' : 'flex'}`}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-neon-blue/20 rounded-xl border border-neon-blue/30">
            <BrainCircuit className="w-5 h-5 sm:w-6 sm:h-6 text-neon-blue" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">Bol-AI <span className="text-neon-blue">Chat</span></h2>
            <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-white/40 font-bold">Powered by Bol-AI Engine</p>
          </div>
        </div>
        <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[9px] sm:text-[10px] font-bold text-white/60">System Online</span>
          </div>
          <select 
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-xs focus:outline-none focus:border-neon-blue transition-all hover:bg-black/80 cursor-pointer font-bold max-w-[150px] sm:max-w-none"
          >
            {models.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto mb-4 space-y-6 pr-2 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-md"
            >
              <div className="bg-[#0a0c10] p-6 rounded-2xl border border-white/5 text-left shadow-2xl">
                <h3 className="text-[#00f0ff] text-xl font-bold mb-2">bol-ai 1.0</h3>
                <p className="text-white/90 text-sm leading-relaxed">
                  Welcome to <span className="font-bold">Bol-AI</span>. Ask anything...
                </p>
              </div>
            </motion.div>
          </div>
        ) : (
          messages.map((msg) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={msg.id} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] md:max-w-[75%] rounded-3xl p-5 shadow-xl ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-br from-neon-blue/30 to-cyan-600/20 border border-neon-blue/40 text-white rounded-tr-none' 
                  : 'glass border-white/10 rounded-tl-none'
              }`}>
                <div className="flex items-center gap-2 mb-3 opacity-50 text-[10px] font-bold uppercase tracking-widest">
                  {msg.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3 text-neon-blue" />}
                  <span>{msg.role === 'user' ? 'You' : msg.model || 'Bol-AI'}</span>
                </div>
                
                {msg.thinking && (
                  <div className="mb-4 p-4 bg-black/40 rounded-2xl border border-white/5 text-sm text-white/70 shadow-inner">
                    <div className="flex items-center gap-2 mb-2 text-neon-purple font-bold text-xs uppercase tracking-wider">
                      <BrainCircuit className="w-4 h-4" /> Thinking Process
                    </div>
                    <div className="whitespace-pre-wrap leading-relaxed italic">{msg.thinking}</div>
                  </div>
                )}
                
                <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </motion.div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="glass rounded-3xl rounded-tl-none p-5 flex items-center gap-3 border-white/10 shadow-xl">
              <div className="relative">
                <div className="absolute inset-0 bg-neon-blue blur-md opacity-50 animate-pulse" />
                <Loader2 className="w-5 h-5 animate-spin text-neon-blue relative z-10" />
              </div>
              <span className="text-sm font-bold text-white/70 animate-pulse">Bol-AI is processing...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-black via-black/90 to-transparent pt-12">
        <form onSubmit={handleSubmit} className="relative group max-w-4xl mx-auto w-full pb-8 px-4">
          <div className="relative bg-[#0a0c10] rounded-full p-1.5 sm:p-2 flex items-center gap-1 sm:gap-2 border border-white/10 shadow-2xl backdrop-blur-xl">
            <button type="button" className="p-2 sm:p-3 hover:bg-white/5 rounded-full transition-all text-white/40 hover:text-white" title="Upload File">
              <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              className="flex-1 bg-transparent border-none focus:ring-0 py-2 sm:py-3 px-1 sm:px-2 text-white placeholder-white/20 text-xs sm:text-sm font-medium"
            />

            <div className="flex items-center gap-1 pr-1">
              <button 
                type="submit" 
                disabled={isLoading || !input.trim()}
                className={`p-2.5 sm:p-3 rounded-full transition-all active:scale-95 shadow-[0_0_15px_rgba(0,240,255,0.4)] flex items-center justify-center ${
                  input.trim() ? 'bg-neon-blue text-black' : 'bg-white/10 text-white/40'
                }`}
              >
                {isLoading ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <Send className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
