import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart2, DollarSign, CheckSquare, MapPin } from 'lucide-react';
import TabHeader from './TabHeader';

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

const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_NAMES_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function getFormattedMonthYear(key) {
    if (!key) return '';
    const [year, month] = key.split('-');
    const monthIndex = parseInt(month, 10) - 1;
    const monthName = MONTH_NAMES_FULL[monthIndex] || MONTH_NAMES_FULL[0];
    return `${monthName} ${year}`;
}

const KPICard = ({ title, value, icon }) => (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
        <div className="flex items-center text-gray-500 mb-2">
            {icon && React.cloneElement(icon, { size: 18, className: 'mr-2 text-emerald-600' })}
            <span className="text-xs font-medium uppercase tracking-wide">{title}</span>
        </div>
        <p className="text-3xl font-semibold text-gray-800 leading-tight">{value}</p>
    </div>
);

const DateRangeFilter = ({ onFilterChange }) => {
    const [preset, setPreset] = useState('last90days');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [showCustom, setShowCustom] = useState(false);

    const calculateDateRange = (selectedPreset, start, end) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let startDate = new Date(today);
        let endDate = new Date(today);
        endDate.setHours(23, 59, 59, 999);

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
                startDate = null;
                endDate = null;
                break;
            case 'custom':
                if (start) {
                    startDate = new Date(start);
                    startDate.setHours(0, 0, 0, 0);
                } else {
                    startDate = null;
                }
                if (end) {
                    endDate = new Date(end);
                    endDate.setHours(23, 59, 59, 999);
                } else {
                    endDate = null;
                }
                break;
            default:
                startDate.setDate(today.getDate() - 90);
        }

        return { startDate, endDate };
    };

    useEffect(() => {
        const { startDate, endDate } = calculateDateRange(preset, customStart, customEnd);
        onFilterChange({ startDate, endDate, preset });
    }, [preset, customStart, customEnd, onFilterChange]);

    const commonButtonClasses = 'px-3 py-1.5 text-xs rounded-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1';
    const activeButtonClasses = 'bg-emerald-600 text-white focus:ring-emerald-500';
    const inactiveButtonClasses = 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-emerald-400';

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-sm font-medium text-gray-600 mr-2">Date Range:</span>
                {['last30days', 'last90days', 'thisMonth', 'lastMonth', 'thisYear', 'allTime'].map((option) => (
                    <button
                        key={option}
                        type="button"
                        onClick={() => {
                            setPreset(option);
                            if (option !== 'custom') {
                                setShowCustom(false);
                                setCustomStart('');
                                setCustomEnd('');
                            }
                        }}
                        className={`${commonButtonClasses} ${preset === option ? activeButtonClasses : inactiveButtonClasses}`}
                    >
                        {option.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                    </button>
                ))}
                <button
                    type="button"
                    onClick={() => {
                        setShowCustom((prev) => !prev);
                        if (preset !== 'custom') {
                            setPreset('custom');
                        }
                    }}
                    className={`${commonButtonClasses} ${preset === 'custom' ? activeButtonClasses : inactiveButtonClasses}`}
                >
                    Custom
                </button>
            </div>
            {showCustom && preset === 'custom' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-200">
                    <div>
                        <label htmlFor="customStartDate" className="block text-xs font-medium text-gray-500 mb-1">
                            Start Date
                        </label>
                        <input
                            type="date"
                            id="customStartDate"
                            value={customStart}
                            onChange={(event) => setCustomStart(event.target.value)}
                            className="w-full text-sm border-gray-300 rounded-md shadow-sm p-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="customEndDate" className="block text-xs font-medium text-gray-500 mb-1">
                            End Date
                        </label>
                        <input
                            type="date"
                            id="customEndDate"
                            value={customEnd}
                            onChange={(event) => setCustomEnd(event.target.value)}
                            className="w-full text-sm border-gray-300 rounded-md shadow-sm p-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

const MonthlyRevenueChart = ({ data }) => {
    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center text-center text-gray-500 py-10">
                <BarChart2 size={32} className="mb-3 text-gray-400" />
                <p>No monthly revenue available for the selected range.</p>
            </div>
        );
    }

    const maxValue = Math.max(...data.map((item) => item.value), 0);

    return (
        <div className="flex flex-col h-full">
            <h4 className="text-lg font-semibold text-gray-700 mb-4">Monthly Revenue</h4>
            <div className="flex-1 flex items-end gap-3 sm:gap-4">
                {data.map((item) => {
                    const barHeight = maxValue ? (item.value / maxValue) * 100 : 0;
                    return (
                        <div key={item.monthYear || item.label} className="flex-1 flex flex-col items-center">
                            <div className="w-full h-48 bg-emerald-50 rounded-lg flex items-end justify-center overflow-hidden">
                                <div
                                    className="w-3/4 bg-emerald-500 rounded-t-lg transition-all duration-300"
                                    style={{ height: `${barHeight}%` }}
                                />
                            </div>
                            <span className="mt-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">{item.label}</span>
                            <span className="text-[11px] text-gray-400">{formatCurrency(item.value, { maximumFractionDigits: 0 })}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const InsightsList = ({ items }) => (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 h-full">
        <h4 className="text-lg font-semibold text-gray-700 mb-4">Insights</h4>
        {items.length === 0 ? (
            <p className="text-sm text-gray-500">No insights available for this range yet.</p>
        ) : (
            <ul className="space-y-4">
                {items.map((item) => (
                    <li key={item.label} className="border border-gray-100 rounded-lg p-3 bg-gray-50">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{item.label}</p>
                        <p className="text-base font-semibold text-gray-800 mt-1">{item.value}</p>
                        {item.description && <p className="text-sm text-gray-500 mt-1">{item.description}</p>}
                    </li>
                ))}
            </ul>
        )}
    </div>
);

function StatisticsDashboard({ events = [] }) {
    const [dateFilter, setDateFilter] = useState({ startDate: null, endDate: null, preset: 'last90days' });

    const handleFilterChange = useCallback((newFilter) => {
        setDateFilter(newFilter);
    }, []);

    const finishedEvents = useMemo(
        () => events.filter((event) => event.status === 'finished' && event.eventDate),
        [events]
    );

    const filteredEvents = useMemo(() => {
        if (finishedEvents.length === 0) {
            return [];
        }

        return finishedEvents.filter((event) => {
            const eventDate = new Date(event.eventDate);
            if (Number.isNaN(eventDate.getTime())) {
                return false;
            }

            eventDate.setHours(0, 0, 0, 0);

            if (dateFilter.startDate) {
                const start = new Date(dateFilter.startDate);
                start.setHours(0, 0, 0, 0);
                if (eventDate < start) {
                    return false;
                }
            }

            if (dateFilter.endDate) {
                const end = new Date(dateFilter.endDate);
                end.setHours(23, 59, 59, 999);
                if (eventDate > end) {
                    return false;
                }
            }

            return true;
        });
    }, [finishedEvents, dateFilter]);

    const kpis = useMemo(() => {
        if (filteredEvents.length === 0) {
            return {
                totalRevenue: formatCurrency(0),
                finishedEvents: '0',
                averageRevenue: formatCurrency(0),
                busiestVenue: '—',
            };
        }

        const totalRevenueValue = filteredEvents.reduce(
            (sum, event) => sum + (parseFloat(event.grandTotal) || 0),
            0
        );
        const finishedEventsCount = filteredEvents.length;
        const averageRevenueValue = finishedEventsCount > 0 ? totalRevenueValue / finishedEventsCount : 0;

        const venueUsage = filteredEvents.reduce((acc, event) => {
            const venue = event.buildingArea || 'Unknown';
            acc[venue] = (acc[venue] || 0) + 1;
            return acc;
        }, {});

        const busiestVenue = Object.entries(venueUsage).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

        return {
            totalRevenue: formatCurrency(totalRevenueValue, { maximumFractionDigits: 0 }),
            finishedEvents: finishedEventsCount.toString(),
            averageRevenue: formatCurrency(averageRevenueValue, { maximumFractionDigits: 0 }),
            busiestVenue,
        };
    }, [filteredEvents]);

    const monthlyStats = useMemo(() => {
        if (filteredEvents.length === 0) {
            return [];
        }

        const grouped = filteredEvents.reduce((acc, event) => {
            const eventDate = new Date(event.eventDate);
            if (Number.isNaN(eventDate.getTime())) {
                return acc;
            }

            const key = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}`;
            const revenue = parseFloat(event.grandTotal) || 0;

            if (!acc[key]) {
                acc[key] = { monthYear: key, totalRevenue: 0, count: 0 };
            }

            acc[key].totalRevenue += revenue;
            acc[key].count += 1;
            return acc;
        }, {});

        return Object.values(grouped).sort((a, b) => a.monthYear.localeCompare(b.monthYear));
    }, [filteredEvents]);

    const monthlyRevenueChartData = useMemo(
        () =>
            monthlyStats.map((stat) => {
                const [year, month] = stat.monthYear.split('-');
                const label = `${MONTH_NAMES_SHORT[parseInt(month, 10) - 1]} ${year.slice(-2)}`;
                return { label, value: stat.totalRevenue, monthYear: stat.monthYear };
            }),
        [monthlyStats]
    );

    const busiestMonth = useMemo(() => {
        if (monthlyStats.length === 0) {
            return null;
        }

        return monthlyStats.reduce((top, current) => {
            if (!top) {
                return current;
            }

            if (current.count > top.count) {
                return current;
            }

            if (current.count === top.count && current.totalRevenue > top.totalRevenue) {
                return current;
            }

            return top;
        }, null);
    }, [monthlyStats]);

    const highestGrossingEvent = useMemo(() => {
        if (filteredEvents.length === 0) {
            return null;
        }

        return filteredEvents.reduce((top, event) => {
            const revenue = parseFloat(event.grandTotal) || 0;
            if (!top || revenue > top.revenue) {
                return {
                    revenue,
                    name: event.eventName || 'Untitled Event',
                    client: event.clientName,
                    date: event.eventDate,
                };
            }
            return top;
        }, null);
    }, [filteredEvents]);

    const insights = useMemo(() => {
        const items = [];

        if (busiestMonth) {
            items.push({
                label: 'Busiest month in range',
                value: getFormattedMonthYear(busiestMonth.monthYear),
                description: `${busiestMonth.count} event${busiestMonth.count === 1 ? '' : 's'} • ${formatCurrency(busiestMonth.totalRevenue, { maximumFractionDigits: 0 })}`,
            });
        }

        if (highestGrossingEvent && highestGrossingEvent.revenue > 0) {
            const monthKey = highestGrossingEvent.date ? highestGrossingEvent.date.substring(0, 7) : null;
            const when = monthKey ? getFormattedMonthYear(monthKey) : null;
            items.push({
                label: 'Highest-grossing event',
                value: highestGrossingEvent.name,
                description: `${formatCurrency(highestGrossingEvent.revenue, { maximumFractionDigits: 0 })}${when ? ` • ${when}` : ''}`,
            });
        }

        return items;
    }, [busiestMonth, highestGrossingEvent]);

    return (
        <div className="p-4 sm:p-6 bg-slate-50 min-h-screen">
            <TabHeader icon={<BarChart2 className="h-7 w-7 text-emerald-600" />} title="Event Insights" />

            <DateRangeFilter onFilterChange={handleFilterChange} />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
                <KPICard title="Total Revenue" value={kpis.totalRevenue} icon={<DollarSign />} />
                <KPICard title="Finished Events" value={kpis.finishedEvents} icon={<CheckSquare />} />
                <KPICard title="Avg. Revenue / Event" value={kpis.averageRevenue} icon={<DollarSign />} />
                <KPICard title="Busiest Venue" value={kpis.busiestVenue} icon={<MapPin />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-5 rounded-xl shadow-sm border border-gray-200 min-h-[320px]">
                    <MonthlyRevenueChart data={monthlyRevenueChartData} />
                </div>
                <InsightsList items={insights} />
            </div>
        </div>
    );
}

export default StatisticsDashboard;
