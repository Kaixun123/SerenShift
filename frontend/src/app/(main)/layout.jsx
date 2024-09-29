import SideBar from "@/components/Sidebar";

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-row justify-start">
      <SideBar />
      <div className="w-full bg-white border-1 border-dashed">
        {children}
      </div>
    </div>
  );
}
