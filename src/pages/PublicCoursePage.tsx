import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { INITIAL_COURSES } from '../data/courses'; 
import { 
  BookOpen, Play, Loader2, ArrowLeft, CheckCircle, 
  ChevronDown, ChevronUp, Download, MessageCircle, ExternalLink,
  FileCode, Sliders, Sparkles, Volume2, Type, Video, Layers, Music
} from 'lucide-react';

const IconMap: Record<string, any> = {
  FileCode, Sliders, Sparkles, Volume2, Type, Video, Layers, Music
};

export function PublicCoursePage() {
  const { slug } = useParams<{ slug: string }>();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [openModule, setOpenModule] = useState<string | null>(null);

  useEffect(() => {
    if (slug) fetchCourse();
  }, [slug]);

  const fetchCourse = async () => {
    const { data: dbData } = await supabase.from('courses').select('*').eq('slug', slug).single();
    const richData = INITIAL_COURSES.find(c => c.slug === slug);

    setCourse({
      ...richData, 
      ...dbData,
      price: dbData?.price || richData?.price,
      original_price: dbData?.original_price || richData?.price,
      thumbnail: dbData?.thumbnail || richData?.thumbnail
    });
    setLoading(false);
  };

  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#D7FF2F]" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white p-4">
        <h1 className="text-3xl font-bold mb-4">404 - Course Not Found</h1>
        <Link to="/" className="text-[#D7FF2F] hover:underline flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Go back home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Hero Section */}
      <div className="relative w-full h-[50vh] min-h-[400px] bg-zinc-900 overflow-hidden">
        <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/50 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-xs font-bold bg-[#D7FF2F] text-black px-2.5 py-1 rounded-md">BESTSELLER</span>
            <span className="text-xs text-zinc-400">{course.category}</span>
            <span className="text-xs text-zinc-600">•</span>
            <span className="text-xs text-zinc-400">{course.specs?.language || 'English'}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white max-w-4xl leading-tight mb-4">{course.title}</h1>
          <p className="text-zinc-400 text-sm sm:text-base max-w-2xl mb-6">{course.description}</p>
          <div className="flex items-center gap-4 text-sm text-zinc-300">
            <span className="font-semibold text-white">Created by {course.instructor}</span>
            <span className="text-zinc-600">|</span>
            <span>{course.lessonsCount || 0} Lessons</span>
            <span className="text-zinc-600">|</span>
            <span>{course.specs?.lastUpdated || 'Latest Update'}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* What You'll Learn */}
            {course.whatYoullLearn && (
              <div className="bg-[#111111] border border-white/[0.06] rounded-2xl p-6">
                <h2 className="text-xl font-bold mb-5">What you'll learn</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {course.whatYoullLearn.map((item: string, i: number) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-[#D7FF2F] mt-0.5 shrink-0" />
                      <span className="text-sm text-zinc-300">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Curriculum */}
            {course.modules && course.modules.length > 0 && (
              <div className="bg-[#111111] border border-white/[0.06] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-[#D7FF2F]" /> Course Curriculum
                  </h2>
                  <span className="text-xs text-zinc-500">{course.modules.length} Modules • {course.lessonsCount || 0} Lessons</span>
                </div>
                <div className="space-y-3">
                  {course.modules.map((mod: any) => (
                    <div key={mod.id} className="border border-white/[0.06] rounded-xl overflow-hidden">
                      <button 
                        onClick={() => setOpenModule(openModule === mod.id ? null : mod.id)}
                        className="w-full flex items-center justify-between p-4 bg-[#0A0A0A] hover:bg-white/[0.03] transition-colors"
                      >
                        <span className="text-sm font-semibold text-left">{mod.title}</span>
                        <div className="flex items-center gap-3 shrink-0 ml-4">
                          <span className="text-xs text-zinc-500">{mod.lessons.length} lessons</span>
                          {openModule === mod.id ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
                        </div>
                      </button>
                      {openModule === mod.id && (
                        <div className="border-t border-white/[0.04]">
                          {mod.lessons.map((lesson: any) => (
                            <div key={lesson.id} className="flex items-center justify-between p-3 px-4 hover:bg-white/[0.02] transition-colors border-b border-white/[0.02] last:border-0">
                              <div className="flex items-center gap-3">
                                <Play className="w-3.5 h-3.5 text-zinc-600" />
                                <div>
                                  <p className="text-xs font-medium text-zinc-300">{lesson.title}</p>
                                  {lesson.isFreePreview && <span className="text-[10px] text-[#D7FF2F] font-bold">PREVIEW</span>}
                                </div>
                              </div>
                              <span className="text-xs text-zinc-600">{lesson.duration}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FAQs */}
            {course.faqs && course.faqs.length > 0 && (
              <div className="bg-[#111111] border border-white/[0.06] rounded-2xl p-6">
                <h2 className="text-xl font-bold mb-5">Frequently Asked Questions</h2>
                <div className="space-y-4">
                  {course.faqs.map((faq: any, i: number) => (
                    <div key={i}>
                      <h4 className="text-sm font-semibold text-white mb-1">{faq.question}</h4>
                      <p className="text-sm text-zinc-400 leading-relaxed">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Sticky Purchase Card */}
          <div className="lg:col-span-1">
            <div className="bg-[#111111] border border-white/[0.06] rounded-2xl p-6 sticky top-6 space-y-6">
              <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-white/[0.06] group cursor-pointer">
                <img src={course.thumbnail} alt="Preview" className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="w-6 h-6 text-white ml-1" fill="white" />
                  </div>
                </div>
              </div>

              <div>
                {course.original_price > course.price ? (
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-extrabold text-white">{formatINR(course.price)}</span>
                    <span className="text-lg text-zinc-500 line-through">{formatINR(course.original_price)}</span>
                  </div>
                ) : (
                  <span className="text-3xl font-extrabold text-white">{formatINR(course.price)}</span>
                )}
              </div>

              <button className="w-full bg-[#D7FF2F] text-black font-extrabold py-4 rounded-xl text-sm hover:bg-[#c5ee20] transition-colors flex items-center justify-center gap-2">
                Buy Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}