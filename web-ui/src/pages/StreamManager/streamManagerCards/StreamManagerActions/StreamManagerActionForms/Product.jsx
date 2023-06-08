import {
  PRODUCT_DATA_KEYS,
  STREAM_ACTION_NAME
} from '../../../../../constants';
import { streamManager as $streamManagerContent } from '../../../../../content';
import { useStreamManagerActions } from '../../../../../contexts/StreamManagerActions';
import Input from './formElements/Input';
import TextArea from './formElements/TextArea';

const $content = $streamManagerContent.stream_manager_actions.product;

const Product = () => {
  const {
    currentStreamManagerActionErrors,
    getStreamManagerActionData,
    throttledValidateStreamManagerActionData,
    updateStreamManagerActionData
  } = useStreamManagerActions();
  const { title, price, imageUrl, description } = getStreamManagerActionData(
    STREAM_ACTION_NAME.PRODUCT
  );

  const updateStreamManagerActionProductData = (data) => {
    updateStreamManagerActionData({
      dataOrFn: data,
      actionName: STREAM_ACTION_NAME.PRODUCT
    });
  };

  const validateStreamManagerActionFormatDataOnBlur = ({ target }, dataKey) => {
    throttledValidateStreamManagerActionData(
      { [dataKey]: target.value },
      STREAM_ACTION_NAME.PRODUCT,
      { disableLengthValidation: true }
    );
  };

  return (
    <>
      <Input
        dataKey={PRODUCT_DATA_KEYS.TITLE}
        error={currentStreamManagerActionErrors[PRODUCT_DATA_KEYS.TITLE]}
        label={$content.title}
        name="streamManagerActionFormTitle"
        onChange={updateStreamManagerActionProductData}
        placeholder={$content.title}
        value={title}
      />
      <Input
        dataKey={PRODUCT_DATA_KEYS.PRICE}
        error={currentStreamManagerActionErrors[PRODUCT_DATA_KEYS.PRICE]}
        label={$content.price}
        name="streamManagerActionFormPrice"
        onChange={updateStreamManagerActionProductData}
        placeholder={$content.price_placeholder}
        value={price}
      />
      <Input
        dataKey={PRODUCT_DATA_KEYS.IMAGE_URL}
        error={currentStreamManagerActionErrors[PRODUCT_DATA_KEYS.IMAGE_URL]}
        label={$content.image_url}
        name="streamManagerActionFormImageUrl"
        onChange={updateStreamManagerActionProductData}
        placeholder={$content.image_url_placeholder}
        value={imageUrl}
        onBlur={(event) =>
          validateStreamManagerActionFormatDataOnBlur(
            event,
            PRODUCT_DATA_KEYS.IMAGE_URL
          )
        }
      />
      <TextArea
        dataKey={PRODUCT_DATA_KEYS.DESCRIPTION}
        error={currentStreamManagerActionErrors[PRODUCT_DATA_KEYS.DESCRIPTION]}
        label={$content.description}
        name="streamManagerActionFormDescription"
        onChange={updateStreamManagerActionProductData}
        placeholder={$content.description}
        value={description}
      />
    </>
  );
};

export default Product;
