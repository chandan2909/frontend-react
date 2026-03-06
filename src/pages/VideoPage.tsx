import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '@/lib/apiClient';
import VideoPlayer from '@/components/Video/VideoPlayer';
import useSidebarStore from '@/store/sidebarStore';

export default function VideoPage() {
  const { subjectId, videoId } = useParams();
  const navigate = useNavigate();
  
  const parsedSubjectId = parseInt(subjectId as string, 10);
  const parsedVideoId = parseInt(videoId as string, 10);
  
  const [videoData, setVideoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completionMarked, setCompletionMarked] = useState(false);
  const [autoPlayCountdown, setAutoPlayCountdown] = useState<number | null>(null);
  
  const { markVideoCompleted } = useSidebarStore();
  const progressInterval = useRef<any>(null);
  const autoPlayTimerRef = useRef<any>(null);
  const playerRef = useRef<any>(null);
  const videoDataRef = useRef<any>(null);

  useEffect(() => {
    videoDataRef.current = videoData;
  }, [videoData]);

  useEffect(() => {
    const fetchVideo = async () => {
      setLoading(true);
      setError('');
      setCompletionMarked(false);
      setAutoPlayCountdown(null);
      try {
        const { data } = await apiClient.get(`/videos/${parsedVideoId}?subjectId=${parsedSubjectId}`);
        setVideoData(data);
        if (data.is_completed) {
            setCompletionMarked(true);
        }
      } catch (err: any) {
        if (err.response?.status === 403) {
           setError('This video is locked. Please complete the previous videos first.');
        } else {
           setError('Failed to load video.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();

    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
    };
  }, [parsedVideoId, parsedSubjectId]);

  useEffect(() => {
    if (autoPlayCountdown !== null && autoPlayCountdown > 0) {
      autoPlayTimerRef.current = setTimeout(() => {
        setAutoPlayCountdown(prev => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (autoPlayCountdown === 0) {
      if (videoData?.next_video_id) {
        navigate(`/subjects/${parsedSubjectId}/video/${videoData.next_video_id}`);
      }
      setAutoPlayCountdown(null);
    }
    return () => {
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
    };
  }, [autoPlayCountdown, videoData?.next_video_id, navigate, parsedSubjectId]);

  const handleProgress = async (currentTime: number, isFinished: boolean) => {
    try {
      await apiClient.post(`/progress/videos/${parsedVideoId}`, {
        videoId: parsedVideoId,
        subjectId: parsedSubjectId,
        last_position_seconds: Math.floor(currentTime),
        is_completed: isFinished
      });

      if (isFinished) {
        if (!completionMarked) {
          setCompletionMarked(true);
          markVideoCompleted(parsedVideoId);
        }
        
        if (videoDataRef.current?.next_video_id) {
          setAutoPlayCountdown(prev => prev === null ? 5 : prev);
        }
      }
    } catch (error) {
      console.error('Failed to update progress', error);
    }
  };

  const onPlayerReady = (event: any) => {
    playerRef.current = event.target;
    progressInterval.current = setInterval(() => {
        if (playerRef.current && playerRef.current.getPlayerState() === 1) { // 1 is playing
            const currentTime = playerRef.current.getCurrentTime();
            const duration = playerRef.current.getDuration();
            if (duration > 0 && currentTime > 0) {
               handleProgress(currentTime, false);
            }
        }
    }, 10000);
  };

  const onVideoEnd = () => {
    if (playerRef.current) {
      const duration = playerRef.current.getDuration();
      // Autoplay is triggered inside handleProgress to avoid stale closure issues
      handleProgress(duration, true);
    }
  };

  const onStateChange = (state: number) => {
     if (state === 2 && playerRef.current) {
        const currentTime = playerRef.current.getCurrentTime();
        // duration is not needed here
        handleProgress(currentTime, false);
     }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error || !videoData || videoData.locked) {
    const isLocked = videoData?.locked || error.includes('locked');
    return (
      <div className="flex h-full items-center justify-center p-8 bg-[#1c1d1f] min-h-screen">
        <div className="text-center">
          <div className="bg-[#2d2f31] p-10 rounded-lg mb-6 max-w-lg border border-gray-700 shadow-xl">
             <div className="flex justify-center mb-6">
                <svg className="w-16 h-16 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
             </div>
             <h2 className="text-2xl font-bold text-white mb-3">
                {isLocked ? 'This lesson is locked' : 'Video not found'}
             </h2>
             <p className="text-gray-400 text-base mb-2">
                {isLocked 
                  ? 'Please complete all previous lessons in order to unlock this content.' 
                  : error || 'The requested video could not be found.'}
             </p>
             {videoData?.unlock_reason && (
                <p className="text-sm text-[#cec0fc] mt-4 italic">
                   Reason: {videoData.unlock_reason}
                </p>
             )}
          </div>
          <button 
            onClick={() => navigate(`/subjects/${parsedSubjectId}`)}
            className="px-8 py-2 bg-white text-black font-bold tracking-tight hover:bg-gray-200 transition-colors"
          >
            Back to Course
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-8 w-full bg-[#1c1d1f] min-h-full">
      <div className="mb-6 w-full max-w-[800px] mx-auto text-left">
        <h1 className="text-2xl font-bold tracking-tight mb-2 text-white">{videoData.title}</h1>
        <p className="text-gray-300 text-sm">{videoData.description || 'No description provided.'}</p>
      </div>

      <div className="w-full max-w-[1000px] mx-auto relative group">
        {/* Video + embedded nav buttons */}
        <div className="w-full rounded-lg overflow-hidden shadow-2xl border border-gray-800 relative">

          {/* Previous button - overlaid on left edge of video */}
          {videoData.previous_video_id && (
            <button
              onClick={() => navigate(`/subjects/${parsedSubjectId}/video/${videoData.previous_video_id}`)}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-[#1c1d1f] hover:bg-gray-800 text-white transition-all transform hover:scale-110 shadow-2xl border border-white/10"
              title="Previous Lesson"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Next button - overlaid on right edge of video */}
          {videoData.next_video_id && (
            <button
              onClick={() => navigate(`/subjects/${parsedSubjectId}/video/${videoData.next_video_id}`)}
              disabled={!completionMarked}
              className={`absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full transition-all transform hover:scale-110 shadow-2xl border ${
                completionMarked
                  ? 'bg-[#1c1d1f] hover:bg-gray-800 text-white border-white/10'
                  : 'bg-black/20 text-gray-600 border-transparent cursor-not-allowed opacity-30'
              }`}
              title={completionMarked ? 'Next Lesson' : 'Complete lesson to unlock'}
            >
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          <VideoPlayer
            key={videoData.id}
            youtubeId={videoData.youtube_url}
            onEnd={onVideoEnd}
            onStateChange={onStateChange}
            onReady={onPlayerReady}
          />

          {/* Auto-play Overlay */}
          {autoPlayCountdown !== null && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20 backdrop-blur-sm transition-all duration-300">
              <div className="text-center p-8 rounded-xl bg-[#2d2f31] border border-white/10 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-2">Up Next</h3>
                <p className="text-gray-400 mb-6 text-sm">Next lesson starting in <span className="text-white font-mono text-lg">{autoPlayCountdown}</span> seconds...</p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => setAutoPlayCountdown(null)}
                    className="px-6 py-2 font-bold border border-[#1c1d1f] text-[#1c1d1f] bg-white hover:bg-[#f7f9fa] transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => navigate(`/subjects/${parsedSubjectId}/video/${videoData.next_video_id}`)}
                    className="px-6 py-2 font-bold bg-[#1c1d1f] text-white hover:bg-gray-800 transition-colors text-sm"
                  >
                    Play Now
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {!videoData.next_video_id && completionMarked && (
        <div className="mt-8 text-center">
           <div className="inline-block px-6 py-2 rounded-full bg-green-900/30 border border-green-500/50 text-green-400 font-bold text-sm">
             🎉 Subject Completed!
           </div>
        </div>
      )}
    </div>
  );
}
