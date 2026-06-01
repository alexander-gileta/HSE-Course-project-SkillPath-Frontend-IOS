
import {
  ButtonHTMLAttributes,
  ChangeEvent,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Link } from 'react-router';
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  BookOpen,
  CircleHelp,
  ClipboardList,
  CopyPlus,
  Download,
  FilePlus2,
  FolderPlus,
  Layers3,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Upload,
} from 'lucide-react';
import { Course, Lesson, Module, PlacementAnswer, PlacementQuestion, PlacementTest, Resource, SurveyQuestion, SurveyQuestionType, Topic } from '../data/courseData';
import { getCourseStats } from '../data/courseQueries';
import { exportCourseData, importCourseData } from '../data/courseStore';
import { useCourseData } from '../hooks/useCourseData';

type Selection =
  | { type: 'course' }
  | { type: 'module'; moduleId: number }
  | { type: 'topic'; moduleId: number; topicId: number }
  | { type: 'lesson'; moduleId: number; topicId: number; lessonId: number };

const QUESTION_TYPE_OPTIONS: Array<{ value: SurveyQuestionType; label: string; hint: string }> = [
  { value: 'short_text', label: 'Короткий текст', hint: 'Однострочный ответ' },
  { value: 'long_text', label: 'Длинный текст', hint: 'Развёрнутый ответ без правильного варианта' },
  { value: 'single_choice', label: 'Один вариант', hint: 'Выбор одного ответа из списка' },
  { value: 'multiple_choice', label: 'Несколько вариантов', hint: 'Можно выбрать несколько ответов' },
  { value: 'scale_1_5', label: 'Шкала 1–5', hint: 'Оценка по пятибалльной шкале' },
  { value: 'yes_no', label: 'Да / Нет', hint: 'Бинарный вопрос' },
];

function getNextId(items: Array<{ id: number }>) {
  return items.reduce((maxId, item) => Math.max(maxId, item.id), 0) + 1;
}

function questionSupportsOptions(type: SurveyQuestionType) {
  return type === 'single_choice' || type === 'multiple_choice';
}

function createEmptyModule(id: number): Module {
  return {
    id,
    title: `Новый модуль ${id}`,
    description: 'Кратко опишите цель модуля',
    topics: [],
  };
}

function createEmptyTopic(id: number): Topic {
  return {
    id,
    title: `Новая тема ${id}`,
    description: 'О чём эта тема',
    lessons: [],
  };
}

function createEmptyLesson(id: number): Lesson {
  return {
    id,
    title: `Новый урок ${id}`,
    description: 'Краткое описание урока',
    longread: '',
    resources: [],
  };
}

function createEmptySurveyQuestion(id: number, type: SurveyQuestionType): SurveyQuestion {
  return {
    id,
    type,
    title: 'Новый вопрос',
    description: '',
    ...(questionSupportsOptions(type)
      ? {
          options: ['Вариант 1', 'Вариант 2'],
        }
      : {}),
  };
}


function createEmptyPlacementAnswer(id: number, moduleId: number): PlacementAnswer {
  return {
    id,
    title: `Вариант ${id}`,
    moduleId,
    score: 1,
  };
}

function createEmptyPlacementQuestion(id: number, moduleId: number): PlacementQuestion {
  return {
    id,
    title: `Вопрос ${id}`,
    description: '',
    answers: [createEmptyPlacementAnswer(1, moduleId), createEmptyPlacementAnswer(2, moduleId)],
  };
}

function createEmptyPlacementTest(id: number, moduleId: number): PlacementTest {
  return {
    id,
    title: `Входной тест ${id}`,
    description: 'Помогает определить рекомендованный порядок тем для ученика.',
    questions: [createEmptyPlacementQuestion(1, moduleId)],
  };
}

function normalizeQuestionByType(question: SurveyQuestion, type: SurveyQuestionType): SurveyQuestion {
  return {
    ...question,
    type,
    ...(questionSupportsOptions(type)
      ? { options: question.options && question.options.length >= 2 ? question.options : ['Вариант 1', 'Вариант 2'] }
      : { options: undefined }),
  };
}

function moveItem<T>(items: T[], fromIndex: number, direction: 'up' | 'down') {
  const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;

  if (toIndex < 0 || toIndex >= items.length) {
    return items;
  }

  const nextItems = [...items];
  const [item] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, item);
  return nextItems;
}

function replaceModule(course: Course, moduleId: number, updater: (module: Module) => Module) {
  return {
    ...course,
    modules: course.modules.map((module) => (module.id === moduleId ? updater(module) : module)),
  };
}

function replaceTopic(course: Course, moduleId: number, topicId: number, updater: (topic: Topic) => Topic) {
  return replaceModule(course, moduleId, (module) => ({
    ...module,
    topics: module.topics.map((topic) => (topic.id === topicId ? updater(topic) : topic)),
  }));
}

function replaceLesson(
  course: Course,
  moduleId: number,
  topicId: number,
  lessonId: number,
  updater: (lesson: Lesson) => Lesson,
) {
  return replaceTopic(course, moduleId, topicId, (topic) => ({
    ...topic,
    lessons: topic.lessons.map((lesson) => (lesson.id === lessonId ? updater(lesson) : lesson)),
  }));
}

