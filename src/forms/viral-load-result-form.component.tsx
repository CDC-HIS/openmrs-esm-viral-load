import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './lab-order-form.scss';
import {
  OpenmrsDatePicker,
  ResponsiveWrapper,
  closeWorkspace,
  showSnackbar,
  useLayoutType,
} from '@openmrs/esm-framework';
import type { CloseWorkspaceOptions } from '@openmrs/esm-framework';
import { Form } from '@carbon/react';
import { Controller, useForm } from 'react-hook-form';
import { Select, SelectItem, Stack } from '@carbon/react';
import { TextInput } from '@carbon/react';
import { Button } from '@carbon/react';
import { fetchLocation, getPatientEncounters, getPatientInfo, saveEncounter } from '../api/api';
import {
  FOLLOWUP_ENCOUNTER_TYPE_UUID,
  VIRALLOAD_ENCOUNTER_TYPE_UUID,
  VIRALLOAD_FORM_UUID,
  viralLoadFieldConcepts,
} from '../constants';
import dayjs from 'dayjs';
import { useEncounters } from '../viral-load/viral-load.resource';
import type { OpenmrsEncounter } from '../types';
import { getObsFromEncounter } from '../utils/encounter-utils';
import { ButtonSet } from '@carbon/react';
import { NumberInput } from '@carbon/react';
import { RadioButtonGroup } from '@carbon/react';
import { RadioButton } from '@carbon/react';
import { Dropdown } from '@carbon/react';
import { Checkbox } from '@carbon/react';

interface ResponsiveWrapperProps {
  children: React.ReactNode;
  isTablet: boolean;
}
type FormInputs = Record<
  | 'dateOfSampleCollectionDate'
  | 'providerTelephoneNumber'
  | 'dateOfSpecimenSent'
  | 'specimenType'
  | 'providerName'
  | 'requestedDate',
  string
>;

interface ViralLoadFormProps {
  patientUuid: string;
  encounter?: OpenmrsEncounter; // If provided, it means we are editing an encounter
}

