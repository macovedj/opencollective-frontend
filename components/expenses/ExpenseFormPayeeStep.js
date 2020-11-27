import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { FastField, Field } from 'formik';
import { first, get, omit, partition, pick } from 'lodash';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { AccountTypesWithHost, CollectiveType } from '../../lib/constants/collectives';
import expenseTypes from '../../lib/constants/expenseTypes';
import { PayoutMethodType } from '../../lib/constants/payout-method';
import { ERROR, isErrorType } from '../../lib/errors';
import { formatFormErrorMessage } from '../../lib/form-utils';

import CollectivePicker, {
  CUSTOM_OPTIONS_POSITION,
  FLAG_COLLECTIVE_PICKER_COLLECTIVE,
  FLAG_NEW_COLLECTIVE,
} from '../CollectivePicker';
import CollectivePickerAsync from '../CollectivePickerAsync';
import { Box, Flex } from '../Grid';
import InputTypeCountry from '../InputTypeCountry';
import StyledButton from '../StyledButton';
import StyledHr from '../StyledHr';
import StyledInputField from '../StyledInputField';
import StyledTextarea from '../StyledTextarea';

import PayoutMethodForm from './PayoutMethodForm';
import PayoutMethodSelect from './PayoutMethodSelect';

const msg = defineMessages({
  payeeLabel: {
    id: `ExpenseForm.payeeLabel`,
    defaultMessage: 'Who is being paid for this expense?',
  },
  payoutOptionLabel: {
    id: `ExpenseForm.PayoutOptionLabel`,
    defaultMessage: 'Payout method',
  },
  invoiceInfo: {
    id: 'ExpenseForm.InvoiceInfo',
    defaultMessage: 'Additional invoice information',
  },
  invoiceInfoPlaceholder: {
    id: 'ExpenseForm.InvoiceInfoPlaceholder',
    defaultMessage: 'Tax ID, VAT number, etc. This information will be printed on your invoice.',
  },
  country: {
    id: 'ExpenseForm.ChooseCountry',
    defaultMessage: 'Choose country',
  },
  address: {
    id: 'ExpenseForm.AddressLabel',
    defaultMessage: 'Physical address',
  },
});

const EMPTY_ARRAY = [];

const setLocationFromPayee = (formik, payee) => {
  formik.setFieldValue('payeeLocation.country', payee?.location?.country || null);
  formik.setFieldValue('payeeLocation.address', payee?.location?.address || '');
};

const getPayoutMethodsFromPayee = payee => {
  const basePms = get(payee, 'payoutMethods') || EMPTY_ARRAY;
  let filteredPms = basePms.filter(({ isSaved }) => isSaved);

  // If the Payee is active (can manage a budget and has a balance). This is usually:
  // - a "Collective" family (Collective, Fund, Event, Project) with an host
  // - an "Host" Organization with budget activated
  if (payee?.isActive) {
    if (!filteredPms.find(pm => pm.type === PayoutMethodType.ACCOUNT_BALANCE)) {
      filteredPms.unshift({
        id: 'new',
        data: {},
        type: PayoutMethodType.ACCOUNT_BALANCE,
        isSaved: true,
      });
    }
  }

  // If the Payee is in the "Collective" family (Collective, Fund, Event, Project)
  // Then the Account Balance should be its only option
  if (payee && AccountTypesWithHost.includes(payee.type)) {
    filteredPms = filteredPms.filter(pm => pm.type === PayoutMethodType.ACCOUNT_BALANCE);
  }

  return filteredPms.length > 0 ? filteredPms : EMPTY_ARRAY;
};

const refreshPayoutProfile = (formik, payoutProfiles) => {
  const payee = formik.values.payee
    ? payoutProfiles.find(profile => profile.id === formik.values.payee.id)
    : first(payoutProfiles);

  formik.setValues({ ...formik.values, draft: omit(formik.values.draft, ['payee']), payee });
};

