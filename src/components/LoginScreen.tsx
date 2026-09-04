import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { getRandomQuote, MotivationalQuote } from '../data/motivationalQuotes';
import { Shield, ArrowRight, Flame, Sparkles } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { signInWithGoogle, demoLogin, isConfigured } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentQuote, setCurrentQuote] = useState<MotivationalQuote>(getRandomQuote());

  useEffect(() => {
    // Fetch random quote from Supabase if configured, otherwise fallback to local random quote
    const fetchQuote = async () => {
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from('motivational_quotes')
            .select('*');
          if (data && data.length > 0) {
            const random = data[Math.floor(Math.random() * data.length)];
            setCurrentQuote({
              id: random.id,
              quote: random.quote,
              author: random.author,
              translation: random.translation
            });
          }
        } catch {
          // fallback to local random quote
        }
      }
    };
    fetchQuote();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setIsLoggingIn(true);
      setErrorMsg(null);
      await signInWithGoogle();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to authenticate with Google.');
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-[#e2e2e2] flex flex-col justify-center items-center p-4 sm:p-6 font-sans relative overflow-hidden">
      {/* Subtle Grid Background Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* Main Container */}
      <div className="w-full max-w-lg bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6 sm:p-10 shadow-2xl relative z-10">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <img src="/logo.png" alt="FocusTrack Emblem" className="w-12 h-12 object-contain invert mb-3 drop-shadow-md" />
          <div className="flex items-center gap-2 mb-2">
            <span className="font-geist text-3xl font-extrabold tracking-tighter text-white uppercase">
              FocusTrack
            </span>
          </div>
          <span className="font-technical text-[10px] text-[#8e9192] uppercase tracking-[0.3em] font-bold">
            RADICAL DISCIPLINE • PROTOCOL v1.0
          </span>
        </div>

        {/* Hero Motto Section - Ex Duris Gloria */}
        <div className="bg-[#0e0e0e] border border-[#262626] rounded-xl p-6 mb-8 text-center relative overflow-hidden group">
          <div className="absolute top-2 right-3 flex items-center gap-1 text-[9px] font-technical text-emerald-400 uppercase tracking-widest bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded">
            <Flame className="w-3 h-3 text-emerald-400" />
            <span>MOTTO OF THE DAY</span>
          </div>

          <h2 className="font-geist text-2xl sm:text-4xl font-extrabold text-white tracking-tight uppercase mt-2 mb-2 leading-tight">
            EX DURIS GLORIA
          </h2>
          <p className="font-technical text-xs text-slate-400 uppercase tracking-widest mb-4 italic">
            "From suffering comes glory"
          </p>

          <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-neutral-600 to-transparent mx-auto my-3" />

          {/* Dynamic Quote Box */}
          <div className="mt-4 pt-2">
            <p className="font-geist text-sm sm:text-base font-bold text-slate-200 uppercase tracking-wide leading-snug">
              "{currentQuote.quote}"
            </p>
            <p className="font-technical text-[10px] text-[#8e9192] uppercase tracking-widest mt-1">
              — {currentQuote.author} {currentQuote.translation ? `• ${currentQuote.translation}` : ''}
            </p>
          </div>
        </div>

        {/* Setup Banner if env vars missing */}
        {!isConfigured && (
          <div className="mb-6 p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-300 text-xs flex items-center gap-2">
            <Shield className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Supabase credentials updating. Demo mode enabled for instant preview.</span>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-900/50 text-red-400 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Heroic Google Login CTA */}
        <div className="space-y-3">
          <button
            onClick={handleGoogleLogin}
            disabled={isLoggingIn}
            className="w-full h-14 bg-white hover:bg-neutral-200 text-black font-geist font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-3 transition-all duration-200 shadow-lg active:scale-[0.99] disabled:opacity-70 cursor-pointer group"
          >
            {isLoggingIn ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {/* Official Google Icon */}
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="text-sm font-extrabold tracking-widest">CONTINUE WITH GOOGLE</span>
                <ArrowRight className="w-4 h-4 text-black group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          {/* Quick Demo Preview Option */}
          <button
            onClick={() => demoLogin()}
            className="w-full h-10 bg-[#1e1e1e] hover:bg-[#282828] text-slate-300 font-technical text-xs uppercase tracking-widest rounded-xl border border-[#333] transition-colors cursor-pointer"
          >
            Instant Demo Access
          </button>
        </div>

        {/* Heroic Security Footer */}
        <div className="mt-8 text-center font-technical text-[10px] text-[#8e9192] uppercase tracking-widest flex items-center justify-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-neutral-400" />
          <span>SINGLE SIGN-ON • 256-BIT ENCRYPTION • SUPABASE OAUTH</span>
        </div>
      </div>
    </div>
  );
};

