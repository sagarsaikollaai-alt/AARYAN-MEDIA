/**
 * server.js — Aaryan Media backend
 */

import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.server' });

// ---------------------------------------------------------------------------
// CONFIG
// ---------------------------------------------------------------------------

const PORT = process.env.PORT || 5000;
const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:5173';
const FROM_EMAIL = 'Aaryan Media <noreply@aaryanmedia.com>';

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const BUNNY_API_KEY = process.env.BUNNY_API_KEY || '';
const BUNNY_LIBRARY_ID = process.env.BUNNY_LIBRARY_ID || '715524';

const REQUIRED_ENV = { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY };
const missing = Object.entries(REQUIRED_ENV).filter(([, v]) => !v).map(([k]) => k);
if (missing.length) {
  console.error(`[server.js] Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// CLIENTS
// ---------------------------------------------------------------------------

const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const resend = new Resend(RESEND_API_KEY);

// ---------------------------------------------------------------------------
// APP
// ---------------------------------------------------------------------------

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function escapeHtml(str = '') {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatPrice(price) {
  return '₹' + Number(price).toLocaleString('en-IN');
}

function formatDurationFromSeconds(totalSeconds) {
  if (!totalSeconds) return '0';
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  let parts = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 || parts.length === 0) parts.push(`${s}sec`);
  return parts.join(' ');
}

function parseDurationToSeconds(dur) {
  if (!dur) return 0;
  const parts = dur.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

function generateSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120);
}

function generateId(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function formatCoursePublic(row, purchasedIds = new Set()) {
  if (!row) return null;
  const c = row;
  return {
    id: c.id,
    slug: c.slug,
    bunnyStreamId: c.bunny_stream_id || null,
    title: c.title,
    description: c.description,
    longDescription: c.long_description,
    thumbnail: c.thumbnail,
    category: c.category,
    lessonsCount: c.lessons_count || 0,
    duration: formatDurationFromSeconds(c.total_duration_seconds),
    instructor: c.instructor,
    price: c.price,
    formattedPrice: formatPrice(c.price),
    purchased: purchasedIds.has(c.id),
    publishedDate: c.published_date,
    popularityScore: c.popularity_score || 0,
    previewVideoUrl: c.preview_video_url || null,
    whatYoullLearn: (c.learn_items || []).map((l) => typeof l === 'string' ? l : (l.item_text || null)),
    modules: (c.modules || []).map((mod) => ({
      id: mod.id,
      title: mod.title,
      lessons: (mod.lessons || []).map((les) => ({
        id: les.id,
        title: les.title,
        duration: les.duration || '',
        durationSeconds: les.duration_seconds || 0,
        // SECURITY: videoId is intentionally removed from public API response
        isFreePreview: les.is_free_preview || false,
      })),
    })),
    downloadableResources: (c.resources || []).map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      iconName: r.icon_name || 'Package',
      downloadUrl: r.download_url || '#',
      size: r.file_size,
    })),
    specs: {
      language: c.language || 'English',
      lastUpdated: c.updated_at
        ? new Date(c.updated_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })
        : '',
      certificate: c.certificate_included ? 'Verified Aaryan Media Certificate' : 'Not Included',
      access: c.lifetime_access ? 'Lifetime Access' : 'Limited Access',
    },
    faqs: (c.faqs || []).map((f) => ({ question: f.question, answer: f.answer })),
    community: c.community
      ? { whatsapp: c.community.whatsapp || '', instagram: c.community.instagram || '' }
      : undefined,
    status: c.status,
  };
}

// ───────────────────────────────────────────────────────────────────────────
// SECURE VIDEO PLAYBACK (TOKEN AUTHENTICATION)
// ───────────────────────────────────────────────────────────────────────────
//
// Lesson video IDs are looked up live from Supabase (lessons.id -> lessons.video_id).
// This replaces the old static SECURE_VIDEO_MAP, which used a "prem_lN" key scheme
// that no longer matches the real lesson ids in the database (plain numbers for
// course-1, "c2-lN" for course-2, "c3-lN" for course-3, "c4-lN" for course-4).
//
// Course access is resolved from the LESSON's own course_id column, not from a
// hardcoded slug->id table. This makes the check immune to future slug renames.

app.post('/api/lessons/:lessonId/playback-token', async (req, res) => {
  try {
    const lessonId = req.params.lessonId;
    const { courseSlug } = req.body;

    if (!lessonId) return res.status(400).json({ error: 'Lesson id is required' });
    if (!courseSlug) return res.status(400).json({ error: 'Course slug is required' });

    // 1. Authenticate the user
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: authData, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authData?.user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    const userId = authData.user.id;

    // 2. Look up the lesson (and its video_id + owning course_id) directly from Supabase
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('id, course_id, video_id, is_free_preview')
      .eq('id', lessonId)
      .single();

    if (lessonError || !lesson) {
      return res.status(404).json({ error: 'Lesson not found', code: 'LESSON_NOT_FOUND' });
    }

    if (!lesson.video_id) {
      // Lesson exists but no video has been assigned yet (e.g. upcoming content)
      return res.status(409).json({ error: 'Coming Soon: Video not assigned yet.', code: 'VIDEO_NOT_ASSIGNED' });
    }

    const videoId = lesson.video_id;

    // 3. Confirm the requested courseSlug actually matches the lesson's real course,
    // then check ownership. This also guards against a stale/incorrect slug being
    // passed from an old cached frontend build.
    const { data: courseRow, error: courseError } = await supabase
      .from('courses')
      .select('id, slug')
      .eq('id', lesson.course_id)
      .single();

    if (courseError || !courseRow) {
      return res.status(404).json({ error: 'Course not found for this lesson' });
    }

    if (courseRow.slug !== courseSlug) {
      return res.status(409).json({ error: 'Course slug does not match this lesson. Please refresh the page.' });
    }

    // Free-preview lessons don't require a purchase
    if (!lesson.is_free_preview) {
      const { data: purchases } = await supabase
        .from('purchases')
        .select('course_id')
        .eq('user_id', userId)
        .eq('payment_status', 'success');

      const purchasedCourseIds = (purchases || []).map((p) => p.course_id);

      // Bundle course id — update this if your bundle's real id in `courses` differs.
      const BUNDLE_COURSE_ID = 'course-3';

      const hasAccess =
        purchasedCourseIds.includes(lesson.course_id) ||
        purchasedCourseIds.includes(BUNDLE_COURSE_ID);

      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied. You do not own this course.' });
      }
    }

    // 4. Generate Bunny Stream Secure Token
    const expires = Math.floor(Date.now() / 1000) + 7200; // 2 hours
    const stringToHash = `${BUNNY_LIBRARY_ID}${videoId}${expires}${BUNNY_API_KEY}`;
    const secureToken = crypto.createHash('sha256').update(stringToHash).digest('hex');

    return res.json({
      videoId: videoId,
      token: secureToken,
      expires
    });
  } catch (err) {
    console.error('[playback-token] error:', err);
    return res.status(500).json({ error: 'Failed to generate playback token' });
  }
});

// ---------------------------------------------------------------------------
// ADMIN AUTH MIDDLEWARE
// ---------------------------------------------------------------------------

async function verifyAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization token' });
    }
    const token = authHeader.replace('Bearer ', '');

    const { data, error: authError } = await supabase.auth.getUser(token);
    if (authError || !data || !data.user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, name, is_admin')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile || !profile.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.adminUser = profile;
    req.adminUserId = data.user.id;
    next();
  } catch (err) {
    console.error('[verifyAdmin] error:', err);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}

// ---------------------------------------------------------------------------
// EMAIL TEMPLATES
// ---------------------------------------------------------------------------

function purchaseConfirmationHtml({ userName, courseTitle, amount, transactionId, date }) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #111;">
      <h2 style="color:#111;">Thanks for your purchase, ${escapeHtml(userName)}!</h2>
      <p>Your enrollment in <strong>${escapeHtml(courseTitle)}</strong> is confirmed.</p>
      <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding:6px 0; color:#555;">Amount Paid</td><td style="text-align:right;">₹${amount}</td></tr>
        <tr><td style="padding:6px 0; color:#555;">Transaction ID</td><td style="text-align:right;">${escapeHtml(transactionId)}</td></tr>
        <tr><td style="padding:6px 0; color:#555;">Date</td><td style="text-align:right;">${escapeHtml(date)}</td></tr>
      </table>
      <p>You can access your course anytime from your account dashboard.</p>
      <p style="color:#888; font-size:12px; margin-top:32px;">Aaryan Media — this is an automated transactional email.</p>
    </div>
  `;
}

function passwordChangeHtml({ userName, date }) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #111;">
      <h2 style="color:#111;">Your password was changed</h2>
      <p>Hi ${escapeHtml(userName)},</p>
      <p>This is a confirmation that your Aaryan Media account password was changed on ${escapeHtml(date)}.</p>
      <p>If you did not make this change, please reset your password immediately and contact support.</p>
      <p style="color:#888; font-size:12px; margin-top:32px;">Aaryan Media — this is an automated security notification.</p>
    </div>
  `;
}

function promotionalHtml({ userName, subject, bodyHtml, unsubscribeUrl }) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #111;">
      <h2 style="color:#111;">${escapeHtml(subject)}</h2>
      <p>Hi ${escapeHtml(userName)},</p>
      <div>${bodyHtml}</div>
      <hr style="margin: 32px 0; border: none; border-top: 1px solid #eee;" />
      <p style="color:#888; font-size:12px;">
        You're receiving this because you have an Aaryan Media account.
        <a href="${unsubscribeUrl}" style="color:#888;">Unsubscribe</a> from promotional emails.
      </p>
    </div>
  `;
}

