import { Course, Module, PlacementTest, Topic } from './courseData';

const PLACEMENT_RESULT_KEY = 'course-placement-result-v1';
const PLACEMENT_DISMISSED_KEY = 'course-placement-dismissed-v1';

export interface PlacementResult {
  completedAt: string;
  scoresByModuleId: Record<number, number>;
  answersByQuestionId: Record<number, number>;
}

export interface RecommendedTopic {
  module: Module;
  topic: Topic;
  score: number;
}

function normalizeScores(value: unknown) {
  const current = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

  return Object.entries(current).reduce<Record<number, number>>((acc, [moduleId, score]) => {
    const parsedModuleId = Number(moduleId);
    if (Number.isFinite(parsedModuleId) && typeof score === 'number' && Number.isFinite(score)) {
      acc[parsedModuleId] = score;
    }
    return acc;
  }, {});
}

function normalizeAnswers(value: unknown) {
  const current = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

  return Object.entries(current).reduce<Record<number, number>>((acc, [questionId, answerId]) => {
    const parsedQuestionId = Number(questionId);
    if (Number.isFinite(parsedQuestionId) && typeof answerId === 'number' && Number.isFinite(answerId)) {
      acc[parsedQuestionId] = answerId;
    }
    return acc;
  }, {});
}

export function loadPlacementResult(): PlacementResult | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(PLACEMENT_RESULT_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      completedAt: typeof parsed.completedAt === 'string' ? parsed.completedAt : new Date().toISOString(),
      scoresByModuleId: normalizeScores(parsed.scoresByModuleId),
      answersByQuestionId: normalizeAnswers(parsed.answersByQuestionId),
    };
  } catch {
    return null;
  }
}

export function savePlacementResult(result: PlacementResult) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(PLACEMENT_RESULT_KEY, JSON.stringify(result));
  window.localStorage.removeItem(PLACEMENT_DISMISSED_KEY);
}

export function clearPlacementResult() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(PLACEMENT_RESULT_KEY);
  window.localStorage.removeItem(PLACEMENT_DISMISSED_KEY);
}

export function isPlacementDismissed() {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.localStorage.getItem(PLACEMENT_DISMISSED_KEY) === 'true';
}

export function dismissPlacement() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(PLACEMENT_DISMISSED_KEY, 'true');
}

export function calculatePlacementResult(test: PlacementTest, selectedAnswers: Record<number, number>): PlacementResult {
  const scoresByModuleId: Record<number, number> = {};

  test.questions.forEach((question) => {
    const selectedAnswerId = selectedAnswers[question.id];
    const selectedAnswer = question.answers.find((answer) => answer.id === selectedAnswerId);
    if (!selectedAnswer) return;

    scoresByModuleId[selectedAnswer.moduleId] = (scoresByModuleId[selectedAnswer.moduleId] ?? 0) + selectedAnswer.score;
  });

  return {
    completedAt: new Date().toISOString(),
    scoresByModuleId,
    answersByQuestionId: selectedAnswers,
  };
}

export function getSortedModules(course: Course, result: PlacementResult | null) {
  if (!result) {
    return course.modules;
  }

  return [...course.modules].sort((left, right) => {
    const leftScore = result.scoresByModuleId[left.id] ?? 0;
    const rightScore = result.scoresByModuleId[right.id] ?? 0;

    if (rightScore !== leftScore) {
      return rightScore - leftScore;
    }

    return course.modules.findIndex((module) => module.id === left.id) - course.modules.findIndex((module) => module.id === right.id);
  });
}

export function getRecommendedTopics(course: Course, result: PlacementResult | null): RecommendedTopic[] {
  const moduleOrder = getSortedModules(course, result);

  return moduleOrder.flatMap((module) => {
    const score = result?.scoresByModuleId[module.id] ?? 0;
    return module.topics.map((topic) => ({ module, topic, score }));
  });
}
