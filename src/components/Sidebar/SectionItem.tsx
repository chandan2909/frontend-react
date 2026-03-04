import { Link, useLocation } from 'react-router-dom';

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
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
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
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : isActive ? (
                  <div className="w-4 h-4 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
                  </div>
                ) : (
                  <svg className="w-4 h-4 shrink-0 text-black fill-current" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
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
