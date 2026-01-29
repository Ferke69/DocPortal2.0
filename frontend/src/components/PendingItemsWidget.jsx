import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, Video, ShoppingCart, X, Filter, ArrowUpDown,
  CheckCircle, XCircle, Clock, ChevronRight, AlertTriangle, 
  DollarSign, MoreHorizontal, Check, Ban
} from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { pendingItemsApi } from '../services/api';
import { useCurrency } from './CurrencySelector';

const PendingItemsWidget = () => {
  const [summary, setSummary] = useState({
    videoSessionsCount: 0,
    ordersCount: 0,
    totalPending: 0,
    highUrgencyCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      setLoading(false);
      const res = await pendingItemsApi.getSummary();
      setSummary(res.data);
    } catch (err) {
      console.error('Error fetching pending items summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleWidgetClick = () => {
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    fetchSummary(); // Refresh summary when modal closes
  };

  return (
    <>
      <Card 
        className="dark:bg-gray-800 dark:border-gray-700 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] group"
        onClick={handleWidgetClick}
        data-testid="pending-items-widget"
      >
        <CardContent className="p-3 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Pending Items</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {loading ? '...' : summary.totalPending}
                </p>
                {summary.highUrgencyCount > 0 && (
                  <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs">
                    {summary.highUrgencyCount} urgent
                  </Badge>
                )}
              </div>
              <div className="flex gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Video className="h-3 w-3" />
                  {summary.videoSessionsCount} sessions
                </span>
                <span className="flex items-center gap-1">
                  <ShoppingCart className="h-3 w-3" />
                  {summary.ordersCount} orders
                </span>
              </div>
            </div>
            <div className="h-8 w-8 sm:h-12 sm:w-12 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center group-hover:bg-amber-200 dark:group-hover:bg-amber-900/50 transition-colors">
              <ClipboardList className="h-4 w-4 sm:h-6 sm:w-6 text-amber-600" />
            </div>
          </div>
          <div className="flex items-center justify-end mt-2 text-xs text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
            <span>View details</span>
            <ChevronRight className="h-3 w-3 ml-1" />
          </div>
        </CardContent>
      </Card>

      {showModal && (
        <PendingItemsModal onClose={handleModalClose} />
      )}
    </>
  );
};

const PendingItemsModal = ({ onClose }) => {
  const { symbol: currencySymbol } = useCurrency();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchItems();
  }, [statusFilter, typeFilter, sortBy, sortOrder]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const params = {
        sortBy,
        sortOrder
      };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.type = typeFilter;
      
      const res = await pendingItemsApi.getAll(params);
      setItems(res.data);
    } catch (err) {
      console.error('Error fetching pending items:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async (id) => {
    setActionLoading(id);
    try {
      await pendingItemsApi.markPaid(id);
      await fetchItems();
    } catch (err) {
      console.error('Error marking item as paid:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkUnpaid = async (id) => {
    setActionLoading(id);
    try {
      await pendingItemsApi.markUnpaid(id);
      await fetchItems();
    } catch (err) {
      console.error('Error marking item as unpaid:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id) => {
    setActionLoading(id);
    try {
      await pendingItemsApi.delete(id);
      await fetchItems();
    } catch (err) {
      console.error('Error deleting item:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Open</Badge>;
      case 'paid':
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Paid</Badge>;
      case 'unpaid':
        return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Unpaid</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getUrgencyIndicator = (urgency) => {
    switch (urgency) {
      case 'high':
        return (
          <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs font-medium">High</span>
          </div>
        );
      case 'medium':
        return (
          <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-medium">Medium</span>
          </div>
        );
      case 'low':
        return (
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
            <Clock className="h-4 w-4" />
            <span className="text-xs">Low</span>
          </div>
        );
      default:
        return null;
    }
  };

  const getTypeIcon = (type) => {
    return type === 'video_session' ? (
      <Video className="h-4 w-4 text-purple-600" />
    ) : (
      <ShoppingCart className="h-4 w-4 text-blue-600" />
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Calculate status counts
  const openCount = items.filter(i => i.status === 'open').length;
  const paidCount = items.filter(i => i.status === 'paid').length;
  const unpaidCount = items.filter(i => i.status === 'unpaid').length;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      data-testid="pending-items-modal"
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-amber-600" />
                Pending Items Management
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Track and manage video sessions and orders
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              data-testid="close-modal-btn"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Status Summary Cards */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <button
              onClick={() => setStatusFilter(statusFilter === 'open' ? 'all' : 'open')}
              className={`p-3 rounded-lg border transition-all ${
                statusFilter === 'open' 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">Open</span>
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-xl font-bold text-blue-600 mt-1">{openCount}</p>
            </button>
            <button
              onClick={() => setStatusFilter(statusFilter === 'paid' ? 'all' : 'paid')}
              className={`p-3 rounded-lg border transition-all ${
                statusFilter === 'paid' 
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-green-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">Paid</span>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <p className="text-xl font-bold text-green-600 mt-1">{paidCount}</p>
            </button>
            <button
              onClick={() => setStatusFilter(statusFilter === 'unpaid' ? 'all' : 'unpaid')}
              className={`p-3 rounded-lg border transition-all ${
                statusFilter === 'unpaid' 
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-red-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">Unpaid</span>
                <XCircle className="h-4 w-4 text-red-600" />
              </div>
              <p className="text-xl font-bold text-red-600 mt-1">{unpaidCount}</p>
            </button>
          </div>
        </div>

        {/* Filters & Sort */}
        <div className="px-4 sm:px-6 py-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex flex-wrap items-center gap-3">
            {/* Type Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="text-sm bg-gray-100 dark:bg-gray-700 border-0 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500"
                data-testid="type-filter"
              >
                <option value="all">All Types</option>
                <option value="video_session">Video Sessions</option>
                <option value="order">Orders</option>
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2 ml-auto">
              <ArrowUpDown className="h-4 w-4 text-gray-500" />
              <button
                onClick={() => toggleSort('createdAt')}
                className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                  sortBy === 'createdAt' 
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                data-testid="sort-by-date"
              >
                Date {sortBy === 'createdAt' && (sortOrder === 'desc' ? '↓' : '↑')}
              </button>
              <button
                onClick={() => toggleSort('status')}
                className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                  sortBy === 'status' 
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                data-testid="sort-by-status"
              >
                Status {sortBy === 'status' && (sortOrder === 'desc' ? '↓' : '↑')}
              </button>
              <button
                onClick={() => toggleSort('amount')}
                className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                  sortBy === 'amount' 
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                data-testid="sort-by-amount"
              >
                Amount {sortBy === 'amount' && (sortOrder === 'desc' ? '↓' : '↑')}
              </button>
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No pending items</h3>
              <p className="text-gray-500 dark:text-gray-400">
                {statusFilter !== 'all' || typeFilter !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'All caught up! No items require attention.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div 
                  key={item.id}
                  className={`p-4 rounded-lg border transition-all hover:shadow-md ${
                    item.urgency === 'high' 
                      ? 'border-l-4 border-l-red-500 border-gray-200 dark:border-gray-700 bg-red-50/30 dark:bg-red-900/10' 
                      : item.urgency === 'medium'
                        ? 'border-l-4 border-l-amber-500 border-gray-200 dark:border-gray-700'
                        : 'border-gray-200 dark:border-gray-700'
                  }`}
                  data-testid={`pending-item-${item.id}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        {getTypeIcon(item.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium text-gray-900 dark:text-white truncate">
                            {item.title}
                          </h4>
                          {getStatusBadge(item.status)}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {item.clientName} • {formatDate(item.createdAt)}
                        </p>
                        {item.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-1">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0">
                      {getUrgencyIndicator(item.urgency)}
                      
                      {item.amount > 0 && (
                        <div className="text-right">
                          <p className="font-bold text-gray-900 dark:text-white">
                            {currencySymbol}{item.amount.toFixed(2)}
                          </p>
                        </div>
                      )}

                      {/* Quick Actions */}
                      <div className="flex items-center gap-1">
                        {item.status !== 'paid' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMarkPaid(item.id)}
                            disabled={actionLoading === item.id}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                            title="Mark as Paid"
                            data-testid={`mark-paid-${item.id}`}
                          >
                            {actionLoading === item.id ? (
                              <div className="h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        {item.status === 'paid' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMarkUnpaid(item.id)}
                            disabled={actionLoading === item.id}
                            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                            title="Mark as Unpaid"
                            data-testid={`mark-unpaid-${item.id}`}
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(item.id)}
                          disabled={actionLoading === item.id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          title="Delete"
                          data-testid={`delete-item-${item.id}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {items.length} item{items.length !== 1 ? 's' : ''}
            </p>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingItemsWidget;
