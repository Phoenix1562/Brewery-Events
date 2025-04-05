// components/EventCard.js
import React, { useState, useEffect } from 'react';
import { uploadFile, deleteFile } from '../firebase';

function LabeledInput({ label, type, value, onChange, placeholder, disabled, ...rest }) {
  return (
    <div className="flex flex-col">
      <label className="mb-1 text-sm font-semibold text-gray-700">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        disabled={disabled}
        className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        {...rest}
      />
    </div>
  );
}

function EventCard({
  event,
  onMoveLeft,
  onMoveRight,
  onDelete,
  onSave,
  onUpdate,
  active,
  setActiveEvent,
  hideActions = false // New prop: if true, internal action buttons are not rendered.
}) {
  const [localEvent, setLocalEvent] = useState(event);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (!isDirty) {
      setLocalEvent(event);
    }
  }, [event]);

  // Warn about unsaved changes on page unload
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleChange = (field, value) => {
    setLocalEvent((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
    if (onUpdate) onUpdate(event.id, field, value);
  };

  const handleFileUpload = async (e) => {
    const filesToUpload = Array.from(e.target.files);
    if (!filesToUpload.length) return;
    for (const file of filesToUpload) {
      try {
        const uploaded = await uploadFile(file, localEvent.id);
        setLocalEvent((prev) => ({
          ...prev,
          files: prev.files ? [...prev.files, uploaded] : [uploaded],
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
        const updatedEvent = {
          ...localEvent,
          files: localEvent.files.filter((_, i) => i !== index),
        };
        setLocalEvent(updatedEvent);
        if (onSave) await onSave(updatedEvent);
        setIsDirty(false);
      } catch (err) {
        console.error('Failed to delete file', err);
        alert('Failed to delete file: ' + file.name);
      }
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave(localEvent);
      setIsDirty(false);
      if (setActiveEvent) setActiveEvent(null);
    } else {
      console.log('No save handler provided');
    }
  };

  const handleClose = () => {
    if (setActiveEvent) setActiveEvent(null);
  };

  // Define container styles. "relative" enables absolute positioning.
  const containerClass = active
    ? 'bg-white shadow-lg rounded-xl p-6 relative'
    : 'bg-white shadow-md rounded-lg p-4 relative';

  return (
    <div className={containerClass}>
      {/* Internal action buttons – rendered only if hideActions is false */}
      {!hideActions && active && (
        <div className="absolute top-4 left-4 flex flex-col space-y-2 z-50">
          <button
            onClick={handleSave}
            className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600 transition"
            title="Save event changes"
          >
            Save
          </button>
          {onMoveRight && (
            <button
              onClick={() => {
                if (isDirty) {
                  alert('Please save the event first!');
                } else {
                  onMoveRight(localEvent.id);
                }
              }}
              className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 transition"
              title="Move event to the right"
            >
              Move Right &rarr;
            </button>
          )}
          {onMoveLeft && (
            <button
              onClick={() => {
                if (isDirty) {
                  alert('Please save the event first!');
                } else {
                  onMoveLeft(localEvent.id);
                }
              }}
              className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 transition"
              title="Move event to the left"
            >
              &larr; Move Left
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(localEvent.id)}
              className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 transition"
              title="Delete event"
            >
              Delete
            </button>
          )}
        </div>
      )}

      {/* Optional close button for the side panel */}
      {active && (
        <div className="flex justify-end">
          <button onClick={handleClose} className="text-red-500 text-sm hover:underline">
            Close
          </button>
        </div>
      )}

      {/* Event Details Section */}
      <section className="mb-6">
        <h3 className="text-lg font-bold mb-3 border-b pb-1">Event Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <LabeledInput
            label="Client Name"
            type="text"
            value={localEvent.clientName}
            onChange={(e) => handleChange('clientName', e.target.value)}
            placeholder="Enter client name"
          />
          <LabeledInput
            label="Event Name"
            type="text"
            value={localEvent.eventName}
            onChange={(e) => handleChange('eventName', e.target.value)}
            placeholder="Enter event name"
          />
          <LabeledInput
            label="Event Date"
            type="date"
            value={localEvent.eventDate}
            onChange={(e) => handleChange('eventDate', e.target.value)}
          />
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-semibold text-gray-700">Building Area</label>
            <select
              value={localEvent.buildingArea}
              onChange={(e) => handleChange('buildingArea', e.target.value)}
              className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">Select Area</option>
              <option value="Brewhouse">Brewhouse</option>
              <option value="Taphouse">Taphouse</option>
              <option value="Hall">Hall</option>
            </select>
          </div>
          <LabeledInput
            label="Start Time"
            type="time"
            value={localEvent.startTime || ''}
            onChange={(e) => handleChange('startTime', e.target.value)}
            disabled={localEvent.allDay}
          />
          <LabeledInput
            label="End Time"
            type="time"
            value={localEvent.endTime || ''}
            onChange={(e) => handleChange('endTime', e.target.value)}
            disabled={localEvent.allDay}
          />
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={localEvent.allDay || false}
              onChange={(e) => handleChange('allDay', e.target.checked)}
              className="h-4 w-4"
            />
            <label className="text-sm">All Day</label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={localEvent.formSent || false}
              onChange={(e) => handleChange('formSent', e.target.checked)}
              className="h-4 w-4"
            />
            <label className="text-sm">Form Sent</label>
          </div>
          <LabeledInput
            label="Number of Guests"
            type="number"
            value={localEvent.numberOfGuests || ''}
            onChange={(e) => handleChange('numberOfGuests', e.target.value)}
            placeholder="0"
          />
        </div>
      </section>

      {/* Payment Details Section */}
      <section className="mb-6">
        <h3 className="text-lg font-bold mb-3 border-b pb-1">Payment Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <LabeledInput
            label="Price Given"
            type="number"
            value={localEvent.priceGiven}
            onChange={(e) => handleChange('priceGiven', e.target.value)}
            placeholder="0.00"
          />
          <LabeledInput
            label="Down Payment Required"
            type="number"
            value={localEvent.downPaymentRequired}
            onChange={(e) => handleChange('downPaymentRequired', e.target.value)}
            placeholder="0.00"
          />
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={localEvent.downPaymentReceived}
              onChange={(e) => handleChange('downPaymentReceived', e.target.checked)}
              className="h-4 w-4"
            />
            <label className="text-sm">Down Payment Received</label>
          </div>
          <LabeledInput
            label="Food/Beverage Cost"
            type="number"
            value={localEvent.amountPaidAfter}
            onChange={(e) => handleChange('amountPaidAfter', e.target.value)}
            placeholder="0.00"
          />
          <LabeledInput
            label="Grand Total"
            type="number"
            value={localEvent.grandTotal}
            onChange={(e) => handleChange('grandTotal', e.target.value)}
            placeholder="0.00"
          />
          <LabeledInput
            label="Security Deposit"
            type="number"
            value={localEvent.securityDeposit}
            onChange={(e) => handleChange('securityDeposit', e.target.value)}
            placeholder="0.00"
          />
          <div className="flex items-center space-x-2">
            <label className="text-sm font-semibold">Final Payment Received</label>
            <input
              type="checkbox"
              checked={localEvent.finalPaymentReceived || false}
              onChange={(e) => handleChange('finalPaymentReceived', e.target.checked)}
              className="h-4 w-4"
            />
          </div>
        </div>
      </section>

      {/* Attachments & Notes Section */}
      <section className="mb-6">
        <h3 className="text-lg font-bold mb-3 border-b pb-1">Attachments &amp; Notes</h3>
        <div className="mb-4">
          <label className="mb-1 block text-sm font-semibold text-gray-700">Notes</label>
          <textarea
            placeholder="Add additional details..."
            value={localEvent.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            rows="3"
          ></textarea>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Attachments</h4>
          <input
            type="file"
            accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileUpload}
            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            multiple
          />
          {localEvent.files && localEvent.files.length > 0 && (
            <ul className="list-disc list-inside text-sm mt-2">
              {localEvent.files.map((file, index) => (
                <li key={index} className="flex items-center justify-between">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    {file.name}
                  </a>
                  <button
                    onClick={() => handleDeleteFile(file, index)}
                    className="text-red-500 text-sm ml-2 hover:underline"
                    title="Delete this file"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

export default EventCard;
