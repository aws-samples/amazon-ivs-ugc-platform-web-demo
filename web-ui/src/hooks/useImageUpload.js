import { useCallback, useState } from 'react';

import { channelAPI } from '../api';
import { SUPPORTED_IMAGE_FILE_FORMATS } from '../constants';

export class MaximumSizeExceededError extends Error {
  constructor(message) {
    super(message);
    this.name = 'MaximumSizeExceededError';
  }
}

export class UnsupportedFileFormatError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UnsupportedFileFormatError';
  }
}

const useImageUpload = ({ assetType, onUpload, onDelete, maximumFileSize }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const prevalidateUpload = useCallback(
    (file) => {
      const { size, type } = file;

      // validate format
      const format = type.split('/')[1];
      const supportedImageFormats = SUPPORTED_IMAGE_FILE_FORMATS.flat();
      if (!supportedImageFormats.includes(format)) {
        const supportedImageFormatsStr = supportedImageFormats.join(', ');
        const error = new UnsupportedFileFormatError(
          `${format} image files are unsupported for upload. Supported image file formats: ${supportedImageFormatsStr}`
        );
        console.error(error);

        return error;
      }

      // validate size
      const sizeInMB = size / Math.pow(10, 6);
      if (sizeInMB > maximumFileSize) {
        const roundedSizeInMB = sizeInMB.toFixed(2);
        const error = new MaximumSizeExceededError(
          `The selected file is ${roundedSizeInMB}MB, which exceeds the maximum file size for upload (${maximumFileSize}MB).`
        );
        console.error(error);

        return error;
      }
    },
    [maximumFileSize]
  );

  const uploadChannelAsset = useCallback(
    async (onFileChangeEvent) => {
      if (isUploading) return;

      let result, error;
      const file = onFileChangeEvent.target.files[0];

      error = prevalidateUpload(file);

      if (!error) {
        setIsUploading(true);
        ({ result, error } = await channelAPI.uploadFileToS3({
          assetType,
          file
        }));
      }

      onUpload({ result, error });
      setIsUploading(false);
      if (!error) {
        setIsDownloading(true);
      }

      return result;
    },
    [assetType, isUploading, onUpload, prevalidateUpload]
  );

  const deleteChannelAsset = useCallback(async () => {
    if (isDeleting) return;

    setIsDeleting(true);
    const { result, error } = await channelAPI.deleteChannelAsset(assetType);

    onDelete({ result, error });
    setIsDeleting(false);

    return !!result;
  }, [assetType, isDeleting, onDelete]);

  return {
    deleteChannelAsset,
    isDeleting,
    isDownloading,
    isUploading,
    setIsDownloading,
    uploadChannelAsset
  };
};

export default useImageUpload;
