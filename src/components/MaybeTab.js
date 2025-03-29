import React from 'react';
import EventCard from './EventCard';

function MaybeTab({ events, addEvent, onUpdate, onMoveLeft, onMoveRight, onDelete }) {
  return (
    <div className="p-4">
      {/* Title and Context */}
      <h2 className="text-2xl font-bold mb-2">Pending Events</h2>
      <p className="mb-4 text-gray-600">
        
      </p>

      <button
        onClick={addEvent}
        className="mb-4 bg-blue-500 text-white px-4 py-2 rounded"
      >
        + New Event
      </button>
      {events.length === 0 ? (
        <p>No events in Pending.</p>
      ) : (
        events.map(event => (
          <div key={event.id} className="mb-4">
            <EventCard
              event={event}
              onUpdate={onUpdate}
              onMoveLeft={onMoveLeft}
              onMoveRight={onMoveRight}
              onDelete={onDelete}
            />
          </div>
        ))
      )}
    </div>
  );
}

export default MaybeTab;
