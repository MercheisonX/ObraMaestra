

import React, { useEffect, useState, useRef, createContext, useContext } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import BottomNavbar from './components/layout/BottomNavbar';
import Header from './components/layout/Header';
import DashboardPage from './pages/DashboardPage';
import JobsPage from './pages/JobsPage';
import NewJobPage from './pages/NewJobPage';
import FinancesPage from './pages/FinancesPage';
import QuoteGeneratorPage from './pages/QuoteGeneratorPage';
import SettingsPage from './pages/SettingsPage';
import PeoplePage from './pages/PeoplePage'; // Nueva página unificada
import InventoryPage from './pages/InventoryPage'; // Nueva página
import QuotesPage from './pages/QuotesPage'; // Nueva página de listado de cotizaciones
import { initializeAppData } from './utils/localStorageManager'; // Import initializer

interface HeaderVisibilityContextType {
  isHeaderVisible: boolean;
}
const HeaderVisibilityContext = createContext<HeaderVisibilityContextType>({ isHeaderVisible: true });
export const useHeaderVisibility = () => useContext(HeaderVisibilityContext);

const App: React.FC = () => {
  const location = useLocation();
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const mainScrollRef = useRef<HTMLElement>(null);
  const lastScrollTop = useRef(0);
  
  useEffect(() => {
    initializeAppData(); // Initialize data from localStorage or set defaults
  }, []);

  useEffect(() => {
    // Reset header visibility when changing routes
    setIsHeaderVisible(true);
    lastScrollTop.current = 0;
    if (mainScrollRef.current) {
        mainScrollRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  const handleScroll = (event: React.UIEvent<HTMLElement>) => {
    const scrollTop = event.currentTarget.scrollTop;
    // A bit of hysteresis to prevent flickering
    if (scrollTop > lastScrollTop.current && scrollTop > 50) { // Scrolling down
        setIsHeaderVisible(false);
    } else if (scrollTop < lastScrollTop.current - 10 || scrollTop < 50) { // Scrolling up or near top
        setIsHeaderVisible(true);
    }
    lastScrollTop.current = scrollTop <= 0 ? 0 : scrollTop;
  };

  // Pages that should have a special layout (e.g., no bottom nav bar)
  const specialLayoutPaths = ['/new-job', '/quotes/new', '/quotes/edit'];

  const needsSpecialLayout = (paths: string[]) => {
    return paths.some(path => {
      // Check for exact paths
      if (location.pathname === path && !path.includes(':')) return true;
      // Check for paths with potential steps like /new-job/:step or /quotes/edit/:id
      if (path.includes(':') && location.pathname.startsWith(path.substring(0, path.indexOf('/:')))) return true;
      // Handle /new-job and /quotes/new without params
      if (location.pathname.startsWith(path + '/')) return true;
      return false;
    });
  };
  
  const hasSpecialLayout = needsSpecialLayout(specialLayoutPaths);
  const showBottomNav = !hasSpecialLayout && window.innerWidth < 768;

  return (
    <HeaderVisibilityContext.Provider value={{ isHeaderVisible }}>
      <div className="flex flex-col h-full bg-[var(--color-primary-app)] text-[var(--color-text-primary)]">
        <Header />
        <main 
          ref={mainScrollRef}
          onScroll={handleScroll}
          className="flex-grow overflow-y-auto"
          style={{
            paddingTop: 'calc(6rem + var(--safe-area-inset-top))', 
            paddingBottom: showBottomNav ? 'calc(5rem + var(--safe-area-inset-bottom))' : 'var(--safe-area-inset-bottom)'
          }}
        >
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/new-job" element={<NewJobPage />} />
            <Route path="/new-job/:step" element={<NewJobPage />} />
            
            <Route path="/quotes" element={<QuotesPage />} />
            <Route path="/quotes/new" element={<QuoteGeneratorPage />} />
            <Route path="/quotes/new/:jobId" element={<QuoteGeneratorPage />} />
            <Route path="/quotes/edit/:quoteId" element={<QuoteGeneratorPage />} />

            <Route path="/people" element={<PeoplePage />} />
            <Route path="/people/:tab" element={<PeoplePage />} />

            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/inventory/:tab" element={<InventoryPage />} />

            <Route path="/finances" element={<FinancesPage />} />
            <Route path="/finances/:calculator" element={<FinancesPage />} />

            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
        {showBottomNav && <BottomNavbar />}
      </div>
    </HeaderVisibilityContext.Provider>
  );
};

export default App;
