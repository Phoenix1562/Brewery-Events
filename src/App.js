import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import MaybeTab from './components/MaybeTab';
import UpcomingTab from './components/UpcomingTab';
import FinishedTab from './components/FinishedTab';
import StatisticsTab from './components/StatisticsTab';

function App() {
  const [currentTab, setCurrentTab] = useState('maybe');
  const [events, setEvents] = useState([]);

  const addEvent = () => {
    const newEvent = {
      id: Date.now(),
      clientName: '',
      eventName: '',
      eventDate: '',
      buildingArea: '',
      priceGiven: '',
      downPaymentRequired: '',
      downPaymentReceived: false,
      amountDueAfter: '',
      amountPaidAfter: '',
      grandTotal: '',
      securityDeposit: '',
      notes: '',
      status: 'maybe'
    };
    setEvents([...events, newEvent]);
  };

  const updateEvent = (id, field, value) => {
    const updatedEvents = events.map(event =>
      event.id === id ? { ...event, [field]: value } : event
    );
    setEvents(updatedEvents);
  };

  const moveEvent = (id, newStatus) => {
    const updatedEvents = events.map(event =>
      event.id === id ? { ...event, status: newStatus } : event
    );
    setEvents(updatedEvents);
  };

  // Move event to previous status
  const handleMoveLeftEvent = (id) => {
    const event = events.find(e => e.id === id);
    if (!event) return;
    if (event.status === 'upcoming') {
      moveEvent(id, 'maybe');
    } else if (event.status === 'finished') {
      moveEvent(id, 'upcoming');
    }
  };

  // Move event to next status
  const handleMoveRightEvent = (id) => {
    const event = events.find(e => e.id === id);
    if (!event) return;
    if (event.status === 'maybe') {
      moveEvent(id, 'upcoming');
    } else if (event.status === 'upcoming') {
      moveEvent(id, 'finished');
    }
  };

  const deleteEvent = (id) => {
    const updatedEvents = events.filter(event => event.id !== id);
    setEvents(updatedEvents);
  };

  const sortByDate = (list) => {
    return list.slice().sort((a, b) => {
      if (!a.eventDate) return 1;
      if (!b.eventDate) return -1;
      return new Date(a.eventDate) - new Date(b.eventDate);
    });
  };

  // For tabs that are not "statistics", filter events by their status.
  const filteredEvents = sortByDate(events.filter(e => e.status === currentTab));

  const renderTab = () => {
    if (currentTab === 'maybe') {
      return (
        <MaybeTab 
          events={filteredEvents}
          addEvent={addEvent}
          onUpdate={updateEvent}
          onMoveLeft={null} // no left move in 'maybe'
          onMoveRight={handleMoveRightEvent}
          onDelete={deleteEvent}
        />
      );
    } else if (currentTab === 'upcoming') {
      return (
        <UpcomingTab 
          events={filteredEvents}
          onUpdate={updateEvent}
          onMoveLeft={handleMoveLeftEvent}
          onMoveRight={handleMoveRightEvent}
          onDelete={deleteEvent}
        />
      );
    } else if (currentTab === 'finished') {
      return (
        <FinishedTab 
          events={filteredEvents}
          onUpdate={updateEvent}
          onMoveLeft={handleMoveLeftEvent}
          onMoveRight={null} // no right move in 'finished'
          onDelete={deleteEvent}
        />
      );
    } else if (currentTab === 'statistics') {
      return <StatisticsTab events={events} />;
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />
      <div className="flex-1 p-4 overflow-auto">
        {renderTab()}
      </div>
    </div>
  );
}

export default App;