// ===========================================================================
// PUBLIC COURSES ENDPOINTS
// ===========================================================================

app.get('/api/courses', async (req, res) => {
  try {
    const { data: courses, error } = await supabase
      .from('courses')
      .select(`
        *,
        modules:modules(select: id, title, sort_order,
          lessons:lessons(select: id, title, duration, duration_seconds, video_id, is_free_preview, sort_order)
        ),
        faqs:course_faqs(select: id, question, answer, sort_order),
        resources:course_resources(select: id, title, description, icon_name, download_url, file_size, sort_order),
        community:course_communities(select: id, whatsapp, instagram)
      `)
      .in('status', ['live', 'coming_soon'])
      .order('popularity_score', { ascending: false });

    if (error) { console.error('[GET /api/courses]', error); return res.status(500).json({ error: 'Failed to fetch courses' }); }

    const courseIds = (courses || []).map((c) => c.id);
    let learnItemsMap = {};
    if (courseIds.length > 0) {
      const { data: learnItems } = await supabase
        .from('course_learn_items')
        .select('course_id, item_text, sort_order')
        .in('course_id', courseIds)
        .order('sort_order', { ascending: true });
      learnItemsMap = {};
      (learnItems || []).forEach((item) => {
        if (!learnItemsMap[item.course_id]) learnItemsMap[item.course_id] = [];
        learnItemsMap[item.course_id].push(item.item_text);
      });
    }

    const formatted = (courses || []).map((c) => {
      const row = Object.assign({}, c, { learn_items: learnItemsMap[c.id] || [] });
      return formatCoursePublic(row);
    });
    return res.json(formatted);
  } catch (err) {
    console.error('[GET /api/courses]', err);
    return res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

app.get('/api/courses/:slug', async (req, res) => {
  try {
    const { data: course, error } = await supabase
      .from('courses')
      .select(`
        *,
        modules:modules(select: id, title, sort_order,
          lessons:lessons(select: id, title, duration, duration_seconds, video_id, is_free_preview, sort_order)
        ),
        faqs:course_faqs(select: id, question, answer, sort_order),
        resources:course_resources(select: id, title, description, icon_name, download_url, file_size, sort_order),
        community:course_communities(select: id, whatsapp, instagram)
      `)
      .eq('slug', req.params.slug)
      .in('status', ['live', 'coming_soon'])
      .single();

    if (error || !course) return res.status(404).json({ error: 'Course not found' });

    const { data: learnItems } = await supabase
      .from('course_learn_items')
      .select('item_text, sort_order')
      .eq('course_id', course.id)
      .order('sort_order', { ascending: true });

    const row = Object.assign({}, course, { learn_items: (learnItems || []).map((l) => l.item_text) });
    return res.json(formatCoursePublic(row));
  } catch (err) {
    console.error('[GET /api/courses/:slug]', err);
    return res.status(500).json({ error: 'Failed to fetch course' });
  }
});

// ===========================================================================
// EXISTING ENDPOINTS
// ===========================================================================

app.post('/api/create-order', async (req, res) => {
  try {
    const { amount, currency = 'INR', course_id, user_id, user_name, user_email, user_phone } = req.body;
    if (!amount || !course_id || !user_id) {
      return res.status(400).json({ success: false, message: 'amount, course_id, and user_id are required.' });
    }

    const amountPaise = Number(amount);
    if (!Number.isFinite(amountPaise) || amountPaise < 100) {
      return res.status(400).json({ success: false, message: 'Amount must be at least 100 paise.' });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(amountPaise),
      currency,
      receipt: `course_${course_id}_${Date.now()}`,
      notes: {
        course_id,
        user_id,
        user_name: user_name || '',
        user_email: user_email || '',
        user_phone: user_phone || '',
      },
    });

    return res.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key: RAZORPAY_KEY_ID,
    });
  } catch (err) {
    if (err && typeof err === 'object' && 'statusCode' in err && (err.statusCode === 401 || err.statusCode === 403)) {
      return res.status(401).json({ success: false, message: 'Razorpay authentication failed.' });
    }
    console.error('[create-order] error:', err);
    return res.status(500).json({ success: false, message: err && typeof err === 'object' && 'message' in err ? err.message : 'Failed to create order.' });
  }
});

