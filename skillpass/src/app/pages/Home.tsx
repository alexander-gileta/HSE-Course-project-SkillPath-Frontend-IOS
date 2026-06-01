import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, BookOpen, ExternalLink, GraduationCap, Layers3, PencilLine, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react';
import { PlacementTestModal } from '../components/PlacementTestModal';
import { TopicCard } from '../components/TopicCard';
import { useCourseData } from '../hooks/useCourseData';
import { countLessonsInModule, getCourseStats } from '../data/courseQueries';
import {
  PlacementResult,
  clearPlacementResult,
  dismissPlacement,
  getRecommendedModules,
  getSortedModules,
  isPlacementDismissed,
  loadPlacementResult,
  savePlacementResult,
} from '../data/placementStore';

type SiteVersion = 'user' | 'admin';

interface HomeProps {
  version?: SiteVersion;
}

function CourseHome({ version = 'user' }: HomeProps) {
  const isAdmin = version === 'admin';
  const routePrefix = isAdmin ? '/admin' : '';
  const editorPath = '/admin/editor';

  const { course } = useCourseData();
  const stats = getCourseStats(course);
  const firstPlacementTest = course.placementTests?.[0];
  const [placementResult, setPlacementResult] = useState<PlacementResult | null>(() => loadPlacementResult());
  const [showPlacementTest, setShowPlacementTest] = useState(false);

  useEffect(() => {
    if (!placementResult && firstPlacementTest && !isPlacementDismissed()) {
      setShowPlacementTest(true);
    }
  }, [firstPlacementTest, placementResult]);

  const sortedModules = useMemo(() => getSortedModules(course, placementResult), [course, placementResult]);
  const recommendedModules = useMemo(() => getRecommendedModules(course, placementResult), [course, placementResult]);

  const handlePlacementComplete = (result: PlacementResult) => {
    savePlacementResult(result);
    setPlacementResult(result);
    setShowPlacementTest(false);
  };

  const handlePlacementSkip = () => {
    dismissPlacement();
    setShowPlacementTest(false);
  };

  const restartPlacement = () => {
    clearPlacementResult();
    setPlacementResult(null);
    if (firstPlacementTest) {
      setShowPlacementTest(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {showPlacementTest && firstPlacementTest && (
        <PlacementTestModal
          test={firstPlacementTest}
          onComplete={handlePlacementComplete}
          onSkip={handlePlacementSkip}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between mb-12">
          <div className="max-w-4xl">
            {isAdmin && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-sm mb-4">
                <ShieldCheck className="w-4 h-4" />
                Админ-версия сайта
              </div>
            )}
            <div className="inline-flex items-center gap-3 mb-4">
              <GraduationCap className="w-12 h-12 text-blue-600" />
              <h1 className="text-4xl font-bold">{course.title}</h1>
            </div>
            <p className="text-xl text-gray-600">{course.description}</p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm text-gray-600">
              {course.benefits.map((benefit) => (
                <span key={benefit} className="px-4 py-2 bg-white border border-gray-200 rounded-full">
                  ✓ {benefit}
                </span>
              ))}
            </div>
          </div>

          {isAdmin && (
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm min-w-[280px]">
              <div className="text-sm text-gray-500 mb-2">Администрирование</div>
              <div className="font-semibold text-lg mb-3">Управление содержимым курса</div>
              <p className="text-sm text-gray-600 mb-4">
                В админ-версии доступны редактор структуры, импорт/экспорт JSON и быстрые переходы для проверки страниц.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  to={editorPath}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  <PencilLine className="w-4 h-4" />
                  Редактировать курс
                </Link>
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:border-gray-300"
                >
                  <ExternalLink className="w-4 h-4" />
                  Публичная версия
                </Link>
              </div>
            </div>
          )}
        </div>

        {firstPlacementTest && (
          <section className="mb-12 bg-white border border-blue-100 rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm mb-3">
                  <Sparkles className="w-4 h-4" />
                  Входной опросник
                </div>
                <h2 className="text-2xl font-bold mb-2">
                  {placementResult ? 'Опросник пройден — можно переходить к модулям' : 'Пройдите входной опросник перед началом модуля'}
                </h2>
                <p className="text-gray-600 max-w-3xl">
                  Ответы начисляют баллы модулям: основной модуль получает баллы за реальные учебные потребности, а моковый модуль — за демо-варианты. После опросника модули и рекомендации меняют порядок по скору.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setShowPlacementTest(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  {placementResult ? 'Пройти заново' : 'Начать опросник'}
                </button>
                {placementResult && (
                  <button
                    type="button"
                    onClick={restartPlacement}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:border-gray-300"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Сбросить результат
                  </button>
                )}
              </div>
            </div>

            {placementResult && recommendedModules.length > 0 && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
                {recommendedModules.map(({ module, score }, index) => (
                  <Link
                    key={module.id}
                    to={`${routePrefix || '/'}#module-${module.id}`}
                    className="rounded-2xl border border-gray-200 p-4 hover:border-blue-200 hover:bg-blue-50 transition-colors"
                  >
                    <div className="text-sm text-blue-700 mb-2">#{index + 1} · скор модуля: {score}</div>
                    <div className="font-semibold text-gray-900">{module.title}</div>
                    <div className="text-sm text-gray-500 mt-1">{module.topics.length} тем · {countLessonsInModule(module)} уроков</div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-2xl border border-gray-200">
            <div className="text-3xl font-bold text-blue-600 mb-2">{stats.modules}</div>
            <div className="font-semibold mb-1">Модулей</div>
            <p className="text-gray-600 text-sm">{isAdmin ? 'Редактируются отдельно и могут менять порядок' : 'Пошаговая структура обучения'}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-200">
            <div className="text-3xl font-bold text-blue-600 mb-2">{stats.topics}</div>
            <div className="font-semibold mb-1">Тем</div>
            <p className="text-gray-600 text-sm">Каждая тема лежит внутри своего модуля</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-200">
            <div className="text-3xl font-bold text-blue-600 mb-2">{stats.lessons}</div>
            <div className="font-semibold mb-1">Уроков</div>
            <p className="text-gray-600 text-sm">{isAdmin ? 'Уроки можно дополнять материалами и опросниками' : 'Видео, материалы и задания в одном месте'}</p>
          </div>
        </div>

        <div className="space-y-10">
          {sortedModules.map((module) => (
            <section id={`module-${module.id}`} key={module.id} className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-sm scroll-mt-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm mb-3">
                    <Layers3 className="w-4 h-4" />
                    Модуль {module.id}
                    {placementResult && (
                      <span className="ml-1 text-blue-600">· скор: {placementResult.scoresByModuleId[module.id] ?? 0}</span>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold mb-2">{module.title}</h2>
                  <p className="text-gray-600 max-w-3xl">{module.description}</p>
                </div>

                <div className="bg-gray-50 rounded-2xl px-4 py-3 text-sm text-gray-600 min-w-[220px]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center gap-2">
                      <BookOpen className="w-4 h-4" /> Темы
                    </span>
                    <strong>{module.topics.length}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Уроки в модуле</span>
                    <strong>{countLessonsInModule(module)}</strong>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {module.topics.map((topic) => (
                  <TopicCard
                    key={`${module.id}-${topic.id}`}
                    moduleId={module.id}
                    id={topic.id}
                    title={topic.title}
                    description={topic.description}
                    lessonsCount={topic.lessons.length}
                    version={version}
                  />
                ))}
              </div>

              {module.topics.length === 0 && (
                <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
                  {isAdmin ? 'В этом модуле пока нет тем. Добавь их в редакторе курса.' : 'В этом модуле пока нет тем.'}
                </div>
              )}
            </section>
          ))}

          {sortedModules.length === 0 && (
            <section className="bg-white border border-dashed border-gray-300 rounded-3xl p-8 md:p-10 text-center shadow-sm">
              <h2 className="text-2xl font-bold mb-2">Курсов пока нет</h2>
              <p className="text-gray-600">
                {isAdmin
                  ? 'Добавьте первый модуль в редакторе курса или импортируйте JSON с готовой структурой.'
                  : 'Материалы появятся здесь после настройки курса администратором.'}
              </p>
              {isAdmin && (
                <Link
                  to={editorPath}
                  className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  <PencilLine className="w-4 h-4" />
                  Открыть редактор
                </Link>
              )}
            </section>
          )}
        </div>

        {isAdmin && (
          <div className="mt-12 text-center">
            <Link to={editorPath} className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
              Перейти в редактор курса
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}

export function AdminHome() {
  return <CourseHome version="admin" />;
}

export default CourseHome;
