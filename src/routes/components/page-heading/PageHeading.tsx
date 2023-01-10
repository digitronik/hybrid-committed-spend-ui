import { PageHeader, PageHeaderTitle } from '@redhat-cloud-services/frontend-components/PageHeader';
import { getQuery } from 'api/queries';
import type { AccountSummaryReport } from 'api/reports/accountSummaryReport';
import { ReportPathsType, ReportType } from 'api/reports/report';
import type { AxiosError } from 'axios';
import messages from 'locales/messages';
import React, { useEffect } from 'react';
import type { WrappedComponentProps } from 'react-intl';
import { injectIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import type { AnyAction } from 'redux';
import type { ThunkDispatch } from 'redux-thunk';
import { paths } from 'Routes';
import { EmptyValueState } from 'routes/components/state/empty-value';
import type { RootState } from 'store';
import { FetchStatus } from 'store/common';
import { reportActions, reportSelectors } from 'store/reports';
import { getPath } from 'utils/paths';

import { styles } from './PageHeading.styles';

interface PageHeadingOwnProps {
  children?: React.ReactNode;
}

interface PageHeadingStateProps {
  report?: AccountSummaryReport;
  reportError?: AxiosError;
  reportFetchStatus?: FetchStatus;
  reportQueryString?: string;
}

type PageHeadingProps = PageHeadingOwnProps & WrappedComponentProps;

const PageHeading: React.FC<PageHeadingProps> = ({ children, intl }) => {
  const { report, reportFetchStatus } = useMapToProps();
  const location = useLocation();

  const hasData = report && report.data && report.data.length;
  const values = hasData && report.data[0];

  const emptyValue = (
    <div style={styles.emptyValue}>
      <EmptyValueState />
    </div>
  );

  const accountName: string | React.ReactNode = values && values.account_name ? values.account_name : emptyValue;
  const accountNumber: string | React.ReactNode = values && values.account_number ? values.account_number : emptyValue;
  const contractStartDate =
    values && values.contract_start_date ? new Date(values.contract_start_date + 'T00:00:00') : undefined;
  const contractEndDate =
    values && values.contract_end_date ? new Date(values.contract_end_date + 'T00:00:00') : undefined;
  const consumptionDate =
    values && values.consumption_date ? new Date(values.consumption_date + 'T00:00:00') : undefined;

  const getPageTitle = () => {
    switch (getPath(location)) {
      case paths.details:
        return messages.detailsTitle;
      case paths.overview:
      default:
        return messages.overviewTitle;
    }
  };

  return (
    <PageHeader>
      <div style={styles.headingContent}>
        <PageHeaderTitle title={intl.formatMessage(getPageTitle())} />
        {reportFetchStatus !== FetchStatus.inProgress && (
          <div>
            <div style={styles.headingContentRight}>
              {intl.formatMessage(messages.accountName, { value: accountName })}
            </div>
            <div style={styles.headingContentRight}>
              {intl.formatMessage(messages.accountNumber, { value: accountNumber })}
            </div>
            <div style={styles.headingContentRight}>
              {intl.formatMessage(messages.contractDate, {
                dateRange:
                  contractStartDate && contractEndDate
                    ? intl.formatDateTimeRange(contractStartDate, contractEndDate, {
                        month: 'long',
                        year: 'numeric',
                      })
                    : emptyValue,
              })}
            </div>
            <div style={styles.headingContentRight}>
              {intl.formatMessage(messages.consumptionDate, {
                date: consumptionDate
                  ? intl.formatDate(consumptionDate, {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : emptyValue,
              })}
            </div>
          </div>
        )}
      </div>
      {children}
    </PageHeader>
  );
};

const useMapToProps = (): PageHeadingStateProps => {
  const dispatch: ThunkDispatch<RootState, any, AnyAction> = useDispatch();

  const query = {
    // TBD...
  };

  const reportQueryString = getQuery(query);
  const reportPathsType = ReportPathsType.accountSummary;
  const reportType = ReportType.billing;
  const report = useSelector((state: RootState) =>
    reportSelectors.selectReport(state, reportPathsType, reportType, reportQueryString)
  );
  const reportFetchStatus = useSelector((state: RootState) =>
    reportSelectors.selectReportFetchStatus(state, reportPathsType, reportType, reportQueryString)
  );

  useEffect(() => {
    if (reportFetchStatus !== FetchStatus.inProgress) {
      dispatch(reportActions.fetchReport(reportPathsType, reportType, reportQueryString));
    }
  }, [reportQueryString]);

  return {
    report,
    reportFetchStatus,
    reportQueryString,
  };
};

export default injectIntl(PageHeading);
