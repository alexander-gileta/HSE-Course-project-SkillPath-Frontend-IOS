import { useParams, Link } from 'react-router';
import { ArrowLeft, BookOpen, PencilLine } from 'lucide-react';
import { LessonCard } from '../components/LessonCard';
import { useCourseData } from '../hooks/useCourseData';
import { findModule, findTopic } from '../data/courseQueries';

type SiteVersion = 'user' | 'admin';

interface TopicPageProps {
  version?: SiteVersion;
}

function CourseTopicPage({ version = 'user' }: TopicPageProps) {
  const isAdmin = version === 'admin';
  const routePrefix = isAdmin ? '/admin' : '';
  const homePath = isAdmin ? '/admin' : '/';
  const editorPath = '/admin/editor';

  const { moduleId, topicId } = useParams();
  const { course } = useCourseData();
  const parsedModuleId = Number(moduleId);
  const parsedTopicId = Number(topicId);
  const module = findModule(course, parsedModuleId);
  const topic = findTopic(course, parsedModuleId, parsedTopicId);

  if (!module || !topic) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Тема не найдена</h1>
          <Link to={homePath} className="text-blue-600 hover:underline">
            Вернуться на главную
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex flex-wrap items-center gap-4 justify-between mb-6">
          <Link to={homePath} className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4" />
            Вернуться к модулям
          </Link>

          {isAdmin && (
            <Link
              to={editorPath}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:border-gray-300"
            >
              <PencilLine className="w-4 h-4" />
              Открыть редактор
            </Link>
          )}
        </div>

        <div className="bg-white rounded-3xl border border-gray-200 p-8 mb-8 shadow-sm">
          <div className="text-sm text-blue-700 bg-blue-50 inline-flex px-3 py-1 rounded-full mb-4">
            {module.title}
          </div>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">{topic.title}</h1>
              <p className="text-gray-600 text-lg">{topic.description}</p>
              <div className="mt-4 text-sm text-gray-500">Всего уроков: {topic.lessons.length}</div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold mb-4">Уроки</h2>
          {topic.lessons.map((lesson) => (
            <LessonCard
              key={lesson.id}
              moduleId={module.id}
              topicId={topic.id}
              lessonId={lesson.id}
              title={lesson.title}
              description={lesson.description}
              hasSurvey={!!lesson.survey}
              version={version}
            />
          ))}

          {topic.lessons.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-500 bg-white">
              {isAdmin ? 'В этой теме пока нет уроков. Добавь их в редакторе курса.' : 'В этой теме пока нет уроков.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function AdminTopicPage() {
  return <CourseTopicPage version="admin" />;
}

export default CourseTopicPage;