app.post('/api/verify-payment', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, course_id, user_id, amount } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !course_id || !user_id || amount == null) {
      return res.status(400).json({ success: false, message: 'Missing Razorpay verification fields.' });
    }

    const generatedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature.' });
    }

    const { error: insertError } = await supabase.from('purchases').insert({
      user_id,
      course_id,
      amount,
      payment_method: 'razorpay',
      transaction_id: razorpay_payment_id,
      payment_status: 'success',
      created_at: new Date().toISOString(),
    });
    if (insertError) {
      console.error('[verify-payment] Supabase insert error:', insertError);
      return res.status(500).json({ success: false, message: 'Payment verified but failed to save purchase record.' });
    }
    try {
      const { data: profile } = await supabase.from('profiles').select('email, name').eq('id', user_id).single();
      if (profile && profile.email) {
        const { data: course } = await supabase.from('courses').select('title').eq('id', course_id).single();
        await resend.emails.send({
          from: FROM_EMAIL, to: profile.email,
          subject: 'Your Aaryan Media purchase is confirmed',
          html: purchaseConfirmationHtml({
            userName: profile.name || 'there',
            courseTitle: course ? course.title : course_id,
            amount,
            transactionId: razorpay_payment_id,
            date: new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
          }),
        });
      }
    } catch (emailErr) { console.error('[verify-payment] confirmation email failed (non-fatal):', emailErr); }
    return res.json({ success: true });
  } catch (err) {
    console.error('[verify-payment] error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Payment verification failed.' });
  }
});

app.post('/api/notify-password-change', async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ success: false, message: 'user_id is required.' });
    const { data: profile, error } = await supabase.from('profiles').select('email, name').eq('id', user_id).single();
    if (error || !profile || !profile.email) return res.status(404).json({ success: false, message: 'Profile not found.' });
    await resend.emails.send({
      from: FROM_EMAIL, to: profile.email,
      subject: 'Your Aaryan Media password was changed',
      html: passwordChangeHtml({ userName: profile.name || 'there', date: new Date().toLocaleString('en-IN') }),
    });
    return res.json({ success: true });
  } catch (err) {
    console.error('[notify-password-change] error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to send notification.' });
  }
});

app.post('/api/send-promotional', async (req, res) => {
  try {
    const { subject, body_html } = req.body;
    if (!subject || !body_html) return res.status(400).json({ success: false, message: 'subject and body_html are required.' });
    const { data: recipients, error } = await supabase.from('profiles').select('id, email, name, unsubscribed').eq('unsubscribed', false);
    if (error) return res.status(500).json({ success: false, message: 'Failed to load recipient list.' });
    if (!recipients || recipients.length === 0) return res.json({ success: true, sent: 0, message: 'No opted-in recipients found.' });
    const CHUNK_SIZE = 50;
    let sentCount = 0;
    const failures = [];
    for (let i = 0; i < recipients.length; i += CHUNK_SIZE) {
      const chunk = recipients.slice(i, i + CHUNK_SIZE);
      const results = await Promise.allSettled(chunk.map((r) => {
        const unsubscribeUrl = `${APP_BASE_URL}/unsubscribe?uid=${encodeURIComponent(r.id)}`;
        return resend.emails.send({
          from: FROM_EMAIL, to: r.email, subject,
          html: promotionalHtml({ userName: r.name || 'there', subject, bodyHtml: body_html, unsubscribeUrl }),
        });
      }));
      results.forEach((r, idx) => {
        if (r.status === 'fulfilled') sentCount += 1;
        else failures.push({ email: chunk[idx].email, error: r.reason && r.reason.message ? r.reason.message : 'unknown' });
      });
    }
    return res.json({ success: true, sent: sentCount, failed: failures.length, failures });
  } catch (err) {
    console.error('[send-promotional] error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to send promotional emails.' });
  }
});

app.get('/api/unsubscribe', async (req, res) => {
  try {
    const { uid } = req.query;
    if (!uid) return res.status(400).send('Missing user identifier.');
    const { error } = await supabase.from('profiles').update({ unsubscribed: true }).eq('id', uid);
    if (error) return res.status(500).send('Something went wrong. Please contact support to unsubscribe.');
    return res.status(200).send('<html><body style="font-family:sans-serif; text-align:center; padding:60px;">You have been unsubscribed from promotional emails.</body></html>');
  } catch (err) { return res.status(500).send('Something went wrong.'); }
});

// ===========================================================================
// ADMIN ENDPOINTS
// ===========================================================================

// ---------------------------------------------------------------------------
// DASHBOARD
// ---------------------------------------------------------------------------

