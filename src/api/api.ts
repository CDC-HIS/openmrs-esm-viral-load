import { fhirBaseUrl, openmrsFetch, restBaseUrl } from '@openmrs/esm-framework';
import { encounterRepresentation } from '../constants';
import useSWR from 'swr';

export function saveEncounter(abortController: AbortController, payload, encounterUuid?: string) {
  const url = encounterUuid
    ? `${restBaseUrl}/encounter/${encounterUuid}?v=${encounterRepresentation}`
    : `${restBaseUrl}/encounter?v=${encounterRepresentation}`;

  return openmrsFetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
    method: encounterUuid ? 'POST' : 'POST',
    body: JSON.stringify(payload),
    signal: abortController.signal,
  }).catch((err) => {
    console.error('Error saving encounter:', err);
    throw err;
  });
}

export function useLatestObs(patientUuid: string, conceptUuid: string, encounterType?: string) {
  const searchParams = new URLSearchParams({
    patient: patientUuid,
    code: conceptUuid,
    _sort: '-date',
    _count: '1',
  });
  if (encounterType) {
    searchParams.append('encounter.type', encounterType);
  }

  const url = `${fhirBaseUrl}/Observation?${searchParams.toString()}`;

  const { data: response, error, isLoading } = useSWR<{ data: any }, Error>(url, openmrsFetch);

  return {
    latestMatched: response?.data?.entry?.length ? response?.data?.entry[0]?.resource : null,
    latestLoading: isLoading,
    latestError: error,
    cacheKey: url,
  };
}

export function saveVlTestRequestResult(abortController: AbortController, payload: any) {
  // Construct the URL based on whether a UUID is provided
  const url = `${restBaseUrl}/vltestrequestresult`;

  // Make the API request
  return openmrsFetch(url, {
    headers: {
      'Content-Type': 'application/json', // Set the appropriate Content-Type
    },
    method: 'POST', // Use PUT for updates and POST for creation
    body: JSON.stringify(payload), // Convert the payload to a JSON string
    signal: abortController.signal, // Handle abort signal
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to save VL Test Request Result: ${response.statusText}`);
      }
      return response.json();
    })
    .catch((err) => {
      console.error('Error saving VL Test Request Result:', err);
      throw err;
    });
}

export function saveVlTestResult(abortController: AbortController, payload: any, encounterUuid?: string) {
  // Construct the URL based on whether a UUID is provided
  const url = `${restBaseUrl}/vltestrequestresult/${encounterUuid}`;

  // Make the API request
  return openmrsFetch(url, {
    headers: {
      'Content-Type': 'application/json', // Set the appropriate Content-Type
    },
    method: 'POST', // Use PUT for updates and POST for creation
    body: JSON.stringify(payload), // Convert the payload to a JSON string
    signal: abortController.signal, // Handle abort signal
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to save VL Test Request Result: ${response.statusText}`);
      }
      return response.json();
    })
    .catch((err) => {
      console.error('Error saving VL Test Request Result:', err);
      throw err;
    });
}

export function fetchLocation() {
  return openmrsFetch(`${restBaseUrl}/location?q=&v=default`);
}

export async function getPatientInfo(patientUuid: string) {
  try {
    const response = await openmrsFetch(`${restBaseUrl}/patient/${patientUuid}?v=full`);
    const data = await response.data;

    return data;
  } catch (error) {
    console.error('Error fetching patient emergency contact:', error);
    return null;
  }
}

export function getPatientEncounters(patientUUID, encounterUUID) {
  //This function fetches the first two encounters for a given patient. You can remove the limit and also the "v=full"
  return openmrsFetch(
    `${restBaseUrl}/encounter?encounterType=${encounterUUID}&patient=${patientUUID}&v=full&limit=5`,
  ).then(({ data }) => {
    return data.results;
  });
}

