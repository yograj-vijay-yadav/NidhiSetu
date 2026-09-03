import { ChannelPartner } from '../types/portalTypes';

export const MOCK_PARTNERS: ChannelPartner[] = [
  {
    id: 'CP-PNE-101',
    name: 'Mahatma Phule Backward Classes Development Corp (MPBCDC - SCA Pune)',
    type: 'State Channelizing Agency',
    branchCode: 'SCA-MH-PNE01',
    address: 'Senapati Bapat Road, Near ICC Trade Tower, Shivaji Nagar, Pune, Maharashtra',
    district: 'Pune',
    state: 'Maharashtra',
    pincode: '411016',
    phone: '+91-20-25678901',
    email: 'contact.pune@mpbcdc.gov.in',
    latitude: 18.5314,
    longitude: 73.8322,
    suitabilityScore: 94,
    scoreFactors: {
      schemeCompatibility: 98,
      availability: 92,
      distance: 96,
      processingPerformance: 90,
      reliability: 92,
      capacity: 88
    },
    supportedSchemeIds: [
      'SCH-2026-PMEGP01',
      'SCH-2026-MUDRA02',
      'SCH-2026-STANDUP03',
      'SCH-2026-MF04',
      'SCH-2026-NBCFDC05',
      'SCH-2026-MSY06',
      'SCH-2026-VISHWAKARMA07',
      'SCH-2026-NMDFC08',
      'SCH-2026-EDU09'
    ],
    capacityAvailable: true,
    activeLoad: 14,
    nodeStatus: 'Active Allocation Node'
  },
  {
    id: 'CP-PNE-102',
    name: 'State Bank of India (SBI Special Financial Node - FC Road Branch)',
    type: 'Public Sector Bank',
    branchCode: 'SBI-MH-PNE402',
    address: 'Fergusson College Road, Deccan Gymkhana, Pune, Maharashtra',
    district: 'Pune',
    state: 'Maharashtra',
    pincode: '411004',
    phone: '+91-20-25534112',
    email: 'sbi.fcroad@sbi.co.in',
    latitude: 18.5186,
    longitude: 73.8423,
    suitabilityScore: 91,
    scoreFactors: {
      schemeCompatibility: 95,
      availability: 90,
      distance: 94,
      processingPerformance: 88,
      reliability: 92,
      capacity: 82
    },
    supportedSchemeIds: [
      'SCH-2026-PMEGP01',
      'SCH-2026-MUDRA02',
      'SCH-2026-STANDUP03',
      'SCH-2026-EDU09'
    ],
    capacityAvailable: true,
    activeLoad: 28,
    nodeStatus: 'High Processing Capacity'
  },
  {
    id: 'CP-PNE-103',
    name: 'Bank of Maharashtra (Lead District Bank - Lokmangal H.O. Branch)',
    type: 'Public Sector Bank',
    branchCode: 'BOM-MH-PNE001',
    address: 'Lokmangal, 1501 Shivajinagar, Pune, Maharashtra',
    district: 'Pune',
    state: 'Maharashtra',
    pincode: '411005',
    phone: '+91-20-25532731',
    email: 'bom.pune@mahabank.co.in',
    latitude: 18.5300,
    longitude: 73.8475,
    suitabilityScore: 89,
    scoreFactors: {
      schemeCompatibility: 92,
      availability: 90,
      distance: 92,
      processingPerformance: 86,
      reliability: 90,
      capacity: 85
    },
    supportedSchemeIds: [
      'SCH-2026-PMEGP01',
      'SCH-2026-MUDRA02',
      'SCH-2026-VISHWAKARMA07',
      'SCH-2026-EDU09'
    ],
    capacityAvailable: true,
    activeLoad: 22,
    nodeStatus: 'Active Allocation Node'
  },
  {
    id: 'CP-PNE-104',
    name: 'Maharashtra Gramin Bank (Regional Rural Bank - Hadapsar Branch)',
    type: 'Regional Rural Bank',
    branchCode: 'MGB-PNE-305',
    address: 'Solapur Road, Hadapsar Industrial Estate, Pune, Maharashtra',
    district: 'Pune',
    state: 'Maharashtra',
    pincode: '411028',
    phone: '+91-20-26871109',
    email: 'mgb.hadapsar@mahagramin.in',
    latitude: 18.5020,
    longitude: 73.9270,
    suitabilityScore: 85,
    scoreFactors: {
      schemeCompatibility: 86,
      availability: 88,
      distance: 82,
      processingPerformance: 82,
      reliability: 88,
      capacity: 92
    },
    supportedSchemeIds: [
      'SCH-2026-MUDRA02',
      'SCH-2026-MF04',
      'SCH-2026-MSY06',
      'SCH-2026-VISHWAKARMA07'
    ],
    capacityAvailable: true,
    activeLoad: 9,
    nodeStatus: 'Standard Node'
  },
  {
    id: 'CP-PNE-105',
    name: 'Punjab National Bank (Camp Branch Nodal Node)',
    type: 'Public Sector Bank',
    branchCode: 'PNB-MH-PNE109',
    address: 'Mahatma Gandhi Road, Camp Area, Pune, Maharashtra',
    district: 'Pune',
    state: 'Maharashtra',
    pincode: '411001',
    phone: '+91-20-26131415',
    email: 'pnb.camp@pnb.co.in',
    latitude: 18.5167,
    longitude: 73.8767,
    suitabilityScore: 87,
    scoreFactors: {
      schemeCompatibility: 88,
      availability: 88,
      distance: 88,
      processingPerformance: 85,
      reliability: 88,
      capacity: 84
    },
    supportedSchemeIds: [
      'SCH-2026-PMEGP01',
      'SCH-2026-STANDUP03',
      'SCH-2026-EDU09'
    ],
    capacityAvailable: true,
    activeLoad: 19,
    nodeStatus: 'High Processing Capacity'
  },
  {
    id: 'CP-PNE-106',
    name: 'Suryoday Small Finance Bank / Micro-Finance Node (Kothrud Branch)',
    type: 'Small Finance Bank',
    branchCode: 'SSFB-PNE-204',
    address: 'Karve Road, Near Kothrud Bus Depot, Kothrud, Pune, Maharashtra',
    district: 'Pune',
    state: 'Maharashtra',
    pincode: '411038',
    phone: '+91-20-25458899',
    email: 'suryoday.kothrud@suryodaybank.com',
    latitude: 18.5074,
    longitude: 73.8077,
    suitabilityScore: 86,
    scoreFactors: {
      schemeCompatibility: 85,
      availability: 94,
      distance: 86,
      processingPerformance: 92,
      reliability: 84,
      capacity: 90
    },
    supportedSchemeIds: [
      'SCH-2026-MUDRA02',
      'SCH-2026-MF04',
      'SCH-2026-MSY06'
    ],
    capacityAvailable: true,
    activeLoad: 11,
    nodeStatus: 'Active Allocation Node'
  }
];