app.get('/api/admin/dashboard', verifyAdmin, async (req, res) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [revenueRes, todayRevenueRes, monthRevenueRes, studentsRes, ordersRes, coursesRes, recentPurchases] = await Promise.all([
      supabase.from('purchases').select('amount').eq('payment_status', 'success'),
      supabase.from('purchases').select('amount').eq('payment_status', 'success').gte('created_at', today.toISOString()),
      supabase.from('purchases').select('amount').eq('payment_status', 'success').gte('created_at', monthStart.toISOString()),
      supabase.from('purchases').select('user_id'),
      supabase.from('purchases').select('payment_status, created_at'),
      supabase.from('courses').select('id, status, title'),
      supabase.from('purchases').select('user_id, course_id, amount, transaction_id, created_at, payment_status').eq('payment_status', 'success').order('created_at', { ascending: false }).limit(10),
    ]);

    const sumAmount = (rows) => (rows || []).reduce((s, r) => s + (r.amount || 0), 0);
    const uniqueStudents = new Set((studentsRes.data || []).map((r) => r.user_id));
    const allCourses = coursesRes.data || [];
    const allOrders = ordersRes.data || [];

    const recentWithNames = await Promise.all(
      (recentPurchases.data || []).map(async (p) => {
        const { data: profile } = await supabase.from('profiles').select('name, email').eq('id', p.user_id).single();
        const { data: course } = await supabase.from('courses').select('title').eq('id', p.course_id).single();
        return {
          ...p,
          student_name: profile ? profile.name : 'Unknown',
          student_email: profile ? profile.email : '',
          course_title: course ? course.title : p.course_id,
        };
      })
    );

    return res.json({
      totalRevenue: sumAmount(revenueRes.data),
      todayRevenue: sumAmount(todayRevenueRes.data),
      monthlyRevenue: sumAmount(monthRevenueRes.data),
      totalStudents: uniqueStudents.size,
      totalCourses: allCourses.length,
      liveCourses: allCourses.filter((c) => c.status === 'live').length,
      comingSoonCourses: allCourses.filter((c) => c.status === 'coming_soon').length,
      draftCourses: allCourses.filter((c) => c.status === 'draft').length,
      archivedCourses: allCourses.filter((c) => c.status === 'archived').length,
      completedOrders: allOrders.filter((o) => o.payment_status === 'success').length,
      pendingOrders: allOrders.filter((o) => o.payment_status === 'pending').length,
      recentPurchases: recentWithNames,
    });
  } catch (err) {
    console.error('[admin/dashboard]', err);
    return res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

// ---------------------------------------------------------------------------
// COURSES CRUD
// ---------------------------------------------------------------------------

app.get('/api/admin/courses', verifyAdmin, async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = supabase.from('courses').select('*').order('created_at', { ascending: false });
    if (status && status !== 'all') query = query.eq('status', status);
    if (search) query = query.ilike('title', `%${search}%`);
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data || []);
  } catch (err) {
    console.error('[admin/courses GET]', err);
    return res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

app.get('/api/admin/courses/:id', verifyAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        modules:modules(select: id, title, sort_order,
          lessons:lessons(select: id, title, duration, duration_seconds, video_id, is_free_preview, sort_order)
        ),
        learn_items:course_learn_items(*),
        faqs:course_faqs(select: id, question, answer, sort_order),
        resources:course_resources(select: id, title, description, icon_name, download_url, file_size, sort_order),
        community:course_communities(select: id, whatsapp, instagram, telegram, discord)
      `)
      .eq('id', req.params.id)
      .single();
    if (error || !data) return res.status(404).json({ error: 'Course not found' });
    return res.json(data);
  } catch (err) {
    console.error('[admin/courses/:id GET]', err);
    return res.status(500).json({ error: 'Failed to fetch course' });
  }
});

app.post('/api/admin/courses', verifyAdmin, async (req, res) => {
  try {
    const { title, slug, description, long_description, thumbnail, category, instructor, price, original_price, currency, bunny_stream_id, status, language, certificate_included, lifetime_access, popularity_score, preview_video_url } = req.body;
    if (!title || !slug || !description || !thumbnail || !category || !instructor) {
      return res.status(400).json({ error: 'title, slug, description, thumbnail, category, instructor are required' });
    }
    const courseId = generateId('course');
    const { data, error } = await supabase.from('courses').insert({
      id: courseId, slug, title, description, long_description: long_description || '',
      thumbnail, category, instructor,
      price: price || 0, original_price: original_price || null,
      currency: currency || 'INR', bunny_stream_id: bunny_stream_id || null,
      status: status || 'draft', language: language || 'English',
      certificate_included: certificate_included !== false, lifetime_access: lifetime_access !== false,
      popularity_score: popularity_score || 0, preview_video_url: preview_video_url || null,
      published_date: status === 'live' ? new Date().toISOString() : null,
    }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  } catch (err) {
    console.error('[admin/courses POST]', err);
    return res.status(500).json({ error: 'Failed to create course' });
  }
});

app.put('/api/admin/courses/:id', verifyAdmin, async (req, res) => {
  try {
    const allowedFields = ['title', 'slug', 'description', 'long_description', 'thumbnail', 'category', 'instructor', 'price', 'original_price', 'currency', 'bunny_stream_id', 'status', 'language', 'certificate_included', 'lifetime_access', 'popularity_score', 'preview_video_url'];
    const updates = { updated_at: new Date().toISOString() };
    for (const f of allowedFields) {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    }
    if (updates.status === 'live' && !req.body.published_date) {
      updates.published_date = new Date().toISOString();
    }
    const { data, error } = await supabase.from('courses').update(updates).eq('id', req.params.id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'Course not found' });
    return res.json(data);
  } catch (err) {
    console.error('[admin/courses PUT]', err);
    return res.status(500).json({ error: 'Failed to update course' });
  }
});

app.delete('/api/admin/courses/:id', verifyAdmin, async (req, res) => {
  try {
    const { error } = await supabase.from('courses').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  } catch (err) {
    console.error('[admin/courses DELETE]', err);
    return res.status(500).json({ error: 'Failed to delete course' });
  }
});

app.post('/api/admin/courses/:id/recalculate', verifyAdmin, async (req, res) => {
  try {
    const courseId = req.params.id;
    const { data: modules } = await supabase.from('modules').select('id, lessons:lessons(id, duration_seconds)').eq('course_id', courseId);
    const mods = modules || [];
    let totalLessons = 0;
    let totalSeconds = 0;
    for (const mod of mods) {
      const lessons = mod.lessons || [];
      totalLessons += lessons.length;
      totalSeconds += lessons.reduce((s, l) => s + (l.duration_seconds || 0), 0);
    }
    const { data, error } = await supabase
      .from('courses')
      .update({ lessons_count: totalLessons, total_duration_seconds: totalSeconds, modules_count: mods.length, updated_at: new Date().toISOString() })
      .eq('id', courseId)
      .select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  } catch (err) {
    console.error('[admin/courses/:id/recalculate]', err);
    return res.status(500).json({ error: 'Failed to recalculate' });
  }
});

// ---------------------------------------------------------------------------
// MODULES CRUD
// ---------------------------------------------------------------------------

app.post('/api/admin/modules', verifyAdmin, async (req, res) => {
  try {
    const { course_id, title, sort_order } = req.body;
    if (!course_id || !title) return res.status(400).json({ error: 'course_id and title required' });
    const { count } = await supabase.from('modules').select('id', { count: 'exact', head: true }).eq('course_id', course_id);
    const { data, error } = await supabase.from('modules').insert({
      course_id, title, sort_order: sort_order !== undefined ? sort_order : (count || 0),
    }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  } catch (err) {
    console.error('[admin/modules POST]', err);
    return res.status(500).json({ error: 'Failed to create module' });
  }
});

app.put('/api/admin/modules/:id', verifyAdmin, async (req, res) => {
  try {
    const { title, sort_order } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (sort_order !== undefined) updates.sort_order = sort_order;
    const { data, error } = await supabase.from('modules').update(updates).eq('id', req.params.id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'Module not found' });
    return res.json(data);
  } catch (err) {
    console.error('[admin/modules PUT]', err);
    return res.status(500).json({ error: 'Failed to update module' });
  }
});

app.delete('/api/admin/modules/:id', verifyAdmin, async (req, res) => {
  try {
    const { error } = await supabase.from('modules').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  } catch (err) {
    console.error('[admin/modules DELETE]', err);
    return res.status(500).json({ error: 'Failed to delete module' });
  }
});

app.put('/api/admin/modules/reorder', verifyAdmin, async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ error: 'items array required' });
    await Promise.all(items.map((item) => supabase.from('modules').update({ sort_order: item.sort_order }).eq('id', item.id)));
    return res.json({ success: true });
  } catch (err) {
    console.error('[admin/modules/reorder]', err);
    return res.status(500).json({ error: 'Failed to reorder modules' });
  }
});

// ---------------------------------------------------------------------------
// LESSONS CRUD
// ---------------------------------------------------------------------------

app.post('/api/admin/lessons', verifyAdmin, async (req, res) => {
  try {
    const { module_id, course_id, title, duration, video_id, is_free_preview, sort_order } = req.body;
    if (!module_id || !course_id || !title) return res.status(400).json({ error: 'module_id, course_id, title required' });
    const durationSeconds = parseDurationToSeconds(duration);
    const lessonId = generateId('les');
    const { count } = await supabase.from('lessons').select('id', { count: 'exact', head: true }).eq('module_id', module_id);
    const { data, error } = await supabase.from('lessons').insert({
      id: lessonId, module_id, course_id, title, duration: duration || '',
      duration_seconds: durationSeconds, video_id: video_id || null,
      is_free_preview: is_free_preview || false, sort_order: sort_order !== undefined ? sort_order : (count || 0),
    }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  } catch (err) {
    console.error('[admin/lessons POST]', err);
    return res.status(500).json({ error: 'Failed to create lesson' });
  }
});

app.put('/api/admin/lessons/:id', verifyAdmin, async (req, res) => {
  try {
    const { title, duration, video_id, is_free_preview, sort_order, module_id } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (duration !== undefined) { updates.duration = duration; updates.duration_seconds = parseDurationToSeconds(duration); }
    if (video_id !== undefined) updates.video_id = video_id;
    if (is_free_preview !== undefined) updates.is_free_preview = is_free_preview;
    if (sort_order !== undefined) updates.sort_order = sort_order;
    if (module_id !== undefined) updates.module_id = module_id;
    const { data, error } = await supabase.from('lessons').update(updates).eq('id', req.params.id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'Lesson not found' });
    return res.json(data);
  } catch (err) {
    console.error('[admin/lessons PUT]', err);
    return res.status(500).json({ error: 'Failed to update lesson' });
  }
});

app.delete('/api/admin/lessons/:id', verifyAdmin, async (req, res) => {
  try {
    const { data: lesson } = await supabase.from('lessons').select('course_id').eq('id', req.params.id).single();
    const { error } = await supabase.from('lessons').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true, course_id: lesson ? lesson.course_id : null });
  } catch (err) {
    console.error('[admin/lessons DELETE]', err);
    return res.status(500).json({ error: 'Failed to delete lesson' });
  }
});

app.put('/api/admin/lessons/reorder', verifyAdmin, async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ error: 'items array required' });
    await Promise.all(items.map((item) => supabase.from('lessons').update({ sort_order: item.sort_order }).eq('id', item.id)));
    return res.json({ success: true });
  } catch (err) {
    console.error('[admin/lessons/reorder]', err);
    return res.status(500).json({ error: 'Failed to reorder lessons' });
  }
});

// ---------------------------------------------------------------------------
// FAQs CRUD
// ---------------------------------------------------------------------------

app.post('/api/admin/faqs', verifyAdmin, async (req, res) => {
  try {
    const { course_id, question, answer, sort_order } = req.body;
    if (!course_id || !question || !answer) return res.status(400).json({ error: 'course_id, question, answer required' });
    const { data, error } = await supabase.from('course_faqs').insert({ course_id, question, answer, sort_order: sort_order || 0 }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  } catch (err) {
    console.error('[admin/faqs POST]', err);
    return res.status(500).json({ error: 'Failed to create FAQ' });
  }
});

app.put('/api/admin/faqs/:id', verifyAdmin, async (req, res) => {
  try {
    const { question, answer, sort_order } = req.body;
    const updates = {};
    if (question !== undefined) updates.question = question;
    if (answer !== undefined) updates.answer = answer;
    if (sort_order !== undefined) updates.sort_order = sort_order;
    const { data, error } = await supabase.from('course_faqs').update(updates).eq('id', req.params.id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  } catch (err) {
    console.error('[admin/faqs PUT]', err);
    return res.status(500).json({ error: 'Failed to update FAQ' });
  }
});

app.delete('/api/admin/faqs/:id', verifyAdmin, async (req, res) => {
  try {
    const { error } = await supabase.from('course_faqs').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  } catch (err) {
    console.error('[admin/faqs DELETE]', err);
    return res.status(500).json({ error: 'Failed to delete FAQ' });
  }
});

app.put('/api/admin/faqs/reorder', verifyAdmin, async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ error: 'items array required' });
    await Promise.all(items.map((item) => supabase.from('course_faqs').update({ sort_order: item.sort_order }).eq('id', item.id)));
    return res.json({ success: true });
  } catch (err) {
    console.error('[admin/faqs/reorder]', err);
    return res.status(500).json({ error: 'Failed to reorder FAQs' });
  }
});

// ---------------------------------------------------------------------------
// RESOURCES CRUD
// ---------------------------------------------------------------------------

app.post('/api/admin/resources', verifyAdmin, async (req, res) => {
  try {
    const { course_id, title, description, icon_name, download_url, file_size, sort_order } = req.body;
    if (!course_id || !title) return res.status(400).json({ error: 'course_id and title required' });
    const { data, error } = await supabase.from('course_resources').insert({
      course_id, title, description: description || '', icon_name: icon_name || 'Package',
      download_url: download_url || '#', file_size: file_size || null, sort_order: sort_order || 0,
    }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  } catch (err) {
    console.error('[admin/resources POST]', err);
    return res.status(500).json({ error: 'Failed to create resource' });
  }
});

app.put('/api/admin/resources/:id', verifyAdmin, async (req, res) => {
  try {
    const { title, description, icon_name, download_url, file_size, sort_order } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (icon_name !== undefined) updates.icon_name = icon_name;
    if (download_url !== undefined) updates.download_url = download_url;
    if (file_size !== undefined) updates.file_size = file_size;
    if (sort_order !== undefined) updates.sort_order = sort_order;
    const { data, error } = await supabase.from('course_resources').update(updates).eq('id', req.params.id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  } catch (err) {
    console.error('[admin/resources PUT]', err);
    return res.status(500).json({ error: 'Failed to update resource' });
  }
});

app.delete('/api/admin/resources/:id', verifyAdmin, async (req, res) => {
  try {
    const { error } = await supabase.from('course_resources').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  } catch (err) {
    console.error('[admin/resources DELETE]', err);
    return res.status(500).json({ error: 'Failed to delete resource' });
  }
});

app.put('/api/admin/resources/reorder', verifyAdmin, async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ error: 'items array required' });
    await Promise.all(items.map((item) => supabase.from('course_resources').update({ sort_order: item.sort_order }).eq('id', item.id)));
    return res.json({ success: true });
  } catch (err) {
    console.error('[admin/resources/reorder]', err);
    return res.status(500).json({ error: 'Failed to reorder resources' });
  }
});

// ---------------------------------------------------------------------------
// LEARN ITEMS CRUD
// ---------------------------------------------------------------------------

app.post('/api/admin/learn-items', verifyAdmin, async (req, res) => {
  try {
    const { course_id, item_text, sort_order } = req.body;
    if (!course_id || !item_text) return res.status(400).json({ error: 'course_id and item_text required' });
    const { data, error } = await supabase.from('course_learn_items').insert({ course_id, item_text, sort_order: sort_order || 0 }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  } catch (err) {
    console.error('[admin/learn-items POST]', err);
    return res.status(500).json({ error: 'Failed to create learn item' });
  }
});

app.put('/api/admin/learn-items/:id', verifyAdmin, async (req, res) => {
  try {
    const { item_text, sort_order } = req.body;
    const updates = {};
    if (item_text !== undefined) updates.item_text = item_text;
    if (sort_order !== undefined) updates.sort_order = sort_order;
    const { data, error } = await supabase.from('course_learn_items').update(updates).eq('id', req.params.id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  } catch (err) {
    console.error('[admin/learn-items PUT]', err);
    return res.status(500).json({ error: 'Failed to update learn item' });
  }
});

app.delete('/api/admin/learn-items/:id', verifyAdmin, async (req, res) => {
  try {
    const { error } = await supabase.from('course_learn_items').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  } catch (err) {
    console.error('[admin/learn-items DELETE]', err);
    return res.status(500).json({ error: 'Failed to delete learn item' });
  }
});

app.put('/api/admin/learn-items/reorder', verifyAdmin, async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ error: 'items array required' });
    await Promise.all(items.map((item) => supabase.from('course_learn_items').update({ sort_order: item.sort_order }).eq('id', item.id)));
    return res.json({ success: true });
  } catch (err) {
    console.error('[admin/learn-items/reorder]', err);
    return res.status(500).json({ error: 'Failed to reorder learn items' });
  }
});

// ---------------------------------------------------------------------------
// COMMUNITY
// ---------------------------------------------------------------------------

app.get('/api/admin/courses/:id/community', verifyAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase.from('course_communities').select('*').eq('course_id', req.params.id).single();
    if (error && error.code === 'PGRST116') return res.json({ whatsapp: '', instagram: '', telegram: '', discord: '' });
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data || { whatsapp: '', instagram: '', telegram: '', discord: '' });
  } catch (err) {
    console.error('[admin/community GET]', err);
    return res.status(500).json({ error: 'Failed to fetch community' });
  }
});

app.put('/api/admin/courses/:id/community', verifyAdmin, async (req, res) => {
  try {
    const { whatsapp, instagram, telegram, discord } = req.body;
    const { data: existing } = await supabase.from('course_communities').select('id').eq('course_id', req.params.id).single();
    let result, error;
    if (existing) {
      const updates = { updated_at: new Date().toISOString() };
      if (whatsapp !== undefined) updates.whatsapp = whatsapp;
      if (instagram !== undefined) updates.instagram = instagram;
      if (telegram !== undefined) updates.telegram = telegram;
      if (discord !== undefined) updates.discord = discord;
      ({ data: result, error } = await supabase.from('course_communities').update(updates).eq('course_id', req.params.id).select().single());
    } else {
      ({ data: result, error } = await supabase.from('course_communities').insert({
        course_id: req.params.id, whatsapp: whatsapp || '', instagram: instagram || '',
        telegram: telegram || '', discord: discord || '',
      }).select().single());
    }
    if (error) return res.status(500).json({ error: error.message });
    return res.json(result);
  } catch (err) {
    console.error('[admin/community PUT]', err);
    return res.status(500).json({ error: 'Failed to update community' });
  }
});

// ---------------------------------------------------------------------------
// STUDENTS
// ---------------------------------------------------------------------------

app.get('/api/admin/students', verifyAdmin, async (req, res) => {
  try {
    const { search, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit));
    const offset = (pageNum - 1) * limitNum;

    let query = supabase.from('profiles').select('id, email, name, full_name, phone, avatar, avatar_url, created_at, is_admin', { count: 'exact' }).eq('is_admin', false).order('created_at', { ascending: false }).range(offset, offset + limitNum - 1);
    if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,full_name.ilike.%${search}%`);

    const { data, count, error } = await query;
    if (error) return res.status(500).json({ error: error.message });

    const studentsWithPurchases = await Promise.all(
      (data || []).map(async (s) => {
        const { count: purchaseCount } = await supabase.from('purchases').select('id', { count: 'exact', head: true }).eq('user_id', s.id).eq('payment_status', 'success');
        return { ...s, purchase_count: purchaseCount || 0 };
      })
    );

    return res.json({ students: studentsWithPurchases, total: count || 0, page: pageNum, limit: limitNum });
  } catch (err) {
    console.error('[admin/students]', err);
    return res.status(500).json({ error: 'Failed to fetch students' });
  }
});