export function fetchPatientLastEncounter(patientUuid: string, encounterType) {
  const query = `encounterType=${encounterType}&patient=${patientUuid}`;
  return openmrsFetch(`${restBaseUrl}/encounter?${query}&v=${encounterRepresentation}`).then(({ data }) => {
    if (data.results.length) {
      return data.results[data.results.length - 1];
    }

    return null;
  });
}

export async function fetchPatientData(patientUuid: string) {
  try {
    const response = await openmrsFetch(`${restBaseUrl}/followup/${patientUuid}`);
    const data = await response.data;

    return {
      patientUUID: data.patientUUID,
      currentRegimenInitiatedDate: data.currentRegimenInitiatedDate,
      regimen: data.regimen,
      followUpStatus: data.followUpStatus,
      pregnancyStatus: data.pregnancyStatus,
      breastFeeding: data.breastFeeding,
      cd4AboveFiveAgeCount: data.cd4AboveFiveAgeCount,
      cd4ForChild: data.cd4ForChild,
      // reasonForVlTest: data.reasonForVlTest,
      // routingVlTest: data.routingVlTest,
      // targetedVlTest: data.targetedVlTest,
      resourceVersion: data.resourceVersion,
    };
  } catch (error) {
    console.error('Error fetching patient data:', error);
    return null;
  }
}

export async function fetchVlTestRequestResult(patientUuid: string) {
  try {
    const response = await openmrsFetch(`${restBaseUrl}/vltestrequestresult/${patientUuid}`);
    const details = await response.data;

    // Return all details as they are
    return details.map((detail: any) => ({
      vlTestRequestResultId: detail.vlTestRequestResultId,
      uuid: detail.uuid,
      patientUUID: detail.patientUUID,
      encounterId: detail.encounterId,
      facilityCode: detail.facilityCode,
      requestedDate: detail.requestedDate,
      regimen: detail.regimen,
      dateInitiated: detail.dateInitiated,
      currentArtAdherence: detail.currentArtAdherence,
      pregnancy: detail.pregnancy,
      breastFeeding: detail.breastFeeding,
      cd4MostRecent: detail.cd4MostRecent,
      cd4MostRecentDate: detail.cd4MostRecentDate,
      cd4BaselineResult: detail.cd4BaselineResult,
      cd4BaselineResultDate: detail.cd4BaselineResultDate,
      whoStaging: detail.whoStaging,
      routineVl: detail.routineVl,
      targeted: detail.targeted,
      specimenCollectedDate: detail.specimenCollectedDate,
      specimenType: detail.specimenType,
      specimenSentToReferralDate: detail.specimenSentToReferralDate,
      shipmentTemperature: detail.shipmentTemperature,
      labId: detail.labId,
      labName: detail.labName,
      specimenReceivedDate: detail.specimenReceivedDate,
      temperatureOnArrival: detail.temperatureOnArrival,
      specimenQuality: detail.specimenQuality,
      reason: detail.reason,
      instrumentUsed: detail.instrumentUsed,
      testResult: detail.testResult,
      testedBy: detail.testedBy,
      reviewedBy: detail.reviewedBy,
      dispatchedDate: detail.dispatchedDate,
      aletSentDate: detail.aletSentDate,
      routineVLPregnantMother: detail.routineVLPregnantMother,
      resultReachedToFacDate: detail.resultReachedToFacDate,
      resultReceivedByFacility: detail.resultReceivedByFacility,
      attachedToPatientDate: detail.attachedToPatientDate,
      communicatedToPatientDate: detail.communicatedToPatientDate,
      testResultDate: detail.testResultDate,
      requestId: detail.requestId,
      responseId: detail.responseId,
      orderStatus: detail.orderStatus,
      resultStatus: detail.resultStatus,
      requestedBy: detail.requestedBy,
      exchangeStatus: detail.exchangeStatus,
      followUpDate: detail.followUpDate,
      patientId: detail.patientId,
      providerPhoneNo: detail.providerPhoneNo,
      resourceVersion: detail.resourceVersion,
    }));
  } catch (error) {
    console.error('Error fetching VL Test Request Result data:', error);
    return [];
  }
}
