/**
 * SatQuery AI Client-Side Image Optimizer
 * =======================================
 * Pre-processes and optimizes uploaded satellite/drone/mobile photos
 * - Downscales ultra-large mobile camera photos (e.g. 12MP-48MP) to optimal CV resolution (max 1400px)
 * - Compresses high-contrast JPEGs for instantaneous uploads (<200KB vs 15MB)
 * - Normalizes aspect ratio and prevents browser memory spikes on mobile
 */

export interface OptimizedImageResult {
  file: File;
  previewUrl: string;
  width: number;
  height: number;
  originalSize: number;
  optimizedSize: number;
}

export async function optimizeImage(
  source: File | string,
  fileName: string = "optimized_capture.jpg",
  maxDimension: number = 1400,
  quality: number = 0.88
): Promise<OptimizedImageResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      let { width, height } = img;

      // Scale down if larger than maxDimension
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Unable to obtain 2D canvas context"));
        return;
      }

      // Smooth bicubic/bilinear filtering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Image compression failed"));
            return;
          }

          const cleanFile = new File([blob], fileName, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });

          const dataUrl = canvas.toDataURL("image/jpeg", quality);

          resolve({
            file: cleanFile,
            previewUrl: dataUrl,
            width,
            height,
            originalSize: typeof source === "object" ? source.size : dataUrl.length,
            optimizedSize: blob.size,
          });
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = (err) => {
      reject(new Error(`Failed to load image for optimization: ${err}`));
    };

    if (typeof source === "string") {
      img.src = source;
    } else {
      img.src = URL.createObjectURL(source);
    }
  });
}
