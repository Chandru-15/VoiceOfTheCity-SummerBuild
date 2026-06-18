import exifr from 'exifr';

export const MAX_PHOTO_AGE_DAYS = 7;

export async function getImageTakenDate(file) {
  try {
    const exif = await exifr.parse(file, { pick: ['DateTimeOriginal', 'CreateDate', 'ModifyDate'] });
    const raw = exif?.DateTimeOriginal || exif?.CreateDate || exif?.ModifyDate;
    if (raw instanceof Date && !Number.isNaN(raw.getTime())) return raw;
  } catch {
    // Fall back to file lastModified below.
  }
  if (file.lastModified) return new Date(file.lastModified);
  return null;
}

export async function validateImageFreshness(file, maxAgeDays = MAX_PHOTO_AGE_DAYS) {
  const takenAt = await getImageTakenDate(file);
  if (!takenAt) {
    return {
      ok: false,
      reason: 'Could not read when this photo was taken. Try taking a new photo with your camera.',
    };
  }

  const ageMs = Date.now() - takenAt.getTime();
  if (ageMs < 0) {
    return { ok: false, reason: 'Photo date appears to be in the future. Please use a current photo.' };
  }

  const maxMs = maxAgeDays * 24 * 60 * 60 * 1000;
  if (ageMs > maxMs) {
    return {
      ok: false,
      reason: `Photo is older than ${maxAgeDays} days. Please take or upload a recent photo of the issue.`,
      takenAt: takenAt.toISOString(),
    };
  }

  return {
    ok: true,
    takenAt: takenAt.toISOString(),
    ageHours: Math.round(ageMs / (60 * 60 * 1000)),
  };
}
