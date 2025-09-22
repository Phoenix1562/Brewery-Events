// components/EventCard.js
import React, { useState, useEffect, useImperativeHandle, forwardRef, useRef } from 'react'; // Added useRef
import { uploadFile, deleteFile } from '../firebase';
import { Paperclip, Calendar as CalendarIcon, Clock, Users, FileText, DollarSign, Info } from 'lucide-react';

// LabeledInput component (remains the same)
function LabeledInput({ label, type, value, onChange, placeholder, disabled, id, icon, ...rest }) {
  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="mb-2 text-sm font-semibold text-gray-700 flex items-center">
        {icon && React.cloneElement(icon, { size: 14, className: 'mr-2 text-gray-400' })}
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        disabled={disabled}
        className={`w-full rounded-xl border border-gray-200 bg-gray-50/70 p-3 text-sm shadow-sm transition-colors duration-150 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/80 focus:bg-white
          ${disabled ? 'bg-gray-100 cursor-not-allowed text-gray-500 border-gray-200' : 'hover:border-gray-300'}`}
        {...rest}
      />
    </div>
  );
}

// ToggleInput component
function ToggleInput({ label, checked, onChange, id, disabled, description, className = '' }) {
  return (
    <label
      htmlFor={id}
      aria-disabled={disabled}
      className={`group flex w-full items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white/70 p-4 shadow-sm transition ${
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-blue-200'
      } ${className}`}
    >
      <div className="min-w-0">
        <p className={`text-sm font-semibold ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>{label}</p>
        {description && (
          <p className="mt-1 text-xs text-gray-500">
            {description}
          </p>
        )}
      </div>
      <div
        className={`relative inline-flex h-6 w-11 shrink-0 items-center justify-center rounded-full transition ${
          disabled ? 'cursor-not-allowed' : 'cursor-pointer group-hover:scale-[1.02]'
        }`}
      >
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="peer sr-only"
        />
        <span
          className="absolute h-6 w-11 rounded-full bg-gray-200 transition peer-checked:bg-blue-500 peer-focus:ring-4 peer-focus:ring-blue-200"
          aria-hidden="true"
        ></span>
        <span
          className="absolute left-1 h-4 w-4 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5"
          aria-hidden="true"
        ></span>
      </div>
    </label>
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
        console.log('No changes to save.');
      }
    },
    isDirty: () => isDirty,
  }));

  const currentEvent = localEvent || {};
  const eventId = currentEvent.id || 'new-event';

  return (
    <div className="grid items-start gap-7 md:auto-rows-fr md:grid-cols-2 lg:gap-8 lg:grid-cols-3 xl:grid-cols-[1.18fr_1.18fr_0.98fr]">
      <section className="flex h-full flex-col rounded-[28px] border border-gray-100 bg-white/95 p-6 shadow-md md:p-7 xl:p-8">
        <header className="mb-7 flex items-center gap-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <Info size={20} />
          </span>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Event Details</h3>
            <p className="text-sm text-gray-500">
              Key information about when and where the event takes place.
            </p>
          </div>
        </header>
        <div className="grid flex-1 grid-cols-1 gap-x-8 gap-y-6 lg:gap-y-7 xl:grid-cols-2">
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
            <label
              htmlFor={`buildingArea-${eventId}`}
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Building Area
            </label>
            <select
              id={`buildingArea-${eventId}`}
              value={currentEvent.buildingArea || ''}
              onChange={(e) => handleChange('buildingArea', e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/70 p-3 text-sm shadow-sm transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/80 focus:bg-white hover:border-gray-300"
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
          <ToggleInput
            id={`allDay-${eventId}`}
            label="All-day event"
            checked={currentEvent.allDay || false}
            onChange={(e) => handleChange('allDay', e.target.checked)}
            description="Blocks out start and end times for the full day."
            className="xl:col-span-2"
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

      <section className="flex h-full flex-col rounded-[28px] border border-gray-100 bg-white/95 p-6 shadow-md md:p-7 xl:p-8">
        <header className="mb-7 flex items-center gap-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <DollarSign size={20} />
          </span>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Payment Details</h3>
            <p className="text-sm text-gray-500">
              Track invoices, deposits, and outstanding balances at a glance.
            </p>
          </div>
        </header>
        <div className="grid flex-1 grid-cols-1 gap-x-8 gap-y-6 lg:gap-y-7 xl:grid-cols-2">
          <LabeledInput
            id={`priceGiven-${eventId}`}
            label="Price Given ($)"
            type="number"
            value={currentEvent.priceGiven || ''}
            onChange={(e) => handleChange('priceGiven', e.target.value)}
            placeholder="0.00"
            min="0"
            step="0.01"
          />
          <LabeledInput
            id={`downPaymentRequired-${eventId}`}
            label="Down Payment Required ($)"
            type="number"
            value={currentEvent.downPaymentRequired || ''}
            onChange={(e) => handleChange('downPaymentRequired', e.target.value)}
            placeholder="0.00"
            min="0"
            step="0.01"
          />
          <ToggleInput
            id={`downPaymentReceived-${eventId}`}
            label="Deposit received"
            checked={currentEvent.downPaymentReceived || false}
            onChange={(e) => handleChange('downPaymentReceived', e.target.checked)}
            description="Keep track of when the initial payment arrives."
            className="xl:col-span-2"
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
            placeholder="0.00"
            min="0"
            step="0.01"
          />
          <LabeledInput
            id={`grandTotal-${eventId}`}
            label="Grand Total ($)"
            type="number"
            value={currentEvent.grandTotal || ''}
            onChange={(e) => handleChange('grandTotal', e.target.value)}
            placeholder="0.00"
            min="0"
            step="0.01"
          />
          <LabeledInput
            id={`securityDeposit-${eventId}`}
            label="Security Deposit ($)"
            type="number"
            value={currentEvent.securityDeposit || ''}
            onChange={(e) => handleChange('securityDeposit', e.target.value)}
            placeholder="0.00"
            min="0"
            step="0.01"
          />
          <ToggleInput
            id={`finalPaymentReceived-${eventId}`}
            label="Final payment received"
            checked={currentEvent.finalPaymentReceived || false}
            onChange={(e) => handleChange('finalPaymentReceived', e.target.checked)}
            description="Confirm when the closing balance has been paid."
            className="xl:col-span-2"
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

      <section className="flex h-full flex-col rounded-[28px] border border-gray-100 bg-white/95 p-6 shadow-md md:col-span-2 md:p-7 lg:col-span-1 xl:p-8">
        <header className="mb-7 flex items-center gap-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-purple-50 text-purple-600">
            <FileText size={20} />
          </span>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Notes & Attachments</h3>
            <p className="text-sm text-gray-500">
              Keep everyone aligned with the latest context and paperwork.
            </p>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6">
          <div className="flex flex-1 flex-col">
            <label
              htmlFor={`notes-${eventId}`}
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Notes
            </label>
            <textarea
              ref={notesTextareaRef}
              id={`notes-${eventId}`}
              placeholder="Add additional details, client requests, or internal notes..."
              value={currentEvent.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="min-h-[170px] w-full flex-1 resize-none rounded-2xl border border-gray-200 bg-gray-50/70 p-3 text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/80 focus:bg-white hover:border-gray-300"
              rows="3"
            ></textarea>
          </div>
          <div className="flex flex-col">
            <h4 className="mb-3 text-sm font-semibold text-gray-700">Attachments</h4>
            <label
              htmlFor={`fileUpload-${eventId}`}
              className="relative flex w-full cursor-pointer flex-wrap items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 bg-white/80 px-3 py-2 text-[11px] text-gray-600 transition-colors hover:border-blue-400 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-500/30"
            >
              <span className="flex items-center gap-1.5 text-blue-600 text-xs font-semibold">
                <Paperclip size={16} className="text-blue-500" />
                Add files
              </span>
              <span className="text-[10px] text-gray-500 leading-tight text-center">
                Drag and drop or click to attach supporting docs.
              </span>
              <input
                id={`fileUpload-${eventId}`}
                type="file"
                onChange={handleFileUpload}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                multiple
              />
            </label>

            {currentEvent.files && currentEvent.files.length > 0 && (
              <div className="mt-4 max-h-56 overflow-y-auto rounded-2xl border border-gray-200 bg-gray-50/80 p-4">
                <p className="mb-3 text-sm font-medium text-gray-600">Uploaded files</p>
                <ul className="space-y-2.5">
                  {currentEvent.files.map((file, index) => (
                    <li
                      key={index}
                      className="group flex items-center justify-between rounded-xl border border-transparent bg-white/80 px-3 py-2 text-sm shadow-sm transition hover:border-blue-200 hover:bg-blue-50/50"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                          <Paperclip size={16} />
                        </span>
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate text-blue-600 hover:text-blue-700 hover:underline"
                          title={file.name}
                        >
                          {file.name}
                        </a>
                      </div>
                      <button
                        onClick={() => handleDeleteFile(file, index)}
                        className="ml-3 rounded-lg px-2 py-1 text-xs font-medium text-red-500 transition hover:bg-red-100"
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
