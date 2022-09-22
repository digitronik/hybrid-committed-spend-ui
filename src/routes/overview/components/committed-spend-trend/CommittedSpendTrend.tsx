import { getQuery, parseQuery, Query } from 'api/queries/query';
import { Report } from 'api/reports/report';
import { AxiosError } from 'axios';
import messages from 'locales/messages';
import React, { useMemo, useState } from 'react';
import { injectIntl, WrappedComponentProps } from 'react-intl';
import { connect } from 'react-redux';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { transformReport } from 'routes/components/charts/common/chart-datum-utils';
import { TrendChart } from 'routes/components/charts/trend-chart';
import { Perspective } from 'routes/overview/components/perspective';
import { ReportSummary } from 'routes/overview/components/report-summary';
import { createMapStateToProps, FetchStatus } from 'store/common';
import { dashboardSelectors, DashboardWidget } from 'store/dashboard';
import { reportActions, reportSelectors } from 'store/reports';
import { getToday, getYear } from 'utils/dateRange';

import { chartStyles, styles } from './CommittedSpendTrend.styles';
import { currentData } from './data/currentData';
import { previousData } from './data/previousData';
import { thresholdData } from './data/thresholdData';

interface CommittedSpendTrendOwnProps {
  widgetId: number;
}

interface CommittedSpendTrendStateProps {
  currentQueryString: string;
  currentReport?: Report;
  currentReportError?: AxiosError;
  currentReportFetchStatus?: FetchStatus;
  previousQueryString: string;
  previousReport?: Report;
  previousReportError?: AxiosError;
  previousReportFetchStatus?: FetchStatus;
  query: Query;
  thresholdReport?: Report;
  widget: DashboardWidget;
}

interface CommittedSpendTrendDispatchProps {
  fetchReport: typeof reportActions.fetchReport;
}

export type CommittedSpendTrendProps = CommittedSpendTrendStateProps &
  CommittedSpendTrendOwnProps &
  CommittedSpendTrendDispatchProps &
  RouteComponentProps<void> &
  WrappedComponentProps;

const perspectiveOptions = [
  { label: messages.committedSpendTrendPerspectiveValues, value: 'actual' },
  { label: messages.committedSpendTrendPerspectiveValues, value: 'previous_over_actual' },
  { label: messages.committedSpendTrendPerspectiveValues, value: 'past_two_actual' },
];

const CommittedSpendTrendBase: React.FC<CommittedSpendTrendProps> = ({
  currentQueryString,
  currentReport,
  currentReportFetchStatus,
  fetchReport,
  intl,
  previousQueryString,
  previousReport,
  previousReportFetchStatus,
  thresholdReport,
  widget,
}) => {
  useMemo(() => {
    fetchReport(widget.reportPathsType, widget.reportType, currentQueryString);
  }, [currentQueryString]);
  useMemo(() => {
    fetchReport(widget.reportPathsType, widget.reportType, previousQueryString);
  }, [previousQueryString]);

  const [perspectiveItem, setPerspectiveItem] = useState(perspectiveOptions[1].value);

  const getDetailsLink = () => {
    if (widget.viewAllPath) {
      const href = `${widget.viewAllPath}?${getQuery({
        // TBD...
      })}`;
      return <Link to={href}>{intl.formatMessage(messages.viewDetails)}</Link>;
    }
    return null;
  };

  const getChart = () => {
    const endDate = getToday();
    let startDate = getYear(1);
    let isYear = true;
    let offset = 0;

    switch (perspectiveItem) {
      case perspectiveOptions[0].value: // Actual spend
        break;
      case perspectiveOptions[1].value: // Previous year over actual spend
        offset = 1;
        isYear = false;
        break;
      case perspectiveOptions[2].value: // Past two years actual spend
        startDate = getYear(2);
        break;
      default:
        break;
    }

    const current = transformReport({ report: currentReport, startDate: new Date(startDate.getTime()), endDate });
    const previous = transformReport({
      report: previousReport,
      startDate: new Date(startDate.getTime()),
      endDate,
      offset,
    });
    const threshold = transformReport({ report: thresholdReport, startDate: new Date(startDate.getTime()), endDate });

    return (
      <TrendChart
        adjustContainerHeight
        containerHeight={chartStyles.chartContainerHeight}
        currentData={current}
        height={chartStyles.chartHeight}
        name={widget.chartName}
        previousData={offset ? previous : undefined}
        thresholdData={threshold}
        isYear={isYear}
      />
    );
  };

  const handleOnPerspectiveSelected = value => {
    setPerspectiveItem(value);
  };

  return (
    <ReportSummary
      detailsLink={getDetailsLink()}
      fetchStatus={[currentReportFetchStatus, previousReportFetchStatus]}
      title={widget.title}
    >
      <Perspective
        currentItem={perspectiveItem}
        onSelected={handleOnPerspectiveSelected}
        options={perspectiveOptions}
      />
      <div style={styles.chartContainer}>{getChart()}</div>
    </ReportSummary>
  );
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mapStateToProps = createMapStateToProps<CommittedSpendTrendOwnProps, CommittedSpendTrendStateProps>(
  (state, { widgetId }) => {
    const widget = dashboardSelectors.selectWidget(state, widgetId);
    // const queries = dashboardSelectors.selectWidgetQueries(state, widgetId);

    // TBD...
    const queryFromRoute = parseQuery<Query>(location.search);
    const query = {
      filter: {
        ...queryFromRoute.filter,
      },
    };

    // Current report
    const currentQueryString = getQuery(query);
    // const currentReport = reportSelectors.selectReport(
    //   state,
    //   widget.reportPathsType,
    //   widget.reportType,
    //   currentQueryString
    // );
    const currentReport = currentData as any;
    const currentReportError = reportSelectors.selectReportError(
      state,
      widget.reportPathsType,
      widget.reportType,
      currentQueryString
    );
    const currentReportFetchStatus = reportSelectors.selectReportFetchStatus(
      state,
      widget.reportPathsType,
      widget.reportType,
      currentQueryString
    );

    // Previous report
    const previousQueryString = getQuery(query);
    // const previousReport = reportSelectors.selectReport(
    //   state,
    //   widget.reportPathsType,
    //   widget.reportType,
    //   previousQueryString
    // );
    const previousReport = previousData as any;
    const previousReportError = reportSelectors.selectReportError(
      state,
      widget.reportPathsType,
      widget.reportType,
      previousQueryString
    );
    const previousReportFetchStatus = reportSelectors.selectReportFetchStatus(
      state,
      widget.reportPathsType,
      widget.reportType,
      previousQueryString
    );

    return {
      currentQueryString,
      currentReport,
      currentReportError,
      currentReportFetchStatus,
      previousQueryString,
      previousReport,
      previousReportError,
      previousReportFetchStatus,
      query,
      thresholdReport: thresholdData as any,
      widget,
    };
  }
);

const mapDispatchToProps: CommittedSpendTrendDispatchProps = {
  fetchReport: reportActions.fetchReport,
};

const CommittedSpendTrend = withRouter(CommittedSpendTrendBase);
export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(CommittedSpendTrend));
