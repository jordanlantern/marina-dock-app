// src/features/booking/BookingModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Textarea } from '~/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '~/components/ui/select';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '~/components/ui/popover';
import { Calendar } from '~/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format, addDays, isValid, isBefore, parseISO, eachDayOfInterval } from 'date-fns';
import { cn } from '~/lib/utils';
import { supabase } from '~/lib/supabaseClient';
import type { Reservation } from '../calendar/MarinaCalendar';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDockForNewBooking: { date: Date; dockId: string } | null;
  existingReservation: Reservation | null;
  onBookingSuccess: () => void;
  allReservations: Reservation[];
}

const createFormState = (initialDateContext?: Date | null, reservation?: Reservation | null) => {
  if (reservation) {
    return {
      guestName: reservation.guest_name || '',
      boatType: reservation.boat_type || '',
      boatLength: reservation.boat_length || '',
      boatWidth: reservation.boat_width || '',
      email: reservation.email || '',
      phoneNumber: reservation.phone_number || '',
      paymentStatus: reservation.payment_status || 'Not Paid Yet',
      notes: reservation.notes || '',
      startDate: reservation.start_date ? parseISO(reservation.start_date) : (initialDateContext || new Date()),
      endDate: reservation.end_date ? parseISO(reservation.end_date) : addDays(initialDateContext || new Date(), 1),
    };
  }
  const startDate = initialDateContext && isValid(initialDateContext) ? initialDateContext : new Date();
  return {
    guestName: '', boatLength: '', boatType: '', email: '', phoneNumber: '',
    boatWidth: '', notes: '', paymentStatus: 'Not Paid Yet',
    startDate: startDate, endDate: addDays(startDate, 1),
  };
};

