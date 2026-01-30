import React, { useState, useEffect } from 'react';
import { CreditCard, ArrowLeft, Download, CheckCircle, Clock, AlertCircle, FileText, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { billingApi, invoicePdfApi } from '../services/api';
import { toast } from '../hooks/use-toast';
import ThemeToggle from './ThemeToggle';
import RefundRequestModal from './RefundRequestModal';

const BillingPayments = ({ userType, userId, onBack }) => {
  const { user } = useAuth();
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAppointment, setRefundAppointment] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    cardName: '',
    expiry: '',
    cvv: ''
  });

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await billingApi.getInvoices();
      setInvoices(response.data || []);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      toast({
        title: "Error",
        description: "Failed to load invoices",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    
    if (!selectedInvoice) return;

    try {
      setProcessing(true);
      
      // In a real app, you'd use Stripe Elements here
      // For now, we'll simulate a payment
      await billingApi.createPaymentIntent(selectedInvoice.amount);
      
      toast({
        title: "Payment Successful!",
        description: `Payment of $${selectedInvoice.amount} processed successfully. (DEMO MODE)`,
      });

      // Refresh invoices
      await fetchInvoices();

      setShowPaymentForm(false);
      setSelectedInvoice(null);
      setPaymentDetails({
        cardNumber: '',
        cardName: '',
        expiry: '',
        cvv: ''
      });
    } catch (err) {
      console.error('Payment error:', err);
      toast({
        title: "Payment Failed",
        description: err.response?.data?.detail || "Failed to process payment",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const handlePayNow = (invoice) => {
    setSelectedInvoice(invoice);
    setShowPaymentForm(true);
  };

  const handleDownloadPdf = async (invoice) => {
    const invoiceId = invoice._id || invoice.id;
    try {
      setDownloadingPdf(invoiceId);
      const response = await invoicePdfApi.downloadPdf(invoiceId);
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice_${invoiceId.slice(-8)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "PDF Downloaded",
        description: "Invoice PDF has been downloaded successfully."
      });
    } catch (err) {
      console.error('Error downloading PDF:', err);
      toast({
        title: "Download Failed",
        description: err.response?.data?.detail || "Failed to download invoice PDF. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDownloadingPdf(null);
    }
  };

  const handleRequestRefund = (invoice) => {
    // Create a mock appointment object from invoice data for refund request
    setRefundAppointment({
      _id: invoice.appointmentId || invoice._id,
      id: invoice.appointmentId || invoice.id,
      type: invoice.description,
      date: invoice.invoiceDate || invoice.date,
      time: '---',
      amount: invoice.amount
    });
    setShowRefundModal(true);
  };

  const totalPaid = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0);
  const totalPending = invoices.filter(inv => inv.status !== 'paid').reduce((sum, inv) => sum + inv.amount, 0);
  const totalOverdue = invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.amount, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Button variant="ghost" onClick={onBack} className="mb-4 dark:text-gray-300">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Billing & Payments</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Manage invoices and payment methods</p>
          </div>
          <ThemeToggle />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow duration-300 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Paid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">${totalPaid.toLocaleString()}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {invoices.filter(inv => inv.status === 'paid').length} paid invoices
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">${totalPending.toLocaleString()}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {invoices.filter(inv => inv.status === 'pending').length} pending invoices
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Overdue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">${totalOverdue.toLocaleString()}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {invoices.filter(inv => inv.status === 'overdue').length} overdue invoices
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Invoices List */}
          <Card className="lg:col-span-2 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-white">Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invoices.map((invoice) => (
                  <div key={invoice._id || invoice.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="font-semibold text-gray-900 dark:text-white">Invoice #{(invoice._id || invoice.id).slice(-8)}</div>
                          <Badge className={getStatusColor(invoice.status)}>
                            {getStatusIcon(invoice.status)}
                            <span className="ml-1 capitalize">{invoice.status}</span>
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">{invoice.description}</div>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                          <span>Date: {invoice.invoiceDate || invoice.date}</span>
                          <span>Due: {invoice.dueDate}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">${invoice.amount}</div>
                        <div className="mt-3 space-y-2">
                          {invoice.status !== 'paid' && userType === 'client' && (
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700 w-full"
                              onClick={() => handlePayNow(invoice)}
                            >
                              <CreditCard className="h-4 w-4 mr-2" />
                              Pay Now
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="w-full dark:border-gray-600 dark:text-gray-300"
                            onClick={() => handleDownloadPdf(invoice)}
                            disabled={downloadingPdf === (invoice._id || invoice.id)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            {downloadingPdf === (invoice._id || invoice.id) ? 'Downloading...' : 'Download PDF'}
                          </Button>
                          {invoice.status === 'paid' && userType === 'client' && invoice.appointmentId && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="w-full text-orange-600 border-orange-300 hover:bg-orange-50 dark:border-orange-800 dark:hover:bg-orange-900/20"
                              onClick={() => handleRequestRefund(invoice)}
                            >
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Request Refund
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {invoices.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No invoices found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Form or Info */}
          <div className="lg:col-span-1">
            {showPaymentForm && selectedInvoice ? (
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="dark:text-white">Payment Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePayment} className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg mb-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Amount to Pay</div>
                      <div className="text-2xl font-bold text-blue-900 dark:text-blue-200">${selectedInvoice.amount}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{selectedInvoice.description}</div>
                    </div>

                    <div className="bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-lg mb-4">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        <strong>DEMO MODE:</strong> This is a simulated payment. No actual charges will be made.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Card Number
                      </label>
                      <Input
                        type="text"
                        placeholder="4242 4242 4242 4242"
                        value={paymentDetails.cardNumber}
                        onChange={(e) => setPaymentDetails({ ...paymentDetails, cardNumber: e.target.value })}
                        maxLength="19"
                        required
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Cardholder Name
                      </label>
                      <Input
                        type="text"
                        placeholder="John Doe"
                        value={paymentDetails.cardName}
                        onChange={(e) => setPaymentDetails({ ...paymentDetails, cardName: e.target.value })}
                        required
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Expiry Date
                        </label>
                        <Input
                          type="text"
                          placeholder="MM/YY"
                          value={paymentDetails.expiry}
                          onChange={(e) => setPaymentDetails({ ...paymentDetails, expiry: e.target.value })}
                          maxLength="5"
                          required
                          className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          CVV
                        </label>
                        <Input
                          type="text"
                          placeholder="123"
                          value={paymentDetails.cvv}
                          onChange={(e) => setPaymentDetails({ ...paymentDetails, cvv: e.target.value })}
                          maxLength="4"
                          required
                          className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Powered by Stripe - Secure Payment</span>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-green-600 hover:bg-green-700 text-lg py-6"
                      disabled={processing}
                    >
                      <CreditCard className="h-5 w-5 mr-2" />
                      {processing ? 'Processing...' : `Pay $${selectedInvoice.amount}`}
                    </Button>

                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full dark:border-gray-600 dark:text-gray-300"
                      onClick={() => {
                        setShowPaymentForm(false);
                        setSelectedInvoice(null);
                      }}
                    >
                      Cancel
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="dark:text-white">Payment Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <CreditCard className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-blue-900 dark:text-blue-200">Secure Payments</div>
                        <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                          All payments are processed securely through Stripe with bank-level encryption.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-green-900 dark:text-green-200">HIPAA Compliant</div>
                        <div className="text-xs text-green-700 dark:text-green-300 mt-1">
                          Your payment information is stored securely and never shared.
                        </div>
                      </div>
                    </div>
                  </div>

                  {userType === 'client' && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Payment Methods</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        • Credit/Debit Cards (Visa, Mastercard, Amex)
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        • Insurance claims processed separately
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        • Receipts emailed automatically
                      </div>
                    </div>
                  )}

                  {userType === 'provider' && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Billing Settings</div>
                      <Button variant="outline" className="w-full dark:border-gray-600 dark:text-gray-300">Configure Auto-Billing</Button>
                      <Button variant="outline" className="w-full dark:border-gray-600 dark:text-gray-300">Manage Payment Methods</Button>
                      <Button variant="outline" className="w-full dark:border-gray-600 dark:text-gray-300">View Payout Schedule</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Refund Request Modal */}
      {showRefundModal && refundAppointment && (
        <RefundRequestModal
          appointment={refundAppointment}
          onClose={() => {
            setShowRefundModal(false);
            setRefundAppointment(null);
          }}
          onSuccess={() => {
            fetchInvoices();
          }}
        />
      )}
    </div>
  );
};

export default BillingPayments;
