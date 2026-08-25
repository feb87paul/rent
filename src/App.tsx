import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ToastContainer } from './components/Toast';
import { WhatsAppModal } from './components/WhatsAppModal';
import { RecordPaymentModal } from './components/RecordPaymentModal';
import { LoginPage } from './components/LoginPage';
import { DashboardView } from './components/DashboardView';
import { TenantsView } from './components/TenantsView';
import { WeeklyRentView } from './components/WeeklyRentView';
import { PaymentHistoryView } from './components/PaymentHistoryView';
import { OutstandingRentView } from './components/OutstandingRentView';
import { CalendarView } from './components/CalendarView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { TenantPortalView } from './components/TenantPortalView';

const MainLayout: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { currentView } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Tenant role gets redirected to Tenant Portal view
  if (user?.role === 'tenant') {
    return (
      <>
        <TenantPortalView />
        <ToastContainer />
      </>
    );
  }

  const renderActiveView = () => {
    switch (currentView) {
      case 'dashboard': return <DashboardView />;
      case 'tenants': return <TenantsView />;
      case 'weekly': return <WeeklyRentView />;
      case 'history': return <PaymentHistoryView />;
      case 'outstanding': return <OutstandingRentView />;
      case 'calendar': return <CalendarView />;
      case 'reports': return <ReportsView />;
      case 'settings': return <SettingsView />;
      default: return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row font-sans selection:bg-indigo-500 selection:text-white">
      {/* Sidebar Navigation */}
      <Sidebar
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderActiveView()}
        </main>
      </div>

      {/* Floating Modals & Toasts */}
      <WhatsAppModal />
      <RecordPaymentModal />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <MainLayout />
      </AppProvider>
    </AuthProvider>
  );
}
