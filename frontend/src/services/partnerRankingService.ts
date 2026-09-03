import { ChannelPartner } from '../types/portalTypes';
import { MOCK_PARTNERS } from './mockPartnersData';

// Haversine distance formula in kilometers
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function rankChannelPartners(
  schemeId: string,
  userLat: number,
  userLng: number,
  radiusKm: number = 25
): ChannelPartner[] {
  return MOCK_PARTNERS.map(partner => {
    const distanceKm = calculateHaversineDistance(userLat, userLng, partner.latitude, partner.longitude);
    const isSupported = partner.supportedSchemeIds.includes(schemeId);

    // 6-Factor Weighted Score Engine
    // Score = 40% Scheme Match + 20% Availability + 15% Distance + 10% Processing + 10% Reliability + 5% Capacity
    const schemeCompScore = isSupported ? 98 : 60;
    const distanceScore = Math.max(10, Math.round(100 - distanceKm * 3));
    const availabilityScore = partner.capacityAvailable ? 95 : 40;
    const processingScore = partner.scoreFactors.processingPerformance || 85;
    const reliabilityScore = partner.scoreFactors.reliability || 90;
    const capacityScore = partner.scoreFactors.capacity || 80;

    const weightedScore = Math.round(
      0.40 * schemeCompScore +
      0.20 * availabilityScore +
      0.15 * distanceScore +
      0.10 * processingScore +
      0.10 * reliabilityScore +
      0.05 * capacityScore
    );

    return {
      ...partner,
      distanceKm,
      suitabilityScore: weightedScore,
      scoreFactors: {
        schemeCompatibility: schemeCompScore,
        availability: availabilityScore,
        distance: distanceScore,
        processingPerformance: processingScore,
        reliability: reliabilityScore,
        capacity: capacityScore
      }
    };
  })
  .filter(partner => (partner.distanceKm || 0) <= radiusKm * 2 || partner.type === 'State Channelizing Agency')
  .sort((a, b) => b.suitabilityScore - a.suitabilityScore);
}