const normalizeDateToMidnight = (date: Date): Date => {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

const getReservationOnDateExcludingCurrent = (
  targetDate: Date,
  dockId: string,
  reservations: Reservation[],
  excludeReservationId?: number | string | null
): Reservation | undefined => {
  const normalizedTarget = normalizeDateToMidnight(targetDate).getTime();
  for (const res of reservations) {
    if (res.dock_id === dockId && res.id !== excludeReservationId) {
      const resStart = normalizeDateToMidnight(new Date(res.start_date + "T00:00:00Z")).getTime();
      const resEnd = normalizeDateToMidnight(new Date(res.end_date + "T00:00:00Z")).getTime();
      if (normalizedTarget >= resStart && normalizedTarget <= resEnd) {
        return res;
      }
    }
  }
  return undefined;
};

const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  selectedDockForNewBooking,
  existingReservation,
  onBookingSuccess,
  allReservations
}) => {
  const [formData, setFormData] = useState(() =>
    createFormState(selectedDockForNewBooking?.date, existingReservation)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const isViewOrEditMode = !!existingReservation;

  useEffect(() => {
    console.log("Modal isOpen:", isOpen, "ExistingRes:", existingReservation, "NewBookingCtx:", selectedDockForNewBooking);
    if (isOpen) {
      if (existingReservation) {
        console.log("Setting form for existing reservation:", existingReservation);
        setFormData(createFormState(null, existingReservation));
        setIsEditing(false);
      } else if (selectedDockForNewBooking) {
        console.log("Setting form for new booking:", selectedDockForNewBooking);
        setFormData(createFormState(selectedDockForNewBooking.date, null));
        setIsEditing(false);
      }
    }
    setSubmitError(null);
  }, [isOpen, selectedDockForNewBooking, existingReservation]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePaymentStatusChange = (value: string) => {
    setFormData(prev => ({ ...prev, paymentStatus: value }));
  };

  const handleDateChange = (fieldName: 'startDate' | 'endDate', date: Date | undefined) => {
    if (date && isValid(date)) {
      setFormData(prev => {
        const newFormData = { ...prev, [fieldName]: date };
        if (fieldName === 'startDate' && newFormData.endDate && isBefore(newFormData.endDate, date)) {
          newFormData.endDate = addDays(date, 1);
        }
        return newFormData;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    console.log("handleSubmit called. isViewOrEditMode:", isViewOrEditMode, "isEditing:", isEditing, "Form Data:", formData);


    if (formData.startDate && formData.endDate && isBefore(formData.endDate, formData.startDate)) {
        setSubmitError("End date cannot be before start date.");
        setIsSubmitting(false);
        return;
    }

    const dockIdForOperation = existingReservation?.dock_id || selectedDockForNewBooking?.dockId;
    if (!dockIdForOperation) {
        setSubmitError("Critical error: Dock ID is missing for the operation.");
        setIsSubmitting(false);
        return;
    }

    if (formData.startDate && formData.endDate && isValid(formData.startDate) && isValid(formData.endDate)) {
        const daysInProposedInterval = eachDayOfInterval({ start: formData.startDate, end: formData.endDate });
        for (const dayToCheck of daysInProposedInterval) {
            const conflictingReservation = getReservationOnDateExcludingCurrent(
                dayToCheck,
                dockIdForOperation,
                allReservations,
                existingReservation?.id
            );
            if (conflictingReservation) {
                setSubmitError(`Date conflict: Dock ${dockIdForOperation} is already booked on ${format(dayToCheck, "PPP")} by ${conflictingReservation.guest_name}.`);
                setIsSubmitting(false);
                return;
            }
        }
    } else {
        setSubmitError("Invalid start or end date for conflict checking.");
        setIsSubmitting(false);
        return;
    }

    if (isViewOrEditMode && isEditing) {
      if (!existingReservation || !existingReservation.id) {
        setSubmitError("No reservation ID found to update.");
        setIsSubmitting(false);
        return;
      }
      const reservationToUpdate = {
        guest_name: formData.guestName,
        start_date: format(formData.startDate, 'yyyy-MM-dd'),
        end_date: format(formData.endDate, 'yyyy-MM-dd'),
        boat_type: formData.boatType,
        boat_length: formData.boatLength,
        boat_width: formData.boatWidth,
        email: formData.email,
        phone_number: formData.phoneNumber,
        payment_status: formData.paymentStatus,
        notes: formData.notes,
      };
      console.log('Attempting to UPDATE reservation in Supabase (ID:', existingReservation.id, '):', reservationToUpdate);
      const { data, error } = await supabase
        .from('reservations')
        .update(reservationToUpdate)
        .eq('id', existingReservation.id)
        .select();
      setIsSubmitting(false);
      if (error) {
        console.error('Supabase error updating reservation:', error);
        setSubmitError(`Failed to update reservation: ${error.message}.`);
      } else {
        console.log('Reservation updated successfully in Supabase:', data);
        setIsEditing(false);
        onBookingSuccess();
        onClose();
      }
    } else if (!isViewOrEditMode) {
      const reservationToInsert = {
        dock_id: dockIdForOperation,
        start_date: format(formData.startDate, 'yyyy-MM-dd'),
        end_date: format(formData.endDate, 'yyyy-MM-dd'),
        guest_name: formData.guestName,
        boat_type: formData.boatType,
        boat_length: formData.boatLength,
        boat_width: formData.boatWidth,
        email: formData.email,
        phone_number: formData.phoneNumber,
        payment_status: formData.paymentStatus,
        notes: formData.notes,
      };
      console.log('Attempting to INSERT new reservation into Supabase:', reservationToInsert);
      const { error: insertError } = await supabase.from('reservations').insert([reservationToInsert]);
      setIsSubmitting(false);
      if (insertError) {
        console.error('Supabase error inserting new reservation:', insertError);
        setSubmitError(`Failed to save new reservation: ${insertError.message}.`);
      } else {
        console.log('New reservation saved successfully to Supabase!');
        onBookingSuccess();
        onClose();
      }
    } else {
      console.log("handleSubmit: Neither edit nor new booking mode. Closing.");
      setIsSubmitting(false);
      onClose();
    }
  };

  const handleCloseDialog = () => {
    console.log("handleCloseDialog called");
    setIsEditing(false);
    onClose();
  };

  const handleEditClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    console.log("handleEditClick CALLED - setting isEditing to true");
    setIsEditing(true);
  };

  const handleCancelEditClick = () => {
    console.log("handleCancelEditClick called");
    setIsEditing(false);
    if (existingReservation) {
      setFormData(createFormState(null, existingReservation));
    }
    setSubmitError(null);
  };

  const handleCancelReservation = async () => {
    if (!existingReservation || !existingReservation.id) {
      setSubmitError("No reservation selected to cancel.");
      return;
    }
    const confirmed = window.confirm(
      `Are you sure you want to cancel the reservation for ${existingReservation.guest_name} on Dock ${existingReservation.dock_id} (ID: ${existingReservation.id})? This action cannot be undone.`
    );
    if (!confirmed) return;
    setIsSubmitting(true);
    setSubmitError(null);
    const { error } = await supabase
      .from('reservations')
      .delete()
      .eq('id', existingReservation.id);
    setIsSubmitting(false);
    if (error) {
      setSubmitError(`Failed to cancel reservation: ${error.message}.`);
    } else {
      onBookingSuccess();
      onClose();
    }
  };

  if (!isOpen) return null;

  const displayDockId = existingReservation?.dock_id || selectedDockForNewBooking?.dockId || "N/A";
  const dialogTitle = isViewOrEditMode
    ? (isEditing ? `Edit Reservation - Dock ${displayDockId}` : `View Reservation - Dock ${displayDockId}`)
    : `Book Dock ${displayDockId}`;

  let dialogDescriptionText = `New reservation for Dock ${displayDockId}`;
  if (isViewOrEditMode && formData.startDate && isValid(formData.startDate)) {
    dialogDescriptionText = `Details for reservation starting ${format(formData.startDate, "PPP")}`;
    if (isEditing) {
        dialogDescriptionText = `Editing reservation starting ${format(formData.startDate, "PPP")}`;
    }
  } else if (!isViewOrEditMode && formData.startDate && isValid(formData.startDate)) {
    dialogDescriptionText = `New reservation for Dock ${displayDockId} starting on ${format(formData.startDate, "PPP")}`;
  }

  const currentCalendarDefaultMonth = formData.startDate && isValid(formData.startDate) ? formData.startDate : new Date();

  return (
    <Dialog open={isOpen} onOpenChange={(openState) => { if (!openState) { handleCloseDialog(); } }}>
      <DialogContent
        className="sm:max-w-lg w-[95vw] max-h-[90vh] flex flex-col"
        onPointerDownOutside={(event) => {
          const target = event.target as HTMLElement;
          if (target.closest('[aria-haspopup="dialog"]')) {
            event.preventDefault();
          }
        }}
        onInteractOutside={(event) => {
          const target = event.target as HTMLElement;
          if (target.closest('[aria-haspopup="dialog"]')) {
            event.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescriptionText}</DialogDescription>
        </DialogHeader>

        <form id="booking-form" onSubmit={handleSubmit} className="space-y-4 py-2 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate-btn">Start Date</Label>
              <Popover modal={true}>
                <PopoverTrigger asChild>
                  <Button id="startDate-btn" variant="outline" className={cn("w-full justify-start text-left font-normal mt-1", !formData.startDate && "text-muted-foreground")} disabled={isViewOrEditMode && !isEditing}>
                    <CalendarIcon className="mr-2 h-4 w-4" />{formData.startDate && isValid(formData.startDate) ? format(formData.startDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                {(!isViewOrEditMode || isEditing) &&
                  <PopoverContent className="w-auto p-0 z-[60]" align="start">
                    <Calendar mode="single" selected={formData.startDate} onSelect={(date) => handleDateChange('startDate', date)} initialFocus defaultMonth={currentCalendarDefaultMonth} />
                  </PopoverContent>
                }
              </Popover>
            </div>
            <div>
              <Label htmlFor="endDate-btn">End Date</Label>
              <Popover modal={true}>
                <PopoverTrigger asChild>
                  <Button id="endDate-btn" variant="outline" className={cn("w-full justify-start text-left font-normal mt-1", !formData.endDate && "text-muted-foreground")} disabled={isViewOrEditMode && !isEditing}>
                    <CalendarIcon className="mr-2 h-4 w-4" />{formData.endDate && isValid(formData.endDate) ? format(formData.endDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                {(!isViewOrEditMode || isEditing) &&
                  <PopoverContent className="w-auto p-0 z-[60]" align="start">
                    <Calendar mode="single" selected={formData.endDate} onSelect={(date) => handleDateChange('endDate', date)} disabled={(date) => formData.startDate && isValid(formData.startDate) ? isBefore(date, formData.startDate) : false} initialFocus defaultMonth={formData.startDate || currentCalendarDefaultMonth} />
                  </PopoverContent>
                }
              </Popover>
            </div>
          </div>

          <div><Label htmlFor="guestName">Guest Name</Label><Input id="guestName" name="guestName" value={formData.guestName} onChange={handleChange} className="mt-1" disabled={isViewOrEditMode && !isEditing} /></div>
          <div><Label htmlFor="boatType">Boat Type</Label><Input id="boatType" name="boatType" value={formData.boatType} onChange={handleChange} className="mt-1" disabled={isViewOrEditMode && !isEditing} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label htmlFor="boatLength">Boat Length</Label><Input id="boatLength" name="boatLength" value={formData.boatLength} onChange={handleChange} className="mt-1" disabled={isViewOrEditMode && !isEditing} /></div>
            <div><Label htmlFor="boatWidth">Boat Width</Label><Input id="boatWidth" name="boatWidth" value={formData.boatWidth} onChange={handleChange} className="mt-1" disabled={isViewOrEditMode && !isEditing} /></div>
          </div>
          <div><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} className="mt-1" disabled={isViewOrEditMode && !isEditing} /></div>
          <div><Label htmlFor="phoneNumber">Phone</Label><Input id="phoneNumber" name="phoneNumber" type="tel" value={formData.phoneNumber} onChange={handleChange} className="mt-1" disabled={isViewOrEditMode && !isEditing} /></div>
          <div>
            <Label htmlFor="paymentStatus">Payment</Label>
            <Select name="paymentStatus" value={formData.paymentStatus} onValueChange={handlePaymentStatusChange} disabled={isViewOrEditMode && !isEditing}>
              <SelectTrigger className="w-full mt-1"><SelectValue placeholder="Select payment status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Not Paid Yet">Not Paid Yet</SelectItem><SelectItem value="Deposit Paid">50% Deposit Paid</SelectItem><SelectItem value="Paid in Full">Paid in Full</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label htmlFor="notes">Notes</Label><Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} className="mt-1" rows={3} disabled={isViewOrEditMode && !isEditing} /></div>
        </form>

        {submitError && (<p className="text-sm text-red-500 p-2 bg-red-50 rounded-md my-2">{submitError}</p>)}

        <DialogFooter>
          {isViewOrEditMode ? (
            isEditing ? (
              <>
                <Button type="button" variant="outline" onClick={handleCancelEditClick} disabled={isSubmitting}>Cancel Edit</Button>
                <Button type="submit" form="booking-form" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="destructive" onClick={handleCancelReservation} disabled={isSubmitting} className="mr-auto">
                  Cancel Reservation
                </Button>
                <Button type="button" variant="outline" onClick={handleCloseDialog} className="ml-2">Close</Button>
                <Button type="button" onClick={(e) => handleEditClick(e)}>Edit Reservation</Button>
              </>
            )
          ) : (
            <>
              <Button type="button" variant="outline" onClick={handleCloseDialog} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" form="booking-form" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Reservation'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BookingModal;