import React from 'react';
import { AppProvider, useApp } from './app/AppContext';
import { BrandLogo } from './components/BrandLogo';
import { SidebarLayout } from './components/SidebarLayout';
import { LoginScreen } from './features/auth/LoginScreen';
import { BrokerRegisterScreen } from './features/auth/BrokerRegisterScreen';
import { DashboardView } from './features/dashboard/DashboardView';
import { BrokerDashboardView } from './features/dashboard/BrokerDashboardView';
import { ReferralsView } from './features/referrals/ReferralsView';
import { DuplicatesAnalysisView } from './features/referrals/DuplicatesAnalysisView';
import { DocumentsView } from './features/documents/DocumentsView';
import { AttendancesView } from './features/attendances/AttendancesView';
import { BrokersView } from './features/brokers/BrokersView';
import { DevelopmentsView } from './features/developments/DevelopmentsView';
import { DevelopersView } from './features/developers/DevelopersView';
import { SalesFinanceView } from './features/sales/SalesFinanceView';
import { ReportsView } from './features/reports/ReportsView';
import { UsersConfigView } from './features/users/UsersConfigView';
import { AuditView } from './features/audit/AuditView';
import { ProfileView } from './features/profile/ProfileView';

const AppRouter: React.FC = () => {
  const { currentUser, activeNav, isInitialLoading } = useApp();
  const [authMode, setAuthMode] = React.useState<'login' | 'register'>('login');

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-[#080605] flex flex-col items-center justify-center p-4 selection:bg-linnk-flame selection:text-white">
        <div className="flex flex-col items-center gap-6">
          <BrandLogo variant="dark" size="lg" />
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-orange-500/20 border-t-[#f95721] rounded-full animate-spin" />
            <p className="text-xs text-neutral-400 font-medium tracking-wide">
              Carregando LINNK...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    if (authMode === 'register') {
      return <BrokerRegisterScreen onNavigateToLogin={() => setAuthMode('login')} />;
    }
    return <LoginScreen onNavigateToRegister={() => setAuthMode('register')} />;
  }

  return (
    <SidebarLayout>
      {activeNav === 'dashboard' &&
        (currentUser.role === 'BROKER' ? <BrokerDashboardView /> : <DashboardView />)}
      {activeNav === 'referrals' && <ReferralsView />}
      {activeNav === 'duplicates' && <DuplicatesAnalysisView />}
      {activeNav === 'documents' && <DocumentsView />}
      {activeNav === 'attendances' && <AttendancesView />}
      {activeNav === 'brokers' && <BrokersView />}
      {activeNav === 'developments' && <DevelopmentsView />}
      {activeNav === 'developers' && <DevelopersView />}
      {activeNav === 'sales' && <SalesFinanceView />}
      {activeNav === 'reports' && <ReportsView />}
      {activeNav === 'users' && <UsersConfigView />}
      {activeNav === 'audit' && <AuditView />}
      {activeNav === 'profile' && <ProfileView />}
    </SidebarLayout>
  );
};

export function App() {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
}

export default App;
