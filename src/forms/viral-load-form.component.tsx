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
import { fetchVlTestRequestResult, saveEncounter, saveVlTestRequestResult } from '../api/api';
import dayjs from 'dayjs';
import { useVLRequestOrders } from '../viral-load/viral-load.resource';
import { ButtonSet } from '@carbon/react';
import { NumberInput } from '@carbon/react';
import { RadioButtonGroup } from '@carbon/react';
import { RadioButton } from '@carbon/react';
import { Dropdown } from '@carbon/react';
import { InlineLoading } from '@carbon/react';
import { Accordion } from '@carbon/react';
import { AccordionItem } from '@carbon/react';

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
  | 'reqDate'
  | 'reasonForVlTest'
  | 'routineVLtest'
  | 'targetedVLtest',
  string
>;

type EncounterType = {
  specimenType?: string;
  orderStatus?: string;
  exchangeStatus?: string;
  uuid?: string;
  encounterId?: string;
  id?: string;
  requestedDate?: string;
  specimenCollectedDate?: string;
  providerPhoneNo?: string;
  specimenSentToReferralDate?: string;
  requestedBy?: string;
  targeted?: string;
  routineVl?: string;
};

interface ViralLoadFormProps {
  patientUuid: string;
  encounter?: EncounterType;
  //encounter?: OpenmrsEncounter; // If provided, it means we are editing an encounter
}

