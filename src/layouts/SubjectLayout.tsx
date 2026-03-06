import { Outlet, useParams } from 'react-router-dom';
import AuthGuard from '@/components/Auth/AuthGuard';
import SubjectSidebar from '@/components/Sidebar/SubjectSidebar';
import Header from '@/components/Layout/Header';

export default function SubjectLayout() {
  const { subjectId } = useParams();
  const parsedSubjectId = parseInt(subjectId as string, 10);

  return (
    <AuthGuard>
      <div className="flex flex-col h-screen overflow-hidden">
        <Header />
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden bg-[#1c1d1f] pt-[72px]">
          <div className="flex-1 relative overflow-y-auto custom-scrollbar text-white">
            <Outlet />
          </div>
          <SubjectSidebar subjectId={parsedSubjectId} />
        </div>
      </div>
    </AuthGuard>
  );
}
