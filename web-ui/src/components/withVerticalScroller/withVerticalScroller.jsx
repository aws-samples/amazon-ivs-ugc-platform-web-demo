import './withVerticalScroller.css';

const withVerticalScroller = (WrappedComponent) => (props) => {
  return (
    <div className="vertical-scroller-container">
      <WrappedComponent {...props} />
    </div>
  );
};

export default withVerticalScroller;
