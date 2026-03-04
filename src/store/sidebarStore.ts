import { create } from 'zustand';
import apiClient from '../lib/apiClient';

interface SidebarState {
  tree: any | null;
  loading: boolean;
  error: string | null;
  fetchTree: (subjectId: number) => Promise<void>;
  markVideoCompleted: (videoId: number) => void;
}

const useSidebarStore = create<SidebarState>((set, get) => ({
  tree: null,
  loading: false,
  error: null,
  fetchTree: async (subjectId) => {
    set({ loading: true, error: null });
    try {
      const { data } = await apiClient.get(`/subjects/${subjectId}/tree`);
      set({ tree: data, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch tree', loading: false });
    }
  },
  markVideoCompleted: (videoId: number) => {
    const { tree, fetchTree } = get();
    if (!tree) return;
    
    // Optimistic update
    const updatedSections = tree.sections.map((section: any) => ({
      ...section,
      videos: section.videos.map((video: any) => 
        video.id === videoId ? { ...video, is_completed: true } : video
      )
    }));
    
    set({ tree: { ...tree, sections: updatedSections } });

    // Refetch to get updated locked statuses from backend
    fetchTree(tree.id);
  },
}));

export default useSidebarStore;
