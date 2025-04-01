import React, { useState, useEffect } from 'react';
import { uploadFile, deleteFile } from '../firebase';

// Helper function to format the date in the desired style
function formatDate(dateString) {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// A reusable component for labeled inputs
function LabeledInput({ label, type, value, onChange, ...rest }) {
  return (
    <div className="flex flex-col">
      <label className="text-xs font-semibold text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className="border p-1 text-sm rounded"
        {...rest}
      />
    </div>
  );
}

function EventCard({ event, onMoveLeft, onMoveRight, onDelete, onSave, active }) {
  const [collapsed, setCollapsed] = useState(active ? false : true);
  const [localEvent, setLocalEvent] = useState(event);
  const [isDirty, setIsDirty] = useState(false);

  // Update local state when event prop changes
  useEffect(() => {
    setLocalEvent(event);
    setIsDirty(false);
  }, [event]);

  // Auto-collapse when the event status changes
  useEffect(() => {
    setCollapsed(true);
  }, [event.status]);

  // Uncollapse if active prop becomes true
  useEffect(() => {
    if (active) setCollapsed(false);
  }, [active]);

  // Warn about unsaved changes on page unload
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = ''; // Required for Chrome
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
          files: prev.files ? [...prev.files, uploaded] : [uploaded]
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
          files: localEvent.files.filter((_, i) => i !== index)
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
      setCollapsed(true);
      setIsDirty(false);
    } else {
      console.log('No save handler provided');
    }
  };

  return (
    <div className="relative transition-all duration-300">
      {collapsed ? (
        // Collapsed view
        <div
          className="bg-white p-4 border border-gray-400 rounded-xl shadow-sm hover:shadow-md transition duration-300 cursor-pointer flex items-center justify-between"
          onClick={() => setCollapsed(false)}
        >
          <div className="flex flex-row items-center space-x-6">
            <span className="text-sm">
              <strong>Client:</strong> {localEvent.clientName || <em>None</em>}
            </span>
            <span className="text-sm">
              <strong>Event:</strong> {localEvent.eventName || <em>None</em>}
            </span>
            <span className="text-sm">
              <strong>Date:</strong>{' '}
              {localEvent.eventDate ? formatDate(localEvent.eventDate) : <em>None</em>}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {localEvent.finalPaymentReceived && (
              <span className="text-xs font-bold text-green-600">Paid in Full</span>
            )}
            {localEvent.downPaymentRequired > 0 && !localEvent.downPaymentReceived && (
              <span className="text-xs font-bold text-red-600">Awaiting Downpayment</span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCollapsed(false);
              }}
              title="Expand event details"
              className="text-xs text-gray-600 hover:text-black"
            >
              ▼
            </button>
          </div>
        </div>
      ) : (
        // Expanded view with 4 columns
        <div className="bg-gray-50 p-4 border border-gray-400 rounded-xl relative">
          {/* Collapse Button */}
          <button
            onClick={() => setCollapsed(true)}
            className="absolute top-2 right-2 p-1 rounded hover:bg-gray-200 text-sm text-gray-600"
            title="Collapse event details"
          >
            ▼
          </button>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            {/* Row 1: Client, Event, Date, Building Area */}
            <LabeledInput
              label="Client Name"
              type="text"
              value={localEvent.clientName}
              onChange={(e) => handleChange('clientName', e.target.value)}
            />
            <LabeledInput
              label="Event Name"
              type="text"
              value={localEvent.eventName}
              onChange={(e) => handleChange('eventName', e.target.value)}
            />
            <LabeledInput
              label="Event Date"
              type="date"
              value={localEvent.eventDate}
              onChange={(e) => handleChange('eventDate', e.target.value)}
            />
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-gray-600 mb-1">Building Area</label>
              <select
                value={localEvent.buildingArea}
                onChange={(e) => handleChange('buildingArea', e.target.value)}
                className="border p-1 text-sm rounded"
              >
                <option value="">Select Area</option>
                <option value="Brewhouse">Brewhouse</option>
                <option value="Taphouse">Taphouse</option>
                <option value="Hall">Hall</option>
              </select>
            </div>

            {/* Row 2: Start Time, End Time, All Day, Form Sent */}
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
            <div className="flex items-center gap-1 mt-4">
              <input
                type="checkbox"
                checked={localEvent.allDay || false}
                onChange={(e) => handleChange('allDay', e.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-xs">All Day</span>
            </div>
            <div className="flex items-center gap-1 mt-4">
              <input
                type="checkbox"
                checked={localEvent.formSent || false}
                onChange={(e) => handleChange('formSent', e.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-xs">Form Sent</span>
            </div>

            {/* Row 3: Price, Down Payment Required, Down Payment Received, Number of Guests */}
            <LabeledInput
              label="Price Given"
              type="number"
              value={localEvent.priceGiven}
              onChange={(e) => handleChange('priceGiven', e.target.value)}
            />
            <LabeledInput
              label="Down Payment Required"
              type="number"
              value={localEvent.downPaymentRequired}
              onChange={(e) => handleChange('downPaymentRequired', e.target.value)}
            />
            <div className="flex items-center gap-1 mt-4">
              <input
                type="checkbox"
                checked={localEvent.downPaymentReceived}
                onChange={(e) => handleChange('downPaymentReceived', e.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-xs">Down Payment Received</span>
            </div>
            <LabeledInput
              label="Number of Guests"
              type="number"
              value={localEvent.numberOfGuests || ''}
              onChange={(e) => handleChange('numberOfGuests', e.target.value)}
            />

            {/* Row 4: Food/Beverage Cost, Grand Total, Security Deposit, Final Payment */}
            <LabeledInput
              label="Food/Beverage Cost"
              type="number"
              value={localEvent.amountPaidAfter}
              onChange={(e) => handleChange('amountPaidAfter', e.target.value)}
            />
            <LabeledInput
              label="Grand Total"
              type="number"
              value={localEvent.grandTotal}
              onChange={(e) => handleChange('grandTotal', e.target.value)}
            />
            <LabeledInput
              label="Security Deposit"
              type="number"
              value={localEvent.securityDeposit}
              onChange={(e) => handleChange('securityDeposit', e.target.value)}
            />
            <div className="flex items-center gap-1 mt-4">
              <label className="text-sm font-semibold">Final Payment:</label>
              <input
                type="checkbox"
                checked={localEvent.finalPaymentReceived || false}
                onChange={(e) => handleChange('finalPaymentReceived', e.target.checked)}
                className="h-4 w-4"
              />
            </div>

            {/* Row 5: Notes - Full width (col-span-4) */}
            <div className="col-span-4">
              <textarea
                placeholder="Notes"
                value={localEvent.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                className="border p-2 w-full text-sm rounded"
                rows="3"
              ></textarea>
            </div>

            {/* Row 6: Attachments - Full width (col-span-4) */}
            <div className="col-span-4">
              <h4 className="text-sm font-semibold mb-1">Attachments</h4>
              <div className="flex items-center">
                <input
                  type="file"
                  accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileUpload}
                  className="border p-1 w-auto rounded"
                  multiple
                />
              </div>
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
                        className="text-red-500 text-xs ml-2"
                        title="Delete this file"
                      >
                        Delete
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Save Button - full width at bottom */}
          <div className="mt-3">
            <button
              onClick={handleSave}
              className="w-full px-4 py-1 bg-green-500 text-white rounded text-sm"
              title="Save event changes"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons for moving and deleting */}
      {!collapsed && (
        <div className="mt-2 flex space-x-2">
          {localEvent.status !== 'maybe' && onMoveLeft && (
            <button
              className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
              onClick={() => {
                if (isDirty) {
                  alert('Please save the event first!');
                } else {
                  onMoveLeft(localEvent.id);
                }
              }}
              title="Move event to the left"
            >
              &larr; Move Left
            </button>
          )}
          {localEvent.status !== 'finished' && onMoveRight && (
            <button
              className="bg-green-500 text-white px-3 py-1 rounded text-sm"
              onClick={() => {
                if (isDirty) {
                  alert('Please save the event first!');
                } else {
                  onMoveRight(localEvent.id);
                }
              }}
              title="Move event to the right"
            >
              Move Right &rarr;
            </button>
          )}
          {onDelete && (
            <button
              className="bg-red-500 text-white px-3 py-1 rounded text-sm"
              onClick={() => onDelete(localEvent.id)}
              title="Delete event"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default EventCard;
