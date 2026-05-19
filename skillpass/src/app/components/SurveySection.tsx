
import { useMemo, useState } from 'react';
import { CheckCircle2, RotateCcw } from 'lucide-react';
import { Survey, SurveyQuestion } from '../data/courseData';

interface SurveySectionProps {
  survey: Survey;
}

type SurveyAnswer = string | string[];

function isAnswered(question: SurveyQuestion, answer: SurveyAnswer | undefined) {
  if (question.type === 'multiple_choice') {
    return Array.isArray(answer) && answer.length > 0;
  }

  return typeof answer === 'string' && answer.trim().length > 0;
}

export function SurveySection({ survey }: SurveySectionProps) {
  const [answers, setAnswers] = useState<Record<number, SurveyAnswer>>({});
  const [submitted, setSubmitted] = useState(false);

  const answeredCount = useMemo(
    () => survey.questions.filter((question) => isAnswered(question, answers[question.id])).length,
    [answers, survey.questions],
  );

  const updateTextAnswer = (questionId: number, value: string) => {
    setAnswers((previous) => ({ ...previous, [questionId]: value }));
  };

  const updateMultipleChoiceAnswer = (questionId: number, option: string, checked: boolean) => {
    setAnswers((previous) => {
      const currentAnswer = Array.isArray(previous[questionId]) ? previous[questionId] : [];
      const nextAnswer = checked
        ? [...currentAnswer, option]
        : currentAnswer.filter((currentOption) => currentOption !== option);

      return {
        ...previous,
        [questionId]: nextAnswer,
      };
    });
  };

  const handleReset = () => {
    setAnswers({});
    setSubmitted(false);
  };

  return (
    <div className="bg-violet-50 rounded-2xl border border-violet-200 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h3 className="font-semibold text-xl text-violet-950">{survey.title}</h3>
          {survey.description && <p className="text-violet-900/80 mt-2">{survey.description}</p>}
        </div>
        <div className="px-3 py-2 rounded-xl bg-white border border-violet-200 text-sm text-violet-900">
          Заполнено: {answeredCount} из {survey.questions.length}
        </div>
      </div>

      {submitted && (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-medium">Ответы сохранены локально</div>
            <div className="text-sm text-emerald-700 mt-1">
              В этой демо-версии они остаются в форме и не отправляются на сервер.
            </div>
          </div>
        </div>
      )}

      <div className="space-y-5">
        {survey.questions.map((question, index) => {
          const answer = answers[question.id];

          return (
            <div key={question.id} className="bg-white rounded-2xl border border-violet-100 p-5">
              <div className="mb-4">
                <div className="text-sm text-violet-600 mb-1">Вопрос {index + 1}</div>
                <div className="font-medium text-gray-900">{question.title}</div>
                {question.description && <div className="text-sm text-gray-500 mt-1">{question.description}</div>}
              </div>

              {question.type === 'short_text' && (
                <input
                  value={typeof answer === 'string' ? answer : ''}
                  onChange={(event) => updateTextAnswer(question.id, event.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                  placeholder="Ваш ответ"
                  disabled={submitted}
                />
              )}

              {question.type === 'long_text' && (
                <textarea
                  value={typeof answer === 'string' ? answer : ''}
                  onChange={(event) => updateTextAnswer(question.id, event.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 min-h-32"
                  placeholder="Введите развёрнутый ответ"
                  disabled={submitted}
                />
              )}

              {question.type === 'single_choice' && (
                <div className="space-y-2">
                  {(question.options ?? []).map((option, optionIndex) => (
                    <label key={optionIndex} className="flex items-start gap-3 rounded-xl border border-gray-200 px-4 py-3 cursor-pointer hover:border-violet-300">
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        checked={answer === option}
                        onChange={() => updateTextAnswer(question.id, option)}
                        disabled={submitted}
                        className="mt-1"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {question.type === 'multiple_choice' && (
                <div className="space-y-2">
                  {(question.options ?? []).map((option, optionIndex) => {
                    const selectedOptions = Array.isArray(answer) ? answer : [];
                    const checked = selectedOptions.includes(option);

                    return (
                      <label key={optionIndex} className="flex items-start gap-3 rounded-xl border border-gray-200 px-4 py-3 cursor-pointer hover:border-violet-300">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(event) => updateMultipleChoiceAnswer(question.id, option, event.target.checked)}
                          disabled={submitted}
                          className="mt-1"
                        />
                        <span>{option}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {question.type === 'scale_1_5' && (
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((value) => {
                    const selected = answer === String(value);

                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => updateTextAnswer(question.id, String(value))}
                        disabled={submitted}
                        className={`rounded-xl border px-4 py-3 font-medium transition-colors ${
                          selected
                            ? 'border-violet-500 bg-violet-100 text-violet-900'
                            : 'border-gray-200 bg-white hover:border-violet-300'
                        } ${submitted ? 'cursor-default' : ''}`}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
              )}

              {question.type === 'yes_no' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {['Да', 'Нет'].map((option) => {
                    const selected = answer === option;

                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => updateTextAnswer(question.id, option)}
                        disabled={submitted}
                        className={`rounded-xl border px-4 py-3 font-medium text-left transition-colors ${
                          selected
                            ? 'border-violet-500 bg-violet-100 text-violet-900'
                            : 'border-gray-200 bg-white hover:border-violet-300'
                        } ${submitted ? 'cursor-default' : ''}`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {!submitted ? (
          <button
            type="button"
            onClick={() => setSubmitted(true)}
            className="px-6 py-3 rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition-colors"
          >
            Отправить ответы
          </button>
        ) : (
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-gray-200 hover:border-gray-300 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Заполнить заново
          </button>
        )}
      </div>
    </div>
  );
}
