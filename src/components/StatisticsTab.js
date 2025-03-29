import React, { useMemo, useState } from 'react';

function StatisticsTab({ events }) {
  // Filter for finished events with valid dates
  const finishedEvents = events.filter(e => e.status === 'finished' && e.eventDate);

  // Filter mode: "month" or "range"
  const [filterMode, setFilterMode] = useState('month');

  // For "month" mode: selected year and month (as strings)
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');

  // For "date range" mode: start and end dates
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Sub-tabs: "overview" or "comparison"
  const [statsTab, setStatsTab] = useState('overview');

  // For revenue comparison: select start and end month (in "YYYY-MM" format)
  const [comparisonStart, setComparisonStart] = useState('');
  const [comparisonEnd, setComparisonEnd] = useState('');

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
      // Range mode
      return finishedEvents.filter(e => {
        const date = new Date(e.eventDate);
        if (!startDate || !endDate) return true;
        return date >= new Date(startDate) && date <= new Date(endDate);
      });
    }
  }, [finishedEvents, filterMode, selectedYear, selectedMonth, startDate, endDate]);

  // Available years from finished events (for dropdown)
  const availableYears = useMemo(() => {
    const yearSet = new Set();
    finishedEvents.forEach(e => {
      const d = new Date(e.eventDate);
      if (!isNaN(d)) yearSet.add(d.getFullYear());
    });
    return Array.from(yearSet).sort();
  }, [finishedEvents]);

  // Months as two-digit strings (01 to 12)
  const availableMonths = Array.from({ length: 12 }, (_, i) =>
    ('0' + (i + 1)).slice(-2)
  );

  // Overall Totals
  const overallCount = filteredFinishedEvents.length;
  const overallRevenue = filteredFinishedEvents.reduce((sum, event) => {
    return sum + (parseFloat(event.grandTotal) || 0);
  }, 0);

  // Group statistics by month-year for filtered finished events
  const stats = useMemo(() => {
    const grouped = filteredFinishedEvents.reduce((acc, event) => {
      const date = new Date(event.eventDate);
      if (isNaN(date)) return acc;
      const key = `${date.getFullYear()}-${('0' + (date.getMonth() + 1)).slice(-2)}`;
      if (!acc[key]) {
        acc[key] = { count: 0, totalRevenue: 0, roomUsage: {} };
      }
      acc[key].count += 1;
      const revenue = parseFloat(event.grandTotal) || 0;
      acc[key].totalRevenue += revenue;
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

  // Helper: Convert "YYYY-MM" to "Month Year" (e.g., "2023-03" => "March 2023")
  const getFormattedMonthYear = (key) => {
    const [year, month] = key.split('-');
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return `${monthNames[parseInt(month, 10) - 1]} ${year}`;
  };

  // For Revenue Comparison: Filter stats within the selected range (inclusive)
  const comparisonStats = useMemo(() => {
    if (!comparisonStart || !comparisonEnd) return [];
    return stats.filter(s => s.monthYear >= comparisonStart && s.monthYear <= comparisonEnd);
  }, [stats, comparisonStart, comparisonEnd]);

  // Compute maximum revenue among comparisonStats for scaling the bars
  const maxComparisonRevenue = useMemo(() => {
    return comparisonStats.reduce((max, stat) => Math.max(max, stat.totalRevenue), 0);
  }, [comparisonStats]);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Statistics</h2>

      {/* Sub-tabs for Overview vs Revenue Comparison */}
      <div className="mb-4 flex space-x-4">
        <button
          onClick={() => setStatsTab('overview')}
          className={`px-4 py-2 rounded ${statsTab === 'overview' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}
        >
          Overview
        </button>
        <button
          onClick={() => setStatsTab('comparison')}
          className={`px-4 py-2 rounded ${statsTab === 'comparison' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}
        >
          Revenue Comparison
        </button>
      </div>

      {/* Hide the filter UI if we're in the "comparison" tab */}
      {statsTab === 'overview' && (
        <div className="mb-4">
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
        </div>
      )}

      {/* Now show sub-tab content */}
      {statsTab === 'overview' ? (
        // Overview: Detailed Table
        <div>
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
                      <td className="border p-2 text-center">{getFormattedMonthYear(stat.monthYear)}</td>
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
      ) : (
        // Revenue Comparison: Select a start & end month, show bars for each month in range
        <RevenueComparison 
          stats={stats}
          getFormattedMonthYear={getFormattedMonthYear}
          comparisonStart={comparisonStart}
          setComparisonStart={setComparisonStart}
          comparisonEnd={comparisonEnd}
          setComparisonEnd={setComparisonEnd}
        />
      )}
    </div>
  );
}

// A separate component for clarity: Revenue Comparison sub-tab
function RevenueComparison({
  stats,
  getFormattedMonthYear,
  comparisonStart,
  setComparisonStart,
  comparisonEnd,
  setComparisonEnd,
}) {
  // Filter stats within the selected range (inclusive)
  const comparisonStats = useMemo(() => {
    if (!comparisonStart || !comparisonEnd) return [];
    return stats.filter(s => s.monthYear >= comparisonStart && s.monthYear <= comparisonEnd);
  }, [stats, comparisonStart, comparisonEnd]);

  // Compute maximum revenue among comparisonStats for scaling the bars
  const maxComparisonRevenue = useMemo(() => {
    return comparisonStats.reduce((max, stat) => Math.max(max, stat.totalRevenue), 0);
  }, [comparisonStats]);

  return (
    <div>
      <h3 className="text-xl font-semibold mb-2">Revenue Comparison</h3>
      {/* Start/End Month Selectors */}
      <div className="flex space-x-4 mb-4">
        <div>
          <label className="font-semibold mr-2">Start Month:</label>
          <select
            value={comparisonStart}
            onChange={(e) => setComparisonStart(e.target.value)}
            className="border p-1"
          >
            <option value="">Select Start Month</option>
            {stats.map(stat => (
              <option key={stat.monthYear} value={stat.monthYear}>
                {getFormattedMonthYear(stat.monthYear)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="font-semibold mr-2">End Month:</label>
          <select
            value={comparisonEnd}
            onChange={(e) => setComparisonEnd(e.target.value)}
            className="border p-1"
          >
            <option value="">Select End Month</option>
            {stats.map(stat => (
              <option key={stat.monthYear} value={stat.monthYear}>
                {getFormattedMonthYear(stat.monthYear)}
              </option>
            ))}
          </select>
        </div>
      </div>
      {/* Show bars for each month in the selected range */}
      {comparisonStart && comparisonEnd ? (
        comparisonStats.length === 0 ? (
          <p className="text-gray-500">No revenue data available for the selected range.</p>
        ) : (
          <div className="space-y-2">
            {comparisonStats.map(stat => {
              const widthPercent = maxComparisonRevenue > 0 ? (stat.totalRevenue / maxComparisonRevenue) * 100 : 0;
              return (
                <div key={stat.monthYear} className="flex items-center">
                  <span className="w-32 text-sm font-semibold">{getFormattedMonthYear(stat.monthYear)}</span>
                  <div className="flex-1 bg-gray-200 h-4 rounded">
                    <div 
                      className="bg-blue-500 h-4 rounded" 
                      style={{ width: `${widthPercent}%` }}
                    ></div>
                  </div>
                  <span className="ml-2 text-sm">${stat.totalRevenue.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <p className="text-gray-500">Please select both a start and end month for comparison.</p>
      )}
    </div>
  );
}

export default StatisticsTab;
