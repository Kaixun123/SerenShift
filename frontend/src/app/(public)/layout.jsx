export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-row justify-start">
      <div className="w-full bg-white border-1 border-dashed">
        {children}
      </div>
    </div>
  );
}
