// Emergency services configuration
const EMERGENCY_SERVICES = {
  medical: {
    number: '108',
    name: 'Medical Emergency',
    nameTa: 'மருத்துவ அவசரம்'
  },
  police: {
    number: '100',
    name: 'Police',
    nameTa: 'காவல்துறை'
  },
  fire: {
    number: '101',
    name: 'Fire Department',
    nameTa: 'தீயணைப்புத் துறை'
  },
  disaster: {
    number: '108',
    name: 'Disaster Management',
    nameTa: 'பேரிடர் மேலாண்மை'
  }
};

// Mock emergency call function
const makeEmergencyCall = async (serviceType, location, language = 'ta') => {
  try {
    const service = EMERGENCY_SERVICES[serviceType] || EMERGENCY_SERVICES.medical;
    
    // In production, this would integrate with actual calling services
    // For now, we'll simulate the call and log it
    
    const callLog = {
      service: service.name,
      number: service.number,
      calledAt: new Date(),
      status: 'initiated',
      location: {
        latitude: location.coordinates[1],
        longitude: location.coordinates[0]
      },
      language
    };

    // Simulate call delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock successful call
    callLog.status = 'connected';
    callLog.notes = language === 'ta' 
      ? `${service.nameTa} அழைப்பு வெற்றிகரமாக இணைக்கப்பட்டது`
      : `${service.name} call connected successfully`;

    console.log(`📞 Emergency call made to ${service.name} (${service.number})`);
    console.log(`📍 Location: ${location.coordinates[1]}, ${location.coordinates[0]}`);
    
    return callLog;
  } catch (error) {
    console.error('Emergency call error:', error);
    return {
      service: serviceType,
      calledAt: new Date(),
      status: 'failed',
      notes: 'Call failed - technical error'
    };
  }
};

// Trigger emergency calls based on SOS type
const triggerEmergencyCall = async (sosRecord, language = 'ta') => {
  try {
    const callLogs = [];
    
    // Always call medical emergency first
    const medicalCall = await makeEmergencyCall('medical', sosRecord.location, language);
    callLogs.push(medicalCall);

    // Call additional services based on emergency type
    switch (sosRecord.emergencyType) {
      case 'accident':
        const policeCall = await makeEmergencyCall('police', sosRecord.location, language);
        callLogs.push(policeCall);
        break;
        
      case 'fire':
        const fireCall = await makeEmergencyCall('fire', sosRecord.location, language);
        callLogs.push(fireCall);
        break;
        
      case 'police':
        const policeDirectCall = await makeEmergencyCall('police', sosRecord.location, language);
        callLogs.push(policeDirectCall);
        break;
        
      default:
        // For medical and general emergencies, only medical call is made
        break;
    }

    // Simulate notifying nearby hospitals
    const hospitalNotification = await notifyNearbyHospitals(sosRecord, language);
    if (hospitalNotification) {
      callLogs.push(hospitalNotification);
    }

    return callLogs;
  } catch (error) {
    console.error('Trigger emergency call error:', error);
    return [{
      service: 'Emergency Services',
      calledAt: new Date(),
      status: 'failed',
      notes: 'Failed to trigger emergency calls'
    }];
  }
};

// Notify nearby hospitals (mock implementation)
const notifyNearbyHospitals = async (sosRecord, language = 'ta') => {
  try {
    // In production, this would:
    // 1. Find hospitals within 10km radius
    // 2. Send notifications to hospital emergency departments
    // 3. Provide patient location and emergency type
    
    const notification = {
      service: 'Hospital Network',
      calledAt: new Date(),
      status: 'notified',
      notes: language === 'ta'
        ? 'அருகிலுள்ள மருத்துவமனைகளுக்கு அறிவிப்பு அனுப்பப்பட்டது'
        : 'Nearby hospitals have been notified'
    };

    console.log(`🏥 Notified nearby hospitals about emergency at ${sosRecord.location.coordinates}`);
    
    return notification;
  } catch (error) {
    console.error('Hospital notification error:', error);
    return null;
  }
};

// Get emergency contact suggestions based on location
const getEmergencyContacts = (location, emergencyType = 'medical') => {
  // This would integrate with local emergency services database
  const contacts = [
    {
      name: 'Medical Emergency',
      nameTa: 'மருத்துவ அவசரம்',
      number: '108',
      type: 'medical',
      available24x7: true
    },
    {
      name: 'Police Emergency',
      nameTa: 'காவல்துறை அவசரம்',
      number: '100',
      type: 'police',
      available24x7: true
    },
    {
      name: 'Fire Emergency',
      nameTa: 'தீயணைப்பு அவசரம்',
      number: '101',
      type: 'fire',
      available24x7: true
    }
  ];

  return contacts;
};

// Estimate emergency response time
const estimateResponseTime = (location, emergencyType = 'medical') => {
  // Mock estimation based on location and service type
  // In production, this would use real-time data from emergency services
  
  const baseTime = {
    medical: 8, // minutes
    police: 6,
    fire: 10,
    general: 8
  };

  // Add random variation (±3 minutes)
  const variation = Math.floor(Math.random() * 6) - 3;
  const estimatedTime = (baseTime[emergencyType] || baseTime.general) + variation;

  return Math.max(5, estimatedTime); // Minimum 5 minutes
};

// Format emergency message for different languages
const formatEmergencyMessage = (sosRecord, language = 'ta') => {
  const messages = {
    ta: {
      triggered: 'SOS சிக்னல் அனுப்பப்பட்டது',
      location: 'இடம்',
      type: 'அவசர வகை',
      time: 'நேரம்',
      services_notified: 'அவசர சேவைகள் அறிவிக்கப்பட்டன',
      estimated_arrival: 'மதிப்பிடப்பட்ட வருகை நேரம்'
    },
    en: {
      triggered: 'SOS signal triggered',
      location: 'Location',
      type: 'Emergency type',
      time: 'Time',
      services_notified: 'Emergency services notified',
      estimated_arrival: 'Estimated arrival time'
    }
  };

  const msg = messages[language] || messages.en;
  const estimatedTime = estimateResponseTime(sosRecord.location, sosRecord.emergencyType);

  return {
    title: msg.triggered,
    details: {
      [msg.location]: sosRecord.address || 'Location coordinates provided',
      [msg.type]: sosRecord.emergencyType,
      [msg.time]: sosRecord.createdAt.toLocaleString(),
      [msg.services_notified]: '108, Local Hospitals',
      [msg.estimated_arrival]: `${estimatedTime} minutes`
    }
  };
};

module.exports = {
  triggerEmergencyCall,
  makeEmergencyCall,
  notifyNearbyHospitals,
  getEmergencyContacts,
  estimateResponseTime,
  formatEmergencyMessage
};