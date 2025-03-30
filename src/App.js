import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import MaybeTab from './components/MaybeTab';
import UpcomingTab from './components/UpcomingTab';
import FinishedTab from './components/FinishedTab';
import StatisticsTab from './components/StatisticsTab';
import CalendarTab from './components/CalendarTab';
import ExportModal from './components/ExportModal';
import AuthForm from './components/AuthForm';
import { db, auth } from './firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { exportEventsToExcel } from './utils/export';
import { onAuthStateChanged, signOut } from 'firebase/auth';

function App() {
  // All hooks are called unconditionally at the top.
  const [currentTab, setCurrentTab] = useState('maybe');
  const [events, setEvents] = useState([]);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Memoize allowedEmails so its reference stays stable.
  const allowedEmails = useMemo(() => [
    'knuthmitchell@gmail.com',
    'jknuth@johnsonville.com',
    // Add more allowed emails here
  ], []);

  // Monitor auth state and enforce the greenlist.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        if (!allowedEmails.includes(currentUser.email)) {
          alert("Sorry, your email is not permitted to access this app.");
          signOut(auth);
        } else {
          console.log("Allowed user signed in:", currentUser.email);
        }
      }
    });
    return () => unsubscribe();
  }, [allowedEmails]);

  // Load events from Firestore on component mount
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const snapshot = await getDocs(collection(db, "events"));
        const loadedEvents = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setEvents(loadedEvents);
        console.log("📥 Events loaded from Firestore:", loadedEvents);
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
      files: []  // Support multiple file attachments
    };

    try {
      const docRef = await addDoc(collection(db, 'events'), newEvent);
      const eventWithId = { id: docRef.id, ...newEvent };
      setEvents(prev => [...prev, eventWithId]);
      console.log("🔥 Event saved to Firebase:", docRef.id);
    } catch (err) {
      console.error("💥 Failed to save event:", err);
    }
  };

  // Update a single field of an event
  const updateEvent = async (id, field, value) => {
    const updatedEvents = events.map(event =>
      event.id === id ? { ...event, [field]: value } : event
    );
    setEvents(updatedEvents);

    try {
      const docRef = doc(db, "events", id);
      await updateDoc(docRef, { [field]: value });
      console.log("✅ Updated Firebase for", field, "=", value);
    } catch (err) {
      console.error("💥 Failed to update event:", err);
    }
  };

  // Save the entire updated event to Firestore
  const saveEvent = async (updatedEvent) => {
    try {
      const { id, ...fields } = updatedEvent; // Remove id from update payload
      const docRef = doc(db, "events", id);
      await updateDoc(docRef, fields);
      console.log("✅ Event saved to Firebase:", id);
      setEvents(prev => prev.map(event => event.id === id ? updatedEvent : event));
    } catch (err) {
      console.error("💥 Error saving event:", err);
    }
  };

  const moveEvent = async (id, newStatus) => {
    const eventToUpdate = events.find(event => event.id === id);
    if (!eventToUpdate) return;
  
    let updatedEvent = { ...eventToUpdate, status: newStatus };
  
    if (
      newStatus === 'finished' &&
      (!eventToUpdate.eventDate || isNaN(new Date(eventToUpdate.eventDate)))
    ) {
      updatedEvent.eventDate = new Date().toISOString().split('T')[0];
    }
  
    try {
      const docRef = doc(db, "events", id);
      await updateDoc(docRef, updatedEvent);
      console.log("✅ Moved event", id, "to", newStatus, "with date", updatedEvent.eventDate);
      setEvents(prevEvents =>
        prevEvents.map(event => (event.id === id ? updatedEvent : event))
      );
    } catch (err) {
      console.error("💥 Failed to move event:", err);
    }
  };

  const handleMoveLeftEvent = (id) => {
    const event = events.find(e => e.id === id);
    if (!event) return;
    if (event.status === 'upcoming') {
      moveEvent(id, 'maybe');
    } else if (event.status === 'finished') {
      moveEvent(id, 'upcoming');
    }
  };

  const handleMoveRightEvent = (id) => {
    const event = events.find(e => e.id === id);
    if (!event) return;
    if (event.status === 'maybe') {
      moveEvent(id, 'upcoming');
    } else if (event.status === 'upcoming') {
      moveEvent(id, 'finished');
    }
  };

  const deleteEvent = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this event?");
    if (!confirmed) return;
  
    try {
      await deleteDoc(doc(db, "events", id));
      const updatedEvents = events.filter(event => event.id !== id);
      setEvents(updatedEvents);
      console.log("🗑️ Deleted event:", id);
    } catch (err) {
      console.error("💥 Failed to delete event:", err);
      alert("Failed to delete event from Firestore.");
    }
  };

  const sortByDate = (list) => {
    return list.slice().sort((a, b) => {
      if (!a.eventDate) return 1;
      if (!b.eventDate) return -1;
      return new Date(a.eventDate) - new Date(b.eventDate);
    });
  };

  const filteredEvents = sortByDate(events.filter(e => e.status === currentTab));

  const renderTab = () => {
    if (currentTab === 'maybe') {
      return (
        <MaybeTab 
          events={filteredEvents}
          addEvent={addEvent}
          onUpdate={updateEvent}
          onSave={saveEvent}
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
          onSave={saveEvent}
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
          onSave={saveEvent}
          onMoveLeft={handleMoveLeftEvent}
          onMoveRight={null} // no right move in 'finished'
          onDelete={deleteEvent}
        />
      );
    } else if (currentTab === 'statistics') {
      return <StatisticsTab events={events} />;
    } else if (currentTab === 'calendar') {
      return <CalendarTab events={events} />;
    }
  };

  const handleExportConfirm = (filterOptions) => {
    exportEventsToExcel(events, filterOptions);
  };

  // Decide what to render based on authentication state.
  let content;
  if (loading) {
    content = <div>Loading...</div>;
  } else if (!user) {
    content = <AuthForm />;
  } else {
    content = (
      <div className="flex h-screen">
        <Sidebar 
          currentTab={currentTab} 
          setCurrentTab={setCurrentTab} 
          onExport={() => setExportModalVisible(true)}
        />
        <div className="flex-1 p-4 overflow-auto">
          {renderTab()}
        </div>
        <ExportModal 
          visible={exportModalVisible}
          onClose={() => setExportModalVisible(false)}
          onConfirm={handleExportConfirm}
        />
      </div>
    );
  }

  return content;
}

export default App;
