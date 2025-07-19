
import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useHeaderVisibility } from '../App';
import SalaryCalculator from './finances/SalaryCalculator';
import BreakEvenCalculator from './finances/BreakEvenCalculator';
import DebtCalculator from './finances/DebtCalculator';
import FinanceOverview from './finances/FinanceOverview';
import TransactionsCalculator from './finances/TransactionsCalculator';
import CashFlowCalculator from './finances/CashFlowCalculator';
import Card from '../components/ui/Card';

type MainTab = 'overview' | 'transactions' | 'calculators';
type CalculatorType = MainTab | 'cashflow' | 'salary' | 'breakeven' | 'debt';

const CalculatorsListPage: React.FC = () => {
    const calculatorLinks = [
        { path: '/finances/cashflow', title: 'Flujo de Caja', description: 'Analiza la entrada y salida de efectivo.' },
        { path: '/finances/salary', title: 'Calculadora Salarial', description: 'Calcula el salario neto y deducciones.' },
        { path: '/finances/breakeven', title: 'Punto de Equilibrio', description: 'Determina cuántas unidades vender para cubrir costos.' },
        { path: '/finances/debt', title: 'Plan de Deudas', description: 'Crea un plan para pagar deudas eficientemente.' },
    ];

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white">Calculadoras Financieras</h2>
            <p className="text-[var(--color-text-secondary)]">Herramientas para planificar y analizar las finanzas de su negocio.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {calculatorLinks.map(link => (
                    <Link to={link.path} key={link.path}>
                        <Card className="h-full hover:border-[var(--color-accent)] transition-colors">
                            <h3 className="font-bold text-lg text-[var(--color-accent)]">{link.title}</h3>
                            <p className="text-sm text-[var(--color-text-secondary)] mt-1">{link.description}</p>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    )
};


const FinancesPage: React.FC = () => {
  const { calculator } = useParams<{ calculator?: string }>();
  const navigate = useNavigate();
  const { isHeaderVisible } = useHeaderVisibility();
  
  const mainTabs: { id: MainTab, label: string }[] = [
    { id: 'overview', label: 'Resumen' },
    { id: 'transactions', label: 'Transacciones' },
    { id: 'calculators', label: 'Calculadoras' },
  ];

  const getActiveMainTab = (): MainTab => {
    if (!calculator || calculator === 'overview') return 'overview';
    if (calculator === 'transactions') return 'transactions';
    return 'calculators';
  }

  const activeMainTab = getActiveMainTab();
  const activeCalculator = (calculator || 'overview') as CalculatorType;

  const handleTabChange = (tabId: MainTab) => {
    navigate(`/finances/${tabId}`);
  };

  const renderActiveCalculator = () => {
    switch (activeCalculator) {
      case 'transactions':
        return <TransactionsCalculator />;
      case 'cashflow':
        return <CashFlowCalculator />;
      case 'salary':
        return <SalaryCalculator />;
      case 'breakeven':
        return <BreakEvenCalculator />;
      case 'debt':
        return <DebtCalculator />;
      case 'calculators':
        return <CalculatorsListPage />;
      case 'overview':
      default:
        return <FinanceOverview />;
    }
  };

  return (
    <div className="px-6 pb-24 space-y-6">
       <div 
        className="sticky top-0 bg-[var(--color-primary-app)]/80 backdrop-blur-sm z-20 -mx-6 px-6 transition-transform duration-300"
        style={{
          transform: isHeaderVisible ? 'translateY(0)' : 'translateY(calc(-1 * 6rem))'
        }}
      >
        <div className="flex gap-2 pt-4 pb-3 overflow-x-auto styled-scrollbar-horizontal-thin">
            {mainTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold flex-shrink-0 transition-colors ${activeMainTab === tab.id ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white' : 'bg-[var(--color-secondary-bg)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
      </div>
      
      <div className="pt-2">
        {renderActiveCalculator()}
      </div>
    </div>
  );
};

export default FinancesPage;