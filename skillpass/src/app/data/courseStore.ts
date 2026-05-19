
import { Course, Lesson, Module, PlacementAnswer, PlacementQuestion, PlacementTest, Survey, SurveyQuestion, SurveyQuestionType, Topic, defaultCourseData } from './courseData';

const STORAGE_KEY = 'editable-course-data-v2';
const QUESTION_TYPES: SurveyQuestionType[] = [
  'short_text',
  'long_text',
  'single_choice',
  'multiple_choice',
  'scale_1_5',
  'yes_no',
];

function cloneDefaultCourse(): Course {
  return JSON.parse(JSON.stringify(defaultCourseData));
}

function normalizeString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function normalizeStringArray(value: unknown) {
  return Array.isArray(value) ? value.map((item) => normalizeString(item)).filter(Boolean) : [];
}


function normalizeNumber(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function normalizePlacementAnswer(value: unknown, index: number, fallbackModuleId: number): PlacementAnswer {
  const current = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

  return {
    id: typeof current.id === 'number' ? current.id : index + 1,
    title: normalizeString(current.title, `Вариант ${index + 1}`),
    moduleId: normalizeNumber(current.moduleId, fallbackModuleId),
    score: normalizeNumber(current.score, 1),
  };
}

function normalizePlacementQuestion(value: unknown, index: number, fallbackModuleId: number): PlacementQuestion {
  const current = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  const answers = Array.isArray(current.answers)
    ? current.answers.map((answer, answerIndex) => normalizePlacementAnswer(answer, answerIndex, fallbackModuleId))
    : [];

  return {
    id: typeof current.id === 'number' ? current.id : index + 1,
    title: normalizeString(current.title, `Вопрос ${index + 1}`),
    description: normalizeString(current.description),
    answers: answers.length > 0
      ? answers
      : [
          { id: 1, title: 'Вариант 1', moduleId: fallbackModuleId, score: 1 },
          { id: 2, title: 'Вариант 2', moduleId: fallbackModuleId, score: 0 },
        ],
  };
}

function normalizePlacementTest(value: unknown, index: number, fallbackModuleId: number): PlacementTest {
  const current = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  const questions = Array.isArray(current.questions)
    ? current.questions.map((question, questionIndex) => normalizePlacementQuestion(question, questionIndex, fallbackModuleId))
    : [];

  return {
    id: typeof current.id === 'number' ? current.id : index + 1,
    title: normalizeString(current.title, `Входной тест ${index + 1}`),
    description: normalizeString(current.description),
    questions,
  };
}

function normalizeQuestionType(value: unknown): SurveyQuestionType {
  return QUESTION_TYPES.includes(value as SurveyQuestionType) ? (value as SurveyQuestionType) : 'short_text';
}

function questionSupportsOptions(type: SurveyQuestionType) {
  return type === 'single_choice' || type === 'multiple_choice';
}

function normalizeSurveyQuestion(value: unknown, index: number): SurveyQuestion {
  const current = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  const type = normalizeQuestionType(current.type);
  const title = normalizeString(current.title ?? current.question, `Вопрос ${index + 1}`);
  const options = questionSupportsOptions(type)
    ? (() => {
        const nextOptions = normalizeStringArray(current.options);
        return nextOptions.length >= 2 ? nextOptions : ['Вариант 1', 'Вариант 2'];
      })()
    : undefined;

  return {
    id: typeof current.id === 'number' ? current.id : index + 1,
    type,
    title,
    description: normalizeString(current.description),
    ...(options ? { options } : {}),
  };
}

function normalizeSurvey(value: unknown): Survey | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const current = value as Record<string, unknown>;
  const questions = Array.isArray(current.questions)
    ? current.questions.map((question, index) => normalizeSurveyQuestion(question, index))
    : [];

  return {
    title: normalizeString(current.title, 'Опросник урока'),
    description: normalizeString(current.description),
    questions,
  };
}

function normalizeLesson(value: unknown): Lesson {
  const current = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  const resources = Array.isArray(current.resources)
    ? current.resources
        .map((resource) => {
          const currentResource = resource && typeof resource === 'object' ? (resource as Record<string, unknown>) : {};
          return {
            title: normalizeString(currentResource.title, 'Новый ресурс'),
            url: normalizeString(currentResource.url),
          };
        })
        .filter((resource) => resource.title || resource.url)
    : [];
  const survey = normalizeSurvey(current.survey);

  return {
    id: typeof current.id === 'number' ? current.id : 1,
    title: normalizeString(current.title, 'Новый урок'),
    description: normalizeString(current.description),
    videoUrl: normalizeString(current.videoUrl),
    presentationUrl: normalizeString(current.presentationUrl),
    pdfUrl: normalizeString(current.pdfUrl),
    longread: normalizeString(current.longread),
    resources,
    ...(survey ? { survey } : {}),
  };
}

function normalizeTopic(value: unknown): Topic {
  const current = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  const lessons = Array.isArray(current.lessons) ? current.lessons.map(normalizeLesson) : [];

  return {
    id: typeof current.id === 'number' ? current.id : 1,
    title: normalizeString(current.title, 'Новая тема'),
    description: normalizeString(current.description),
    lessons,
  };
}

function normalizeModule(value: unknown): Module {
  const current = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  const topics = Array.isArray(current.topics) ? current.topics.map(normalizeTopic) : [];

  return {
    id: typeof current.id === 'number' ? current.id : 1,
    title: normalizeString(current.title, 'Новый модуль'),
    description: normalizeString(current.description),
    topics,
  };
}

function isLikelyCourse(value: unknown) {
  return !!value && typeof value === 'object' && Array.isArray((value as Record<string, unknown>).modules);
}

export function normalizeCourse(value: unknown): Course {
  if (!isLikelyCourse(value)) {
    return cloneDefaultCourse();
  }

  const current = value as Record<string, unknown>;
  const benefits = normalizeStringArray(current.benefits);

  const modules = Array.isArray(current.modules) ? current.modules.map(normalizeModule) : cloneDefaultCourse().modules;
  const fallbackModuleId = modules[0]?.id ?? 1;
  const placementTests = Array.isArray(current.placementTests)
    ? current.placementTests.map((test, index) => normalizePlacementTest(test, index, fallbackModuleId))
    : cloneDefaultCourse().placementTests;

  return {
    title: normalizeString(current.title, defaultCourseData.title),
    description: normalizeString(current.description, defaultCourseData.description),
    benefits: benefits.length > 0 ? benefits : defaultCourseData.benefits,
    placementTests,
    modules,
  };
}

export function loadCourseData(): Course {
  if (typeof window === 'undefined') {
    return cloneDefaultCourse();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return cloneDefaultCourse();
    }

    return normalizeCourse(JSON.parse(raw));
  } catch {
    return cloneDefaultCourse();
  }
}

export function saveCourseData(course: Course) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeCourse(course)));
}

export function resetCourseData() {
  const nextCourse = cloneDefaultCourse();
  saveCourseData(nextCourse);
  return nextCourse;
}

export function exportCourseData(course: Course) {
  const blob = new Blob([JSON.stringify(normalizeCourse(course), null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'course-data.json';
  link.click();
  URL.revokeObjectURL(url);
}

export async function importCourseData(file: File): Promise<Course> {
  const text = await file.text();
  const parsed = JSON.parse(text);

  if (!isLikelyCourse(parsed)) {
    throw new Error('Файл не похож на структуру курса');
  }

  const normalizedCourse = normalizeCourse(parsed);
  saveCourseData(normalizedCourse);
  return normalizedCourse;
}
