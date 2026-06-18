// rekaAI.js
// Reka multimodal analysis: issue classification, agency routing, admin reports.
// Non-emergency platform only — no SCDF / 995 / 999 routing.

import { REKA_API_KEY, REKA_BASE_URL } from '../../Configuration/Configuration.js';

export const ISSUE_TYPES = [
  'pothole',
  'broken_streetlight',
  'graffiti',
  'illegal_dumping',
  'damaged_sidewalk',
  'fallen_tree',
  'flooding',
  'traffic_signal_issue',
  'other',
];

// Singapore non-emergency agencies (OneService model).
export const DIVISIONS = [
  'scdf',
  'town_council',
  'hdb',
  'lta',
  'nea',
  'nparks',
  'pub',
  'bca',
  'sla',
  'ura',
  'pa',
  'spf',
  'sfa',
];

export const EMERGENCY_DIVISIONS = ['scdf', 'spf'];

export const DEFAULT_DIVISION = 'town_council';

const SEVERITIES = ['low', 'medium', 'high'];

export const DIVISION_LABELS = {
  scdf: 'SCDF (995)',
  town_council: 'Town Council',
  hdb: 'HDB',
  lta: 'LTA',
  nea: 'NEA',
  nparks: 'NParks',
  pub: 'PUB',
  bca: 'BCA',
  sla: 'SLA',
  ura: 'URA',
  pa: "People's Association",
  spf: 'SPF',
  sfa: 'SFA',
};

const LEGACY_DIVISION_LABELS = {
  organisation: 'Organisation (legacy)',
  community_club: 'Community Club (legacy)',
};

const DIVISION_DESCRIPTIONS = {
  scdf: 'Fire, smoke, gas leaks, rescue, medical emergencies — route here when isEmergency is true (citizens must also call 995)',
  town_council:
    'HDB estate maintenance — corridor lights, lifts, playgrounds, estate footpaths, local cleanliness',
  hdb: 'HDB facilities — lift faults, common areas, block infrastructure',
  lta: 'Roads, footpaths, traffic signs/signals, street lighting on public roads, illegal parking',
  nea: 'Cleanliness, litter, pests, smoking in prohibited areas, pollution, noise',
  nparks: 'Parks, street trees, greenery, fallen branches, animals/birds in green spaces',
  pub: 'Water supply, choked drains, flooding, sewer issues, public water leaks',
  bca: 'Building safety defects, dangerous structures, construction-site issues',
  sla: 'State land, vacant land, public space on state property',
  ura: 'Illegal structures, unauthorized land use, planning violations',
  pa: 'Community programmes, grassroots matters, neighbour assistance',
  spf: 'Active crime in progress, serious assault, robbery, urgent public safety threats — route here when isEmergency is true (citizens must also call 999)',
  sfa: 'Food hygiene, pests in food establishments, unsafe food handling',
};

