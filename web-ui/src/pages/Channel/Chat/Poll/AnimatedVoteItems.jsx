import { createRef } from 'react';
import PropTypes from 'prop-types';

import { usePoll } from '../../../../contexts/StreamManagerActions/Poll';
import AnimateReorderList from './AnimateReorderList';
import VoteItem from './VoteItem';
import { useChannel } from '../../../../contexts/Channel';

const AnimatedVoteItems = ({
  textColor,
  radioBoxControls,
  showVotePercentage
}) => {
  const { channelData } = useChannel();
  const { color } = channelData || {};
  const { votes, totalVotes, noVotesCaptured, highestCountOption } = usePoll();

  return (
    <AnimateReorderList>
      {votes.map(({ option, count, key }, index) => {
        const isHighestCount = option === highestCountOption.option;
        const percentage =
          (!!count && Math.ceil((count / totalVotes) * 100)) || 0;

        return (
          <VoteItem
            ref={createRef()}
            key={key}
            isHighestCount={isHighestCount}
            option={option}
            count={count}
            percentage={percentage}
            showVotePercentage={showVotePercentage}
            color={color}
            textColor={textColor}
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
  radioBoxControls: {}
};

AnimatedVoteItems.propTypes = {
  textColor: PropTypes.string,
  showVotePercentage: PropTypes.bool,
  // Viewer props
  radioBoxControls: PropTypes.object
};

export default AnimatedVoteItems;
