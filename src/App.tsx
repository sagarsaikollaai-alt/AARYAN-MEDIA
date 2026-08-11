import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import { supabase } from './lib/supabase';
import type { User } from '@supabase/supabase-js';
import { Course, UserProfile } from './types';

// Components
import { Header } from './components/Header';
import { LoginModal } from './components/LoginModal';
import { CourseCard } from './components/CourseCard';
import { PaymentModal } from './components/PaymentModal';
import { Footer } from './components/Footer'; // <-- Footer imported here
import { Search } from 'lucide-react';

// Pages
import { CourseDetailsPage } from './pages/CourseDetailsPage';
import { MyCoursesPage } from './pages/MyCoursesPage';
import { AccountPage } from './pages/AccountPage';
import { PreferencesPage } from './pages/PreferencesPage';

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  const [courses, setCourses] = useState<Course[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [paymentCourse, setPaymentCourse] = useState<Course | null>(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const init = async () => {
    await fetchCourses();

    const { data: { session } } = await supabase.auth.getSession();

    if (session) {  
      await handleUserData(session.user);
   }

      setLoading(false);
    };
    init();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) await handleUserData(session.user);
      else { setUser(null); setSupabaseUser(null); }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const fetchCourses = async () => {
  const { data: courseData, error: courseError } = await supabase
    .from('courses')
    .select('*')
    .in('status', ['live', 'coming_soon'])
    .order('created_at', { ascending: true });

  if (courseError) {
    console.error('Error fetching courses:', courseError);
    setCourses([]);
    return;
  }

  if (!courseData || courseData.length === 0) {
    setCourses([]);
    return;
  }

  const courseIds = courseData.map(course => course.id);

  const [
    { data: modules },
    { data: lessons },
    { data: learnItems },
    { data: faqs },
    { data: resources },
    { data: communities }
  ] = await Promise.all([
    supabase
      .from('modules')
      .select('*')
      .in('course_id', courseIds)
      .order('sort_order', { ascending: true }),

    supabase
      .from('lessons')
      .select('*')
      .in('course_id', courseIds)
      .order('sort_order', { ascending: true }),

    supabase
      .from('course_learn_items')
      .select('*')
      .in('course_id', courseIds)
      .order('sort_order', { ascending: true }),

    supabase
      .from('course_faqs')
      .select('*')
      .in('course_id', courseIds)
      .order('sort_order', { ascending: true }),

    supabase
      .from('course_resources')
      .select('*')
      .in('course_id', courseIds)
      .order('sort_order', { ascending: true }),

    supabase
      .from('course_communities')
      .select('*')
      .in('course_id', courseIds)
  ]);

  const formattedCourses: Course[] = courseData.map(course => {
    const courseModules = (modules || [])
      .filter(module => module.course_id === course.id)
      .map(module => ({
        ...module,
        lessons: (lessons || [])
          .filter(lesson => lesson.module_id === module.id)
          .sort((a, b) => a.sort_order - b.sort_order)
      }));

    return {
      ...course,

      whatYoullLearn: (learnItems || [])
        .filter(item => item.course_id === course.id)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(item => item.item_text),

      modules: courseModules,

      faqs: (faqs || [])
        .filter(faq => faq.course_id === course.id)
        .sort((a, b) => a.sort_order - b.sort_order),

      resources: (resources || [])
        .filter(resource => resource.course_id === course.id)
        .sort((a, b) => a.sort_order - b.sort_order),

      community:
        (communities || []).find(
          community => community.course_id === course.id
        ) || null,

      purchased: false
    };
  });

  setCourses(formattedCourses);
};

  const handleUserData = async (authUser: User) => {
  setSupabaseUser(authUser);

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, avatar')
    .eq('id', authUser.id)
    .single();

  const { data: enrollments, error: enrollmentError } = await supabase
    .from('enrollments')
    .select('course_id')
    .eq('user_id', authUser.id)
    .eq('status', 'active');

  if (enrollmentError) {
    console.error('Error fetching enrollments:', enrollmentError);
  }

  const purchasedIds = (enrollments || []).map(
    enrollment => enrollment.course_id
  );

  setUser({
    id: authUser.id,
    email: authUser.email || '',
    name:
      profile?.name ||
      authUser.user_metadata?.name ||
      'Creator',
    avatar:
      profile?.avatar ||
      authUser.user_metadata?.name?.[0]?.toUpperCase() ||
      'A',
    purchasedCourseIds: purchasedIds
  });
};

  useEffect(() => {
    if (!user) return;
    setCourses(prev => prev.map(c => ({ ...c, purchased: user.purchasedCourseIds.includes(c.id) })));
  }, [user]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleBuyCourse = (course: Course) => {
    if (!user) { setIsLoginOpen(true); showToast('Please login to purchase'); return; }
    setPaymentCourse(course);
  };

  const handlePaymentSuccess = (course: Course, _txId: string) => {
    setCourses(prev => prev.map(c => c.id === course.id ? { ...c, purchased: true } : c));
    setUser(prev => prev ? { ...prev, purchasedCourseIds: [...prev.purchasedCourseIds, course.id] } : prev);
    setPaymentCourse(null);
    showToast('Payment Successful! Access Granted.');
    navigate(`/learn/${course.slug}`);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const filteredCourses = courses.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()) || c.description.toLowerCase().includes(searchQuery.toLowerCase()));
  const getActiveTab = () => location.pathname.startsWith('/my-courses') ? 'my-courses' : 'explore';
  const hideNav = location.pathname.includes('/learn/');

  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#D7FF2F]/30 border-t-[#D7FF2F] rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col">
      <Header
        activeTab={getActiveTab()}
        onTabChange={(tab) => navigate(tab === 'my-courses' ? '/my-courses' : '/')}
        onNavigate={(path) => navigate(path)}
        isLoggedIn={!!user}
        user={user}
        onLoginClick={() => setIsLoginOpen(true)}
        onLogoutClick={handleLogout}
        purchasedCount={user?.purchasedCourseIds.length || 0}
        hideNav={hideNav}
      />

      <Routes>
        <Route path="/" element={
          <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-10 pb-8 border-b border-white/[0.08]">
              <div>
                <span className="inline-block bg-[#D7FF2F]/10 text-[#D7FF2F] text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wider">✨ Aaryan Media Curriculum</span>
                <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-none mb-3">Explore Courses</h1>
                <p className="text-zinc-400 text-base md:text-lg max-w-xl">Master practical skills through premium courses built for creators.</p>
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input type="text" placeholder="Search courses..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-[#111111] border border-white/[0.08] focus:border-[#D7FF2F] rounded-full pl-11 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition-colors" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map(course => (
                <CourseCard 
                  key={course.id} 
                  course={course} 
                  onCardClick={(c) => navigate(`/courses/${c.slug}`)} 
                  onCtaClick={(e, c) => {
                    e.stopPropagation(); 
                    if (c.purchased) {
                      navigate(`/learn/${c.slug}`); 
                    } else {
                      handleBuyCourse(c); 
                    }
                  }} 
                />
              ))}
            </div>
          </main>
        } />

        <Route path="/courses/:slug" element={<CoursePageWrapper courses={courses} user={user} navigate={navigate} handleBuyCourse={handleBuyCourse} />} />
        <Route path="/learn/:slug" element={<CoursePageWrapper courses={courses} user={user} navigate={navigate} handleBuyCourse={handleBuyCourse} />} />

        <Route path="/my-courses" element={
          user ? (
            <MyCoursesPage courses={courses} user={user} onNavigateToCourse={(slug) => navigate(`/learn/${slug}`)} onBack={() => navigate('/')} onExplore={() => navigate('/')} />
          ) : <Navigate to="/" />
        } />

        <Route path="/account" element={user ? <AccountPage user={user} supabaseUser={supabaseUser} onBack={() => navigate('/my-courses')} showToast={showToast} /> : <Navigate to="/" />} />
        <Route path="/preferences" element={user ? <PreferencesPage supabaseUser={supabaseUser} onBack={() => navigate('/my-courses')} showToast={showToast} /> : <Navigate to="/" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      {/* Footer added here, outside the Routes so it renders globally */}
      <Footer />

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} onSuccessLogin={(name) => { showToast(`Welcome, ${name}!`); setIsLoginOpen(false); }} />
      <PaymentModal isOpen={!!paymentCourse} course={paymentCourse} user={user} onClose={() => setPaymentCourse(null)} onPaymentSuccess={handlePaymentSuccess} />
      {toast && <div className="fixed bottom-6 right-6 z-[100] bg-[#D7FF2F] text-black font-bold py-3 px-5 rounded-xl shadow-lg">{toast}</div>}
    </div>
  );
}

function CoursePageWrapper({ courses, user, navigate, handleBuyCourse }: any) {
  const { slug } = useParams<{ slug: string }>();
  const course = courses.find((c: Course) => c.slug === slug);
  if (!course) return <div className="min-h-screen flex items-center justify-center text-white">Course not found.</div>;

  return (
    <CourseDetailsPage
      course={course}
      allCourses={courses}
      user={user}
      isPurchased={user?.purchasedCourseIds.includes(course.id)}
      onNavigateToCourse={(s: string) => navigate(`/courses/${s}`)}
      onBackToCourses={() => navigate('/')}
      onBuyCourse={handleBuyCourse}
      onContinueLearning={(c: Course) => navigate(`/learn/${c.slug}`)}
    />
  );
}