// components/MaybeTab.js
import React from 'react';
import EventPreviewCard from './EventPreviewCard';

function MaybeTab({ events, addEvent, onSelectEvent }) {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-2">Pending Events</h2>
      <button
        onClick={addEvent}
        className="mb-4 bg-blue-500 text-white px-4 py-2 rounded"
      >
        + New Event
      </button>
      {events.length === 0 ? (
        <p>No pending events.</p>
      ) : (
        events.map(event => (
          <EventPreviewCard
            key={event.id}
            event={event}
            onClick={() => onSelectEvent(event)}
          />
        ))
      )}
    </div>
  );
}

export default MaybeTab;
