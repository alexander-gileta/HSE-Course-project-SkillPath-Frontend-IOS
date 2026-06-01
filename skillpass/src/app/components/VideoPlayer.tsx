interface VideoPlayerProps {
  videoUrl: string;
  title: string;
}

function getYouTubeId(url: string) {
  try {
    const parsedUrl = new URL(url);
    const host = parsedUrl.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      return parsedUrl.pathname.replace('/', '').split(/[?&]/)[0];
    }

    if (host.endsWith('youtube.com')) {
      return (
        parsedUrl.searchParams.get('v') ||
        parsedUrl.pathname.split('/embed/')[1]?.split(/[?&]/)[0] ||
        parsedUrl.pathname.split('/shorts/')[1]?.split(/[?&]/)[0]
      );
    }
  } catch {
    return null;
  }

  return null;
}

export function VideoPlayer({ videoUrl, title }: VideoPlayerProps) {
  const videoId = getYouTubeId(videoUrl);
  const watchUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : videoUrl;
  const canEmbed =
    typeof window !== 'undefined' &&
    (window.location.protocol === 'http:' || window.location.protocol === 'https:');
  const origin = canEmbed ? `&origin=${encodeURIComponent(window.location.origin)}` : '';
  const embedUrl = videoId
    ? `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1&enablejsapi=1${origin}`
    : videoUrl;

  if (!canEmbed) {
    return (
      <div className="w-full aspect-video bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center p-6 text-center">
        <div className="max-w-md">
          <div className="text-white text-xl font-semibold mb-3">{title}</div>
          <p className="text-gray-300 mb-5">
            Встроенный YouTube-плеер может не запускаться внутри iOS WebView из-за ограничений YouTube.
            Откройте видео на YouTube.
          </p>
          <a
            href={watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-xl bg-white text-gray-900 px-5 py-3 font-medium hover:bg-gray-100 transition-colors"
          >
            Открыть видео на YouTube
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="w-full aspect-video bg-gray-900 rounded-lg overflow-hidden">
        <iframe
          className="w-full h-full"
          src={embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
      <div className="mt-3 text-sm text-gray-600">
        Если видео не открылось,{' '}
        <a href={watchUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
          посмотрите его на YouTube
        </a>
        .
      </div>
    </div>
  );
}