function findSelectedEntities(course: Course, selection: Selection) {
  const module = selection.type !== 'course'
    ? course.modules.find((currentModule) => currentModule.id === selection.moduleId)
    : undefined;

  const topic = selection.type === 'topic' || selection.type === 'lesson'
    ? module?.topics.find((currentTopic) => currentTopic.id === selection.topicId)
    : undefined;

  const lesson = selection.type === 'lesson'
    ? topic?.lessons.find((currentLesson) => currentLesson.id === selection.lessonId)
    : undefined;

  return { module, topic, lesson };
}

function getSelectionLabel(course: Course, selection: Selection) {
  const { module, topic, lesson } = findSelectedEntities(course, selection);

  switch (selection.type) {
    case 'course':
      return 'Курс';
    case 'module':
      return module?.title ?? 'Модуль';
    case 'topic':
      return topic?.title ?? 'Тема';
    case 'lesson':
      return lesson?.title ?? 'Урок';
  }
}

function isSameSelection(left: Selection, right: Selection) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block space-y-2">
      <div>
        <div className="font-medium text-gray-900">{label}</div>
        {hint && <div className="text-sm text-gray-500 mt-1">{hint}</div>}
      </div>
      {children}
    </label>
  );
}

function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${props.className ?? ''}`}
    />
  );
}

function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${props.className ?? ''}`}
    />
  );
}

