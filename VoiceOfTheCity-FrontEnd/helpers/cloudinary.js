// cloudinary.js
// Uploads a photo to Cloudinary using an unsigned upload preset (safe to
// call directly from the browser — that's what unsigned presets are for).
// Returns the hosted, permanent image URL to store on the report.

import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '../../Configuration/Configuration.js';

export async function uploadImageToCloudinary(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.error?.message || 'Photo upload failed. Please try again.');
  }

  const data = await response.json();
  return data.secure_url;
}