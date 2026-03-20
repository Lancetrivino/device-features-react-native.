import { TravelEntry } from '../types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// ─── Entry Validation ──────────────────────────────────────────────────────────

export const validateNewEntry = (data: {
  imageUri?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}): ValidationResult => {
  const errors: string[] = [];

  if (!data.imageUri || data.imageUri.trim() === '') {
    errors.push('Please take a photo for your travel entry.');
  }

  if (!data.address || data.address.trim() === '') {
    errors.push('Location address could not be determined. Please try again.');
  }

  if (data.latitude === null || data.latitude === undefined || isNaN(data.latitude)) {
    errors.push('Invalid latitude coordinate.');
  }

  if (data.longitude === null || data.longitude === undefined || isNaN(data.longitude)) {
    errors.push('Invalid longitude coordinate.');
  }

  if (
    data.latitude !== null && data.latitude !== undefined &&
    (data.latitude < -90 || data.latitude > 90)
  ) {
    errors.push('Latitude must be between -90 and 90 degrees.');
  }

  if (
    data.longitude !== null && data.longitude !== undefined &&
    (data.longitude < -180 || data.longitude > 180)
  ) {
    errors.push('Longitude must be between -180 and 180 degrees.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateTravelEntry = (entry: Partial<TravelEntry>): ValidationResult => {
  const errors: string[] = [];

  if (!entry.id || typeof entry.id !== 'string' || entry.id.trim() === '') {
    errors.push('Entry ID is missing or invalid.');
  }

  if (!entry.imageUri || typeof entry.imageUri !== 'string') {
    errors.push('Entry must have a valid image.');
  }

  if (!entry.address || typeof entry.address !== 'string') {
    errors.push('Entry must have a valid address.');
  }

  if (typeof entry.latitude !== 'number' || isNaN(entry.latitude)) {
    errors.push('Entry must have valid latitude.');
  }

  if (typeof entry.longitude !== 'number' || isNaN(entry.longitude)) {
    errors.push('Entry must have valid longitude.');
  }

  if (!entry.createdAt || typeof entry.createdAt !== 'string') {
    errors.push('Entry must have a valid creation date.');
  }

  return { isValid: errors.length === 0, errors };
};

// ─── ID Validation ─────────────────────────────────────────────────────────────

export const isValidEntryId = (id: unknown): id is string => {
  return typeof id === 'string' && id.trim().length > 0;
};

// ─── Image URI Validation ──────────────────────────────────────────────────────

export const isValidImageUri = (uri: unknown): uri is string => {
  if (typeof uri !== 'string' || uri.trim() === '') return false;
  return (
    uri.startsWith('file://') ||
    uri.startsWith('content://') ||
    uri.startsWith('ph://') ||
    uri.startsWith('http://') ||
    uri.startsWith('https://')
  );
};
