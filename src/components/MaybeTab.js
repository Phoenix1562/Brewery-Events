// components/MaybeTab.js
import React from 'react';
import EventCard from './EventCard';

function MaybeTab({ events, addEvent, onUpdate, onMoveLeft, onMoveRight, onDelete, onSave, onSelectEvent, activeEventId }) {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-2">Pending Events</h2>
      <p className="mb-4 text-gray-600"></p>
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
          <div
            key={event.id}
            className="mb-4 cursor-pointer"
            onClick={() => onSelectEvent(event)}
          >
            <EventCard
              event={event}
              onUpdate={onUpdate}
              onMoveLeft={onMoveLeft}
              onMoveRight={onMoveRight}
              onDelete={onDelete}
              onSave={onSave}
              active={activeEventId === event.id}
            />
          </div>
        ))
      )}
    </div>
  );
}

export default MaybeTab;
