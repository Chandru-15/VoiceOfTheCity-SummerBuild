import { formatDivisionLabel } from '../../helpers/rekaAI.js';
import './DivisionBadge.css';

const DIVISION_COLORS = {
  scdf: 'division--scdf',
  town_council: 'division--tc',
  hdb: 'division--hdb',
  lta: 'division--lta',
  nea: 'division--nea',
  nparks: 'division--nparks',
  pub: 'division--pub',
  bca: 'division--bca',
  sla: 'division--sla',
  ura: 'division--ura',
  pa: 'division--pa',
  spf: 'division--spf',
  sfa: 'division--sfa',
  organisation: 'division--tc',
  community_club: 'division--pa',
};

export default function DivisionBadge({ division, reason, compact }) {
  if (!division) return null;

  return (
    <div className={`division-badge ${DIVISION_COLORS[division] || 'division--default'}${compact ? ' division-badge--compact' : ''}`}>
      <span className="division-badge-label">{formatDivisionLabel(division)}</span>
      {!compact && reason && <span className="division-badge-reason">{reason}</span>}
    </div>
  );
}

export function PriorityBadge({ priority, isEmergency }) {
  if (priority == null) return null;
  return (
    <span className={`priority-badge priority-badge--p${priority}${isEmergency ? ' priority-badge--emergency' : ''}`}>
      P{priority}{isEmergency ? ' · Call 995/999' : ''}
    </span>
  );
}

export function EmergencyNotice({ isEmergency }) {
  if (!isEmergency) return null;
  return (
    <p className="report-status-text report-status-text--error" style={{ marginTop: 10 }}>
      This may be an emergency. Call <strong>995</strong> (SCDF) or <strong>999</strong> (Police) if anyone is in immediate danger.
    </p>
  );
}