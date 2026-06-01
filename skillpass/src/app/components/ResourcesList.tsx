import { ExternalLink } from "lucide-react";
import { Resource } from "../data/courseData";

interface ResourcesListProps {
  resources: Resource[];
}

export function ResourcesList({ resources }: ResourcesListProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="font-semibold text-lg mb-4">Дополнительные ресурсы</h3>
      <ul className="space-y-3">
        {resources.map((resource, index) => (
          <li key={index}>
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-blue-600 hover:text-blue-700 hover:underline"
            >
              <ExternalLink className="w-4 h-4 mr-2 flex-shrink-0" />
              {resource.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
