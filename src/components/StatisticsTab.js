import React, { useMemo, useState } from 'react';
import { Calendar, Filter, ChevronDown, ChevronUp, BarChart2, LineChart } from 'lucide-react';

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
  
  // Show/hide filters
  const [showFilters, setShowFilters] = useState(false);

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
    return Array.from(yearSet).sort((a, b) => b - a); // Sort newest first
  }, [finishedEvents]);

  // Months as two-digit strings (01 to 12)
  const availableMonths = Array.from({ length: 12 }, (_, i) =>
    ('0' + (i + 1)).slice(-2)
  );

  // Month names
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

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

  // Clear all filters
  const clearFilters = () => {
    setSelectedYear('');
    setSelectedMonth('');
    setStartDate('');
    setEndDate('');
    setFilterMode('month');
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <BarChart2 className="h-6 w-6 text-emerald-600 mr-2" />
          <h2 className="text-2xl font-bold text-gray-800">Statistics</h2>
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors"
        >
          <Filter className="h-4 w-4" />
          <span className="font-medium">{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
        </button>
      </div>

      {/* Sub-tabs for Overview vs. Revenue Comparison */}
      <div className="mb-4 flex space-x-4">
        <button
          onClick={() => setStatsTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
            statsTab === 'overview'
              ? 'bg-emerald-500 text-white'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
        >
          <BarChart2 className="h-4 w-4" />
          <span>Overview</span>
        </button>
        <button
          onClick={() => setStatsTab('comparison')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
            statsTab === 'comparison'
              ? 'bg-emerald-500 text-white'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
        >
          <LineChart className="h-4 w-4" />
          <span>Revenue Comparison</span>
        </button>
      </div>

      {/* Expandable filters */}
      {showFilters && (
        <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-700">Filter Options</h3>
            {(selectedYear || selectedMonth || startDate || endDate) && (
              <button 
                onClick={clearFilters}
                className="text-sm text-emerald-600 hover:text-emerald-800"
              >
                Clear all filters
              </button>
            )}
          </div>

          {/* Filter Mode Toggle */}
          <div className="mb-4">
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <button 
                onClick={() => setFilterMode('month')}
                className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                  filterMode === 'month' 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                Month View
              </button>
              <button 
                onClick={() => setFilterMode('range')}
                className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                  filterMode === 'range' 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                Date Range
              </button>
            </div>
          </div>

          {/* Filter Inputs */}
          {filterMode === 'month' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
                >
                  <option value="">All Years</option>
                  {availableYears.map(year => (
                    <option key={year} value={year.toString()}>{year}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
                >
                  <option value="">All Months</option>
                  {availableMonths.map((month, index) => (
                    <option key={month} value={month}>{monthNames[index]}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                <input 
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                <input 
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results Summary */}
      <div className="mb-6">
        <div className="bg-emerald-50 p-4 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border border-emerald-100 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Finished Events</p>
            <p className="text-2xl font-bold text-emerald-700">{overallCount}</p>
            {(selectedYear || selectedMonth || startDate || endDate) && (
              <p className="text-xs text-emerald-500 mt-1">
                (filtered results)
              </p>
            )}
          </div>
          <div className="bg-white rounded-lg p-4 border border-emerald-100 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
            <p className="text-2xl font-bold text-emerald-700">${overallRevenue.toFixed(2)}</p>
            {(selectedYear || selectedMonth || startDate || endDate) && (
              <p className="text-xs text-emerald-500 mt-1">
                (filtered results)
              </p>
            )}
          </div>
        </div>
      </div>

      {statsTab === 'overview' && (
        <div className="mb-6">
          {/* Overview: Detailed Table */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-4 py-3 bg-emerald-50 rounded-t-lg border border-emerald-100">
              <h3 className="text-lg font-semibold text-gray-800">Monthly Breakdown</h3>
            </div>
            
            {stats.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-b-lg border border-t-0 border-emerald-100">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">No finished events to display statistics for the selected period.</p>
                {(selectedYear || selectedMonth || startDate || endDate) && (
                  <p className="text-sm text-gray-400">Try adjusting your filter settings</p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-b-lg border border-t-0 border-emerald-100">
                <table className="min-w-full text-sm bg-white">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Month-Year</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Event Count</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Total Revenue</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Room Utilization</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.map((stat, index) => (
                      <tr
                        key={stat.monthYear}
                        className={`hover:bg-emerald-50 transition-colors ${
                          index !== stats.length - 1 ? 'border-b border-gray-200' : ''
                        }`}
                      >
                        <td className="px-4 py-3 text-gray-800 font-medium">
                          {getFormattedMonthYear(stat.monthYear)}
                        </td>
                        <td className="px-4 py-3 text-gray-800">{stat.count}</td>
                        <td className="px-4 py-3 text-gray-800 font-medium text-emerald-600">
                          ${stat.totalRevenue.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            {Object.entries(stat.roomUsage).map(([room, count]) => (
                              <div key={room} className="flex justify-between">
                                <span className="text-gray-600">{room}:</span>
                                <span className="font-medium">{count}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {statsTab === 'comparison' && (
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

function RevenueComparison({
  stats,
  getFormattedMonthYear,
  comparisonStart,
  setComparisonStart,
  comparisonEnd,
  setComparisonEnd,
}) {
  const comparisonStats = useMemo(() => {
    if (!comparisonStart || !comparisonEnd) return [];
    return stats.filter(
      s => s.monthYear >= comparisonStart && s.monthYear <= comparisonEnd
    ).sort((a, b) => a.monthYear.localeCompare(b.monthYear));
  }, [stats, comparisonStart, comparisonEnd]);

  const maxComparisonRevenue = useMemo(() => {
    return comparisonStats.reduce(
      (max, stat) => Math.max(max, stat.totalRevenue),
      0
    );
  }, [comparisonStats]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-emerald-100">
      <div className="px-4 py-3 bg-emerald-50 rounded-t-lg border-b border-emerald-100">
        <h3 className="text-lg font-semibold text-gray-800">Revenue Comparison</h3>
      </div>
      
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Month</label>
            <select
              value={comparisonStart}
              onChange={(e) => setComparisonStart(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">End Month</label>
            <select
              value={comparisonEnd}
              onChange={(e) => setComparisonEnd(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
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
        
        {comparisonStart && comparisonEnd ? (
          comparisonStats.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <LineChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No revenue data available for the selected range.</p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {comparisonStats.map(stat => {
                const widthPercent =
                  maxComparisonRevenue > 0
                    ? (stat.totalRevenue / maxComparisonRevenue) * 100
                    : 0;
                return (
                  <div key={stat.monthYear} className="group relative">
                    <div className="flex items-center">
                      <span className="w-36 text-sm font-medium text-gray-700">
                        {getFormattedMonthYear(stat.monthYear)}
                      </span>
                      <div className="flex-1">
                        <div className="relative h-8 bg-gray-100 rounded-md">
                          <div
                            className="absolute top-0 left-0 h-8 bg-emerald-500 rounded-md transition-all duration-500 ease-out group-hover:bg-emerald-600"
                            style={{ width: `${widthPercent}%` }}
                          >
                            <span className="absolute top-0 right-0 bottom-0 px-2 flex items-center text-xs font-medium text-white">
                              ${stat.totalRevenue.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-1 flex justify-between text-xs">
                      <span className="text-gray-500">{stat.count} events</span>
                      <span className="text-emerald-500 font-medium">
                        Avg: ${(stat.totalRevenue / stat.count).toFixed(2)} per event
                      </span>
                    </div>
                  </div>
                );
              })}
              
              {/* Summary card */}
              <div className="mt-8 bg-emerald-50 rounded-lg p-4 border border-emerald-100">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Period Summary</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white p-3 rounded-md shadow-sm border border-emerald-100">
                    <p className="text-xs text-gray-500 mb-1">Total Events</p>
                    <p className="text-lg font-bold text-gray-800">
                      {comparisonStats.reduce((sum, stat) => sum + stat.count, 0)}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-md shadow-sm border border-emerald-100">
                    <p className="text-xs text-gray-500 mb-1">Total Revenue</p>
                    <p className="text-lg font-bold text-emerald-600">
                      ${comparisonStats.reduce((sum, stat) => sum + stat.totalRevenue, 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-md shadow-sm border border-emerald-100">
                    <p className="text-xs text-gray-500 mb-1">Average per Month</p>
                    <p className="text-lg font-bold text-emerald-600">
                      ${(comparisonStats.reduce((sum, stat) => sum + stat.totalRevenue, 0) / comparisonStats.length).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Please select both a start and end month for comparison.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default StatisticsTab;