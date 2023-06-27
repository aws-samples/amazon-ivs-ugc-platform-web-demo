import { createRef } from 'react';
import PropTypes from 'prop-types';

import { usePoll } from '../../../../contexts/StreamManagerActions/Poll';
import AnimateReorderList from './AnimateReorderList';
import VoteItem from './VoteItem';
import { useChannel } from '../../../../contexts/Channel';

const AnimatedVoteItems = ({
  textColor,
  inputDivControls,
  radioBoxControls,
  showVotePercentage
}) => {
  const { channelData } = useChannel();
  const { color } = channelData || {};
  const { votes, totalVotes, noVotesCaptured, highestCountOption } = usePoll();

  return (
    <AnimateReorderList>
      {votes.map(({ option, count }, index) => {
        const isHighestCount = option === highestCountOption.option;
        const percentage =
          (!!count && Math.ceil((count / totalVotes) * 100)) || 0;

        return (
          <VoteItem
            ref={createRef()}
            key={option}
            isHighestCount={isHighestCount}
            option={option}
            count={count}
            percentage={percentage}
            showVotePercentage={showVotePercentage}
            color={color}
            textColor={textColor}
            inputDivControls={inputDivControls}
            radioBoxControls={radioBoxControls}
            inputAndLabelId={`${option}-${index}`}
            noVotesCaptured={noVotesCaptured}
          />
        );
      })}
    </AnimateReorderList>
  );
};

AnimatedVoteItems.defaultProps = {
  showVotePercentage: true,
  textColor: undefined,
  inputDivControls: {},
  radioBoxControls: {}
};

AnimatedVoteItems.propTypes = {
  textColor: PropTypes.string,
  showVotePercentage: PropTypes.bool,
  // Viewer props
  inputDivControls: PropTypes.object,
  radioBoxControls: PropTypes.object
};

export default AnimatedVoteItems;
