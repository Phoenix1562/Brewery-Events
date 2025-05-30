import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { db } from '../firebase'; // Assuming this is how you import Firebase
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';

// Helper: Format Date as YYYY-MM-DD using local time
const formatDate = (date) => {
    if (!date) return '';
    // Make sure we have a Date object
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return ''; // Handle invalid date

    const year = d.getFullYear();
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
};

// Helper: Convert 24-hour time to 12-hour time with AM/PM
const formatTime12Hour = (time) => {
    if (!time) return '';
    try {
        const [hours, minutes] = time.split(':');
        const hourNum = parseInt(hours, 10);
        if (isNaN(hourNum) || isNaN(parseInt(minutes, 10))) return 'Invalid Time'; // Basic validation
        const period = hourNum >= 12 ? 'PM' : 'AM';
        const hour12 = hourNum % 12 || 12; // Convert 0 to 12 for midnight/noon
        return `${hour12}:${minutes} ${period}`;
    } catch (e) {
        return 'Invalid Time'; // Catch potential split errors
    }
};


function CalendarTab({ events = [], onEventClick }) { // Added default value for events
  // --- State Declarations ---
  const [includePending, setIncludePending] = useState(() => {
    const stored = localStorage.getItem('calendarIncludePending');
    return stored ? stored === 'true' : false;
  });
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('calendarViewMode') || 'monthly';
  });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [infoModalContent, setInfoModalContent] = useState({ date: null, events: [], notes: [] }); // Include notes here too

  // Calendar notes state
  const [calendarNotes, setCalendarNotes] = useState([]);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [newNote, setNewNote] = useState({
    id: null, // Add id for editing tracking
    title: '',
    content: '',
    color: '#4299e1', // Default blue color
    date: '',
  });

  const todayStr = useMemo(() => formatDate(new Date()), []); // Calculate today string once

  // --- Effects ---

  // Fetch calendar notes on component mount
  const fetchCalendarNotes = useCallback(async () => {
    try {
      const notesSnapshot = await getDocs(collection(db, "calendarNotes"));
      const notes = notesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCalendarNotes(notes);
    } catch (err) {
      console.error("Failed to load calendar notes:", err);
      // Consider adding user feedback here
    }
  }, []); // Empty dependency array - runs once on mount

  useEffect(() => {
    fetchCalendarNotes();
  }, [fetchCalendarNotes]);

  // Store preferences in localStorage
  useEffect(() => {
    localStorage.setItem('calendarIncludePending', includePending.toString());
  }, [includePending]);
  useEffect(() => {
    localStorage.setItem('calendarViewMode', viewMode);
  }, [viewMode]);

  // --- Event Filtering ---
  const filteredEvents = useMemo(() => {
    return events.filter(e =>
      includePending ? (e.status === 'upcoming' || e.status === 'maybe') : (e.status === 'upcoming')
    );
  }, [events, includePending]);

  // --- Handlers ---

  // Navigation
  const handlePrev = () => {
    setCurrentDate(prevDate => {
        const newDate = new Date(prevDate);
        if (viewMode === "monthly") {
            newDate.setMonth(newDate.getMonth() - 1);
            newDate.setDate(1); // Go to the first of the previous month
        } else {
            newDate.setDate(newDate.getDate() - 7);
        }
        return newDate;
    });
  };

  const handleNext = () => {
     setCurrentDate(prevDate => {
        const newDate = new Date(prevDate);
        if (viewMode === "monthly") {
            newDate.setMonth(newDate.getMonth() + 1);
            newDate.setDate(1); // Go to the first of the next month
        } else {
            newDate.setDate(newDate.getDate() + 7);
        }
        return newDate;
     });
  };

  // Info Modal (for viewing day details)
  const openInfoModalForDate = useCallback((date, eventsForDay, notesForDay) => {
    setInfoModalContent({ date, events: eventsForDay, notes: notesForDay });
    setInfoModalOpen(true);
  }, []); // Depends only on setter function

  // Note Modal (for adding/editing notes)
  const openNoteModalForAdd = useCallback((date) => {
    setNewNote({
      id: null, // Ensure it's treated as new
      title: '',
      content: '',
      color: '#4299e1',
      date: formatDate(date), // Pre-fill date
    });
    setNoteModalOpen(true);
  }, []); // Depends only on setter functions

  const openNoteModalForEdit = useCallback((note) => {
    setNewNote({ ...note }); // Load existing note data
    setNoteModalOpen(true);
  }, []); // Depends only on setter functions

  const closeNoteModal = () => {
    setNoteModalOpen(false);
    // Reset newNote state after modal closes to avoid stale data
    setNewNote({ id: null, title: '', content: '', color: '#4299e1', date: '' });
  };

  const saveCalendarNote = async () => {
    if (!newNote.title) {
      alert("Please enter a title for your note");
      return;
    }
    if (!newNote.date) {
        alert("Please select a date for your note");
        return;
    }

    try {
      // Ensure data only includes fields intended for Firestore
      const noteData = {
          title: newNote.title,
          content: newNote.content,
          color: newNote.color,
          date: newNote.date,
      };

      if (newNote.id) { // Editing existing note
        await updateDoc(doc(db, "calendarNotes", newNote.id), noteData);
        // Update local state immutably
        setCalendarNotes(prev => prev.map(note => note.id === newNote.id ? { id: newNote.id, ...noteData } : note));
      } else { // Creating new note
        const docRef = await addDoc(collection(db, "calendarNotes"), noteData);
        // Add to local state with new ID
        setCalendarNotes(prev => [...prev, { id: docRef.id, ...noteData }]);
      }
      closeNoteModal(); // Close modal on success
    } catch (err) {
      console.error("Failed to save calendar note:", err);
      alert("Failed to save note. Check console for details.");
    }
  };

  const deleteCalendarNote = async (id) => {
    if (!id) return;
    if (!window.confirm("Are you sure you want to delete this note?")) return;

    try {
      await deleteDoc(doc(db, "calendarNotes", id));
      setCalendarNotes(prev => prev.filter(note => note.id !== id));
      // If the deleted note was being viewed in the info modal, update modal state
      setInfoModalContent(prev => ({
          ...prev,
          notes: prev.notes.filter(note => note.id !== id)
      }));
    } catch (err) {
      console.error("Failed to delete calendar note:", err);
      alert("Failed to delete note. Check console for details.");
    }
  };


  // --- Calendar Grid Calculation (Corrected) ---
  const weeks = useMemo(() => {
    const weeksArray = [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const allDays = []; // Flat array of all day objects to display

    if (viewMode === "monthly") {
      const firstDayOfMonth = new Date(year, month, 1);
      const lastDayOfMonth = new Date(year, month + 1, 0);
      const firstDayWeekday = firstDayOfMonth.getDay(); // 0=Sun
      const lastDayWeekday = lastDayOfMonth.getDay(); // 6=Sat

      // Calculate the first Sunday to display
      const startDate = new Date(firstDayOfMonth);
      startDate.setDate(startDate.getDate() - firstDayWeekday);

      // Calculate the last Saturday to display
      const endDate = new Date(lastDayOfMonth);
      // Only add days if needed to reach Saturday
      if (lastDayWeekday < 6) {
          endDate.setDate(endDate.getDate() + (6 - lastDayWeekday));
      }


      let currentDay = new Date(startDate);
      // Ensure we don't loop indefinitely if something is wrong
      let safety = 0;
      while (currentDay <= endDate && safety < 50) {
        allDays.push(new Date(currentDay));
        currentDay.setDate(currentDay.getDate() + 1);
        safety++;
      }

    } else { // Weekly view
      const current = new Date(currentDate);
      const dayOfWeek = current.getDay(); // 0=Sun
      const weekStart = new Date(current);
      weekStart.setDate(current.getDate() - dayOfWeek); // Find Sunday of the current week
      for (let i = 0; i < 7; i++) {
        // Create new Date objects to avoid mutation issues
        allDays.push(new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i));
      }
    }

    // Chunk the flat 'allDays' array into weeks (arrays of 7 days)
    for (let i = 0; i < allDays.length; i += 7) {
        weeksArray.push(allDays.slice(i, i + 7));
    }

    return weeksArray;
  }, [currentDate, viewMode]);


  // --- Render ---
  return (
    <div className="p-4 relative w-full zoom-90">
      
      <div className="laptop:transform laptop:scale-[0.99] laptop:origin-top">
      <h2 className="text-2xl font-bold mb-4">Calendar</h2>
      
      {/* Control Panel */}
      <div className="flex flex-wrap items-center justify-between mb-4 bg-gray-50 p-3 rounded-lg gap-4">
        <div className="flex items-center mr-4 flex-shrink-0">
          <input
            type="checkbox"
            id="includePending"
            checked={includePending}
            onChange={(e) => setIncludePending(e.target.checked)}
            className="mr-2 h-4 w-4 cursor-pointer"
          />
          <label htmlFor="includePending" className="text-sm select-none cursor-pointer">Include Pending Events</label>
        </div>

        <div className="flex items-center space-x-4 flex-shrink-0">
          <label className="flex items-center cursor-pointer">
             <input type="radio" name="viewMode" value="monthly" checked={viewMode === 'monthly'} onChange={() => setViewMode("monthly")} className="mr-1 cursor-pointer"/>
             <span className="text-sm select-none">Monthly</span>
          </label>
          <label className="flex items-center cursor-pointer">
             <input type="radio" name="viewMode" value="weekly" checked={viewMode === 'weekly'} onChange={() => setViewMode("weekly")} className="mr-1 cursor-pointer"/>
             <span className="text-sm select-none">Weekly</span>
          </label>
        </div>

        <button
          className="bg-green-500 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-green-600 whitespace-nowrap transition-colors shadow-sm"
          onClick={() => openNoteModalForAdd(new Date())}
        >
          Add Calendar Note
        </button>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center mb-4">
        <button onClick={handlePrev} className="px-4 py-2 bg-blue-500 text-white rounded font-medium hover:bg-blue-600 transition-colors shadow-sm">Previous</button>
        <h3 className="text-xl font-semibold text-center mx-2 sm:mx-4">
          {viewMode === "monthly"
            ? `${currentDate.toLocaleString('default', { month: 'long' })} ${currentDate.getFullYear()}`
            // Ensure weeks[0] and weeks[0][0] exist before accessing toLocaleDateString
            : `Week of ${weeks[0]?.[0]?.toLocaleDateString() ?? ''}`
          }
        </h3>
        <button onClick={handleNext} className="px-4 py-2 bg-blue-500 text-white rounded font-medium hover:bg-blue-600 transition-colors shadow-sm">Next</button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
        <table className="w-full table-fixed border-collapse">
          <thead>
            <tr className="bg-gray-100">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <th key={day} className="border-b border-gray-200 p-2 w-[14.28%] text-sm font-semibold text-gray-600 text-center">{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week, wi) => (
              <tr key={wi}>
                {week.map((day, di) => {
                  const dateStr = formatDate(day);
                  const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                  const eventsForDay = filteredEvents.filter(e => e.eventDate === dateStr);
                  const notesForDay = calendarNotes.filter(n => n.date === dateStr);
                  const isToday = dateStr === todayStr;
                  const isPast = dateStr < todayStr; // Check if day is before today
                  const cellItemsLimit = 2; // Max items to show directly

                  // Determine cell background and text color (with past day shading)
                  let cellBgClass = 'bg-white';
                  let cellTextClass = '';
                  let cellOpacityClass = '';

                  if (isToday) {
                      cellBgClass = 'bg-blue-50'; // Today
                  } else if (viewMode === 'monthly' && !isCurrentMonth) {
                      cellBgClass = 'bg-gray-100'; // Day not in current month
                      cellTextClass = 'text-gray-400';
                      cellOpacityClass = 'opacity-60'; // Dim content
                  } else if (isPast) {
                      cellBgClass = 'bg-gray-50'; // Past day in current month (or weekly view)
                      cellTextClass = 'text-gray-500'; // Dimmer text for past days
                  }
                  // Else (future day in current month/week) remains bg-white

                  return (
                    <td
                      key={di}
                      className={`border border-gray-200 p-1 sm:p-2 w-[14.28%] h-24 min-h-24 align-top relative transition-colors ${cellBgClass} ${cellTextClass}`}
                    >
                      {/* Cell Header: Date Number and Info Button */}
                      <div className="flex justify-between items-center mb-1">
                        <div className={`font-semibold text-xs sm:text-sm ${isToday ? 'text-blue-700' : ''}`}>
                          {day.getDate()}
                        </div>
                        {/* Universal Info Button */}
                        <button
                          onClick={(e) => { e.stopPropagation(); openInfoModalForDate(day, eventsForDay, notesForDay); }}
                          className={`p-0.5 rounded-full focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-blue-400 transition-colors ${
                              isToday ? 'text-blue-700 hover:bg-blue-100'
                              : (viewMode === 'monthly' && !isCurrentMonth) ? 'text-gray-400 hover:bg-gray-200'
                              : isPast ? 'text-gray-500 hover:bg-gray-200'
                              : 'text-blue-600 hover:bg-blue-100'
                          }`}
                          title="View details / Add note"
                          aria-label={`Details for ${day.toLocaleDateString()}`}
                        >
                          {/* SVG Info Icon */}
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                             <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      </div>

                      {/* Cell Content: Notes and Events */}
                      <div className={`mt-1 space-y-0.5 overflow-hidden text-ellipsis ${cellOpacityClass}`}>
                        {/* Display notes first */}
                        {notesForDay.slice(0, cellItemsLimit).map((note) => (
                          <div
                            key={`note-${note.id}`}
                            style={{ backgroundColor: note.color || '#4299e1' }}
                            className="text-white text-[10px] sm:text-xs font-semibold px-1 py-0.5 rounded overflow-hidden whitespace-nowrap truncate block w-full text-left cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => openNoteModalForEdit(note)}
                            title={note.title}
                          >
                            📌 {note.title}
                          </div>
                        ))}

                        {/* Then display events */}
                        {eventsForDay.slice(0, cellItemsLimit - notesForDay.length).map((event) => {
                           let timeStr = event.allDay ? "All Day" : formatTime12Hour(event.startTime) || '';
                          return (
                            <button
                              key={`event-${event.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onEventClick) onEventClick(event);
                              }}
                              className="bg-blue-500 text-white text-[10px] sm:text-xs font-semibold px-1 py-0.5 rounded overflow-hidden whitespace-nowrap truncate block w-full text-left focus:outline-none focus:ring-1 focus:ring-blue-300 hover:opacity-80 transition-opacity"
                              title={`${event.eventName || 'Unnamed'} ${timeStr ? `[${timeStr}]` : ''}`}
                            >
                              {event.eventName || 'Unnamed'}
                            </button>
                          );
                        })}
                      </div>

                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Info Modal Overlay */}
{infoModalOpen && createPortal(
  <div
    className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-40 p-4"
    onClick={() => setInfoModalOpen(false)}
  >
    <div
      className="modal-content bg-white rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-md relative max-h-[90vh] flex flex-col transform scale-[0.9] laptop:scale-100 laptop:translate-x-24 origin-top"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl leading-none p-1 focus:outline-none focus:ring-1 focus:ring-blue-400 rounded-full"
        onClick={() => setInfoModalOpen(false)}
        title="Close"
        aria-label="Close modal"
      >
        &times;
      </button>
      <h4 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">
        {infoModalContent.date ? infoModalContent.date.toDateString() : 'Details'}
      </h4>

      {/* Scrollable Area */}
      <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-4">
        {/* Notes section */}
        <div>
          <h5 className="text-base font-semibold mb-2 text-gray-700">Notes</h5>
          {infoModalContent.notes.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No notes for this day.</p>
          ) : (
            <ul className="space-y-2">
              {infoModalContent.notes.map((note) => (
                <li
                  key={`modal-note-${note.id}`}
                  className="flex justify-between items-start p-2 rounded border border-gray-200"
                  style={{ backgroundColor: note.color + '1A' }}
                >
                  <div className="flex-1 mr-2">
                    <div className="font-semibold text-sm text-gray-800">{note.title}</div>
                    {note.content && (
                      <p className="text-xs text-gray-600 mt-0.5 whitespace-pre-wrap">
                        {note.content}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    <button
                      onClick={() => { setInfoModalOpen(false); openNoteModalForEdit(note); }}
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium p-1 rounded hover:bg-blue-100"
                      title="Edit note"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteCalendarNote(note.id)}
                      className="text-red-500 hover:text-red-700 text-xs font-medium p-1 rounded hover:bg-red-100"
                      title="Delete note"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Events section */}
        <div>
          <h5 className="text-base font-semibold mb-2 text-gray-700">Events</h5>
          {infoModalContent.events.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No events scheduled for this day.</p>
          ) : (
            <ul className="space-y-2">
              {infoModalContent.events.map((event) => {
                const timeStr = event.allDay
                  ? "All Day"
                  : (formatTime12Hour(event.startTime) +
                    (event.endTime ? ` - ${formatTime12Hour(event.endTime)}` : '')) || 'Not specified';
                return (
                  <li
                    key={`modal-event-${event.id}`}
                    className="text-sm border rounded p-2 shadow-sm bg-gray-50"
                  >
                    <div className="font-semibold text-gray-800">
                      {event.eventName || 'Unnamed Event'}
                    </div>
                    {event.clientName && (
                      <div className="text-xs text-gray-600 mt-0.5">
                        Client: {event.clientName}
                      </div>
                    )}
                    <div className="text-xs text-gray-600 mt-0.5">Time: {timeStr}</div>
                    {event.buildingArea && (
                      <div className="text-xs text-gray-600 mt-0.5">
                        Area: {event.buildingArea}
                      </div>
                    )}
                    {onEventClick && (
                      <button
                        onClick={() => { setInfoModalOpen(false); onEventClick(event); }}
                        className="text-xs text-blue-600 hover:underline mt-1 font-medium"
                      >
                        View Full Details
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>{/* End Scrollable Area */}

      {/* Add note button */}
      <div className="mt-4 flex justify-end border-t pt-3">
        <button
          onClick={() => { setInfoModalOpen(false); openNoteModalForAdd(infoModalContent.date); }}
          className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 py-1.5 rounded shadow-sm font-medium transition-colors"
        >
          Add Note for this Date
        </button>
      </div>
    </div>
  </div>,
  document.body    // ← required second argument
)}

{/* Note Creation/Edit Modal */}
{noteModalOpen && createPortal(
  <div
    className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
    onClick={closeNoteModal}
  >
    <div
      className="bg-white rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-md relative max-h-[90vh] flex flex-col transform scale-[0.9] laptop:scale-100 laptop:translate-x-24 origin-top"
      onClick={(e) => e.stopPropagation()}
    >
      <h4 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">
        {newNote.id ? 'Edit Note' : 'Add Calendar Note'}
      </h4>

      {/* Scrollable Form Area */}
      <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-4">
        {/* --- form fields stay exactly the same --- */}
        <div>
          <label htmlFor="noteTitle" className="block text-sm font-medium text-gray-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="noteTitle"
            type="text"
            value={newNote.title}
            onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
            className="w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter note title"
            required
          />
        </div>

        <div>
          <label htmlFor="noteDate" className="block text-sm font-medium text-gray-700 mb-1">
            Date <span className="text-red-500">*</span>
          </label>
          <input
            id="noteDate"
            type="date"
            value={newNote.date}
            onChange={(e) => setNewNote({ ...newNote, date: e.target.value })}
            className="w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Note Color</label>
          <div className="flex space-x-2 flex-wrap gap-1">
            {['#4299e1', '#48bb78', '#ed8936', '#f56565', '#9f7aea', '#667eea', '#ecc94b', '#38b2ac'].map(color => (
              <button
                key={color}
                type="button"
                style={{ backgroundColor: color }}
                className={`w-7 h-7 rounded-full cursor-pointer border-2 transition-all ${
                  newNote.color === color
                    ? 'border-gray-700 ring-2 ring-offset-1 ring-gray-500 scale-110'
                    : 'border-transparent hover:scale-105'
                }`}
                onClick={() => setNewNote({ ...newNote, color })}
                aria-label={`Select color ${color}`}
              />
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="noteContent" className="block text-sm font-medium text-gray-700 mb-1">
            Content (optional)
          </label>
          <textarea
            id="noteContent"
            value={newNote.content}
            onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
            className="w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Add details (optional)"
            rows="4"
          />
        </div>
      </div>{/* End Scrollable Form Area */}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 mt-6 border-t pt-4">
        <button
          type="button"
          onClick={closeNoteModal}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={saveCalendarNote}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          {newNote.id ? 'Update Note' : 'Save Note'}
        </button>
      </div>
    </div>
  </div>,
  document.body
)}
      </div>
    </div>
  );
}

export default CalendarTab;