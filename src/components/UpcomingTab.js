// components/UpcomingTab.js
import React from 'react';
import EventPreviewCard from './EventPreviewCard';

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
          <EventPreviewCard
            key={event.id}
            event={event}
            onClick={() => onSelectEvent(event)}
            highlight={firstEventDate && event.eventDate === firstEventDate}
          />
        ))
      )}
    </div>
  );
}

export default UpcomingTab;
