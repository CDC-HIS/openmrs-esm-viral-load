import { openmrsFetch, restBaseUrl } from '@openmrs/esm-framework';
import useSWR from 'swr';

type VLRequestOrder = {
  uuid: string;
  patientUUID: string;
  encounterId: string;
  facilityCode: string;
  requestedDate: string;
  regimen: string;
  dateInitiated: string;
  currentArtAdherence: string;
  pregnancy: string;
  breastFeeding: string;
  cd4MostRecent: string;
  cd4MostRecentDate: string;
  cd4BaselineResult: string;
  cd4BaselineResultDate: string;
  whoStaging: string;
  routineVl: string;
  targeted: string;
  specimenCollectedDate: string;
  specimenType: string;
  specimenSentToReferralDate: string;
  shipmentTemperature: string;
  labId: string;
  labName: string;
  specimenReceivedDate: string;
  temperatureOnArrival: string;
  specimenQuality: string;
  reason: string;
  instrumentUsed: string;
  testResult: string;
  testedBy: string;
  reviewedBy: string;
  dispatchedDate: string;
  aletSentDate: string;
  routineVLPregnantMother: string;
  resultReachedToFacDate: string;
  resultReceivedByFacility: string;
  attachedToPatientDate: string;
  communicatedToPatientDate: string;
  testResultDate: string;
  requestId: string;
  responseId: string;
  orderStatus: string;
  resultStatus: string;
  requestedBy: string;
  exchangeStatus: string;
  followUpDate: string;
  patientId: string;
  providerPhoneNo: string;
  resourceVersion: string;
};

type UseVLRequestOrders = {
  vlRequestOrders: Array<VLRequestOrder>;
  isError: Error | null;
  isLoading: boolean;
  isValidating: boolean;
  mutate: () => void;
};

export function useVLRequestOrders(patientUuid: string): UseVLRequestOrders {
  // Define the endpoint URL
  const vlRequestOrderUrl = `${restBaseUrl}/vltestrequestresult/${patientUuid}`;

  // Use SWR to fetch and manage data
  const { data, error, isLoading, isValidating, mutate } = useSWR<{ data: Array<VLRequestOrder> }, Error>(
    patientUuid ? vlRequestOrderUrl : null,
    openmrsFetch,
  );

  return {
    vlRequestOrders: data ? data?.data : [], // Extract results from response
    isError: error,
    isLoading,
    isValidating,
    mutate,
  };
}
