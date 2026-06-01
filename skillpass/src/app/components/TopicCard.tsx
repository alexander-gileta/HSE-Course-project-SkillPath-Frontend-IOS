import { Link } from 'react-router';
import { BookOpen, GraduationCap } from 'lucide-react';

interface TopicCardProps {
  moduleId: number;
  id: number;
  title: string;
  description: string;
  lessonsCount: number;
  version?: 'user' | 'admin';
}

export function TopicCard({ moduleId, id, title, description, lessonsCount, version = 'user' }: TopicCardProps) {
  const routePrefix = version === 'admin' ? '/admin' : '';
  return (
    <Link
      to={`${routePrefix}/module/${moduleId}/topic/${id}`}
      className="block p-6 bg-white rounded-2xl border border-gray-200 hover:border-blue-500 hover:shadow-xl transition-all group"
    >
      <div className="flex items-start justify-between mb-4 gap-3">
        <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
          <BookOpen className="w-6 h-6 text-blue-600" />
        </div>
        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm whitespace-nowrap">
          {lessonsCount} урока
        </span>
      </div>

      <h3 className="font-semibold text-xl mb-2 group-hover:text-blue-600 transition-colors">{title}</h3>
      <p className="text-gray-600">{description}</p>

      <div className="mt-4 flex items-center text-blue-600 font-medium">
        <GraduationCap className="w-5 h-5 mr-2" />
        Открыть тему
      </div>
    </Link>
  );
}
