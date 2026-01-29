import React, { useState, useEffect } from 'react';
import { Clock, Save, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { providerApi } from '../services/api';
import { toast } from '../hooks/use-toast';

const ScheduleSettings = ({ onBack }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schedule, setSchedule] = useState({
    monday: { enabled: true, startTime: '09:00', endTime: '17:00', breakStart: '', breakEnd: '' },
    tuesday: { enabled: true, startTime: '09:00', endTime: '17:00', breakStart: '', breakEnd: '' },
    wednesday: { enabled: true, startTime: '09:00', endTime: '17:00', breakStart: '', breakEnd: '' },
    thursday: { enabled: true, startTime: '09:00', endTime: '17:00', breakStart: '', breakEnd: '' },
    friday: { enabled: true, startTime: '09:00', endTime: '17:00', breakStart: '', breakEnd: '' },
    saturday: { enabled: false, startTime: '09:00', endTime: '17:00', breakStart: '', breakEnd: '' },
    sunday: { enabled: false, startTime: '09:00', endTime: '17:00', breakStart: '', breakEnd: '' },
    slotDuration: 60
  });

  const days = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ];

  const slotDurations = [
    { value: 30, label: '30 minutes' },
    { value: 45, label: '45 minutes' },
    { value: 60, label: '1 hour' },
    { value: 90, label: '1.5 hours' },
    { value: 120, label: '2 hours' }
  ];

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const response = await providerApi.getWorkingHours();
      if (response.data) {
        // Merge with defaults to ensure all fields exist
        setSchedule(prev => ({
          ...prev,
          ...response.data,
          monday: { ...prev.monday, ...response.data.monday },
          tuesday: { ...prev.tuesday, ...response.data.tuesday },
          wednesday: { ...prev.wednesday, ...response.data.wednesday },
          thursday: { ...prev.thursday, ...response.data.thursday },
          friday: { ...prev.friday, ...response.data.friday },
          saturday: { ...prev.saturday, ...response.data.saturday },
          sunday: { ...prev.sunday, ...response.data.sunday }
        }));
      }
    } catch (err) {
      console.error('Error fetching schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDayToggle = (day) => {
    setSchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled }
    }));
  };

  const handleTimeChange = (day, field, value) => {
    setSchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  };

  const handleSlotDurationChange = (value) => {
    setSchedule(prev => ({ ...prev, slotDuration: parseInt(value) }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await providerApi.updateWorkingHours(schedule);
      toast({
        title: "Schedule saved",
        description: "Your working hours have been updated successfully."
      });
    } catch (err) {
      console.error('Error saving schedule:', err);
      toast({
        title: "Error",
        description: "Failed to save schedule. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const copyToAllDays = (sourceDay) => {
    const source = schedule[sourceDay];
    setSchedule(prev => {
      const newSchedule = { ...prev };
      days.forEach(({ key }) => {
        if (key !== sourceDay && prev[key].enabled) {
          newSchedule[key] = { ...newSchedule[key], startTime: source.startTime, endTime: source.endTime, breakStart: source.breakStart, breakEnd: source.breakEnd };
        }
      });
      return newSchedule;
    });
    toast({
      title: "Copied",
      description: `${sourceDay.charAt(0).toUpperCase() + sourceDay.slice(1)}'s hours copied to all enabled days.`
    });
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Schedule Settings</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Set your available working days and hours</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Slot Duration */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center text-gray-900 dark:text-white">
            <Clock className="h-5 w-5 mr-2 text-blue-600" />
            Appointment Duration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {slotDurations.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => handleSlotDurationChange(value)}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  schedule.slotDuration === value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
            This is the default duration for each appointment slot. Clients can only book one appointment per slot.
          </p>
        </CardContent>
      </Card>

      {/* Working Days */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center text-gray-900 dark:text-white">
            <Calendar className="h-5 w-5 mr-2 text-green-600" />
            Working Days & Hours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {days.map(({ key, label }) => (
              <div
                key={key}
                className={`p-4 rounded-lg border-2 transition-all ${
                  schedule[key].enabled
                    ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Switch
                      checked={schedule[key].enabled}
                      onCheckedChange={() => handleDayToggle(key)}
                    />
                    <Label className="font-semibold text-gray-900 dark:text-white">{label}</Label>
                  </div>
                  {schedule[key].enabled && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToAllDays(key)}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      Copy to all days
                    </Button>
                  )}
                </div>

                {schedule[key].enabled && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-xs text-gray-500 dark:text-gray-400">Start Time</Label>
                      <input
                        type="time"
                        value={schedule[key].startTime}
                        onChange={(e) => handleTimeChange(key, 'startTime', e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 dark:text-gray-400">End Time</Label>
                      <input
                        type="time"
                        value={schedule[key].endTime}
                        onChange={(e) => handleTimeChange(key, 'endTime', e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 dark:text-gray-400">Break Start (optional)</Label>
                      <input
                        type="time"
                        value={schedule[key].breakStart || ''}
                        onChange={(e) => handleTimeChange(key, 'breakStart', e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500 dark:text-gray-400">Break End (optional)</Label>
                      <input
                        type="time"
                        value={schedule[key].breakEnd || ''}
                        onChange={(e) => handleTimeChange(key, 'breakEnd', e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">How it works</h4>
        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
          <li>• Clients can only book appointments during your enabled working hours</li>
          <li>• Each time slot can only be booked by one client (no double bookings)</li>
          <li>• Break times are automatically excluded from available slots</li>
          <li>• Changes take effect immediately after saving</li>
        </ul>
      </div>
    </div>
  );
};

export default ScheduleSettings;
