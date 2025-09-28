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
    <div className="rounded-2xl border border-surface-700 bg-surface-900 p-5 text-surface-50 shadow-lg">
      {/* Header with filter toggle */}
      <TabHeader
        icon={(
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-800 text-rosewood-300">
            <Calendar className="h-6 w-6" />
          </span>
        )}
        title="Finished Events"
        titleClassName="text-surface-50"
        actions={
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1 rounded-lg border border-rosewood-400/50 bg-rosewood-500/15 px-3 py-1.5 text-sm text-rosewood-200 transition-colors hover:border-rosewood-300/70 hover:bg-rosewood-500/25 focus:outline-none focus:ring-2 focus:ring-rosewood-300 focus:ring-offset-2 focus:ring-offset-surface-900"
          >
            <Filter className="h-4 w-4" />
            <span>{showFilters ? 'Hide Filters' : 'Filters'}</span>
          </button>
        }
      />

      {/* Compact search bar */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 transform text-surface-300" />
          <input
            type="text"
            placeholder="Search in finished events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-surface-600 bg-surface-800 py-1.5 pl-8 pr-8 text-sm text-surface-100 placeholder-surface-200/70 transition-colors focus:border-rosewood-300 focus:outline-none focus:ring-2 focus:ring-rosewood-300 focus:ring-offset-2 focus:ring-offset-surface-900"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 transform text-surface-400 transition-colors hover:text-rosewood-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Expandable filters - more compact */}
      {showFilters && (
        <div className="mb-4 rounded-xl border border-surface-600 bg-surface-800/80 p-3 text-sm">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-medium text-surface-150">Filter Options</h3>
            {(selectedYear || selectedMonth || startDate || endDate || searchQuery) && (
              <button
                onClick={clearFilters}
                className="text-xs text-rosewood-200 transition-colors hover:text-rosewood-100"
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
                className={`px-3 py-1 text-xs font-medium rounded-l-lg transition-colors ${
                  filterMode === 'month'
                    ? 'bg-rosewood-600 text-surface-50'
                    : 'border border-surface-600 bg-surface-900 text-surface-200 hover:bg-surface-700'
                }`}
              >
                Month View
              </button>
              <button
                onClick={() => setFilterMode('range')}
                className={`px-3 py-1 text-xs font-medium rounded-r-lg transition-colors ${
                  filterMode === 'range'
                    ? 'bg-rosewood-600 text-surface-50'
                    : 'border border-surface-600 bg-surface-900 text-surface-200 hover:bg-surface-700'
                }`}
              >
                Date Range
              </button>
            </div>
          </div>

          {/* Filter Inputs - more compact */}
          {filterMode === 'month' ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-surface-200">Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full rounded-md border border-surface-600 bg-surface-900 py-1 text-sm text-surface-100 shadow-sm focus:border-rosewood-300 focus:outline-none focus:ring-2 focus:ring-rosewood-300 focus:ring-offset-2 focus:ring-offset-surface-900"
                >
                  <option value="">All Years</option>
                  {availableYears.map(year => (
                    <option key={year} value={year.toString()}>{year}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-surface-200">Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full rounded-md border border-surface-600 bg-surface-900 py-1 text-sm text-surface-100 shadow-sm focus:border-rosewood-300 focus:outline-none focus:ring-2 focus:ring-rosewood-300 focus:ring-offset-2 focus:ring-offset-surface-900"
                >
                  <option value="">All Months</option>
                  {availableMonths.map((month, index) => (
                    <option key={month} value={month}>{monthNames[index]}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-surface-200">From</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-md border border-surface-600 bg-surface-900 py-1 text-sm text-surface-100 shadow-sm focus:border-rosewood-300 focus:outline-none focus:ring-2 focus:ring-rosewood-300 focus:ring-offset-2 focus:ring-offset-surface-900"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-surface-200">To</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-md border border-surface-600 bg-surface-900 py-1 text-sm text-surface-100 shadow-sm focus:border-rosewood-300 focus:outline-none focus:ring-2 focus:ring-rosewood-300 focus:ring-offset-2 focus:ring-offset-surface-900"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results Summary - more compact */}
      <div className="mb-3">
        <div className="rounded-lg border border-rosewood-400/40 bg-surface-800/80 px-3 py-1.5 text-sm">
          <span className="font-medium text-surface-50">
            {groupedEvents.count} {groupedEvents.count === 1 ? 'event' : 'events'} found
          </span>
          {(selectedYear || selectedMonth || startDate || endDate || searchQuery) && (
            <span className="ml-2 text-xs text-rosewood-200">
              (filtered)
            </span>
          )}
        </div>
      </div>

      {/* Event list - more compact */}
      {groupedEvents.count === 0 ? (
        <div className="text-center rounded-xl border border-surface-600 bg-surface-800/80 py-6">
          <Calendar className="mx-auto mb-2 h-8 w-8 text-rosewood-200" />
          <p className="text-sm text-surface-200">No finished events found</p>
          {(selectedYear || selectedMonth || startDate || endDate || searchQuery) && (
            <p className="text-xs text-surface-300">Try adjusting your filter settings</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {Object.keys(groupedEvents.groups).sort((a, b) => b - a).map(year => (
            <div key={year} className="overflow-hidden rounded-2xl border border-surface-700">
              <button
                onClick={() => toggleYearExpand(year)}
                className="flex w-full items-center justify-between bg-surface-800/80 p-3 text-left transition-colors hover:bg-surface-700"
              >
                <h3 className="text-base font-medium text-surface-100">{year}</h3>
                <div className="flex items-center">
                  <span className="mr-2 text-xs text-surface-300">
                    {Object.values(groupedEvents.groups[year]).flat().length} events
                  </span>
                  {expandedYears[year] ? (
                    <ChevronUp className="h-4 w-4 text-surface-300" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-surface-300" />
                  )}
                </div>
              </button>

              {expandedYears[year] && (
                <div className="p-2 space-y-2">
                  {Object.keys(groupedEvents.groups[year])
                    .sort((a, b) => b - a) // Sort months newest first
                    .map(month => {
                      const monthIndex = Number(month);
                      const eventsForMonth = groupedEvents.groups[year][month];
                      const monthExpanded = expandedMonths[year]?.[month];
                      const eventCountLabel = `${eventsForMonth.length} ${eventsForMonth.length === 1 ? 'event' : 'events'}`;
                      return (
                        <div key={`${year}-${month}`} className="overflow-hidden rounded-xl border border-surface-700 bg-surface-800/80">
                          <button
                            onClick={() => toggleMonthExpand(year, month)}
                            className="flex w-full items-center justify-between px-3 py-2 text-left transition-colors hover:bg-surface-700"
                          >
                            <span className="text-sm font-medium text-surface-150">{monthNames[monthIndex]} {year}</span>
                            <div className="flex items-center text-xs text-surface-300">
                              <span className="mr-2">{eventCountLabel}</span>
                              {monthExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </div>
                          </button>
                          {monthExpanded && (
                            <div className="space-y-2 bg-surface-900/80 p-2">
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