// Mock data for SimplePractice clone

export const mockProviders = [
  {
    id: 'prov-1',
    name: 'Dr. Sarah Mitchell',
    email: 'sarah.mitchell@clinic.com',
    specialty: 'Clinical Psychologist',
    license: 'PSY-12345',
    phone: '(555) 123-4567',
    bio: 'Specializing in anxiety, depression, and trauma-informed care with 15+ years of experience.',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop',
    hourlyRate: 150
  },
  {
    id: 'prov-2',
    name: 'Dr. James Chen',
    email: 'james.chen@clinic.com',
    specialty: 'Psychiatrist',
    license: 'PSY-67890',
    phone: '(555) 234-5678',
    bio: 'Board-certified psychiatrist specializing in mood disorders and medication management.',
    avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop',
    hourlyRate: 200
  }
];

export const mockClients = [
  {
    id: 'client-1',
    name: 'Emily Johnson',
    email: 'emily.j@email.com',
    phone: '(555) 345-6789',
    dateOfBirth: '1988-05-15',
    address: '123 Main St, Springfield, IL 62701',
    insurance: 'Blue Cross Blue Shield',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
    providerId: 'prov-1',
    emergencyContact: {
      name: 'Michael Johnson',
      phone: '(555) 456-7890',
      relationship: 'Spouse'
    }
  },
  {
    id: 'client-2',
    name: 'Robert Davis',
    email: 'robert.d@email.com',
    phone: '(555) 456-7891',
    dateOfBirth: '1975-08-22',
    address: '456 Oak Ave, Springfield, IL 62702',
    insurance: 'United Healthcare',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    providerId: 'prov-1',
    emergencyContact: {
      name: 'Linda Davis',
      phone: '(555) 567-8901',
      relationship: 'Sister'
    }
  },
  {
    id: 'client-3',
    name: 'Maria Garcia',
    email: 'maria.g@email.com',
    phone: '(555) 567-8902',
    dateOfBirth: '1992-03-10',
    address: '789 Elm St, Springfield, IL 62703',
    insurance: 'Aetna',
    avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop',
    providerId: 'prov-2',
    emergencyContact: {
      name: 'Carlos Garcia',
      phone: '(555) 678-9012',
      relationship: 'Father'
    }
  }
];

export const mockAppointments = [
  {
    id: 'apt-1',
    clientId: 'client-1',
    providerId: 'prov-1',
    date: '2025-01-20',
    time: '10:00 AM',
    duration: 60,
    type: 'Initial Consultation',
    status: 'confirmed',
    notes: 'First session - intake assessment',
    videoLink: 'https://meet.google.com/abc-defg-hij',
    amount: 150
  },
  {
    id: 'apt-2',
    clientId: 'client-2',
    providerId: 'prov-1',
    date: '2025-01-20',
    time: '2:00 PM',
    duration: 60,
    type: 'Follow-up Session',
    status: 'confirmed',
    notes: 'Continuing CBT therapy',
    videoLink: 'https://meet.google.com/xyz-uvwx-rst',
    amount: 150
  },
  {
    id: 'apt-3',
    clientId: 'client-1',
    providerId: 'prov-1',
    date: '2025-01-22',
    time: '11:00 AM',
    duration: 60,
    type: 'Therapy Session',
    status: 'pending',
    notes: 'Weekly therapy session',
    videoLink: 'https://meet.google.com/lmn-opqr-stu',
    amount: 150
  },
  {
    id: 'apt-4',
    clientId: 'client-3',
    providerId: 'prov-2',
    date: '2025-01-21',
    time: '3:00 PM',
    duration: 30,
    type: 'Medication Management',
    status: 'confirmed',
    notes: 'Prescription review',
    videoLink: 'https://meet.google.com/vwx-yzab-cde',
    amount: 100
  }
];

export const mockMessages = [
  {
    id: 'msg-1',
    senderId: 'client-1',
    receiverId: 'prov-1',
    senderType: 'client',
    message: 'Hi Dr. Mitchell, I wanted to ask about rescheduling our next appointment.',
    timestamp: '2025-01-18T09:30:00',
    read: true
  },
  {
    id: 'msg-2',
    senderId: 'prov-1',
    receiverId: 'client-1',
    senderType: 'provider',
    message: 'Hello Emily! Of course, what time works better for you?',
    timestamp: '2025-01-18T10:15:00',
    read: true
  },
  {
    id: 'msg-3',
    senderId: 'client-1',
    receiverId: 'prov-1',
    senderType: 'client',
    message: 'Would Thursday at 2 PM be available?',
    timestamp: '2025-01-18T10:30:00',
    read: false
  },
  {
    id: 'msg-4',
    senderId: 'client-2',
    receiverId: 'prov-1',
    senderType: 'client',
    message: 'Thank you for the session notes. They were very helpful.',
    timestamp: '2025-01-17T16:45:00',
    read: true
  }
];

export const mockInvoices = [
  {
    id: 'inv-1',
    clientId: 'client-1',
    providerId: 'prov-1',
    appointmentId: 'apt-1',
    amount: 150,
    date: '2025-01-15',
    dueDate: '2025-01-30',
    status: 'paid',
    description: 'Initial Consultation - 60 min',
    paymentMethod: 'Credit Card'
  },
  {
    id: 'inv-2',
    clientId: 'client-2',
    providerId: 'prov-1',
    appointmentId: 'apt-2',
    amount: 150,
    date: '2025-01-16',
    dueDate: '2025-01-31',
    status: 'pending',
    description: 'Follow-up Session - 60 min',
    paymentMethod: null
  },
  {
    id: 'inv-3',
    clientId: 'client-3',
    providerId: 'prov-2',
    appointmentId: 'apt-4',
    amount: 100,
    date: '2025-01-14',
    dueDate: '2025-01-29',
    status: 'overdue',
    description: 'Medication Management - 30 min',
    paymentMethod: null
  }
];

export const mockClinicalNotes = [
  {
    id: 'note-1',
    appointmentId: 'apt-1',
    clientId: 'client-1',
    providerId: 'prov-1',
    date: '2025-01-15',
    type: 'SOAP',
    content: {
      subjective: 'Client reports increased anxiety over the past two weeks, particularly related to work stress.',
      objective: 'Client appeared anxious but engaged. Good eye contact. Speech was clear and coherent.',
      assessment: 'Generalized Anxiety Disorder (F41.1). Client is motivated for treatment.',
      plan: 'Begin CBT therapy. Schedule weekly sessions. Discuss coping strategies and relaxation techniques.'
    },
    diagnosis: 'F41.1 - Generalized Anxiety Disorder',
    privateNotes: 'Consider referral to psychiatrist if symptoms worsen'
  }
];

export const mockDashboardStats = {
  provider: {
    totalIncome: 4500,
    monthlyIncome: 1200,
    appointmentsToday: 3,
    appointmentsWeek: 12,
    pendingNotes: 2,
    activeClients: 8,
    messagesUnread: 2,
    upcomingAppointments: 5
  },
  client: {
    upcomingAppointments: 2,
    pendingPayments: 1,
    unreadMessages: 1,
    completedSessions: 5
  }
};

export const mockTimeSlots = [
  '9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'
];