const ViralLoadResult: React.FC<ViralLoadFormProps> = ({ patientUuid, encounter }) => {
  const { t } = useTranslation();
  const [dateOfSampleCollection, setdateOfSampleCollection] = useState<string | null>(null);
  const [dateOfSpecimenSent, setdateOfSpecimenSent] = useState<string | null>(null);
  const [requestedDate, setrequestedDate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const today = new Date();
  const [notification, setNotification] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  const { control, handleSubmit, setValue, watch } = useForm<FormInputs>();
  const [facilityLocationUUID, setFacilityLocationUUID] = useState('');
  const [facilityLocationName, setFacilityLocationName] = useState('');
  const [selectedField, setSelectedField] = useState<keyof FormInputs | null>(null);

  const encounterDatetime = new Date().toISOString();

  const encounterProviders = [
    { provider: 'caa66686-bde7-4341-a330-91b7ad0ade07', encounterRole: 'a0b03050-c99b-11e0-9572-0800200c9a66' },
  ];
  const encounterType = VIRALLOAD_ENCOUNTER_TYPE_UUID;
  const form = { uuid: VIRALLOAD_FORM_UUID };
  const location = facilityLocationUUID;
  const patient = patientUuid;
  const orders = [];
  const isTablet = useLayoutType() === 'tablet';
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showChildDatePicker, setShowChildDatePicker] = useState(false);
  const [isOtherSelected, setIsOtherSelected] = useState(false);
  const [isMale, setIsMale] = useState(false);
  

  // Fetch patient encounters
  const { encounters, isError, isLoading, mutate } = useEncounters(patientUuid, VIRALLOAD_ENCOUNTER_TYPE_UUID);

  useEffect(() => {
    (async function () {
      const facilityInformation = await fetchLocation();
      facilityInformation.data.results.forEach((element) => {
        if (element.tags.some((x) => x.display === 'Facility Location')) {
          setFacilityLocationUUID(element.uuid);
          setFacilityLocationName(element.display);
        }
      });
    })();
  }, []);
  
  // Load existing encounter data if editing
  useEffect(() => {
    if (encounter) {
      const dateOfSampleCollectionDateObs = getObsFromEncounter(encounter, viralLoadFieldConcepts.dateOfSampleCollectionDate);
      if (dateOfSampleCollectionDateObs && dayjs(dateOfSampleCollectionDateObs).isValid()) {
        setValue('dateOfSampleCollectionDate', dayjs(dateOfSampleCollectionDateObs).format('YYYY-MM-DD'));
        setdateOfSampleCollection(
          dayjs(getObsFromEncounter(encounter, viralLoadFieldConcepts.dateOfSampleCollectionDate)).format('YYYY-MM-DD'),
        );
      } else {
        setValue('dateOfSampleCollectionDate', ''); // or any default value like null or empty string
      }
      const dateOfSpecimenSentObs = getObsFromEncounter(encounter, viralLoadFieldConcepts.dateOfSpecimenSent);
      if (dateOfSpecimenSentObs && dayjs(dateOfSpecimenSentObs).isValid()) {
        setValue('dateOfSpecimenSent', dayjs(dateOfSpecimenSentObs).format('YYYY-MM-DD'));
        setdateOfSpecimenSent(
          dayjs(getObsFromEncounter(encounter, viralLoadFieldConcepts.dateOfSpecimenSent)).format('YYYY-MM-DD'),
        );
      } else {
        setValue('dateOfSpecimenSent', ''); // or any default value like null or empty string
      }
      const requestedDateObs = getObsFromEncounter(encounter, viralLoadFieldConcepts.requestedDate);
      if (requestedDateObs && dayjs(requestedDateObs).isValid()) {
        setValue('requestedDate', dayjs(requestedDateObs).format('YYYY-MM-DD'));
        setrequestedDate(
          dayjs(getObsFromEncounter(encounter, viralLoadFieldConcepts.requestedDate)).format('YYYY-MM-DD'),
        );
      } else {
        setValue('requestedDate', ''); // or any default value like null or empty string
      }
      
      setValue(
        'providerName',
        encounter?.obs?.find((e) => e?.concept?.uuid === viralLoadFieldConcepts.providerName)?.value || '',
      );
      setValue(
        'providerTelephoneNumber',
        encounter?.obs?.find((e) => e?.concept?.uuid === viralLoadFieldConcepts.providerTelephoneNumber)?.value || '',
      );
    }
  }, [encounter, setValue]);
  type DateFieldKey = 'dateOfSpecimenSent' | 'dateOfSampleCollectionDate' | 'requestedDate';

  const onDateChange = (value: any, dateField: DateFieldKey) => {
    try {
      const jsDate = new Date(value);
      if (isNaN(jsDate.getTime())) {
        throw new Error('Invalid Date');
      }
      const formattedDate = dateField === 'dateOfSampleCollectionDate'
      ? dayjs(jsDate).format('YYYY-MM-DD HH:mm:ss')  // Include time for datetime field
      : dayjs(jsDate).format('YYYY-MM-DD');
      setValue(dateField, formattedDate); // Dynamically set the value based on the field
      setError(null);
    } catch (e) {
      setError('Invalid date format');
    }
  };

  const closeWorkspaceHandler = (name: string) => {
    const options: CloseWorkspaceOptions = {
      ignoreChanges: false,
      onWorkspaceClose: () => {},
    };
    closeWorkspace(name, options);
  };

  const formatValue = (value) => {
    return value instanceof Object
      ? new Date(value.startDate.getTime() - value.startDate?.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
      : value;
  };

  const handleFormSubmit = async (fieldValues: FormInputs) => {
    const obs = [];
    
    // Prepare observations from field values
    Object.keys(fieldValues).forEach((key) => {
      if (fieldValues[key]) {
        obs.push({
          concept: viralLoadFieldConcepts[key],
          formFieldNamespace: 'rfe-forms',
          formFieldPath: `rfe-forms-${key}`,
          value: formatValue(fieldValues[key]),
        });
      }
    });

    // Construct the base payload
    const payload = {
      encounterDatetime,
      encounterProviders,
      encounterType,
      form,
      location,
      patient,
      orders,
      obs: obs,
    };

    try {
      // Check if we are editing an existing encounter
      if (encounter?.uuid) {
        // Update the existing encounter
        await updateEncounter(encounter.uuid, payload); // Pass UUID first, then payload
        showSnackbar({
          isLowContrast: true,
          title: t('updatedEntry', 'Record Updated'),
          kind: 'success',
          subtitle: t('viralLoadEncounterUpdatedSuccessfully', 'The patient encounter was updated'),
        });
      } else {
        // Create a new encounter if none exists
        await createEncounter(payload);
        showSnackbar({
          isLowContrast: true,
          title: t('saveEntry', 'Record Saved'),
          kind: 'success',
          subtitle: t('viralLoadEncounterCreatedSuccessfully', 'A new encounter was created'),
        });
      }

      mutate();
      closeWorkspaceHandler('ettors-workspace');
      return true;
    } catch (error) {
      console.error('Error saving encounter:', error);
    }
  };

  // Function to create a new encounter
  const createEncounter = async (payload) => {
    return await saveEncounter(new AbortController(), payload);
  };

  // Function to update an existing encounter
  const updateEncounter = async (uuid, payload) => {
    if (!uuid || !payload) {
      throw new Error('Both UUID and payload are required to update an encounter.'); // Ensure UUID and payload are provided
    }
    return await saveEncounter(new AbortController(), payload, uuid); // Use saveEncounter for updating
  };

  return (
    <Form className={styles.form} onSubmit={handleSubmit(handleFormSubmit)} data-testid="viral-load-form">
      
    </Form>
  );
};

export default ViralLoadResult;
