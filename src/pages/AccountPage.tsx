import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../types';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import { INITIAL_COURSES } from '../data/courses';
import { ArrowLeft, User as UserIcon, Mail, Phone, Shield, CreditCard, Key, CheckCircle, Calendar, Link2, X, Loader2, ShieldCheck, Send } from 'lucide-react';

interface AccountPageProps {
  user: UserProfile | null;
  supabaseUser: User | null;
  onBack: () => void;
  showToast: (msg: string) => void;
}

interface PurchaseRecord {
  course_id: string;
  amount: number | null;
  payment_method: string | null;
  transaction_id: string | null;
  created_at: string;
  payment_status: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;
const PASSWORD_STRENGTH_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function AccountPage({ user, supabaseUser, onBack, showToast }: AccountPageProps) {
  const [activeSection, setActiveSection] = useState<'profile' | 'billing' | 'security'>('profile');
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(supabaseUser?.email || '');
  const [editPhone, setEditPhone] = useState((supabaseUser?.user_metadata?.phone as string) || '');
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  // ── Connect Email OTP States ──
  const [showConnectEmail, setShowConnectEmail] = useState(false);
  const [connectStep, setConnectStep] = useState<'password' | 'otp' | 'done'>('password');
  const [connectPassword, setConnectPassword] = useState('');
  const [connectConfirmPassword, setConnectConfirmPassword] = useState('');
  const [otpInput, setOtpInput] = useState(['', '', '', '', '', '']);
  const [otpExpiry, setOtpExpiry] = useState(0);
  const [connectingEmail, setConnectingEmail] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendingOtp, setResendingOtp] = useState(false);
  const [otpTimer, setOtpTimer] = useState<NodeJS.Timeout | null>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const sections = [
    { id: 'profile' as const, label: 'Profile', icon: UserIcon },
    { id: 'billing' as const, label: 'Billing', icon: CreditCard },
    { id: 'security' as const, label: 'Security', icon: Shield },
  ];

  useEffect(() => {
    if (supabaseUser) fetchPurchases();
  }, [supabaseUser]);

  useEffect(() => {
    setEditName(user?.name || '');
    setEditEmail(supabaseUser?.email || '');
    setEditPhone((supabaseUser?.user_metadata?.phone as string) || '');
  }, [user, supabaseUser]);

