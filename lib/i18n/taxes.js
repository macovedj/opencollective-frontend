import { defineMessages } from 'react-intl';

const typeMsg = defineMessages({
  VAT: {
    id: 'tax.vat',
    defaultMessage: 'Value-added tax (VAT)',
  },
  GST: {
    id: 'tax.gst',
    defaultMessage: 'Goods and services tax (GST)',
  },
});

const typeMsgShort = defineMessages({
  VAT: {
    id: 'tax.vatShort',
    defaultMessage: 'VAT',
  },
});

const descriptionMsg = defineMessages({
  VAT: {
    id: 'tax.vat.description',
    defaultMessage: 'Use this tier type to conform with the legislation on VAT in Europe.',
  },
  GST: {
    id: 'tax.gst.description',
    defaultMessage: 'Use this tier type to conform with the legislation on GST in New Zealand.',
  },
});

export const i18nTaxType = (intl, taxType, version = 'long') => {
  if (version === 'long') {
    return typeMsg[taxType] ? intl.formatMessage(typeMsg[taxType]) : taxType;
  } else {
    return typeMsgShort[taxType] ? intl.formatMessage(typeMsgShort[taxType]) : taxType;
  }
};

export const i18nTaxDescription = (intl, taxType) => {
  return descriptionMsg[taxType] ? intl.formatMessage(descriptionMsg[taxType]) : null;
};
