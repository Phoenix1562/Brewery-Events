import React, { useState, useEffect } from 'react';
import { uploadFile, deleteFile } from '../firebase';

function EventCard({ event, onMoveLeft, onMoveRight, onDelete, onSave }) {
  const [collapsed, setCollapsed] = useState(true);
  const [localEvent, setLocalEvent] = useState(event);
  const [isDirty, setIsDirty] = useState(false); // Flag for unsaved changes

  // Update local state when event prop changes
  useEffect(() => {
    setLocalEvent(event);
    setIsDirty(false);
  }, [event]);

  // Auto-collapse when the event status changes
  useEffect(() => {
    setCollapsed(true);
  }, [event.status]);

  // Native beforeunload handler to warn about unsaved changes
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

  // Update a field and mark unsaved changes
  const handleChange = (field, value) => {
    setLocalEvent(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  // Handle file uploads
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

  // Handle deletion of an attached file with auto-save after deletion
  const handleDeleteFile = async (file, index) => {
    if (window.confirm(`Delete file "${file.name}"?`)) {
      try {
        await deleteFile(file.path);
        const updatedEvent = { 
          ...localEvent,
          files: localEvent.files.filter((_, i) => i !== index)
        };
        setLocalEvent(updatedEvent);
        // Auto-save immediately after deletion so the change persists
        if (onSave) {
          await onSave(updatedEvent);
        }
        // Mark as not dirty since changes are now saved
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
        // Collapsed view: horizontal layout with details and an expand arrow on the right
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
          <button 
            onClick={(e) => { e.stopPropagation(); setCollapsed(false); }}
            title="Expand event details"
            className="text-xs text-gray-600 hover:text-black"
          >
            ▼
          </button>
        </div>
      ) : (
        // Expanded view: editable form with a top-right collapse button and file upload section
        <div className="bg-gray-50 pl-2 pr-8 pt-2 pb-2 border border-gray-400 rounded-xl relative">
          {/* Collapse button at top right */}
          <button
            onClick={() => setCollapsed(true)}
            className="absolute top-2 right-2 p-2 rounded hover:bg-gray-200 text-sm text-gray-600 hover:text-black"
            title="Collapse event details"
          >
            ▼
          </button>

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
            <input
              type="number"
              placeholder="Price Given"
              value={localEvent.priceGiven}
              onChange={(e) => handleChange('priceGiven', e.target.value)}
              className="border p-2 text-sm"
            />
            <input
              type="number"
              placeholder="Down Payment Required"
              value={localEvent.downPaymentRequired}
              onChange={(e) => handleChange('downPaymentRequired', e.target.value)}
              className="border p-2 text-sm"
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
            <input
              type="number"
              placeholder="Amount Due After"
              value={localEvent.amountDueAfter}
              onChange={(e) => handleChange('amountDueAfter', e.target.value)}
              className="border p-2 text-sm"
            />
            <input
              type="number"
              placeholder="Food/Beverage Cost"
              value={localEvent.amountPaidAfter}
              onChange={(e) => handleChange('amountPaidAfter', e.target.value)}
              className="border p-2 text-sm"
            />
            <input
              type="number"
              placeholder="Grand Total"
              value={localEvent.grandTotal}
              onChange={(e) => handleChange('grandTotal', e.target.value)}
              className="border p-2 text-sm"
            />
            <input
              type="number"
              placeholder="Security Deposit"
              value={localEvent.securityDeposit}
              onChange={(e) => handleChange('securityDeposit', e.target.value)}
              className="border p-2 text-sm"
            />
          </div>
          <textarea
            placeholder="Notes"
            value={localEvent.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            className="border p-2 mt-2 w-full text-sm"
            rows="3"
          ></textarea>

          {/* File Upload Section */}
          <div className="mt-2 flex items-center">
            <div className="flex-1">
              <label className="block text-sm font-semibold mb-1">
                Attach Word Document(s):
              </label>
              <input 
                type="file" 
                accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
                onChange={handleFileUpload}
                className="border p-1 w-auto"
                multiple
              />
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="mt-2 px-4 py-1 bg-green-500 text-white rounded text-sm"
            title="Save event changes"
          >
            Save
          </button>

          {/* List of attached files with Delete buttons */}
          {localEvent.files && localEvent.files.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-semibold">Attached Files:</p>
              <ul className="list-disc list-inside text-sm">
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
            </div>
          )}
        </div>
      )}

      {/* Action Buttons (e.g., Move Left/Right, Delete event) */}
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
