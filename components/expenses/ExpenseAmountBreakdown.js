import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { i18nTaxType } from '../../lib/i18n/taxes';
import { computeExpenseAmounts, getTaxAmount, isTaxRateValid } from './lib/utils';

import Container from '../Container';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { Flex } from '../Grid';
import StyledHr from '../StyledHr';
import { Span } from '../Text';

const AmountLine = styled.p`
  font-size: 14px;
  line-height: 20px;
  color: ${props => props.theme.colors.black[900]};
  white-space: nowrap;
  margin: 0;
  margin-bottom: 4px;
  padding-left: 12px;
`;

const TotalAmountLine = styled(AmountLine)`
  font-size: 16px;
  line-height: 24px;
  font-weight: bold;
`;

/**
 * Displays the total amount for all the expense items.
 */
const ExpenseAmountBreakdown = ({ items, currency, taxes }) => {
  const intl = useIntl();
  const { hasTaxes, itemsSum, totalInvoiced, totalAmount } = computeExpenseAmounts(items, taxes);
  return (
    <Container textAlign="right">
      {hasTaxes && (
        <Flex flexDirection="column" alignItems="flex-end">
          <AmountLine>
            <Span textTransform="capitalize" mr={3}>
              <FormattedMessage defaultMessage="Invoiced amount" /> ({currency})
            </Span>
            &nbsp;
            <FormattedMoneyAmount
              amount={totalInvoiced}
              precision={2}
              currency={currency}
              showCurrencyCode={false}
              amountStyles={null}
            />
          </AmountLine>
          {taxes.map(tax => (
            <AmountLine key={tax.id}>
              <Span textTransform="capitalize" mr={3}>
                {i18nTaxType(intl, tax.id, 'short')} ({!isTaxRateValid(tax.rate) ? '??' : tax.rate || 0}%)
              </Span>
              &nbsp;
              <FormattedMoneyAmount
                amount={!isTaxRateValid(tax.rate) ? null : getTaxAmount(itemsSum, tax)}
                precision={2}
                currency={currency}
                showCurrencyCode={false}
                amountStyles={null}
              />
            </AmountLine>
          ))}
          <StyledHr width="100%" my="12px" borderColor="black.500" borderStyle="dotted" />
        </Flex>
      )}
      <TotalAmountLine>
        <Span textTransform="capitalize" mr={3}>
          {intl.formatMessage({ id: 'TotalAmount', defaultMessage: 'Total amount' })}
        </Span>
        &nbsp;
        <Span color="black.500" fontSize="16px" letterSpacing={0} data-cy="expense-items-total-amount">
          <FormattedMoneyAmount amount={totalAmount} precision={2} currency={currency} showCurrencyCode={false} />
        </Span>
      </TotalAmountLine>
    </Container>
  );
};

ExpenseAmountBreakdown.propTypes = {
  /** The currency of the collective */
  currency: PropTypes.string.isRequired,
  /** Expense items */
  items: PropTypes.arrayOf(
    PropTypes.shape({
      amount: PropTypes.number,
    }),
  ).isRequired,
  /** Taxes applied to the expense */
  taxes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      rate: PropTypes.number,
    }),
  ),
};

export default React.memo(ExpenseAmountBreakdown);
