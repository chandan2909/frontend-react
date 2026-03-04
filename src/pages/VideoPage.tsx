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
  
  const { markVideoCompleted } = useSidebarStore();
  const progressInterval = useRef<any>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    const fetchVideo = async () => {
      setLoading(true);
      setError('');
      setCompletionMarked(false);
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
    };
  }, [parsedVideoId, parsedSubjectId]);

  const handleProgress = async (currentTime: number, isFinished: boolean) => {
    try {
      await apiClient.post(`/progress/videos/${parsedVideoId}`, {
        videoId: parsedVideoId,
        subjectId: parsedSubjectId,
        last_position_seconds: Math.floor(currentTime),
        is_completed: isFinished
      });

      if (isFinished && !completionMarked) {
        setCompletionMarked(true);
        markVideoCompleted(parsedVideoId);
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

      <div className="w-full max-w-[800px] mx-auto">
        <VideoPlayer 
          youtubeId={videoData.youtube_url} 
          onEnd={onVideoEnd}
          onStateChange={onStateChange}
          onReady={onPlayerReady}
        />
      </div>

      <div className="mt-8 pt-6 border-t border-gray-700 flex items-center justify-between w-full max-w-[800px] mx-auto">
        {videoData.previous_video_id ? (
          <button 
            onClick={() => navigate(`/subjects/${parsedSubjectId}/video/${videoData.previous_video_id}`)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white border border-white hover:bg-white hover:text-black transition-colors"
          >
            &larr; Previous Lesson
          </button>
        ) : <div />}

        {videoData.next_video_id ? (
          <button 
            onClick={() => navigate(`/subjects/${parsedSubjectId}/video/${videoData.next_video_id}`)}
            disabled={!completionMarked}
            className={`flex items-center gap-2 px-6 py-2 text-sm font-bold transition-colors ${
              completionMarked 
                ? 'bg-white text-black hover:bg-gray-200 border border-white opacity-100' 
                : 'bg-transparent text-gray-500 border border-gray-600 cursor-not-allowed opacity-50'
            }`}
          >
            Next Lesson &rarr;
          </button>
        ) : (
           <div className="text-sm font-bold text-green-400">
             You have completed this subject!
           </div>
        )}
      </div>
    </div>
  );
}
