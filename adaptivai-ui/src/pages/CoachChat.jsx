import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, RefreshCw, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { chatWithCoach, getChatHistory } from '../services/api';

export default function CoachChat({ user }) {
  const { lang, t } = useLanguage();
  const localUser = JSON.parse(localStorage.getItem('adaptivai_user') || localStorage.getItem('user') || '{}');
  const userId = user?.id || user?.userId || localUser?.id || localUser?.userId;

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (userId) {
      loadHistory();
    } else {
      setInitialLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadHistory = async () => {
    setInitialLoading(true);
    try {
      const history = await getChatHistory(userId);
      if (Array.isArray(history) && history.length > 0) {
        setMessages(
          history.map((m) => ({
            sender: m.sender,
            text: m.message,
            time: m.createdAt
          }))
        );
      } else {
        setMessages([
          {
            sender: 'coach',
            text: t('coachChatDefaultGreeting'),
            time: new Date()
          }
        ]);
      }
    } catch (err) {
      console.error(lang === 'en' ? 'Failed to fetch chat history:' : 'Chat geçmişi alınamadı:', err);
      setMessages([
        {
          sender: 'coach',
          text: t('coachChatFallbackGreeting'),
          time: new Date()
        }
      ]);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading || !userId) return;

    const userText = inputMessage.trim();
    setInputMessage('');

    // Arayüze hemen kullanıcının mesajını ekle
    setMessages((prev) => [
      ...prev,
      { sender: 'user', text: userText, time: new Date() }
    ]);
    setLoading(true);

    try {
      const res = await chatWithCoach(userId, userText);
      setMessages((prev) => [
        ...prev,
        { sender: 'coach', text: res.reply, time: new Date() }
      ]);
    } catch (err) {
      console.error(lang === 'en' ? 'Coach could not reply:' : 'Koç yanıt veremedi:', err);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'coach',
          text: t('coachChatErrorMessage'),
          time: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="p-16 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
        <span>{t('coachChatLoadingHistory')}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl font-sans">
      {/* Üst Bar */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              {t('coachChatTitle')} <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            </h3>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> {t('coachChatOnline')}
            </span>
          </div>
        </div>
      </div>

      {/* Mesaj Akışı */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg, idx) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={idx}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                  isUser
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-800 border border-slate-700 text-emerald-400'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[78%] p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                  isUser
                    ? 'bg-emerald-500 text-slate-950 font-medium rounded-tr-none'
                    : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none shadow-md'
                }`}
              >
                {msg.text}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 text-emerald-400 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl rounded-tl-none text-xs text-slate-400 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              <span>{t('coachChatTyping')}</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Alanı */}
      <form onSubmit={handleSendMessage} className="p-3 sm:p-4 bg-slate-950/80 border-t border-slate-800 flex items-center gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder={t('coachChatInputPlaceholder')}
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
        />
        <button
          type="submit"
          disabled={loading || !inputMessage.trim()}
          className="p-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}