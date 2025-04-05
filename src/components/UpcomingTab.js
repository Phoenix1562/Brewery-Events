// components/UpcomingTab.js
import React from 'react';

function UpcomingTab({ events, onSelectEvent }) {
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.eventDate) - new Date(b.eventDate)
  );

  const firstEventDate = sortedEvents.length > 0 ? sortedEvents[0].eventDate : null;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-2">Upcoming Events</h2>
      <p className="mb-4 text-gray-600">Here’s what’s coming up!</p>
      <p className="mb-4">
        <strong>Total Upcoming Events:</strong> {events.length}
      </p>

      {sortedEvents.length === 0 ? (
        <p className="text-gray-500 italic">
          You’re all caught up! No upcoming events at the moment.
        </p>
      ) : (
        sortedEvents.map(event => (
          <div
            key={event.id}
            className={`mb-4 p-4 bg-white rounded shadow cursor-pointer hover:shadow-md ${
              firstEventDate && event.eventDate === firstEventDate ? 'border-l-4 border-blue-500 pl-2' : ''
            }`}
            onClick={() => onSelectEvent(event)}
          >
            <div>
              <p><strong>Client:</strong> {event.clientName || 'None'}</p>
              <p><strong>Event:</strong> {event.eventName || 'None'}</p>
              <p><strong>Date:</strong> {event.eventDate || 'None'}</p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default UpcomingTab;
