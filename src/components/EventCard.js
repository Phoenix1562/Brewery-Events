import React, { useState, useEffect } from 'react';

function EventCard({ event, onMoveLeft, onMoveRight, onDelete, onSave }) {
  const [collapsed, setCollapsed] = useState(true);
  const [localEvent, setLocalEvent] = useState(event);

  // When the event prop changes, update our local state
  useEffect(() => {
    setLocalEvent(event);
  }, [event]);

  // Auto-collapse when the event status changes
  useEffect(() => {
    setCollapsed(true);
  }, [event.status]);

  // Update local state on field change
  const handleChange = (field, value) => {
    setLocalEvent(prev => ({ ...prev, [field]: value }));
  };

  // Save the changes by calling onSave (if provided)
  const handleSave = () => {
    if (onSave) {
      onSave(localEvent);
    } else {
      console.log("No save handler provided");
    }
  };

  return (
    <div className="p-2 border rounded shadow relative transition-all duration-300 hover:shadow-lg">
      {/* Toggle Collapse/Expand Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? 'Expand event details' : 'Collapse event details'}
        className="absolute top-1 right-1 text-xs text-gray-600 hover:text-black"
      >
        {collapsed ? '▼' : '▲'}
      </button>

      {collapsed ? (
        // Collapsed view: display key info
        <div 
          className="flex items-center space-x-4 text-sm cursor-pointer"
          onClick={() => setCollapsed(false)}
        >
          <span>
            <strong>Client:</strong> {localEvent.clientName || <em>None</em>}
          </span>
          <span>
            <strong>Event:</strong> {localEvent.eventName || <em>None</em>}
          </span>
          <span>
            <strong>Date:</strong> {localEvent.eventDate || <em>None</em>}
          </span>
        </div>
      ) : (
        // Expanded view: editable form
        <div className="bg-gray-50 p-2">
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
              placeholder="Amount Paid After"
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

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="mt-2 px-4 py-1 bg-green-500 text-white rounded text-sm"
            title="Save event changes"
          >
            Save
          </button>
        </div>
      )}

      {/* Action Buttons: visible in expanded mode */}
      {!collapsed && (
        <div className="mt-2 flex space-x-2">
          {localEvent.status !== 'maybe' && onMoveLeft && (
            <button 
              className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
              onClick={() => onMoveLeft(localEvent.id)}
              title="Move event to the left"
            >
              &larr; Move Left
            </button>
          )}
          {localEvent.status !== 'finished' && onMoveRight && (
            <button 
              className="bg-green-500 text-white px-3 py-1 rounded text-sm"
              onClick={() => onMoveRight(localEvent.id)}
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