app.get('/api/admin/students/:id', verifyAdmin, async (req, res) => {
  try {
    const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', req.params.id).single();
    if (error || !profile) return res.status(404).json({ error: 'Student not found' });
    const { data: purchases } = await supabase.from('purchases').select('*, courses:courses(title, thumbnail)').eq('user_id', req.params.id).eq('payment_status', 'success').order('created_at', { ascending: false });
    const { count: completedLessons } = await supabase.from('lesson_progress').select('id', { count: 'exact', head: true }).eq('user_id', req.params.id).eq('completed', true);
    return res.json({ ...profile, purchases: purchases || [], completed_lessons: completedLessons || 0 });
  } catch (err) {
    console.error('[admin/students/:id]', err);
    return res.status(500).json({ error: 'Failed to fetch student' });
  }
});

app.post('/api/admin/students/:id/grant-access', verifyAdmin, async (req, res) => {
  try {
    const { course_id } = req.body;
    if (!course_id) return res.status(400).json({ error: 'course_id required' });
    const { error } = await supabase.from('purchases').upsert({
      user_id: req.params.id, course_id, amount: 0, payment_method: 'admin_grant',
      transaction_id: `admin_${Date.now()}`, payment_status: 'success', created_at: new Date().toISOString(),
    }, { onConflict: 'user_id,course_id' });
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  } catch (err) {
    console.error('[admin/students/grant-access]', err);
    return res.status(500).json({ error: 'Failed to grant access' });
  }
});

