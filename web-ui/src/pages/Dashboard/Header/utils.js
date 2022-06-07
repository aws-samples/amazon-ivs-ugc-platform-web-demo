import { dashboard as $dashboardContent } from '../../../content';
import { getDayDiff } from '../../../hooks/useDateTime';

const $content = $dashboardContent.header.session_navigator;

export const groupStreamSessions = (streamSessions) => {
  const todaySessionGroup = {
    groupLabel: $content.session_group_labels.today,
    sessionData: []
  };
  const previous7DaysSessionGroup = {
    groupLabel: $content.session_group_labels.previous_7_days,
    sessionData: []
  };
  const previous30DaysSessionGroup = {
    groupLabel: $content.session_group_labels.previous_30_days,
    sessionData: []
  };
  const earlierDaysSessionGroup = {
    groupLabel: $content.session_group_labels.earlier,
    sessionData: []
  };

  streamSessions?.forEach((streamSession) => {
    const dayDiff = getDayDiff(streamSession.startTime);

    if (dayDiff < 1) {
      todaySessionGroup.sessionData.push(streamSession); // "Today"
    } else if (dayDiff < 8) {
      previous7DaysSessionGroup.sessionData.push(streamSession); // "Previous 7 days"
    } else if (dayDiff < 31) {
      previous30DaysSessionGroup.sessionData.push(streamSession); // "Previous 30 days"
    } else {
      earlierDaysSessionGroup.sessionData.push(streamSession); // "Earlier"
    }
  });

  return [
    todaySessionGroup,
    previous7DaysSessionGroup,
    previous30DaysSessionGroup,
    earlierDaysSessionGroup
  ].filter(({ sessionData }) => sessionData.length);
};
