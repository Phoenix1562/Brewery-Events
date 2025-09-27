// components/EventCard.js
import React, { useState, useEffect, useImperativeHandle, forwardRef, useRef } from 'react'; // Added useRef
import { uploadFile, deleteFile } from '../firebase';
import { Paperclip, Calendar as CalendarIcon, Clock, Users, FileText, DollarSign, Info } from 'lucide-react';

// LabeledInput component (remains the same)
function LabeledInput({ label, type, value, onChange, placeholder, disabled, id, icon, ...rest }) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="flex items-center gap-2 text-[0.8rem] font-semibold uppercase tracking-wide text-slate-500"
      >
        {icon && React.cloneElement(icon, { size: 14, className: 'text-slate-400' })}
        <span className="whitespace-normal leading-snug">{label}</span>
      </label>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        disabled={disabled}
        className={`w-full rounded-xl border border-slate-300/80 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.08)] transition-all duration-150 ease-in-out
          focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200/70 placeholder:text-slate-400
          ${disabled ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400' : 'hover:border-slate-300/90'}`}
        {...rest}
      />
    </div>
  );
}

// ToggleInput component
function ToggleInput({ label, checked, onChange, id, disabled, description, className = '' }) {
  const isChecked = Boolean(checked);
  return (
    <label
      htmlFor={id}
      aria-disabled={disabled}
      className={`group flex w-full items-start justify-between gap-4 rounded-xl border px-4 py-3.5 transition ${
        isChecked
          ? 'border-blue-400/80 bg-blue-50/80 shadow-[0_16px_38px_-24px_rgba(37,99,235,0.65)]'
          : 'border-slate-300/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.08)]'
      } ${
        disabled
          ? 'cursor-not-allowed opacity-70'
          : 'cursor-pointer hover:border-blue-300 hover:shadow-lg hover:shadow-blue-200/50'
      } ${className}`}
    >
      <div className="min-w-0">
        <p
          className={`text-sm font-semibold ${
            disabled ? 'text-slate-400' : isChecked ? 'text-blue-700' : 'text-slate-700'
          }`}
        >
          {label}
        </p>
        {description && (
          <p
            className={`mt-1 text-xs ${
              disabled ? 'text-slate-400' : isChecked ? 'text-blue-600/90' : 'text-slate-500'
            }`}
          >
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
          className="absolute h-6 w-11 rounded-full bg-slate-200 transition peer-checked:bg-blue-500 peer-focus:ring-4 peer-focus:ring-blue-200 peer-checked:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.3)]"
          aria-hidden="true"
        ></span>
        <span
          className="absolute left-1 h-4 w-4 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5 peer-checked:bg-white"
          aria-hidden="true"
        ></span>
      </div>
    </label>
  );
}

function SectionCard({ icon: Icon, accentColor = 'bg-slate-100 text-slate-500', title, description, children, className = '' }) {
  const showDescription = Boolean(description);

  return (
    <section
      className={`flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-gradient-to-br from-white via-white to-slate-50 shadow-[0_18px_40px_-20px_rgba(15,23,42,0.35)] backdrop-blur ${className}`}
    >
      <header
        className={`flex items-center gap-4 border-b border-slate-200/80 bg-white/90 px-6 ${showDescription ? 'py-5' : 'py-4'}`}
      >
        {Icon && (
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${accentColor}`}>
            <Icon size={18} />
          </span>
        )}
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          {showDescription && <p className="mt-1 text-sm text-slate-500">{description}</p>}
        </div>
      </header>
      <div className="flex-1 px-6 py-6">{children}</div>
    </section>
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
    <div className="space-y-5">
      <div className="grid gap-6 lg:grid-cols-[1.05fr_1.35fr_0.95fr] lg:gap-8">
        <SectionCard
          icon={Info}
          accentColor="bg-blue-50 text-blue-600"
          title="Event Overview"
          className="lg:col-span-1"
        >
          <div className="grid gap-5 sm:grid-cols-2">
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
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor={`buildingArea-${eventId}`}
                className="text-[0.8rem] font-semibold uppercase tracking-wide text-slate-500"
              >
                Building Area
              </label>
              <select
                id={`buildingArea-${eventId}`}
                value={currentEvent.buildingArea || ''}
                onChange={(e) => handleChange('buildingArea', e.target.value)}
                className="w-full rounded-xl border border-slate-300/80 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.08)] transition-all duration-150 ease-in-out focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200/70 hover:border-slate-300/90"
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
              className="sm:col-span-2"
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
        </SectionCard>

        <SectionCard
          icon={DollarSign}
          accentColor="bg-emerald-50 text-emerald-600"
          title="Payment Tracking"
          className="lg:col-span-1"
        >
          <div className="grid gap-5 sm:grid-cols-2">
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
              className="sm:col-span-2"
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
              className="sm:col-span-2"
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
        </SectionCard>

        <SectionCard
          icon={FileText}
          accentColor="bg-violet-50 text-violet-600"
          title="Notes & Files"
          className="lg:col-span-1"
        >
          <div className="flex h-full flex-col gap-6">
            <div className="flex flex-1 flex-col gap-2">
              <label
                htmlFor={`notes-${eventId}`}
                className="text-[0.8rem] font-semibold uppercase tracking-wide text-slate-500"
              >
                Notes
              </label>
              <textarea
                ref={notesTextareaRef}
                id={`notes-${eventId}`}
                placeholder="Add additional details, client requests, or internal notes..."
                value={currentEvent.notes || ''}
                onChange={(e) => handleChange('notes', e.target.value)}
                className="min-h-[170px] w-full flex-1 resize-none rounded-xl border border-slate-300/80 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-[inset_0_1px_2px_rgba(15,23,42,0.08)] transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200/70 placeholder:text-slate-400"
                rows="3"
              ></textarea>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-600">Attachments</p>
              <label
                htmlFor={`fileUpload-${eventId}`}
                className="relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300/80 bg-slate-50 px-4 py-5 text-center text-sm font-semibold text-slate-500 transition-colors hover:border-blue-300 hover:bg-blue-50/60 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-200/70"
              >
                <span className="flex items-center gap-2 text-blue-600">
                  <Paperclip size={16} className="text-blue-500" />
                  Add files
                </span>
                <span className="text-xs font-normal text-slate-500">
                  Drop documents here or click to browse.
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
                <ul className="max-h-64 divide-y divide-slate-200 overflow-y-auto rounded-xl border border-slate-200 bg-white">
                  {currentEvent.files.map((file, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between gap-3 px-4 py-3 text-sm text-slate-600 transition hover:bg-blue-50/60"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                          <Paperclip size={16} />
                        </span>
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate font-medium text-blue-600 hover:text-blue-700 hover:underline"
                          title={file.name}
                        >
                          {file.name}
                        </a>
                      </div>
                      <button
                        onClick={() => handleDeleteFile(file, index)}
                        className="rounded-full border border-transparent px-3 py-1 text-xs font-semibold text-rose-500 transition hover:border-rose-100 hover:bg-rose-50"
                        title="Delete this file"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

export default forwardRef(EventCard);
