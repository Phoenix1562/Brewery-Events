// components/MaybeTab.js
import React from 'react';
import EventPreviewCard from './EventPreviewCard';
import { PlusCircle, Calendar, Clock } from 'lucide-react';

function MaybeTab({ events, addEvent, onSelectEvent }) {
  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Clock className="h-6 w-6 text-amber-500 mr-2" />
          <h2 className="text-2xl font-bold text-gray-800">Pending Events</h2>
        </div>
        
        <button
          onClick={addEvent}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
        >
          <PlusCircle className="h-5 w-5" />
          <span>New Event</span>
        </button>
      </div>
      
      {/* Counter badge */}
      {events.length > 0 && (
        <div className="mb-6 flex">
          <div className="bg-amber-50 text-amber-700 px-4 py-2 rounded-full text-sm font-medium">
            {events.length} pending {events.length === 1 ? 'event' : 'events'}
          </div>
        </div>
      )}

      {/* Event list */}
      {events.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">No pending events</p>
          <button
            onClick={addEvent}
            className="mt-4 inline-flex items-center text-amber-600 hover:text-amber-700 font-medium"
          >
            <PlusCircle className="h-4 w-4 mr-1" />
            Create your first event
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map(event => (
            <EventPreviewCard
              key={event.id}
              event={event}
              onClick={() => onSelectEvent(event)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default MaybeTab;