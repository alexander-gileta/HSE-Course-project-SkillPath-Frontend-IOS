import { useState } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, Sparkles, X } from 'lucide-react';
import { PlacementTest } from '../data/courseData';
import { PlacementResult, calculatePlacementResult } from '../data/placementStore';

interface PlacementTestModalProps {
  test: PlacementTest;
  onComplete: (result: PlacementResult) => void;
  onSkip: () => void;
}

export function PlacementTestModal({ test, onComplete, onSkip }: PlacementTestModalProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});

  const questions = test.questions;
  const currentQuestion = questions[currentQuestionIndex];
  const selectedAnswerId = currentQuestion ? selectedAnswers[currentQuestion.id] : undefined;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const answeredCount = questions.filter((question) => selectedAnswers[question.id]).length;


  const finishTest = () => {
    onComplete(calculatePlacementResult(test, selectedAnswers));
  };

  if (!currentQuestion || questions.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-950/60 px-4 py-6 overflow-y-auto">
      <div className="min-h-full flex items-center justify-center">
        <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="p-6 md:p-8 border-b border-gray-100 bg-gradient-to-br from-blue-50 to-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-sm mb-4">
                  <Sparkles className="w-4 h-4" />
                  Начало курса
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2">{test.title}</h2>
                {test.description && <p className="text-gray-600 text-lg">{test.description}</p>}
              </div>

              <button
                type="button"
                onClick={onSkip}
                className="rounded-full p-2 text-gray-500 hover:text-gray-900 hover:bg-white transition-colors"
                aria-label="Закрыть тест"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Вопрос {currentQuestionIndex + 1} из {questions.length}</span>
                <span>Отвечено: {answeredCount}/{questions.length}</span>
              </div>
              <div className="h-2 rounded-full bg-white border border-blue-100 overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all"
                  style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8">
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">{currentQuestion.title}</h3>
              {currentQuestion.description && <p className="text-gray-600">{currentQuestion.description}</p>}
            </div>

            <div className="space-y-3">
              {currentQuestion.answers.map((answer) => {
                const selected = selectedAnswerId === answer.id;

                return (
                  <button
                    key={answer.id}
                    type="button"
                    onClick={() => setSelectedAnswers((previous) => ({ ...previous, [currentQuestion.id]: answer.id }))}
                    className={`w-full text-left rounded-2xl border p-4 transition-all ${
                      selected ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="font-medium text-gray-900">{answer.title}</div>
                      {selected && <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-6 md:p-8 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-gray-50">
            <button
              type="button"
              onClick={() => setCurrentQuestionIndex((index) => Math.max(index - 1, 0))}
              disabled={currentQuestionIndex === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Назад
            </button>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onSkip}
                className="px-4 py-2 rounded-xl border border-gray-200 bg-white hover:border-gray-300"
              >
                Пройти позже
              </button>

              {isLastQuestion ? (
                <button
                  type="button"
                  onClick={finishTest}
                  disabled={answeredCount !== questions.length}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Завершить опросник
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setCurrentQuestionIndex((index) => Math.min(index + 1, questions.length - 1))}
                  disabled={!selectedAnswerId}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Далее
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
