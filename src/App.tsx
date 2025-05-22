// src/App.tsx
import { useState } from 'react';
import MarinaCalendar from './features/calendar/MarinaCalendar';
import LandingPage from './features/core/LandingPage';
import TodoListPage from './features/todos/TodoListPage';
import WaitlistPage from './features/waitlist/WaitlistPage'; // <<< IMPORT WaitlistPage
import './index.css'; 
import { Button } from '~/components/ui/button';

type ActiveView = 
  | 'landing' 
  | 'guestDockCalendar' 
  | 'todoList'
  // Add specific view keys for each waitlist type for clarity
  | 'waitlistTransientDocking'
  | 'waitlistIndoorWinterStorage'
  | 'waitlistOutdoorWinterStorage'
  | 'waitlistJetSkiDockage'
  | 'waitlistSeasonalBoatDockage'
  // Add other future views as needed
  | 'seasonalBoatCustomers' // Example from landing page
  | 'seasonalJetSkiCustomers'
  | 'indoorWinterCustomers'
  | 'outdoorWinterCustomers'
  | 'm2mIndoorCustomers'
  | 'm2mOutdoorCustomers'
  | 'dockageMap'
  ;

function App() {
  const [activeView, setActiveView] = useState<ActiveView>('landing');

  const renderView = () => {
    switch (activeView) {
      case 'guestDockCalendar':
        return <MarinaCalendar />;
      case 'todoList':
        return <TodoListPage />;
      // Cases for Waitlist Views
      case 'waitlistTransientDocking':
        return <WaitlistPage waitlistType="Transient Docking" />;
      case 'waitlistIndoorWinterStorage':
        return <WaitlistPage waitlistType="Indoor Winter Storage" />;
      case 'waitlistOutdoorWinterStorage':
        return <WaitlistPage waitlistType="Outdoor Winter Storage" />;
      case 'waitlistJetSkiDockage':
        return <WaitlistPage waitlistType="Jet Ski Dockage" />;
      case 'waitlistSeasonalBoatDockage':
        return <WaitlistPage waitlistType="Seasonal Boat Dockage" />;
      // Placeholder cases for other views from landing page (can return a generic "Coming Soon" page)
      case 'seasonalBoatCustomers':
      case 'seasonalJetSkiCustomers':
      case 'indoorWinterCustomers':
      case 'outdoorWinterCustomers':
      case 'm2mIndoorCustomers':
      case 'm2mOutdoorCustomers':
      case 'dockageMap':
        return <div className="p-10 text-center text-2xl">Feature: {activeView} - Coming Soon!</div>;
      case 'landing':
      default:
        return <LandingPage setActiveView={setActiveView as (view: string) => void} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {activeView !== 'landing' && (
        <div className="p-4 flex">
          <Button 
            variant="outline" 
            onClick={() => setActiveView('landing')}
          >
            &larr; Back to Main Menu 
          </Button>
        </div>
      )}
      {renderView()}
    </div>
  );
}

export default App;