const ExpenseFormPayeeStep = ({
  formik,
  payoutProfiles,
  collective,
  onCancel,
  onNext,
  isOnBehalf,
  loggedInAccount,
}) => {
  const intl = useIntl();
  const { formatMessage } = intl;
  const { values, errors } = formik;
  const stepOneCompleted = isOnBehalf
    ? values.payee
    : values.type === expenseTypes.RECEIPT
    ? values.payoutMethod
    : values.payoutMethod && values.payeeLocation?.country && values.payeeLocation?.address;
  const allPayoutMethods = React.useMemo(() => getPayoutMethodsFromPayee(values.payee, collective), [values.payee]);
  const onPayoutMethodRemove = React.useCallback(() => refreshPayoutProfile(formik, payoutProfiles), [payoutProfiles]);
  const setPayoutMethod = React.useCallback(({ value }) => formik.setFieldValue('payoutMethod', value), []);
  const requiresAddress =
    values.payee &&
    !values.payee.isInvite &&
    [expenseTypes.INVOICE, expenseTypes.FUNDING_REQUEST].includes(values.type);
  const canInvite = !values?.status;
  const profileOptions = payoutProfiles.map(value => ({
    value,
    label: value.name,
    [FLAG_COLLECTIVE_PICKER_COLLECTIVE]: true,
  }));
  const [myself, myorganizations] = partition(profileOptions, p => p.value.type == 'INDIVIDUAL');

  myorganizations.push({
    label: null,
    value: null,
    isDisabled: true,
    [FLAG_NEW_COLLECTIVE]: true,
    types: [CollectiveType.ORGANIZATION],
    __background__: 'white',
  });

  const collectivePick = canInvite
    ? ({ id }) => (
        <CollectivePickerAsync
          inputId={id}
          data-cy="select-expense-payee"
          collective={values.payee}
          onChange={({ value }) => {
            if (value) {
              const isExistingProfile = payoutProfiles.some(p => p.slug === value.slug);
              const isNewlyCreatedProfile = value.members?.some(
                m => m.role === 'ADMIN' && m.member.slug === loggedInAccount.slug,
              );

              const payee =
                value.slug && (isExistingProfile || isNewlyCreatedProfile)
                  ? value
                  : { ...pick(value, ['id', 'name', 'slug', 'email']), isInvite: true };

              if (isNewlyCreatedProfile) {
                payee.payoutMethods = [];
              }

              formik.setFieldValue('payee', payee);
              formik.setFieldValue('payoutMethod', null);
              setLocationFromPayee(formik, payee);
            }
          }}
          limit={5}
          styles={{
            menu: {
              borderRadius: '16px',
            },
            menuList: {
              padding: '8px',
            },
          }}
          emptyCustomOptions={[
            { options: myself, label: 'Myself' },
            { options: myorganizations, label: 'My Organizations' },
          ]}
          customOptionsPosition={CUSTOM_OPTIONS_POSITION.BOTTOM}
          getDefaultOptions={build => values.payee && build(values.payee)}
          invitable
          LoggedInUser={loggedInAccount}
          addLoggedInUserAsAdmin
          excludeAdminFields
        />
      )
    : ({ id }) => (
        <CollectivePicker
          inputId={id}
          collectives={payoutProfiles}
          getDefaultOptions={build => values.payee && build(values.payee)}
          data-cy="select-expense-payee"
          collective={values.payee}
          onChange={({ value }) => {
            formik.setFieldValue('payee', value);
            formik.setFieldValue('payoutMethod', null);
            setLocationFromPayee(formik, value);
          }}
        />
      );

  return (
    <Fragment>
      <Flex flexDirection={['column', 'row']}>
        <Box mr={[null, 2, null, 4]} flexGrow="1" flexBasis="50%" maxWidth={[null, null, '60%']}>
          <Field name="payee">
            {({ field }) => (
              <StyledInputField
                name={field.name}
                label={formatMessage(msg.payeeLabel)}
                labelFontSize="13px"
                flex="1"
                mt={3}
              >
                {collectivePick}
              </StyledInputField>
            )}
          </Field>
          {requiresAddress && (
            <Fragment>
              <FastField name="payeeLocation.country">
                {({ field }) => (
                  <StyledInputField
                    name={field.name}
                    label={formatMessage(msg.country)}
                    labelFontSize="13px"
                    error={formatFormErrorMessage(intl, errors.payeeLocation?.country)}
                    required
                    mt={3}
                  >
                    {({ id, error }) => (
                      <InputTypeCountry
                        data-cy="payee-country"
                        inputId={id}
                        onChange={value => formik.setFieldValue(field.name, value)}
                        value={field.value}
                        error={error}
                      />
                    )}
                  </StyledInputField>
                )}
              </FastField>
              <FastField name="payeeLocation.address">
                {({ field }) => (
                  <StyledInputField
                    name={field.name}
                    label={formatMessage(msg.address)}
                    labelFontSize="13px"
                    error={formatFormErrorMessage(intl, errors.payeeLocation?.address)}
                    required
                    mt={3}
                  >
                    {inputProps => (
                      <StyledTextarea
                        {...inputProps}
                        {...field}
                        minHeight={100}
                        data-cy="payee-address"
                        placeholder="P. Sherman 42&#10;Wallaby Way&#10;Sydney"
                      />
                    )}
                  </StyledInputField>
                )}
              </FastField>
              <FastField name="invoiceInfo">
                {({ field }) => (
                  <StyledInputField
                    name={field.name}
                    label={formatMessage(msg.invoiceInfo)}
                    labelFontSize="13px"
                    required={false}
                    mt={3}
                  >
                    {inputProps => (
                      <Field
                        as={StyledTextarea}
                        {...inputProps}
                        {...field}
                        minHeight={80}
                        placeholder={formatMessage(msg.invoiceInfoPlaceholder)}
                      />
                    )}
                  </StyledInputField>
                )}
              </FastField>
            </Fragment>
          )}
        </Box>
        <Box flexGrow="1" flexBasis="50%" display={values.payee?.payoutMethods ? 'block' : 'none'}>
          <Field name="payoutMethod">
            {({ field }) => (
              <StyledInputField
                name={field.name}
                htmlFor="payout-method"
                flex="1"
                mt={3}
                label={formatMessage(msg.payoutOptionLabel)}
                labelFontSize="13px"
                error={
                  isErrorType(errors.payoutMethod, ERROR.FORM_FIELD_REQUIRED)
                    ? formatFormErrorMessage(intl, errors.payoutMethod)
                    : null
                }
              >
                {({ id, error }) => (
                  <PayoutMethodSelect
                    inputId={id}
                    error={error}
                    onChange={setPayoutMethod}
                    onRemove={onPayoutMethodRemove}
                    payoutMethod={values.payoutMethod}
                    payoutMethods={allPayoutMethods}
                    payee={values.payee}
                    disabled={!values.payee}
                    collective={collective}
                  />
                )}
              </StyledInputField>
            )}
          </Field>

          {values.payoutMethod && (
            <Field name="payoutMethod">
              {({ field, meta }) => (
                <Box mt={3} flex="1">
                  <PayoutMethodForm
                    fieldsPrefix="payoutMethod"
                    payoutMethod={field.value}
                    host={collective.host}
                    errors={meta.error}
                  />
                </Box>
              )}
            </Field>
          )}
        </Box>
      </Flex>

      {values.payee && (
        <Fragment>
          <StyledHr flex="1" mt={4} borderColor="black.300" />
          <Flex mt={3} flexWrap="wrap">
            {onCancel && (
              <StyledButton
                type="button"
                width={['100%', 'auto']}
                mx={[2, 0]}
                mr={[null, 3]}
                mt={2}
                whiteSpace="nowrap"
                data-cy="expense-cancel"
                disabled={!stepOneCompleted}
                onClick={() => {
                  onCancel?.();
                }}
              >
                <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
              </StyledButton>
            )}
            <StyledButton
              type="button"
              width={['100%', 'auto']}
              mx={[2, 0]}
              mr={[null, 3]}
              mt={2}
              whiteSpace="nowrap"
              data-cy="expense-next"
              buttonStyle="primary"
              disabled={!stepOneCompleted}
              onClick={() => {
                onNext?.();
              }}
            >
              <FormattedMessage id="Pagination.Next" defaultMessage="Next" />
              &nbsp;→
            </StyledButton>
          </Flex>
        </Fragment>
      )}
    </Fragment>
  );
};

ExpenseFormPayeeStep.propTypes = {
  formik: PropTypes.object,
  payoutProfiles: PropTypes.array,
  onCancel: PropTypes.func,
  onNext: PropTypes.func,
  isOnBehalf: PropTypes.bool,
  loggedInAccount: PropTypes.object,
  collective: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    host: PropTypes.shape({
      transferwise: PropTypes.shape({
        availableCurrencies: PropTypes.arrayOf(PropTypes.object),
      }),
    }),
    settings: PropTypes.object,
  }).isRequired,
};

export default ExpenseFormPayeeStep;
