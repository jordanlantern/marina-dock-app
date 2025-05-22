// src/features/calendar/MarinaCalendar.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '~/components/ui/button';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { cn } from '~/lib/utils';
import BookingModal from '../booking/BookingModal'; // Adjust path if needed
import { supabase } from '~/lib/supabaseClient';

// Define Reservation interface (ensure it matches your Supabase table + form needs)
export interface Reservation {
  id: number | string;
  created_at?: string;
  dock_id: string;
  start_date: string; // "YYYY-MM-DD"
  end_date: string;   // "YYYY-MM-DD"
  guest_name: string;
  boat_type?: string | null;
  boat_length?: string | null;
  boat_width?: string | null; // Make sure this field exists in your DB table
  email?: string | null;
  phone_number?: string | null; // Matches Supabase column name
  payment_status?: string | null;
  notes?: string | null;
}

// Helper Functions (defined outside the component)
const normalizeDateToMidnight = (date: Date): Date => {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

const getReservationForDockOnDate = (targetDate: Date, dockId: string, reservations: Reservation[]): Reservation | undefined => {
  const normalizedTarget = normalizeDateToMidnight(targetDate).getTime();
  for (const res of reservations) {
    if (res.dock_id === dockId) {
      const resStart = normalizeDateToMidnight(new Date(res.start_date + "T00:00:00Z")).getTime();
      const resEnd = normalizeDateToMidnight(new Date(res.end_date + "T00:00:00Z")).getTime();
      if (normalizedTarget >= resStart && normalizedTarget <= resEnd) {
        return res;
      }
    }
  }
  return undefined;
};

const MarinaCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 4, 1)); // Start in May 2025 for testing
  const [reservations, setReservations] = useState<Reservation[]>([]); 
  const [isLoadingReservations, setIsLoadingReservations] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false); // Single state for modal
  const [selectedDockForNewBooking, setSelectedDockForNewBooking] = useState<{ date: Date; dockId: string } | null>(null);
  const [reservationToViewOrEdit, setReservationToViewOrEdit] = useState<Reservation | null>(null);

  const fetchReservations = async () => {
    setIsLoadingReservations(true);
    setFetchError(null);
    const { data, error } = await supabase.from('reservations').select('*'); 
    if (error) {
      console.error('Error fetching reservations:', error);
      setFetchError(error.message);
    } else if (data) {
      setReservations(data as Reservation[]);
    }
    setIsLoadingReservations(false);
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const handleModalCloseAndRefresh = () => {
    setIsModalOpen(false);
    setReservationToViewOrEdit(null);
    setSelectedDockForNewBooking(null);
    fetchReservations(); // Re-fetch reservations
  };

  const getMonthName = (date: Date): string => date.toLocaleString('default', { month: 'long' });
  const goToPreviousMonth = () => setCurrentDate(prev => { const d = new Date(prev); d.setMonth(d.getMonth() - 1); return d; });
  const goToNextMonth = () => setCurrentDate(prev => { const d = new Date(prev); d.setMonth(d.getMonth() + 1); return d; });
  
  const handleOpenNewBookingModal = (date: Date, dockId: string) => {
    setSelectedDockForNewBooking({ date, dockId });
    setReservationToViewOrEdit(null); // Ensure we are in "new booking" mode
    setIsModalOpen(true);
  };

  const handleViewReservationDetails = (reservation: Reservation) => {
    setReservationToViewOrEdit(reservation);
    setSelectedDockForNewBooking(null); // Ensure we are in "view/edit" mode
    setIsModalOpen(true);
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); 
  const monthName = getMonthName(currentDate);
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const DOCK_LABELS = ["102", "112", "113", "114", "300", "301", "310"];
  const numberOfDaysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); 

  const dayCells = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    dayCells.push(<div key={`empty-${i}`} className="border rounded h-[150px] bg-slate-50"></div>);
  }

  for (let day = 1; day <= numberOfDaysInMonth; day++) {
    const cellDate = new Date(year, month, day);
    dayCells.push(
      <div key={day} className="p-1 border rounded h-[150px] flex flex-col">
        <div className="text-xs font-semibold self-start mb-0.5">{day}</div>
        <div className="flex flex-col space-y-px flex-grow">
          {DOCK_LABELS.map((dockLabel) => {
            const reservation = getReservationForDockOnDate(cellDate, dockLabel, reservations);
            const isAvailable = !reservation;
            return (
              <div
                key={dockLabel}
                className={cn(
                  "h-[17px] w-full rounded-sm text-[10px] px-1 flex items-center justify-between truncate cursor-pointer", // Added cursor-pointer to all
                  isAvailable ? "bg-green-200 text-green-800 hover:bg-green-300" : "bg-red-200 text-red-800 hover:bg-red-300"
                )}
                onClick={() => { 
                  if (isAvailable) {
                    handleOpenNewBookingModal(cellDate, dockLabel);
                  } else if (reservation) { 
                    handleViewReservationDetails(reservation);
                  }
                }}
              >
                <span className="font-medium">{dockLabel}</span>
                {reservation ? (
                  <span className="text-[9px] truncate">{reservation.guest_name}</span>
                ) : (
                  <span className="text-[9px] text-green-700">Avail</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (isLoadingReservations) {
    return <div className="flex justify-center items-center h-screen"><p>Loading reservations...</p></div>;
  }
  if (fetchError) {
    return <div className="flex justify-center items-center h-screen text-red-500"><p>Error loading reservations: {fetchError}</p></div>;
  }

  return (
    <>
      <div className="p-4 bg-white shadow-xl rounded-lg max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Button variant="outline" size="icon" onClick={goToPreviousMonth}><ChevronLeftIcon className="h-4 w-4" /></Button>
          <h2 className="text-2xl font-bold text-gray-700">{monthName} {year}</h2>
          <Button variant="outline" size="icon" onClick={goToNextMonth}><ChevronRightIcon className="h-4 w-4" /></Button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-sm font-semibold text-gray-600 mb-2">
          {daysOfWeek.map((dayOfWeek) => (<div key={dayOfWeek} className="py-2">{dayOfWeek}</div>))}
        </div>
        <div className="grid grid-cols-7 gap-1">{dayCells}</div>
      </div>
      
      {isModalOpen && ( // Conditionally render modal
        <BookingModal
          isOpen={isModalOpen}
          onClose={handleModalCloseAndRefresh}
          selectedDockForNewBooking={selectedDockForNewBooking} // For context when creating new
          existingReservation={reservationToViewOrEdit} // Pass the reservation to view/edit
          onBookingSuccess={handleModalCloseAndRefresh} 
          allReservations={reservations}

        />
      )}
    </>
  );
};
export default MarinaCalendar;