app.post('/api/admin/students/:id/revoke-access', verifyAdmin, async (req, res) => {
  try {
    const { course_id } = req.body;
    if (!course_id) return res.status(400).json({ error: 'course_id required' });
    const { error } = await supabase.from('purchases').delete().eq('user_id', req.params.id).eq('course_id', course_id);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  } catch (err) {
    console.error('[admin/students/revoke-access]', err);
    return res.status(500).json({ error: 'Failed to revoke access' });
  }
});

// ---------------------------------------------------------------------------
// ORDERS
// ---------------------------------------------------------------------------

app.get('/api/admin/orders', verifyAdmin, async (req, res) => {
  try {
    const { status, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit));
    const offset = (pageNum - 1) * limitNum;

    let query = supabase.from('purchases').select('*, profiles:profiles(name, email), courses:courses(title, thumbnail)', { count: 'exact' }).order('created_at', { ascending: false }).range(offset, offset + limitNum - 1);
    if (status && status !== 'all') query = query.eq('payment_status', status);

    const { data, count, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ orders: data || [], total: count || 0, page: pageNum, limit: limitNum });
  } catch (err) {
    console.error('[admin/orders]', err);
    return res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// ---------------------------------------------------------------------------
// COUPONS
// ---------------------------------------------------------------------------

app.get('/api/admin/coupons', verifyAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data || []);
  } catch (err) {
    console.error('[admin/coupons GET]', err);
    return res.status(500).json({ error: 'Failed to fetch coupons' });
  }
});

