import PropTypes from 'prop-types';

import './Metrics.css';

const MetricsPanel = ({
  children,
  footer,
  header,
  title,
  headerClassNames,
  footerClassNames
}) => {
  const headerClasses = ['metrics-panel-header'];
  headerClasses.push(...headerClassNames);

  const footerClasses = ['metrics-panel-footer'];
  footerClasses.push(...footerClassNames);

  return (
    <div className="metrics-panel">
      {(title || header) && (
        <div className={headerClasses.join(' ')}>
          {title && <h3>{title}</h3>}
          {header}
        </div>
      )}
      {children}
      {footer && <div className={footerClasses.join(' ')}>{footer}</div>}
    </div>
  );
};

MetricsPanel.defaultProps = {
  footer: null,
  footerClassNames: [],
  header: null,
  headerClassNames: [],
  title: ''
};

MetricsPanel.propTypes = {
  children: PropTypes.node.isRequired,
  footer: PropTypes.node,
  footerClassNames: PropTypes.arrayOf(PropTypes.string),
  header: PropTypes.node,
  headerClassNames: PropTypes.arrayOf(PropTypes.string),
  title: PropTypes.string
};

export default MetricsPanel;
