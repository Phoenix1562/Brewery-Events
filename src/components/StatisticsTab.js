import React, { useMemo, useState, useEffect } from 'react';
import { Calendar, Filter, BarChart2, LineChart, DollarSign, CheckSquare, Users, MapPin, ChevronDown, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

// --- Reusable UI Components ---

// KPICard Component
const KPICard = ({ title, value, icon, trend, trendDirection, unit, isLoading }) => (
    <div className="bg-white p-5 rounded-xl shadow-lg border border-gray-200 flex flex-col justify-between min-h-[120px] hover:shadow-xl transition-shadow duration-300">
        <div className="flex items-center text-gray-500 mb-2">
            {icon && React.cloneElement(icon, { size: 18, className: "mr-2" })}
            <span className="text-sm font-medium">{title}</span>
        </div>
        {isLoading ? (
            <div className="h-8 bg-gray-200 rounded animate-pulse w-3/4"></div>
        ) : (
            <p className="text-3xl font-bold text-gray-800 truncate">{unit}{value}</p>
        )}
        {trend && !isLoading && (
            <div className={`text-xs flex items-center mt-1 ${trendDirection === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                {trendDirection === 'up' ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
                <span>{trend}</span>
            </div>
        )}
    </div>
);

// DateRangeFilter Component
const DateRangeFilter = ({ onFilterChange, availableYears }) => {
    const [preset, setPreset] = useState('last90days');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [showCustom, setShowCustom] = useState(false);

    const commonPresetClasses = "px-3 py-1.5 text-xs rounded-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1";
    const activePresetClasses = "bg-emerald-600 text-white focus:ring-emerald-500";
    const inactivePresetClasses = "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-emerald-400";
    
    const calculateDateRange = (selectedPreset, start, end) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize to start of day
        let startDate = new Date(today);
        let endDate = new Date(today);
        endDate.setHours(23,59,59,999); // Normalize to end of day

        switch (selectedPreset) {
            case 'last30days':
                startDate.setDate(today.getDate() - 30);
                break;
            case 'last90days':
                startDate.setDate(today.getDate() - 90);
                break;
            case 'thisMonth':
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
                break;
            case 'lastMonth':
                startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                endDate = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
                break;
            case 'thisYear':
                startDate = new Date(today.getFullYear(), 0, 1);
                endDate = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
                break;
            case 'allTime':
                startDate = null; // Indicates no start constraint
                endDate = null;   // Indicates no end constraint
                break;
            case 'custom':
                if (start && end) {
                    startDate = new Date(start);
                    startDate.setHours(0,0,0,0);
                    endDate = new Date(end);
                    endDate.setHours(23,59,59,999);
                } else if (start) {
                    startDate = new Date(start);
                    startDate.setHours(0,0,0,0);
                    endDate = null; // Open-ended
                } else if (end) {
                    endDate = new Date(end);
                    endDate.setHours(23,59,59,999);
                    startDate = null; // Open-ended
                } else {
                    startDate = null;
                    endDate = null;
                }
                break;
            default: // last90days
                startDate.setDate(today.getDate() - 90);
        }
        return { startDate, endDate };
    };

    useEffect(() => {
        const { startDate, endDate } = calculateDateRange(preset, customStart, customEnd);
        onFilterChange({ startDate, endDate, preset });
    }, [preset, customStart, customEnd, onFilterChange]);

    const handlePresetChange = (newPreset) => {
        setPreset(newPreset);
        if (newPreset !== 'custom') {
            setShowCustom(false);
            setCustomStart('');
            setCustomEnd('');
        } else {
            setShowCustom(true);
        }
    };
    
    const handleCustomDateChange = () => {
        // This will trigger the useEffect to recalculate and call onFilterChange
        // Ensure preset is 'custom' if custom dates are being set directly
        if (preset !== 'custom') setPreset('custom');
         const { startDate, endDate } = calculateDateRange('custom', customStart, customEnd);
        onFilterChange({ startDate, endDate, preset: 'custom' });
    };


    return (
        <div className="bg-white p-3 rounded-lg shadow border border-gray-200 mb-6">
            <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-sm font-medium text-gray-600 mr-2">Date Range:</span>
                {['last30days', 'last90days', 'thisMonth', 'lastMonth', 'thisYear', 'allTime'].map(p => (
                    <button
                        key={p}
                        onClick={() => handlePresetChange(p)}
                        className={`${commonPresetClasses} ${preset === p ? activePresetClasses : inactivePresetClasses}`}
                    >
                        {p.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} {/* Prettify label */}
                    </button>
                ))}
                <button
                    onClick={() => {setShowCustom(prev => !prev); if(preset !== 'custom') handlePresetChange('custom');}}
                    className={`${commonPresetClasses} ${preset === 'custom' ? activePresetClasses : inactivePresetClasses} flex items-center`}
                >
                    Custom <ChevronDown size={14} className={`ml-1 transition-transform ${showCustom ? 'rotate-180' : ''}`} />
                </button>
            </div>
            {showCustom && preset === 'custom' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-200 animate-fadeIn">
                    <div>
                        <label htmlFor="customStartDate" className="block text-xs font-medium text-gray-500 mb-0.5">Start Date</label>
                        <input
                            type="date"
                            id="customStartDate"
                            value={customStart}
                            onChange={(e) => setCustomStart(e.target.value)}
                            onBlur={handleCustomDateChange} // Apply filter when focus leaves
                            className="w-full text-sm border-gray-300 rounded-md shadow-sm p-1.5 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="customEndDate" className="block text-xs font-medium text-gray-500 mb-0.5">End Date</label>
                        <input
                            type="date"
                            id="customEndDate"
                            value={customEnd}
                            onChange={(e) => setCustomEnd(e.target.value)}
                            onBlur={handleCustomDateChange} // Apply filter when focus leaves
                            className="w-full text-sm border-gray-300 rounded-md shadow-sm p-1.5 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

// Basic Bar Chart Component (CSS-based for simplicity)
const BasicBarChart = ({ data, dataKey, labelKey, title, unit = '' }) => {
    if (!data || data.length === 0) {
        return <div className="text-center py-10 text-gray-500">
            <BarChart2 size={32} className="mx-auto mb-2 opacity-50"/>
            No data available for {title?.toLowerCase()}.
        </div>;
    }
    const maxValue = Math.max(...data.map(item => item[dataKey]), 0);

    return (
        <div className="h-full flex flex-col">
            <h4 className="text-md font-semibold text-gray-600 mb-3">{title}</h4>
            <div className="flex-grow space-y-2 pr-2 overflow-y-auto"> {/* Added overflow for many items */}
                {data.map((item, index) => (
                    <div key={index} className="flex items-center group">
                        <div className="w-28 sm:w-32 text-xs text-gray-500 truncate pr-2">{item[labelKey]}</div>
                        <div className="flex-1 bg-gray-200 rounded-full h-5 relative">
                            <div
                                className="bg-emerald-500 h-5 rounded-full text-right pr-1.5 text-white text-[10px] flex items-center justify-end transition-all duration-300 ease-out group-hover:bg-emerald-600"
                                style={{ width: `${maxValue > 0 ? (item[dataKey] / maxValue) * 100 : 0}%` }}
                            >
                                {unit}{item[dataKey]?.toLocaleString()}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


// --- Main StatisticsDashboard Component ---
function StatisticsDashboard({ events }) {
    const [isLoading, setIsLoading] = useState(true);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [dateFilter, setDateFilter] = useState({
        startDate: null,
        endDate: null,
        preset: 'last90days'
    });
    const [activeDetailedView, setActiveDetailedView] = useState(null); // 'monthly', 'comparison'

    // Initial data processing and filtering
    useEffect(() => {
        setIsLoading(true);
        if (events && events.length > 0) {
            const finished = events.filter(e => e.status === 'finished' && e.eventDate);
            
            let currentFiltered = finished;
            if (dateFilter.startDate || dateFilter.endDate) {
                 currentFiltered = finished.filter(e => {
                    const eventDate = new Date(e.eventDate);
                    eventDate.setHours(0,0,0,0); // Normalize event date
                    const start = dateFilter.startDate ? new Date(dateFilter.startDate) : null;
                    const end = dateFilter.endDate ? new Date(dateFilter.endDate) : null;

                    if (start && end) return eventDate >= start && eventDate <= end;
                    if (start) return eventDate >= start;
                    if (end) return eventDate <= end;
                    return true; // Should be caught by preset 'allTime' or if dates are null
                });
            }
            setFilteredEvents(currentFiltered);
        } else {
            setFilteredEvents([]);
        }
        setIsLoading(false);
    }, [events, dateFilter]);

    const handleFilterChange = (newFilter) => {
        setDateFilter(newFilter);
    };

    // --- Memoized Calculations for Dashboard ---
    const kpiData = useMemo(() => {
        if (isLoading || !filteredEvents) return { totalRevenue: 0, eventCount: 0, avgRevenuePerEvent: 0, busiestVenue: 'N/A' };
        
        const totalRevenue = filteredEvents.reduce((sum, event) => sum + (parseFloat(event.grandTotal) || 0), 0);
        const eventCount = filteredEvents.length;
        const avgRevenuePerEvent = eventCount > 0 ? totalRevenue / eventCount : 0;

        const venueCounts = filteredEvents.reduce((acc, event) => {
            const venue = event.buildingArea || 'Unknown';
            acc[venue] = (acc[venue] || 0) + 1;
            return acc;
        }, {});
        const busiestVenue = Object.entries(venueCounts).sort(([,a],[,b]) => b-a)[0]?.[0] || 'N/A';

        return { totalRevenue, eventCount, avgRevenuePerEvent, busiestVenue, venueCounts };
    }, [filteredEvents, isLoading]);

    const monthlyRevenueData = useMemo(() => {
        if (isLoading || !filteredEvents) return [];
        const grouped = filteredEvents.reduce((acc, event) => {
            const date = new Date(event.eventDate);
            const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
            acc[monthYear] = (acc[monthYear] || 0) + (parseFloat(event.grandTotal) || 0);
            return acc;
        }, {});
        return Object.entries(grouped)
            .map(([monthYear, revenue]) => ({ monthYear, revenue }))
            .sort((a, b) => a.monthYear.localeCompare(b.monthYear));
    }, [filteredEvents, isLoading]);
    
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const formattedMonthlyRevenueData = monthlyRevenueData.map(item => {
        const [year, monthNum] = item.monthYear.split('-');
        return { label: `${monthNames[parseInt(monthNum)-1]} ${year.slice(-2)}`, value: item.revenue };
    });

    const venueDistributionData = useMemo(() => {
        if (isLoading || !kpiData.venueCounts) return [];
        return Object.entries(kpiData.venueCounts)
            .map(([name, count]) => ({ name, value: count }))
            .sort((a,b) => b.value - a.value); // Sort by count desc
    }, [isLoading, kpiData.venueCounts]);


    // --- Detailed Reports Data (similar to your old StatisticsTab) ---
    const detailedMonthlyStats = useMemo(() => {
        // This is where your existing `stats` calculation logic from StatisticsTab would go,
        // using `filteredEvents` as its source.
        const grouped = filteredEvents.reduce((acc, event) => {
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
    }, [filteredEvents]);

    const getFormattedMonthYear = (key) => {
        const [year, month] = key.split('-');
        const monthNamesFull = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        return `${monthNamesFull[parseInt(month, 10) - 1]} ${year}`;
    };
    
    // For Revenue Comparison Tool
    const [comparisonStart, setComparisonStart] = useState('');
    const [comparisonEnd, setComparisonEnd] = useState('');


    if (!events) {
      return (
        <div className="p-6 text-center text-gray-500">
          <AlertCircle size={48} className="mx-auto mb-4 text-yellow-500" />
          Loading event data or no events available.
        </div>
      );
    }


    return (
        <div className="p-4 sm:p-6 bg-slate-50 min-h-screen">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-3">
                <div className="flex items-center">
                    <BarChart2 className="h-8 w-8 text-emerald-600 mr-3" />
                    <h1 className="text-2xl font-bold text-gray-800">Event Insights Dashboard</h1>
                </div>
                {/* Placeholder for global actions like "Export All Stats" if needed */}
            </div>

            <DateRangeFilter onFilterChange={handleFilterChange} />

            {/* KPI Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                <KPICard title="Total Revenue" value={kpiData.totalRevenue.toFixed(2)} unit="$" icon={<DollarSign />} isLoading={isLoading} />
                <KPICard title="Finished Events" value={kpiData.eventCount} icon={<CheckSquare />} isLoading={isLoading} />
                <KPICard title="Avg. Revenue / Event" value={kpiData.avgRevenuePerEvent.toFixed(2)} unit="$" icon={<DollarSign />} isLoading={isLoading} />
                <KPICard title="Busiest Venue" value={kpiData.busiestVenue} icon={<MapPin />} isLoading={isLoading} />
            </div>

            {/* Main Visualization Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 sm:mb-8">
                <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-200 min-h-[350px] flex flex-col">
                    {isLoading ? (
                        <div className="flex-grow flex items-center justify-center text-gray-400">Loading chart data...</div>
                    ) : (
                        <BasicBarChart data={formattedMonthlyRevenueData} dataKey="value" labelKey="label" title="Monthly Revenue Trend" unit="$"/>
                    )}
                </div>
                <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-200 min-h-[350px] flex flex-col">
                     {isLoading ? (
                        <div className="flex-grow flex items-center justify-center text-gray-400">Loading chart data...</div>
                    ) : (
                        <BasicBarChart data={venueDistributionData} dataKey="value" labelKey="name" title="Events by Venue"/>
                    )}
                </div>
            </div>

            {/* Deeper Dive Section */}
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-700 mb-4">Deeper Dive & Reports</h3>
                <div className="flex flex-wrap gap-3 mb-6">
                    <button 
                        onClick={() => setActiveDetailedView(activeDetailedView === 'monthly' ? null : 'monthly')}
                        className={`px-4 py-2 text-sm rounded-md transition-colors shadow-sm font-medium ${activeDetailedView === 'monthly' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'}`}
                    >
                        {activeDetailedView === 'monthly' ? 'Hide' : 'Show'} Monthly Breakdown
                    </button>
                    <button 
                        onClick={() => setActiveDetailedView(activeDetailedView === 'comparison' ? null : 'comparison')}
                        className={`px-4 py-2 text-sm rounded-md transition-colors shadow-sm font-medium ${activeDetailedView === 'comparison' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'}`}
                    >
                        {activeDetailedView === 'comparison' ? 'Hide' : 'Show'} Revenue Comparison Tool
                    </button>
                </div>

                {activeDetailedView === 'monthly' && (
                    <div className="mt-4 animate-fadeIn">
                        <h4 className="text-lg font-medium text-gray-700 mb-3">Detailed Monthly Breakdown</h4>
                        {detailedMonthlyStats.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">No detailed monthly data for the selected period.</div>
                        ) : (
                            <div className="overflow-x-auto rounded-lg border border-gray-200">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="px-4 py-2.5 text-left font-semibold text-gray-600">Month-Year</th>
                                            <th className="px-4 py-2.5 text-left font-semibold text-gray-600">Events</th>
                                            <th className="px-4 py-2.5 text-left font-semibold text-gray-600">Revenue</th>
                                            <th className="px-4 py-2.5 text-left font-semibold text-gray-600">Room Usage</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {detailedMonthlyStats.map((stat) => (
                                            <tr key={stat.monthYear} className="hover:bg-gray-50">
                                                <td className="px-4 py-2.5 whitespace-nowrap font-medium text-gray-800">{getFormattedMonthYear(stat.monthYear)}</td>
                                                <td className="px-4 py-2.5 whitespace-nowrap text-gray-700">{stat.count}</td>
                                                <td className="px-4 py-2.5 whitespace-nowrap text-green-600 font-medium">${stat.totalRevenue.toFixed(2)}</td>
                                                <td className="px-4 py-2.5">
                                                    {Object.entries(stat.roomUsage).map(([room, count]) => (
                                                        <div key={room} className="text-xs text-gray-600">{room}: {count}</div>
                                                    )).reduce((acc, curr, idx, arr) => idx < arr.length -1 ? [acc, <span key={`sep-${idx}`} className="mx-1">|</span>, curr] : [acc, curr] , [])}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeDetailedView === 'comparison' && (
                    <div className="mt-4 animate-fadeIn">
                        {/* This is where your existing RevenueComparison component/logic would go */}
                        {/* For now, a placeholder: */}
                        <RevenueComparisonTool
                            allMonthlyStats={detailedMonthlyStats} // Pass all available monthly stats for selection
                            getFormattedMonthYear={getFormattedMonthYear}
                            comparisonStart={comparisonStart}
                            setComparisonStart={setComparisonStart}
                            comparisonEnd={comparisonEnd}
                            setComparisonEnd={setComparisonEnd}
                        />
                    </div>
                )}
            </div>
            {/* Add a simple CSS animation for fadeIn if you like */}
            {/* <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
            `}</style> */}
        </div>
    );
}


// RevenueComparisonTool (adapted from your previous StatisticsTab)
function RevenueComparisonTool({
  allMonthlyStats, // Changed from 'stats' to avoid conflict, now receives all available months
  getFormattedMonthYear,
  comparisonStart,
  setComparisonStart,
  comparisonEnd,
  setComparisonEnd,
}) {
  const comparisonStats = useMemo(() => {
    if (!comparisonStart || !comparisonEnd || !allMonthlyStats) return [];
    // Filter allMonthlyStats based on comparisonStart and comparisonEnd
    return allMonthlyStats.filter(
      s => s.monthYear >= comparisonStart && s.monthYear <= comparisonEnd
    ).sort((a, b) => a.monthYear.localeCompare(b.monthYear));
  }, [allMonthlyStats, comparisonStart, comparisonEnd]);

  const maxComparisonRevenue = useMemo(() => {
    return comparisonStats.reduce(
      (max, stat) => Math.max(max, stat.totalRevenue), 0
    );
  }, [comparisonStats]);

  return (
    <div className="bg-white rounded-lg mt-4"> {/* Removed redundant border/shadow if nested */}
      <h4 className="text-lg font-medium text-gray-700 mb-3">Revenue Comparison Tool</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-md border">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Month for Comparison</label>
          <select
            value={comparisonStart}
            onChange={(e) => setComparisonStart(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm p-2 focus:border-emerald-500 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
          >
            <option value="">Select Start Month</option>
            {allMonthlyStats.map(stat => ( // Use allMonthlyStats for dropdown options
              <option key={`start-${stat.monthYear}`} value={stat.monthYear}>
                {getFormattedMonthYear(stat.monthYear)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Month for Comparison</label>
          <select
            value={comparisonEnd}
            onChange={(e) => setComparisonEnd(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm p-2 focus:border-emerald-500 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
          >
            <option value="">Select End Month</option>
            {allMonthlyStats.map(stat => ( // Use allMonthlyStats for dropdown options
              <option key={`end-${stat.monthYear}`} value={stat.monthYear}>
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
            <p className="text-gray-500">No revenue data available for the selected comparison range.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {comparisonStats.map(stat => {
              const widthPercent = maxComparisonRevenue > 0 ? (stat.totalRevenue / maxComparisonRevenue) * 100 : 0;
              return (
                <div key={stat.monthYear} className="group relative">
                  <div className="flex items-center mb-0.5">
                    <span className="w-32 sm:w-36 text-xs text-gray-600 font-medium truncate">
                      {getFormattedMonthYear(stat.monthYear)}
                    </span>
                    <div className="flex-1">
                      <div className="relative h-6 bg-gray-200 rounded-sm">
                        <div
                          className="absolute top-0 left-0 h-6 bg-emerald-500 rounded-sm transition-all duration-500 ease-out group-hover:bg-emerald-600 flex items-center justify-end pr-2"
                          style={{ width: `${widthPercent}%` }}
                        >
                          <span className="text-[10px] font-medium text-white opacity-90 group-hover:opacity-100">
                            ${stat.totalRevenue.toFixed(0)} {/* Simplified display */}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="ml-32 sm:ml-36 flex justify-start text-[10px] text-gray-500">
                    <span>{stat.count} events</span>
                    <span className="mx-1">|</span>
                    <span>Avg: ${(stat.totalRevenue / (stat.count || 1)).toFixed(0)}/event</span>
                  </div>
                </div>
              );
            })}
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
                      ${comparisonStats.length > 0 ? (comparisonStats.reduce((sum, stat) => sum + stat.totalRevenue, 0) / comparisonStats.length).toFixed(2) : '0.00'}
                    </p>
                  </div>
                </div>
              </div>

          </div>
        )
      ) : (
        <div className="text-center py-12 bg-gray-100 rounded-lg">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Please select both a start and end month for comparison.</p>
        </div>
      )}
    </div>
  );
}


export default StatisticsDashboard; // Renamed for clarity
