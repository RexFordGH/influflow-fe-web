import { addToast } from '@/components/base/toast';

export async function convertImageToPNG(imageBlob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new window.Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      if (ctx) {
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert image to PNG'));
          }
        }, 'image/png');
      } else {
        reject(new Error('Failed to get canvas context'));
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(imageBlob);
  });
}

export function convertToTwitterFormat(
  content: string,
  tweetNumber?: number,
  totalTweets?: number,
): string {
  if (!content) return '';

  let twitterContent = content;

  twitterContent = twitterContent.replace(/^[-*]\s+(.+)$/gm, '• $1');
  twitterContent = twitterContent.replace(/^\d+\.\s+(.+)$/gm, '• $1');
  twitterContent = twitterContent.replace(/\*\*(.+?)\*\*/g, '$1');
  twitterContent = twitterContent.replace(/\*(.+?)\*/g, '$1');
  twitterContent = twitterContent.replace(/!\[.*?\]\(.*?\)/g, '');
  twitterContent = twitterContent.replace(/\n\n/g, '\n');
  twitterContent = twitterContent.replace(/(\n• .+)(\n[^•])/g, '$1\n$2');
  twitterContent = twitterContent.replace(/\n{3,}/g, '\n\n');
  twitterContent = twitterContent.trim();

  if (tweetNumber && totalTweets && totalTweets > 1) {
    twitterContent = `(${tweetNumber}/${totalTweets})\n${twitterContent}`;
  }

  return twitterContent;
}

export async function copyTwitterContent(
  content: string,
  imageUrl?: string,
  tweetNumber?: number,
  totalTweets?: number,
): Promise<void> {
  const twitterFormattedContent = convertToTwitterFormat(
    content,
    tweetNumber,
    totalTweets,
  );

  try {
    if (imageUrl) {
      const response = await fetch(imageUrl, {
        mode: 'cors',
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }

      const blob = await response.blob();

      if (!blob.type.startsWith('image/')) {
        throw new Error(`Invalid image type: ${blob.type}`);
      }

      const convertedBlob = await convertImageToPNG(blob);

      await navigator.clipboard.write([
        new ClipboardItem({
          [convertedBlob.type]: convertedBlob,
          'text/plain': new Blob([twitterFormattedContent], {
            type: 'text/plain',
          }),
        }),
      ]);

      addToast({
        title: 'Copied Successfully',
        color: 'success',
      });
    } else {
      await navigator.clipboard.writeText(twitterFormattedContent);
      addToast({
        title: 'Copied Successfully',
        color: 'success',
      });
    }
  } catch (error) {
    console.error('Failed to copy content:', error);
    try {
      await navigator.clipboard.writeText(twitterFormattedContent);
      addToast({
        title: 'Copied text (image copy failed)',
        color: 'warning',
      });
    } catch (textError) {
      console.error('Failed to copy text:', textError);
      addToast({
        title: 'Copy failed',
        color: 'danger',
      });
    }
  }
}

export async function copyImageToClipboard(imageUrl: string): Promise<void> {
  try {
    const response = await fetch(imageUrl, {
      mode: 'cors',
      credentials: 'same-origin',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const blob = await response.blob();

    if (!blob.type.startsWith('image/')) {
      throw new Error(`Invalid image type: ${blob.type}`);
    }

    const convertedBlob = await convertImageToPNG(blob);

    await navigator.clipboard.write([
      new ClipboardItem({ [convertedBlob.type]: convertedBlob }),
    ]);

    addToast({
      title: 'Image Copied Successfully',
      color: 'success',
    });
  } catch (error) {
    console.error('Failed to copy image:', error);
    addToast({
      title: 'Image Copy Failed',
      color: 'danger',
    });
  }
}
