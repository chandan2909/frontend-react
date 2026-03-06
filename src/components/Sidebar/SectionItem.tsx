import { Link, useLocation } from 'react-router-dom';
import { Lock, CheckCircle, PlayCircle } from 'lucide-react';

interface SectionItemProps {
  section: any;
  subjectId: number;
}

export default function SectionItem({ section, subjectId }: SectionItemProps) {
  const { pathname } = useLocation();

  return (
    <div className="border-b border-gray-200">
      <h4 className="text-[15px] font-bold text-[#1c1d1f] px-4 bg-[#f7f9fa] py-3 cursor-pointer hover:bg-gray-100">
        {section.title}
      </h4>
      <div className="flex flex-col pb-2">
        {section.videos.map((video: any) => {
          const isActive = pathname.includes(`/video/${video.id}`);
          
          if (video.locked && !isActive) {
            return (
              <div 
                key={video.id}
                className="flex items-center gap-3 px-4 py-3 text-sm text-[#6a6f73] bg-white cursor-not-allowed border-l-4 border-transparent"
                title="Complete previous videos to unlock"
              >
                <div className="flex-shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <span className="truncate">{video.title}</span>
              </div>
            );
          }

          return (
            <Link
              key={video.id}
              to={`/subjects/${subjectId}/video/${video.id}`}
              className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors border-l-4 ${
                isActive 
                  ? 'bg-[#d1d7dc] text-[#1c1d1f] font-bold border-[#1c1d1f]' 
                  : 'text-[#1c1d1f] hover:bg-[#f7f9fa] border-transparent'
              }`}
            >
              <div className="flex-shrink-0">
                {video.is_completed ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : isActive ? (
                  <div className="w-4 h-4 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
                  </div>
                ) : (
                  <PlayCircle className="w-4 h-4 shrink-0 text-black" />
                )}
              </div>
              <span className="truncate">{video.title}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
