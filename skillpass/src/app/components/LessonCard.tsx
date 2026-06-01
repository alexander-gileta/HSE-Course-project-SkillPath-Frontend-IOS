
import { Link } from 'react-router';
import { Clock, FileText } from 'lucide-react';

interface LessonCardProps {
  moduleId: number;
  topicId: number;
  lessonId: number;
  title: string;
  description: string;
  hasSurvey: boolean;
  version?: 'user' | 'admin';
}

export function LessonCard({
  moduleId,
  topicId,
  lessonId,
  title,
  description,
  hasSurvey,
  version = 'user',
}: LessonCardProps) {
  const routePrefix = version === 'admin' ? '/admin' : '';
  return (
    <Link
      to={`${routePrefix}/module/${moduleId}/topic/${topicId}/lesson/${lessonId}`}
      className="block p-6 bg-white rounded-2xl border border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all"
    >
      <div className="flex items-start justify-between mb-3 gap-3">
        <h3 className="font-semibold text-lg">{title}</h3>
        <Clock className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
      </div>

      <p className="text-gray-600 mb-4">{description}</p>

      <div className="flex gap-2 flex-wrap">
        {hasSurvey && (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-sm">
            <FileText className="w-4 h-4" />
            Опросник
          </span>
        )}
      </div>
    </Link>
  );
}
