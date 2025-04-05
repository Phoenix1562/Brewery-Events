// src/App.js
import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import MaybeTab from './components/MaybeTab';
import UpcomingTab from './components/UpcomingTab';
import FinishedTab from './components/FinishedTab';
import StatisticsTab from './components/StatisticsTab';
import CalendarTab from './components/CalendarTab';
import ExportModal from './components/ExportModal';
import AuthForm from './components/AuthForm';
import SidePanel from './components/SidePanel';
import EventCard from './components/EventCard';
import { db, auth } from './firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { exportEventsToExcel } from './utils/export';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const [currentTab, setCurrentTab] = useState('maybe');
  const [events, setEvents] = useState([]);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeEvent, setActiveEvent] = useState(null);

  const allowedEmails = useMemo(() => [
    'knuthmitchell@gmail.com',
    'jknuth@johnsonville.com',
  ], []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser && !allowedEmails.includes(currentUser.email)) {
        alert("Sorry, your email is not permitted to access this app.");
        signOut(auth);
      }
    });
    return () => unsubscribe();
  }, [allowedEmails]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const snapshot = await getDocs(collection(db, "events"));
        const loadedEvents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEvents(loadedEvents);
      } catch (err) {
        console.error("💥 Failed to load events:", err);
      }
    };
    fetchEvents();
  }, []);

  const addEvent = async () => {
    const newEvent = {
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
      status: 'maybe',
      createdAt: new Date().toISOString(),
      files: []
    };
    try {
      const docRef = await addDoc(collection(db, 'events'), newEvent);
      const eventWithId = { id: docRef.id, ...newEvent };
      setEvents(prev => [...prev, eventWithId]);
    } catch (err) {
      console.error("💥 Failed to save event:", err);
    }
  };

  const updateEvent = async (id, field, value) => {
    const updatedEvents = events.map(event => event.id === id ? { ...event, [field]: value } : event);
    setEvents(updatedEvents);
    try {
      await updateDoc(doc(db, "events", id), { [field]: value });
    } catch (err) {
      console.error("💥 Failed to update event:", err);
    }
  };

  const saveEvent = async (updatedEvent) => {
    try {
      const { id, ...fields } = updatedEvent;
      await updateDoc(doc(db, "events", id), fields);
      setEvents(prev => prev.map(event => event.id === id ? updatedEvent : event));
    } catch (err) {
      console.error("💥 Error saving event:", err);
    }
  };

  const moveEvent = async (id, newStatus) => {
    const eventToUpdate = events.find(event => event.id === id);
    if (!eventToUpdate) return;
    const updatedEvent = {
      ...eventToUpdate,
      status: newStatus,
      ...(newStatus === 'finished' && (!eventToUpdate.eventDate || isNaN(new Date(eventToUpdate.eventDate))) && {
        eventDate: new Date().toISOString().split('T')[0]
      })
    };
    try {
      await updateDoc(doc(db, "events", id), updatedEvent);
      setEvents(prev => prev.map(event => (event.id === id ? updatedEvent : event)));
    } catch (err) {
      console.error("💥 Failed to move event:", err);
    }
  };

  const handleMoveLeftEvent = (id) => {
    const event = events.find(e => e.id === id);
    if (!event) return;
    if (event.status === 'upcoming') moveEvent(id, 'maybe');
    else if (event.status === 'finished') moveEvent(id, 'upcoming');
  };

  const handleMoveRightEvent = (id) => {
    const event = events.find(e => e.id === id);
    if (!event) return;
    if (event.status === 'maybe') moveEvent(id, 'upcoming');
    else if (event.status === 'upcoming') moveEvent(id, 'finished');
  };

  const deleteEvent = async (id) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      await deleteDoc(doc(db, "events", id));
      setEvents(prev => prev.filter(event => event.id !== id));
    } catch (err) {
      console.error("💥 Failed to delete event:", err);
    }
  };

  const filteredEvents = useMemo(() => events.filter(e => e.status === currentTab), [events, currentTab]);

  const renderTab = () => {
    const props = {
      events: filteredEvents,
      onUpdate: updateEvent,
      onSave: saveEvent,
      onMoveLeft: handleMoveLeftEvent,
      onMoveRight: handleMoveRightEvent,
      onDelete: deleteEvent,
      onSelectEvent: (event) => setActiveEvent(event),
    };
    switch (currentTab) {
      case 'maybe': return <MaybeTab {...props} addEvent={addEvent} />;
      case 'upcoming': return <UpcomingTab {...props} />;
      case 'finished': return <FinishedTab {...props} onMoveRight={null} />;
      case 'statistics': return <StatisticsTab events={events} />;
      case 'calendar': return <CalendarTab events={events} />;
      default: return null;
    }
  };

  const handleExportConfirm = (filterOptions) => {
    exportEventsToExcel(events, filterOptions);
  };

  // Close the side panel when the tab changes
  useEffect(() => {
    setActiveEvent(null);
  }, [currentTab]);

  if (loading) return <div>Loading...</div>;
  if (!user) return <AuthForm />;

  return (
    <div className="flex h-screen">
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onExport={() => setExportModalVisible(true)}
      />
      {/* Main content area */}
      <div className="flex-1 p-4 overflow-auto relative">
        {renderTab()}
      </div>

      {/* SidePanel with EventCard and external action panel at the bottom */}
      {activeEvent && (
        <SidePanel isOpen={!!activeEvent} onClose={() => setActiveEvent(null)}>
          {/* Render EventCard with internal actions hidden */}
          <EventCard
            event={activeEvent}
            onUpdate={updateEvent}
            onMoveLeft={handleMoveLeftEvent}
            onMoveRight={handleMoveRightEvent}
            onDelete={deleteEvent}
            onSave={saveEvent}
            setActiveEvent={setActiveEvent}
            active={true}
            hideActions={true}
          />
          {/* External Action Panel Positioned at the bottom of the SidePanel */}
          <AnimatePresence>
            {activeEvent && (
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0, transition: { duration: 0.2 } }}
                transition={{ type: 'spring', stiffness: 200, damping: 30 }}
                className="flex flex-col space-y-2 bg-white p-4 border-t mt-4"
                style={{ width: '100%' }}
              >
                <button
                  onClick={() => saveEvent(activeEvent)}
                  className="bg-green-500 text-white w-full px-4 py-2 rounded text-sm hover:bg-green-600 transition"
                >
                  Save
                </button>
                <button
                  onClick={() => handleMoveRightEvent(activeEvent.id)}
                  className="bg-blue-500 text-white w-full px-4 py-2 rounded text-sm hover:bg-blue-600 transition"
                >
                  Move Right &rarr;
                </button>
                <button
                  onClick={() => handleMoveLeftEvent(activeEvent.id)}
                  className="bg-blue-500 text-white w-full px-4 py-2 rounded text-sm hover:bg-blue-600 transition"
                >
                  &larr; Move Left
                </button>
                <button
                  onClick={() => deleteEvent(activeEvent.id)}
                  className="bg-red-500 text-white w-full px-4 py-2 rounded text-sm hover:bg-red-600 transition"
                >
                  Delete
                </button>
                <button
                  onClick={() => setActiveEvent(null)}
                  className="text-red-500 w-full text-sm underline"
                >
                  Close
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </SidePanel>
      )}

      <ExportModal
        visible={exportModalVisible}
        onClose={() => setExportModalVisible(false)}
        onConfirm={handleExportConfirm}
      />
    </div>
  );
}

export default App;
