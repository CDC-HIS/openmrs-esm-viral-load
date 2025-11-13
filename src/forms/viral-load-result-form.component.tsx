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
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Select, SelectItem, Stack } from '@carbon/react';
import { TextInput } from '@carbon/react';
import { Button } from '@carbon/react';
import { fetchLocation, getPatientEncounters, getPatientInfo, saveEncounter, saveVlTestResult } from '../api/api';
import {
  FOLLOWUP_ENCOUNTER_TYPE_UUID,
  VIRALLOAD_ENCOUNTER_TYPE_UUID,
  VIRALLOAD_RESULT_FORM_UUID,
  viralLoadFieldConcepts,
} from '../constants';
import dayjs from 'dayjs';
import { useVLRequestOrders } from '../viral-load/viral-load.resource';
import type { OpenmrsEncounter } from '../types';
import { getObsFromEncounter } from '../utils/encounter-utils';
import { ButtonSet } from '@carbon/react';
import { NumberInput } from '@carbon/react';
import { RadioButtonGroup } from '@carbon/react';
import { RadioButton } from '@carbon/react';
import { Dropdown } from '@carbon/react';
import { Checkbox } from '@carbon/react';
import { InlineLoading } from '@carbon/react';
import { Accordion } from '@carbon/react';
import { AccordionItem } from '@carbon/react';

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

  const [testDate, settestDate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const today = new Date();
  const [notification, setNotification] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  const { control, handleSubmit, setValue, watch } = useForm<ResultFormInputs>();
  const [facilityLocationUUID, setFacilityLocationUUID] = useState('');
  const [facilityLocationName, setFacilityLocationName] = useState('');
  const [selectedField, setSelectedField] = useState<keyof ResultFormInputs | null>(null);

  const encounterDatetime = new Date().toISOString();
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const {
    encounterId,
    resultDate,
    testResultDate,
    id,
    uuid,
    resultStatus,
    exchangeStatus,
    reviewedBy,
    aletSentDate,
    dispatchedDate,
    labId,
    labName,
    specimenReceivedDate,
    specimenQuality,
    reasonQuality,
    instrumentUsed,
    temperatureOnArrival,
    resultReachedToFacDate,
    resultReceivedByFacility,
    testResult,
    testedBy,
    requestedDate,
    orderStatus,
    specimenSentToReferralDate,
  } = encounter;
  const isSaveDisabled = resultStatus == 'ETTORS' || resultStatus === 'MANUAL_FOLLOWUP';
  const editResult = resultStatus === 'MANUAL_ETTORS';
  // const isRequestSent = exchangeStatus === 'SENT';
  // const isRequestComplete = orderStatus === 'INCOMPLETE';

  // Fetch patient encounters
  const { vlRequestOrders, isError, mutate } = useVLRequestOrders(patientUuid);

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

  useEffect(() => {
    if (encounter) {
      //const { id,resultDate, reqDate, requestedDate, dateOfSampleCollectionDate, dateOfSpecimenSent, providerName, providerTelephoneNumber } = encounter;

      if (testResultDate && dayjs(testResultDate).isValid()) {
        setValue('testDate', dayjs(testResultDate).format('YYYY-MM-DD'));
        settestDate(dayjs(testResultDate).format('YYYY-MM-DD'));
      } else {
        setValue('testDate', ''); // or default value
      }

      if (testResult !== '--') {
        setValue('viralLoadCount', testResult);
      } else {
        setValue('viralLoadCount', '');
      }

      if (testedBy !== '--') {
        setValue('testedBy', testedBy);
      } else {
        setValue('testedBy', '');
      }

      setValue('reviewedBy', reviewedBy);

      if (aletSentDate && dayjs(aletSentDate).isValid()) {
        setValue('panicAlertSent', dayjs(aletSentDate).format('YYYY-MM-DD'));
        //settestDate(dayjs(aletSentDate).format('YYYY-MM-DD'));
      } else {
        setValue('panicAlertSent', ''); // or default value
      }

      if (dispatchedDate && dayjs(dispatchedDate).isValid()) {
        setValue('dispatchDate', dayjs(dispatchedDate).format('YYYY-MM-DD'));
        //settestDate(dayjs(aletSentDate).format('YYYY-MM-DD'));
      } else {
        setValue('dispatchDate', ''); // or default value
      }

      setValue('labID', labId);
      setValue('testingLabName', labName);

      if (specimenReceivedDate && dayjs(specimenReceivedDate).isValid()) {
        setValue('specimenReceivedDate', dayjs(specimenReceivedDate).format('YYYY-MM-DD'));
        //settestDate(dayjs(aletSentDate).format('YYYY-MM-DD'));
      } else {
        setValue('specimenReceivedDate', ''); // or default value
      }
      if (specimenQuality) {
        setValue('specimenQuality', specimenQuality);
      }

      setValue('reason', reasonQuality);
      if (instrumentUsed) {
        setValue('instrumentUsed', instrumentUsed);
      }

      setValue('tempratureOnArrival', temperatureOnArrival);

      if (resultReachedToFacDate && dayjs(resultReachedToFacDate).isValid()) {
        setValue('resultReceivedDate', dayjs(resultReachedToFacDate).format('YYYY-MM-DD'));
        //settestDate(dayjs(aletSentDate).format('YYYY-MM-DD'));
      } else {
        setValue('resultReceivedDate', ''); // or default value
      }

      setValue('resultReceivedBy', resultReceivedByFacility);
    }
  }, [
    encounter,
    setValue,
    aletSentDate,
    dispatchedDate,
    labId,
    labName,
    reasonQuality,
    testResultDate,
    resultReachedToFacDate,
    resultReceivedByFacility,
    reviewedBy,
    specimenReceivedDate,
    temperatureOnArrival,
    testResult,
    testedBy,
    specimenQuality,
    instrumentUsed,
  ]);

  type DateFieldKey =
    | 'testDate'
    | 'requestedDate'
    | 'panicAlertSent'
    | 'dispatchDate'
    | 'resultReceivedDate'
    | 'specimenReceivedDate'
    | 'dateOfSpecimenSent'
    | 'dateOfSampleCollectionDate'
    | 'requestedDate';

  const onDateChange = (value: any, dateField: DateFieldKey) => {
    try {
      const jsDate = new Date(value);
      if (isNaN(jsDate.getTime())) {
        throw new Error('Invalid Date');
      }
      const formattedDate =
        dateField === 'dateOfSampleCollectionDate'
          ? dayjs(jsDate).format('YYYY-MM-DD HH:mm:ss') // Include time for datetime field
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
  const resultFormInputs = useWatch({ control });

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

    const abortController = new AbortController();

    const vlResultPayload = {
      encounterId,
      patientUuid,
      testResultDate: fieldValues.testDate || '',
      testResult: fieldValues.viralLoadCount || '',
      testedBy: fieldValues.testedBy || '',
      reviewedBy: fieldValues.reviewedBy || '',
      aletSentDate: fieldValues.panicAlertSent || '',
      dispatchedDate: fieldValues.dispatchDate || '',
      labId: fieldValues.labID || '',
      labName: fieldValues.testingLabName || '',
      specimenReceivedDate: fieldValues.specimenReceivedDate || '',
      specimenQuality: fieldValues.specimenQuality,
      reason: fieldValues.reason || '',
      instrumentUsed: fieldValues.instrumentUsed || '',
      temperatureOnArrival: fieldValues.tempratureOnArrival || '',
      resultReachedToFacDate: fieldValues.resultReceivedDate || '',
      resultReceivedByFacility: fieldValues.resultReceivedBy || '',
      resultStatus: 'MANUAL_ETTORS',
    };
    const apiPayload = {
      ...vlResultPayload,
      patientUUID: vlResultPayload.patientUuid, // Map patientUUID to patientUuid
    };
    delete apiPayload.patientUuid;
    setIsSubmitting(true);

    try {
      await saveVlTestResult(new AbortController(), apiPayload, uuid);
      showSnackbar({
        isLowContrast: true,
        title: t('saveEntry', 'Record Saved'),
        kind: 'success',
        subtitle: t('viralLoadTestResultSavedSuccessfully', 'The viral load test result has been saved.'),
      });
      //     saveVlTestResult(abortController, vlResultPayload, id)
      // .then((response) => {
      //   console.log('Saved VL Test Request Result:', response);
      // })
      // .catch((error) => {
      //   console.error('Failed to save:', error);
      // });
      // Check if we are editing an existing encounter
      // if (encounter?.uuid) {
      //   // Update the existing encounter
      //   await updateEncounter(encounter.uuid, payload); // Pass UUID first, then payload
      //   showSnackbar({
      //     isLowContrast: true,
      //     title: t('updatedEntry', 'Record Updated'),
      //     kind: 'success',
      //     subtitle: t('viralLoadEncounterUpdatedSuccessfully', 'The patient encounter was updated'),
      //   });
      // } else {
      //   // Create a new encounter if none exists
      //   await createEncounter(payload);
      //   showSnackbar({
      //     isLowContrast: true,
      //     title: t('saveEntry', 'Record Saved'),
      //     kind: 'success',
      //     subtitle: t('viralLoadEncounterCreatedSuccessfully', 'A new encounter was created'),
      //   });
      // }

      mutate();
      closeWorkspaceHandler('viral-load-result-workspace');
      return true;
    } catch (error) {
      console.error('Error saving encounter:', error);
    } finally {
      setIsSubmitting(false); // Reset submitting state
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
    // <Form cclassName={styles.formNew} onSubmit={handleSubmit(handleFormSubmit)} data-testid="viral-load-result-form">
    //   <div>
    //   <Stack gap={1} className={styles.container}>

    //     <div className={styles.fieldWrapper}>
    //     <section>
    <Form onSubmit={handleSubmit(handleFormSubmit)} data-testid="viral-load-result-form" className={styles.formNew}>
      <div>
        <Stack gap={1} className={styles.container}>
          <Accordion>
            <AccordionItem title="TESTING LABORATORY INFORMATION" open className={styles.formContainer}>
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
            </AccordionItem>
            <AccordionItem title="SPECIMEN INFORMATION" open className={styles.formContainer}>
              <section>
                <ResponsiveWrapper>
                  <Controller
                    name="specimenReceivedDate"
                    control={control}
                    render={({ field: { onChange, value, ref }, fieldState }) => {
                      const testDate = watch('testDate');
                      return (
                        <>
                          <OpenmrsDatePicker
                            id="specimenReceivedDate"
                            labelText={t('specimenReceivedDate', 'Specimen received date')}
                            value={value}
                            minDate={testDate}
                            maxDate={today}
                            onChange={(date) => onDateChange(date, 'specimenReceivedDate')}
                            ref={ref}
                            invalid={!!fieldState.error}
                          />
                          {fieldState.error && <div className={styles.errorMessage}>{fieldState.error.message}</div>}
                        </>
                      );
                    }}
                  />
                </ResponsiveWrapper>
              </section>
              {/* <section className={styles.formGroup}>
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
        </section> */}
              <section className={styles.formGroup}>
                <ResponsiveWrapper>
                  <Controller
                    name="specimenQuality"
                    control={control}
                    defaultValue={null} // Ensure a default value for the controlled component
                    render={({ field: { onChange, value }, fieldState: { error } }) => (
                      <div className={styles.row}>
                        <Dropdown
                          id="specimenQuality"
                          label={t('pleaseSelect', 'Please select')}
                          titleText={t('specimenQuality', 'Specimen quality')}
                          items={['Acceptable', 'Unacceptable']} // Specify the dropdown options
                          itemToString={(item) => item || ''} // Convert item to string for display
                          onChange={(event) => onChange(event.selectedItem)} // Handle selection
                          selectedItem={value || null} // Ensure selectedItem is controlled
                          invalid={!!error} // Show invalid state if there's an error
                          invalidText={error?.message} // Display error message
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
              <section>
                <ResponsiveWrapper>
                  <Controller
                    name="instrumentUsed"
                    control={control}
                    defaultValue="" // Initialize as an empty string
                    render={({ field: { onChange, value } }) => (
                      <div role="group" aria-labelledby="instrumentUsedLegend">
                        <legend id="instrumentUsedLegend" style={{ marginBottom: '1rem', fontWeight: 'bold' }}>
                          Instrument Used
                        </legend>

                        {/* Abbot Checkbox */}
                        <Checkbox
                          id="instrumentUsedAbbot"
                          labelText="Abbot"
                          checked={value.includes('Abbot')}
                          onChange={(event) => {
                            const newValue = event.target.checked
                              ? value
                                ? `${value}, Abbot`
                                : 'Abbot' // Append 'Abbot' if checked
                              : value.replace(', Abbot', '').replace('Abbot', ''); // Remove 'Abbot' if unchecked
                            onChange(newValue);
                          }}
                        />

                        {/* Roche Checkbox */}
                        <Checkbox
                          id="instrumentUsedRoche"
                          labelText="Roche"
                          checked={value.includes('Roche')}
                          onChange={(event) => {
                            const newValue = event.target.checked
                              ? value
                                ? `${value}, Roche`
                                : 'Roche' // Append 'Roche' if checked
                              : value.replace(', Roche', '').replace('Roche', ''); // Remove 'Roche' if unchecked
                            onChange(newValue);
                          }}
                        />

                        {/* Xpert Checkbox */}
                        <Checkbox
                          id="instrumentUsedXpert"
                          labelText="Xpert"
                          checked={value.includes('Xpert')}
                          onChange={(event) => {
                            const newValue = event.target.checked
                              ? value
                                ? `${value}, Xpert`
                                : 'Xpert' // Append 'Xpert' if checked
                              : value.replace(', Xpert', '').replace('Xpert', ''); // Remove 'Xpert' if unchecked
                            onChange(newValue);
                          }}
                        />
                      </div>
                    )}
                  />
                </ResponsiveWrapper>
              </section>
            </AccordionItem>
            <AccordionItem title="TEST RESULT" open className={styles.formContainer}>
              <section>
                <ResponsiveWrapper>
                  <Controller
                    name="testDate"
                    control={control}
                    render={({ field: { onChange, value, ref } }) => (
                      <OpenmrsDatePicker
                        id="testDate"
                        //labelText={t('testDate', 'Test Date')}
                        labelText={
                          <>
                            {t('testDate', 'Test Date:')}
                            <span className={styles.required}>*</span>
                          </>
                        }
                        value={value}
                        minDate={specimenSentToReferralDate}
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
                    rules={{
                      required: 'Test result is required', // Optional: Customize this validation message
                      validate: (value) => {
                        // Ensure the value is a non-negative integer
                        return Number.isInteger(Number(value)) && Number(value) >= 0
                          ? true
                          : 'Please enter a valid number (0 or greater, no fractions)';
                      },
                    }}
                    render={({ field, fieldState: { error } }) => (
                      <>
                        <NumberInput
                          allowEmpty
                          className={styles.numberInput}
                          disableWheel
                          hideSteppers
                          id="viralLoadCount"
                          label={
                            <>
                              {t('testResult', 'Test Result')}
                              <span className={styles.required}>*</span>
                            </>
                          }
                          onChange={(event) => field.onChange(event.target.value)}
                          value={field.value || ''}
                        />
                        {error && <span className={styles.error}>{error.message}</span>}
                      </>
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
              <section>
                <ResponsiveWrapper>
                  <Controller
                    name="panicAlertSent"
                    control={control}
                    render={({ field: { onChange, value, ref }, fieldState }) => {
                      const testDate = watch('testDate');
                      return (
                        <>
                          <OpenmrsDatePicker
                            id="panicAlertSent"
                            labelText={t('panicAlertSent', 'Panic value alert sent')}
                            value={value}
                            minDate={testDate}
                            maxDate={today}
                            onChange={(date) => onDateChange(date, 'panicAlertSent')}
                            ref={ref}
                            invalid={!!fieldState.error}
                          />
                          {fieldState.error && <div className={styles.errorMessage}>{fieldState.error.message}</div>}
                        </>
                      );
                    }}
                  />
                </ResponsiveWrapper>
              </section>
              <section>
                <ResponsiveWrapper>
                  <Controller
                    name="dispatchDate"
                    control={control}
                    render={({ field: { onChange, value, ref }, fieldState }) => {
                      const testDate = watch('testDate');
                      return (
                        <>
                          <OpenmrsDatePicker
                            id="dispatchDate"
                            labelText={t('dispatchDate', 'Dispatch date')}
                            value={value}
                            minDate={testDate}
                            maxDate={today}
                            onChange={(date) => onDateChange(date, 'dispatchDate')}
                            ref={ref}
                            invalid={!!fieldState.error}
                          />
                          {fieldState.error && <div className={styles.errorMessage}>{fieldState.error.message}</div>}
                        </>
                      );
                    }}
                  />
                </ResponsiveWrapper>
              </section>

              {/* <section className={styles.formGroup}>
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
        </section> */}

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
              <section>
                <ResponsiveWrapper>
                  <Controller
                    name="resultReceivedDate"
                    control={control}
                    render={({ field: { onChange, value, ref }, fieldState }) => {
                      const testDate = watch('testDate');
                      return (
                        <>
                          <OpenmrsDatePicker
                            id="resultReceivedDate"
                            labelText={t('resultReceivedDate', 'Date result reached to Facility')}
                            value={value}
                            minDate={testDate}
                            maxDate={today}
                            onChange={(date) => onDateChange(date, 'resultReceivedDate')}
                            ref={ref}
                            invalid={!!fieldState.error}
                          />
                          {fieldState.error && <div className={styles.errorMessage}>{fieldState.error.message}</div>}
                        </>
                      );
                    }}
                  />
                </ResponsiveWrapper>
              </section>
              <section className={styles.lastField}>
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
            </AccordionItem>
            <div className={styles.fieldWrapper}></div>
            <ButtonSet className={styles.buttonSet}>
              <Button
                onClick={() => closeWorkspaceHandler('viral-load-result-workspace')}
                style={{ maxWidth: 'none', width: '50%' }}
                className={styles.button}
                kind="secondary"
              >
                {t('discard', 'Discard')}
              </Button>
              <Button
                disabled={isSaveDisabled || isSubmitting}
                style={{ maxWidth: 'none', width: '50%' }}
                className={styles.button}
                kind="primary"
                type="submit"
              >
                {isSubmitting ? (
                  <InlineLoading />
                ) : editResult ? (
                  t('saveAndClose', 'Update Result')
                ) : (
                  t('saveAndClose', 'Save Result')
                )}
                {/* {encounter ? <InlineLoading /> : encounter ? t('saveAndClose', 'Save and close') : t('saveAndClose', 'Save and close')} */}
              </Button>
            </ButtonSet>
          </Accordion>
        </Stack>
      </div>
    </Form>
  );
};

export default ViralLoadResult;