function GhostButton({ children, className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

function PrimaryButton({ children, className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

function SidebarItem({
  active,
  onClick,
  icon,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl border px-4 py-3 transition-all ${
        active ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-transparent hover:border-gray-200 hover:bg-gray-50'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${active ? 'text-blue-600' : 'text-gray-500'}`}>{icon}</div>
        <div className="min-w-0">
          <div className="font-medium text-gray-900 truncate">{title}</div>
          {subtitle && <div className="text-sm text-gray-500 truncate">{subtitle}</div>}
        </div>
      </div>
    </button>
  );
}

function SectionCard({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>
      {children}
    </section>
  );
}

export default function EditorPage() {
  const { course, updateCourse, restoreDefaults } = useCourseData();
  const [selection, setSelection] = useState<Selection>({ type: 'course' });
  const [importError, setImportError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const stats = getCourseStats(course);
  const { module, topic, lesson } = useMemo(() => findSelectedEntities(course, selection), [course, selection]);

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const importedCourse = await importCourseData(file);
      updateCourse(importedCourse);
      setSelection({ type: 'course' });
      setImportError('');
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Не удалось импортировать файл');
    } finally {
      event.target.value = '';
    }
  };

  const addModule = () => {
    let nextSelection: Selection = { type: 'course' };

    updateCourse((previous) => {
      const nextModule = createEmptyModule(getNextId(previous.modules));
      nextSelection = { type: 'module', moduleId: nextModule.id };
      return {
        ...previous,
        modules: [...previous.modules, nextModule],
      };
    });

    setSelection(nextSelection);
  };

  const addTopic = (moduleId: number) => {
    let nextSelection: Selection = { type: 'module', moduleId };

    updateCourse((previous) => {
      const currentModule = previous.modules.find((item) => item.id === moduleId);
      if (!currentModule) return previous;

      const nextTopic = createEmptyTopic(getNextId(currentModule.topics));
      nextSelection = { type: 'topic', moduleId, topicId: nextTopic.id };

      return replaceModule(previous, moduleId, (current) => ({
        ...current,
        topics: [...current.topics, nextTopic],
      }));
    });

    setSelection(nextSelection);
  };

  const addLesson = (moduleId: number, topicId: number) => {
    let nextSelection: Selection = { type: 'topic', moduleId, topicId };

    updateCourse((previous) => {
      const currentTopic = previous.modules
        .find((item) => item.id === moduleId)
        ?.topics.find((item) => item.id === topicId);

      if (!currentTopic) return previous;

      const nextLesson = createEmptyLesson(getNextId(currentTopic.lessons));
      nextSelection = { type: 'lesson', moduleId, topicId, lessonId: nextLesson.id };

      return replaceTopic(previous, moduleId, topicId, (current) => ({
        ...current,
        lessons: [...current.lessons, nextLesson],
      }));
    });

    setSelection(nextSelection);
  };

  const duplicateLesson = () => {
    if (selection.type !== 'lesson') return;

    let nextSelection = selection;

    updateCourse((previous) => {
      const currentTopic = previous.modules
        .find((item) => item.id === selection.moduleId)
        ?.topics.find((item) => item.id === selection.topicId);
      const currentLesson = currentTopic?.lessons.find((item) => item.id === selection.lessonId);

      if (!currentTopic || !currentLesson) return previous;

      const duplicatedLesson: Lesson = {
        ...JSON.parse(JSON.stringify(currentLesson)),
        id: getNextId(currentTopic.lessons),
        title: `${currentLesson.title} (копия)`,
      };
      nextSelection = {
        type: 'lesson',
        moduleId: selection.moduleId,
        topicId: selection.topicId,
        lessonId: duplicatedLesson.id,
      };

      return replaceTopic(previous, selection.moduleId, selection.topicId, (current) => ({
        ...current,
        lessons: [...current.lessons, duplicatedLesson],
      }));
    });

    setSelection(nextSelection);
  };

  const deleteSelection = () => {
    if (selection.type === 'course') return;

    if (selection.type === 'module') {
      updateCourse((previous) => ({
        ...previous,
        modules: previous.modules.filter((item) => item.id !== selection.moduleId),
      }));
      setSelection({ type: 'course' });
      return;
    }

    if (selection.type === 'topic') {
      updateCourse((previous) => replaceModule(previous, selection.moduleId, (currentModule) => ({
        ...currentModule,
        topics: currentModule.topics.filter((item) => item.id !== selection.topicId),
      })));
      setSelection({ type: 'module', moduleId: selection.moduleId });
      return;
    }

    updateCourse((previous) => replaceTopic(previous, selection.moduleId, selection.topicId, (currentTopic) => ({
      ...currentTopic,
      lessons: currentTopic.lessons.filter((item) => item.id !== selection.lessonId),
    })));
    setSelection({ type: 'topic', moduleId: selection.moduleId, topicId: selection.topicId });
  };

  const moveSelection = (direction: 'up' | 'down') => {
    if (selection.type === 'course') return;

    if (selection.type === 'module') {
      updateCourse((previous) => {
        const index = previous.modules.findIndex((item) => item.id === selection.moduleId);
        return {
          ...previous,
          modules: moveItem(previous.modules, index, direction),
        };
      });
      return;
    }

    if (selection.type === 'topic') {
      updateCourse((previous) => replaceModule(previous, selection.moduleId, (currentModule) => {
        const index = currentModule.topics.findIndex((item) => item.id === selection.topicId);
        return {
          ...currentModule,
          topics: moveItem(currentModule.topics, index, direction),
        };
      }));
      return;
    }

    updateCourse((previous) => replaceTopic(previous, selection.moduleId, selection.topicId, (currentTopic) => {
      const index = currentTopic.lessons.findIndex((item) => item.id === selection.lessonId);
      return {
        ...currentTopic,
        lessons: moveItem(currentTopic.lessons, index, direction),
      };
    }));
  };

  const updateCourseField = (field: 'title' | 'description', value: string) => {
    updateCourse((previous) => ({ ...previous, [field]: value }));
  };

  const updateBenefits = (value: string) => {
    updateCourse((previous) => ({
      ...previous,
      benefits: value
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
    }));
  };


  const addPlacementTest = () => {
    updateCourse((previous) => {
      const currentTests = previous.placementTests ?? [];
      const fallbackModuleId = previous.modules[0]?.id ?? 1;

      return {
        ...previous,
        placementTests: [...currentTests, createEmptyPlacementTest(getNextId(currentTests), fallbackModuleId)],
      };
    });
  };

  const updatePlacementTest = (testIndex: number, updater: (test: PlacementTest) => PlacementTest) => {
    updateCourse((previous) => ({
      ...previous,
      placementTests: (previous.placementTests ?? []).map((test, index) => (
        index === testIndex ? updater(test) : test
      )),
    }));
  };

  const removePlacementTest = (testIndex: number) => {
    updateCourse((previous) => ({
      ...previous,
      placementTests: (previous.placementTests ?? []).filter((_, index) => index !== testIndex),
    }));
  };

  const addPlacementQuestion = (testIndex: number) => {
    updatePlacementTest(testIndex, (test) => ({
      ...test,
      questions: [
        ...test.questions,
        createEmptyPlacementQuestion(getNextId(test.questions), course.modules[0]?.id ?? 1),
      ],
    }));
  };

  const updatePlacementQuestion = (
    testIndex: number,
    questionIndex: number,
    updater: (question: PlacementQuestion) => PlacementQuestion,
  ) => {
    updatePlacementTest(testIndex, (test) => ({
      ...test,
      questions: test.questions.map((question, index) => (
        index === questionIndex ? updater(question) : question
      )),
    }));
  };

  const removePlacementQuestion = (testIndex: number, questionIndex: number) => {
    updatePlacementTest(testIndex, (test) => ({
      ...test,
      questions: test.questions.filter((_, index) => index !== questionIndex),
    }));
  };

  const addPlacementAnswer = (testIndex: number, questionIndex: number) => {
    updatePlacementQuestion(testIndex, questionIndex, (question) => ({
      ...question,
      answers: [
        ...question.answers,
        createEmptyPlacementAnswer(getNextId(question.answers), course.modules[0]?.id ?? 1),
      ],
    }));
  };

  const updatePlacementAnswer = (
    testIndex: number,
    questionIndex: number,
    answerIndex: number,
    updater: (answer: PlacementAnswer) => PlacementAnswer,
  ) => {
    updatePlacementQuestion(testIndex, questionIndex, (question) => ({
      ...question,
      answers: question.answers.map((answer, index) => (
        index === answerIndex ? updater(answer) : answer
      )),
    }));
  };

  const removePlacementAnswer = (testIndex: number, questionIndex: number, answerIndex: number) => {
    updatePlacementQuestion(testIndex, questionIndex, (question) => ({
      ...question,
      answers: question.answers.filter((_, index) => index !== answerIndex),
    }));
  };

  const updateModuleField = (field: keyof Pick<Module, 'title' | 'description'>, value: string) => {
    if (!module) return;
    updateCourse((previous) => replaceModule(previous, module.id, (current) => ({ ...current, [field]: value })));
  };

  const updateTopicField = (field: keyof Pick<Topic, 'title' | 'description'>, value: string) => {
    if (!module || !topic) return;
    updateCourse((previous) => replaceTopic(previous, module.id, topic.id, (current) => ({ ...current, [field]: value })));
  };

  const updateLessonField = (
    field: keyof Pick<Lesson, 'title' | 'description' | 'videoUrl' | 'presentationUrl' | 'pdfUrl' | 'longread'>,
    value: string,
  ) => {
    if (!module || !topic || !lesson) return;
    updateCourse((previous) => replaceLesson(previous, module.id, topic.id, lesson.id, (current) => ({
      ...current,
      [field]: value,
    })));
  };

  const updateLessonResources = (resources: Resource[]) => {
    if (!module || !topic || !lesson) return;
    updateCourse((previous) => replaceLesson(previous, module.id, topic.id, lesson.id, (current) => ({
      ...current,
      resources,
    })));
  };

  const toggleSurvey = () => {
    if (!module || !topic || !lesson) return;
    updateCourse((previous) => replaceLesson(previous, module.id, topic.id, lesson.id, (current) => ({
      ...current,
      survey: current.survey
        ? undefined
        : {
            title: 'Опросник урока',
            description: '',
            questions: [createEmptySurveyQuestion(1, 'short_text')],
          },
    })));
  };

  const updateSurveyField = (field: 'title' | 'description', value: string) => {
    if (!module || !topic || !lesson) return;
    updateCourse((previous) => replaceLesson(previous, module.id, topic.id, lesson.id, (current) => ({
      ...current,
      survey: {
        title: current.survey?.title ?? 'Опросник урока',
        description: current.survey?.description ?? '',
        questions: current.survey?.questions ?? [],
        [field]: value,
      },
    })));
  };

  const updateSurveyQuestion = (questionIndex: number, updater: (question: SurveyQuestion) => SurveyQuestion) => {
    if (!module || !topic || !lesson) return;
    updateCourse((previous) => replaceLesson(previous, module.id, topic.id, lesson.id, (current) => ({
      ...current,
      survey: {
        title: current.survey?.title ?? 'Опросник урока',
        description: current.survey?.description ?? '',
        questions: (current.survey?.questions ?? []).map((question, index) => (
          index === questionIndex ? updater(question) : question
        )),
      },
    })));
  };

  const addSurveyQuestion = (type: SurveyQuestionType) => {
    if (!module || !topic || !lesson) return;
    updateCourse((previous) => replaceLesson(previous, module.id, topic.id, lesson.id, (current) => {
      const currentQuestions = current.survey?.questions ?? [];
      const nextQuestion = createEmptySurveyQuestion(getNextId(currentQuestions), type);

      return {
        ...current,
        survey: {
          title: current.survey?.title ?? 'Опросник урока',
          description: current.survey?.description ?? '',
          questions: [...currentQuestions, nextQuestion],
        },
      };
    }));
  };

  const removeSurveyQuestion = (questionIndex: number) => {
    if (!module || !topic || !lesson) return;
    updateCourse((previous) => replaceLesson(previous, module.id, topic.id, lesson.id, (current) => ({
      ...current,
      survey: {
        title: current.survey?.title ?? 'Опросник урока',
        description: current.survey?.description ?? '',
        questions: (current.survey?.questions ?? []).filter((_, index) => index !== questionIndex),
      },
    })));
  };

  const resetEditor = () => {
    restoreDefaults();
    setSelection({ type: 'course' });
    setImportError('');
  };

  const actionTargetLabel = getSelectionLabel(course, selection);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <Link to="/admin" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3">
              <ArrowLeft className="w-4 h-4" />
              Назад к админ-версии курса
            </Link>
            <h1 className="text-3xl font-bold">Редактор курса</h1>
            <p className="text-gray-600 mt-2">
              Автосохранение включено. Здесь можно управлять структурой курса: модули → темы → уроки.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <GhostButton type="button" onClick={() => exportCourseData(course)}>
              <Download className="w-4 h-4" />
              Экспорт JSON
            </GhostButton>
            <GhostButton type="button" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4" />
              Импорт JSON
            </GhostButton>
            <GhostButton type="button" onClick={resetEditor}>
              <RotateCcw className="w-4 h-4" />
              Сбросить к шаблону
            </GhostButton>
            <PrimaryButton type="button" disabled>
              <Save className="w-4 h-4" />
              Сохранено автоматически
            </PrimaryButton>
            <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImport} />
          </div>
        </div>

        {importError && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{importError}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="text-sm text-gray-500 mb-1">Модулей</div>
            <div className="text-3xl font-bold text-blue-600">{stats.modules}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="text-sm text-gray-500 mb-1">Тем</div>
            <div className="text-3xl font-bold text-blue-600">{stats.topics}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="text-sm text-gray-500 mb-1">Уроков</div>
            <div className="text-3xl font-bold text-blue-600">{stats.lessons}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[340px_minmax(0,1fr)] gap-6 items-start">
          <aside className="bg-white border border-gray-200 rounded-3xl p-4 shadow-sm xl:sticky xl:top-4">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <div className="font-semibold">Структура курса</div>
                <div className="text-sm text-gray-500">Выбери объект и редактируй его справа</div>
              </div>
              <GhostButton type="button" onClick={addModule} className="px-3">
                <Plus className="w-4 h-4" />
              </GhostButton>
            </div>

            <div className="space-y-2 max-h-[70vh] overflow-auto pr-1">
              <SidebarItem
                active={selection.type === 'course'}
                onClick={() => setSelection({ type: 'course' })}
                icon={<Layers3 className="w-4 h-4" />}
                title={course.title}
                subtitle="Общие настройки курса"
              />

              {course.modules.map((currentModule) => (
                <div key={currentModule.id} className="space-y-2">
                  <SidebarItem
                    active={isSameSelection(selection, { type: 'module', moduleId: currentModule.id })}
                    onClick={() => setSelection({ type: 'module', moduleId: currentModule.id })}
                    icon={<Layers3 className="w-4 h-4" />}
                    title={currentModule.title}
                    subtitle={`${currentModule.topics.length} тем`}
                  />

                  <div className="ml-4 border-l border-gray-100 pl-3 space-y-2">
                    {currentModule.topics.map((currentTopic) => (
                      <div key={currentTopic.id} className="space-y-2">
                        <SidebarItem
                          active={isSameSelection(selection, {
                            type: 'topic',
                            moduleId: currentModule.id,
                            topicId: currentTopic.id,
                          })}
                          onClick={() => setSelection({ type: 'topic', moduleId: currentModule.id, topicId: currentTopic.id })}
                          icon={<BookOpen className="w-4 h-4" />}
                          title={currentTopic.title}
                          subtitle={`${currentTopic.lessons.length} уроков`}
                        />

                        <div className="ml-4 border-l border-gray-100 pl-3 space-y-2">
                          {currentTopic.lessons.map((currentLesson) => (
                            <SidebarItem
                              key={currentLesson.id}
                              active={isSameSelection(selection, {
                                type: 'lesson',
                                moduleId: currentModule.id,
                                topicId: currentTopic.id,
                                lessonId: currentLesson.id,
                              })}
                              onClick={() => setSelection({
                                type: 'lesson',
                                moduleId: currentModule.id,
                                topicId: currentTopic.id,
                                lessonId: currentLesson.id,
                              })}
                              icon={<CircleHelp className="w-4 h-4" />}
                              title={currentLesson.title}
                              subtitle={currentLesson.survey ? `Урок • ${currentLesson.survey.questions.length} вопросов` : 'Урок'}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          <div className="space-y-6">
            <SectionCard
              title={`Сейчас редактируется: ${actionTargetLabel}`}
              description="Изменения сохраняются в браузере сразу после ввода. Порядок элементов можно менять кнопками ниже."
            >
              <div className="flex flex-wrap gap-2">
                <PrimaryButton type="button" onClick={addModule}>
                  <FolderPlus className="w-4 h-4" />
                  Добавить модуль
                </PrimaryButton>

                {selection.type === 'module' && (
                  <PrimaryButton type="button" onClick={() => addTopic(selection.moduleId)}>
                    <FilePlus2 className="w-4 h-4" />
                    Добавить тему
                  </PrimaryButton>
                )}

                {(selection.type === 'topic' || selection.type === 'lesson') && (
                  <PrimaryButton type="button" onClick={() => addLesson(selection.moduleId, selection.topicId)}>
                    <Plus className="w-4 h-4" />
                    Добавить урок
                  </PrimaryButton>
                )}

                {selection.type === 'lesson' && (
                  <GhostButton type="button" onClick={duplicateLesson}>
                    <CopyPlus className="w-4 h-4" />
                    Дублировать урок
                  </GhostButton>
                )}

                {selection.type !== 'course' && (
                  <>
                    <GhostButton type="button" onClick={() => moveSelection('up')}>
                      <ArrowUp className="w-4 h-4" />
                      Выше
                    </GhostButton>
                    <GhostButton type="button" onClick={() => moveSelection('down')}>
                      <ArrowDown className="w-4 h-4" />
                      Ниже
                    </GhostButton>
                    <GhostButton type="button" onClick={deleteSelection} className="text-red-600 border-red-200 hover:border-red-300">
                      <Trash2 className="w-4 h-4" />
                      Удалить
                    </GhostButton>
                  </>
                )}
              </div>
            </SectionCard>

            {selection.type === 'course' && (
              <>
                <SectionCard title="Настройки курса" description="Название, описание и ключевые преимущества на главной странице.">
                  <div className="grid grid-cols-1 gap-4">
                    <Field label="Название курса">
                      <Input value={course.title} onChange={(event) => updateCourseField('title', event.target.value)} />
                    </Field>

                    <Field label="Описание курса">
                      <Textarea rows={4} value={course.description} onChange={(event) => updateCourseField('description', event.target.value)} />
                    </Field>

                    <Field label="Преимущества курса" hint="По одному преимуществу на строку.">
                      <Textarea
                        rows={5}
                        value={course.benefits.join('\n')}
                        onChange={(event) => updateBenefits(event.target.value)}
                      />
                    </Field>
                  </div>
                </SectionCard>

                <SectionCard
                  title="Входные интерактивные тесты"
                  description="Эти тесты показываются ученику при первом запуске. Каждый вариант ответа добавляет скор к выбранному модулю, а темы из модулей с большим скором поднимаются выше."
                >
                  <div className="flex flex-wrap gap-2">
                    <PrimaryButton type="button" onClick={addPlacementTest} disabled={course.modules.length === 0}>
                      <ClipboardList className="w-4 h-4" />
                      Добавить тест
                    </PrimaryButton>
                  </div>

                  {course.modules.length === 0 && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                      Чтобы назначать скор, сначала добавьте хотя бы один модуль курса.
                    </div>
                  )}

                  <div className="space-y-6">
                    {(course.placementTests ?? []).map((test, testIndex) => (
                      <div key={test.id} className="rounded-3xl border border-gray-200 p-4 md:p-5 space-y-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold text-gray-900">Тест {testIndex + 1}</div>
                            <div className="text-sm text-gray-500">{test.questions.length} вопросов</div>
                          </div>
                          <GhostButton
                            type="button"
                            onClick={() => removePlacementTest(testIndex)}
                            className="text-red-600 border-red-200 hover:border-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                            Удалить тест
                          </GhostButton>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                          <Field label="Название теста">
                            <Input
                              value={test.title}
                              onChange={(event) => updatePlacementTest(testIndex, (current) => ({
                                ...current,
                                title: event.target.value,
                              }))}
                            />
                          </Field>
                          <Field label="Описание теста">
                            <Textarea
                              rows={3}
                              value={test.description ?? ''}
                              onChange={(event) => updatePlacementTest(testIndex, (current) => ({
                                ...current,
                                description: event.target.value,
                              }))}
                            />
                          </Field>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="font-medium text-gray-900">Вопросы теста</div>
                            <GhostButton type="button" onClick={() => addPlacementQuestion(testIndex)}>
                              <Plus className="w-4 h-4" />
                              Добавить вопрос
                            </GhostButton>
                          </div>

                          {test.questions.map((question, questionIndex) => (
                            <div key={question.id} className="rounded-2xl border border-gray-200 p-4 space-y-4 bg-gray-50/50">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="font-medium text-gray-900">Вопрос {questionIndex + 1}</div>
                                  <div className="text-sm text-gray-500">{question.answers.length} вариантов ответа</div>
                                </div>
                                <GhostButton
                                  type="button"
                                  onClick={() => removePlacementQuestion(testIndex, questionIndex)}
                                  className="text-red-600 border-red-200 hover:border-red-300"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </GhostButton>
                              </div>

                              <Field label="Текст вопроса">
                                <Textarea
                                  rows={2}
                                  value={question.title}
                                  onChange={(event) => updatePlacementQuestion(testIndex, questionIndex, (current) => ({
                                    ...current,
                                    title: event.target.value,
                                  }))}
                                />
                              </Field>

                              <Field label="Подсказка или описание" hint="Необязательно. Показывается под вопросом в тесте.">
                                <Input
                                  value={question.description ?? ''}
                                  onChange={(event) => updatePlacementQuestion(testIndex, questionIndex, (current) => ({
                                    ...current,
                                    description: event.target.value,
                                  }))}
                                />
                              </Field>

                              <div className="space-y-3">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="font-medium text-gray-900">Варианты и скоринг</div>
                                  <GhostButton type="button" onClick={() => addPlacementAnswer(testIndex, questionIndex)}>
                                    <Plus className="w-4 h-4" />
                                    Добавить вариант
                                  </GhostButton>
                                </div>

                                {question.answers.map((answer, answerIndex) => (
                                  <div
                                    key={answer.id}
                                    className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_220px_120px_auto] gap-3 items-start rounded-2xl border border-gray-200 bg-white p-3"
                                  >
                                    <Input
                                      value={answer.title}
                                      onChange={(event) => updatePlacementAnswer(testIndex, questionIndex, answerIndex, (current) => ({
                                        ...current,
                                        title: event.target.value,
                                      }))}
                                      placeholder={`Вариант ${answerIndex + 1}`}
                                    />

                                    <select
                                      value={answer.moduleId}
                                      onChange={(event) => updatePlacementAnswer(testIndex, questionIndex, answerIndex, (current) => ({
                                        ...current,
                                        moduleId: Number(event.target.value),
                                      }))}
                                      className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    >
                                      {course.modules.map((currentModule) => (
                                        <option key={currentModule.id} value={currentModule.id}>
                                          {currentModule.title}
                                        </option>
                                      ))}
                                    </select>

                                    <Input
                                      type="number"
                                      min={0}
                                      value={answer.score}
                                      onChange={(event) => updatePlacementAnswer(testIndex, questionIndex, answerIndex, (current) => ({
                                        ...current,
                                        score: Number(event.target.value),
                                      }))}
                                      placeholder="Скор"
                                    />

                                    <GhostButton
                                      type="button"
                                      onClick={() => removePlacementAnswer(testIndex, questionIndex, answerIndex)}
                                      disabled={question.answers.length <= 2}
                                      className="text-red-600 border-red-200 hover:border-red-300"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </GhostButton>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}

                          {test.questions.length === 0 && (
                            <div className="rounded-2xl border border-dashed border-gray-300 p-6 text-center text-gray-500">
                              В тесте пока нет вопросов. Добавьте первый вопрос.
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {(course.placementTests ?? []).length === 0 && (
                      <div className="rounded-2xl border border-dashed border-gray-300 p-6 text-center text-gray-500">
                        Входных тестов пока нет. Добавьте тест, чтобы персонализировать порядок тем при первом запуске.
                      </div>
                    )}
                  </div>
                </SectionCard>
              </>
            )}


            {selection.type === 'module' && module && (
              <SectionCard title="Настройки модуля" description="Модуль группирует темы и задаёт верхний уровень навигации.">
                <div className="grid grid-cols-1 gap-4">
                  <Field label="Название модуля">
                    <Input value={module.title} onChange={(event) => updateModuleField('title', event.target.value)} />
                  </Field>
                  <Field label="Описание модуля">
                    <Textarea rows={4} value={module.description} onChange={(event) => updateModuleField('description', event.target.value)} />
                  </Field>
                </div>
              </SectionCard>
            )}

            {selection.type === 'topic' && module && topic && (
              <>
                <SectionCard title="Настройки темы" description="Тема открывается внутри модуля и содержит список уроков.">
                  <div className="grid grid-cols-1 gap-4">
                    <Field label="Название темы">
                      <Input value={topic.title} onChange={(event) => updateTopicField('title', event.target.value)} />
                    </Field>
                    <Field label="Описание темы">
                      <Textarea rows={4} value={topic.description} onChange={(event) => updateTopicField('description', event.target.value)} />
                    </Field>
                  </div>
                </SectionCard>

                <SectionCard title="Быстрый переход" description="Можно сразу открыть тему в режиме просмотра. ">
                  <Link
                    to={`/module/${module.id}/topic/${topic.id}`}
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Открыть тему в публичной версии
                  </Link>
                </SectionCard>
              </>
            )}

            {selection.type === 'lesson' && module && topic && lesson && (
              <>
                <SectionCard title="Основное по уроку" description="Базовые поля урока и ссылки на контент.">
                  <div className="grid grid-cols-1 gap-4">
                    <Field label="Название урока">
                      <Input value={lesson.title} onChange={(event) => updateLessonField('title', event.target.value)} />
                    </Field>
                    <Field label="Краткое описание">
                      <Textarea rows={3} value={lesson.description} onChange={(event) => updateLessonField('description', event.target.value)} />
                    </Field>
                    <Field label="Ссылка на видео" hint="Например, embed-ссылка YouTube.">
                      <Input value={lesson.videoUrl ?? ''} onChange={(event) => updateLessonField('videoUrl', event.target.value)} />
                    </Field>
                    <Field label="Ссылка на презентацию">
                      <Input value={lesson.presentationUrl ?? ''} onChange={(event) => updateLessonField('presentationUrl', event.target.value)} />
                    </Field>
                    <Field label="Ссылка на PDF">
                      <Input value={lesson.pdfUrl ?? ''} onChange={(event) => updateLessonField('pdfUrl', event.target.value)} />
                    </Field>
                  </div>
                </SectionCard>

                <SectionCard title="Лонгрид" description="Текстовый конспект урока. Можно использовать markdown. ">
                  <Textarea rows={16} value={lesson.longread ?? ''} onChange={(event) => updateLessonField('longread', event.target.value)} />
                </SectionCard>

                <SectionCard title="Материалы" description="Дополнительные ссылки и ресурсы для урока.">
                  <div className="space-y-4">
                    {(lesson.resources ?? []).map((resource, resourceIndex) => (
                      <div key={resourceIndex} className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_auto] gap-3 items-start">
                        <Input
                          value={resource.title}
                          onChange={(event) => {
                            const nextResources = [...(lesson.resources ?? [])];
                            nextResources[resourceIndex] = { ...resource, title: event.target.value };
                            updateLessonResources(nextResources);
                          }}
                          placeholder="Название ресурса"
                        />
                        <Input
                          value={resource.url}
                          onChange={(event) => {
                            const nextResources = [...(lesson.resources ?? [])];
                            nextResources[resourceIndex] = { ...resource, url: event.target.value };
                            updateLessonResources(nextResources);
                          }}
                          placeholder="https://..."
                        />
                        <GhostButton
                          type="button"
                          onClick={() => updateLessonResources((lesson.resources ?? []).filter((_, index) => index !== resourceIndex))}
                          className="text-red-600 border-red-200 hover:border-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </GhostButton>
                      </div>
                    ))}

                    <GhostButton
                      type="button"
                      onClick={() => updateLessonResources([...(lesson.resources ?? []), { title: 'Новый ресурс', url: '' }])}
                    >
                      <Plus className="w-4 h-4" />
                      Добавить ресурс
                    </GhostButton>
                  </div>
                </SectionCard>

                <SectionCard title="Опросник" description="Добавь к уроку редактируемый блок опроса без правильных ответов.">
                  <div className="flex flex-wrap gap-2 mb-4">
                    <PrimaryButton type="button" onClick={toggleSurvey}>
                      {lesson.survey ? 'Убрать опросник' : 'Добавить опросник'}
                    </PrimaryButton>
                  </div>

                  {lesson.survey && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 gap-4">
                        <Field label="Название опросника">
                          <Input value={lesson.survey.title} onChange={(event) => updateSurveyField('title', event.target.value)} />
                        </Field>
                        <Field label="Описание опросника">
                          <Textarea rows={3} value={lesson.survey.description ?? ''} onChange={(event) => updateSurveyField('description', event.target.value)} />
                        </Field>
                      </div>

                      <div>
                        <div className="font-medium text-gray-900 mb-3">Добавить вопрос</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                          {QUESTION_TYPE_OPTIONS.map((questionType) => (
                            <GhostButton
                              key={questionType.value}
                              type="button"
                              onClick={() => addSurveyQuestion(questionType.value)}
                              className="h-full items-start justify-start text-left py-3"
                            >
                              <div>
                                <div className="font-medium text-gray-900">{questionType.label}</div>
                                <div className="text-sm text-gray-500 mt-1">{questionType.hint}</div>
                              </div>
                            </GhostButton>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-6">
                        {lesson.survey.questions.map((question, questionIndex) => (
                          <div key={question.id} className="rounded-2xl border border-gray-200 p-4 space-y-4">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <div className="font-medium">Вопрос {questionIndex + 1}</div>
                                <div className="text-sm text-gray-500">
                                  {QUESTION_TYPE_OPTIONS.find((option) => option.value === question.type)?.label}
                                </div>
                              </div>
                              <GhostButton
                                type="button"
                                onClick={() => removeSurveyQuestion(questionIndex)}
                                className="text-red-600 border-red-200 hover:border-red-300"
                              >
                                <Trash2 className="w-4 h-4" />
                                Удалить
                              </GhostButton>
                            </div>

                            <Field label="Тип вопроса">
                              <select
                                value={question.type}
                                onChange={(event) => updateSurveyQuestion(questionIndex, (current) => normalizeQuestionByType(current, event.target.value as SurveyQuestionType))}
                                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                              >
                                {QUESTION_TYPE_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </Field>

                            <Field label="Текст вопроса">
                              <Textarea
                                rows={3}
                                value={question.title}
                                onChange={(event) => updateSurveyQuestion(questionIndex, (current) => ({
                                  ...current,
                                  title: event.target.value,
                                }))}
                              />
                            </Field>

                            <Field label="Подсказка или описание" hint="Необязательно. Можно пояснить, что именно ожидается от ответа.">
                              <Input
                                value={question.description ?? ''}
                                onChange={(event) => updateSurveyQuestion(questionIndex, (current) => ({
                                  ...current,
                                  description: event.target.value,
                                }))}
                              />
                            </Field>

                            {questionSupportsOptions(question.type) && (
                              <div className="space-y-3">
                                <div className="font-medium text-gray-900">Варианты ответа</div>
                                {(question.options ?? []).map((option, optionIndex) => (
                                  <div key={optionIndex} className="grid grid-cols-[1fr_auto] gap-3">
                                    <Input
                                      value={option}
                                      onChange={(event) => updateSurveyQuestion(questionIndex, (current) => ({
                                        ...current,
                                        options: (current.options ?? []).map((currentOption, index) => (
                                          index === optionIndex ? event.target.value : currentOption
                                        )),
                                      }))}
                                      placeholder={`Вариант ${optionIndex + 1}`}
                                    />
                                    <GhostButton
                                      type="button"
                                      onClick={() => updateSurveyQuestion(questionIndex, (current) => ({
                                        ...current,
                                        options: (current.options ?? []).filter((_, index) => index !== optionIndex),
                                      }))}
                                      className="text-red-600 border-red-200 hover:border-red-300"
                                      disabled={(question.options ?? []).length <= 2}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </GhostButton>
                                  </div>
                                ))}

                                <GhostButton
                                  type="button"
                                  onClick={() => updateSurveyQuestion(questionIndex, (current) => ({
                                    ...current,
                                    options: [...(current.options ?? []), `Вариант ${(current.options ?? []).length + 1}`],
                                  }))}
                                >
                                  <Plus className="w-4 h-4" />
                                  Добавить вариант
                                </GhostButton>
                              </div>
                            )}

                            {question.type === 'scale_1_5' && (
                              <div className="rounded-2xl bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-900">
                                В режиме просмотра студент увидит шкалу с вариантами от 1 до 5.
                              </div>
                            )}

                            {question.type === 'yes_no' && (
                              <div className="rounded-2xl bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-900">
                                В режиме просмотра студент увидит два варианта ответа: «Да» и «Нет».
                              </div>
                            )}
                          </div>
                        ))}

                        {lesson.survey.questions.length === 0 && (
                          <div className="rounded-2xl border border-dashed border-gray-300 p-6 text-center text-gray-500">
                            В опроснике пока нет вопросов. Добавь нужный тип вопроса выше.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </SectionCard>

                <SectionCard title="Быстрый переход" description="Можно сразу открыть урок в режиме просмотра. ">
                  <Link
                    to={`/module/${module.id}/topic/${topic.id}/lesson/${lesson.id}`}
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Открыть урок в публичной версии
                  </Link>
                </SectionCard>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
