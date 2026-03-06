import { useEffect } from 'react';
import useSidebarStore from '@/store/sidebarStore';
import SectionItem from './SectionItem';

export default function SubjectSidebar({ subjectId }: { subjectId: number }) {
  const { tree, loading, error, fetchTree } = useSidebarStore();

  useEffect(() => {
    fetchTree(subjectId);
  }, [subjectId, fetchTree]);

  if (loading && !tree) {
    return (
      <aside className="w-full lg:w-[360px] flex-shrink-0 lg:border-l border-t lg:border-t-0 border-gray-200 bg-gray-50 p-6 flex justify-center h-full min-h-[300px]">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
      </aside>
    );
  }

  if (error || !tree) {
    return (
      <aside className="w-full lg:w-[360px] flex-shrink-0 lg:border-l border-t lg:border-t-0 border-gray-200 bg-gray-50 p-6 text-sm text-red-500 h-full min-h-[300px]">
        Failed to load content tree.
      </aside>
    );
  }

  return (
    <aside className="w-full lg:w-[360px] flex-shrink-0 lg:border-l border-t lg:border-t-0 border-gray-200 bg-white flex flex-col lg:h-full lg:overflow-hidden shadow-lg z-10 text-black">
      <div className="p-5 border-b border-gray-200 bg-white flex items-center justify-between">
        <h2 className="font-bold text-base text-[#1c1d1f]">Course content</h2>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {tree.sections.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No content yet.</p>
        ) : (
          tree.sections.map((section: any) => (
            <SectionItem key={section.id} section={section} subjectId={subjectId} />
          ))
        )}
      </div>
    </aside>
  );
}
