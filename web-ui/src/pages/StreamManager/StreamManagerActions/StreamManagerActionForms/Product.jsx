import {
  STREAM_ACTION_NAME,
  STREAM_MANAGER_ACTION_LIMITS
} from '../../../../constants';
import { streamManager as $streamManagerContent } from '../../../../content';
import { useStreamManagerActions } from '../../../../contexts/StreamManagerActions';
import Input from './formElements/Input';
import TextArea from './formElements/TextArea';

export const PRODUCT_DATA_KEYS = {
  TITLE: 'title',
  PRICE: 'price',
  IMAGE_URL: 'imageUrl',
  DESCRIPTION: 'description'
};

const $content = $streamManagerContent.stream_manager_actions.product;
const LIMITS = STREAM_MANAGER_ACTION_LIMITS[STREAM_ACTION_NAME.PRODUCT];

const Product = () => {
  const { getStreamManagerActionData, updateStreamManagerActionData } =
    useStreamManagerActions();
  const { title, price, imageUrl, description } = getStreamManagerActionData(
    STREAM_ACTION_NAME.PRODUCT
  );

  const updateStreamManagerActionProductData = (data) => {
    updateStreamManagerActionData(data, STREAM_ACTION_NAME.PRODUCT);
  };

  return (
    <>
      <Input
        dataKey={PRODUCT_DATA_KEYS.TITLE}
        label={$content.title}
        maxLength={LIMITS.title}
        name="streamManagerActionFormTitle"
        onChange={updateStreamManagerActionProductData}
        placeholder={$content.title}
        value={title}
      />
      <Input
        dataKey={PRODUCT_DATA_KEYS.PRICE}
        label={$content.price}
        maxLength={LIMITS.price}
        name="streamManagerActionFormPrice"
        onChange={updateStreamManagerActionProductData}
        placeholder={$content.price_placeholder}
        value={price}
      />
      <Input
        dataKey={PRODUCT_DATA_KEYS.IMAGE_URL}
        label={$content.image_url}
        maxLength={LIMITS.url}
        name="streamManagerActionFormImageUrl"
        onChange={updateStreamManagerActionProductData}
        placeholder={$content.image_url_placeholder}
        value={imageUrl}
      />
      <TextArea
        dataKey={PRODUCT_DATA_KEYS.DESCRIPTION}
        label={$content.description}
        maxLength={LIMITS.description}
        name="streamManagerActionFormDescription"
        onChange={updateStreamManagerActionProductData}
        placeholder={$content.description}
        value={description}
      />
    </>
  );
};

export default Product;
