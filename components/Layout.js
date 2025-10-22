import BottomNav from './BottomNav';

export default function Layout({ children }) {
  console.log("Layout component is rendering!"); // <-- ADD THIS
  return (
    <div className="min-h-screen bg-lightGray">
      <main className="pb-[80px]">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}