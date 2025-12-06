// components/EventCard.js
import React, { useState, useEffect, useImperativeHandle, forwardRef, useRef } from 'react';
import { uploadFile, deleteFile } from '../firebase';
import { Paperclip, Calendar as CalendarIcon, Clock, Users, FileText, DollarSign, Info, MapPin } from 'lucide-react';

// Enhanced LabeledInput with modern styling
function LabeledInput({
  label,
  type,
  value,
  onChange,
  placeholder,
  disabled,
  id,
  icon,
  containerClassName = '',
  labelClassName = '',
  inputClassName = '',
  ...rest
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
      <label
        htmlFor={id}
        className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 ${labelClassName}`}
      >
        {icon && React.cloneElement(icon, { size: 14, className: 'text-slate-400' })}
        <span>{label}</span>
      </label>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        disabled={disabled}
        className={`w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-medium text-slate-800 transition-all duration-200
          placeholder:text-slate-400 hover:border-slate-300 hover:bg-white
          focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10
          disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 ${inputClassName}`}
        {...rest}
      />
    </div>
  );
}

function SectionHeader({ title, icon: Icon, className = '' }) {
  return (
    <div className={`flex items-center gap-2 border-b border-slate-100 pb-3 ${className}`}>
      {Icon && <Icon size={18} className="text-blue-500" />}
      <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800">{title}</h3>
    </div>
  );
}

function EventCard(props, ref) {
  const { event, onSave, setActiveEvent } = props;

  const [localEvent, setLocalEvent] = useState(event || {});
  const [isDirty, setIsDirty] = useState(false);
  const notesTextareaRef = useRef(null);

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

  // Auto-resize textarea
  useEffect(() => {
    if (notesTextareaRef.current) {
      const textarea = notesTextareaRef.current;
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [localEvent.notes]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes.';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleChange = (field, value) => {
    setLocalEvent((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

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
    if (window.confirm(`Delete file "${file.name}"?`)) {
      try {
        await deleteFile(file.path);
        const updatedFiles = localEvent.files.filter((_, i) => i !== index);
        setLocalEvent((prev) => ({ ...prev, files: updatedFiles }));
        setIsDirty(true); // Mark as dirty so user can save
      } catch (err) {
        console.error('Failed to delete file', err);
        alert('Failed to delete file');
      }
    }
  };

  const internalSave = async () => {
    if (onSave) {
      await onSave(localEvent);
      setIsDirty(false);
    }
  };

  const internalClose = async () => {
    if (isDirty && onSave) {
      await internalSave();
    }
    if (setActiveEvent) setActiveEvent(null);
  };

  useImperativeHandle(ref, () => ({
    handleClose: internalClose,
    triggerSave: () => (isDirty ? internalSave() : Promise.resolve()),
    getCurrentEvent: () => localEvent,
    isDirty: () => isDirty,
  }));

  const currentEvent = localEvent || {};
  const eventId = currentEvent.id || 'new-event';

  return (
    <div className="flex flex-col gap-8">

      {/* Header Section: Prominent Inputs (Compacted) */}
      <div className="flex flex-col gap-2 border-b border-slate-200 pb-4">
        <div>
          <input
            type="text"
            value={currentEvent.eventName || ''}
            onChange={(e) => handleChange('eventName', e.target.value)}
            placeholder="Untitled Event"
            className="w-full bg-transparent text-3xl font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2 text-slate-500">
            <Users size={16} />
            <input
                type="text"
                value={currentEvent.clientName || ''}
                onChange={(e) => handleChange('clientName', e.target.value)}
                placeholder="Client Name"
                className="bg-transparent text-lg font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none"
            />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">

        {/* Left Column: Logistics & Notes (8 cols) */}
        <div className="flex flex-col gap-8 lg:col-span-8">

            {/* Logistics Group */}
            <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <SectionHeader title="Logistics" icon={Info} />

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <LabeledInput
                        id={`eventDate-${eventId}`}
                        label="Event Date"
                        type="date"
                        icon={<CalendarIcon />}
                        value={currentEvent.eventDate || ''}
                        onChange={(e) => handleChange('eventDate', e.target.value)}
                    />

                     <div className="flex flex-col gap-1.5">
                        <label htmlFor={`buildingArea-${eventId}`} className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                             <MapPin size={14} className="text-slate-400" />
                             <span>Venue</span>
                        </label>
                        <select
                            id={`buildingArea-${eventId}`}
                            value={currentEvent.buildingArea || ''}
                            onChange={(e) => handleChange('buildingArea', e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-medium text-slate-800 transition-all hover:border-slate-300 hover:bg-white focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                        >
                            <option value="">Select Venue</option>
                            <option value="Brewhouse">Brewhouse</option>
                            <option value="Taphouse">Taphouse</option>
                            <option value="Hall">Hall</option>
                        </select>
                    </div>

                    {/* Compact Time Range Input */}
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                        <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                             <Clock size={14} className="text-slate-400" />
                             <span>Time</span>
                        </label>
                        <div className={`flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/50 p-2 transition-all hover:border-slate-300 hover:bg-white focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10 ${currentEvent.allDay ? 'opacity-70' : ''}`}>
                             <div className="flex flex-1 items-center gap-2">
                                 <input
                                    type="time"
                                    value={currentEvent.startTime || ''}
                                    onChange={(e) => handleChange('startTime', e.target.value)}
                                    disabled={currentEvent.allDay}
                                    className="w-full bg-transparent text-sm font-medium text-slate-800 focus:outline-none disabled:cursor-not-allowed"
                                 />
                                 <span className="text-slate-400">→</span>
                                 <input
                                    type="time"
                                    value={currentEvent.endTime || ''}
                                    onChange={(e) => handleChange('endTime', e.target.value)}
                                    disabled={currentEvent.allDay}
                                    className="w-full bg-transparent text-sm font-medium text-slate-800 focus:outline-none disabled:cursor-not-allowed"
                                 />
                             </div>
                             <div className="h-6 w-px bg-slate-200"></div>
                             <label className="flex cursor-pointer items-center gap-2 px-2">
                                 <input
                                    type="checkbox"
                                    checked={currentEvent.allDay || false}
                                    onChange={(e) => handleChange('allDay', e.target.checked)}
                                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                 />
                                 <span className="whitespace-nowrap text-sm font-medium text-slate-600">All Day</span>
                             </label>
                        </div>
                    </div>

                    <LabeledInput
                        id={`numberOfGuests-${eventId}`}
                        label="Guest Count"
                        type="number"
                        icon={<Users />}
                        placeholder="0"
                        value={currentEvent.numberOfGuests || ''}
                        onChange={(e) => handleChange('numberOfGuests', e.target.value)}
                    />
                </div>
            </div>

            {/* Notes & Files Group */}
             <div className="flex flex-1 flex-col space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <SectionHeader title="Notes & Attachments" icon={FileText} />

                <textarea
                    ref={notesTextareaRef}
                    placeholder="Type details here..."
                    value={currentEvent.notes || ''}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    className="min-h-[150px] w-full resize-none rounded-lg border-0 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                />

                <div className="space-y-4">
                     <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-slate-700">Files</h4>
                         <label className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">
                             Upload
                             <input type="file" multiple className="hidden" onChange={handleFileUpload} />
                         </label>
                     </div>

                     {currentEvent.files && currentEvent.files.length > 0 ? (
                         <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                             {currentEvent.files.map((file, i) => (
                                 <div key={i} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-2 pr-3">
                                     <a href={file.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 overflow-hidden text-sm font-medium text-slate-700 hover:text-blue-600">
                                         <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-white text-blue-500 shadow-sm">
                                             <Paperclip size={14} />
                                         </div>
                                         <span className="truncate">{file.name}</span>
                                     </a>
                                     <button onClick={() => handleDeleteFile(file, i)} className="ml-2 text-slate-400 hover:text-rose-500">
                                         &times;
                                     </button>
                                 </div>
                             ))}
                         </div>
                     ) : (
                         <p className="text-center text-sm italic text-slate-400">No files attached.</p>
                     )}
                </div>
             </div>

        </div>

        {/* Right Column: Financials (4 cols) */}
        <div className="lg:col-span-4">
             <div className="sticky top-6 flex flex-col gap-6 rounded-2xl border border-slate-200 bg-slate-50/50 p-6 shadow-sm">
                <SectionHeader title="Financials" icon={DollarSign} className="border-slate-200" />

                <div className="space-y-4">
                    <LabeledInput
                        label="Price Quoted"
                        type="number"
                        placeholder="0.00"
                        value={currentEvent.priceGiven || ''}
                        onChange={(e) => handleChange('priceGiven', e.target.value)}
                        inputClassName="bg-white"
                    />

                    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                         <div className="mb-2 flex items-center justify-between">
                             <span className="text-xs font-semibold uppercase text-slate-500">Deposit</span>
                             <label className="flex items-center gap-2">
                                 <input
                                    type="checkbox"
                                    checked={currentEvent.downPaymentReceived || false}
                                    onChange={(e) => handleChange('downPaymentReceived', e.target.checked)}
                                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                 />
                                 <span className="text-xs font-medium text-slate-600">Received</span>
                             </label>
                         </div>
                         <div className="flex gap-2">
                             <input
                                type="number"
                                placeholder="Amount"
                                value={currentEvent.downPaymentRequired || ''}
                                onChange={(e) => handleChange('downPaymentRequired', e.target.value)}
                                className="w-full rounded-md border-slate-200 bg-slate-50 px-2 py-1.5 text-sm"
                             />
                              <input
                                type="date"
                                disabled={!currentEvent.downPaymentReceived}
                                value={currentEvent.downPaymentReceivedDate || ''}
                                onChange={(e) => handleChange('downPaymentReceivedDate', e.target.value)}
                                className="w-[110px] rounded-md border-slate-200 bg-slate-50 px-2 py-1.5 text-sm disabled:opacity-50"
                             />
                         </div>
                    </div>

                    <LabeledInput
                        label="Addtl. Costs"
                        type="number"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        value={currentEvent.amountPaidAfter || ''}
                        onChange={(e) => handleChange('amountPaidAfter', e.target.value)}
                        inputClassName="bg-white"
                    />

                    <LabeledInput
                        label="Security Deposit"
                        type="number"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        value={currentEvent.securityDeposit || ''}
                        onChange={(e) => handleChange('securityDeposit', e.target.value)}
                        inputClassName="bg-white"
                    />

                    <div className="pt-2">
                        <LabeledInput
                            label="Grand Total"
                            type="number"
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            value={currentEvent.grandTotal || ''}
                            onChange={(e) => handleChange('grandTotal', e.target.value)}
                            inputClassName="text-lg font-bold text-slate-900 border-blue-200 bg-blue-50/30 focus:bg-white"
                        />
                    </div>

                     <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                         <div className="mb-2 flex items-center justify-between">
                             <span className="text-xs font-semibold uppercase text-slate-500">Final Payment</span>
                             <label className="flex items-center gap-2">
                                 <input
                                    type="checkbox"
                                    checked={currentEvent.finalPaymentReceived || false}
                                    onChange={(e) => handleChange('finalPaymentReceived', e.target.checked)}
                                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                 />
                                 <span className="text-xs font-medium text-slate-600">Received</span>
                             </label>
                         </div>
                         <input
                                type="date"
                                disabled={!currentEvent.finalPaymentReceived}
                                value={currentEvent.finalPaymentReceivedDate || ''}
                                onChange={(e) => handleChange('finalPaymentReceivedDate', e.target.value)}
                                className="w-full rounded-md border-slate-200 bg-slate-50 px-2 py-1.5 text-sm disabled:opacity-50"
                         />
                    </div>
                </div>
             </div>
        </div>

      </div>
    </div>
  );
}

export default forwardRef(EventCard);
