
// src/App.tsx
//import './App.css'
//import { useEffect } from 'react';
//import { useStaticDataStore } from './stores/staticDataStore'; 

//import { Header } from './components/layout/Header';
import { LeftPanel } from './components/layout/LeftPanel';
import { RightPanel } from './components/layout/RightPanel';
import { Footer } from './components/layout/Footer';

function App() {

  return (
    <div className="flex flex-col h-screen bg-background text-foreground dark:bg-gray-950 dark:text-gray-50">
      <main className="flex flex-1 flex-col xl:flex-row overflow-y-auto overflow-x-auto">
        {/* Make the aside itself fill height and allow internal scrolling or flexing */}
        <aside className="w-full xl:[720px] 2xl:[800px] border-r dark:border-gray-700 max-w-[1200px]"> 
          <LeftPanel />
        </aside>
        <section className="flex-1 flex">
          <RightPanel />
        </section>
      </main>
      <div className="hidden md:block">
        <Footer />
      </div>
    </div>
  );
}

export default App;