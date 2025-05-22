// components/EventCard.js
import React, { useState, useEffect, useImperativeHandle, forwardRef, useRef } from 'react'; // Added useRef
import { uploadFile, deleteFile } from '../firebase';
import { Paperclip, Calendar as CalendarIcon, Clock, Users, FileText, DollarSign, Info } from 'lucide-react';

// LabeledInput component (remains the same)
function LabeledInput({ label, type, value, onChange, placeholder, disabled, id, icon, ...rest }) {
  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="mb-1.5 text-sm font-medium text-gray-600 flex items-center">
        {icon && React.cloneElement(icon, { size: 14, className: "mr-2 text-gray-400" })}
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        disabled={disabled}
        className={`border border-gray-300 rounded-lg p-2.5 text-sm shadow-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                    transition-colors duration-150 ease-in-out ${
          disabled ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white hover:border-gray-400'
        }`}
        {...rest}
      />
    </div>
  );
}

// CheckboxInput component (remains the same)
function CheckboxInput({ label, checked, onChange, id, disabled, className }) {
    return (
        <div className={`flex items-center ${className}`}>
            <input
                type="checkbox"
                id={id}
                checked={checked}
                onChange={onChange}
                disabled={disabled}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:bg-gray-100 disabled:border-gray-200 disabled:cursor-not-allowed"
            />
            <label htmlFor={id} className={`ml-2 text-sm ${disabled ? 'text-gray-400' : 'text-gray-700'} select-none`}>
                {label}
            </label>
        </div>
    );
}

