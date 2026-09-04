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

import { supabase, isSupabaseConfigured } from './lib/supabaseClient';

const AppContent: React.FC = () => {
  const { currentTab, selectedHabitId } = useHabits();
  const { user, loading: authLoading } = useAuth();
  const [isOnboarded, setIsOnboarded] = useState<boolean>(true);
  const [checkingOnboarding, setCheckingOnboarding] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    const checkUserOnboarding = async () => {
      if (!user?.id) {
        if (isMounted) {
          setCheckingOnboarding(false);
        }
        return;
      }

      // Initialize FCM & Push Notifications for Android/Native
      initPushNotifications(user.id);

      // 1. Check local storage first
      const localOnboarded = localStorage.getItem(`focustrack_onboarded_${user.id}`);
      if (localOnboarded === 'true') {
        if (isMounted) {
          setIsOnboarded(true);
          setCheckingOnboarding(false);
        }
        return;
      }

      // 2. Check Supabase DB profiles & habits table for existing account data
      if (isSupabaseConfigured) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, name, creed')
            .eq('id', user.id)
            .maybeSingle();

          if (profile && profile.name) {
            // Existing authenticated account in Supabase database!
            localStorage.setItem(`focustrack_onboarded_${user.id}`, 'true');
            if (isMounted) {
              setIsOnboarded(true);
              setCheckingOnboarding(false);
            }
            return;
          }

          // Check if user has habits created
          const { data: habits } = await supabase
            .from('habits')
            .select('id')
            .eq('user_id', user.id)
            .limit(1);

          if (habits && habits.length > 0) {
            localStorage.setItem(`focustrack_onboarded_${user.id}`, 'true');
            if (isMounted) {
              setIsOnboarded(true);
              setCheckingOnboarding(false);
            }
            return;
          }
        } catch (err) {
          console.error('[App] Onboarding check error:', err);
        }
      }

      // 3. New account — needs onboarding
      if (isMounted) {
        setIsOnboarded(false);
        setCheckingOnboarding(false);
      }
    };

    checkUserOnboarding();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  if (authLoading || (user && checkingOnboarding)) {
    return (
      <div className="min-h-screen bg-[#131313] flex flex-col justify-center items-center text-slate-300">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs text-slate-400 font-technical uppercase tracking-widest">Verifying Protocol Session...</p>
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
        <main className="flex-1 flex flex-col pt-16 pb-20 md:pt-0 md:pb-0">
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

