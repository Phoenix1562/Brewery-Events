import React, { useState, useEffect } from 'react';
import { uploadFile, deleteFile } from '../firebase';

// A reusable component for labeled inputs
function LabeledInput({ label, type, value, onChange, ...rest }) {
  return (
    <div className="flex flex-col">
      <label className="text-xs font-semibold text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className="border p-2 text-sm"
        {...rest}
      />
    </div>
  );
}

function EventCard({ event, onMoveLeft, onMoveRight, onDelete, onSave }) {
  const [collapsed, setCollapsed] = useState(true);
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

  // Mark field changes as unsaved
  const handleChange = (field, value) => {
    setLocalEvent(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  // File upload logic
  const handleFileUpload = async (e) => {
    const filesToUpload = Array.from(e.target.files);
    if (!filesToUpload.length) return;
    for (const file of filesToUpload) {
      try {
        const uploaded = await uploadFile(file, localEvent.id);
        setLocalEvent(prev => ({
          ...prev,
          files: prev.files ? [...prev.files, uploaded] : [uploaded]
        }));
        setIsDirty(true);
      } catch (err) {
        console.error("File upload failed", err);
        alert("Failed to upload file: " + file.name);
      }
    }
  };

  // Handle file deletion with auto-save
  const handleDeleteFile = async (file, index) => {
    if (window.confirm(`Delete file "${file.name}"?`)) {
      try {
        await deleteFile(file.path);
        const updatedEvent = { 
          ...localEvent,
          files: localEvent.files.filter((_, i) => i !== index)
        };
        setLocalEvent(updatedEvent);
        if (onSave) {
          await onSave(updatedEvent);
        }
        setIsDirty(false);
        console.log(`Auto-saved deletion of ${file.name}. No ghosts left behind!`);
      } catch (err) {
        console.error("Failed to delete file", err);
        alert("Failed to delete file: " + file.name);
      }
    }
  };

  // Save the current event to Firestore
  const handleSave = () => {
    if (onSave) {
      onSave(localEvent);
      setCollapsed(true);
      setIsDirty(false);
    } else {
      console.log("No save handler provided");
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
              <strong>Date:</strong> {localEvent.eventDate ? new Date(localEvent.eventDate).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              }) : <em>None</em>}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {localEvent.finalPaymentReceived && (
              <span className="text-xs font-bold text-green-600">
                Paid in Full
              </span>
            )}
            {(localEvent.downPaymentRequired > 0 && !localEvent.downPaymentReceived) && (
              <span className="text-xs font-bold text-red-600">
                Awaiting Downpayment
              </span>
            )}
            <button 
              onClick={(e) => { e.stopPropagation(); setCollapsed(false); }}
              title="Expand event details"
              className="text-xs text-gray-600 hover:text-black"
            >
              ▼
            </button>
          </div>
        </div>
      ) : (
        // Expanded view with flex column so the Save button stays at the bottom
        <div className="bg-gray-50 pl-2 pr-8 pt-2 pb-2 border border-gray-400 rounded-xl relative flex flex-col">
          {/* Collapse button */}
          <button
            onClick={() => setCollapsed(true)}
            className="absolute top-2 right-2 p-2 rounded hover:bg-gray-200 text-sm text-gray-600 hover:text-black"
            title="Collapse event details"
          >
            ▼
          </button>

          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Client Name"
                value={localEvent.clientName}
                onChange={(e) => handleChange('clientName', e.target.value)}
                className="border p-2 text-sm"
              />
              <input
                type="text"
                placeholder="Event Name"
                value={localEvent.eventName}
                onChange={(e) => handleChange('eventName', e.target.value)}
                className="border p-2 text-sm"
              />
              <input
                type="date"
                value={localEvent.eventDate}
                onChange={(e) => handleChange('eventDate', e.target.value)}
                className="border p-2 text-sm"
              />
              <select
                value={localEvent.buildingArea}
                onChange={(e) => handleChange('buildingArea', e.target.value)}
                className="border p-2 text-sm"
              >
                <option value="">Select Area</option>
                <option value="Brewhouse">Brewhouse</option>
                <option value="Taphouse">Taphouse</option>
                <option value="Hall">Hall</option>
              </select>

              {/* Number fields using LabeledInput */}
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
              <label className="flex items-center text-sm">
                <input
                  type="checkbox"
                  checked={localEvent.downPaymentReceived}
                  onChange={(e) => handleChange('downPaymentReceived', e.target.checked)}
                  className="mr-1"
                />
                Down Payment Received
              </label>
              <LabeledInput
                label="Number of Guests"
                type="number"
                value={localEvent.numberOfGuests || ''}
                onChange={(e) => handleChange('numberOfGuests', e.target.value)}
              />
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
              <div className="flex items-center">
                <label className="mr-2 text-sm font-semibold">Final Payment:</label>
                <input 
                  type="checkbox"
                  checked={localEvent.finalPaymentReceived || false}
                  onChange={(e) => handleChange('finalPaymentReceived', e.target.checked)}
                  className="h-4 w-4"
                />
              </div>
            </div>

            {/* Notes Section */}
            <textarea
              placeholder="Notes"
              value={localEvent.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="border p-2 mt-2 w-full text-sm"
              rows="3"
            ></textarea>

            {/* Attachments Section moved under Notes */}
            <div className="mt-4">
              <h4 className="text-sm font-semibold mb-1">Attachments</h4>
              <div className="flex items-center">
                <input 
                  type="file" 
                  accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
                  onChange={handleFileUpload}
                  className="border p-1 w-auto"
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

          {/* Save Button always at the bottom */}
          <div className="mt-4">
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

      {/* Action Buttons */}
      {!collapsed && (
        <div className="mt-2 flex space-x-2">
          {localEvent.status !== 'maybe' && onMoveLeft && (
            <button 
              className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
              onClick={() => {
                if (isDirty) {
                  alert("Please save the event first!");
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
                  alert("Please save the event first!");
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
