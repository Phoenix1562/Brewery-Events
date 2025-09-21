import React, { useMemo, useState, useEffect } from 'react';
import { Calendar, Filter, BarChart2, LineChart, DollarSign, CheckSquare, Users, MapPin, ChevronDown, TrendingUp, TrendingDown, AlertCircle, Sparkles, Award, Trophy, Activity } from 'lucide-react';
import TabHeader from './TabHeader';

// --- Reusable UI Components ---

const formatCurrency = (value, options = {}) => {
    const amount = Number(value) || 0;
    const { minimumFractionDigits = 0, maximumFractionDigits = 0 } = options;
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits,
        maximumFractionDigits,
    }).format(amount);
};

const MONTH_NAMES_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_NAMES_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

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

const InsightCard = ({ icon, title, headline, subtext, accent = 'emerald' }) => {
    const accentStyles = {
        emerald: 'bg-emerald-50 text-emerald-600',
        indigo: 'bg-indigo-50 text-indigo-600',
        amber: 'bg-amber-50 text-amber-600',
    };

    const badgeClass = accentStyles[accent] || accentStyles.emerald;

    return (
        <div className="bg-white p-4 sm:p-5 rounded-xl shadow-lg border border-gray-200 h-full flex flex-col">
            <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${badgeClass}`}>
                    {icon && React.cloneElement(icon, { size: 18 })}
                </div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{title}</span>
            </div>
            <div className="text-xl font-semibold text-gray-800 leading-tight">
                {headline}
            </div>
            {subtext && (
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                    {subtext}
                </p>
            )}
        </div>
    );
};

const RankedListCard = ({ title, icon, items, emptyMessage }) => (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-200 h-full flex flex-col">
        <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
                {icon && React.cloneElement(icon, { size: 18 })}
            </div>
            <h4 className="text-md font-semibold text-gray-700">{title}</h4>
        </div>
        {(!items || items.length === 0) ? (
            <div className="flex-grow flex items-center justify-center text-sm text-gray-500 text-center py-4">
                {emptyMessage}
            </div>
        ) : (
            <ul className="space-y-3 flex-grow">
                {items.map((item, index) => (
                    <li key={item.key || item.label || index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                            <span className="text-xs font-bold text-gray-400 w-6">{String(index + 1).padStart(2, '0')}</span>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-800 truncate">{item.label}</p>
                                {item.description && (
                                    <p className="text-xs text-gray-500 truncate">{item.description}</p>
                                )}
                            </div>
                        </div>
                        <div className="text-sm font-semibold text-emerald-600 whitespace-nowrap">
                            {item.value}
                        </div>
                    </li>
                ))}
            </ul>
        )}
    </div>
);

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
    
    const monthNames = MONTH_NAMES_SHORT;
    const formattedMonthlyRevenueData = monthlyRevenueData.map(item => {
        const [year, monthNum] = item.monthYear.split('-');
        return { label: `${monthNames[parseInt(monthNum)-1]} ${year.slice(-2)}`, value: item.revenue };
    });

    const revenueTrend = useMemo(() => {
        if (!monthlyRevenueData || monthlyRevenueData.length === 0) return null;
        const latest = monthlyRevenueData[monthlyRevenueData.length - 1];
        const previous = monthlyRevenueData.length > 1 ? monthlyRevenueData[monthlyRevenueData.length - 2] : null;
        if (!latest) return null;
        const diff = previous ? latest.revenue - previous.revenue : latest.revenue;
        const percent = previous && previous.revenue ? (diff / previous.revenue) * 100 : null;
        const [latestYear, latestMonth] = latest.monthYear.split('-');
        const [previousYear, previousMonth] = previous ? previous.monthYear.split('-') : [null, null];
        return {
            current: latest,
            previous,
            diff,
            percent,
            direction: diff >= 0 ? 'up' : 'down',
            currentLabel: `${MONTH_NAMES_FULL[parseInt(latestMonth, 10) - 1]} ${latestYear}`,
            previousLabel: previous ? `${MONTH_NAMES_FULL[parseInt(previousMonth, 10) - 1]} ${previousYear}` : null,
        };
    }, [monthlyRevenueData]);

    const venueDistributionData = useMemo(() => {
        if (isLoading || !kpiData.venueCounts) return [];
        return Object.entries(kpiData.venueCounts)
            .map(([name, count]) => ({ name, value: count }))
            .sort((a,b) => b.value - a.value); // Sort by count desc
    }, [isLoading, kpiData.venueCounts]);

    const topVenue = useMemo(() => {
        if (!venueDistributionData || venueDistributionData.length === 0) return null;
        const [primary, secondary] = venueDistributionData;
        const eventTotal = filteredEvents.length || 1;
        return {
            name: primary.name,
            count: primary.value,
            share: Math.round((primary.value / eventTotal) * 100),
            runnerUp: secondary ? secondary.name : null,
        };
    }, [venueDistributionData, filteredEvents]);

    const clientAggregates = useMemo(() => {
        if (!filteredEvents || filteredEvents.length === 0) return [];
        const map = {};
        filteredEvents.forEach(event => {
            const clientName = event.clientName && event.clientName.trim() ? event.clientName.trim() : 'Unnamed Client';
            const revenue = parseFloat(event.grandTotal) || 0;
            if (!map[clientName]) {
                map[clientName] = { revenue: 0, count: 0 };
            }
            map[clientName].revenue += revenue;
            map[clientName].count += 1;
        });
        return Object.entries(map)
            .map(([name, info]) => ({ name, ...info }))
            .sort((a, b) => b.revenue - a.revenue);
    }, [filteredEvents]);

    const topClient = clientAggregates[0] || null;
    const repeatClients = useMemo(() => clientAggregates.filter(client => client.count > 1), [clientAggregates]);
    const repeatClientsCount = repeatClients.length;
    const leadingRepeatClient = repeatClients[0] || null;

    const highValueThreshold = useMemo(() => {
        if (!filteredEvents || filteredEvents.length === 0) return 0;
        const average = kpiData.avgRevenuePerEvent || 0;
        if (!average) return 0;
        return Math.max(average * 1.35, 5000);
    }, [filteredEvents, kpiData.avgRevenuePerEvent]);

    const highValueEvents = useMemo(() => {
        if (!filteredEvents || filteredEvents.length === 0 || !highValueThreshold) return [];
        return filteredEvents.filter(event => (parseFloat(event.grandTotal) || 0) >= highValueThreshold);
    }, [filteredEvents, highValueThreshold]);

    const topClientsList = useMemo(() => clientAggregates.slice(0, 4).map(client => ({
        key: client.name,
        label: client.name,
        description: `${client.count} event${client.count === 1 ? '' : 's'}`,
        value: formatCurrency(client.revenue),
    })), [clientAggregates]);

    const topEventsList = useMemo(() => {
        if (!filteredEvents || filteredEvents.length === 0) return [];
        const formatMonth = (dateString) => {
            if (!dateString) return 'Date TBD';
            const [year, month] = dateString.split('-');
            if (!year || !month) return 'Date TBD';
            const monthNumber = parseInt(month, 10);
            if (Number.isNaN(monthNumber)) return year || 'Date TBD';
            const monthLabel = MONTH_NAMES_FULL[monthNumber - 1] || MONTH_NAMES_FULL[0];
            return `${monthLabel} ${year}`;
        };
        return [...filteredEvents]
            .map(event => ({ ...event, revenue: parseFloat(event.grandTotal) || 0 }))
            .filter(event => event.revenue > 0)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 4)
            .map((event, index) => ({
                key: event.id || `${event.eventName || event.clientName || 'event'}-${index}`,
                label: event.eventName || 'Untitled Event',
                description: `${event.clientName || 'Unknown client'} • ${formatMonth(event.eventDate ? event.eventDate.substring(0, 7) : '')}`,
                value: formatCurrency(event.revenue),
            }));
    }, [filteredEvents]);

    const highValueShare = filteredEvents.length ? Math.round((highValueEvents.length / filteredEvents.length) * 100) : 0;
    const topClientShare = topClient && kpiData.totalRevenue > 0 ? Math.round((topClient.revenue / kpiData.totalRevenue) * 100) : 0;


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

    const topMonthsList = useMemo(() => {
        if (!detailedMonthlyStats || detailedMonthlyStats.length === 0) return [];
        return [...detailedMonthlyStats]
            .sort((a, b) => b.totalRevenue - a.totalRevenue)
            .slice(0, 4)
            .map(stat => ({
                key: stat.monthYear,
                label: getFormattedMonthYear(stat.monthYear),
                description: `${stat.count} event${stat.count === 1 ? '' : 's'}`,
                value: formatCurrency(stat.totalRevenue),
            }));
    }, [detailedMonthlyStats]);

    const averageMonthlyRevenue = useMemo(() => {
        if (!detailedMonthlyStats || detailedMonthlyStats.length === 0) return 0;
        const total = detailedMonthlyStats.reduce((sum, stat) => sum + stat.totalRevenue, 0);
        return total / detailedMonthlyStats.length;
    }, [detailedMonthlyStats]);

    const busiestMonth = useMemo(() => {
        if (!detailedMonthlyStats || detailedMonthlyStats.length === 0) return null;
        const sorted = [...detailedMonthlyStats].sort((a, b) => {
            if (b.count === a.count) {
                return b.totalRevenue - a.totalRevenue;
            }
            return b.count - a.count;
        });
        return sorted[0];
    }, [detailedMonthlyStats]);

    const getFormattedMonthYear = (key) => {
        if (!key) return '';
        const [year, month] = key.split('-');
        const monthIndex = parseInt(month, 10) - 1;
        const monthName = MONTH_NAMES_FULL[monthIndex] || MONTH_NAMES_FULL[0];
        return `${monthName} ${year}`;
    };

    const timeframeDescriptor = useMemo(() => {
        switch (dateFilter.preset) {
            case 'allTime':
                return 'across all recorded events';
            case 'thisYear':
                return 'so far this year';
            case 'thisMonth':
                return 'this month';
            case 'lastMonth':
                return 'last month';
            case 'last30days':
                return 'in the last 30 days';
            case 'last90days':
                return 'in the last 90 days';
            case 'custom':
                return 'for the custom range';
            default:
                return 'in the selected range';
        }
    }, [dateFilter.preset]);

    const summaryHighlights = useMemo(() => {
        if (isLoading || !filteredEvents || filteredEvents.length === 0) return [];
        const highlights = [];
        if (highValueEvents.length > 0 && highValueThreshold) {
            highlights.push(`${highValueEvents.length} booking${highValueEvents.length === 1 ? '' : 's'} cleared ${formatCurrency(highValueThreshold)}${filteredEvents.length ? ` (${highValueShare}% of volume)` : ''}.`);
        }
        if (topClient) {
            const shareText = topClientShare ? ` (${topClientShare}% of revenue)` : '';
            highlights.push(`${topClient.name} delivered ${formatCurrency(topClient.revenue)} across ${topClient.count} booking${topClient.count === 1 ? '' : 's'}${shareText}.`);
        }
        if (topVenue) {
            highlights.push(`${topVenue.name} hosted ${topVenue.count} event${topVenue.count === 1 ? '' : 's'}${topVenue.share ? ` (${topVenue.share}% share)` : ''}${topVenue.runnerUp ? `, ahead of ${topVenue.runnerUp}` : ''}.`);
        }
        if (busiestMonth) {
            highlights.push(`${getFormattedMonthYear(busiestMonth.monthYear)} saw ${busiestMonth.count} event${busiestMonth.count === 1 ? '' : 's'} totaling ${formatCurrency(busiestMonth.totalRevenue)}.`);
        }
        if (averageMonthlyRevenue) {
            highlights.push(`Average monthly revenue sits at ${formatCurrency(averageMonthlyRevenue)}.`);
        }
        if (revenueTrend && revenueTrend.previous) {
            if (revenueTrend.percent !== null) {
                highlights.push(`${revenueTrend.direction === 'up' ? 'Revenue climbed' : 'Revenue eased'} ${Math.abs(revenueTrend.percent).toFixed(1)}% versus ${revenueTrend.previousLabel}.`);
            } else {
                highlights.push(`${revenueTrend.direction === 'up' ? 'Revenue increased' : 'Revenue decreased'} by ${formatCurrency(Math.abs(revenueTrend.diff))} versus ${revenueTrend.previousLabel}.`);
            }
        }
        if (repeatClientsCount > 0) {
            highlights.push(`${repeatClientsCount} repeat client${repeatClientsCount === 1 ? '' : 's'}${leadingRepeatClient ? ` led by ${leadingRepeatClient.name}` : ''}.`);
        }
        return highlights.slice(0, 5);
    }, [isLoading, filteredEvents, highValueEvents, highValueThreshold, highValueShare, topClient, topClientShare, topVenue, busiestMonth, averageMonthlyRevenue, revenueTrend, repeatClientsCount, leadingRepeatClient]);

    const premiumSummary = useMemo(() => {
        if (isLoading) {
            return 'Crunching the latest performance data...';
        }
        if (!filteredEvents || filteredEvents.length === 0) {
            return 'No finished events in this range yet. Adjust the filters to see insights as bookings close.';
        }
        const totalRevenueFormatted = formatCurrency(kpiData.totalRevenue, { maximumFractionDigits: 0 });
        const baseLine = `We wrapped ${filteredEvents.length} finished event${filteredEvents.length === 1 ? '' : 's'} worth ${totalRevenueFormatted} ${timeframeDescriptor}.`;
        const premiumLine = highValueEvents.length > 0 && highValueThreshold
            ? ` ${highValueEvents.length} booking${highValueEvents.length === 1 ? '' : 's'} cleared ${formatCurrency(highValueThreshold, { maximumFractionDigits: 0 })}, highlighting strong premium demand.`
            : '';
        const loyaltyLine = repeatClientsCount > 0
            ? ` ${repeatClientsCount} client${repeatClientsCount === 1 ? ' is' : 's are'} returning${leadingRepeatClient ? `, led by ${leadingRepeatClient.name}` : ''}.`
            : '';
        let momentumLine = '';
        if (revenueTrend && revenueTrend.previous) {
            momentumLine = revenueTrend.percent !== null
                ? ` Momentum ${revenueTrend.direction === 'up' ? 'improved' : 'softened'} ${Math.abs(revenueTrend.percent).toFixed(1)}% versus ${revenueTrend.previousLabel}.`
                : ` Momentum ${revenueTrend.direction === 'up' ? 'improved' : 'softened'} by ${formatCurrency(Math.abs(revenueTrend.diff), { maximumFractionDigits: 0 })} versus ${revenueTrend.previousLabel}.`;
        }
        return `${baseLine}${premiumLine}${loyaltyLine}${momentumLine}`.trim();
    }, [isLoading, filteredEvents, kpiData.totalRevenue, timeframeDescriptor, highValueEvents, highValueThreshold, repeatClientsCount, leadingRepeatClient, revenueTrend]);

    const premiumDealsHeadline = highValueEvents.length > 0
        ? `${highValueEvents.length} premium booking${highValueEvents.length === 1 ? '' : 's'}`
        : 'No premium bookings yet';
    const premiumDealsSubtext = highValueThreshold
        ? `Benchmark: ${formatCurrency(highValueThreshold, { maximumFractionDigits: 0 })}${filteredEvents.length ? ` • ${highValueShare}% of volume` : ''}`
        : 'Add revenue details to unlock this insight.';

    const topClientHeadline = topClient ? topClient.name : 'Awaiting standout client';
    const topClientSubtext = topClient
        ? `${formatCurrency(topClient.revenue)} across ${topClient.count} event${topClient.count === 1 ? '' : 's'}${topClientShare ? ` • ${topClientShare}% of revenue` : ''}`
        : 'Track finished events to highlight leading partners.';

    const loyaltyHeadline = repeatClientsCount
        ? `${repeatClientsCount} repeat client${repeatClientsCount === 1 ? '' : 's'}`
        : 'Build repeat business';
    const loyaltySubtext = repeatClientsCount
        ? `Led by ${leadingRepeatClient ? `${leadingRepeatClient.name} (${leadingRepeatClient.count} booking${leadingRepeatClient.count === 1 ? '' : 's'})` : 'loyal partners'}.`
        : 'Encourage second bookings to see loyalty momentum.';

    const revenueMomentumHeadline = revenueTrend
        ? (revenueTrend.previous
            ? (revenueTrend.percent !== null
                ? `${revenueTrend.direction === 'up' ? '+' : '-'}${Math.abs(revenueTrend.percent).toFixed(1)}%`
                : `${revenueTrend.direction === 'up' ? '+' : '-'}${formatCurrency(Math.abs(revenueTrend.diff), { maximumFractionDigits: 0 })}`)
            : formatCurrency(revenueTrend.current.revenue, { maximumFractionDigits: 0 }))
        : 'Need more history';
    const revenueMomentumSubtext = revenueTrend
        ? (revenueTrend.previous
            ? `vs ${revenueTrend.previousLabel} • ${formatCurrency(revenueTrend.current.revenue, { maximumFractionDigits: 0 })} in ${revenueTrend.currentLabel}`
            : `First data point in ${revenueTrend.currentLabel}`)
        : 'Log at least two months of revenue to track momentum.';
    
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
            <TabHeader
                icon={<BarChart2 className="h-7 w-7 text-emerald-600" />}
                title="Event Insights Dashboard"
            />
            {/* Placeholder for global actions like "Export All Stats" if needed */}

            <DateRangeFilter onFilterChange={handleFilterChange} />

            {/* KPI Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                <KPICard title="Total Revenue" value={kpiData.totalRevenue.toFixed(2)} unit="$" icon={<DollarSign />} isLoading={isLoading} />
                <KPICard title="Finished Events" value={kpiData.eventCount} icon={<CheckSquare />} isLoading={isLoading} />
                <KPICard title="Avg. Revenue / Event" value={kpiData.avgRevenuePerEvent.toFixed(2)} unit="$" icon={<DollarSign />} isLoading={isLoading} />
                <KPICard title="Busiest Venue" value={kpiData.busiestVenue} icon={<MapPin />} isLoading={isLoading} />
            </div>

            {/* Executive Summary */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6 sm:mb-8">
                <div className="xl:col-span-2 relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-emerald-700 text-white shadow-xl">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_left,white,transparent_60%)] pointer-events-none"></div>
                    <div className="relative p-6 sm:p-8">
                        <div className="flex items-center gap-3 mb-3">
                            <Sparkles className="h-6 w-6 text-white/90" />
                            <h3 className="text-xl font-semibold tracking-tight">Executive Summary</h3>
                        </div>
                        <p className="text-sm sm:text-base text-emerald-50/90 leading-relaxed">
                            {premiumSummary}
                        </p>
                        {!isLoading && filteredEvents.length === 0 && (
                            <p className="mt-4 text-sm text-emerald-50/80">Try expanding the date range to populate the dashboard.</p>
                        )}
                        {summaryHighlights.length > 0 && (
                            <ul className="mt-5 space-y-2">
                                {summaryHighlights.map((item, index) => (
                                    <li key={`highlight-${index}`} className="flex items-start gap-2 text-sm text-emerald-50/95">
                                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-white/80 flex-shrink-0"></span>
                                        <span className="leading-snug">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4">
                    <InsightCard icon={<Trophy />} title="Premium Deals" headline={premiumDealsHeadline} subtext={premiumDealsSubtext} />
                    <InsightCard icon={<Award />} title="Top Client" headline={topClientHeadline} subtext={topClientSubtext} accent="amber" />
                    <InsightCard icon={<Users />} title="Client Loyalty" headline={loyaltyHeadline} subtext={loyaltySubtext} accent="indigo" />
                    <InsightCard icon={<Activity />} title="Revenue Momentum" headline={revenueMomentumHeadline} subtext={revenueMomentumSubtext} />
                </div>
            </div>

            {/* Ranked Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 sm:mb-8">
                <RankedListCard
                    title="Top Clients"
                    icon={<Users />}
                    items={topClientsList}
                    emptyMessage="No finished clients in this range yet."
                />
                <RankedListCard
                    title="Showcase Events"
                    icon={<Trophy />}
                    items={topEventsList}
                    emptyMessage="Record revenue to spotlight standout events."
                />
                <RankedListCard
                    title="Monthly Leaders"
                    icon={<Calendar />}
                    items={topMonthsList}
                    emptyMessage="Once events close each month, your leaderboard will appear."
                />
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
