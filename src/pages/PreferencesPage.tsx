import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import { ArrowLeft, Sun, Moon, Monitor, Globe, Bell, Play, RotateCcw } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

interface PreferencesPageProps {
  supabaseUser: User | null;
  onBack: () => void;
  showToast: (msg: string) => void;
}

interface Prefs {
  language: string;
  email_course_updates: boolean;
  email_new_lessons: boolean;
  email_offers: boolean;
  auto_play_next: boolean;
  resume_from_last: boolean;
  default_playback_speed: number;
}

const DEFAULT_PREFS: Prefs = {
  language: 'en',
  email_course_updates: true,
  email_new_lessons: true,
  email_offers: true,
  auto_play_next: true,
  resume_from_last: true,
  default_playback_speed: 1.0,
};

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-6 sm:w-11 sm:h-6 rounded-full transition-colors shrink-0 ${
        checked ? 'bg-[#D7FF2F]' : 'bg-white/[0.1]'
      }`}
    >
      <div
        className={`absolute top-1 left-1 w-4 h-4 sm:w-4 sm:h-4 rounded-full bg-black transition-transform ${
          checked ? 'translate-x-4 sm:translate-x-5' : ''
        }`}
      />
    </button>
  );
}

export function PreferencesPage({ supabaseUser, onBack, showToast }: PreferencesPageProps) {
  const { theme, setTheme } = useTheme();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (supabaseUser) loadPrefs();
  }, [supabaseUser]);

  const loadPrefs = async () => {
    if (!supabaseUser) return;
    const { data } = await supabase.from('user_preferences').select('*').eq('user_id', supabaseUser.id).single();
    if (data) {
      setPrefs({
        language: data.language || 'en',
        email_course_updates: data.email_course_updates ?? true,
        email_new_lessons: data.email_new_lessons ?? true,
        email_offers: data.email_offers ?? true,
        auto_play_next: data.auto_play_next ?? true,
        resume_from_last: data.resume_from_last ?? true,
        default_playback_speed: data.default_playback_speed || 1.0,
      });
    }
  };

  const savePrefs = async () => {
    if (!supabaseUser) return;
    setSaving(true);
    const { error } = await supabase.from('user_preferences').upsert({ 
      user_id: supabaseUser.id, 
      ...prefs, 
      appearance: theme, 
      updated_at: new Date().toISOString() 
    });
    if (error) showToast('Error saving preferences');
    else showToast('Preferences saved');
    setSaving(false);
  };

  const resetPrefs = () => {
    setPrefs(DEFAULT_PREFS);
    setTheme('dark');
    showToast('Reset to defaults');
  };

  const update = (key: keyof Prefs, value: any) => setPrefs(p => ({ ...p, [key]: value }));

  return (
    <main className="flex-1 max-w-[700px] w-full mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-12">
      <button onClick={onBack} className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm mb-5 sm:mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Courses
      </button>

      <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-5 sm:mb-8">Preferences</h1>

      <div className="space-y-4 sm:space-y-6">
        {/* APPEARANCE SECTION */}
        <div className="bg-[#111111] border border-white/[0.08] rounded-xl sm:rounded-2xl p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Sun className="w-4 h-4 text-[#D7FF2F]" />
            <h2 className="text-sm sm:text-base font-bold text-white">Appearance</h2>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar">
            {[
              { value: 'light', icon: Sun, label: 'Light' },
              { value: 'dark', icon: Moon, label: 'Dark' },
              { value: 'system', icon: Monitor, label: 'System' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value as any)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium border transition-all whitespace-nowrap shrink-0 ${
                  theme === opt.value ? 'bg-[#D7FF2F]/10 border-[#D7FF2F]/30 text-[#D7FF2F]' : 'border-white/[0.08] text-zinc-400 hover:border-white/20'
                }`}
              >
                <opt.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* LANGUAGE SECTION */}
        <div className="bg-[#111111] border border-white/[0.08] rounded-xl sm:rounded-2xl p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Globe className="w-4 h-4 text-[#D7FF2F]" />
            <h2 className="text-sm sm:text-base font-bold text-white">Language</h2>
          </div>
          <select
            value={prefs.language}
            onChange={e => update('language', e.target.value)}
            className="w-full bg-[#0A0A0A] border border-white/[0.08] focus:border-[#D7FF2F] rounded-xl px-4 py-2.5 sm:py-3 text-white text-sm outline-none transition-colors appearance-none cursor-pointer"
          >
            <option value="en" className="bg-[#111111]">English</option>
            <option value="te" className="bg-[#111111]">తెలుగు (Telugu)</option>
          </select>
        </div>

        {/* NOTIFICATIONS SECTION */}
        <div className="bg-[#111111] border border-white/[0.08] rounded-xl sm:rounded-2xl p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Bell className="w-4 h-4 text-[#D7FF2F]" />
            <h2 className="text-sm sm:text-base font-bold text-white">Email Notifications</h2>
          </div>
          <div className="space-y-3 sm:space-y-4">
            {([
              { key: 'email_course_updates' as const, label: 'Course Updates', desc: 'When a course you enrolled in gets new content' },
              { key: 'email_new_lessons' as const, label: 'New Lessons', desc: 'Notifications when new lessons are published' },
              { key: 'email_offers' as const, label: 'Offers & Announcements', desc: 'Deals, discounts, and platform news' },
            ]).map(item => (
              <div key={item.key} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-white">{item.label}</p>
                  <p className="text-[11px] sm:text-xs text-zinc-500">{item.desc}</p>
                </div>
                <Toggle checked={prefs[item.key]} onChange={v => update(item.key, v)} />
              </div>
            ))}
          </div>
        </div>

        {/* PLAYBACK SECTION */}
        <div className="bg-[#111111] border border-white/[0.08] rounded-xl sm:rounded-2xl p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Play className="w-4 h-4 text-[#D7FF2F]" />
            <h2 className="text-sm sm:text-base font-bold text-white">Learning Preferences</h2>
          </div>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-white">Auto Play Next Lesson</p>
                <p className="text-[11px] sm:text-xs text-zinc-500">Automatically play the next lesson</p>
              </div>
              <Toggle checked={prefs.auto_play_next} onChange={v => update('auto_play_next', v)} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-white">Resume from Last Position</p>
                <p className="text-[11px] sm:text-xs text-zinc-500">Continue where you left off</p>
              </div>
              <Toggle checked={prefs.resume_from_last} onChange={v => update('resume_from_last', v)} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-white">Default Playback Speed</p>
                <p className="text-[11px] sm:text-xs text-zinc-500">Applied to all lessons</p>
              </div>
              <select
                value={prefs.default_playback_speed}
                onChange={e => update('default_playback_speed', parseFloat(e.target.value))}
                className="bg-[#0A0A0A] border border-white/[0.08] focus:border-[#D7FF2F] rounded-xl px-2.5 sm:px-3 py-2 text-white text-xs sm:text-sm outline-none transition-colors appearance-none cursor-pointer shrink-0"
              >
                {[0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0].map(s => (
                  <option key={s} value={s} className="bg-[#111111]">{s}x</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={savePrefs}
            disabled={saving}
            className="px-5 sm:px-6 py-2.5 rounded-xl bg-[#D7FF2F] hover:bg-[#c5ee20] text-black text-xs sm:text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
          <button
            onClick={resetPrefs}
            className="px-5 sm:px-6 py-2.5 rounded-xl border border-white/[0.08] text-zinc-400 text-xs sm:text-sm font-medium hover:bg-white/[0.04] transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset to Default
          </button>
        </div>
      </div>
    </main>
  );
}