export function formatIssueLabel(issueType) {
  if (!issueType) return 'Unknown issue';
  return issueType
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function formatDivisionLabel(division) {
  if (!division) return 'Unassigned';
  return DIVISION_LABELS[division] || LEGACY_DIVISION_LABELS[division] || division;
}

export function normalizeDivision(division) {
  if (DIVISIONS.includes(division)) return division;
  if (division === 'community_club') return 'pa';
  if (division === 'organisation') return DEFAULT_DIVISION;
  return DEFAULT_DIVISION;
}

export function routeEmergencyDivision(issueType, aiDivision) {
  if (aiDivision === 'scdf' || aiDivision === 'spf') return aiDivision;
  const fireTypes = ['fire', 'smoke', 'gas_leak'];
  if (fireTypes.includes(issueType)) return 'scdf';
  return 'spf';
}

function parseJsonResponse(raw) {
  const cleaned = raw.replace(/```json|```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error('Could not understand the AI response. Please try again.');
  }
}

async function rekaChat({ prompt, imageUrl, maxTokens = 400 }) {
  const content = [{ type: 'text', text: prompt }];
  if (imageUrl) {
    content.push({ type: 'image_url', image_url: { url: imageUrl } });
  }

  const response = await fetch(`${REKA_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${REKA_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'reka-flash',
      temperature: 0.2,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`AI analysis failed (${response.status}). ${errText}`.trim());
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content ?? '';
}

function clampPriority(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 3;
  return Math.min(5, Math.max(1, Math.round(n)));
}

export async function analyzeReportImage(imageUrl, location) {
  const locationHint = location
    ? ` The photo was taken at approximately latitude ${location.lat.toFixed(5)}, longitude ${location.lng.toFixed(5)}${location.address ? ` (${location.address})` : ''}.`
    : '';

  const divisionGuide = DIVISIONS.map(
    (d) => `"${d}" (${DIVISION_LABELS[d]}: ${DIVISION_DESCRIPTIONS[d]})`
  ).join('\n');

  const prompt = `You are analysing a photo for Voice of the City — a civic reporting app in Singapore.${locationHint}

If the photo shows an ACTIVE emergency (fire, smoke, medical distress, gas leak, active crime, serious assault), set isEmergency to true and route to scdf (fire/rescue/medical) or spf (crime in progress). Citizens must also call 995 or 999.

Route the issue to exactly ONE agency:

${divisionGuide}

Routing rules (location matters — inside HDB estate vs public road vs park):
- Fire, smoke, gas leak, medical emergency, rescue → scdf (set isEmergency true)
- Active crime, assault, robbery in progress → spf (set isEmergency true)
- Estate corridor lights, lifts, playgrounds, HDB footpaths, rubbish chutes → town_council or hdb
- Public roads, traffic signs, street lighting on roads, illegal parking → lta
- Litter, pests, smoking, pollution, noise → nea
- Parks, trees, greenery, animals in green spaces → nparks
- Drains, flooding, water leaks, sewer → pub
- Building defects, dangerous structures → bca or hdb
- State/vacant land → sla
- Illegal structures, unauthorized land use → ura
- Community/neighbour matters → pa
- Non-urgent vandalism, nuisance, non-emergency police matters → spf
- Food hygiene, pests in food shops → sfa
- When unsure inside a residential estate → town_council

Priority (1 = lowest, 5 = highest non-emergency urgency):
- 5: Serious hazard but not a 995/999 emergency
- 4: Major infrastructure issue affecting many people
- 3: Standard issue affecting public use
- 2: Minor nuisance
- 1: Cosmetic or very low impact

Respond with ONLY a JSON object — no markdown fences:
{"issueType": one of [${ISSUE_TYPES.map((t) => `"${t}"`).join(', ')}], "severity": one of ["low","medium","high"], "description": "one-sentence factual description", "division": one of [${DIVISIONS.map((d) => `"${d}"`).join(', ')}], "divisionReason": "one sentence why this agency", "priority": integer 1-5, "isEmergency": boolean}`;

  const raw = await rekaChat({ prompt, imageUrl, maxTokens: 500 });
  const parsed = parseJsonResponse(raw);

  let division = normalizeDivision(parsed.division);
  const isEmergency = Boolean(parsed.isEmergency);
  if (isEmergency) {
    division = routeEmergencyDivision(parsed.issueType, division);
  }

  return {
    issueType: ISSUE_TYPES.includes(parsed.issueType) ? parsed.issueType : 'other',
    severity: SEVERITIES.includes(parsed.severity) ? parsed.severity : 'medium',
    description: typeof parsed.description === 'string' ? parsed.description : '',
    division,
    divisionReason: typeof parsed.divisionReason === 'string' ? parsed.divisionReason : '',
    priority: clampPriority(parsed.priority),
    isEmergency,
  };
}

export async function generateAdminReport(report) {
  const imageUrl = report.images?.[0] || report.latestImageUrl;
  if (!imageUrl) throw new Error('No image available for this report.');

  const locationLabel =
    report.location?.address ||
    (report.location
      ? `${report.location.lat?.toFixed(5)}, ${report.location.lng?.toFixed(5)}`
      : 'Unknown');

  const prompt = `You are preparing a formal incident briefing for Singapore city administrators reviewing a non-emergency citizen report.

Report context:
- Issue type: ${formatIssueLabel(report.issueType)}
- Severity: ${report.severity || 'unknown'}
- Location: ${locationLabel}
- Citizen description: ${report.description || 'None provided'}
- AI-suggested agency: ${formatDivisionLabel(report.aiDivision || report.division)} (${report.divisionReason || 'No reason recorded'})
- Priority level: ${report.priority || 3}/5
- Reports submitted for this issue: ${report.count || 1}
- Possible emergency detected: ${report.isEmergency ? 'yes — citizen should also call 995/999' : 'no'}

Look at the photo and write a comprehensive admin briefing. Respond with ONLY a JSON object — no markdown fences:
{
  "summary": "2-3 sentence executive summary",
  "detailedAssessment": "Full paragraph describing what is visible, likely cause, and scope of the problem",
  "recommendedActions": ["action 1", "action 2", "action 3"],
  "urgencyJustification": "Why this priority level is appropriate",
  "divisionRationale": "Why the assigned agency should handle this under Singapore's OneService model",
  "publicSafetyNotes": "Any safety concerns for staff or public, or 'None identified'",
  "estimatedImpact": "Who/what is affected and how severely"
}`;

  const raw = await rekaChat({ prompt, imageUrl, maxTokens: 900 });
  const parsed = parseJsonResponse(raw);

  return {
    summary: parsed.summary || '',
    detailedAssessment: parsed.detailedAssessment || '',
    recommendedActions: Array.isArray(parsed.recommendedActions) ? parsed.recommendedActions : [],
    urgencyJustification: parsed.urgencyJustification || '',
    divisionRationale: parsed.divisionRationale || '',
    publicSafetyNotes: parsed.publicSafetyNotes || '',
    estimatedImpact: parsed.estimatedImpact || '',
    generatedAt: new Date().toISOString(),
  };
}