  // OTP countdown
  useEffect(() => {
    if (otpExpiry <= 0) return;
    if (otpTimer) clearInterval(otpTimer);
    const timer = setInterval(() => {
      setOtpExpiry(prev => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    setOtpTimer(timer);
    return () => { if (timer) clearInterval(timer); };
  }, [otpExpiry > 0]);

  const fetchPurchases = async () => {
    if (!supabaseUser) return;
    const { data } = await supabase
      .from('purchases')
      .select('course_id, amount, payment_method, transaction_id, created_at, payment_status')
      .eq('user_id', supabaseUser.id)
      .eq('payment_status', 'success')
      .order('created_at', { ascending: false });
    setPurchases((data as PurchaseRecord[]) || []);
  };

  const getCourseTitle = (courseId: string) => {
    return INITIAL_COURSES.find((c) => c.id === courseId)?.title || courseId;
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) { showToast('Name cannot be empty'); return; }
    if (!EMAIL_REGEX.test(editEmail.trim())) { showToast('Please enter a valid email address'); return; }
    if (editPhone.trim() && !PHONE_REGEX.test(editPhone.trim())) { showToast('Please enter a valid 10-digit mobile number'); return; }

    setSaving(true);
    const emailChanged = editEmail.trim() !== (supabaseUser?.email || '');
    const updatePayload: { email?: string; data: Record<string, string> } = {
      data: { name: editName.trim(), phone: editPhone.trim() },
    };
    if (emailChanged) updatePayload.email = editEmail.trim();

    const { error } = await supabase.auth.updateUser(updatePayload);
    if (error) showToast(error.message || 'Error updating profile');
    else if (emailChanged) { showToast('Profile updated. Check your new email to confirm.'); setEditing(false); }
    else { showToast('Profile updated'); setEditing(false); }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (!currentPassword) { showToast('Please enter your current password'); return; }
    if (!PASSWORD_STRENGTH_REGEX.test(newPassword)) { showToast('New password must be 6+ characters with a letter and a number'); return; }
    if (newPassword !== confirmPassword) { showToast('Passwords do not match'); return; }
    if (!supabaseUser?.email) { showToast('Unable to verify account email'); return; }
    if (newPassword === currentPassword) { showToast('New password must be different from current password'); return; }

    setPasswordSaving(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: supabaseUser.email,
      password: currentPassword,
    });

    if (signInError) { showToast('Current password is incorrect'); setPasswordSaving(false); return; }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      showToast(error.message);
    } else {
      // Send password changed email via Resend
      try {
        await fetch('/api/notify-password-change', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: supabaseUser.id })
        });
      } catch (e) { /* silent fail */ }

      showToast('Password updated! Confirmation email sent to ' + supabaseUser.email);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
    setPasswordSaving(false);
  };

  const handleResetPassword = async () => {
    if (!supabaseUser?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(supabaseUser.email);
    if (error) showToast(error.message);
    else showToast('Password reset email sent');
  };

  // ── SEND OTP ──
  const handleSendOTP = async () => {
    if (!PASSWORD_STRENGTH_REGEX.test(connectPassword)) {
      showToast('Password must be 6+ characters with a letter and a number');
      return;
    }
    if (connectPassword !== connectConfirmPassword) {
      showToast('Passwords do not match');
      return;
    }
    if (!supabaseUser) return;

    setConnectingEmail(true);

    try {
      const code = generateOTP();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

      const { error } = await supabase
        .from('email_otps')
        .insert({
          user_id: supabaseUser.id,
          otp_code: code,
          purpose: 'connect_email',
          expires_at: expiresAt,
        });

      if (error) {
        showToast('Failed to create verification code');
        setConnectingEmail(false);
        return;
      }

      // Send OTP via Resend
      const emailRes = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: supabaseUser.email,
          otp: code,
          name: user?.name || 'User'
        })
      });

      if (!emailRes.ok) {
        showToast('Failed to send verification email');
        setConnectingEmail(false);
        return;
      }

      setOtpExpiry(300);
      setConnectStep('otp');
      showToast('Verification code sent to ' + supabaseUser.email);
    } catch (err: any) {
      showToast(err.message || 'Failed to send code');
    } finally {
      setConnectingEmail(false);
    }
  };

  // ── RESEND OTP ──
  const handleResendOTP = async () => {
    if (!supabaseUser) return;
    setResendingOtp(true);

    try {
      const code = generateOTP();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

      await supabase.from('email_otps').insert({
        user_id: supabaseUser.id,
        otp_code: code,
        purpose: 'connect_email',
        expires_at: expiresAt,
      });

      setOtpExpiry(300);
      setOtpInput(['', '', '', '', '', '']);

      await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: supabaseUser.email, otp: code, name: user?.name || 'User' })
      });

      showToast('New verification code sent');
    } catch (err: any) {
      showToast('Failed to resend code');
    } finally {
      setResendingOtp(false);
    }
  };

  // ── VERIFY OTP ──
  const handleVerifyOTP = async () => {
    const enteredCode = otpInput.join('');
    if (enteredCode.length !== 6) {
      showToast('Please enter the 6-digit code');
      return;
    }
    if (!supabaseUser) return;

    setVerifyingOtp(true);

    try {
      const { data, error } = await supabase
        .from('email_otps')
        .select('*')
        .eq('user_id', supabaseUser.id)
        .eq('otp_code', enteredCode)
        .eq('purpose', 'connect_email')
        .eq('verified', false)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        showToast('Invalid or expired verification code');
        setVerifyingOtp(false);
        return;
      }

      // Mark OTP as verified
      await supabase.from('email_otps')
        .update({ verified: true })
        .eq('id', data.id);

      // Set the password
      const { error: pwdError } = await supabase.auth.updateUser({ password: connectPassword });
      if (pwdError) {
        showToast(pwdError.message || 'Failed to set password');
        setVerifyingOtp(false);
        return;
      }

      // Mark email as connected
      await supabase.auth.updateUser({
        data: { email_password_set: true }
      });

      // Send email connected confirmation
      try {
        await fetch('/api/send-email-connected', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: supabaseUser.email, name: user?.name || 'User' })
        });
      } catch (e) { /* silent fail */ }

      setConnectStep('done');
      showToast('Email login connected! Confirmation email sent.');
    } catch (err: any) {
      showToast(err.message || 'Verification failed');
    } finally {
      setVerifyingOtp(false);
    }
  };

  // ── OTP INPUT HANDLING ──
  const handleOtpInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpInput];
    newOtp[index] = value.slice(-1);
    setOtpInput(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
    if (newOtp.every(d => d !== '') && newOtp.join('').length === 6) {
      setTimeout(() => handleVerifyOTP(), 300);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpInput[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otpInput];
    pasted.split('').forEach((char, i) => { newOtp[i] = char; });
    setOtpInput(newOtp);
    if (pasted.length === 6) {
      otpRefs.current[5]?.focus();
      setTimeout(() => handleVerifyOTP(), 300);
    }
  };

  const resetConnectModal = () => {
    setShowConnectEmail(false);
    setConnectStep('password');
    setConnectPassword('');
    setConnectConfirmPassword('');
    setOtpInput(['', '', '', '', '', '']);
    setOtpExpiry(0);
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // ─── PROVIDER DETECTION ───
  const isGoogleConnected = supabaseUser?.identities?.some(i => i.provider === 'google') || false;
  const isEmailConnected =
    (supabaseUser?.identities?.some(i => i.provider === 'email') || false) ||
    (supabaseUser?.user_metadata?.email_password_set === true) || false;

  const joinedDate = supabaseUser?.created_at
    ? new Date(supabaseUser.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'N/A';
  const currentPhone = (supabaseUser?.user_metadata?.phone as string) || '';

  return (
    <main className="flex-1 max-w-[900px] w-full mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-12">
      <button onClick={onBack} className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm mb-5 sm:mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Courses
      </button>

      <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-5 sm:mb-8">Account & Billing</h1>

      <div className="flex items-center gap-1 bg-[#111111] border border-white/[0.08] p-1 rounded-full w-fit mb-5 sm:mb-8 overflow-x-auto no-scrollbar">
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
              activeSection === s.id ? 'bg-[#D7FF2F] text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <s.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {s.label}
          </button>
        ))}
      </div>

      {/* ═══ PROFILE ═══ */}
      {activeSection === 'profile' && (
        <div className="bg-[#111111] border border-white/[0.08] rounded-2xl p-4 sm:p-6 md:p-8">
          <div className="flex items-start gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-[#D7FF2F] text-black font-bold text-lg sm:text-2xl flex items-center justify-center shrink-0">
              {user?.avatar || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              {editing ? (
                <input value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-[#0A0A0A] border border-white/[0.08] focus:border-[#D7FF2F] rounded-xl px-4 py-2.5 text-white text-sm outline-none mb-2" placeholder="Full name" />
              ) : (
                <h2 className="text-lg sm:text-xl font-bold text-white truncate">{user?.name}</h2>
              )}
              {!editing && (
                <>
                  <div className="flex items-center gap-2 text-zinc-400 text-xs sm:text-sm mt-0.5"><Mail className="w-3.5 h-3.5" /><span className="truncate">{supabaseUser?.email}</span></div>
                  <div className="flex items-center gap-2 text-zinc-500 text-[11px] sm:text-xs mt-1"><Calendar className="w-3 h-3" /><span>Joined {joinedDate}</span></div>
                </>
              )}
            </div>
          </div>

          {editing && (
            <div className="space-y-3 mb-6 sm:mb-8">
              <div>
                <label className="text-[11px] sm:text-xs text-zinc-500 mb-1 block">Email Address</label>
                <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} placeholder="you@example.com" className="w-full bg-[#0A0A0A] border border-white/[0.08] focus:border-[#D7FF2F] rounded-xl px-4 py-2.5 text-white text-sm outline-none transition-colors" />
              </div>
              <div>
                <label className="text-[11px] sm:text-xs text-zinc-500 mb-1 block">Mobile Number</label>
                <input type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit mobile number" className="w-full bg-[#0A0A0A] border border-white/[0.08] focus:border-[#D7FF2F] rounded-xl px-4 py-2.5 text-white text-sm outline-none transition-colors" />
              </div>
            </div>
          )}

          {!editing && (
            <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
              <div className="flex items-center justify-between py-2.5 sm:py-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center"><Phone className="w-4 h-4 text-zinc-500" /></div>
                  <div><p className="text-xs sm:text-sm text-white">Phone Number</p><p className="text-[11px] sm:text-xs text-zinc-500">{currentPhone || 'Not added'}</p></div>
                </div>
                {!currentPhone && <span className="text-[11px] sm:text-xs text-zinc-600">Optional</span>}
              </div>
              <div className="flex items-center justify-between py-2.5 sm:py-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center">
                    <svg className="w-4 h-4 text-zinc-500" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  </div>
                  <div><p className="text-xs sm:text-sm text-white">Google Account</p><p className="text-[11px] sm:text-xs text-zinc-500">{isGoogleConnected ? 'Connected' : 'Not connected'}</p></div>
                </div>
                {isGoogleConnected && <CheckCircle className="w-4 h-4 text-green-400" />}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            {editing ? (
              <>
                <button onClick={() => { setEditing(false); setEditName(user?.name || ''); setEditEmail(supabaseUser?.email || ''); setEditPhone(currentPhone); }} className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl border border-white/[0.08] text-zinc-300 text-xs sm:text-sm font-medium hover:bg-white/[0.04] transition-colors">Cancel</button>
                <button onClick={handleSaveProfile} disabled={saving} className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-[#D7FF2F] text-black text-xs sm:text-sm font-bold hover:bg-[#c5ee20] transition-colors disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
              </>
            ) : (
              <button onClick={() => { setEditName(user?.name || ''); setEditEmail(supabaseUser?.email || ''); setEditPhone(currentPhone); setEditing(true); }} className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl border border-white/[0.08] text-zinc-300 text-xs sm:text-sm font-medium hover:bg-white/[0.04] transition-colors">Edit Profile</button>
            )}
          </div>
        </div>
      )}

      {/* ═══ BILLING ═══ */}
      {activeSection === 'billing' && (
        <div className="bg-[#111111] border border-white/[0.08] rounded-2xl p-4 sm:p-6 md:p-8">
          <h2 className="text-base sm:text-lg font-bold text-white mb-4 sm:mb-6">Purchase History</h2>
          {purchases.length > 0 ? (
            <>
              <div className="sm:hidden space-y-3">
                {purchases.map((p, i) => (
                  <div key={i} className="bg-[#0A0A0A] border border-white/[0.06] rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <p className="text-white font-semibold text-sm leading-snug">{getCourseTitle(p.course_id)}</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 uppercase shrink-0">{p.payment_status}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-zinc-400 mb-1"><span>Amount</span><span className="text-zinc-200 font-medium">₹{p.amount || '—'}</span></div>
                    <div className="flex items-center justify-between text-xs text-zinc-400 mb-1"><span>Method</span><span className="text-zinc-200">{p.payment_method || 'Online'}</span></div>
                    <div className="flex items-center justify-between text-xs text-zinc-400"><span>Date</span><span className="text-zinc-200">{new Date(p.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
                  </div>
                ))}
              </div>
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.08] text-left">
                      <th className="pb-3 text-zinc-500 font-medium text-xs uppercase tracking-wider">Course</th>
                      <th className="pb-3 text-zinc-500 font-medium text-xs uppercase tracking-wider">Amount</th>
                      <th className="pb-3 text-zinc-500 font-medium text-xs uppercase tracking-wider">Method</th>
                      <th className="pb-3 text-zinc-500 font-medium text-xs uppercase tracking-wider">Date</th>
                      <th className="pb-3 text-zinc-500 font-medium text-xs uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.map((p, i) => (
                      <tr key={i} className="border-b border-white/[0.04]">
                        <td className="py-4 pr-4 text-white font-medium max-w-[200px] truncate">{getCourseTitle(p.course_id)}</td>
                        <td className="py-4 pr-4 text-zinc-300">₹{p.amount || '—'}</td>
                        <td className="py-4 pr-4 text-zinc-400">{p.payment_method || 'Online'}</td>
                        <td className="py-4 pr-4 text-zinc-400 text-xs">{new Date(p.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        <td className="py-4 pr-4"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 uppercase">{p.payment_status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <CreditCard className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm">No purchases yet.</p>
            </div>
          )}
        </div>
      )}

      {/* ═══ SECURITY ═══ */}
      {activeSection === 'security' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-[#111111] border border-white/[0.08] rounded-2xl p-4 sm:p-6 md:p-8">
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <Key className="w-4 h-4 text-[#D7FF2F]" />
              <h2 className="text-base sm:text-lg font-bold text-white">Change Password</h2>
            </div>
            {isEmailConnected ? (
              <div className="space-y-3 sm:space-y-4 max-w-sm">
                <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Current Password" autoComplete="current-password" className="w-full bg-[#0A0A0A] border border-white/[0.08] focus:border-[#D7FF2F] rounded-xl px-4 py-2.5 sm:py-3 text-white text-sm placeholder-zinc-500 outline-none transition-colors" />
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New Password (6+ chars, letter & number)" autoComplete="new-password" className="w-full bg-[#0A0A0A] border border-white/[0.08] focus:border-[#D7FF2F] rounded-xl px-4 py-2.5 sm:py-3 text-white text-sm placeholder-zinc-500 outline-none transition-colors" />
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm New Password" autoComplete="new-password" className="w-full bg-[#0A0A0A] border border-white/[0.08] focus:border-[#D7FF2F] rounded-xl px-4 py-2.5 sm:py-3 text-white text-sm placeholder-zinc-500 outline-none transition-colors" />
                <div className="flex flex-wrap items-center gap-3">
                  <button onClick={handleChangePassword} disabled={passwordSaving} className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-[#D7FF2F] text-black text-xs sm:text-sm font-bold hover:bg-[#c5ee20] transition-colors disabled:opacity-50">{passwordSaving ? 'Updating...' : 'Update Password'}</button>
                  <button onClick={handleResetPassword} className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl border border-white/[0.08] text-zinc-400 text-xs sm:text-sm hover:bg-white/[0.04] transition-colors">Send Reset Email</button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-zinc-400 text-sm mb-4">Connect email login first to change password.</p>
                <button onClick={() => setShowConnectEmail(true)} className="px-5 py-2.5 rounded-xl bg-[#D7FF2F] text-black text-sm font-bold hover:bg-[#c5ee20] transition-colors">Connect Email Login</button>
              </div>
            )}
          </div>

          <div className="bg-[#111111] border border-white/[0.08] rounded-2xl p-4 sm:p-6 md:p-8">
            <h2 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">Connected Login Providers</h2>
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between py-2.5 sm:py-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  <div>
                    <span className="text-xs sm:text-sm text-white">Google</span>
                    <p className="text-[11px] sm:text-xs text-zinc-500">{isGoogleConnected ? 'Connected' : 'Not connected'}</p>
                  </div>
                </div>
                {isGoogleConnected ? (
                  <span className="text-[11px] sm:text-xs text-green-400 font-medium flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Connected</span>
                ) : (
                  <span className="text-[11px] sm:text-xs text-zinc-600">Not connected</span>
                )}
              </div>

              <div className="flex items-center justify-between py-2.5 sm:py-3">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-zinc-400" />
                  <div>
                    <span className="text-xs sm:text-sm text-white">Email</span>
                    <p className="text-[11px] sm:text-xs text-zinc-500">{isEmailConnected ? 'Connected' : 'Not connected'}</p>
                  </div>
                </div>
                {isEmailConnected ? (
                  <span className="text-[11px] sm:text-xs text-green-400 font-medium flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Connected</span>
                ) : (
                  <button onClick={() => setShowConnectEmail(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D7FF2F]/10 border border-[#D7FF2F]/30 text-[#D7FF2F] text-[11px] sm:text-xs font-medium hover:bg-[#D7FF2F]/20 transition-colors"><Link2 className="w-3 h-3" /> Connect</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── CONNECT EMAIL MODAL ─── */}
      {showConnectEmail && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={resetConnectModal} />
          <div className="relative w-full max-w-sm bg-[#111111] border border-white/10 rounded-2xl p-6 shadow-2xl">
            <button onClick={resetConnectModal} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>

            {connectStep === 'password' && (
              <>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-[#D7FF2F]/10 border border-[#D7FF2F]/20 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-[#D7FF2F]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Connect Email Login</h3>
                    <p className="text-xs text-zinc-500">Set a password for your account</p>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="p-3 bg-[#0A0A0A] rounded-xl border border-white/[0.06]">
                    <p className="text-[11px] text-zinc-500 mb-0.5">Email</p>
                    <p className="text-sm text-white font-medium">{supabaseUser?.email}</p>
                  </div>

                  <div>
                    <label className="text-[11px] sm:text-xs text-zinc-500 mb-1 block">Create Password</label>
                    <input type="password" value={connectPassword} onChange={e => setConnectPassword(e.target.value)} placeholder="6+ characters, letter & number" className="w-full bg-[#0A0A0A] border border-white/[0.08] focus:border-[#D7FF2F] rounded-xl px-4 py-2.5 text-white text-sm placeholder-zinc-500 outline-none transition-colors" />
                  </div>

                  <div>
                    <label className="text-[11px] sm:text-xs text-zinc-500 mb-1 block">Confirm Password</label>
                    <input type="password" value={connectConfirmPassword} onChange={e => setConnectConfirmPassword(e.target.value)} placeholder="Re-enter password" className="w-full bg-[#0A0A0A] border border-white/[0.08] focus:border-[#D7FF2F] rounded-xl px-4 py-2.5 text-white text-sm placeholder-zinc-500 outline-none transition-colors" />
                  </div>

                  <p className="text-[11px] text-zinc-600 mb-4">After connecting, you can sign in with either <strong className="text-zinc-400">Google</strong> or <strong className="text-zinc-400">Email + Password</strong>. Both access the same account.</p>

                  <div className="flex items-center gap-3 pt-1">
                    <button onClick={handleSendOTP} disabled={connectingEmail} className="flex-1 py-2.5 rounded-xl bg-[#D7FF2F] text-black text-sm font-bold hover:bg-[#c5ee20] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                      {connectingEmail ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending Code...</> : <><Send className="w-4 h-4" /> Send Verification Code</>}
                    </button>
                    <button onClick={resetConnectModal} className="px-4 py-2.5 rounded-xl border border-white/[0.08] text-zinc-300 text-sm hover:bg-white/[0.04] transition-colors">Cancel</button>
                  </div>
                </div>
              </>
            )}

            {connectStep === 'otp' && (
              <>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-[#D7FF2F]/10 border border-[#D7FF2F]/20 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-[#D7FF2F]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Verify Your Email</h3>
                    <p className="text-xs text-zinc-500">Enter the 6-digit code sent to your email</p>
                  </div>
                </div>

                <div className="p-3 bg-[#0A0A0A] rounded-xl border border-white/[0.06] mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-zinc-500">Sent to</p>
                    <p className="text-sm text-white font-medium">{supabaseUser?.email}</p>
                  </div>
                  {otpExpiry > 0 && (
                    <span className="text-xs font-mono text-zinc-400">{formatTimer(otpExpiry)}</span>
                  )}
                </div>

                {/* OTP Input Boxes */}
                <div className="flex items-center justify-center gap-2 mb-4" onPaste={handleOtpPaste}>
                  {otpInput.map((digit, index) => (
                    <input
                      key={index}
                      ref={el => { otpRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpInput(index, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(index, e)}
                      className={`w-11 h-12 text-center text-xl font-bold rounded-xl border outline-none transition-colors ${
                        digit ? 'border-[#D7FF2F] text-white bg-[#D7FF2F]/5' : 'border-white/[0.08] text-white bg-[#0A0A0A]'
                      } focus:border-[#D7FF2F]`}
                    />
                  ))}
                </div>

                {verifyingOtp && (
                  <div className="flex items-center justify-center gap-2 py-3 mb-3">
                    <Loader2 className="w-4 h-4 animate-spin text-[#D7FF2F]" />
                    <span className="text-sm text-zinc-400">Verifying...</span>
                  </div>
                )}

                <div className="flex items-center justify-center gap-3 mb-4">
                  {otpExpiry === 0 ? (
                    <button onClick={handleResendOTP} disabled={resendingOtp} className="text-xs text-[#D7FF2F] hover:underline font-medium disabled:opacity-50 flex items-center gap-1">
                      {resendingOtp ? <Loader2 className="w-3 h-3 animate-spin" /> : null} Resend Code
                    </button>
                  ) : <span className="text-xs text-zinc-600">Resend in {formatTimer(otpExpiry)}</span>}
                </div>

                <button onClick={resetConnectModal} className="w-full py-2.5 rounded-xl border border-white/[0.08] text-zinc-300 text-sm hover:bg-white/[0.04] transition-colors">Cancel</button>
              </>
            )}

            {connectStep === 'done' && (
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-7 h-7 text-green-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">Email Connected!</h3>
                <p className="text-sm text-zinc-400 mb-1">Password login is now enabled for your account.</p>
                <p className="text-xs text-zinc-500 mb-5">A confirmation email has been sent to <strong className="text-zinc-300">{supabaseUser?.email}</strong></p>
                <p className="text-xs text-zinc-600 mb-6">You can now sign in with either <strong className="text-zinc-400">Google</strong> or <strong className="text-zinc-400">Email + Password</strong>.</p>
                <button onClick={resetConnectModal} className="px-6 py-2.5 rounded-xl bg-[#D7FF2F] text-black text-sm font-bold hover:bg-[#c5ee20] transition-colors">Done</button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}