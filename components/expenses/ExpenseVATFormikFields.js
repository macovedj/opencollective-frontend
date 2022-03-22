import React from 'react';
import PropTypes from 'prop-types';
import { TaxType } from '@opencollective/taxes';
import { FormattedMessage, useIntl } from 'react-intl';

import { i18nTaxType } from '../../lib/i18n/taxes';

import { Flex, Grid } from '../Grid';
import InputSwitch from '../InputSwitch';
import StyledInput from '../StyledInput';
import StyledInputFormikField from '../StyledInputFormikField';
import StyledInputGroup from '../StyledInputGroup';
import { Label } from '../Text';

const ExpenseVATFormikFields = ({ formik }) => {
  const intl = useIntl();

  // If mounted, it means that the form is subject to VAT. Let's make sure we initialize taxes field accordingly
  React.useEffect(() => {
    if (!formik.values.taxes?.[0]?.id !== TaxType.VAT) {
      formik.setFieldValue('taxes.0.id', TaxType.VAT);
    }
  }, []);

  return (
    <div>
      <Grid gridTemplateColumns="120px minmax(120px, 1fr)" gridGap={2}>
        <StyledInputFormikField
          name="taxes.0.rate"
          htmlFor="vat-rate"
          label={<FormattedMessage defaultMessage="VAT rate" />}
          inputType="number"
          required
        >
          {({ field }) => <StyledInputGroup {...field} append="%" min={0} max={100} step="0.01" />}
        </StyledInputFormikField>
        <StyledInputFormikField
          name="taxes.0.number"
          htmlFor="vat-number"
          label={<FormattedMessage defaultMessage="VAT identifier" />}
          mr={2}
        >
          {({ field }) => <StyledInput {...field} />}
        </StyledInputFormikField>
      </Grid>
      <StyledInputFormikField name="tax.0.isIncluded" mt={2} inputType="checkbox">
        {() => (
          <Flex alignItems="center">
            <InputSwitch
              id="vat-amount-included"
              defaultChecked={formik.values.taxes[0]?.isIncluded}
              onChange={event => formik.setFieldValue('taxes.0.isIncluded', event.target.checked)}
            />
            <Label fontSize="13px" fontWeight="400" htmlFor="vat-amount-included" cursor="pointer">
              <FormattedMessage
                defaultMessage="Add {taxName} on top of amount"
                values={{ taxName: i18nTaxType(intl, TaxType.VAT, 'short') }}
              />
            </Label>
          </Flex>
        )}
      </StyledInputFormikField>
    </div>
  );
};

ExpenseVATFormikFields.propTypes = {
  formik: PropTypes.object,
};

export default ExpenseVATFormikFields;
