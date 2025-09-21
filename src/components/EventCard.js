// components/EventCard.js
import React, { useState, useEffect, useImperativeHandle, forwardRef, useRef } from 'react'; // Added useRef
import { uploadFile, deleteFile } from '../firebase';
import { Paperclip, Calendar as CalendarIcon, Clock, Users, FileText, DollarSign, Info, MapPin } from 'lucide-react';

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

// CheckboxInput component (remains the same)
function CheckboxInput({ label, checked, onChange, id, disabled, className }) {
  return (
    <div
      className={`flex items-center rounded-xl border border-transparent px-3 py-2 transition ${
        disabled ? 'bg-gray-100' : 'bg-white/60 hover:border-blue-200'
      } ${className}`}
    >
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:bg-gray-100 disabled:border-gray-200 disabled:cursor-not-allowed"
      />
      <label htmlFor={id} className={`ml-2 text-sm font-medium ${disabled ? 'text-gray-400' : 'text-gray-700'} select-none`}>
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
        console.log('No changes to save.');
      }
    },
    isDirty: () => isDirty,
  }));

  const currentEvent = localEvent || {};
  const eventId = currentEvent.id || 'new-event';

  const formatDateDisplay = (value) => {
    if (!value) return 'Date not set';
    const parsedDate = new Date(value);
    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    }

    const baseValue = value.split('T')[0];
    const [year, month, day] = baseValue.split('-').map(Number);
    if (year && month && day) {
      const fallbackDate = new Date(Date.UTC(year, month - 1, day));
      if (!Number.isNaN(fallbackDate.getTime())) {
        return fallbackDate.toLocaleDateString(undefined, {
          weekday: 'short',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });
      }
    }

    return value;
  };

  const formatTimeDisplay = (value) => {
    if (!value) return '';
    const [hours, minutes] = value.split(':').map((segment) => Number(segment));
    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return value;
    }

    const time = new Date();
    time.setHours(hours, minutes, 0, 0);
    if (Number.isNaN(time.getTime())) {
      return value;
    }

    return time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  const formatCurrency = (value) => {
    if (value === undefined || value === null || value === '') return '';
    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) return value;
    return numericValue.toLocaleString(undefined, {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const formattedDate = formatDateDisplay(currentEvent.eventDate);
  const startTimeDisplay = formatTimeDisplay(currentEvent.startTime);
  const endTimeDisplay = formatTimeDisplay(currentEvent.endTime);
  const timeRange = currentEvent.allDay
    ? 'All day'
    : [startTimeDisplay, endTimeDisplay].filter(Boolean).join(' – ') || 'Time not set';

  const statusMeta = {
    maybe: {
      label: 'Pending Decision',
      className: 'bg-amber-100 text-amber-700 border border-amber-200',
    },
    upcoming: {
      label: 'Upcoming',
      className: 'bg-blue-100 text-blue-700 border border-blue-200',
    },
    finished: {
      label: 'Completed',
      className: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    },
  };

  const statusKey = currentEvent.status || 'maybe';
  const statusBadge = statusMeta[statusKey] || {
    label: statusKey || 'Event',
    className: 'bg-gray-100 text-gray-600 border border-gray-200',
  };

  let guestLabel = '';
  if (
    currentEvent.numberOfGuests !== undefined &&
    currentEvent.numberOfGuests !== null &&
    currentEvent.numberOfGuests !== ''
  ) {
    const guestCount = Number(currentEvent.numberOfGuests);
    guestLabel = Number.isNaN(guestCount)
      ? `${currentEvent.numberOfGuests} guests`
      : `${guestCount} guest${guestCount === 1 ? '' : 's'}`;
  }

  const highlightBadges = [
    currentEvent.buildingArea && {
      icon: <MapPin size={14} />,
      text: currentEvent.buildingArea,
      className: 'bg-blue-50 text-blue-700 border-blue-100',
    },
    guestLabel && {
      icon: <Users size={14} />,
      text: guestLabel,
      className: 'bg-purple-50 text-purple-700 border-purple-100',
    },
    currentEvent.priceGiven && {
      icon: <DollarSign size={14} />,
      text: formatCurrency(currentEvent.priceGiven),
      className: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    },
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-gray-200 bg-white/90 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-semibold text-gray-800">
                {currentEvent.eventName || 'Untitled Event'}
              </h2>
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${statusBadge.className}`}
              >
                {statusBadge.label}
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              {currentEvent.clientName
                ? `Hosted for ${currentEvent.clientName}`
                : 'Add client information so everyone knows who this event is for.'}
            </p>
          </div>
          <div className="flex flex-col gap-2 text-sm text-gray-600 md:text-right">
            <div className="flex items-center gap-2 md:justify-end">
              <CalendarIcon size={16} className="text-blue-500" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2 md:justify-end">
              <Clock size={16} className="text-indigo-500" />
              <span>{timeRange}</span>
            </div>
          </div>
        </div>
        {highlightBadges.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {highlightBadges.map((badge, index) => (
              <span
                key={index}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${badge.className}`}
              >
                <span className="flex items-center justify-center rounded-full bg-white/70 p-1 text-current">
                  {badge.icon}
                </span>
                {badge.text}
              </span>
            ))}
          </div>
        )}
      </div>

      <section className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-sm">
        <header className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <Info size={20} />
          </span>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Event Details</h3>
            <p className="text-sm text-gray-500">
              Key information about when and where the event takes place.
            </p>
          </div>
        </header>
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
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
          <CheckboxInput
            id={`allDay-${eventId}`}
            label="All Day Event"
            checked={currentEvent.allDay || false}
            onChange={(e) => handleChange('allDay', e.target.checked)}
            className="md:mt-8"
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

      <section className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-sm">
        <header className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <DollarSign size={20} />
          </span>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Payment Details</h3>
            <p className="text-sm text-gray-500">
              Track invoices, deposits, and outstanding balances at a glance.
            </p>
          </div>
        </header>
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
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
          <CheckboxInput
            id={`downPaymentReceived-${eventId}`}
            label="Down Payment Received"
            checked={currentEvent.downPaymentReceived || false}
            onChange={(e) => handleChange('downPaymentReceived', e.target.checked)}
            className="md:mt-8"
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
          <div className="md:col-span-1" aria-hidden="true"></div>
          <CheckboxInput
            id={`finalPaymentReceived-${eventId}`}
            label="Final Payment Received"
            checked={currentEvent.finalPaymentReceived || false}
            onChange={(e) => handleChange('finalPaymentReceived', e.target.checked)}
            className="md:mt-8"
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

      <section className="rounded-3xl border border-gray-200 bg-white/80 p-6 shadow-sm">
        <header className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-50 text-purple-600">
            <FileText size={20} />
          </span>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Notes & Attachments</h3>
            <p className="text-sm text-gray-500">
              Keep everyone aligned with the latest context and paperwork.
            </p>
          </div>
        </header>
        <div className="space-y-5">
          <div>
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
              className="w-full rounded-2xl border border-gray-200 bg-gray-50/70 p-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/80 focus:bg-white hover:border-gray-300 min-h-[96px] resize-none"
              rows="3"
            ></textarea>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Attachments</h4>
            <label
              htmlFor={`fileUpload-${eventId}`}
              className="relative flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-300 bg-white/80 p-6 text-sm text-gray-600 transition-colors hover:border-blue-400 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/40"
            >
              <Paperclip size={28} className="text-blue-400" />
              <span className="font-medium text-blue-600">Upload or drop files here</span>
              <span className="text-xs text-gray-500">
                Share contracts, layouts, or any helpful documents.
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
              <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50/80 p-4">
                <p className="text-sm font-medium text-gray-600 mb-3">Uploaded files</p>
                <ul className="space-y-2">
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
