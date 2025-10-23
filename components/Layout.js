import BottomNav from './BottomNav';

export default function Layout({ children }) {
  console.log("Layout component is rendering!");
  
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F5F5F5'
      }}
    >
      <main
        style={{
          paddingBottom: '80px'
        }}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}