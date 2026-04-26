import React from 'react';
import { Info, Send } from 'lucide-react';
import BottomNavigation from '../../components/mobile/BottomNavigation';

interface Message {
  id: number;
  type: 'assistant' | 'user';
  text: string;
  timestamp: string;
}

const suggestionChips = [
  'What does my Cobb angle mean?',
  'How has my scoliosis evolved?',
  'When is my next exam?',
];

export default function AssistantScreen() {
  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: 1,
      type: 'assistant',
      text: 'Hello Maria! I\'m your clinical assistant. I can help you understand your exam results, track your progress, and answer questions about your treatment. What would you like to know?',
      timestamp: '10:23 AM',
    },
  ]);
  const [inputText, setInputText] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      type: 'user',
      text: inputText,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    };

    setMessages([...messages, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate assistant response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: messages.length + 2,
        type: 'assistant',
        text: 'Based on your latest exam from April 8, 2026, your Cobb angle is 15.2°, which indicates mild spinal curvature. This represents an improvement of 0.9° compared to your previous exam. Your treatment plan appears to be working well.',
        timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 2000);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputText(suggestion);
  };

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  return (
    <div className="h-screen w-screen max-w-[390px] mx-auto bg-white flex flex-col overflow-hidden">
      {/* Status Bar Safe Area */}
      <div className="h-11 bg-white" />

      {/* Header */}
      <div className="bg-white px-6 py-4 border-b border-[var(--scolio-border-light)]">
        <div className="flex items-center justify-between">
          <h2 className="text-[var(--scolio-text-primary)]">Clinical assistant</h2>
          <button className="p-1">
            <Info className="w-5 h-5 text-[var(--scolio-primary-blue)]" />
          </button>
        </div>
      </div>

      {/* Disclaimer Banner */}
      <div className="bg-[var(--scolio-warning-surface)] border-b border-[var(--scolio-warning-amber)] px-6 py-3">
        <p className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-caption)', lineHeight: '1.5' }}>
          Responses are based only on your clinical data and do not replace medical advice.
        </p>
      </div>

      {/* Chat Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 bg-[var(--scolio-page-surface)]">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex flex-col ${message.type === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[280px] px-4 py-3 ${
                  message.type === 'assistant'
                    ? 'bg-[var(--scolio-light-blue-surface)] border border-[var(--scolio-primary-blue)]'
                    : 'bg-[var(--scolio-page-surface)] border border-[var(--scolio-border-light)]'
                }`}
                style={{
                  borderRadius: message.type === 'assistant' ? '12px 12px 12px 4px' : '12px 12px 4px 12px',
                }}
              >
                <p className="text-[var(--scolio-text-primary)]" style={{ fontSize: 'var(--text-body)', lineHeight: '1.6' }}>
                  {message.text}
                </p>
              </div>
              <p className="text-[var(--scolio-text-secondary)] mt-1 px-2" style={{ fontSize: 'var(--text-caption)' }}>
                {message.timestamp}
              </p>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex flex-col items-start">
              <div
                className="bg-[var(--scolio-light-blue-surface)] border border-[var(--scolio-primary-blue)] px-4 py-3"
                style={{ borderRadius: '12px 12px 12px 4px' }}
              >
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-[var(--scolio-primary-blue)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-[var(--scolio-primary-blue)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-[var(--scolio-primary-blue)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {/* Suggestion Chips - Show only on first message */}
          {messages.length === 1 && (
            <div className="flex flex-col gap-2 mt-4">
              {suggestionChips.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="bg-white border border-[var(--scolio-primary-blue)] text-[var(--scolio-primary-blue)] px-4 py-3 rounded-full hover:bg-[var(--scolio-light-blue-surface)] transition-colors text-left"
                  style={{ fontSize: 'var(--text-body)' }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-[var(--scolio-border-light)]">
        {/* Small Disclaimer */}
        <div className="px-6 pt-3 pb-2">
          <p className="text-[var(--scolio-text-secondary)] text-center" style={{ fontSize: '11px', lineHeight: '1.4' }}>
            AI-generated responses may contain errors
          </p>
        </div>

        {/* Input Bar */}
        <div className="px-6 pb-4 flex items-center gap-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Write your question..."
            className="flex-1 px-4 py-3 border border-[var(--scolio-border-light)] rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--scolio-primary-blue)]"
            style={{ fontSize: 'var(--text-body)' }}
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="w-12 h-12 bg-[var(--scolio-primary-blue)] text-white rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#155A94] transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />

      {/* Home Indicator Safe Area */}
      <div className="h-8 bg-white" />
    </div>
  );
}
