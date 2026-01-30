import React, { useState } from 'react';
import { RotateCcw, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { refundsApi } from '../services/api';
import { toast } from '../hooks/use-toast';

const RefundRequestModal = ({ appointment, onClose, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (reason.trim().length < 10) {
      toast({
        title: "Reason required",
        description: "Please provide a detailed reason (at least 10 characters).",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmitting(true);
      await refundsApi.requestRefund(appointment._id || appointment.id, reason.trim());
      setSuccess(true);
      toast({
        title: "Refund Requested",
        description: "Your refund request has been submitted for review."
      });
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error requesting refund:', err);
      toast({
        title: "Request Failed",
        description: err.response?.data?.detail || "Failed to submit refund request.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 text-center">
          <div className="h-16 w-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Request Submitted</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Your provider will review your refund request and respond shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
              <RotateCcw className="h-5 w-5 mr-2 text-orange-600" />
              Request Refund
            </h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Appointment Details */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Appointment Details</h3>
            <p className="font-semibold text-gray-900 dark:text-white">{appointment.type}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {appointment.date} at {appointment.time}
            </p>
            <p className="text-lg font-bold text-gray-900 dark:text-white mt-2">
              €{appointment.amount?.toFixed(2)}
            </p>
          </div>

          {/* Warning */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Important</p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Refunds are only available for appointments at least 3 days in the future. 
                  Your provider will review your request and may approve or deny it.
                </p>
              </div>
            </div>
          </div>

          {/* Reason Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reason for Refund <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please explain why you need to cancel and request a refund..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              rows={4}
              required
              minLength={10}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {reason.length}/10 characters minimum
            </p>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 dark:border-gray-600 dark:text-gray-300"
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-orange-600 hover:bg-orange-700"
              disabled={submitting || reason.trim().length < 10}
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RefundRequestModal;
