
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ArrowLeftIcon from '../icons/ArrowLeftIcon';
import { APP_NAME } from '../../constants';
import CogIcon from '../icons/CogIcon';
import { useHeaderVisibility } from '../../App';

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isHeaderVisible } = useHeaderVisibility();

  const getTitle = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return 'Panel de Control';
    if (path.startsWith('/jobs')) return 'Trabajos';
    if (path.startsWith('/people')) return 'Contactos';
    if (path.startsWith('/inventory')) return 'Inventario';
    if (path.startsWith('/finances')) return 'Finanzas';
    if (path.startsWith('/quotes')) return 'Cotizaciones';
    if (path.startsWith('/settings')) return 'Ajustes';
    if (path.startsWith('/new-job')) return 'Nuevo Trabajo';
    return APP_NAME;
  };

  const title = getTitle();
  const mainSections = ['/jobs', '/quotes', '/people', '/inventory', '/finances'];
  const isMainSectionPage = mainSections.some(section => location.pathname.startsWith(section));
  const isDashboard = location.pathname === '/' || location.pathname === '/dashboard';
  const showBackButton = !isDashboard;
  const showSettingsButton = !location.pathname.startsWith('/settings');


  return (
    <header 
      className={`fixed top-0 left-0 right-0 p-6 z-[var(--z-index-main-header)] bg-[var(--color-primary-app)]/80 backdrop-blur-sm transition-transform duration-300 ease-in-out ${!isHeaderVisible ? '-translate-y-full' : 'translate-y-0'}`}
      style={{ 
        height: 'calc(6rem + var(--safe-area-inset-top))', 
        paddingTop: 'var(--safe-area-inset-top)',
      }}
    >
      <div className="flex justify-between items-center h-full">
        <div className="flex items-center">
            {showBackButton && (
              <button 
                onClick={() => navigate(-1)} 
                className="mr-4 -ml-2 p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]"
                aria-label="Volver"
              >
                <ArrowLeftIcon className="w-6 h-6" />
              </button>
            )}
            <h1 className={`text-3xl font-bold ${isMainSectionPage ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-transparent bg-clip-text' : 'text-white'}`}>{title}</h1>
        </div>
        
        {showSettingsButton && (
          <button 
              onClick={() => navigate('/settings')} 
              className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]"
              aria-label="Ir a Ajustes"
            >
            <CogIcon className="w-6 h-6" />
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;