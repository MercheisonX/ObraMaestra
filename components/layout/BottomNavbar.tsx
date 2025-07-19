


import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import HomeIcon from '../icons/HomeIcon';
import BriefcaseIcon from '../icons/BriefcaseIcon';
import UsersIcon from '../icons/UsersIcon';
import ArchiveBoxIcon from '../icons/ArchiveBoxIcon';
import ChartBarIcon from '../icons/ChartBarIcon';
import DocumentTextIcon from '../icons/DocumentTextIcon';

interface NavItemProps {
  to: string;
  icon: React.ReactElement<React.SVGProps<SVGSVGElement>>;
  label: string;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to));

  return (
    <NavLink
      to={to}
      className={`flex flex-col items-center justify-center w-full pt-1.5 pb-1 gap-1 transition-colors duration-150 ease-in-out
        ${isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]'}`
      }
    >
      {React.cloneElement(icon, { className: 'w-6 h-6' })}
      <span className={`text-xs ${isActive ? 'font-bold' : 'font-medium'}`}>{label}</span>
    </NavLink>
  );
};

const BottomNavbar: React.FC = () => {
  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 shadow-t-md flex justify-around items-center border-t md:hidden z-40 bg-[var(--color-secondary-bg)]/80 backdrop-blur-sm"
      style={{
        height: 'calc(5rem + var(--safe-area-inset-bottom))', 
        paddingBottom: 'var(--safe-area-inset-bottom)',
        borderColor: 'var(--color-border)'
      }}
    >
      <NavItem to="/dashboard" icon={<HomeIcon />} label="Panel" />
      <NavItem to="/jobs" icon={<BriefcaseIcon />} label="Trabajos" />
      <NavItem to="/quotes" icon={<DocumentTextIcon />} label="Cotizar" /> 
      <NavItem to="/people/clients" icon={<UsersIcon />} label="Contactos" />
      <NavItem to="/inventory" icon={<ArchiveBoxIcon />} label="Inventario" />
      <NavItem to="/finances" icon={<ChartBarIcon />} label="Finanzas" />
    </nav>
  );
};

export default BottomNavbar;
