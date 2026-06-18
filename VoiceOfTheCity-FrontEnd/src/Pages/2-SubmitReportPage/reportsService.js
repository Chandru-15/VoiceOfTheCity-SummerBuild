// reportsService.js — Firestore reads/writes for civic reports.

import { db } from '../../../helpers/firebase.js';
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  increment,
  arrayUnion,
} from 'firebase/firestore';

const REPORTS_COLLECTION = 'reports';
const NEARBY_RADIUS_METERS = 100;

export const SEVERITY_RANK = { low: 1, medium: 2, high: 3 };
export const SEVERITIES = ['low', 'medium', 'high'];

export const REPORT_STATUSES = [
  'pending_review',
  'open',
  'in_progress',
  'closed',
  'rejected',
  'spam',
];

/** Statuses visible on the public reports page (admin must accept first). */
export const PUBLIC_STATUSES = ['open', 'in_progress', 'closed'];

export const STATUS_LABELS = {
  pending_review: 'Pending review',
  open: 'Open',
  in_progress: 'In progress',
  closed: 'Closed',
  rejected: 'Rejected',
  spam: 'Spam',
};

function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function findSimilarReports({ issueType, lat, lng }) {
  const reportsQuery = query(
    collection(db, REPORTS_COLLECTION),
    where('issueType', '==', issueType),
    where('status', 'in', PUBLIC_STATUSES.filter((s) => s !== 'closed'))
  );

  const snapshot = await getDocs(reportsQuery);
  const nearby = [];

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    if (!data.location) return;
    const distance = distanceMeters(lat, lng, data.location.lat, data.location.lng);
    if (distance <= NEARBY_RADIUS_METERS) {
      nearby.push({ id: docSnap.id, ...data, distanceMeters: Math.round(distance) });
    }
  });

  return nearby.sort((a, b) => a.distanceMeters - b.distanceMeters);
}

export async function createReport({
  imageUrls,
  imageMetadata,
  lat,
  lng,
  address,
  issueType,
  severity,
  description,
  division,
  divisionReason,
  priority,
  isEmergency,
}) {
  const docRef = await addDoc(collection(db, REPORTS_COLLECTION), {
    images: imageUrls,
    imageMetadata: imageMetadata || [],
    location: { lat, lng, address: address || null },
    issueType,
    severity,
    description,
    aiDivision: division,
    division,
    divisionSource: 'ai',
    divisionReason: divisionReason || null,
    priority: priority ?? 3,
    prioritySource: 'ai',
    isEmergency: Boolean(isEmergency),
    adminReport: null,
    status: 'pending_review',
    count: 1,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function mergeIntoReport(reportId, { imageUrls, imageMetadata, severity, division, divisionReason, priority }) {
  const reportRef = doc(db, REPORTS_COLLECTION, reportId);
  const updates = {
    count: increment(1),
    severity,
    updatedAt: serverTimestamp(),
  };

  if (imageUrls?.length) {
    updates.images = arrayUnion(...imageUrls);
  }
  if (imageMetadata?.length) {
    updates.imageMetadata = arrayUnion(...imageMetadata);
  }
  if (division) {
    updates.aiDivision = division;
    updates.divisionReason = divisionReason || null;
  }
  if (priority != null) updates.priority = priority;

  await updateDoc(reportRef, updates);
}

function sortReports(reports) {
  return reports.sort((a, b) => {
    const aPriority = a.priority ?? 0;
    const bPriority = b.priority ?? 0;
    if (bPriority !== aPriority) return bPriority - aPriority;
    const aTime = a.updatedAt?.toMillis?.() ?? a.createdAt?.toMillis?.() ?? 0;
    const bTime = b.updatedAt?.toMillis?.() ?? b.createdAt?.toMillis?.() ?? 0;
    return bTime - aTime;
  });
}

export async function getAllReports() {
  const snapshot = await getDocs(collection(db, REPORTS_COLLECTION));
  const reports = [];
  snapshot.forEach((docSnap) => {
    reports.push({ id: docSnap.id, ...docSnap.data() });
  });
  return sortReports(reports);
}

export async function getPublicReports() {
  const snapshot = await getDocs(collection(db, REPORTS_COLLECTION));
  const reports = [];
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    if (PUBLIC_STATUSES.includes(data.status)) {
      reports.push({ id: docSnap.id, ...data });
    }
  });
  return sortReports(reports);
}

export async function updateReportStatus(reportId, status) {
  await updateDoc(doc(db, REPORTS_COLLECTION, reportId), {
    status,
    updatedAt: serverTimestamp(),
  });
}

export async function updateReportSeverity(reportId, severity) {
  await updateDoc(doc(db, REPORTS_COLLECTION, reportId), {
    severity,
    updatedAt: serverTimestamp(),
  });
}

export async function updateReportDivision(reportId, division) {
  await updateDoc(doc(db, REPORTS_COLLECTION, reportId), {
    division,
    divisionSource: 'human',
    updatedAt: serverTimestamp(),
  });
}

export async function updateReportFields(reportId, fields) {
  await updateDoc(doc(db, REPORTS_COLLECTION, reportId), {
    ...fields,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteReport(reportId) {
  await deleteDoc(doc(db, REPORTS_COLLECTION, reportId));
}

export async function saveAdminReport(reportId, adminReport) {
  await updateDoc(doc(db, REPORTS_COLLECTION, reportId), {
    adminReport,
    updatedAt: serverTimestamp(),
  });
}
