interface LongreadSectionProps {
  content: string;
}

export function LongreadSection({ content }: LongreadSectionProps) {
  // Простое преобразование markdown-подобного текста в HTML
  const formatContent = (text: string) => {
    return text
      .split('\n')
      .map((line, index) => {
        // Заголовки
        if (line.startsWith('# ')) {
          return <h2 key={index} className="text-2xl font-bold mt-6 mb-3">{line.slice(2)}</h2>;
        }
        if (line.startsWith('## ')) {
          return <h3 key={index} className="text-xl font-semibold mt-5 mb-2">{line.slice(3)}</h3>;
        }
        // Пустые строки
        if (line.trim() === '') {
          return <div key={index} className="h-2" />;
        }
        // Обычный текст
        // Обработка кода в обратных кавычках
        const parts = line.split(/(`[^`]+`)/g);
        const formattedLine = parts.map((part, i) => {
          if (part.startsWith('`') && part.endsWith('`')) {
            return <code key={i} className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">{part.slice(1, -1)}</code>;
          }
          return <span key={i}>{part}</span>;
        });
        
        return <p key={index} className="mb-3 leading-relaxed">{formattedLine}</p>;
      });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="font-semibold text-lg mb-4">Материалы урока</h3>
      <div className="prose max-w-none text-gray-700">
        {formatContent(content)}
      </div>
    </div>
  );
}
