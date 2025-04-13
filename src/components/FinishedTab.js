// components/FinishedTab.js
import React, { useMemo, useState } from 'react';
import EventPreviewCard from './EventPreviewCard';
import { Calendar, Filter, ChevronDown, ChevronUp, Search, X } from 'lucide-react';

function FinishedTab({ events, onSelectEvent }) {
  // Filter finished events
  const finishedEvents = events.filter(e => e.status === 'finished');

  // Filter states
  const [filterMode, setFilterMode] = useState('month');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Collapsible year groups
  const [expandedYears, setExpandedYears] = useState({});

  // Available filter options
  const availableYears = useMemo(() => {
    const yearSet = new Set();
    finishedEvents.forEach(e => {
      const d = new Date(e.eventDate);
      if (!isNaN(d)) yearSet.add(d.getFullYear());
    });
    return Array.from(yearSet).sort((a, b) => b - a); // Sort newest first
  }, [finishedEvents]);

  const availableMonths = Array.from({ length: 12 }, (_, i) =>
    ('0' + (i + 1)).slice(-2)
  );

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Group events by year and month
  const groupedEvents = useMemo(() => {
    let filtered = finishedEvents;
    
    // Apply search filter if present
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(event => {
        const eventNameStr = (event.eventName || "").toLowerCase();
        const clientNameStr = (event.clientName || "").toLowerCase();
        const descriptionStr = (event.description && typeof event.description === "string"
          ? event.description.toLowerCase()
          : "");
        return (
          eventNameStr.includes(query) ||
          clientNameStr.includes(query) ||
          descriptionStr.includes(query)
        );
      });
    }
    
    
    // Apply date filters
    if (filterMode === 'month' && (selectedYear || selectedMonth)) {
      filtered = filtered.filter(e => {
        const date = new Date(e.eventDate);
        const year = date.getFullYear().toString();
        const month = ('0' + (date.getMonth() + 1)).slice(-2);
        
        if (selectedYear && selectedMonth) {
          return year === selectedYear && month === selectedMonth;
        } else if (selectedYear) {
          return year === selectedYear;
        } else if (selectedMonth) {
          return month === selectedMonth;
        }
        return true;
      });
    } else if (filterMode === 'range' && startDate && endDate) {
      filtered = filtered.filter(e => {
        const date = new Date(e.eventDate);
        return date >= new Date(startDate) && date <= new Date(endDate);
      });
    }
    
    // Group by year and month
    const groups = {};
    filtered.forEach(event => {
      const date = new Date(event.eventDate);
      const year = date.getFullYear();
      const month = date.getMonth();
      
      if (!groups[year]) {
        groups[year] = {};
      }
      
      if (!groups[year][month]) {
        groups[year][month] = [];
      }
      
      groups[year][month].push(event);
    });
    
    // Sort each month's events by date (newest first)
    Object.keys(groups).forEach(year => {
      Object.keys(groups[year]).forEach(month => {
        groups[year][month].sort((a, b) => new Date(b.eventDate) - new Date(a.eventDate));
      });
    });
    
    return { groups, count: filtered.length };
  }, [finishedEvents, filterMode, selectedYear, selectedMonth, startDate, endDate, searchQuery]);

  // Initialize expanded state for the most recent year
  React.useEffect(() => {
    if (availableYears.length > 0 && Object.keys(expandedYears).length === 0) {
      setExpandedYears({ [availableYears[0]]: true });
    }
  }, [availableYears, expandedYears]);

  // Toggle year expansion
  const toggleYearExpand = (year) => {
    setExpandedYears(prev => ({
      ...prev,
      [year]: !prev[year]
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedYear('');
    setSelectedMonth('');
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
    setFilterMode('month');
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Calendar className="h-6 w-6 text-indigo-600 mr-2" />
          <h2 className="text-2xl font-bold text-gray-800">Finished Events</h2>
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
        >
          <Filter className="h-4 w-4" />
          <span className="font-medium">{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
        </button>
      </div>

      {/* Search bar - always visible */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search in finished events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Expandable filters */}
      {showFilters && (
        <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-700">Filter Options</h3>
            {(selectedYear || selectedMonth || startDate || endDate || searchQuery) && (
              <button 
                onClick={clearFilters}
                className="text-sm text-indigo-600 hover:text-indigo-800"
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
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                Month View
              </button>
              <button 
                onClick={() => setFilterMode('range')}
                className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                  filterMode === 'range' 
                    ? 'bg-indigo-600 text-white' 
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
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
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
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
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
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                <input 
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results Summary */}
      <div className="mb-6">
        <div className="bg-indigo-50 px-4 py-3 rounded-lg">
          <span className="text-indigo-700 font-medium">
            {groupedEvents.count} {groupedEvents.count === 1 ? 'event' : 'events'} found
          </span>
          {(selectedYear || selectedMonth || startDate || endDate || searchQuery) && (
            <span className="text-indigo-500 ml-2 text-sm">
              (filtered results)
            </span>
          )}
        </div>
      </div>

      {/* Event list - Grouped by year and month with collapsible sections */}
      {groupedEvents.count === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">No finished events found</p>
          {(selectedYear || selectedMonth || startDate || endDate || searchQuery) && (
            <p className="text-sm text-gray-400">Try adjusting your filter settings</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {Object.keys(groupedEvents.groups).sort((a, b) => b - a).map(year => (
            <div key={year} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleYearExpand(year)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
              >
                <h3 className="font-medium text-lg text-gray-800">{year}</h3>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">
                    {Object.values(groupedEvents.groups[year]).flat().length} events
                  </span>
                  {expandedYears[year] ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </button>
              
              {expandedYears[year] && (
                <div className="p-4">
                  {Object.keys(groupedEvents.groups[year])
                    .sort((a, b) => b - a) // Sort months newest first
                    .map(month => (
                      <div key={`${year}-${month}`} className="mb-6 last:mb-0">
                        <h4 className="font-medium text-gray-700 mb-3 pb-2 border-b">
                          {monthNames[month]} {year}
                        </h4>
                        <div className="space-y-4">
                          {groupedEvents.groups[year][month].map(event => (
                            <EventPreviewCard
                              key={event.id}
                              event={event}
                              onClick={() => onSelectEvent(event)}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FinishedTab;