app.post('/api/admin/coupons', verifyAdmin, async (req, res) => {
  try {
    const { code, discount_type, discount_value, min_purchase, max_discount, usage_limit, starts_at, expires_at, is_active } = req.body;
    if (!code || !discount_type || discount_value === undefined) return res.status(400).json({ error: 'code, discount_type, discount_value required' });
    const { data, error } = await supabase.from('coupons').insert({
      code: code.toUpperCase(), discount_type, discount_value,
      min_purchase: min_purchase || 0, max_discount: max_discount || null,
      usage_limit: usage_limit || null, starts_at: starts_at || null,
      expires_at: expires_at || null, is_active: is_active !== false,
    }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  } catch (err) {
    console.error('[admin/coupons POST]', err);
    return res.status(500).json({ error: 'Failed to create coupon' });
  }
});

app.put('/api/admin/coupons/:id', verifyAdmin, async (req, res) => {
  try {
    const allowedFields = ['code', 'discount_type', 'discount_value', 'min_purchase', 'max_discount', 'usage_limit', 'starts_at', 'expires_at', 'is_active'];
    const updates = {};
    for (const f of allowedFields) {
      if (req.body[f] !== undefined) updates[f] = f === 'code' ? req.body[f].toUpperCase() : req.body[f];
    }
    const { data, error } = await supabase.from('coupons').update(updates).eq('id', req.params.id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  } catch (err) {
    console.error('[admin/coupons PUT]', err);
    return res.status(500).json({ error: 'Failed to update coupon' });
  }
});

app.delete('/api/admin/coupons/:id', verifyAdmin, async (req, res) => {
  try {
    const { error } = await supabase.from('coupons').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  } catch (err) {
    console.error('[admin/coupons DELETE]', err);
    return res.status(500).json({ error: 'Failed to delete coupon' });
  }
});

// ---------------------------------------------------------------------------
// NOTIFICATIONS
// ---------------------------------------------------------------------------

app.get('/api/admin/notifications', verifyAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase.from('admin_notifications').select('*').order('created_at', { ascending: false }).limit(50);
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data || []);
  } catch (err) {
    console.error('[admin/notifications GET]', err);
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

async function sendNotificationEmail(notification) {
  let recipients;
  if (notification.target_type === 'course' && notification.target_course_id) {
    const { data: purchases } = await supabase.from('purchases').select('user_id').eq('course_id', notification.target_course_id).eq('payment_status', 'success');
    const userIds = (purchases || []).map((p) => p.user_id);
    if (userIds.length === 0) return;
    const { data: profiles } = await supabase.from('profiles').select('email, name').in('id', userIds).eq('unsubscribed', false);
    recipients = profiles || [];
  } else {
    const { data: profiles } = await supabase.from('profiles').select('email, name').eq('unsubscribed', false).eq('is_admin', false);
    recipients = profiles || [];
  }

  const CHUNK_SIZE = 50;
  for (let i = 0; i < recipients.length; i += CHUNK_SIZE) {
    const chunk = recipients.slice(i, i + CHUNK_SIZE);
    await Promise.allSettled(
      chunk.map((r) =>
        resend.emails.send({
          from: FROM_EMAIL, to: r.email,
          subject: notification.title,
          html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111;"><h2>${escapeHtml(notification.title)}</h2><p>Hi ${escapeHtml(r.name || 'there')},</p><p>${notification.message}</p><p style="color:#888;font-size:12px;margin-top:32px;">Aaryan Media</p></div>`,
        })
      )
    );
  }
}

app.post('/api/admin/notifications', verifyAdmin, async (req, res) => {
  try {
    const { title, message, target_type, target_course_id, sent_via_email } = req.body;
    if (!title || !message) return res.status(400).json({ error: 'title and message required' });
    const { data, error } = await supabase.from('admin_notifications').insert({
      title, message, target_type: target_type || 'all', target_course_id: target_course_id || null,
      sent_via_email: sent_via_email || false, sent_via_dashboard: true,
    }).select().single();
    if (error) return res.status(500).json({ error: error.message });

    if (sent_via_email) {
      sendNotificationEmail(data).catch((err) => console.error('[notification email] failed:', err));
    }

    return res.status(201).json(data);
  } catch (err) {
    console.error('[admin/notifications POST]', err);
    return res.status(500).json({ error: 'Failed to create notification' });
  }
});

// ---------------------------------------------------------------------------
// SETTINGS
// ---------------------------------------------------------------------------

app.get('/api/admin/settings', verifyAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase.from('site_settings').select('key, value');
    if (error) return res.status(500).json({ error: error.message });
    const settings = {};
    (data || []).forEach((s) => { settings[s.key] = s.value; });
    return res.json(settings);
  } catch (err) {
    console.error('[admin/settings GET]', err);
    return res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.put('/api/admin/settings', verifyAdmin, async (req, res) => {
  try {
    const entries = Object.entries(req.body);
    if (entries.length === 0) return res.status(400).json({ error: 'No settings provided' });
    await Promise.all(
      entries.map(([key, value]) =>
        supabase.from('site_settings').upsert({ key, value: String(value), updated_at: new Date().toISOString() }, { onConflict: 'key' })
      )
    );
    return res.json({ success: true });
  } catch (err) {
    console.error('[admin/settings PUT]', err);
    return res.status(500).json({ error: 'Failed to update settings' });
  }
});

// ---------------------------------------------------------------------------
// ANALYTICS
// ---------------------------------------------------------------------------

app.get('/api/admin/analytics/revenue', verifyAdmin, async (req, res) => {
  try {
    const { range = '30d' } = req.query;
    const days = range === '12m' ? 365 : range === '90d' ? 90 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('purchases')
      .select('amount, created_at')
      .eq('payment_status', 'success')
      .gte('created_at', startDate.toISOString());

    if (error) return res.status(500).json({ error: error.message });

    if (range === '12m') {
      const monthly = {};
      (data || []).forEach((r) => {
        const key = r.created_at.slice(0, 7);
        monthly[key] = (monthly[key] || 0) + (r.amount || 0);
      });
      const labels = Object.keys(monthly).sort();
      return res.json({
        labels: labels.map((l) => {
          const [y, m] = l.split('-');
          return new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
        }),
        values: labels.map((l) => monthly[l]),
      });
    } else {
      const daily = {};
      for (let i = 0; i < days; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        daily[d.toISOString().slice(0, 10)] = 0;
      }
      (data || []).forEach((r) => {
        const key = r.created_at.slice(0, 10);
        if (daily[key] !== undefined) daily[key] += (r.amount || 0);
      });
      const labels = Object.keys(daily).sort();
      return res.json({
        labels: labels.map((l) => new Date(l + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })),
        values: labels.map((l) => daily[l]),
      });
    }
  } catch (err) {
    console.error('[admin/analytics/revenue]', err);
    return res.status(500).json({ error: 'Failed to load revenue analytics' });
  }
});

app.get('/api/admin/analytics/students', verifyAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('created_at')
      .eq('is_admin', false)
      .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });

    const monthly = {};
    (data || []).forEach((r) => {
      const key = r.created_at.slice(0, 7);
      monthly[key] = (monthly[key] || 0) + 1;
    });
    const labels = Object.keys(monthly).sort();
    return res.json({
      labels: labels.map((l) => {
        const [y, m] = l.split('-');
        return new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      }),
      values: labels.map((l) => monthly[l]),
    });
  } catch (err) {
    console.error('[admin/analytics/students]', err);
    return res.status(500).json({ error: 'Failed to load student analytics' });
  }
});

