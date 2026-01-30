import React, { useState, useEffect } from 'react';
import { RotateCcw, Check, X, AlertCircle, Clock, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { refundsApi } from '../services/api';
import { toast } from '../hooks/use-toast';
import { useCurrency } from './CurrencySelector';

const RefundManagement = ({ showHeader = true }) => {
  const [loading, setLoading] = useState(true);
  const [pendingRefunds, setPendingRefunds] = useState([]);
  const [allRefunds, setAllRefunds] = useState([]);
  const [processing, setProcessing] = useState(null);
  const [responseText, setResponseText] = useState({});
  const [activeTab, setActiveTab] = useState('pending');
  const { symbol: currencySymbol } = useCurrency();

  useEffect(() => {
    fetchRefunds();
  }, []);

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      const [pendingRes, allRes] = await Promise.all([
        refundsApi.getPendingRefunds(),
        refundsApi.getMyRequests()
      ]);
      setPendingRefunds(pendingRes.data || []);
      setAllRefunds(allRes.data || []);
    } catch (err) {
      console.error('Error fetching refunds:', err);
      toast({
        title: "Error",
        description: "Failed to load refund requests.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRefund = async (refundId, approved) => {
    try {
      setProcessing(refundId);
      await refundsApi.processRefund(refundId, approved, responseText[refundId] || '');
      toast({
        title: approved ? "Refund Approved" : "Refund Rejected",
        description: approved 
          ? "The refund has been processed and the appointment cancelled."
          : "The refund request has been rejected."
      });
      await fetchRefunds();
    } catch (err) {
      console.error('Error processing refund:', err);
      toast({
        title: "Error",
        description: err.response?.data?.detail || "Failed to process refund.",
        variant: "destructive"
      });
    } finally {
      setProcessing(null);
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showHeader && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Refund Requests</h2>
          <p className="text-gray-600 dark:text-gray-400">Review and process patient refund requests</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'pending'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          Pending ({pendingRefunds.length})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'all'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          All Requests ({allRefunds.length})
        </button>
      </div>

      {/* Pending Refunds */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingRefunds.length === 0 ? (
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="py-12 text-center">
                <RotateCcw className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Pending Refunds</h3>
                <p className="text-gray-500 dark:text-gray-400">All refund requests have been processed.</p>
              </CardContent>
            </Card>
          ) : (
            pendingRefunds.map((refund) => (
              <Card key={refund.appointmentId} className="dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    {/* Patient & Appointment Info */}
                    <div className="flex items-start space-x-4 flex-1">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>{getInitials(refund.clientName)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{refund.clientName}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{refund.clientEmail}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                            {refund.appointmentDate} at {refund.appointmentTime}
                          </span>
                          <span className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                            {refund.appointmentType}
                          </span>
                        </div>
                        
                        {/* Refund Reason */}
                        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">Patient&apos;s Reason:</p>
                          <p className="text-sm text-yellow-700 dark:text-yellow-300">{refund.reason}</p>
                        </div>

                        {/* Response Input */}
                        <div className="mt-4">
                          <label className="text-sm text-gray-600 dark:text-gray-400 block mb-1">
                            Your response (optional):
                          </label>
                          <textarea
                            value={responseText[refund.appointmentId] || ''}
                            onChange={(e) => setResponseText(prev => ({
                              ...prev,
                              [refund.appointmentId]: e.target.value
                            }))}
                            placeholder="Add a note for the patient..."
                            className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Amount & Actions */}
                    <div className="flex flex-col items-end space-y-3">
                      <div className="text-right">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Refund Amount</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {currencySymbol}{refund.amount?.toFixed(2)}
                        </p>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => handleProcessRefund(refund.appointmentId, false)}
                          disabled={processing === refund.appointmentId}
                          className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                        <Button
                          onClick={() => handleProcessRefund(refund.appointmentId, true)}
                          disabled={processing === refund.appointmentId}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          {processing === refund.appointmentId ? 'Processing...' : 'Approve Refund'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* All Refunds History */}
      {activeTab === 'all' && (
        <div className="space-y-4">
          {allRefunds.length === 0 ? (
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="py-12 text-center">
                <DollarSign className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Refund History</h3>
                <p className="text-gray-500 dark:text-gray-400">No refund requests have been made yet.</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Refund History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {allRefunds.map((refund, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-full ${
                          refund.status === 'approved' 
                            ? 'bg-green-100 dark:bg-green-900/30' 
                            : refund.status === 'rejected'
                            ? 'bg-red-100 dark:bg-red-900/30'
                            : 'bg-yellow-100 dark:bg-yellow-900/30'
                        }`}>
                          {refund.status === 'approved' ? (
                            <Check className="h-5 w-5 text-green-600" />
                          ) : refund.status === 'rejected' ? (
                            <X className="h-5 w-5 text-red-600" />
                          ) : (
                            <Clock className="h-5 w-5 text-yellow-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {currencySymbol}{refund.amount?.toFixed(2)} Refund
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(refund.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(refund.status)}
                        {refund.providerResponse && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs truncate">
                            {refund.providerResponse}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2 flex items-center">
          <AlertCircle className="h-4 w-4 mr-2" />
          Refund Policy
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
          <li>• Patients can only request refunds for appointments 3+ days in the future</li>
          <li>• Approved refunds are processed as full refunds via Stripe</li>
          <li>• The appointment is automatically cancelled upon refund approval</li>
          <li>• Rejected requests preserve the original appointment</li>
        </ul>
      </div>
    </div>
  );
};

export default RefundManagement;