const ViralLoadForm: React.FC<ViralLoadFormProps> = ({ patientUuid, encounter }) => {
  const { t } = useTranslation();
  const [reqDate, setrequestedDate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const today = new Date();
  //const { control, handleSubmit, setValue, watch } = useForm<FormInputs>();

  const [facilityLocationUUID, setFacilityLocationUUID] = useState('');
  const { control, handleSubmit, setValue, watch, clearErrors, trigger } = useForm<FormInputs>({
    mode: 'onChange', // 🔥 important so errors clear when value changes
  });

  const selectedReason = watch('reasonForVlTest');

  const specimenTypeDisplayMap = {
    DBS: 'DBS',
    'Whole blood': 'Whole blood',
    Plasma: 'Plasma',
    'DPS (Dried Plasma Spot)': 'DPS (Dried Plasma Spot)',
  };
  const reasonForVlTestYesNo = {
    Routine: 'Routine',
    Targeted: 'Targeted',
  };

  const targetedOpt = [
    // {
    //   concept: '9ffb81b7-3d9e-4f72-b1ba-3f60f07e4661',
    //   label: 'Repeat or confirmatory VL: initial viral load greater than 1000',
    //   hide: {
    //     hideWhenExpression: 'true',
    //   },
    // },
    {
      concept: '4c6f2326-480f-449d-9932-fe85019997f6',
      label: 'Suspected Antiretroviral failure',
    },
  ];

  const routineTestOpt = [
    {
      concept: 'd1977f43-83a5-4b32-b589-33b9315e912d',
      label: 'First viral load test at 3 months or longer post ART',
      hide: {
        hideWhenExpression: "pregnant !== '1065AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'",
      },
    },
    {
      concept: 'b450f8e7-f55e-4788-8fb4-de5229db1b10',
      label: 'First viral load test at 6 months or longer post ART',
    },
    {
      concept: 'c616b09a-bcc2-49a9-b47c-7219f7695e91',
      label: 'Second viral load test at 12 months post ART',
    },
    {
      concept: '42a61e3f-e3e9-46a8-96e3-8643f4d476a4',
      label: 'Annual viral load test',
    },
    {
      concept: '89e9a9ee-15d1-424b-be5a-0765822cd35e',
      label: 'At the first antenatal care visit',
      hide: {
        hideWhenExpression: "pregnant !== '1065AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'",
      },
    },
    {
      concept: 'c1f8f2f6-ec39-422b-a305-58ccafec86c3',
      label: 'At 34-36 weeks of gestation',
      hide: {
        hideWhenExpression: "pregnant !== '1065AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'",
      },
    },
    {
      concept: '603faef3-2142-4ee7-8781-aa977ada17a2',
      label: 'Three months after delivery',
      hide: {
        hideWhenExpression: "breastfeeding !== '1065AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'",
      },
    },
    {
      concept: 'd3d6d8e3-0438-4f83-ba9f-ac46eed6782b',
      label: 'Six months after the first viral load test at postnatal period',
      hide: {
        hideWhenExpression: "breastfeeding !== '1065AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'",
      },
    },
    {
      concept: 'd18e5f76-5026-45d1-be18-f14ae936c692',
      label: 'Every six months until MTCT ends',
      hide: {
        hideWhenExpression: "breastfeeding !== '1065AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'",
      },
    },
    {
      concept: '9dbe8de0-c0ca-4bb0-ac46-207dd5ee5caf',
      label:
        'Viral load after EAC: repeat viral load where initial viral load greater than 50 and less than 1000 copies per ml',
    },
    {
      concept: '4afb4baf-14c0-498b-b908-06b33e50476e',
      label: 'Viral load after EAC: confirmatory viral load where initial viral load greater than 1000 copies per ml',
    },
  ];

  // For saving to DB
  const specimenTypeSaveMap = {
    DBS: 'DBS',
    'Whole blood': 'Whole blood',
    Plasma: 'Plasma',
    'DPS (Dried Plasma Spot)': 'DPS',
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    specimenType = '',
    orderStatus = '',
    exchangeStatus = '',
    uuid = '',
    encounterId = 0,
    id = '',
    requestedDate = '',
    specimenCollectedDate = '',
    providerPhoneNo = '',
    specimenSentToReferralDate = '',
    requestedBy = '',
    targeted = '',
    routineVl = '',
  } = encounter || {};
  const isSaveDisabled = exchangeStatus === 'SENT' || exchangeStatus === 'RECEIVED';

  // const { clearErrors } = useForm({
  //   defaultValues: {
  //     dateOfSampleCollectionDate: null,
  //     dateOfSpecimenSent: null,
  //   },
  // });

  // Fetch patient encounters
  const { vlRequestOrders, isError, isLoading: isLoadingVLRequests, mutate } = useVLRequestOrders(patientUuid);

  useEffect(() => {
    (async function () {
      const vlOrder = await fetchVlTestRequestResult(patientUuid);
    });
  }, [patientUuid]);

  useEffect(() => {
    const routineVlMapping: Record<string, string> = {
      'First viral load test at 3 months or longer post ART': 'First viral load test at 3 months or longer post ART',
      'Second VL at 12 months post ART': '2nd VL at 12 months post ART',
      // Add more mappings here as needed
    };
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

    const specimenTypeValueFromDB = specimenType;
    // Convert "DPS" → "DPS (Dried Plasma Spot)" for radio button
    const initialSpecimenType = specimenTypeValueFromDB === 'DPS' ? 'DPS (Dried Plasma Spot)' : specimenTypeValueFromDB;

    setValue('specimenType', initialSpecimenType);

    if (routineVl) {
      setValue('reasonForVlTest', 'Routine');
    }
    if (targeted) {
      setValue('reasonForVlTest', 'Targeted');
    }

    setValue('targetedVLtest', targeted ?? '');
    setValue('routineVLtest', routineVl ?? null);

    // const mappedValue = routineVlMapping[routineVl] ?? routineVl;

    // const routineVlValueFromDB = mappedValue;

    // setValue('routineVLtest', routineVlValueFromDB);

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
    routineVl,
    targeted,
  ]);

  type DateFieldKey = 'dateOfSpecimenSent' | 'dateOfSampleCollectionDate' | 'reqDate';

  // const onDateChange = (value: any, dateField: DateFieldKey) => {
  //   try {
  //     const jsDate = new Date(value);
  //     if (isNaN(jsDate.getTime())) {
  //       throw new Error('Invalid Date');
  //     }
  //     const formattedDate =
  //       dateField === 'dateOfSampleCollectionDate'
  //         ? dayjs(jsDate).format('YYYY-MM-DD HH:mm:ss') // Include time for datetime field
  //         : dayjs(jsDate).format('YYYY-MM-DD');
  //     setValue(dateField, formattedDate); // Dynamically set the value based on the field
  //     setError(null);
  //   } catch (e) {
  //     setError('Invalid date format');
  //   }
  // };
  const onDateChange = (value: any, dateField: DateFieldKey) => {
    if (!value) {
      setValue(dateField, '', { shouldValidate: true });
      return;
    }

    const jsDate = new Date(value);
    if (isNaN(jsDate.getTime())) return;

    const formattedDate =
      dateField === 'dateOfSampleCollectionDate'
        ? dayjs(jsDate).format('YYYY-MM-DD HH:mm:ss')
        : dayjs(jsDate).format('YYYY-MM-DD');

    setValue(dateField, formattedDate, {
      shouldValidate: true, // 🔥 re-run validation
      shouldDirty: true,
    });

    clearErrors(dateField); // 🔥 remove error immediately
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

    // const providerTelephoneNumber = fieldValues.providerTelephoneNumber ? fieldValues.providerTelephoneNumber : 'null';
    // const providerName = fieldValues.providerName ? fieldValues.providerName : 'null';

    const vlResultPayload = {
      uuid,
      encounterId,
      // routineVl: fieldValues.reasonForVlTest === 'Targeted' ? 'null' : fieldValues.routineVLtest,
      // targeted: fieldValues.reasonForVlTest === 'Routine' ? 'null' : fieldValues.targetedVLtest,
      targeted: fieldValues.reasonForVlTest === 'Targeted' ? fieldValues.targetedVLtest : null,
      routineVl: fieldValues.reasonForVlTest === 'Routine' ? fieldValues.routineVLtest : null,
      patientUuid,
      specimenCollectedDate: fieldValues.dateOfSampleCollectionDate,
      specimenSentToReferralDate: fieldValues.dateOfSpecimenSent,
      specimenType: specimenTypeSaveMap[fieldValues.specimenType],
      requestedBy: fieldValues.providerName ? fieldValues.providerName : null,
      requestedDate: fieldValues.reqDate,
      providerPhoneNo: fieldValues.providerTelephoneNumber ? fieldValues.providerTelephoneNumber : null,
      orderStatus: 'COMPLETE',
    };

    const apiPayload = {
      ...vlResultPayload,
      patientUUID: vlResultPayload.patientUuid, // Map patientUUID to patientUuid
    };
    delete apiPayload.patientUuid;
    setIsSubmitting(true);

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

  const sampleDate = watch('dateOfSampleCollectionDate');
  const sentDate = watch('dateOfSpecimenSent'); // Dynamically watch the sent date
  const requestDate = watch('reqDate');

  return (
    <Form onSubmit={handleSubmit(handleFormSubmit)} data-testid="viral-load-form" className={styles.formNew}>
      <div>
        <Stack gap={1} className={styles.container}>
          <Accordion>
            <AccordionItem title="REQUESTER INFORMATION" open className={styles.formContainer}>
              <div className={styles.fieldWrapper}>
                <Controller
                  name="reqDate"
                  control={control}
                  rules={{ required: 'Date VL Requested is required' }}
                  render={({ field, fieldState }) => (
                    <OpenmrsDatePicker
                      id="reqDate"
                      labelText={
                        <span className={styles.label}>
                          {t('reqDate', 'Date VL Requested:')}
                          <span className={styles.required}>*</span>
                        </span>
                      }
                      value={field.value ? new Date(field.value) : null}
                      maxDate={sampleDate || sentDate || today}
                      onChange={(date) => onDateChange(date, 'reqDate')}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      invalid={!!fieldState.error}
                      invalidText={fieldState.error?.message}
                    />
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
                          labelText={
                            <>
                              <span className={styles.label}>{t('providerName', 'Name of Requester:')}</span>
                            </>
                          }
                          //labelText="Name of Requester:"
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
                      name="providerTelephoneNumber"
                      control={control}
                      rules={{
                        validate: (value) => {
                          if (!value) return true;

                          // Starts with +
                          if (value.startsWith('+')) {
                            if (!/^\+\d+$/.test(value)) {
                              return 'Only numbers allowed after +';
                            }
                            if (value.length !== 13) {
                              return 'Phone number with + must be exactly 13 characters';
                            }
                            return true;
                          }

                          // No +
                          if (!/^\d+$/.test(value) && value !== '') {
                            return 'Only numbers allowed';
                          }
                          if (value.length > 10) {
                            return 'Phone number must be less than 10 digits';
                          }

                          return true;
                        },
                      }}
                      render={({ field: { onChange, onBlur, value, ref }, fieldState }) => (
                        <TextInput
                          id="providerTelephoneNumber"
                          value={value ?? ''}
                          labelText={
                            <span className={styles.label}>{t('providerTelephoneNumber', 'Mobile Phone Number:')}</span>
                          }
                          placeholder="Phone Number"
                          invalid={!!fieldState.error}
                          invalidText={fieldState.error?.message}
                          onChange={(e) => {
                            let val = e.target.value;

                            // Allow only digits or a leading +
                            if (/^\+?\d*$/.test(val)) {
                              onChange(val);
                            }
                          }}
                          onBlur={onBlur}
                          ref={ref}
                        />
                      )}
                    />
                  </ResponsiveWrapper>
                </section>
              </div>
            </AccordionItem>
            <AccordionItem title="REASON FOR TEST" open className={styles.formContainer}>
              <Controller
                name="reasonForVlTest"
                control={control}
                rules={{
                  validate: (value) => (value ? true : 'Reason for VL test is required'),
                }}
                render={({ field, fieldState }) => (
                  <RadioButtonGroup
                    orientation="vertical"
                    legendText={
                      <>
                        <span className={styles.label}>
                          {t('reasonForVlTest', 'Reason for VL test')}
                          <span className={styles.required}>*</span>
                        </span>
                      </>
                    }
                    {...field}
                    valueSelected={field.value}
                    invalid={!!fieldState.error}
                    invalidText={fieldState.error?.message}
                    onChange={(value) => field.onChange(value)}
                  >
                    {Object.entries(reasonForVlTestYesNo).map(([key, label]) => (
                      <RadioButton key={key} id={key} labelText={label} value={key} />
                    ))}
                  </RadioButtonGroup>
                )}
              />
              {selectedReason === 'Routine' && (
                <section className={styles.formGroup}>
                  <ResponsiveWrapper>
                    <Controller
                      name="routineVLtest"
                      control={control}
                      render={({ field }) => {
                        return (
                          <Select
                            {...field}
                            id="routineVLtest"
                            //labelText="Routine VL test"
                            labelText={
                              <span className={styles.label}>
                                Routine VL test<span className={styles.required}>*</span>
                              </span>
                            }
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                          >
                            <SelectItem value="" text="Select" className={styles.customSelect} />
                            {routineTestOpt.map((opt) => (
                              <SelectItem key={opt.concept} value={opt.concept} text={opt.label} />
                            ))}
                          </Select>
                        );
                      }}
                    />
                  </ResponsiveWrapper>
                </section>
              )}

              {selectedReason === 'Targeted' && (
                <section className={styles.formGroup}>
                  <ResponsiveWrapper>
                    <Controller
                      name="targetedVLtest"
                      control={control}
                      render={({ field }) => {
                        return (
                          <Select
                            {...field}
                            id="targetedVLtest"
                            //labelText="Targeted VL test"
                            labelText={
                              <span className={styles.label}>
                                Targeted VL test<span className={styles.required}>*</span>
                              </span>
                            }
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                          >
                            <SelectItem value="" text="Select" className={styles.customSelect} />
                            {targetedOpt.map((opt) => (
                              <SelectItem key={opt.concept} value={opt.concept} text={opt.label} />
                            ))}
                          </Select>
                        );
                      }}
                    />
                  </ResponsiveWrapper>
                </section>
              )}
            </AccordionItem>
            <AccordionItem title="TO BE FILLED BY REFERRING LABORATORY" open className={styles.formContainer}>
              <Controller
                name="dateOfSampleCollectionDate"
                control={control}
                rules={{ required: 'Date specimen collected is required' }}
                render={({ field, fieldState }) => (
                  <OpenmrsDatePicker
                    id="dateOfSampleCollectionDate"
                    labelText={
                      <span className={styles.label}>
                        {t('dateOfSampleCollectionDate', 'Date Specimen Collected:')}
                        <span className={styles.required}>*</span>
                      </span>
                    }
                    value={field.value ? new Date(field.value) : null}
                    minDate={requestDate}
                    maxDate={sentDate || today}
                    onChange={(date) => onDateChange(date, 'dateOfSampleCollectionDate')}
                    onBlur={field.onBlur}
                    ref={field.ref}
                    invalid={!!fieldState.error}
                    invalidText={fieldState.error?.message}
                  />
                )}
              />
              <section className={styles.formGroup}>
                <ResponsiveWrapper>
                  <Controller
                    name="specimenType"
                    control={control}
                    rules={{
                      validate: (value) => (value ? true : 'Specimen type is required'),
                    }}
                    render={({ field, fieldState }) => (
                      <>
                        <RadioButtonGroup
                          orientation="vertical"
                          legendText={
                            <>
                              <span className={styles.label}>
                                {t('specimenType', 'Specimen Type')}
                                <span className={styles.required}>*</span>
                              </span>
                            </>
                          }
                          {...field}
                          valueSelected={field.value}
                          invalid={!!fieldState.error}
                          invalidText={fieldState.error?.message}
                          onChange={(value) => field.onChange(value)}
                        >
                          {Object.entries(specimenTypeDisplayMap).map(([key, label]) => (
                            <RadioButton key={key} id={key} labelText={label} value={key} />
                          ))}
                        </RadioButtonGroup>
                      </>
                    )}
                  />
                </ResponsiveWrapper>
              </section>
              <section className={styles.lastField}>
                <ResponsiveWrapper>
                  <Controller
                    name="dateOfSpecimenSent"
                    control={control}
                    rules={{ required: 'Date specimen sent is required' }}
                    render={({ field, fieldState }) => (
                      <OpenmrsDatePicker
                        id="dateOfSpecimenSent"
                        labelText={
                          <span className={styles.label}>
                            {t('dateOfSpecimenSent', 'Date Specimen sent to Testing Laboratory:')}
                            <span className={styles.required}>*</span>
                          </span>
                        }
                        value={field.value ? new Date(field.value) : null}
                        minDate={sampleDate || requestDate} // Min date is the sample collection date or null if not set
                        maxDate={today}
                        onChange={(date) => onDateChange(date, 'dateOfSpecimenSent')}
                        onBlur={field.onBlur}
                        ref={field.ref}
                        invalid={!!fieldState.error}
                        invalidText={fieldState.error?.message}
                      />
                    )}
                    // render={({ field: { onChange, value, ref, onBlur }, fieldState }) => {
                    //   //const sampleDate = watch('dateOfSampleCollectionDate'); // Dynamically watch the collection date
                    //   //const requestDate = watch('reqDate');
                    //   return (
                    //     <>
                    //       <OpenmrsDatePicker
                    //         id="dateOfSpecimenSent"
                    //         //labelText={t('dateOfSpecimenSent', 'Date specimen sent to referral lab.')}
                    //         labelText={
                    //           <>
                    //             <span className={styles.label}>
                    //               {t('dateOfSpecimenSent', 'Date Specimen sent to Testing Laboratory:')}
                    //               <span className={styles.required}>*</span>
                    //             </span>
                    //           </>
                    //         }
                    //         value={value}
                    //         minDate={sampleDate || requestDate} // Min date is the sample collection date or null if not set
                    //         maxDate={today}
                    //         //onChange={(date) => onDateChange(date, 'dateOfSpecimenSent')}
                    //         onChange={(date) => {
                    //           onDateChange(date, 'dateOfSpecimenSent');
                    //           onBlur();
                    //         }}
                    //         ref={ref}
                    //         invalid={!!fieldState.error}
                    //         invalidText={fieldState.error?.message}
                    //       />
                    //       {/* {fieldState.error && <div className={styles.errorMessage}>{fieldState.error.message}</div>} */}
                    //     </>
                    //   );
                    // }}
                  />
                </ResponsiveWrapper>
              </section>
            </AccordionItem>

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
                disabled={isSaveDisabled || isSubmitting}
                style={{ maxWidth: 'none', width: '50%' }}
                className={styles.button}
                kind="primary"
                type="submit"
              >
                {isSubmitting ? (
                  <InlineLoading />
                ) : encounter ? (
                  t('saveAndClose', 'Complete Order')
                ) : (
                  t('saveAndClose', 'Update Order')
                )}
                {/* {encounter ? t('saveAndClose', 'Complete Order') : t('saveAndClose', 'Save and close')} */}
              </Button>
            </ButtonSet>
          </Accordion>
        </Stack>
      </div>
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
