// アップロード前に、ブラウザ内で写真を縮小・再エンコードする。
//
// 背景:
// 従来は20MBを超える写真を「小さくしてから再度お試しください」と拒否していた。
// しかし実際の使い方は「店主がガレージでiPhoneで撮ってその場で登録する」であり、
// スマートフォンの上で写真を縮小する手段は事実上ない。つまりこの拒否は
// 「この写真は登録できません」と言っているのと同じで、行き止まりだった。
//
// 加えて、現地は電波が弱いことが多い。数MBの原寸JPEGを何枚も送るのは
// 時間がかかるうえ、途中で切れる確率も上がる。
// 長辺2400pxまで落とせば、掲載用としては十分な解像度を保ったまま
// 転送量がおおむね1/5〜1/10になる。
//
// 失敗したときは必ず元のファイルをそのまま返す。
// 縮小はあくまで補助であり、これが原因で登録できなくなるのが最悪の結果のため。

/** 縮小後の長辺の上限。車両詳細のライトボックス拡大に耐える解像度として設定している。 */
export const MAX_UPLOAD_DIMENSION = 2400;

/** 再エンコード時のJPEG品質。0.85は、車体の映り込みや塗装の状態が判別できる水準。 */
const JPEG_QUALITY = 0.85;

/**
 * これ未満のファイルは触らない。
 * 小さい画像を再エンコードすると、かえって劣化するだけで得るものが無い。
 */
const SKIP_BELOW_BYTES = 1.5 * 1024 * 1024;

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", JPEG_QUALITY);
  });
}

// createImageBitmap は EXIF の回転情報を反映して展開できる（imageOrientation）。
// これを使わずに canvas へ描くと、横向きに撮った写真が倒れたまま保存される。
async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // Safariの一部バージョンは imageOrientation 未対応。下のフォールバックへ
    }
  }

  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("画像を読み込めませんでした"));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function sizeOf(source: ImageBitmap | HTMLImageElement) {
  return source instanceof HTMLImageElement
    ? { width: source.naturalWidth, height: source.naturalHeight }
    : { width: source.width, height: source.height };
}

/**
 * 1枚分の縮小処理。縮小の必要がない場合・失敗した場合は元のFileをそのまま返す。
 */
export async function prepareVehiclePhotoForUpload(file: File): Promise<File> {
  // HEIC等、ブラウザがcanvasに描けない形式もある。その場合は下のtry/catchで元ファイルに戻る
  if (!file.type.startsWith("image/")) return file;
  if (file.size < SKIP_BELOW_BYTES) return file;

  let source: ImageBitmap | HTMLImageElement | null = null;
  try {
    source = await decode(file);
    const { width, height } = sizeOf(source);
    if (width === 0 || height === 0) return file;

    const scale = Math.min(1, MAX_UPLOAD_DIMENSION / Math.max(width, height));
    const targetWidth = Math.round(width * scale);
    const targetHeight = Math.round(height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const context = canvas.getContext("2d");
    if (!context) return file;

    context.drawImage(source, 0, 0, targetWidth, targetHeight);
    const blob = await canvasToBlob(canvas);
    if (!blob) return file;

    // 縮小しても小さくならなかった場合（PNGのスクリーンショット等）は元を使う
    if (blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, {
      type: "image/jpeg",
      lastModified: file.lastModified,
    });
  } catch {
    return file;
  } finally {
    if (source && "close" in source) source.close();
  }
}

/** 複数枚をまとめて処理する。1枚ずつ順に行い、端末のメモリを圧迫しないようにする。 */
export async function prepareVehiclePhotosForUpload(
  files: File[],
): Promise<File[]> {
  const prepared: File[] = [];
  for (const file of files) {
    prepared.push(await prepareVehiclePhotoForUpload(file));
  }
  return prepared;
}
