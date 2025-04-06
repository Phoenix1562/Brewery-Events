// components/FinishedTab.js
import React, { useMemo, useState } from 'react';
import EventPreviewCard from './EventPreviewCard';

function FinishedTab({ events, onSelectEvent }) {
  // Filter finished events
  const finishedEvents = events.filter(e => e.status === 'finished');

  // Filter mode: "month" or "range"
  const [filterMode, setFilterMode] = useState('month');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const displayedEvents = useMemo(() => {
    if (filterMode === 'month') {
      if (selectedYear && selectedMonth) {
        return finishedEvents.filter(e => {
          const date = new Date(e.eventDate);
          return (
            date.getFullYear().toString() === selectedYear &&
            ('0' + (date.getMonth() + 1)).slice(-2) === selectedMonth
          );
        });
      }
      return finishedEvents;
    } else {
      return finishedEvents.filter(e => {
        const date = new Date(e.eventDate);
        return date >= new Date(startDate) && date <= new Date(endDate);
      });
    }
  }, [finishedEvents, filterMode, selectedYear, selectedMonth, startDate, endDate]);

  const availableYears = useMemo(() => {
    const yearSet = new Set();
    finishedEvents.forEach(e => {
      const d = new Date(e.eventDate);
      if (!isNaN(d)) yearSet.add(d.getFullYear());
    });
    return Array.from(yearSet).sort();
  }, [finishedEvents]);

  const availableMonths = Array.from({ length: 12 }, (_, i) =>
    ('0' + (i + 1)).slice(-2)
  );

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Finished Events</h2>

      {/* Filter Mode Toggle */}
      <div className="mb-4 flex space-x-4">
        <button 
          onClick={() => setFilterMode('month')}
          className={`px-4 py-2 rounded ${filterMode === 'month' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Select Month
        </button>
        <button 
          onClick={() => setFilterMode('range')}
          className={`px-4 py-2 rounded ${filterMode === 'range' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Date Range
        </button>
      </div>

      {/* Filter Inputs */}
      {filterMode === 'month' ? (
        <div className="mb-4 flex space-x-4 items-center">
          <div>
            <label className="font-semibold mr-2">Year:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="border p-1"
            >
              <option value="">All Years</option>
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="font-semibold mr-2">Month:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border p-1"
            >
              <option value="">All Months</option>
              {availableMonths.map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>
        </div>
      ) : (
        <div className="mb-4 flex space-x-4 items-center">
          <div>
            <label className="font-semibold mr-2">From:</label>
            <input 
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border p-1"
            />
          </div>
          <div>
            <label className="font-semibold mr-2">To:</label>
            <input 
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border p-1"
            />
          </div>
        </div>
      )}

      <div className="mb-4">
        <p><strong>Total Finished Events:</strong> {displayedEvents.length}</p>
      </div>

      {/* Render a summary card for each event */}
      {displayedEvents.length === 0 ? (
        <p>No finished events found for the selected period.</p>
      ) : (
        <div className="space-y-4">
          {displayedEvents.map(event => (
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

export default FinishedTab;
