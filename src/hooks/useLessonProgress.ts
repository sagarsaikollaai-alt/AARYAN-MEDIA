import { useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

export function useLessonProgress(userId: string | undefined, courseId: string) {
  const lastSaved = useRef<number>(0);

  const saveProgress = useCallback(
    async (lessonId: string, positionSeconds: number, durationSeconds?: number) => {
      if (!userId || !courseId || !lessonId) return;
      
      const now = Date.now();
      if (now - lastSaved.current < 5000) return; // Throttle to 1 save per 5 seconds
      lastSaved.current = now;

      const completed = durationSeconds ? (positionSeconds / durationSeconds) > 0.95 : false;

      const { error } = await supabase.from('lesson_progress').upsert(
        {
          user_id: userId,
          course_id: courseId,
          lesson_id: lessonId,
          last_position_seconds: Math.floor(positionSeconds),
          duration_seconds: durationSeconds ? Math.floor(durationSeconds) : null,
          completed,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,course_id,lesson_id' }
      );

      if (error) console.error('Error saving progress:', error);
    },
    [userId, courseId]
  );

  const saveProgressImmediate = useCallback(
    async (lessonId: string, positionSeconds: number, durationSeconds?: number) => {
      if (!userId || !courseId || !lessonId) return;
      lastSaved.current = Date.now(); // Reset throttle so the immediate save goes through
      
      const completed = durationSeconds ? (positionSeconds / durationSeconds) > 0.95 : false;

      const { error } = await supabase.from('lesson_progress').upsert(
        {
          user_id: userId,
          course_id: courseId,
          lesson_id: lessonId,
          last_position_seconds: Math.floor(positionSeconds),
          duration_seconds: durationSeconds ? Math.floor(durationSeconds) : null,
          completed,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,course_id,lesson_id' }
      );

      if (error) console.error('Error saving immediate progress:', error);
    },
    [userId, courseId]
  );

  const getProgress = useCallback(
    async (lessonId: string) => {
      if (!userId || !courseId) return null;
      const { data, error } = await supabase
        .from('lesson_progress')
        .select('last_position_seconds, duration_seconds, completed')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .eq('lesson_id', lessonId)
        .maybeSingle();
        
      if (error) {
        console.error('getProgress error:', error);
        return null;
      }
      return data;
    },
    [userId, courseId]
  );

  const getLastWatchedLesson = useCallback(async () => {
    if (!userId || !courseId) return null;
    const { data, error } = await supabase
      .from('lesson_progress')
      .select('lesson_id, last_position_seconds, updated_at')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
      
    if (error) {
      console.error('getLastWatchedLesson error:', error);
      return null;
    }
    return data;
  }, [userId, courseId]);

  return { saveProgress, saveProgressImmediate, getProgress, getLastWatchedLesson };
}