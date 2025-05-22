// src/features/waitlist/WaitlistPage.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Textarea } from '~/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '~/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, // Using original name
  DialogFooter,
  // DialogClose // Not explicitly used for a button here, but good to have if needed
} from '~/components/ui/dialog';
import { supabase } from '~/lib/supabaseClient';
import { format, parseISO } from 'date-fns';
import { Trash2, Edit3 } from 'lucide-react';
import { cn } from '~/lib/utils';

// Ensure these match your ENUM values in Supabase for the 'vehicle_type' ENUM
const vehicleTypeOptions = ['Boat', 'Jet Ski', 'PWC', 'Dinghy', 'Other'];
// Define our standard waitlist statuses
const STATUS_OPTIONS = ['Waiting', 'Contacted', 'Offer Made', 'Accepted - Pending', 'Fulfilled', 'Declined', 'Archived'];

interface WaitlistPageProps {
  waitlistType: string; 
}

// Define the structure for a waitlist entry, matching your Supabase table
interface WaitlistEntry {
  id: number;
  created_at: string;
  waitlist_type: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  boat_name: string | null;
  boat_license: string | null;
  trailer_license_plate: string | null;
  boat_or_jet_ski: string | null;
  boat_width: string | null;
  boat_length: string | null;
  notes: string | null;
  status: string;
}

// Structure for the form data
interface WaitlistFormData {
  name: string;
  phone: string;
  email: string;
  address: string;
  boat_name: string;
  boat_license: string;
  trailer_license_plate: string;
  boat_or_jet_ski: string;
  boat_width: string;
  boat_length: string;
  notes: string;
}

const initialWaitlistFormState: WaitlistFormData = {
  name: '', phone: '', email: '', address: '', boat_name: '', 
  boat_license: '', trailer_license_plate: '', 
  boat_or_jet_ski: vehicleTypeOptions[0], 
  boat_width: '', boat_length: '', notes: '',
};

// Helper function to get color class based on status
const getStatusColorClass = (status: string): string => {
  switch (status?.toLowerCase()) { // Added optional chaining for safety
    case 'waiting':
      return 'text-blue-600 dark:text-blue-400';
    case 'contacted':
    case 'offer made':
      return 'text-orange-600 dark:text-orange-400';
    case 'accepted - pending':
      return 'text-purple-600 dark:text-purple-400';
    case 'fulfilled':
      return 'text-green-600 dark:text-green-400';
    case 'declined':
      return 'text-red-600 dark:text-red-400';
    case 'archived':
      return 'text-gray-500 dark:text-gray-400';
    default:
      return 'text-slate-700 dark:text-slate-300'; 
  }
};


