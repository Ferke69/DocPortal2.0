import React, { useState } from 'react';
import { CreditCard, ArrowLeft, Download, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { mockInvoices, mockClients, mockProviders } from '../mockData';
import { toast } from '../hooks/use-toast';

const BillingPayments = ({ userType, userId, onBack }) => {
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    cardName: '',
    expiry: '',
    cvv: ''
  });

  const userInvoices = userType === 'client' 
    ? mockInvoices.filter(inv => inv.clientId === userId)
    : mockInvoices.filter(inv => inv.providerId === userId);

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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

  const handlePayment = (e) => {
    e.preventDefault();
    
    // Simulate Stripe payment processing
    toast({
      title: "Payment Successful!",
      description: `Payment of $${selectedInvoice.amount} processed successfully.`,
    });

    setShowPaymentForm(false);
    setSelectedInvoice(null);
    setPaymentDetails({
      cardNumber: '',
      cardName: '',
      expiry: '',
      cvv: ''
    });
  };

  const handlePayNow = (invoice) => {
    setSelectedInvoice(invoice);
    setShowPaymentForm(true);
  };

  const totalPaid = userInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0);
  const totalPending = userInvoices.filter(inv => inv.status !== 'paid').reduce((sum, inv) => sum + inv.amount, 0);
  const totalOverdue = userInvoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Billing & Payments</h1>
          <p className="text-gray-600 mt-1">Manage invoices and payment methods</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Paid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">${totalPaid.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-2">
                {userInvoices.filter(inv => inv.status === 'paid').length} paid invoices
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">${totalPending.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-2">
                {userInvoices.filter(inv => inv.status === 'pending').length} pending invoices
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Overdue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">${totalOverdue.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-2">
                {userInvoices.filter(inv => inv.status === 'overdue').length} overdue invoices
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Invoices List */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userInvoices.map((invoice) => {
                  const otherUser = userType === 'client'
                    ? mockProviders.find(p => p.id === invoice.providerId)
                    : mockClients.find(c => c.id === invoice.clientId);

                  return (
                    <div key={invoice.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="font-semibold text-gray-900">Invoice #{invoice.id}</div>
                            <Badge className={getStatusColor(invoice.status)}>
                              {getStatusIcon(invoice.status)}
                              <span className="ml-1 capitalize">{invoice.status}</span>
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 mb-1">{invoice.description}</div>
                          <div className="text-sm text-gray-500">
                            {userType === 'client' ? otherUser?.name : `Client: ${otherUser?.name}`}
                          </div>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <span>Date: {invoice.date}</span>
                            <span>Due: {invoice.dueDate}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">${invoice.amount}</div>
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
                            <Button size="sm" variant="outline" className="w-full">
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {userInvoices.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No invoices found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Form or Info */}
          <div className="lg:col-span-1">
            {showPaymentForm && selectedInvoice ? (
              <Card>
                <CardHeader>
                  <CardTitle>Payment Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePayment} className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg mb-4">
                      <div className="text-sm text-gray-600">Amount to Pay</div>
                      <div className="text-2xl font-bold text-blue-900">${selectedInvoice.amount}</div>
                      <div className="text-sm text-gray-600 mt-1">{selectedInvoice.description}</div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Card Number
                      </label>
                      <Input
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        value={paymentDetails.cardNumber}
                        onChange={(e) => setPaymentDetails({ ...paymentDetails, cardNumber: e.target.value })}
                        maxLength="19"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cardholder Name
                      </label>
                      <Input
                        type="text"
                        placeholder="John Doe"
                        value={paymentDetails.cardName}
                        onChange={(e) => setPaymentDetails({ ...paymentDetails, cardName: e.target.value })}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Expiry Date
                        </label>
                        <Input
                          type="text"
                          placeholder="MM/YY"
                          value={paymentDetails.expiry}
                          onChange={(e) => setPaymentDetails({ ...paymentDetails, expiry: e.target.value })}
                          maxLength="5"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          CVV
                        </label>
                        <Input
                          type="text"
                          placeholder="123"
                          value={paymentDetails.cvv}
                          onChange={(e) => setPaymentDetails({ ...paymentDetails, cvv: e.target.value })}
                          maxLength="4"
                          required
                        />
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Powered by Stripe - Secure Payment</span>
                      </div>
                    </div>

                    <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-lg py-6">
                      <CreditCard className="h-5 w-5 mr-2" />
                      Pay ${selectedInvoice.amount}
                    </Button>

                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full"
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
              <Card>
                <CardHeader>
                  <CardTitle>Payment Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <CreditCard className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-blue-900">Secure Payments</div>
                        <div className="text-xs text-blue-700 mt-1">
                          All payments are processed securely through Stripe with bank-level encryption.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-green-900">HIPAA Compliant</div>
                        <div className="text-xs text-green-700 mt-1">
                          Your payment information is stored securely and never shared.
                        </div>
                      </div>
                    </div>
                  </div>

                  {userType === 'client' && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-700">Payment Methods</div>
                      <div className="text-sm text-gray-600">
                        • Credit/Debit Cards (Visa, Mastercard, Amex)
                      </div>
                      <div className="text-sm text-gray-600">
                        • Insurance claims processed separately
                      </div>
                      <div className="text-sm text-gray-600">
                        • Receipts emailed automatically
                      </div>
                    </div>
                  )}

                  {userType === 'provider' && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-700">Billing Settings</div>
                      <Button variant="outline" className="w-full">Configure Auto-Billing</Button>
                      <Button variant="outline" className="w-full">Manage Payment Methods</Button>
                      <Button variant="outline" className="w-full">View Payout Schedule</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingPayments;
