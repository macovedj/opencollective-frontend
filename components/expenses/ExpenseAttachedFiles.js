import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';

import expenseTypes from '../../lib/constants/expenseTypes';

import { Box, Flex } from '../Grid';
import StyledLinkButton from '../StyledLinkButton';
import UploadedFilePreview from '../UploadedFilePreview';

import ExpenseInvoiceDownloadHelper, { getExpenseInvoiceFilename } from './ExpenseInvoiceDownloadHelper';

const getAttachmentDescription = injectIntl((idx, totalNbFiles, intl) => {
  if (totalNbFiles === 1) {
    return intl.formatMessage({ id: 'File.AttachedFile', defaultMessage: 'Attached file' });
  } else {
    return intl.formatMessage({ defaultMessage: 'Attached file {number}' }, { number: idx + 1 });
  }
});

const ExpenseAttachedFiles = ({ files, onRemove, showInvoice, collective, expense }) => {
  return (
    <Flex flexWrap="wrap">
      {showInvoice && [expenseTypes.INVOICE, expenseTypes.SETTLEMENT].includes(expense.type) && (
        <Box mr={3} mb={3}>
          <ExpenseInvoiceDownloadHelper expense={expense} collective={collective}>
            {({ isLoading, downloadInvoice }) => (
              <UploadedFilePreview
                onClick={downloadInvoice}
                isDownloading={isLoading}
                fileName={getExpenseInvoiceFilename(collective, expense)}
                description={<FormattedMessage id="File.DownloadExpense" defaultMessage="Download expense" />}
                size={88}
              />
            )}
          </ExpenseInvoiceDownloadHelper>
        </Box>
      )}
      {files.map((file, idx) => (
        <Box key={file.id || file.url} mr={3} mb={3}>
          <UploadedFilePreview
            size={88}
            url={file.url}
            fileName={file.name}
            description={getAttachmentDescription(idx, files.length)}
          />
          {onRemove && (
            <StyledLinkButton variant="danger" fontSize="12px" mt={1} onClick={() => onRemove(idx)}>
              <FormattedMessage id="Remove" defaultMessage="Remove" />
            </StyledLinkButton>
          )}
        </Box>
      ))}
    </Flex>
  );
};

ExpenseAttachedFiles.propTypes = {
  showInvoice: PropTypes.bool,
  /** Required if showInvoice is true */
  expense: PropTypes.object,
  /** Required if showInvoice is true */
  collective: PropTypes.object,
  files: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      url: PropTypes.string.isRequired,
    }).isRequired,
  ).isRequired,
  /** If provided, a link to remove the file will be displayed */
  onRemove: PropTypes.func,
};

export default ExpenseAttachedFiles;
