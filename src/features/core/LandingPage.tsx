// src/features/core/LandingPage.tsx
import React from 'react';
import { Button } from '~/components/ui/button'; // Ensure Button component is available

interface LandingPageProps {
  setActiveView: (view: string) => void; // Function to change the active view in App.tsx
}

// Helper component for styling sections, defined within LandingPage.tsx
const Section: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
  <div className={`p-6 bg-white rounded-lg shadow-md ${className}`}>
    <h2 className="text-2xl font-semibold mb-4 text-slate-700">{title}</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {children}
    </div>
  </div>
);

const LandingPage: React.FC<LandingPageProps> = ({ setActiveView }) => {
  
  // Updated handler to differentiate actual view changes from "coming soon" features
  const handleViewClick = (viewName: string, featureNameForAlert: string) => {
    // List of views that are ready or have a placeholder page
    const activeViews = [
        'guestDockCalendar', 'todoList', 
        'waitlistTransientDocking', 'waitlistIndoorWinterStorage', 
        'waitlistOutdoorWinterStorage', 'waitlistJetSkiDockage', 
        'waitlistSeasonalBoatDockage'
    ];
    
    // List of views that are just placeholders for now
    const comingSoonViews = [
        'seasonalBoatCustomers', 'seasonalJetSkiCustomers', 
        'indoorWinterCustomers', 'outdoorWinterCustomers',
        'm2mIndoorCustomers', 'm2mOutdoorCustomers', 'dockageMap'
    ];

    if (activeViews.includes(viewName)) {
      setActiveView(viewName);
    } else if (comingSoonViews.includes(viewName)) {
      console.log(`Button clicked for: ${featureNameForAlert} - View '${viewName}' to be implemented.`);
      alert(`Feature coming soon: ${featureNameForAlert}`);
    } else {
      // Fallback for any other unhandled buttons
      console.log(`Button clicked for unhandled view: ${viewName}`);
      alert(`Feature coming soon: ${featureNameForAlert}`);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-4xl font-bold mb-10 text-center text-slate-800">
        Marina Management Hub
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        <Section title="Guest & Transient Services" className="bg-emerald-50">
          <Button size="lg" className="h-16 text-md bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setActiveView('guestDockCalendar')}>
            Guest Dockage Calendar
          </Button>
          <Button variant="secondary" size="lg" className="h-16 text-md border-emerald-600 text-emerald-700 hover:bg-emerald-100" onClick={() => setActiveView('waitlistTransientDocking')}>
            Transient Docking Waitlist
          </Button>
        </Section>

        <Section title="Seasonal Dockage" className="bg-sky-50">
          <Button size="lg" className="h-16 text-md bg-sky-600 hover:bg-sky-700 text-white" onClick={() => handleViewClick('seasonalBoatCustomers', 'Seasonal Boat Customers')}>
            Boat Dockage Customers
          </Button>
          <Button variant="secondary" size="lg" className="h-16 text-md border-sky-600 text-sky-700 hover:bg-sky-100" onClick={() => setActiveView('waitlistSeasonalBoatDockage')}>
            Boat Dockage Waitlist
          </Button>
          <Button size="lg" className="h-16 text-md bg-sky-500 hover:bg-sky-600 text-white" onClick={() => handleViewClick('seasonalJetSkiCustomers', 'Seasonal JetSki Customers')}>
            Jet Ski Dockage Customers
          </Button>
          <Button variant="secondary" size="lg" className="h-16 text-md border-sky-500 text-sky-600 hover:bg-sky-100" onClick={() => setActiveView('waitlistJetSkiDockage')}>
            Jet Ski Dockage Waitlist
          </Button>
        </Section>

        <Section title="Winter Storage" className="bg-indigo-50">
          <Button size="lg" className="h-16 text-md bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => handleViewClick('indoorWinterCustomers', 'Indoor Winter Customers')}>
            Indoor Storage Customers
          </Button>
          <Button variant="secondary" size="lg" className="h-16 text-md border-indigo-600 text-indigo-700 hover:bg-indigo-100" onClick={() => setActiveView('waitlistIndoorWinterStorage')}>
            Indoor Storage Waitlist
          </Button>
          <Button size="lg" className="h-16 text-md bg-indigo-500 hover:bg-indigo-600 text-white" onClick={() => handleViewClick('outdoorWinterCustomers', 'Outdoor Winter Customers')}>
            Outdoor Storage Customers
          </Button>
          <Button variant="secondary" size="lg" className="h-16 text-md border-indigo-500 text-indigo-600 hover:bg-indigo-100" onClick={() => setActiveView('waitlistOutdoorWinterStorage')}>
            Outdoor Storage Waitlist
          </Button>
        </Section>

        <Section title="Month-to-Month Storage" className="bg-amber-50">
          <Button size="lg" className="h-16 text-md bg-amber-600 hover:bg-amber-700 text-white" onClick={() => handleViewClick('m2mIndoorCustomers', 'M2M Indoor Customers')}>
            M2M Indoor Customers
          </Button>
          <Button size="lg" className="h-16 text-md bg-amber-500 hover:bg-amber-600 text-white" onClick={() => handleViewClick('m2mOutdoorCustomers', 'M2M Outdoor Customers')}>
            M2M Outdoor Customers
          </Button>
          {/* Consider adding M2M Waitlist buttons here if needed, e.g.:
          <Button variant="secondary" size="lg" className="h-16 text-md border-amber-600 text-amber-700 hover:bg-amber-100" onClick={() => setActiveView('waitlistM2mIndoor')}>
            M2M Indoor Waitlist
          </Button> 
          */}
        </Section>
        
        <Section title="Marina Operations" className="lg:col-span-2 bg-slate-50">
          <Button size="lg" className="h-16 text-md bg-slate-600 hover:bg-slate-700 text-white" onClick={() => setActiveView('todoList')}>
            To-Do List
          </Button>
          <Button variant="outline" size="lg" className="h-16 text-md border-slate-500 text-slate-700 hover:bg-slate-200" onClick={() => handleViewClick('dockageMap', 'Dockage Map')}>
            Dockage Map (Future)
          </Button>
        </Section>

      </div>
    </div>
  );
};

export default LandingPage;