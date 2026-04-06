// src/components/ui/AIAssistant.tsx
// Enhanced AI Assistant with Gemini API, markdown rendering, and context-awareness

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X, Send, Bot, Sparkles, Zap, RefreshCw, Copy, Check } from 'lucide-react';
import { chatWithAIApi, type ChatMessage } from '@/api/aiApi';

// ── Quick suggestion chips ────────────────────────────────────
const SUGGESTIONS = [
  'How do I improve my quantitative score?',
  'What topics appear most in TCS NQT?',
  'Give me a study plan for 2 weeks',
  'Explain permutations & combinations',
  'How to solve time & work problems fast?',
  'What is the best strategy for verbal ability?',
];

// ── Simple markdown-to-JSX renderer ──────────────────────────
const MarkdownText = ({ text }: { text: string }) => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      elements.push(<div key={`br-${i}`} className="h-1" />);
    } else if (line.startsWith('### ')) {
      elements.push(
        <p key={i} className="font-semibold text-neon-cyan text-xs mt-2 mb-0.5">
          {line.replace('### ', '')}
        </p>
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <p key={i} className="font-bold text-neon-violet text-xs mt-2 mb-0.5">
          {line.replace('## ', '')}
        </p>
      );
    } else if (line.startsWith('**') && line.endsWith('**')) {
      elements.push(
        <p key={i} className="font-semibold text-white/90 text-xs">
          {line.slice(2, -2)}
        </p>
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <div key={i} className="flex gap-1.5 text-xs">
          <span className="text-neon-cyan mt-0.5 flex-shrink-0">•</span>
          <span>{renderInline(line.slice(2))}</span>
        </div>
      );
    } else if (/^\d+\. /.test(line)) {
      const num = line.match(/^(\d+)\. /)?.[1];
      elements.push(
        <div key={i} className="flex gap-1.5 text-xs">
          <span className="text-neon-violet flex-shrink-0 font-bold">{num}.</span>
          <span>{renderInline(line.replace(/^\d+\. /, ''))}</span>
        </div>
      );
    } else {
      elements.push(
        <p key={i} className="text-xs leading-relaxed">{renderInline(line)}</p>
      );
    }
    i++;
  }
  return <div className="space-y-0.5">{elements}</div>;
};

const renderInline = (text: string): (string | React.ReactElement)[] => {
  const parts: (string | React.ReactElement)[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const raw = match[0];
    if (raw.startsWith('**')) {
      parts.push(<strong key={match.index} className="font-bold text-white/95">{raw.slice(2, -2)}</strong>);
    } else if (raw.startsWith('`')) {
      parts.push(<code key={match.index} className="bg-neon-cyan/10 text-neon-cyan px-1 py-0.5 rounded text-[10px] font-mono-code">{raw.slice(1, -1)}</code>);
    }
    last = match.index + raw.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
};

// ── Copy button ───────────────────────────────────────────────
const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button onClick={copy} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/5 text-white/20 hover:text-white/50">
      {copied ? <Check size={11} className="text-neon-green" /> : <Copy size={11} />}
    </button>
  );
};

