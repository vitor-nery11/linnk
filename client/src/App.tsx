import React from 'react';
import { AppProvider, useApp } from './app/AppContext';
import { SidebarLayout } from './components/SidebarLayout';
import { LoginScreen } from './features/auth/LoginScreen';
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
  const { currentUser, activeNav } = useApp();

  if (!currentUser) {
    return <LoginScreen />;
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
