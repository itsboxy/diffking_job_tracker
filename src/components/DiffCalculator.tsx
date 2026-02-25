import React, { useMemo, useState } from 'react';
import { Wrench } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

export type DiffSuspType = 'leaf_spring' | 'coil_over';

export interface DiffConfig {
  id: string;
  name: string;           // e.g. "Drum (Standard)" | "EA/EB Disc Conversion"
  drumFlange: number;     // mm per side (0 = disc/no flange)
  bearingOffset: number;  // mm per side (inner flange face → bearing seat)
  notes?: string;
}

export interface DiffSpec {
  id: string;
  name: string;
  type: DiffSuspType;
  drumToDrum: number;         // standard axle-end-to-axle-end width, mm
  housingHalfWidth: number;   // mm from housing centre to tube entry (housing bolt face)
  minLength?: number;          // minimum permissible axle-end-to-axle-end, mm
  springSaddleSpan?: number;   // spring saddle mount centre-to-centre, mm
  configs: DiffConfig[];
}

// ── Hardcoded library (Phase 1) — will be Supabase-backed later ───────────────

const DIFF_SPECS: DiffSpec[] = [
  {
    id: 'ford-xy',
    name: 'Ford XY Falcon',
    type: 'leaf_spring',
    drumToDrum: 1515,
    housingHalfWidth: 175,   // verify against actual housing measurement
    minLength: 1293,
    springSaddleSpan: 1130,
    configs: [
      {
        id: 'ford-xy-drum',
        name: 'Drum (Standard)',
        drumFlange: 3,
        bearingOffset: 62.5,
      },
      {
        id: 'ford-xy-disc-eaeb',
        name: 'EA/EB Disc Conversion',
        drumFlange: 0,
        bearingOffset: 56,
        notes: 'Disc brake conversion — bearing offset reduces to 56 mm',
      },
    ],
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

const fmt = (n: number) => (n % 1 === 0 ? `${n}` : n.toFixed(1));
const fmtMm = (n: number) => `${fmt(n)} mm`;

// ── Diagram types & SVG coordinate constants ───────────────────────────────────
// SVG schematic is NOT to scale — coords are layout positions only.
// Outer axle-end span (drumToDrum) maps x=28 → x=752 (724 px total).

const SX = {
  leftOuter:   28,   // left face of left axle flange
  leftWeld:    42,   // left weld end  (inner face of left flange)
  leftHousing: 268,  // left housing face (tube entry into centre carrier)
  cx:          390,  // centre of housing
  rightHousing:512,  // right housing face
  rightWeld:   738,  // right weld end (inner face of right flange)
  rightOuter:  752,  // right face of right axle flange
} as const;

interface DiagramValues {
  drumToDrum?: number;
  weldToWeld?: number;
  bearingOffset?: number;
  axleEach?: number;
  axleToAxle?: number;
  tubeLengthEach?: number;
  springSaddleSpan?: number;
  shortenedDrumToDrum?: number;
  shortenedWeldToWeld?: number;
  shortenedAxleEach?: number;
  shortenedTubeLengthEach?: number;
  isShortened: boolean;
}

// ── Leaf-spring diagram ────────────────────────────────────────────────────────

const LeafSpringDiagramPlaceholder: React.FC<{ vals: DiagramValues }> = ({ vals }) => {
  const dash = (n: number | undefined, shortened?: number) => {
    if (n === undefined) return '— mm';
    const base = fmtMm(n);
    if (vals.isShortened && shortened !== undefined) return `${base} → ${fmtMm(shortened)}`;
    return base;
  };

  // Pixel scale: SVG outer span (724 px) maps to real drumToDrum
  const scale = vals.drumToDrum ? 724 / vals.drumToDrum : null;

  // Spring saddle SVG X positions (scaled relative to centre)
  const saddleLeftX  = scale && vals.springSaddleSpan ? SX.cx - (vals.springSaddleSpan / 2) * scale : null;
  const saddleRightX = scale && vals.springSaddleSpan ? SX.cx + (vals.springSaddleSpan / 2) * scale : null;

  return (
    <div className="diff-diagram-wrap">
      <svg
        viewBox="0 0 780 270"
        className="diff-diagram-svg"
        aria-label="Leaf spring differential schematic"
      >
        {/* ── Tube length dimension lines (top strip) ── */}
        {/* Left: weld end → housing face */}
        <line x1={SX.leftWeld} y1="34" x2={SX.leftHousing} y2="34" className="diff-svg-tube-len-line" />
        <line x1={SX.leftWeld}    y1="29" x2={SX.leftWeld}    y2="39" className="diff-svg-tube-len-tick" />
        <line x1={SX.leftHousing} y1="29" x2={SX.leftHousing} y2="39" className="diff-svg-tube-len-tick" />
        <text x={(SX.leftWeld + SX.leftHousing) / 2} y="26" textAnchor="middle" className="diff-svg-tube-len-text">Left Tube Length</text>
        <text x={(SX.leftWeld + SX.leftHousing) / 2} y="14" textAnchor="middle" className="diff-svg-tube-len-val">
          {dash(vals.tubeLengthEach, vals.shortenedTubeLengthEach)}
        </text>

        {/* Right: housing face → weld end */}
        <line x1={SX.rightHousing} y1="34" x2={SX.rightWeld} y2="34" className="diff-svg-tube-len-line" />
        <line x1={SX.rightHousing} y1="29" x2={SX.rightHousing} y2="39" className="diff-svg-tube-len-tick" />
        <line x1={SX.rightWeld}    y1="29" x2={SX.rightWeld}    y2="39" className="diff-svg-tube-len-tick" />
        <text x={(SX.rightHousing + SX.rightWeld) / 2} y="26" textAnchor="middle" className="diff-svg-tube-len-text">Right Tube Length</text>
        <text x={(SX.rightHousing + SX.rightWeld) / 2} y="14" textAnchor="middle" className="diff-svg-tube-len-val">
          {dash(vals.tubeLengthEach, vals.shortenedTubeLengthEach)}
        </text>

        {/* ── Assembly ── */}
        {/* Left axle flange */}
        <rect x="28" y="100" width="14" height="74" rx="2" className="diff-svg-drum" />
        <text x="35" y="190" textAnchor="middle" className="diff-svg-label-small">AXLE</text>

        {/* Left axle tube */}
        <rect x="42" y="122" width="226" height="30" className="diff-svg-tube" />

        {/* Centre carrier housing body */}
        <rect x="268" y="80" width="244" height="114" rx="8" className="diff-svg-carrier" />
        {/* Carrier face circle (ring gear / carrier face representation) */}
        <circle cx="390" cy="137" r="42" className="diff-svg-carrier-circle" />
        {/* Left bolts × 2 */}
        <circle cx="366" cy="120" r="5" className="diff-svg-bolt" />
        <circle cx="366" cy="154" r="5" className="diff-svg-bolt" />
        {/* Right bolt × 1 */}
        <circle cx="414" cy="137" r="5" className="diff-svg-bolt" />
        <text x="390" y="133" textAnchor="middle" className="diff-svg-carrier-label">DIFF</text>
        <text x="390" y="148" textAnchor="middle" className="diff-svg-carrier-label">CARRIER</text>

        {/* Right axle tube */}
        <rect x="512" y="122" width="226" height="30" className="diff-svg-tube" />

        {/* Right axle flange */}
        <rect x="738" y="100" width="14" height="74" rx="2" className="diff-svg-drum" />
        <text x="745" y="190" textAnchor="middle" className="diff-svg-label-small">AXLE</text>

        {/* ── Spring saddle position markers ── */}
        {saddleLeftX !== null && (
          <g>
            <line x1={saddleLeftX} y1="116" x2={saddleLeftX} y2="158" className="diff-svg-saddle-marker" />
            <line x1={saddleLeftX - 7} y1="116" x2={saddleLeftX + 7} y2="116" className="diff-svg-saddle-tick" />
            <line x1={saddleLeftX - 7} y1="158" x2={saddleLeftX + 7} y2="158" className="diff-svg-saddle-tick" />
            <text x={saddleLeftX} y="111" textAnchor="middle" className="diff-svg-saddle-label">SADDLE</text>
          </g>
        )}
        {saddleRightX !== null && (
          <g>
            <line x1={saddleRightX} y1="116" x2={saddleRightX} y2="158" className="diff-svg-saddle-marker" />
            <line x1={saddleRightX - 7} y1="116" x2={saddleRightX + 7} y2="116" className="diff-svg-saddle-tick" />
            <line x1={saddleRightX - 7} y1="158" x2={saddleRightX + 7} y2="158" className="diff-svg-saddle-tick" />
            <text x={saddleRightX} y="111" textAnchor="middle" className="diff-svg-saddle-label">SADDLE</text>
          </g>
        )}

        {/* ── Bearing offset markers ── */}
        <line x1={SX.leftWeld} y1="112" x2="114" y2="112" className="diff-svg-bearing-line" />
        <line x1={SX.leftWeld} y1="108" x2={SX.leftWeld} y2="116" className="diff-svg-bearing-tick" />
        <line x1="114" y1="108" x2="114" y2="116" className="diff-svg-bearing-tick" />
        <text x="78" y="106" textAnchor="middle" className="diff-svg-bearing-text">bearing offset</text>
        <text x="78" y="96" textAnchor="middle" className="diff-svg-bearing-val">
          {vals.bearingOffset !== undefined ? fmtMm(vals.bearingOffset) : '—'}
        </text>

        {/* Right bearing offset */}
        <line x1="666" y1="112" x2={SX.rightWeld} y2="112" className="diff-svg-bearing-line" />
        <line x1="666"           y1="108" x2="666"           y2="116" className="diff-svg-bearing-tick" />
        <line x1={SX.rightWeld}  y1="108" x2={SX.rightWeld}  y2="116" className="diff-svg-bearing-tick" />
        <text x="702" y="106" textAnchor="middle" className="diff-svg-bearing-text">bearing offset</text>
        <text x="702" y="96"  textAnchor="middle" className="diff-svg-bearing-val">
          {vals.bearingOffset !== undefined ? fmtMm(vals.bearingOffset) : '—'}
        </text>

        {/* ── Weld-to-weld dimension ── */}
        <line x1={SX.leftWeld} y1="210" x2={SX.rightWeld} y2="210" className="diff-svg-weld-line" />
        <line x1={SX.leftWeld}  y1="205" x2={SX.leftWeld}  y2="215" className="diff-svg-weld-tick" />
        <line x1={SX.rightWeld} y1="205" x2={SX.rightWeld} y2="215" className="diff-svg-weld-tick" />
        <text x={SX.cx} y="207" textAnchor="middle" className="diff-svg-weld-text">Weld to Weld</text>
        <text x={SX.cx} y="225" textAnchor="middle" className="diff-svg-weld-val">
          {dash(vals.weldToWeld, vals.shortenedWeldToWeld)}
        </text>

        {/* ── Axle end to axle end dimension ── */}
        <line x1={SX.leftOuter} y1="248" x2={SX.rightOuter} y2="248" className="diff-svg-dtd-line" />
        <line x1={SX.leftOuter}  y1="243" x2={SX.leftOuter}  y2="253" className="diff-svg-dtd-tick" />
        <line x1={SX.rightOuter} y1="243" x2={SX.rightOuter} y2="253" className="diff-svg-dtd-tick" />
        <text x={SX.cx} y="245" textAnchor="middle" className="diff-svg-dtd-text">Axle End to Axle End</text>
        <text x={SX.cx} y="263" textAnchor="middle" className="diff-svg-dtd-val">
          {dash(vals.drumToDrum, vals.shortenedDrumToDrum)}
        </text>
      </svg>
      <p className="diff-diagram-note muted">
        Placeholder diagram — replace with your SVG drawing (use SVG format, dimension lines will be overlaid)
      </p>
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────

const DiffCalculator: React.FC = () => {
  const [diffType, setDiffType] = useState<DiffSuspType>('leaf_spring');
  const [diffId, setDiffId] = useState('');
  const [configId, setConfigId] = useState('');
  const [shortenInput, setShortenInput] = useState('');

  const filteredDiffs = DIFF_SPECS.filter((d) => d.type === diffType);
  const selectedDiff = DIFF_SPECS.find((d) => d.id === diffId);
  const selectedConfig = selectedDiff?.configs.find((c) => c.id === configId);

  const handleTypeChange = (type: DiffSuspType) => {
    setDiffType(type);
    setDiffId('');
    setConfigId('');
    setShortenInput('');
  };

  const handleDiffChange = (id: string) => {
    setDiffId(id);
    const diff = DIFF_SPECS.find((d) => d.id === id);
    setConfigId(diff?.configs[0]?.id ?? '');
    setShortenInput('');
  };

  const calc = useMemo(() => {
    if (!selectedDiff || !selectedConfig) return null;
    const shorten = Math.max(0, parseFloat(shortenInput) || 0);
    const { drumToDrum, housingHalfWidth, minLength, springSaddleSpan } = selectedDiff;
    const { drumFlange, bearingOffset } = selectedConfig;

    const stdDrumToDrum    = drumToDrum;
    const stdWeldToWeld    = drumToDrum - drumFlange * 2;
    const stdAxleEach      = drumToDrum / 2 - drumFlange - bearingOffset;
    const stdAxleToAxle    = stdAxleEach * 2;
    const stdTubeLengthEach = drumToDrum / 2 - drumFlange - housingHalfWidth;

    const newDrumToDrum    = drumToDrum - shorten * 2;
    const newWeldToWeld    = newDrumToDrum - drumFlange * 2;
    const newAxleEach      = newDrumToDrum / 2 - drumFlange - bearingOffset;
    const newAxleToAxle    = newAxleEach * 2;
    const newTubeLengthEach = newDrumToDrum / 2 - drumFlange - housingHalfWidth;

    const tooShort = minLength !== undefined && newDrumToDrum < minLength;

    return {
      shorten, isShortened: shorten > 0,
      drumFlange, bearingOffset,
      stdDrumToDrum, stdWeldToWeld, stdAxleEach, stdAxleToAxle, stdTubeLengthEach,
      newDrumToDrum, newWeldToWeld, newAxleEach, newAxleToAxle, newTubeLengthEach,
      minLength, springSaddleSpan, housingHalfWidth, tooShort,
    };
  }, [selectedDiff, selectedConfig, shortenInput]);

  const diagramVals: DiagramValues = calc
    ? {
        drumToDrum:    calc.stdDrumToDrum,
        weldToWeld:    calc.stdWeldToWeld,
        bearingOffset: calc.bearingOffset,
        axleEach:      calc.stdAxleEach,
        axleToAxle:    calc.stdAxleToAxle,
        tubeLengthEach: calc.stdTubeLengthEach,
        springSaddleSpan: calc.springSaddleSpan,
        shortenedDrumToDrum:    calc.isShortened ? calc.newDrumToDrum    : undefined,
        shortenedWeldToWeld:    calc.isShortened ? calc.newWeldToWeld    : undefined,
        shortenedAxleEach:      calc.isShortened ? calc.newAxleEach      : undefined,
        shortenedTubeLengthEach: calc.isShortened ? calc.newTubeLengthEach : undefined,
        isShortened: calc.isShortened,
      }
    : { isShortened: false };

  return (
    <section className="diff-calc-section">
      {/* Header */}
      <div className="diff-calc-section-header">
        <Wrench className="icon" />
        <div>
          <h3>Differential Calculator</h3>
          <p className="muted">
            Select a differential to show standard measurements and calculate shortening
          </p>
        </div>
      </div>

      {/* Type toggle */}
      <div className="diff-type-toggle">
        <button
          type="button"
          className={`diff-type-btn${diffType === 'leaf_spring' ? ' active' : ''}`}
          onClick={() => handleTypeChange('leaf_spring')}
        >
          Leaf Spring
        </button>
        <button
          type="button"
          className={`diff-type-btn${diffType === 'coil_over' ? ' active' : ''}`}
          onClick={() => handleTypeChange('coil_over')}
        >
          Coil Over
        </button>
      </div>

      {/* Diff + config selectors */}
      <div className="diff-selectors">
        <label>
          Differential
          <select value={diffId} onChange={(e) => handleDiffChange(e.target.value)}>
            <option value="">— Select a differential —</option>
            {filteredDiffs.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </label>

        {selectedDiff && selectedDiff.configs.length > 1 && (
          <label>
            Configuration
            <select value={configId} onChange={(e) => setConfigId(e.target.value)}>
              {selectedDiff.configs.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
        )}
      </div>

      {/* Config note */}
      {selectedConfig?.notes && (
        <p className="diff-config-note muted">{selectedConfig.notes}</p>
      )}

      {/* Diagram */}
      {diffType === 'leaf_spring' && (
        <LeafSpringDiagramPlaceholder vals={diagramVals} />
      )}
      {diffType === 'coil_over' && (
        <div className="diff-diagram-wrap diff-diagram-placeholder">
          <p className="muted">Coil over diagram coming soon — provide SVG drawing</p>
        </div>
      )}

      {/* Shorten input */}
      {selectedConfig && (
        <div className="diff-shorten-row">
          <label>
            Shorten by
            <div className="diff-input-row">
              <input
                type="number"
                value={shortenInput}
                onChange={(e) => setShortenInput(e.target.value)}
                placeholder="0"
                min={0}
                step="0.5"
              />
              <span className="diff-unit">mm per side</span>
            </div>
          </label>
          {calc && calc.isShortened && (
            <span className="diff-shorten-summary muted">
              Total removed: {fmtMm(calc.shorten * 2)} ({fmtMm(calc.shorten)} × 2 sides)
            </span>
          )}
        </div>
      )}

      {/* Results table */}
      {calc && (
        <div className="diff-results">
          <div className="diff-results-head">
            <span>Measurement</span>
            <span>Standard</span>
            {calc.isShortened && (
              <span>Shortened (−{fmtMm(calc.shorten)}/side)</span>
            )}
          </div>

          <div className="diff-results-row">
            <span>Axle End to Axle End</span>
            <span>{fmtMm(calc.stdDrumToDrum)}</span>
            {calc.isShortened && (
              <span className="diff-val-changed">{fmtMm(calc.newDrumToDrum)}</span>
            )}
          </div>

          {calc.drumFlange > 0 && (
            <div className="diff-results-row">
              <span>Weld End to Weld End</span>
              <span>{fmtMm(calc.stdWeldToWeld)}</span>
              {calc.isShortened && (
                <span className="diff-val-changed">{fmtMm(calc.newWeldToWeld)}</span>
              )}
            </div>
          )}

          <div className="diff-results-row">
            <span>Bearing Offset (each side)</span>
            <span>{fmtMm(calc.bearingOffset)}</span>
            {calc.isShortened && <span className="diff-val-unchanged">—</span>}
          </div>

          <div className="diff-results-row diff-results-row--highlight">
            <span>Tube Length (each side)</span>
            <span>{fmtMm(calc.stdTubeLengthEach)}</span>
            {calc.isShortened && (
              <span className="diff-val-changed">{fmtMm(calc.newTubeLengthEach)}</span>
            )}
          </div>

          <div className="diff-results-row diff-results-row--highlight">
            <span>Axle Length (each side)</span>
            <span>{fmtMm(calc.stdAxleEach)}</span>
            {calc.isShortened && (
              <span className="diff-val-changed">{fmtMm(calc.newAxleEach)}</span>
            )}
          </div>

          <div className="diff-results-row">
            <span>Axle to Axle (combined)</span>
            <span>{fmtMm(calc.stdAxleToAxle)}</span>
            {calc.isShortened && (
              <span className="diff-val-changed">{fmtMm(calc.newAxleToAxle)}</span>
            )}
          </div>

          {/* Too-short warning */}
          {calc.isShortened && calc.tooShort && (
            <div className="diff-results-warning">
              Warning: shortened length {fmtMm(calc.newDrumToDrum)} is below the minimum
              {calc.minLength !== undefined && ` ${fmtMm(calc.minLength)}`} for this housing
            </div>
          )}

          {/* Reference values */}
          {(calc.springSaddleSpan !== undefined || calc.minLength !== undefined) && (
            <>
              <div className="diff-results-ref-head">
                <span>Reference</span>
              </div>

              {calc.springSaddleSpan !== undefined && (
                <div className="diff-results-row diff-results-row--ref">
                  <span>Spring Saddle C/C</span>
                  <span>{fmtMm(calc.springSaddleSpan)}</span>
                  {calc.isShortened && <span className="diff-val-unchanged">fixed</span>}
                </div>
              )}

              {calc.minLength !== undefined && (
                <div className="diff-results-row diff-results-row--ref">
                  <span>Min Housing Length</span>
                  <span>{fmtMm(calc.minLength)}</span>
                  {calc.isShortened && <span className="diff-val-unchanged">fixed</span>}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
};

export default DiffCalculator;
