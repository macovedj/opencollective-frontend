import { accountHasVAT } from '@opencollective/taxes';
import { isNil, sumBy } from 'lodash';

import { CollectiveType } from '../../../lib/collective-sections';
import expenseTypes from '../../../lib/constants/expenseTypes';

export const checkRequiresAddress = values => {
  const collectiveTypesRequiringAddress = [CollectiveType.INDIVIDUAL, CollectiveType.USER, CollectiveType.ORGANIZATION];
  const expenseTypesRequiringAddress = [expenseTypes.INVOICE, expenseTypes.FUNDING_REQUEST, expenseTypes.GRANT];

  return (
    values.payee &&
    (collectiveTypesRequiringAddress.includes(values.payee.type) || values.payee.isHost) &&
    !values.payee.isInvite &&
    expenseTypesRequiringAddress.includes(values.type)
  );
};

export const isTaxRateValid = rate => !isNil(rate) && rate >= 0 && rate <= 100;

export const getTaxAmount = (baseAmount, tax) => {
  if (tax.isIncluded) {
    return Math.round(baseAmount - baseAmount / (1 + tax.rate / 100));
  } else {
    return Math.round(baseAmount * (tax.rate / 100));
  }
};

export const computeExpenseAmounts = (items, taxes) => {
  const areAllItemsValid = items.every(item => !isNil(item.amount));
  const hasTaxes = Boolean(taxes?.length);
  const areAllTaxesValid = !hasTaxes || taxes.every(tax => isTaxRateValid(tax.rate));
  const itemsSum = areAllItemsValid ? sumBy(items, 'amount') : null;
  const taxesToAdd = hasTaxes && areAllTaxesValid ? taxes.filter(tax => !tax.isIncluded) : [];
  const taxesToSubtract = hasTaxes && areAllTaxesValid ? taxes.filter(tax => tax.isIncluded) : [];
  const totalInvoiced = itemsSum - sumBy(taxesToSubtract, tax => getTaxAmount(itemsSum, tax));
  const totalAmount = itemsSum + sumBy(taxesToAdd, tax => getTaxAmount(itemsSum, tax));
  return { hasTaxes, itemsSum, totalInvoiced, totalAmount };
};

/**
 * Returns true if the expense is supposed to have a VAT amount
 */
export const expenseIsSubjectToVAT = (account, expense) => {
  return accountHasVAT(account) && expense.type === expenseTypes.INVOICE;
};
