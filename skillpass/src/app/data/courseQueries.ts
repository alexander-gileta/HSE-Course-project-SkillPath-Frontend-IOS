import { Course, Lesson, Module, Topic } from './courseData';

export function getCourseStats(course: Course) {
  const modules = course.modules.length;
  const topics = course.modules.reduce((sum, module) => sum + module.topics.length, 0);
  const lessons = course.modules.reduce(
    (sum, module) => sum + module.topics.reduce((topicSum, topic) => topicSum + topic.lessons.length, 0),
    0,
  );

  return { modules, topics, lessons };
}

export function findModule(course: Course, moduleId: number): Module | undefined {
  return course.modules.find((module) => module.id === moduleId);
}

export function findTopic(course: Course, moduleId: number, topicId: number): Topic | undefined {
  return findModule(course, moduleId)?.topics.find((topic) => topic.id === topicId);
}

export function findLesson(
  course: Course,
  moduleId: number,
  topicId: number,
  lessonId: number,
): Lesson | undefined {
  return findTopic(course, moduleId, topicId)?.lessons.find((lesson) => lesson.id === lessonId);
}

export function countLessonsInModule(module: Module) {
  return module.topics.reduce((sum, topic) => sum + topic.lessons.length, 0);
}
