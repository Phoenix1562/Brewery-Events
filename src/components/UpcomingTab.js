import React from 'react';
import EventCard from './EventCard';

function UpcomingTab({ events, onUpdate, onMoveLeft, onMoveRight, onDelete, onSave }) {
  // Sort events by eventDate (earliest first)
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.eventDate) - new Date(b.eventDate)
  );

  return (
    <div className="p-4">
      {/* Title and Context */}
      <h2 className="text-2xl font-bold mb-2">Upcoming Events</h2>
      <p className="mb-4 text-gray-600">
        Here’s what’s coming up!
      </p>

      {/* Tiny Stats Summary */}
      <p className="mb-4">
        <strong>Total Upcoming Events:</strong> {events.length}
      </p>

      {/* Render Sorted Events */}
      {sortedEvents.length === 0 ? (
        <p className="text-gray-500 italic">
          You’re all caught up! No upcoming events at the moment.
        </p>
      ) : (
        sortedEvents.map((event, index) => (
          <div
            key={event.id}
            className={`mb-4 ${index === 0 ? 'border-l-4 border-blue-500 pl-2' : ''}`}
          >
            <EventCard
              event={event}
              onUpdate={onUpdate}
              onMoveLeft={onMoveLeft}
              onMoveRight={onMoveRight}
              onDelete={onDelete}
              onSave={onSave} // ✅ Add this line
            />
          </div>
        ))
      )}
    </div>
  );
}

export default UpcomingTab;
