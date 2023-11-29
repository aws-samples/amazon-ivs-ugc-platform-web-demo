import { Component } from 'react';
import PropTypes from 'prop-types';

import { app as $appContent } from '../../content';
import Button from '../Button/Button';
import { clsm } from '../../utils';
import { FailRobot } from '../../assets/icons';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    const { children } = this.props;
    const { hasError } = this.state

    return hasError ? (
      <div
        className={clsm(['h-screen', 'flex', 'justify-center', 'items-center'])}
      >
        <div
          className={clsm([
            'flex',
            'justify-center',
            'items-center',
            'flex-col'
          ])}
        >
          <div
            className={clsm([
              'dark:[&>svg]:fill-white',
              '[&>svg]:fill-black',
              'opacity-50',
              'text-center',
              'flex',
              'flex-col',
              'items-center'
            ])}
          >
            <FailRobot />
            <h3 className={clsm(['mt-4'])}>
              {$appContent.error_boundary.message_L1},
            </h3>
            <h3 className={clsm(['mb-16'])}>
              {$appContent.error_boundary.message_L2}.
            </h3>
          </div>

          <Button
            type="nav"
            to="/"
            className={clsm([
              'w-fit',
              'focus:bg-lightMode-gray-light-hover',
              'hover:bg-lightMode-gray-light-hover',
              'dark:focus:bg-darkMode-gray-hover',
              'dark:hover:bg-darkMode-gray-hover',
              'bg-lightMode-gray',
              'focus:bg-lightMode-gray',
              'hover:bg-lightMode-gray-hover'
            ])}
            variant="secondary"
            onClick={() => {
              this.setState({ hasError: false });
            }}
          >
            {$appContent.back_to_directory}
          </Button>
        </div>
      </div>
    ) : (
      children
    );
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired
};

export default ErrorBoundary;
