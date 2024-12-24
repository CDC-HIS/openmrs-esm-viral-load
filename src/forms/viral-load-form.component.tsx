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
import {
  fetchLocation,
  fetchVlTestRequestResult,
  getPatientEncounters,
  getPatientInfo,
  saveEncounter,
  saveVlTestRequestResult,
} from '../api/api';
import {
  FOLLOWUP_ENCOUNTER_TYPE_UUID,
  VIRALLOAD_ENCOUNTER_TYPE_UUID,
  VIRALLOAD_FORM_UUID,
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
  | 'reqDate',
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
  const [reqDate, setrequestedDate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const today = new Date();
  const [notification, setNotification] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  const { control, handleSubmit, setValue, watch } = useForm<FormInputs>();
  const [facilityLocationUUID, setFacilityLocationUUID] = useState('');
  const [facilityLocationName, setFacilityLocationName] = useState('');
  const [selectedField, setSelectedField] = useState<keyof FormInputs | null>(null);

  const specimenTypeMapDB = {
    DBS: 'DBS',
    'Whole blood': 'Whole blood',
    Plasma: 'Plasma',
    'DPS (Dried Plasma Spot)': 'DPS (Dried Plasma Spot)',
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
  const {
    specimenType,
    orderStatus,
    exchangeStatus,
    encounterId,
    id,
    requestedDate,
    specimenCollectedDate,
    providerPhoneNo,
    specimenSentToReferralDate,
    requestedBy,
  } = encounter;
  const isSaveDisabled = exchangeStatus === 'SENT';

  const { clearErrors } = useForm({
    defaultValues: {
      dateOfSampleCollectionDate: null,
      dateOfSpecimenSent: null,
    },
  });

  // Fetch patient encounters
  const { vlRequestOrders, isError, isLoading: isLoadingVLRequests, mutate } = useVLRequestOrders(patientUuid);

  useEffect(() => {
    (async function () {
      const vlOrder = await fetchVlTestRequestResult(patientUuid);
    });
  }, [patientUuid]);

  // Load existing encounter data if editing
  useEffect(() => {
    if (requestedDate && dayjs(requestedDate).isValid()) {
      setValue('reqDate', dayjs(requestedDate).format('YYYY-MM-DD'));
      setrequestedDate(dayjs(requestedDate).format('YYYY-MM-DD'));
    } else {
      setValue('reqDate', ''); // or default value
    }

    if (specimenCollectedDate && dayjs(specimenCollectedDate).isValid()) {
      setValue('dateOfSampleCollectionDate', dayjs(specimenCollectedDate).format('YYYY-MM-DD'));
    } else {
      setValue('dateOfSampleCollectionDate', ''); // or default value
    }

    setValue('providerTelephoneNumber', providerPhoneNo);
    setValue('providerName', requestedBy);

    setValue('specimenType', specimenType);

    //setValue('specimenType', specimenTypeMapDB[specimenType]);

    if (specimenSentToReferralDate && dayjs(specimenSentToReferralDate).isValid()) {
      setValue('dateOfSpecimenSent', dayjs(specimenSentToReferralDate).format('YYYY-MM-DD'));
    } else {
      setValue('dateOfSpecimenSent', ''); // or default value
    }
  }, [
    encounter,
    setValue,
    specimenType,
    reqDate,
    providerPhoneNo,
    requestedBy,
    specimenCollectedDate,
    specimenSentToReferralDate,
    requestedDate,
  ]);

  type DateFieldKey = 'dateOfSpecimenSent' | 'dateOfSampleCollectionDate' | 'reqDate';

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

  useEffect(() => {
    const subscription = watch((values) => {
      if (values.dateOfSampleCollectionDate || values.dateOfSpecimenSent) {
        clearErrors(); // Clear errors dynamically when dates change
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, clearErrors]);

  const handleFormSubmit = async (fieldValues: FormInputs) => {
    const abortController = new AbortController();

    const vlResultPayload = {
      encounterId,
      patientUuid,
      specimenCollectedDate: fieldValues.dateOfSampleCollectionDate,
      specimenSentToReferralDate: fieldValues.dateOfSpecimenSent,
      specimenType: specimenTypeMapDB[fieldValues.specimenType],
      requestedBy: fieldValues.providerName,
      requestedDate: fieldValues.reqDate,
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
            title: t('updatedEntry', 'Order Updated'),
            kind: 'success',
            subtitle: t('viralLoadEncounterUpdatedSuccessfully', 'The patient vl-order was updated'),
          });
          mutate();
          closeWorkspaceHandler('ettors-workspace');
        })
        .catch((error) => {
          console.error('Failed to save:', error);
        });

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
                required: t('requiredField', 'Date specimen collected is required'), // Ensure the field is required
              }}
              render={({ field: { onChange, value, ref }, fieldState }) => {
                const sentDate = watch('dateOfSpecimenSent'); // Dynamically watch the sent date
                const requestDate = watch('reqDate');
                return (
                  <>
                    <OpenmrsDatePicker
                      id="dateOfSampleCollectionDate"
                      //labelText={t('dateOfSampleCollection', 'Date specimen collected')}
                      labelText={
                        <>
                          {t('dateOfSampleCollection', 'Date specimen collected:')}
                          <span className={styles.required}>*</span>
                        </>
                      }
                      value={value}
                      minDate={requestDate}
                      maxDate={sentDate || today} // Max date is the sent date or today if not set
                      onChange={(date) => onDateChange(date, 'dateOfSampleCollectionDate')}
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
              name="dateOfSpecimenSent"
              control={control}
              rules={{
                required: t('requiredField', 'This field is required'),
              }}
              render={({ field: { onChange, value, ref }, fieldState }) => {
                const sampleDate = watch('dateOfSampleCollectionDate'); // Dynamically watch the collection date
                const requestDate = watch('reqDate');
                return (
                  <>
                    <OpenmrsDatePicker
                      id="dateOfSpecimenSent"
                      //labelText={t('dateOfSpecimenSent', 'Date specimen sent to referral lab.')}
                      labelText={
                        <>
                          {t('dateOfSpecimenSent', 'Date specimen sent to referral lab:')}
                          <span className={styles.required}>*</span>
                        </>
                      }
                      value={value}
                      minDate={sampleDate || requestDate} // Min date is the sample collection date or null if not set
                      maxDate={today}
                      onChange={(date) => onDateChange(date, 'dateOfSpecimenSent')}
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
        {/* <section>
        <ResponsiveWrapper>
          <Controller
            name="specimenType"
            control={control}
            rules={{
              required: t('specimenType', 'This field is required'),                  
            }}
            render={({ field: { onChange, value, onBlur }, fieldState }) => (
              <>
              <RadioButtonGroup
                //legendText="Specimen Type"
                legendText={
                  <>
                    {t('specimenType', 'Specimen Type')} 
                    <span className={styles.required}>*</span>
                  </>
                }
                name="specimenType"
                onChange={(newValue) => {
                  onChange(newValue);
                  setSelectedField('specimenType'); // Set the selected field for clear action
                }}
                orientation="vertical"
                value={value}
                onBlur={onBlur}
                invalid={!!fieldState.error} // Highlight error state
                error={fieldState.error?.message} // Display error message
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
              {fieldState.error && (
                <div className={styles.errorMessage}>{fieldState.error.message}</div>
              )}
              </>
            )}
          />
        </ResponsiveWrapper>
        </section> */}
        <Controller
          name="specimenType"
          control={control}
          rules={{ required: t('required', 'Specimen type is required') }}
          defaultValue=""
          render={({ field }) => (
            <RadioButtonGroup
              orientation="vertical"
              legendText={
                <>
                  {t('specimenType', 'Specimen Type')}
                  <span className={styles.required}>*</span>
                </>
              }
              {...field}
              valueSelected={field.value}
              onChange={(value) => field.onChange(value)}
            >
              {Object.entries(specimenTypeMapDB).map(([key, label]) => (
                <RadioButton key={key} id={key} labelText={label} value={key} />
              ))}
            </RadioButtonGroup>
          )}
        />
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
              name="reqDate"
              control={control}
              render={({ field: { onChange, value, ref }, fieldState }) => (
                <>
                  <OpenmrsDatePicker
                    id="reqDate"
                    //labelText={t('requestedDate', 'Requested Date:')}
                    labelText={
                      <>
                        {t('reqDate', 'Requested Date:')}
                        <span className={styles.required}>*</span>
                      </>
                    }
                    value={value}
                    maxDate={today}
                    onChange={(date) => onDateChange(date, 'reqDate')}
                    ref={ref}
                    invalidText={error}
                    isDisabled={true}
                    isRequired={true}
                  />
                  {fieldState.error && <div className={styles.errorMessage}>{fieldState.error.message}</div>}
                </>
              )}
            />
          </ResponsiveWrapper>
        </section>
        <section className={styles.lastField}>
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
          <Button
            disabled={isSaveDisabled}
            style={{ maxWidth: 'none', width: '50%' }}
            className={styles.button}
            kind="primary"
            type="submit"
          >
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
