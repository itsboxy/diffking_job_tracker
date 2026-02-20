import React, { useState } from 'react';
import { BookOpen, Car, ExternalLink, Search, Wrench } from 'lucide-react';
import SideNav from '../components/SideNav';
import { openExternalUrl } from '../utils/ipc';

const BEARING_CATALOG_URL = 'https://size.name/en/catalog/podshipnik';

interface Bearing {
  position: string;
  partNumber: string;
}

interface DiffEntry {
  model: string;
  cars: string[];
  bearings: Bearing[];
  notes?: string;
}

// ─── Diff Reference Data ──────────────────────────────────────────────────────
// Fill in actual bearing part numbers as needed.
const DIFF_DATA: DiffEntry[] = [
  {
    model: 'M75',
    cars: [
      'Mitsubishi Triton MK (1996–2006)',
      'Mitsubishi Triton ML / MN (2006–2015)',
      'Mitsubishi Pajero Sport (2008–2019)',
    ],
    bearings: [
      { position: 'Pinion Front Bearing', partNumber: '—' },
      { position: 'Pinion Rear Bearing',  partNumber: '—' },
      { position: 'Carrier Bearing (L)',  partNumber: '—' },
      { position: 'Carrier Bearing (R)',  partNumber: '—' },
    ],
    notes: 'Update bearing part numbers with actual specs.',
  },
  {
    model: 'H233B',
    cars: [
      'Nissan Patrol GQ (1988–1997)',
      'Nissan Patrol GU (1997–2016)',
      'Nissan Navara D22 (1997–2015)',
    ],
    bearings: [
      { position: 'Pinion Front Bearing', partNumber: '—' },
      { position: 'Pinion Rear Bearing',  partNumber: '—' },
      { position: 'Carrier Bearing (L)',  partNumber: '—' },
      { position: 'Carrier Bearing (R)',  partNumber: '—' },
    ],
    notes: 'Update bearing part numbers with actual specs.',
  },
  {
    model: 'R200',
    cars: [
      'Nissan 200SX S13 / S14',
      'Nissan Skyline R32 / R33 / R34',
      'Nissan 300ZX Z32',
    ],
    bearings: [
      { position: 'Pinion Front Bearing', partNumber: '—' },
      { position: 'Pinion Rear Bearing',  partNumber: '—' },
      { position: 'Carrier Bearing (L)',  partNumber: '—' },
      { position: 'Carrier Bearing (R)',  partNumber: '—' },
    ],
    notes: 'Update bearing part numbers with actual specs.',
  },
  {
    model: 'C200K',
    cars: [
      'Toyota HiLux Surf (2002–2009)',
      'Toyota FJ Cruiser (2006–2014)',
      'Toyota 4Runner (2002–2009)',
    ],
    bearings: [
      { position: 'Pinion Front Bearing', partNumber: '—' },
      { position: 'Pinion Rear Bearing',  partNumber: '—' },
      { position: 'Carrier Bearing (L)',  partNumber: '—' },
      { position: 'Carrier Bearing (R)',  partNumber: '—' },
    ],
    notes: 'Update bearing part numbers with actual specs.',
  },
  {
    model: '9" Ford',
    cars: [
      'Ford Falcon XA–XF (1972–1988)',
      'Ford Mustang (1957–1986)',
      'Various custom / race builds',
    ],
    bearings: [
      { position: 'Pinion Front Bearing', partNumber: '—' },
      { position: 'Pinion Rear Bearing',  partNumber: '—' },
      { position: 'Carrier Bearing (L)',  partNumber: '—' },
      { position: 'Carrier Bearing (R)',  partNumber: '—' },
    ],
    notes: 'Update bearing part numbers with actual specs.',
  },
  {
    model: 'Toyota 7.5"',
    cars: [
      'Toyota HiLux LN / KZN / RZN (1983–2005)',
      'Toyota HiAce (2WD, 1982–2005)',
      'Toyota HiLux MK / ML (1997–2005)',
    ],
    bearings: [
      { position: 'Pinion Front Bearing', partNumber: '—' },
      { position: 'Pinion Rear Bearing',  partNumber: '—' },
      { position: 'Carrier Bearing (L)',  partNumber: '—' },
      { position: 'Carrier Bearing (R)',  partNumber: '—' },
    ],
    notes: 'Rear axle differential. Update bearing part numbers with actual specs.',
  },
  {
    model: 'Toyota 8"',
    cars: [
      'Toyota Land Cruiser 70 Series (1984–present)',
      'Toyota Land Cruiser Prado 90 / J120 (1996–2009)',
      'Toyota HiLux AN10 / AN20 (2005–2015)',
      'Toyota HiAce TRH / KDH (2005–present)',
    ],
    bearings: [
      { position: 'Pinion Front Bearing', partNumber: '—' },
      { position: 'Pinion Rear Bearing',  partNumber: '—' },
      { position: 'Carrier Bearing (L)',  partNumber: '—' },
      { position: 'Carrier Bearing (R)',  partNumber: '—' },
    ],
    notes: 'Rear axle differential. Update bearing part numbers with actual specs.',
  },
  {
    model: 'Toyota 9.5"',
    cars: [
      'Toyota Land Cruiser 80 Series FZJ80 / HDJ80 (1990–1997)',
      'Toyota Land Cruiser 100 Series UZJ100 / HDJ100 (1998–2007)',
      'Toyota Land Cruiser 200 Series (2007–2021)',
    ],
    bearings: [
      { position: 'Pinion Front Bearing', partNumber: '—' },
      { position: 'Pinion Rear Bearing',  partNumber: '—' },
      { position: 'Carrier Bearing (L)',  partNumber: '—' },
      { position: 'Carrier Bearing (R)',  partNumber: '—' },
    ],
    notes: 'Rear axle differential. Update bearing part numbers with actual specs.',
  },
];
// ─────────────────────────────────────────────────────────────────────────────

