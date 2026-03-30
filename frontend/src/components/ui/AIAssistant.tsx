// src/components/ui/AIAssistant.tsx
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X, Send, Bot, Sparkles, Zap } from 'lucide-react';

interface Message {
  id:      string;
  role:    'user' | 'ai';
  content: string;
  time:    string;
}

const SUGGESTIONS = [
  'How do I improve my quantitative score?',
  'What topics appear most in TCS NQT?',
  'Give me a study plan for 2 weeks',
  'Explain permutations & combinations',
];

const AI_RESPONSES: Record<string, string> = {
  default: 'Great question! Based on your performance data, I recommend focusing on time management first. Try solving 20 questions in 25 minutes daily. Your weak areas appear to be ratio & proportion — I have curated resources ready for you.',
};

const AIAssistant = () => {
  const [isOpen,   setIsOpen]   = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id:      '1',
      role:    'ai',
      content: 'Hello! I\'m your AI Study Assistant 🧠 I can analyze your performance, suggest study plans, and answer aptitude questions. How can I help?',
      time:    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input,    setInput]    = useState('');
  const [typing,   setTyping]   = useState(false);
  const bottomRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = {
      id:      Date.now().toString(),
      role:    'user',
      content: text,
      time:    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      const aiMsg: Message = {
        id:      (Date.now() + 1).toString(),
        role:    'ai',
        content: AI_RESPONSES.default,
        time:    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setTyping(false);
    }, 1500);
  };

  return (
    <>
      {/* Floating Orb */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className={cn(
          'fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full',
          'flex items-center justify-center',
          'transition-all duration-300',
          'shadow-[0_0_30px_rgba(157,0,255,0.6)]',
          isOpen ? 'bg-neon-violet scale-90' : 'bg-gradient-to-br from-neon-violet to-neon-cyan animate-orb-pulse',
        )}
        style={{ boxShadow: isOpen ? '0 0 30px rgba(157,0,255,0.6)' : '0 0 30px rgba(0,245,255,0.4), 0 0 60px rgba(157,0,255,0.2)' }}
        aria-label="Toggle AI Assistant"
      >
        {isOpen ? <X className="text-white" size={20} /> : <Sparkles className="text-white" size={22} />}
      </button>

      {/* Chat Panel */}
      <div className={cn(
        'fixed bottom-24 right-6 z-50 w-80 sm:w-96',
        'glass-strong rounded-2xl border border-neon-violet/20',
        'flex flex-col overflow-hidden',
        'transition-all duration-400 origin-bottom-right',
        'shadow-[0_0_40px_rgba(157,0,255,0.2)]',
        isOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-90 pointer-events-none'
      )}>

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
          <div className="w-9 h-9 rounded-xl bg-neon-violet/20 border border-neon-violet/30 flex items-center justify-center">
            <Bot size={18} className="text-neon-violet" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white font-inter">AI Study Assistant</p>
            <p className="text-xs text-neon-green flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-neon-green inline-block animate-neon-pulse" />
              Neural Active
            </p>
          </div>
          <div className="ml-auto">
            <Zap size={16} className="text-neon-amber animate-neon-pulse" />
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-72">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn('flex gap-2 animate-fade-up', msg.role === 'user' && 'flex-row-reverse')}
            >
              <div className={cn(
                'w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-xs',
                msg.role === 'ai'
                  ? 'bg-neon-violet/20 border border-neon-violet/30 text-neon-violet'
                  : 'bg-neon-cyan/20 border border-neon-cyan/30 text-neon-cyan'
              )}>
                {msg.role === 'ai' ? '🤖' : '👤'}
              </div>
              <div className={cn(
                'max-w-[78%] p-3 rounded-xl text-xs font-inter leading-relaxed',
                msg.role === 'ai'
                  ? 'bg-white/5 text-white/80 rounded-tl-sm'
                  : 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 rounded-tr-sm'
              )}>
                {msg.content}
                <span className="block text-white/20 text-[10px] mt-1">{msg.time}</span>
              </div>
            </div>
          ))}

          {typing && (
            <div className="flex gap-2 items-center animate-fade-in">
              <div className="w-7 h-7 rounded-lg bg-neon-violet/20 border border-neon-violet/30 flex items-center justify-center text-xs">🤖</div>
              <div className="bg-white/5 rounded-xl rounded-tl-sm p-3 flex gap-1">
                {[0.1, 0.2, 0.3].map((d) => (
                  <div key={d} className="w-1.5 h-1.5 rounded-full bg-neon-violet animate-neon-pulse" style={{ animationDelay: `${d}s` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick Suggestions */}
        {messages.length <= 1 && (
          <div className="px-4 pb-2 flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="text-[10px] px-2.5 py-1 rounded-full border border-neon-violet/25 text-neon-violet/70 hover:border-neon-violet/60 hover:text-neon-violet bg-neon-violet/5 transition-all duration-200 font-inter"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="p-3 border-t border-white/5 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
            placeholder="Ask anything..."
            className="flex-1 cyber-input h-9 text-xs px-3"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim()}
            className="w-9 h-9 rounded-xl bg-neon-violet/20 border border-neon-violet/30 flex items-center justify-center text-neon-violet hover:bg-neon-violet/30 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </>
  );
};

export default AIAssistant;
