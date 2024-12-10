import React, { useEffect, useState } from 'react';
import type { TFunction } from 'react-i18next';
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
import { fetchLocation, fetchVlTestRequestResult, getPatientEncounters, getPatientInfo, saveEncounter, saveVlTestRequestResult } from '../api/api';
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
import { FormGroup } from '@carbon/react';
import { errors } from '@playwright/test';

interface ResponsiveWrapperProps {
  children: React.ReactNode;
  isTablet: boolean;
}

interface RequiredFieldLabelProps {
  label: string;
  t: TFunction;
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

const ViralLoadForm: React.FC<ViralLoadFormProps> = ({ patientUuid, encounter }) => {
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

  const specimenTypeMap = {
    'f3e5d62c-d420-4015-b77c-677c3d50ecfa': 'DBS',
    '161939AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA': 'Whole blood',
    '1002AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA': 'Plasma',
    '46f5752c-b204-4926-b60d-df263633c93e': 'DPS (Dried Plasma Spot)',
  };

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
  const { orderStatus,encounterId, id, reqDate, specimenCollectedDateGC, providerPhoneNo, specimenSentToReferralDateGC, requestedBy } = encounter;
  const isSaveDisabled = orderStatus === 'COMPLETE';

  const { clearErrors } = useForm({
    defaultValues: {
      dateOfSampleCollectionDate: null,
      dateOfSpecimenSent: null,
    },
  });
  

  // Fetch patient encounters
  const { encounters, isError, isLoading, mutate } = useEncounters(patientUuid, VIRALLOAD_ENCOUNTER_TYPE_UUID);

  useEffect(() => {
    (async function () {
      const vlOrder = await fetchVlTestRequestResult(patientUuid);
    })

  }, [patientUuid]);
  
  
  // Load existing encounter data if editing
  useEffect(() => {
    if (reqDate && dayjs(reqDate).isValid()) {
      setValue('requestedDate', dayjs(reqDate).format('YYYY-MM-DD'));
      setrequestedDate(dayjs(reqDate).format('YYYY-MM-DD'));
      
    } else {
      setValue('requestedDate', ''); // or default value
    }

    if (specimenCollectedDateGC && dayjs(specimenCollectedDateGC).isValid()) {
      setValue('dateOfSampleCollectionDate', dayjs(specimenCollectedDateGC).format('YYYY-MM-DD'));
      
    } else {
      setValue('dateOfSampleCollectionDate', ''); // or default value
    }
    
    setValue('providerTelephoneNumber', providerPhoneNo);
    setValue('providerName', requestedBy);

    if (specimenSentToReferralDateGC && dayjs(specimenSentToReferralDateGC).isValid()) {
      setValue('dateOfSpecimenSent', dayjs(specimenSentToReferralDateGC).format('YYYY-MM-DD'));
      
    } else {
      setValue('dateOfSpecimenSent', ''); // or default value
    }
  }, [encounter, setValue, reqDate, providerPhoneNo, requestedBy, specimenCollectedDateGC, specimenSentToReferralDateGC]);
  
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


  useEffect(() => {
    const subscription = watch((values) => {
      if (values.dateOfSampleCollectionDate || values.dateOfSpecimenSent) {
        clearErrors(); // Clear errors dynamically when dates change
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, clearErrors]);

  const handleFormSubmit = async (fieldValues: FormInputs) => {
    // const obs = [];
    
    // // Prepare observations from field values
    // Object.keys(fieldValues).forEach((key) => {
    //   if (fieldValues[key]) {
    //     obs.push({
    //       concept: viralLoadFieldConcepts[key],
    //       formFieldNamespace: 'rfe-forms',
    //       formFieldPath: `rfe-forms-${key}`,
    //       value: formatValue(fieldValues[key]),
    //     });
    //   }
    // });

    // Construct the base payload
    // const payload = {
    //   encounterDatetime,
    //   encounterProviders,
    //   encounterType,
    //   form,
    //   location,
    //   patient,
    //   orders,
    //   obs: obs,
    // };

    const abortController = new AbortController();

    const vlResultPayload = {
      encounterId,
      patientUuid,
      specimenCollectedDate: fieldValues.dateOfSampleCollectionDate,
      specimenSentToReferralDate: fieldValues.dateOfSpecimenSent,
      specimenType: specimenTypeMap[fieldValues.specimenType],
      requestedBy: fieldValues.providerName,
      requestedDate: fieldValues.requestedDate,
      providerPhoneNo: fieldValues.providerTelephoneNumber,
      orderStatus: 'COMPLETE',
    };

    const apiPayload = {
      ...vlResultPayload,
      patientUUID: vlResultPayload.patientUuid, // Map patientUUID to patientUuid
    };
    delete apiPayload.patientUuid;

    try {
      // Check if we are editing an existing encounter
      saveVlTestRequestResult(abortController, apiPayload)
  .then((response) => {
    showSnackbar({
      isLowContrast: true,
      title: t('updatedEntry', 'Record Updated'),
      kind: 'success',
      subtitle: t('viralLoadEncounterUpdatedSuccessfully', 'The patient encounter was updated'),
    });
    mutate();
      closeWorkspaceHandler('ettors-workspace');
  })
  .catch((error) => {
    console.error('Failed to save:', error);
  });
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

      // mutate();
      // closeWorkspaceHandler('ettors-workspace');
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
      <Stack gap={1} className={styles.container}>
      <section className={styles.formGroup}>
          <ResponsiveWrapper>
            <Controller
              name="dateOfSampleCollectionDate"
              control={control}
              rules={{
                required: t('requiredField', 'This field is required'), // Ensure the field is required
              }}
              render={({ field: { onChange, value, ref }, fieldState }) => (
                <>
                <OpenmrsDatePicker
                  id="dateOfSampleCollectionDate"
                  labelText={t('dateOfSampleCollection', 'Date specimen collected')}
                  value={value}
                  maxDate={today}
                  onChange={(date) => onDateChange(date, 'dateOfSampleCollectionDate')}
                  ref={ref}
                  invalid={!!fieldState.error}
                />
                {fieldState.error && (
                <div className={styles.errorMessage}>{fieldState.error.message}</div>
                )}
                </>
              )}
            />
          </ResponsiveWrapper>
        </section>
        <section>
        <ResponsiveWrapper>
              <Controller
                name="dateOfSpecimenSent"
                control={control}
                rules={{
                  required: t('requiredField', 'This field is required'),
                  validate: (value) => {
                    const sampleDate = watch('dateOfSampleCollectionDate'); // Dynamically watch the collection date
                    if (!sampleDate) {
                      return t('sampleDateRequired', 'Please provide a date for specimen collection first.');
                    }
                    // if (value < sampleDate) {
                    //   return t(
                    //     'invalidSentDate',
                    //     'The specimen sent date cannot be earlier than the specimen collection date.'
                    //   );
                    // }
                    return true;
                  },
                }}
                render={({ field: { onChange, value, ref }, fieldState }) => (
                  <>
                  <OpenmrsDatePicker
                    id="dateOfSpecimenSent"
                    labelText={t('dateOfSpecimenSent', 'Date specimen sent to referral lab.')}
                    value={value}
                    maxDate={today}
                    onChange={(date) => onDateChange(date, 'dateOfSpecimenSent')}
                    ref={ref}
                    invalid={!!fieldState.error}
                  />
                  {fieldState.error && (
                    <div className={styles.errorMessage}>{fieldState.error.message}</div>
                  )}
                  </>
                )}
              />
        </ResponsiveWrapper>
        </section>
        <section>
        <ResponsiveWrapper>
          <Controller
            name="specimenType"
            control={control}
            render={({ field: { onChange, value, onBlur } }) => (
              <RadioButtonGroup
                legendText="Specimen Type"
                name="specimenType"
                onChange={(newValue) => {
                  onChange(newValue);
                  setSelectedField('specimenType'); // Set the selected field for clear action
                }}
                orientation="vertical"
                value={value}
                onBlur={onBlur}
              >
                <RadioButton
                  id="specimenTypeDBS"
                  labelText="DBS"
                  value={'f3e5d62c-d420-4015-b77c-677c3d50ecfa'}
                  onFocus={() => setSelectedField('specimenType')}
                />
                <RadioButton
                  id="specimenTypeEDTAWholeBlood"
                  labelText="Whole blood"
                  value={'161939AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'}
                  onFocus={() => setSelectedField('specimenType')}
                />
                <RadioButton
                  id="specimenTypePlasma"
                  labelText="Plasma"
                  value={'1002AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'}
                  onFocus={() => setSelectedField('specimenType')}
                />
                <RadioButton
                  id="specimenDPS"
                  labelText="DPS (Dried Plasma Spot)"
                  value={'46f5752c-b204-4926-b60d-df263633c93e'}
                  onFocus={() => setSelectedField('specimenType')}
                />
              </RadioButtonGroup>
            )}
          />
        </ResponsiveWrapper>
        </section>
        <section className={styles.formGroup}>
          <ResponsiveWrapper>
            <Controller
              name="providerName"
              control={control}
              render={({ field: { onChange, onBlur, value, ref } }) => (
                <TextInput
                  id="providerName"
                  value={value}
                  labelText="Requested by:"
                  placeholder="Requested by"
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
                      name="requestedDate"
                      control={control}
                      rules={{
                        required: 'Requested Date is required',
                        validate: (value) => {
                          const specimenSentDate = watch('dateOfSpecimenSent'); // Get the specimen sent date
                          if (!specimenSentDate) {
                            return 'Please provide the specimen sent date first.';
                          }
                          if (value < specimenSentDate) {
                            return 'Requested date cannot be earlier than the specimen sent date.';
                          }
                          return true;
                        },
                      }}
                      render={({ field: { onChange, value, ref }, fieldState  }) => (
                        <>
                        <OpenmrsDatePicker
                          id="requestedDate"
                          labelText={t('requestedDate', 'Requested Date:')}
                          value={value}
                          maxDate={today}
                          onChange={(date) => onDateChange(date, 'requestedDate')}
                          ref={ref}
                          invalidText={error}
                          isDisabled={true}
                          isRequired={true}
                        />
                       {fieldState.error && (
                    <div className={styles.errorMessage}>{fieldState.error.message}</div>
                  )}
                        </>
                      )}
                    />
                </ResponsiveWrapper>
        </section>
        <section className={styles.formGroup}>
          <ResponsiveWrapper>
            <Controller
              name="providerTelephoneNumber"
              control={control}
              render={({ field: { onChange, onBlur, value, ref } }) => (
                <TextInput
                  id="providerTelephoneNumber"
                  value={value}
                  labelText="Telephone:"
                  placeholder="Phone Number"
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
            onClick={() => closeWorkspaceHandler('ettors-workspace')}
            style={{ maxWidth: 'none', width: '50%' }}
            className={styles.button}
            kind="secondary"
          >
            {t('discard', 'Discard')}
          </Button>
          <Button disabled={isSaveDisabled} style={{ maxWidth: 'none', width: '50%' }} className={styles.button} kind="primary" type="submit">
            {encounter ? t('saveAndClose', 'Complete Order') : t('saveAndClose', 'Save and close')}
          </Button>
        </ButtonSet>

        {/* <ButtonSet className={isTablet ? styles.tablet : styles.desktop}>
            <Button
              className={styles.button}
              onClick={() => closeWorkspaceHandler('ettors-workspace')}
              kind="secondary"
            >
              {t('discard', 'Discard')}
            </Button>
            <Button className={styles.button} type="submit">
              {/* {t('saveAndClose', 'Save and close')} */}
        {/* {encounter ? t('saveAndClose', 'update and close') : t('saveAndClose', 'Save and close')}
            </Button>
          </ButtonSet>           */}
      </Stack>
    </Form>
  );

};

function RequiredFieldLabel({ label, t }: RequiredFieldLabelProps) {
  return (
    <span>
      {label}
      <span title={t('required', 'Required')} className={styles.required}>
        *
      </span>
    </span>
  );
}

export default ViralLoadForm;
