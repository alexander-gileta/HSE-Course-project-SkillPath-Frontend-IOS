import { useEffect, useState } from 'react';
import { Course } from '../data/courseData';
import { loadCourseData, resetCourseData, saveCourseData } from '../data/courseStore';

export function useCourseData() {
  const [course, setCourse] = useState<Course>(() => loadCourseData());

  useEffect(() => {
    const syncCourse = () => setCourse(loadCourseData());
    window.addEventListener('storage', syncCourse);
    return () => window.removeEventListener('storage', syncCourse);
  }, []);

  const updateCourse = (updater: Course | ((previous: Course) => Course)) => {
    setCourse((previous) => {
      const nextCourse = typeof updater === 'function' ? (updater as (previous: Course) => Course)(previous) : updater;
      saveCourseData(nextCourse);
      return nextCourse;
    });
  };

  const restoreDefaults = () => {
    const nextCourse = resetCourseData();
    setCourse(nextCourse);
  };

  return {
    course,
    updateCourse,
    restoreDefaults,
  };
}
