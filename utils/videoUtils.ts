export const generateVideoThumbnail = (videoUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';

    const onSeeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Could not get canvas context'));
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg'));
        
        // Clean up listeners
        video.removeEventListener('seeked', onSeeked);
        video.removeEventListener('error', onError);
      } catch (e) {
        reject(e);
      }
    };

    const onError = (e: Event | string) => {
      let errorMsg = 'Unknown video error';
      if (typeof e === 'string') {
        errorMsg = e;
      } else if (video.error) {
        switch (video.error.code) {
          case video.error.MEDIA_ERR_ABORTED:
            errorMsg = 'Video playback aborted.';
            break;
          case video.error.MEDIA_ERR_NETWORK:
            errorMsg = 'A network error caused the video download to fail.';
            break;
          case video.error.MEDIA_ERR_DECODE:
            errorMsg = 'The video playback was aborted due to a corruption problem.';
            break;
          case video.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMsg = 'The video source is not supported.';
            break;
          default:
            errorMsg = 'An unknown error occurred.';
            break;
        }
      }
      reject(new Error(errorMsg));
       // Clean up listeners
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('error', onError);
    };

    video.addEventListener('seeked', onSeeked);
    video.addEventListener('error', onError);

    video.onloadeddata = () => {
      // Seek to a frame that is not the very first one to avoid black frames
      video.currentTime = 0.1; 
    };
    
    video.src = videoUrl;
    video.load();
  });
};