const WaitlistPage: React.FC<WaitlistPageProps> = ({ waitlistType }) => {
  const [formData, setFormData] = useState<WaitlistFormData>(initialWaitlistFormState);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(true);
  const [fetchEntriesError, setFetchEntriesError] = useState<string | null>(null);
  const [processingEntryId, setProcessingEntryId] = useState<number | null>(null);

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [entryToEditStatus, setEntryToEditStatus] = useState<WaitlistEntry | null>(null);
  const [selectedNewStatus, setSelectedNewStatus] = useState<string>('');

  const fetchEntries = async () => {
    setIsLoadingEntries(true);
    setFetchEntriesError(null);
    const { data, error } = await supabase
      .from('waitlist_entries')
      .select('*')
      .eq('waitlist_type', waitlistType) 
      .order('created_at', { ascending: true }); 

    if (error) {
      console.error("Error fetching waitlist entries:", error);
      setFetchEntriesError(`Failed to load entries: ${error.message}`);
    } else if (data) {
      setEntries(data as WaitlistEntry[]);
    }
    setIsLoadingEntries(false);
  };

  useEffect(() => {
    if (waitlistType) { 
        fetchEntries();
    }
  }, [waitlistType]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (fieldName: keyof WaitlistFormData, value: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleAddEntry = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formData.name.trim()) {
      setSubmitStatus({ message: "Name is required.", type: 'error' });
      return;
    }
    setIsSubmittingAdd(true);
    setSubmitStatus(null);
    const newEntry = { ...formData, waitlist_type: waitlistType, status: 'Waiting' };
    const { error } = await supabase.from('waitlist_entries').insert([newEntry]);
    setIsSubmittingAdd(false);
    if (error) {
      setSubmitStatus({ message: `Failed to add entry: ${error.message}`, type: 'error' });
    } else {
      setSubmitStatus({ message: "Entry added successfully!", type: 'success' });
      setFormData(initialWaitlistFormState); 
      fetchEntries(); 
    }
  };

  const handleDeleteEntry = async (entryId: number, entryName: string) => {
    if (processingEntryId === entryId) return; 
    const confirmed = window.confirm(`Are you sure you want to remove "${entryName}" from the ${waitlistType} waitlist?`);
    if (!confirmed) return;
    setProcessingEntryId(entryId);
    setSubmitStatus(null); 
    const { error } = await supabase.from('waitlist_entries').delete().eq('id', entryId);
    setProcessingEntryId(null);
    if (error) {
      setSubmitStatus({ message: `Failed to delete entry: ${error.message}`, type: 'error' });
    } else {
      setSubmitStatus({ message: `Entry for "${entryName}" deleted.`, type: 'success' });
      setEntries(prevEntries => prevEntries.filter(entry => entry.id !== entryId));
    }
  };
  
  const handleOpenStatusEditor = (entry: WaitlistEntry) => {
    setEntryToEditStatus(entry);
    setSelectedNewStatus(entry.status); 
    setIsStatusModalOpen(true);
    setSubmitStatus(null); 
  };

  const handleConfirmStatusUpdate = async () => {
    if (!entryToEditStatus || !selectedNewStatus || processingEntryId) return;

    setProcessingEntryId(entryToEditStatus.id);
    setSubmitStatus(null);

    const { error } = await supabase
      .from('waitlist_entries')
      .update({ status: selectedNewStatus })
      .eq('id', entryToEditStatus.id);

    if (error) {
      console.error("Error updating status:", error);
      setSubmitStatus({ message: `Failed to update status for ${entryToEditStatus.name}: ${error.message}`, type: 'error' });
    } else {
      setSubmitStatus({ message: `Status for ${entryToEditStatus.name} updated to ${selectedNewStatus}.`, type: 'success' });
      // Optimistically update local state
      setEntries(prevEntries => 
        prevEntries.map(entry => 
          entry.id === entryToEditStatus!.id ? { ...entry, status: selectedNewStatus } : entry
        )
      );
      setIsStatusModalOpen(false);
      setEntryToEditStatus(null);
    }
    setProcessingEntryId(null);
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6 text-slate-700">{waitlistType} Waitlist</h1>
      
      {/* Add New Entry Form Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Add New Entry to {waitlistType} Waitlist</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddEntry} className="space-y-4">
            <div><Label htmlFor="name" className="text-sm font-medium">Name*</Label><Input id="name" name="name" value={formData.name} onChange={handleChange} required disabled={isSubmittingAdd} className="mt-1" /></div>
            <div className="grid md:grid-cols-2 gap-4">
              <div><Label htmlFor="phone" className="text-sm font-medium">Phone</Label><Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} disabled={isSubmittingAdd} className="mt-1" /></div>
              <div><Label htmlFor="email" className="text-sm font-medium">Email</Label><Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} disabled={isSubmittingAdd} className="mt-1" /></div>
            </div>
            <div><Label htmlFor="address" className="text-sm font-medium">Address</Label><Input id="address" name="address" value={formData.address} onChange={handleChange} disabled={isSubmittingAdd} className="mt-1" /></div>
            
            <h3 className="text-lg font-semibold pt-4 border-t mt-6 mb-2">Vessel Information</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div><Label htmlFor="boat_name" className="text-sm font-medium">Boat Name</Label><Input id="boat_name" name="boat_name" value={formData.boat_name} onChange={handleChange} disabled={isSubmittingAdd} className="mt-1" /></div>
              <div>
                <Label htmlFor="boat_or_jet_ski" className="text-sm font-medium">Vessel Type</Label>
                <Select name="boat_or_jet_ski" value={formData.boat_or_jet_ski} onValueChange={(value) => handleSelectChange('boat_or_jet_ski', value)} disabled={isSubmittingAdd}>
                  <SelectTrigger className="w-full mt-1"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {vehicleTypeOptions.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div><Label htmlFor="boat_license" className="text-sm font-medium">Boat License</Label><Input id="boat_license" name="boat_license" value={formData.boat_license} onChange={handleChange} disabled={isSubmittingAdd} className="mt-1" /></div>
              <div><Label htmlFor="trailer_license_plate" className="text-sm font-medium">Trailer License</Label><Input id="trailer_license_plate" name="trailer_license_plate" value={formData.trailer_license_plate} onChange={handleChange} disabled={isSubmittingAdd} className="mt-1" /></div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div><Label htmlFor="boat_length" className="text-sm font-medium">Boat Length</Label><Input id="boat_length" name="boat_length" value={formData.boat_length} onChange={handleChange} disabled={isSubmittingAdd} className="mt-1" /></div>
              <div><Label htmlFor="boat_width" className="text-sm font-medium">Boat Width</Label><Input id="boat_width" name="boat_width" value={formData.boat_width} onChange={handleChange} disabled={isSubmittingAdd} className="mt-1" /></div>
            </div>
            
            <div><Label htmlFor="notes" className="text-sm font-medium">Notes</Label><Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={3} disabled={isSubmittingAdd} className="mt-1" /></div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isSubmittingAdd || !formData.name.trim()}>
                {isSubmittingAdd ? 'Adding...' : 'Add to Waitlist'}
              </Button>
            </div>
            {/* Show status for add form only if relevant */}
            {submitStatus && isSubmittingAdd && ( 
              <p className={`text-sm mt-2 ${submitStatus.type === 'error' ? 'text-red-500' : 'text-green-600'}`}>
                {submitStatus.message}
              </p>
            )}
             {submitStatus && !isSubmittingAdd && formData.name === '' && ( // Show after successful add & form reset
              <p className={`text-sm mt-2 ${submitStatus.type === 'error' ? 'text-red-500' : 'text-green-600'}`}>
                {submitStatus.message}
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Current Entries ({entries.length})</CardTitle>
          {isLoadingEntries && <CardDescription className="text-sm">Loading entries...</CardDescription>}
          {fetchEntriesError && <CardDescription className="text-sm text-red-500">{fetchEntriesError}</CardDescription>}
           {/* General status message for delete/update actions on the list, not related to Add form */}
           {submitStatus && !isSubmittingAdd && formData.name !== '' && (
             <p className={`text-sm my-2 p-2 rounded-md ${submitStatus.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {submitStatus.message}
              </p>
          )}
        </CardHeader>
        <CardContent>
          {!isLoadingEntries && !fetchEntriesError && entries.length === 0 && (
            <p className="text-gray-500">No entries on the <span className="font-semibold">{waitlistType}</span> waitlist yet.</p>
          )}
          {entries.length > 0 && (
            <div className="space-y-3">
              {entries.map((entry) => (
                <Card key={entry.id} className={cn("shadow-sm hover:shadow-md transition-shadow", processingEntryId === entry.id && "opacity-50 cursor-wait")}>
                  <CardHeader className="py-3 px-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="text-base font-semibold">{entry.name}</CardTitle>
                            <CardDescription className="text-xs text-gray-500">
                                Added: {format(parseISO(entry.created_at), "MMM d, yy 'at' p")} | Status: <span className={cn("font-medium", getStatusColorClass(entry.status))}>{entry.status}</span>
                            </CardDescription>
                        </div>
                        <div className="flex items-center space-x-1 flex-shrink-0">
                            <Button variant="outline" size="sm" className="h-7 px-2 py-1 text-xs" onClick={() => handleOpenStatusEditor(entry)} disabled={processingEntryId === entry.id}>
                                <Edit3 className="h-3 w-3 mr-1" /> Status
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-slate-500 hover:text-red-600"
                              onClick={() => handleDeleteEntry(entry.id, entry.name)}
                              disabled={processingEntryId === entry.id}
                              aria-label={`Delete entry for ${entry.name}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1.5 px-4 pb-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1">
                        {entry.phone && <p><strong>Phone:</strong> {entry.phone}</p>}
                        {entry.email && <p><strong>Email:</strong> {entry.email}</p>}
                        {entry.boat_or_jet_ski && <p><strong>Vessel:</strong> {entry.boat_or_jet_ski}</p>}
                        {entry.boat_name && <p><strong>Boat Name:</strong> {entry.boat_name}</p>}
                        {entry.boat_length && <p><strong>Length:</strong> {entry.boat_length}</p>}
                        {entry.boat_width && <p><strong>Width:</strong> {entry.boat_width}</p>}
                        {entry.boat_license && <p className="md:col-span-1"><strong>Boat Lic:</strong> {entry.boat_license}</p>}
                        {entry.trailer_license_plate && <p className="md:col-span-2"><strong>Trailer Lic:</strong> {entry.trailer_license_plate}</p>}
                    </div>
                    {entry.address && <p className="mt-2 pt-2 border-t"><strong>Address:</strong> {entry.address}</p>}
                    {entry.notes && <p className="mt-2 pt-2 border-t"><strong>Notes:</strong> <span className="block whitespace-pre-wrap bg-slate-50 p-2 rounded-sm text-slate-700">{entry.notes}</span></p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog for Editing Status */}
      {entryToEditStatus && (
        <Dialog 
            open={isStatusModalOpen} 
            onOpenChange={(open) => {
                if (!open) {
                    setIsStatusModalOpen(false);
                    setEntryToEditStatus(null);
                    setSubmitStatus(null); // Clear specific modal error on close
                }
            }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Update Status for: <span className="font-semibold">{entryToEditStatus.name}</span></DialogTitle>
              <DialogDescription>Current status: <span className={cn("font-medium", getStatusColorClass(entryToEditStatus.status))}>{entryToEditStatus.status}</span></DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-2">
              <Label htmlFor="status-select" className="text-sm font-medium">New Status</Label>
              <Select value={selectedNewStatus} onValueChange={setSelectedNewStatus}>
                <SelectTrigger id="status-select" className="w-full">
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(statusOption => (
                    <SelectItem key={statusOption} value={statusOption}>
                      {statusOption}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Show status update specific error/success within the modal */}
            {submitStatus && entryToEditStatus && processingEntryId === entryToEditStatus.id && (
              <p className={`text-sm -mt-1 mb-2 p-2 rounded-md ${submitStatus.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {submitStatus.message}
              </p>
            )}
             {submitStatus && entryToEditStatus && !processingEntryId && selectedNewStatus === entryToEditStatus.status && ( // If error shown, but not processing and status not changed
              <p className={`text-sm -mt-1 mb-2 p-2 rounded-md ${submitStatus.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {submitStatus.message}
              </p>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsStatusModalOpen(false); setEntryToEditStatus(null); setSubmitStatus(null); }}>Cancel</Button>
              <Button 
                onClick={handleConfirmStatusUpdate} 
                disabled={processingEntryId === entryToEditStatus.id || selectedNewStatus === entryToEditStatus.status || !selectedNewStatus.trim()}
              >
                {processingEntryId === entryToEditStatus.id ? "Updating..." : "Save Status"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default WaitlistPage;