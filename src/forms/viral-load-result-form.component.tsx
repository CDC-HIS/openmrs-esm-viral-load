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
  VIRALLOAD_RESULT_FORM_UUID,
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
type ResultFormInputs = Record<
  | 'testDate'
  | 'viralLoadCount'
  | 'testedBy'
  | 'requestedDate'
  | 'reviewedBy'
  | 'panicAlertSent'
  | 'dispatchDate'
  | 'resultReceivedBy'
  | 'resultReceivedDate'
  | 'tempratureOnArrival'
  | 'instrumentUsed'
  | 'reason'
  | 'specimenQuality'
  | 'specimenReceivedDate'
  | 'testingLabName'
  | 'labID'
  | 'dateOfSampleCollectionDate'
  | 'providerTelephoneNumber'
  | 'dateOfSpecimenSent'
  | 'specimenType'
  | 'providerName'
  | 'requestedDate',
  string
>;

interface ViralLoadResultFormProps {
  patientUuid: string;
  encounter?: OpenmrsEncounter; // If provided, it means we are editing an encounter
}

const ViralLoadResult: React.FC<ViralLoadResultFormProps> = ({ patientUuid, encounter }) => {
  const { t } = useTranslation();
  const [dateOfSampleCollection, setdateOfSampleCollection] = useState<string | null>(null);
  const [dateOfSpecimenSent, setdateOfSpecimenSent] = useState<string | null>(null);
  const [requestedDate, setrequestedDate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const today = new Date();
  const [notification, setNotification] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  const { control, handleSubmit, setValue, watch } = useForm<ResultFormInputs>();
  const [facilityLocationUUID, setFacilityLocationUUID] = useState('');
  const [facilityLocationName, setFacilityLocationName] = useState('');
  const [selectedField, setSelectedField] = useState<keyof ResultFormInputs | null>(null);

  const encounterDatetime = new Date().toISOString();

  const encounterProviders = [
    { provider: 'caa66686-bde7-4341-a330-91b7ad0ade07', encounterRole: 'a0b03050-c99b-11e0-9572-0800200c9a66' },
  ];
  const encounterType = VIRALLOAD_ENCOUNTER_TYPE_UUID;
  const form = { uuid: VIRALLOAD_RESULT_FORM_UUID };
  const location = facilityLocationUUID;
  const patient = patientUuid;
  const orders = [];
  const isTablet = useLayoutType() === 'tablet';
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showChildDatePicker, setShowChildDatePicker] = useState(false);
  const [isOtherSelected, setIsOtherSelected] = useState(false);
  const [isMale, setIsMale] = useState(false);
  

  // Fetch patient encounters
  //const { mutate} = useEncounters(patientUuid, VIRALLOAD_ENCOUNTER_TYPE_UUID);

  // useEffect(() => {
  //   (async function () {
  //     const facilityInformation = await fetchLocation();
  //     facilityInformation.data.results.forEach((element) => {
  //       if (element.tags.some((x) => x.display === 'Facility Location')) {
  //         setFacilityLocationUUID(element.uuid);
  //         setFacilityLocationName(element.display);
  //       }
  //     });
  //   })();
  // }, []);
  
  // Load existing encounter data if editing
  // useEffect(() => {
  //   if (encounter) {
      
      
  //     const requestedDateObs = getObsFromEncounter(encounter, viralLoadFieldConcepts.requestedDate);
  //     if (requestedDateObs && dayjs(requestedDateObs).isValid()) {
  //       setValue('requestedDate', dayjs(requestedDateObs).format('YYYY-MM-DD'));
  //       setrequestedDate(
  //         dayjs(getObsFromEncounter(encounter, viralLoadFieldConcepts.requestedDate)).format('YYYY-MM-DD'),
  //       );
  //     } else {
  //       setValue('requestedDate', ''); // or any default value like null or empty string
  //     }
      
  //     setValue(
  //       'testedBy',
  //       encounter?.obs?.find((e) => e?.concept?.uuid === viralLoadFieldConcepts.testedBy)?.value || '',
  //     );
  //     setValue(
  //       'viralLoadCount',
  //       encounter?.obs?.find((e) => e?.concept?.uuid === viralLoadFieldConcepts.viralLoadCount)?.value || '',
  //     );
  //   }
  // }, [encounter, setValue]);
  type DateFieldKey = 'testDate' | 'requestedDate' | 'panicAlertSent' | 'dispatchDate' | 'resultReceivedDate' | 'specimenReceivedDate' | 'dateOfSpecimenSent' | 'dateOfSampleCollectionDate' | 'requestedDate';

  const onDateChange = (value: any, dateField: DateFieldKey) => {
    try {
      const jsDate = new Date(value);
      if (isNaN(jsDate.getTime())) {
        throw new Error('Invalid Date');
      }
      const formattedDate = dateField === 'testDate'
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

  const handleFormSubmit = async (fieldValues: ResultFormInputs) => {
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

      //mutate();
      closeWorkspaceHandler('viral-load-result-workspace');
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
    <Form className={styles.form} onSubmit={handleSubmit(handleFormSubmit)} data-testid="viral-load-result-form">
      <Stack gap={1} className={styles.container}>
      <section className={styles.formGroup}>
          <ResponsiveWrapper>
            <Controller
              name="testDate"
              control={control}
              render={({ field: { onChange, value, ref } }) => (
                <OpenmrsDatePicker
                  id="testDate"
                  labelText={t('testDate', 'Date specimen collected')}
                  value={dateOfSampleCollection}
                  maxDate={today}
                  onChange={(date) => onDateChange(date, 'testDate')}
                  ref={ref}
                  invalidText={error}
                />
              )}
            />
          </ResponsiveWrapper>
        </section>
        <section>
        <ResponsiveWrapper>
        <Controller
          control={control}
          name="viralLoadCount"
          render={({ field }) => (
            <NumberInput
              allowEmpty
              className={styles.numberInput}
              disableWheel
              hideSteppers
              id="viralLoadCount"
              //key={concept.uuid}
              label="viralLoadCount"
              onChange={(event) => field.onChange(event.target.value)}
              value={field.value || ''}
            />
          )}
        />
        </ResponsiveWrapper>
        </section>
        <section className={styles.formGroup}>
          <ResponsiveWrapper>
            <Controller
              name="testedBy"
              control={control}
              render={({ field: { onChange, onBlur, value, ref } }) => (
                <TextInput
                  id="testedBy"
                  value={value}
                  labelText="Tested by:"
                  placeholder="Tested by"
                  onChange={onChange}
                  onBlur={onBlur}
                  ref={ref}
                />
              )}
            />
          </ResponsiveWrapper>
        </section>
        <section className={styles.formGroup}>
          <ResponsiveWrapper>
            <Controller
              name="reviewedBy"
              control={control}
              render={({ field: { onChange, onBlur, value, ref } }) => (
                <TextInput
                  id="reviewedBy"
                  value={value}
                  labelText="Reviewed by:"
                  placeholder="Reviewed by"
                  onChange={onChange}
                  onBlur={onBlur}
                  ref={ref}
                />
              )}
            />
          </ResponsiveWrapper>
        </section>
        <section className={styles.formGroup}>
          <ResponsiveWrapper>
            <Controller
              name="panicAlertSent"
              control={control}
              render={({ field: { onChange, value, ref } }) => (
                <OpenmrsDatePicker
                  id="panicAlertSent"
                  labelText={t('panicAlertSent', 'Panic value alert sent')}
                  value={dateOfSampleCollection}
                  maxDate={today}
                  onChange={(date) => onDateChange(date, 'panicAlertSent')}
                  ref={ref}
                  invalidText={error}
                />
              )}
            />
          </ResponsiveWrapper>
        </section>
        <section className={styles.formGroup}>
          <ResponsiveWrapper>
            <Controller
              name="dispatchDate"
              control={control}
              render={({ field: { onChange, value, ref } }) => (
                <OpenmrsDatePicker
                  id="dispatchDate"
                  labelText={t('dispatchDate', 'Dispatch date')}
                  value={dateOfSampleCollection}
                  maxDate={today}
                  onChange={(date) => onDateChange(date, 'dispatchDate')}
                  ref={ref}
                  invalidText={error}
                />
              )}
            />
          </ResponsiveWrapper>
        </section>
        <section className={styles.formGroup}>
          <ResponsiveWrapper>
            <Controller
              name="labID"
              control={control}
              render={({ field: { onChange, onBlur, value, ref } }) => (
                <TextInput
                  id="labID"
                  value={value}
                  labelText="Lab ID:"
                  placeholder="Lab ID"
                  onChange={onChange}
                  onBlur={onBlur}
                  ref={ref}
                />
              )}
            />
          </ResponsiveWrapper>
        </section>
        <section className={styles.formGroup}>
          <ResponsiveWrapper>
            <Controller
              name="testingLabName"
              control={control}
              render={({ field: { onChange, onBlur, value, ref } }) => (
                <TextInput
                  id="testingLabName"
                  value={value}
                  labelText="Testing lab name:"
                  placeholder="Testing lab name"
                  onChange={onChange}
                  onBlur={onBlur}
                  ref={ref}
                />
              )}
            />
          </ResponsiveWrapper>
        </section>
        <section className={styles.formGroup}>
          <ResponsiveWrapper>
            <Controller
              name="specimenReceivedDate"
              control={control}
              render={({ field: { onChange, value, ref } }) => (
                <OpenmrsDatePicker
                  id="specimenReceivedDate"
                  labelText={t('specimenReceivedDate', 'Specimen received date')}
                  value={dateOfSampleCollection}
                  maxDate={today}
                  onChange={(date) => onDateChange(date, 'specimenReceivedDate')}
                  ref={ref}
                  invalidText={error}
                />
              )}
            />
          </ResponsiveWrapper>
        </section>
        <section className={styles.formGroup}>
          <ResponsiveWrapper>
          <Controller
                name="specimenQuality"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <div className={styles.row}>
                    <Dropdown
                      id="specimenQuality"
                      label={t('pleaseSelect', 'Please select')}
                      titleText={t('specimenQuality', 'Specimen quality')}
                      // items={immunizationsConceptSet?.answers?.map((item) => item.uuid) || []}
                      // itemToString={(item) =>
                      //   immunizationsConceptSet?.answers.find((candidate) => candidate.uuid == item)?.display
                     // }
                      onChange={(val) => onChange(val.selectedItem)}
                      selectedItem={value}
                      //invalid={!!errors?.vaccineUuid}
                    />
                  </div>
                )}
              />
          </ResponsiveWrapper>
        </section>
        <section className={styles.formGroup}>
          <ResponsiveWrapper>
            <Controller
              name="reason"
              control={control}
              render={({ field: { onChange, onBlur, value, ref } }) => (
                <TextInput
                  id="reason"
                  value={value}
                  labelText="Reason:"
                  placeholder="Reason"
                  onChange={onChange}
                  onBlur={onBlur}
                  ref={ref}
                />
              )}
            />
          </ResponsiveWrapper>
        </section>
        <section className={styles.formGroup}>
          <ResponsiveWrapper>
          <Controller
      //key={reaction.uuid}
      name="instrumentUsed"
      control={control}
      defaultValue=""
      render={({ field: { onBlur, onChange, value } }) => (
        <Checkbox
          //className={styles.checkbox}
          labelText="Instrument Used"
          id="instrumentUsed"
          // onChange={(event, { checked, id }) => {
          //   handleAllergicReactionChange(onChange, checked, id, index);
          // }}
          checked={Boolean(value)}
          onBlur={onBlur}
        />
      )}
    />
          </ResponsiveWrapper>
        </section>
        <section className={styles.formGroup}>
          <ResponsiveWrapper>
            <Controller
              name="tempratureOnArrival"
              control={control}
              render={({ field: { onChange, onBlur, value, ref } }) => (
                <TextInput
                  id="tempratureOnArrival"
                  value={value}
                  labelText="Temprature On Arrival:"
                  placeholder="Temprature On Arrival"
                  onChange={onChange}
                  onBlur={onBlur}
                  ref={ref}
                />
              )}
            />
          </ResponsiveWrapper>
        </section>
        <section className={styles.formGroup}>
          <ResponsiveWrapper>
            <Controller
              name="resultReceivedDate"
              control={control}
              render={({ field: { onChange, value, ref } }) => (
                <OpenmrsDatePicker
                  id="resultReceivedDate"
                  labelText={t('resultReceivedDate', 'Date result reached to Facility')}
                  value={dateOfSampleCollection}
                  maxDate={today}
                  onChange={(date) => onDateChange(date, 'resultReceivedDate')}
                  ref={ref}
                  invalidText={error}
                />
              )}
            />
          </ResponsiveWrapper>
        </section>
        <section className={styles.formGroup}>
          <ResponsiveWrapper>
            <Controller
              name="resultReceivedBy"
              control={control}
              render={({ field: { onChange, onBlur, value, ref } }) => (
                <TextInput
                  id="resultReceivedBy"
                  value={value}
                  labelText="Result Received By:"
                  placeholder="Result Received By"
                  onChange={onChange}
                  onBlur={onBlur}
                  ref={ref}
                />
              )}
            />
          </ResponsiveWrapper>
        </section>
        <ButtonSet className={styles.buttonSet}>
          <Button
            onClick={() => closeWorkspaceHandler('viral-load-result-workspace')}
            style={{ maxWidth: 'none', width: '50%' }}
            className={styles.button}
            kind="secondary"
          >
            {t('discard', 'Discard')}
          </Button>
          <Button style={{ maxWidth: 'none', width: '50%' }} className={styles.button} kind="primary" type="submit">
            {encounter ? t('saveAndClose', 'update and close') : t('saveAndClose', 'Save and close')}
          </Button>
        </ButtonSet>
        </Stack>
    </Form>
  );
};

export default ViralLoadResult;
