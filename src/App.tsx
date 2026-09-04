import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HabitProvider, useHabits } from './context/HabitContext';
import { LoginScreen } from './components/LoginScreen';
import { OnboardingFlow } from './components/OnboardingFlow';
import { Sidebar } from './components/Sidebar';
import { TopAppBar } from './components/TopAppBar';
import { BottomNavBar } from './components/BottomNavBar';
import { DashboardView } from './components/DashboardView';
import { HabitsView } from './components/HabitsView';
import { HabitDetailView } from './components/HabitDetailView';
import { CalendarView } from './components/CalendarView';
import { AnalyticsView } from './components/AnalyticsView';
import { ArchiveView } from './components/ArchiveView';
import { SettingsView } from './components/SettingsView';
import { CreateHabitModal } from './components/CreateHabitModal';
import { NotificationsModal } from './components/NotificationsModal';
import { ProfileModal } from './components/ProfileModal';
import { initPushNotifications } from './lib/notifications';

const AppContent: React.FC = () => {
  const { currentTab, selectedHabitId } = useHabits();
  const { user, loading } = useAuth();
  const [isOnboarded, setIsOnboarded] = useState<boolean>(true);

  useEffect(() => {
    if (user?.id) {
      // Initialize FCM & Push Notifications for Android/Native
      initPushNotifications(user.id);

      // Check onboarding state
      const onboarded = localStorage.getItem(`focustrack_onboarded_${user.id}`);
      if (!onboarded) {
        setIsOnboarded(false);
      } else {
        setIsOnboarded(true);
      }
    }
  }, [user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#131313] flex flex-col justify-center items-center text-slate-300">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs text-slate-400 font-medium">Loading session...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  if (!isOnboarded) {
    return <OnboardingFlow onComplete={() => setIsOnboarded(true)} />;
  }


  const renderMainView = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'habits':
        return selectedHabitId ? <HabitDetailView /> : <HabitsView />;
      case 'calendar':
        return <CalendarView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'archive':
        return <ArchiveView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#131313] text-[#e2e2e2] flex flex-col antialiased">
      {/* Sidebar for Desktop / Tablet */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-[64px] lg:pl-[240px] w-full min-h-screen transition-all duration-300">
        <TopAppBar />
        <main className="flex-1 flex flex-col pt-16 md:pt-0">
          {renderMainView()}
        </main>
      </div>

      {/* Bottom Navigation for Mobile */}
      <BottomNavBar />

      {/* Global Modals & Overlays */}
      <CreateHabitModal />
      <NotificationsModal />
      <ProfileModal />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <HabitProvider>
        <AppContent />
      </HabitProvider>
    </AuthProvider>
  );
}

export default App;