app.get('/api/admin/analytics/courses', verifyAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase.from('purchases').select('course_id, amount').eq('payment_status', 'success');
    if (error) return res.status(500).json({ error: error.message });

    const { data: courses } = await supabase.from('courses').select('id, title');
    const courseMap = {};
    (courses || []).forEach((c) => { courseMap[c.id] = c.title; });

    const stats = {};
    (data || []).forEach((r) => {
      if (!stats[r.course_id]) stats[r.course_id] = { sales: 0, revenue: 0 };
      stats[r.course_id].sales += 1;
      stats[r.course_id].revenue += (r.amount || 0);
    });

    const sorted = Object.entries(stats).sort((a, b) => b[1].revenue - a[1].revenue);
    return res.json(
      sorted.map(([id, s]) => ({
        course_id: id,
        title: courseMap[id] || id,
        sales: s.sales,
        revenue: s.revenue,
      }))
    );
  } catch (err) {
    console.error('[admin/analytics/courses]', err);
    return res.status(500).json({ error: 'Failed to load course analytics' });
  }
});

// ---------------------------------------------------------------------------
// BUNNY VIDEO UPLOAD
// ---------------------------------------------------------------------------

app.post('/api/admin/bunny/create-video', verifyAdmin, async (req, res) => {
  try {
    if (!BUNNY_API_KEY) return res.status(500).json({ error: 'Bunny API key not configured' });

    const { title } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });

    const bunnyRes = await fetch('https://api.bunny.net/video/library', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        AccessKey: BUNNY_API_KEY,
      },
      body: JSON.stringify({ title }),
    });

    if (!bunnyRes.ok) {
      const errText = await bunnyRes.text();
      return res.status(bunnyRes.status).json({ error: `Bunny API error: ${errText}` });
    }

    const bunnyData = await bunnyRes.json();
    return res.json({
      videoId: bunnyData.guid,
      title: bunnyData.title,
      uploadUrl: `https://video.bunny.net/upload/${BUNNY_LIBRARY_ID}/${bunnyData.guid}`,
    });
  } catch (err) {
    console.error('[admin/bunny/create-video]', err);
    return res.status(500).json({ error: 'Failed to create Bunny video' });
  }
});

// ---------------------------------------------------------------------------
// HEALTH CHECK
// ---------------------------------------------------------------------------

app.get('/api/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// ---------------------------------------------------------------------------
// START
// ---------------------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`[server.js] Listening on port ${PORT}`);
});

export default app;