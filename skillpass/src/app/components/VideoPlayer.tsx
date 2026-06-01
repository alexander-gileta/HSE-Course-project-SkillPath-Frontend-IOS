interface VideoPlayerProps {
  videoUrl: string;
  title: string;
}

export function VideoPlayer({ videoUrl, title }: VideoPlayerProps) {
  return (
    <div className="w-full aspect-video bg-gray-900 rounded-lg overflow-hidden">
      <iframe
        className="w-full h-full"
        src={videoUrl}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
