import React, { useState, useEffect } from 'react';

function EventCard({ event, onUpdate, onMoveLeft, onMoveRight, onDelete }) {
  const [collapsed, setCollapsed] = useState(true);

  // Auto-collapse when the event status changes
  useEffect(() => {
    setCollapsed(true);
  }, [event.status]);

  const handleChange = (field, value) => {
    onUpdate(event.id, field, value);
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
        // Collapsed view: display key info in a small horizontal layout
        <div 
          className="flex items-center space-x-4 text-sm cursor-pointer"
          onClick={() => setCollapsed(false)}
        >
          <span><strong>Client:</strong> {event.clientName || <em>None</em>}</span>
          <span><strong>Event:</strong> {event.eventName || <em>None</em>}</span>
          <span><strong>Date:</strong> {event.eventDate || <em>None</em>}</span>
        </div>
      ) : (
        // Expanded view: full editable form inside a slightly different background
        <div className="bg-gray-50 p-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="Client Name"
              value={event.clientName}
              onChange={(e) => handleChange('clientName', e.target.value)}
              className="border p-2 text-sm"
            />
            <input
              type="text"
              placeholder="Event Name"
              value={event.eventName}
              onChange={(e) => handleChange('eventName', e.target.value)}
              className="border p-2 text-sm"
            />
            <input
              type="date"
              value={event.eventDate}
              onChange={(e) => handleChange('eventDate', e.target.value)}
              className="border p-2 text-sm"
            />
            <select
              value={event.buildingArea}
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
              value={event.priceGiven}
              onChange={(e) => handleChange('priceGiven', e.target.value)}
              className="border p-2 text-sm"
            />
            <input
              type="number"
              placeholder="Down Payment Required"
              value={event.downPaymentRequired}
              onChange={(e) => handleChange('downPaymentRequired', e.target.value)}
              className="border p-2 text-sm"
            />
            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={event.downPaymentReceived}
                onChange={(e) => handleChange('downPaymentReceived', e.target.checked)}
                className="mr-1"
              />
              Down Payment Received
            </label>
            <input
              type="number"
              placeholder="Amount Due After"
              value={event.amountDueAfter}
              onChange={(e) => handleChange('amountDueAfter', e.target.value)}
              className="border p-2 text-sm"
            />
            <input
              type="number"
              placeholder="Amount Paid After"
              value={event.amountPaidAfter}
              onChange={(e) => handleChange('amountPaidAfter', e.target.value)}
              className="border p-2 text-sm"
            />
            <input
              type="number"
              placeholder="Grand Total"
              value={event.grandTotal}
              onChange={(e) => handleChange('grandTotal', e.target.value)}
              className="border p-2 text-sm"
            />
            <input
              type="number"
              placeholder="Security Deposit"
              value={event.securityDeposit}
              onChange={(e) => handleChange('securityDeposit', e.target.value)}
              className="border p-2 text-sm"
            />
          </div>
          <textarea
            placeholder="Notes"
            value={event.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            className="border p-2 mt-2 w-full text-sm"
            rows="3"
          ></textarea>
        </div>
      )}

      {/* Action Buttons: only visible in expanded mode */}
      {!collapsed && (
        <div className="mt-2 flex space-x-2">
          {event.status !== 'maybe' && onMoveLeft && (
            <button 
              className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
              onClick={() => onMoveLeft(event.id)}
              title="Move event to the left"
            >
              &larr; Move Left
            </button>
          )}
          {event.status !== 'finished' && onMoveRight && (
            <button 
              className="bg-green-500 text-white px-3 py-1 rounded text-sm"
              onClick={() => onMoveRight(event.id)}
              title="Move event to the right"
            >
              Move Right &rarr;
            </button>
          )}
          {onDelete && (
            <button 
              className="bg-red-500 text-white px-3 py-1 rounded text-sm"
              onClick={() => onDelete(event.id)}
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