function EventCard(props, ref) {
  const {
    event,
    onSave,
    setActiveEvent,
  } = props;
  
  const [localEvent, setLocalEvent] = useState(event || {});
  const [isDirty, setIsDirty] = useState(false);
  const notesTextareaRef = useRef(null); // Ref for the notes textarea

  useEffect(() => {
    const initialEvent = event || {};
    setLocalEvent({
        clientName: initialEvent.clientName || '',
        eventName: initialEvent.eventName || '',
        eventDate: initialEvent.eventDate || '',
        buildingArea: initialEvent.buildingArea || '',
        startTime: initialEvent.startTime || '',
        endTime: initialEvent.endTime || '',
        allDay: initialEvent.allDay || false,
        numberOfGuests: initialEvent.numberOfGuests || '',
        priceGiven: initialEvent.priceGiven || '',
        downPaymentRequired: initialEvent.downPaymentRequired || '',
        downPaymentReceived: initialEvent.downPaymentReceived || false,
        downPaymentReceivedDate: initialEvent.downPaymentReceivedDate || '',
        amountPaidAfter: initialEvent.amountPaidAfter || '',
        grandTotal: initialEvent.grandTotal || '',
        securityDeposit: initialEvent.securityDeposit || '',
        finalPaymentReceived: initialEvent.finalPaymentReceived || false,
        finalPaymentReceivedDate: initialEvent.finalPaymentReceivedDate || '',
        notes: initialEvent.notes || '',
        files: Array.isArray(initialEvent.files) ? initialEvent.files : [],
        ...initialEvent,
    });
    setIsDirty(false);
  }, [event]);

  // Effect to auto-adjust textarea height
  useEffect(() => {
    if (notesTextareaRef.current) {
      const textarea = notesTextareaRef.current;
      textarea.style.height = 'auto'; // Reset height to accurately calculate scrollHeight
      textarea.style.height = `${textarea.scrollHeight}px`; // Set height to scrollHeight
      textarea.style.overflowY = 'hidden'; // Hide scrollbar
    }
  }, [localEvent.notes]); // Re-run when notes content changes

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleChange = (field, value) => {
    setLocalEvent((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  // ... (handleFileUpload, handleDeleteFile, internalSave, internalClose, useImperativeHandle remain the same)
  const handleFileUpload = async (e) => {
    const filesToUpload = Array.from(e.target.files);
    if (!filesToUpload.length) return;
    for (const file of filesToUpload) {
      try {
        const uploaded = await uploadFile(file, localEvent.id);
        setLocalEvent((prev) => ({
          ...prev,
          files: Array.isArray(prev.files) ? [...prev.files, uploaded] : [uploaded],
        }));
        setIsDirty(true);
      } catch (err) {
        console.error('File upload failed', err);
        alert('Failed to upload file: ' + file.name);
      }
    }
  };

  const handleDeleteFile = async (file, index) => {
    if (window.confirm(`Are you sure you want to delete the file "${file.name}"?`)) {
      try {
        await deleteFile(file.path);
        const updatedEventData = {
          ...localEvent,
          files: localEvent.files.filter((_, i) => i !== index),
        };
        setLocalEvent(updatedEventData);
        if (onSave) {
          await onSave(updatedEventData);
        } else {
          setIsDirty(true);
        }
      } catch (err) {
        console.error('Failed to delete file', err);
        alert('Failed to delete file: ' + file.name);
      }
    }
  };

  const internalSave = () => {
    if (onSave) {
      onSave(localEvent);
      setIsDirty(false);
    }
  };

  const internalClose = () => {
    if (isDirty && onSave) {
      internalSave();
    }
    if (setActiveEvent) setActiveEvent(null);
  };

  useImperativeHandle(ref, () => ({
    handleClose: internalClose,
    triggerSave: () => {
      if (isDirty) {
        internalSave();
      } else {
        console.log("No changes to save.");
      }
    },
    isDirty: () => isDirty,
  }));
  
  const currentEvent = localEvent || {};
  const eventId = currentEvent.id || 'new-event';

  return (
    <div className="space-y-8">
      {/* Event Details Section */}
      <section>
        <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b border-gray-200 pb-2 flex items-center">
            <Info size={20} className="mr-2 text-blue-600"/> Event Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
          {/* ... other LabeledInput and CheckboxInput fields ... */}
          <LabeledInput
            id={`clientName-${eventId}`}
            label="Client Name"
            type="text"
            value={currentEvent.clientName || ''}
            onChange={(e) => handleChange('clientName', e.target.value)}
            placeholder="Client's full name"
          />
          <LabeledInput
            id={`eventName-${eventId}`}
            label="Event Name"
            type="text"
            value={currentEvent.eventName || ''}
            onChange={(e) => handleChange('eventName', e.target.value)}
            placeholder="Brief name for the event"
          />
          <LabeledInput
            id={`eventDate-${eventId}`}
            label="Event Date"
            type="date"
            icon={<CalendarIcon />}
            value={currentEvent.eventDate || ''}
            onChange={(e) => handleChange('eventDate', e.target.value)}
          />
          <div>
            <label htmlFor={`buildingArea-${eventId}`} className="mb-1.5 block text-sm font-medium text-gray-600">Building Area</label>
            <select
              id={`buildingArea-${eventId}`}
              value={currentEvent.buildingArea || ''}
              onChange={(e) => handleChange('buildingArea', e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400"
            >
              <option value="">Select venue</option>
              <option value="Brewhouse">Brewhouse</option>
              <option value="Taphouse">Taphouse</option>
              <option value="Hall">Hall</option>
            </select>
          </div>
          <LabeledInput
            id={`startTime-${eventId}`}
            label="Start Time"
            type="time"
            icon={<Clock />}
            value={currentEvent.startTime || ''}
            onChange={(e) => handleChange('startTime', e.target.value)}
            disabled={currentEvent.allDay || false}
          />
          <LabeledInput
            id={`endTime-${eventId}`}
            label="End Time"
            type="time"
            icon={<Clock />}
            value={currentEvent.endTime || ''}
            onChange={(e) => handleChange('endTime', e.target.value)}
            disabled={currentEvent.allDay || false}
          />
          <CheckboxInput
            id={`allDay-${eventId}`}
            label="All Day Event"
            checked={currentEvent.allDay || false}
            onChange={(e) => handleChange('allDay', e.target.checked)}
            className="md:mt-7" 
          />
          <LabeledInput
            id={`numberOfGuests-${eventId}`}
            label="Number of Guests"
            type="number"
            icon={<Users />}
            value={currentEvent.numberOfGuests || ''}
            onChange={(e) => handleChange('numberOfGuests', e.target.value)}
            placeholder="e.g., 50"
            min="0"
          />
        </div>
      </section>

      {/* Payment Details Section */}
      <section>
        <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b border-gray-200 pb-2 flex items-center">
            <DollarSign size={20} className="mr-2 text-green-600"/> Payment Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
         {/* ... other payment fields ... */}
          <LabeledInput
            id={`priceGiven-${eventId}`}
            label="Price Given ($)"
            type="number"
            value={currentEvent.priceGiven || ''}
            onChange={(e) => handleChange('priceGiven', e.target.value)}
            placeholder="0.00" min="0" step="0.01"
          />
          <LabeledInput
            id={`downPaymentRequired-${eventId}`}
            label="Down Payment Required ($)"
            type="number"
            value={currentEvent.downPaymentRequired || ''}
            onChange={(e) => handleChange('downPaymentRequired', e.target.value)}
            placeholder="0.00" min="0" step="0.01"
          />
          <CheckboxInput
            id={`downPaymentReceived-${eventId}`}
            label="Down Payment Received"
            checked={currentEvent.downPaymentReceived || false}
            onChange={(e) => handleChange('downPaymentReceived', e.target.checked)}
            className="md:mt-7"
          />
          <LabeledInput
            id={`downPaymentReceivedDate-${eventId}`}
            label="Down Payment Received Date"
            type="date"
            icon={<CalendarIcon />}
            value={currentEvent.downPaymentReceivedDate || ''}
            onChange={(e) => handleChange('downPaymentReceivedDate', e.target.value)}
            disabled={!currentEvent.downPaymentReceived} 
          />
          <LabeledInput
            id={`amountPaidAfter-${eventId}`}
            label="Food/Beverage/Other Costs ($)"
            type="number"
            value={currentEvent.amountPaidAfter || ''}
            onChange={(e) => handleChange('amountPaidAfter', e.target.value)}
            placeholder="0.00" min="0" step="0.01"
          />
          <LabeledInput
            id={`grandTotal-${eventId}`}
            label="Grand Total ($)"
            type="number"
            value={currentEvent.grandTotal || ''}
            onChange={(e) => handleChange('grandTotal', e.target.value)}
            placeholder="0.00" min="0" step="0.01"
          />
          <LabeledInput
            id={`securityDeposit-${eventId}`}
            label="Security Deposit ($)"
            type="number"
            value={currentEvent.securityDeposit || ''}
            onChange={(e) => handleChange('securityDeposit', e.target.value)}
            placeholder="0.00" min="0" step="0.01"
          />
          <div className="md:col-span-1"></div> 

          <CheckboxInput
            id={`finalPaymentReceived-${eventId}`}
            label="Final Payment Received"
            checked={currentEvent.finalPaymentReceived || false}
            onChange={(e) => handleChange('finalPaymentReceived', e.target.checked)}
            className="md:mt-7"
          />
          <LabeledInput
            id={`finalPaymentReceivedDate-${eventId}`}
            label="Final Payment Received Date"
            type="date"
            icon={<CalendarIcon />}
            value={currentEvent.finalPaymentReceivedDate || ''}
            onChange={(e) => handleChange('finalPaymentReceivedDate', e.target.value)}
            disabled={!currentEvent.finalPaymentReceived}
          />
        </div>
      </section>

      {/* Attachments & Notes Section */}
      <section>
         <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b border-gray-200 pb-2 flex items-center">
            <FileText size={20} className="mr-2 text-purple-600"/> Notes & Attachments
        </h3>
        <div className="space-y-5">
          <div>
            <label htmlFor={`notes-${eventId}`} className="mb-1.5 block text-sm font-medium text-gray-600">Notes</label>
            <textarea
              ref={notesTextareaRef} // Assign the ref here
              id={`notes-${eventId}`}
              placeholder="Add additional details, client requests, or internal notes..."
              value={currentEvent.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 min-h-[80px] resize-none" // Adjusted min-h, added resize-none
              rows="3" // Initial rows, JS will override height
            ></textarea>
          </div>
          {/* ... File upload and list remains the same ... */}
          <div>
            <h4 className="text-md font-medium text-gray-600 mb-2">Attachments</h4>
            <label htmlFor={`fileUpload-${eventId}`} className="w-full text-sm text-gray-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border-2 border-dashed border-gray-300 p-6 rounded-lg flex flex-col items-center justify-center hover:border-blue-500 transition-colors focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                <Paperclip size={28} className="text-gray-400 mb-2"/>
                <span className="font-medium text-blue-600">Click to browse</span>
                <span className="text-xs text-gray-500 mt-1">or drag and drop files here</span>
                <input
                    id={`fileUpload-${eventId}`}
                    type="file"
                    onChange={handleFileUpload}
                    className="opacity-0 absolute h-0 w-0"
                    multiple
                />
            </label>
            
            {currentEvent.files && currentEvent.files.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-500 mb-2">Uploaded files:</p>
                <ul className="space-y-2">
                  {currentEvent.files.map((file, index) => (
                    <li key={index} className="flex items-center justify-between group bg-gray-100 p-2.5 pl-3 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow text-sm">
                      <div className="flex items-center min-w-0">
                        <Paperclip size={16} className="text-gray-400 mr-2 flex-shrink-0" />
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 hover:underline truncate"
                          title={file.name}
                        >
                          {file.name}
                        </a>
                      </div>
                      <button
                        onClick={() => handleDeleteFile(file, index)}
                        className="text-red-500 text-xs ml-3 p-1.5 rounded-md hover:bg-red-100 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity font-medium"
                        title="Delete this file"
                      >
                        Delete
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default forwardRef(EventCard);