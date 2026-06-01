import { useParams, Link } from 'react-router';
import { ArrowLeft, Download, ChevronLeft, ChevronRight, PencilLine } from 'lucide-react';
import { VideoPlayer } from '../components/VideoPlayer';
import { ResourcesList } from '../components/ResourcesList';
import { SurveySection } from '../components/SurveySection';
import { LongreadSection } from '../components/LongreadSection';
import { useCourseData } from '../hooks/useCourseData';
import { findTopic } from '../data/courseQueries';

type SiteVersion = 'user' | 'admin';

interface LessonPageProps {
  version?: SiteVersion;
}

function CourseLessonPage({ version = 'user' }: LessonPageProps) {
  const isAdmin = version === 'admin';
  const routePrefix = isAdmin ? '/admin' : '';
  const homePath = isAdmin ? '/admin' : '/';
  const editorPath = '/admin/editor';

  const { moduleId, topicId, lessonId } = useParams();
  const { course } = useCourseData();

  const parsedModuleId = Number(moduleId);
  const parsedTopicId = Number(topicId);
  const parsedLessonId = Number(lessonId);

  const topic = findTopic(course, parsedModuleId, parsedTopicId);
  const lesson = topic?.lessons.find((currentLesson) => currentLesson.id === parsedLessonId);

  if (!topic || !lesson) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Урок не найден</h1>
          <Link to={homePath} className="text-blue-600 hover:underline">
            Вернуться на главную
          </Link>
        </div>
      </div>
    );
  }

  const currentLessonIndex = topic.lessons.findIndex((currentLesson) => currentLesson.id === lesson.id);
  const previousLesson = currentLessonIndex > 0 ? topic.lessons[currentLessonIndex - 1] : null;
  const nextLesson = currentLessonIndex < topic.lessons.length - 1 ? topic.lessons[currentLessonIndex + 1] : null;
  const topicPath = `${routePrefix}/module/${moduleId}/topic/${topicId}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <Link
            to={topicPath}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Вернуться к урокам
          </Link>

          {isAdmin && (
            <Link
              to={editorPath}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:border-gray-300"
            >
              <PencilLine className="w-4 h-4" />
              Редактировать курс
            </Link>
          )}
        </div>

        <div className="mb-6">
          <div className="text-sm text-gray-600 mb-2">{topic.title}</div>
          <h1 className="text-3xl font-bold mb-2">{lesson.title}</h1>
          <p className="text-gray-600">{lesson.description}</p>
        </div>

        {lesson.videoUrl && (
          <div className="mb-8">
            <VideoPlayer videoUrl={lesson.videoUrl} title={lesson.title} />
          </div>
        )}

        {(lesson.presentationUrl || lesson.pdfUrl) && (
          <div className="mb-8 flex gap-3 flex-wrap">
            {lesson.presentationUrl && (
              <a
                href={lesson.presentationUrl}
                download
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Скачать презентацию
              </a>
            )}
            {lesson.pdfUrl && (
              <a
                href={lesson.pdfUrl}
                download
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Скачать PDF урока
              </a>
            )}
          </div>
        )}

        {lesson.longread && (
          <div className="mb-8">
            <LongreadSection content={lesson.longread} />
          </div>
        )}

        {lesson.resources && lesson.resources.length > 0 && (
          <div className="mb-8">
            <ResourcesList resources={lesson.resources} />
          </div>
        )}

        {lesson.survey && (
          <div className="mb-8">
            <SurveySection survey={lesson.survey} />
          </div>
        )}

        <div className="flex justify-between items-center pt-8 border-t border-gray-200 gap-4 flex-wrap">
          {previousLesson ? (
            <Link
              to={`${routePrefix}/module/${moduleId}/topic/${topicId}/lesson/${previousLesson.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              <div className="text-left">
                <div className="text-xs text-gray-500">Предыдущий урок</div>
                <div className="font-medium">{previousLesson.title}</div>
              </div>
            </Link>
          ) : (
            <div />
          )}

          {nextLesson ? (
            <Link
              to={`${routePrefix}/module/${moduleId}/topic/${topicId}/lesson/${nextLesson.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              <div className="text-right">
                <div className="text-xs text-blue-100">Следующий урок</div>
                <div className="font-medium">{nextLesson.title}</div>
              </div>
              <ChevronRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              to={topicPath}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
            >
              <div className="font-medium">Завершить тему</div>
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export function AdminLessonPage() {
  return <CourseLessonPage version="admin" />;
}

export default CourseLessonPage;
