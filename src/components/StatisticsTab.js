import React, { useMemo, useState } from 'react';

function StatisticsTab({ events }) {
  // Filter for finished events with valid dates
  const finishedEvents = events.filter(e => e.status === 'finished' && e.eventDate);

  // Filter mode: "month" or "range"
  const [filterMode, setFilterMode] = useState('month');

  // For "month" mode: selected year and month (strings)
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');

  // For "date range" mode: start and end dates
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Compute filtered finished events based on filter mode
  const filteredFinishedEvents = useMemo(() => {
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
        // If either start or end date is missing, include the event
        if (!startDate || !endDate) return true;
        return date >= new Date(startDate) && date <= new Date(endDate);
      });
    }
  }, [finishedEvents, filterMode, selectedYear, selectedMonth, startDate, endDate]);

  // Available years from finished events (for "month" mode dropdown)
  const availableYears = useMemo(() => {
    const yearSet = new Set();
    finishedEvents.forEach(e => {
      const d = new Date(e.eventDate);
      if (!isNaN(d)) yearSet.add(d.getFullYear());
    });
    return Array.from(yearSet).sort();
  }, [finishedEvents]);

  // Months (as two-digit strings, 01 to 12)
  const availableMonths = Array.from({ length: 12 }, (_, i) =>
    ('0' + (i + 1)).slice(-2)
  );

  // Compute overall totals for filtered finished events
  const overallCount = filteredFinishedEvents.length;
  const overallRevenue = filteredFinishedEvents.reduce((sum, event) => {
    return sum + (parseFloat(event.grandTotal) || 0);
  }, 0);

  // Compute grouped statistics by month-year for filtered finished events
  const stats = useMemo(() => {
    const grouped = filteredFinishedEvents.reduce((acc, event) => {
      const date = new Date(event.eventDate);
      if (isNaN(date)) return acc;
      // Create a key in the form "YYYY-MM"
      const key = `${date.getFullYear()}-${('0' + (date.getMonth() + 1)).slice(-2)}`;
      if (!acc[key]) {
        acc[key] = { count: 0, totalRevenue: 0, roomUsage: {} };
      }
      acc[key].count += 1;
      const revenue = parseFloat(event.grandTotal) || 0;
      acc[key].totalRevenue += revenue;
      // Count room usage
      const room = event.buildingArea || 'Unknown';
      if (!acc[key].roomUsage[room]) {
        acc[key].roomUsage[room] = 0;
      }
      acc[key].roomUsage[room] += 1;
      return acc;
    }, {});
    const result = Object.keys(grouped).map(key => ({
      monthYear: key,
      count: grouped[key].count,
      totalRevenue: grouped[key].totalRevenue,
      roomUsage: grouped[key].roomUsage,
    }));
    result.sort((a, b) => a.monthYear.localeCompare(b.monthYear));
    return result;
  }, [filteredFinishedEvents]);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Statistics</h2>

      {/* Filter Mode Toggle */}
      <div className="mb-4 flex space-x-4">
        <button 
          onClick={() => setFilterMode('month')}
          className={`px-4 py-2 rounded ${filterMode === 'month' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Select Month
        </button>
        <button 
          onClick={() => setFilterMode('range')}
          className={`px-4 py-2 rounded ${filterMode === 'range' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
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

      {/* Overall Totals */}
      <div className="mb-4">
        <p><strong>Total Finished Events:</strong> {overallCount}</p>
        <p><strong>Total Revenue:</strong> ${overallRevenue.toFixed(2)}</p>
      </div>

      {/* Monthly Breakdown */}
      <h3 className="text-xl font-semibold mb-2">Monthly Breakdown</h3>
      {stats.length === 0 ? (
        <p className="text-gray-500">No finished events to display statistics for the selected period.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2 text-center">Month-Year</th>
                <th className="border p-2 text-center">Event Count</th>
                <th className="border p-2 text-center">Total Revenue</th>
                <th className="border p-2 text-left">Room Totals</th>
              </tr>
            </thead>
            <tbody>
              {stats.map(stat => (
                <tr key={stat.monthYear} className="hover:bg-gray-50 transition-colors">
                  <td className="border p-2 text-center">{stat.monthYear}</td>
                  <td className="border p-2 text-center">{stat.count}</td>
                  <td className="border p-2 text-center">${stat.totalRevenue.toFixed(2)}</td>
                  <td className="border p-2">
                    {Object.entries(stat.roomUsage).map(([room, count]) => (
                      <div key={room} className="flex justify-between">
                        <span className="font-semibold">{room}:</span>
                        <span>{count}</span>
                      </div>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default StatisticsTab;
