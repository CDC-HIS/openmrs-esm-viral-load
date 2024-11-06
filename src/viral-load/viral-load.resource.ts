import { openmrsFetch, restBaseUrl } from "@openmrs/esm-framework";
import { type OpenmrsEncounter } from "../types";
import useSWR from 'swr';
import { encounterRepresentation } from "../constants";

type UseEncounters = {
    encounters: Array<OpenmrsEncounter>;
    isError: Error | null;
    isLoading: boolean;
    isValidating: boolean;
    mutate: () => void;
  };


export function useEncounters(patientUuid: string, encounterType): UseEncounters {
    const encountersUrl = `${restBaseUrl}/encounter?patient=${patientUuid}&encounterType=${encounterType}&v=${encounterRepresentation}`;
  
    const { data, error, isLoading, isValidating, mutate } = useSWR<{ data: { results: Array<OpenmrsEncounter> } }, Error>(
      patientUuid ? encountersUrl : null,
      openmrsFetch,
    );
  
  
    return {
      encounters: data? data?.data.results: [],
      isError: error,
      isLoading,
      isValidating,
      mutate,
    };
  }


