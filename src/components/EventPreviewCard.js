// components/EventPreviewCard.js
import React from 'react';

function EventPreviewCard({ event, onClick, highlight }) {
  return (
    <div
      className={`mb-4 p-4 bg-white rounded-xl shadow hover:shadow-lg cursor-pointer transition ${
        highlight ? 'border-l-4 border-blue-500 pl-2' : ''
      }`}
      onClick={onClick}
    >
      <p className="text-lg font-semibold text-gray-800">
        {event.clientName || 'No Client'}
      </p>
      <p className="text-gray-600">
        {event.eventName || 'No Event Name'}
      </p>
      <p className="text-sm text-gray-500">
        {event.eventDate || 'No Date'}
      </p>
    </div>
  );
}

export default EventPreviewCard;
