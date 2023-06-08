export const getProfileViewVariant = (isExpanded, currentView) => {
  switch (currentView) {
    case 'desktop':
      return isExpanded ? 'expandedDesktop' : 'collapsedDesktop';
    case 'stacked':
      return isExpanded ? 'expandedStacked' : 'collapsedStacked';
    case 'split':
      return isExpanded ? 'expandedSplit' : 'collapsedSplit';
    default:
      return '';
  }
};

// Style merging precedence: (expanded, collapsed) > (desktop, stacked, split) > defaultStyles
export const createProfileViewVariants = (variantStyles) => {
  const { desktop, stacked, split, expanded, collapsed, ...defaultStyles } =
    variantStyles || {};

  let [
    expandedDesktop,
    expandedStacked,
    expandedSplit,
    collapsedDesktop,
    collapsedStacked,
    collapsedSplit
  ] = Array(6).fill(defaultStyles);

  if (desktop && Object.keys(desktop).length) {
    const { expanded, collapsed, ...defaultDesktopStyles } = desktop;
    expandedDesktop = {
      ...expandedDesktop,
      ...defaultDesktopStyles,
      ...(expanded || {})
    };
    collapsedDesktop = {
      ...collapsedDesktop,
      ...defaultDesktopStyles,
      ...(collapsed || {})
    };
  }
  if (stacked && Object.keys(stacked).length) {
    const { expanded, collapsed, ...defaultStackedStyles } = stacked;
    expandedStacked = {
      ...expandedStacked,
      ...defaultStackedStyles,
      ...(expanded || {})
    };
    collapsedStacked = {
      ...collapsedStacked,
      ...defaultStackedStyles,
      ...(collapsed || {})
    };
  }
  if (split && Object.keys(split).length) {
    const { expanded, collapsed, ...defaultSplitStyles } = split;
    expandedSplit = {
      ...expandedSplit,
      ...defaultSplitStyles,
      ...(expanded || {})
    };
    collapsedSplit = {
      ...collapsedSplit,
      ...defaultSplitStyles,
      ...(collapsed || {})
    };
  }

  if (expanded && Object.keys(expanded).length) {
    const { desktop, stacked, split, ...defaultExpandedStyles } = expanded;
    expandedDesktop = {
      ...expandedDesktop,
      ...defaultExpandedStyles,
      ...(desktop || {})
    };
    expandedStacked = {
      ...expandedStacked,
      ...defaultExpandedStyles,
      ...(stacked || {})
    };
    expandedSplit = {
      ...expandedSplit,
      ...defaultExpandedStyles,
      ...(split || {})
    };
  }
  if (collapsed) {
    const { desktop, stacked, split, ...defaultCollapsedStyles } = collapsed;
    collapsedDesktop = {
      ...collapsedDesktop,
      ...defaultCollapsedStyles,
      ...(desktop || {})
    };
    collapsedStacked = {
      ...collapsedStacked,
      ...defaultCollapsedStyles,
      ...(stacked || {})
    };
    collapsedSplit = {
      ...collapsedSplit,
      ...defaultCollapsedStyles,
      ...(split || {})
    };
  }

  return {
    expandedDesktop,
    expandedStacked,
    expandedSplit,
    collapsedDesktop,
    collapsedStacked,
    collapsedSplit
  };
};