const HandbookRepairScreen: React.FC = () => {
  const [search, setSearch] = useState('');

  const filtered = DIFF_DATA.filter((entry) => {
    const q = search.toLowerCase();
    return (
      entry.model.toLowerCase().includes(q) ||
      entry.cars.some((c) => c.toLowerCase().includes(q))
    );
  });

  return (
    <div className="app-shell">
      <SideNav />
      <main className="app-main">
        <div className="screen">
          <header className="screen-header">
            <div>
              <h1>
                <Wrench className="icon" />
                Repair Handbook
              </h1>
              <p className="muted">Differential reference — bearings &amp; vehicles</p>
            </div>
            <div className="header-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => openExternalUrl(BEARING_CATALOG_URL)}
                title="Open bearing catalog in browser"
              >
                <ExternalLink className="icon" />
                Bearing Catalog
              </button>
            </div>
          </header>

          <div className="input-with-icon" style={{ maxWidth: 340, marginBottom: 20 }}>
            <Search className="icon" />
            <input
              type="text"
              placeholder="Search model or vehicle…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {filtered.length === 0 && (
            <p className="muted">No results for &ldquo;{search}&rdquo;.</p>
          )}

          <div className="handbook-diff-grid">
            {filtered.map((entry) => (
              <div className="handbook-diff-card" key={entry.model}>
                <div className="handbook-diff-header">
                  <span className="handbook-diff-model">{entry.model}</span>
                </div>

                <div className="handbook-diff-section">
                  <span className="handbook-label">
                    <Car className="icon" style={{ width: 12, height: 12 }} />
                    Vehicles
                  </span>
                  <ul className="handbook-car-list">
                    {entry.cars.map((car) => (
                      <li key={car}>{car}</li>
                    ))}
                  </ul>
                </div>

                <div className="handbook-diff-section">
                  <span className="handbook-label">
                    <BookOpen className="icon" style={{ width: 12, height: 12 }} />
                    Bearings
                  </span>
                  <table className="handbook-bearings-table">
                    <tbody>
                      {entry.bearings.map((b) => (
                        <tr key={b.position}>
                          <td className="bearing-position">{b.position}</td>
                          <td className={`bearing-part ${b.partNumber === '—' ? 'bearing-empty' : ''}`}>
                            {b.partNumber !== '—' ? (
                              <button
                                type="button"
                                className="bearing-search-btn"
                                title={`Search ${b.partNumber} in catalog`}
                                onClick={() =>
                                  openExternalUrl(
                                    `https://size.name/en/catalog/podshipnik?search=${encodeURIComponent(b.partNumber)}`
                                  )
                                }
                              >
                                {b.partNumber}
                                <ExternalLink size={10} />
                              </button>
                            ) : (
                              b.partNumber
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {entry.notes && (
                  <p className="handbook-notes">{entry.notes}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default HandbookRepairScreen;
