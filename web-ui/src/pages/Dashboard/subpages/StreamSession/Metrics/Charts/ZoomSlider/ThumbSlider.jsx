import PropTypes from 'prop-types';

const ThumbSlider = ({ style, ownerState, ...restProps }) => (
  <div style={style} className="thumb-container">
    <span {...restProps} />
  </div>
);

ThumbSlider.propTypes = {
  style: PropTypes.object.isRequired,
  ownerState: PropTypes.object.isRequired
};

export default ThumbSlider;
