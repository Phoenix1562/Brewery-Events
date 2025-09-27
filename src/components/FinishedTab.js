// components/FinishedTab.js
import React, { useMemo, useState } from 'react';
import EventPreviewCard from './EventPreviewCard';
import TabHeader from './TabHeader';
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
  const [expandedYears, setExpandedYears] = useState({});
  const [expandedMonths, setExpandedMonths] = useState({});

  // Available filter options
  const availableYears = useMemo(() => {
    const yearSet = new Set();
    finishedEvents.forEach(e => {
      const d = new Date(e.eventDate);
      if (!isNaN(d)) yearSet.add(d.getFullYear());
    });
    return Array.from(yearSet).sort((a, b) => b - a); // Sort newest first
  }, [finishedEvents]);

  const availableMonths = Array.from({ length: 12 }, (_, i) => ('0' + (i + 1)).slice(-2));
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

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
          ? event.description.toLowerCase() : "");
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

  // Toggle year expansion
  const toggleYearExpand = (year) => {
    setExpandedYears(prev => ({
      ...prev,
      [year]: !prev[year]
    }));
  };

  const toggleMonthExpand = (year, month) => {
    setExpandedMonths(prev => {
      const yearState = prev[year] || {};
      return {
        ...prev,
        [year]: {
          ...yearState,
          [month]: !yearState[month]
        }
      };
    });
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
    <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white via-white to-indigo-50/40 p-6 shadow-sm">
      {/* Header with filter toggle */}
      <TabHeader
        icon={<Calendar className="h-7 w-7 text-indigo-600" />}
        title="Finished Events"
        actions={
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1 px-2 py-1 text-sm bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            <Filter className="h-4 w-4" />
            <span>{showFilters ? 'Hide Filters' : 'Filters'}</span>
          </button>
        }
      />

      {/* Compact search bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
          <input
            type="text"
            placeholder="Search in finished events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-gray-200 bg-white/80 py-2 pl-11 pr-11 text-sm shadow-inner focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 transform text-gray-400 transition hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Expandable filters - more compact */}
      {showFilters && (
        <div className="mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-gray-700">Filter Options</h3>
            {(selectedYear || selectedMonth || startDate || endDate || searchQuery) && (
              <button 
                onClick={clearFilters}
                className="text-xs text-indigo-600 hover:text-indigo-800"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Filter Mode Toggle - more compact */}
          <div className="mb-3">
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <button 
                onClick={() => setFilterMode('month')}
                className={`px-3 py-1 text-xs font-medium rounded-l-lg ${
                  filterMode === 'month' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                Month View
              </button>
              <button 
                onClick={() => setFilterMode('range')}
                className={`px-3 py-1 text-xs font-medium rounded-r-lg ${
                  filterMode === 'range' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                Date Range
              </button>
            </div>
          </div>

          {/* Filter Inputs - more compact */}
          {filterMode === 'month' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full py-1 text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                >
                  <option value="">All Years</option>
                  {availableYears.map(year => (
                    <option key={year} value={year.toString()}>{year}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full py-1 text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                >
                  <option value="">All Months</option>
                  {availableMonths.map((month, index) => (
                    <option key={month} value={month}>{monthNames[index]}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">From</label>
                <input 
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full py-1 text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">To</label>
                <input 
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full py-1 text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results Summary - more compact */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-3 text-sm">
          <div className="flex items-center gap-3 rounded-xl border border-indigo-200/60 bg-white px-4 py-3 shadow-inner">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/10">
              <Calendar className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-indigo-600">Archive</p>
              <p className="font-semibold text-gray-700">{groupedEvents.count} {groupedEvents.count === 1 ? 'event' : 'events'} found</p>
            </div>
          </div>

          {(selectedYear || selectedMonth || startDate || endDate || searchQuery) && (
            <div className="flex items-center gap-2 rounded-xl border border-indigo-200/40 bg-indigo-50 px-4 py-3 text-xs font-medium text-indigo-600">
              <Filter className="h-4 w-4" />
              Filters active
            </div>
          )}
        </div>
      </div>

      {/* Event list - more compact */}
      {groupedEvents.count === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white/70 py-12 text-center">
          <Calendar className="mx-auto mb-3 h-12 w-12 text-gray-300" />
          <p className="text-sm text-gray-500">No finished events found</p>
          {(selectedYear || selectedMonth || startDate || endDate || searchQuery) && (
            <p className="text-xs text-gray-400">Try adjusting your filter settings</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {Object.keys(groupedEvents.groups).sort((a, b) => b - a).map(year => (
            <div key={year} className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
              <button
                onClick={() => toggleYearExpand(year)}
                className="flex w-full items-center justify-between bg-gray-50 px-4 py-3 text-left transition-colors hover:bg-gray-100"
              >
                <h3 className="text-base font-semibold text-gray-800">{year}</h3>
                <div className="flex items-center">
                  <span className="mr-2 text-xs text-gray-500">
                    {Object.values(groupedEvents.groups[year]).flat().length} events
                  </span>
                  {expandedYears[year] ? (
                    <ChevronUp className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  )}
                </div>
              </button>
              
              {expandedYears[year] && (
                <div className="space-y-3 p-4">
                  {Object.keys(groupedEvents.groups[year])
                    .sort((a, b) => b - a) // Sort months newest first
                    .map(month => {
                      const monthIndex = Number(month);
                      const eventsForMonth = groupedEvents.groups[year][month];
                      const monthExpanded = expandedMonths[year]?.[month];
                      const eventCountLabel = `${eventsForMonth.length} ${eventsForMonth.length === 1 ? 'event' : 'events'}`;
                      return (
                        <div key={`${year}-${month}`} className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                          <button
                            onClick={() => toggleMonthExpand(year, month)}
                            className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-gray-50"
                          >
                            <span className="text-sm font-semibold text-gray-700">{monthNames[monthIndex]} {year}</span>
                            <div className="flex items-center text-xs text-gray-500">
                              <span className="mr-2">{eventCountLabel}</span>
                              {monthExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </div>
                          </button>
                          {monthExpanded && (
                            <div className="grid gap-3 bg-gray-50 px-4 py-4 sm:grid-cols-2 xl:grid-cols-3">
                              {eventsForMonth.map(event => (
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
                    })}
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