// ── Main Component ────────────────────────────────────────────
const AIAssistant = () => {
  const [isOpen, setIsOpen]     = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role:    'ai',
      content: "Hello! I'm your AI Study Assistant 🧠\n\nI can help you with:\n- **Aptitude questions** with step-by-step solutions\n- **Study plans** tailored to your weak areas\n- **Topic explanations** in simple language\n- **Exam strategies** for TCS, Infosys, campus placements\n\nWhat would you like to work on today?",
    },
  ]);
  const [input,   setInput]   = useState('');
  const [typing,  setTyping]  = useState(false);
  const [error,   setError]   = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 200);
  }, [isOpen]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || typing) return;
    setError('');

    const userMsg: ChatMessage = { role: 'user', content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    try {
      const res = await chatWithAIApi(text.trim(), messages);
      if (res.success && res.data?.reply) {
        setMessages((prev) => [...prev, { role: 'ai', content: res.data!.reply }]);
      } else {
        setError(res.message || 'AI response failed. Please try again.');
        // Remove user message on failure
        setMessages((prev) => prev.slice(0, -1));
      }
    } catch (error) {
      console.error('[AI Chat Error]', error);
      let errorMsg = 'Network error. Please check your connection.';
      
      // More detailed error reporting
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          errorMsg = 'You need to login to use the AI assistant.';
        } else if (error.message.includes('Network')) {
          errorMsg = 'Network error. Make sure the backend server is running.';
        } else if (error.message.includes('timeout')) {
          errorMsg = 'Request timed out. Please try again.';
        } else {
          errorMsg = error.message || 'Network error. Please try again.';
        }
      }
      
      setError(errorMsg);
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setTyping(false);
    }
  };

  const clearChat = () => {
    setMessages([{
      role:    'ai',
      content: "Chat cleared! I'm ready to help you again. What would you like to study? 🚀",
    }]);
    setError('');
  };

  return (
    <>
      {/* ── Floating Orb ─────────────────────────────────────── */}
      <button
        id="ai-assistant-toggle"
        onClick={() => setIsOpen((o) => !o)}
        className={cn(
          'fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full',
          'flex items-center justify-center',
          'transition-all duration-300',
          isOpen
            ? 'bg-neon-violet scale-90'
            : 'bg-gradient-to-br from-neon-violet to-neon-cyan animate-orb-pulse',
        )}
        style={{ boxShadow: isOpen ? '0 0 30px rgba(157,0,255,0.6)' : '0 0 30px rgba(0,245,255,0.4), 0 0 60px rgba(157,0,255,0.2)' }}
        aria-label="Toggle AI Assistant"
      >
        {isOpen ? <X className="text-white" size={20} /> : <Sparkles className="text-white" size={22} />}
      </button>

      {/* ── Chat Panel ───────────────────────────────────────── */}
      <div className={cn(
        'fixed bottom-24 right-6 z-50 w-80 sm:w-96',
        'glass-strong rounded-2xl border border-neon-violet/20',
        'flex flex-col overflow-hidden',
        'transition-all duration-300 origin-bottom-right',
        'shadow-[0_0_40px_rgba(157,0,255,0.2)]',
        isOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-90 pointer-events-none'
      )}>

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
          <div className="w-9 h-9 rounded-xl bg-neon-violet/20 border border-neon-violet/30 flex items-center justify-center">
            <Bot size={18} className="text-neon-violet" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white font-inter">AI Study Assistant</p>
            <p className="text-xs text-neon-green flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-neon-green inline-block animate-neon-pulse" />
              {typing ? 'Thinking...' : 'Gemini Active'}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={clearChat} title="Clear chat"
              className="p-1.5 rounded-lg text-white/20 hover:text-white/50 hover:bg-white/5 transition-all">
              <RefreshCw size={13} />
            </button>
            <Zap size={16} className="text-neon-amber animate-neon-pulse" />
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-80" style={{ scrollbarWidth: 'thin' }}>
          {messages.map((msg, idx) => (
            <div key={idx} className={cn('flex gap-2', msg.role === 'user' && 'flex-row-reverse')}>
              <div className={cn(
                'w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-xs',
                msg.role === 'ai'
                  ? 'bg-neon-violet/20 border border-neon-violet/30 text-neon-violet'
                  : 'bg-neon-cyan/20 border border-neon-cyan/30 text-neon-cyan'
              )}>
                {msg.role === 'ai' ? '🤖' : '👤'}
              </div>
              <div className={cn(
                'max-w-[78%] p-3 rounded-xl font-inter group relative',
                msg.role === 'ai'
                  ? 'bg-white/5 text-white/80 rounded-tl-sm'
                  : 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 rounded-tr-sm'
              )}>
                {msg.role === 'ai' ? (
                  <MarkdownText text={msg.content} />
                ) : (
                  <p className="text-xs leading-relaxed">{msg.content}</p>
                )}
                {msg.role === 'ai' && (
                  <div className="absolute top-2 right-2">
                    <CopyButton text={msg.content} />
                  </div>
                )}
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

          {error && (
            <div className="bg-neon-red/10 border border-neon-red/20 rounded-xl p-3 text-neon-red text-xs font-inter">
              ⚠️ {error}
              <button onClick={() => setError('')} className="ml-2 underline opacity-70">Dismiss</button>
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
                className="text-[10px] px-2.5 py-1 rounded-full border border-neon-violet/25 text-neon-violet/70 hover:border-neon-violet/60 hover:text-neon-violet bg-neon-violet/5 transition-all duration-200 font-inter text-left"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="p-3 border-t border-white/5 flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
            placeholder="Ask anything — questions, concepts, strategies..."
            disabled={typing}
            className="flex-1 cyber-input h-9 text-xs px-3 disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || typing}
            className="w-9 h-9 rounded-xl bg-neon-violet/20 border border-neon-violet/30 flex items-center justify-center text-neon-violet hover:bg-neon-violet/30 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {typing ? (
              <div className="w-3 h-3 border-2 border-neon-violet/30 border-t-neon-violet rounded-full animate-spin" />
            ) : (
              <Send size={14} />
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default AIAssistant;
