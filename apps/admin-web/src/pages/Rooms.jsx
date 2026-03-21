import { useState } from "react";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Calibri:wght@400;600;700&display=swap');

  .sheet-wrapper {
    font-family: 'Calibri', 'Arial Narrow', Arial, sans-serif;
    font-size: 11px;
    background: #ffffff;
    padding: 8px;
    display: inline-block;
    min-width: 100%;
    overflow-x: auto;
  }

  .sheet-title {
    text-align: center;
    font-size: 13px;
    font-weight: 700;
    padding: 4px 0 6px 0;
    letter-spacing: 0.5px;
    color: #000;
  }

  table {
    border-collapse: collapse;
    width: 100%;
    table-layout: fixed;
  }

  th, td {
    border: 1px solid #9e9e9e;
    text-align: center;
    padding: 2px 3px;
    white-space: nowrap;
    overflow: hidden;
    line-height: 1.3;
  }

  .col-room { width: 52px; font-weight: 600; text-align: left; padding-left: 4px; }
  .col-data { width: 36px; }
  .col-total { width: 40px; font-weight: 700; }

  /* Section headers */
  .hdr-section {
    background: #4472c4;
    color: #fff;
    font-weight: 700;
    font-size: 12px;
    letter-spacing: 0.3px;
  }

  .hdr-venue {
    background: #dce6f1;
    color: #1f3864;
    font-size: 10.5px;
    font-style: italic;
    font-weight: 600;
  }

  .hdr-col {
    background: #bdd7ee;
    color: #1f3864;
    font-weight: 700;
    font-size: 10px;
    padding: 3px 2px;
  }

  /* Summary rows */
  .row-sum1 {
    background: #f4b942;
    color: #000;
    font-weight: 700;
  }

  .row-sum2 {
    background: #70ad47;
    color: #000;
    font-weight: 700;
  }

  /* Venue divider row */
  .row-venue {
    background: #d9e1f2;
    font-style: italic;
    font-size: 10.5px;
    color: #1f3864;
    font-weight: 600;
  }

  /* Data rows */
  .row-data td { background: #ffffff; }
  .row-data:hover td { background: #eff6fb; }

  /* Value cells */
  .val { color: #1a1a1a; }
  .val-total {
    background: #e2efda !important;
    font-weight: 700;
    color: #375623;
  }

  /* Bottom totals row */
  .row-footer td {
    background: #fce4d6;
    font-weight: 700;
    border-top: 2px solid #c55a11;
  }

  .divider-row td {
    background: #f2f2f2;
    border-top: 2px solid #808080;
    height: 4px;
    padding: 0;
  }

  /* Alternating slight tint for C vs MB rooms */
  .mb-row td { background: #f7fbff; }
  .mb-row:hover td { background: #ddeeff; }

  .scroll-container {
    overflow-x: auto;
    background: white;
    border: 1px solid var(--admin-border, #e5e7eb);
    border-radius: 4px;
    margin-top: 1rem;
  }

`;

// ─── DATA ───────────────────────────────────────────────────────────────────
const BRANCHES = ["AGE","BME","CE","CSE","AIML","CST","EE","ECE","IT","ME"];

// null = empty cell
const cBlockRooms = [
  { room:"C-301", reg:[19,16,null,null,null,null,null,null,null,null,35], blk:[1,null,null,null,null,null,null,null,null,null,36] },
  { room:"C-302", reg:[null,15,11,null,null,null,null,null,null,null,26], blk:[null,1,5,null,null,null,null,null,null,null,32] },
  { room:"C-303", reg:[null,null,null,24,16,null,null,null,null,null,40], blk:[null,null,null,null,null,null,null,null,null,null,40] },
  { room:"C-304", reg:[null,null,null,24,16,null,null,null,null,null,40], blk:[null,null,null,null,null,null,null,null,null,null,40] },
  { room:"C-305", reg:[null,null,null,24,16,null,null,null,null,null,40], blk:[null,null,null,null,null,null,null,null,null,null,40] },
  { room:"C-306", reg:[null,null,null,24,16,null,null,null,null,null,40], blk:[null,null,null,null,null,null,null,null,null,null,40] },
  { room:"C-307", reg:[null,null,null,23,16,null,null,null,null,null,39], blk:[null,null,null,null,null,null,null,null,null,null,39] },
  { room:"C-308", reg:[null,null,null,24,16,null,null,null,null,null,40], blk:[null,null,null,null,null,null,null,null,null,null,40] },
  { room:"C-309", reg:[null,null,null,16,7,16,null,null,null,null,39],    blk:[null,null,null,null,null,null,null,null,null,null,39] },
  { room:"C-310", reg:[null,null,null,16,null,16,null,null,null,null,32], blk:[null,null,null,null,7,null,null,null,null,null,39] },
  { room:"C-311", reg:[null,null,null,16,null,4,11,null,null,null,31],    blk:[null,null,null,null,null,4,null,null,null,null,35] },
  { room:"C-405", reg:[null,null,null,24,null,null,17,null,null,null,41], blk:[null,null,null,null,null,null,null,null,null,null,41] },
  { room:"C-407", reg:[null,null,null,17,null,16,null,null,null,null,33], blk:[null,null,null,null,null,null,null,null,null,null,33] },
  { room:"C-408", reg:[null,null,null,null,null,null,null,null,null,null,0],  blk:[null,null,20,null,null,6,null,null,null,null,26] },
  { room:"C-409", reg:[null,null,null,null,null,null,null,null,null,null,0],  blk:[null,null,null,null,null,null,null,null,null,null,0] },
];

const mbRooms = [
  { room:"MB-412", reg:[null,null,null,null,null,null,null,30,20,null,50], blk:[null,null,null,null,null,null,null,null,null,null,50] },
  { room:"MB-413", reg:[null,null,null,null,null,null,null,29,20,null,49], blk:[null,null,null,null,null,null,null,null,null,null,49] },
  { room:"MB-414", reg:[null,null,null,null,null,null,null,11,19,null,30], blk:[null,null,null,null,null,null,null,10,null,null,40] },
  { room:"MB-415", reg:[null,null,null,null,null,null,null,null,20,null,20],blk:[null,null,null,null,null,null,null,17,null,null,37] },
  { room:"MB-416", reg:[null,null,null,null,null,null,null,20,7,null,27],  blk:[null,null,null,null,null,null,null,null,8,null,35] },
  { room:"MB-417", reg:[null,null,null,null,null,null,null,2,19,null,21],  blk:[null,null,null,null,null,5,null,12,null,null,38] },
];

const footerRow = {
  reg:[0,0,0,0,0,0,0,0,0,0,0],
  blk:[0,0,0,0,0,0,0,0,0,0,0],
};

const sum1Reg = [21,32,12,233,109,36,44,71,102,28,682];
const sum1Blk = [1,1,5,21,7,6,6,33,12,9,782];
const sum2Reg = [19,31,11,282,103,36,44,70,101,26,673];
const sum2Blk = [1,1,5,20,7,4,6,32,12,8,769];

// ─── COMPONENT ──────────────────────────────────────────────────────────────
function Cell({ val, isTotal }) {
  if (val === null || val === undefined) return <td className="col-data" />;
  return (
    <td className={`col-data val ${isTotal ? "val-total col-total" : ""}`}>
      {val}
    </td>
  );
}

function DataRow({ room, reg, blk, isMB }) {
  return (
    <tr className={`row-data ${isMB ? "mb-row" : ""}`}>
      <td className="col-room">{room}</td>
      {reg.slice(0,10).map((v,i) => <Cell key={i} val={v} />)}
      <Cell val={reg[10]} isTotal />
      {blk.slice(0,10).map((v,i) => <Cell key={i} val={v} />)}
      <Cell val={blk[10]} isTotal />
    </tr>
  );
}

function SumRow({ label, reg, blk, cls }) {
  return (
    <tr className={cls}>
      <td className="col-room" style={{fontWeight:700}}>{label}</td>
      {reg.slice(0,10).map((v,i) => <td key={i} className="col-data">{v}</td>)}
      <td className="col-total" style={{fontWeight:800}}>{reg[10]}</td>
      {blk.slice(0,10).map((v,i) => <td key={i} className="col-data">{v}</td>)}
      <td className="col-total" style={{fontWeight:800}}>{blk[10]}</td>
    </tr>
  );
}

export default function SeatingPlan() {
  const [highlight, setHighlight] = useState(null);

  return (
    <>
      <style>{styles}</style>
      <div className="admin-card" style={{ padding: '1rem' }}>
        <h1 style={{ marginBottom: '1rem', fontSize: '1.35rem' }}>Room Allotment</h1>
        <div className="scroll-container">
          <div className="sheet-wrapper">
            <div className="sheet-title">1ST YEAR (1st SEMESTER)</div>

            <table>
              <colgroup>
                <col style={{width:52}} />
                {Array(10).fill(0).map((_,i) => <col key={i} style={{width:36}} />)}
                <col style={{width:42}} />
                {Array(10).fill(0).map((_,i) => <col key={i+11} style={{width:36}} />)}
                <col style={{width:42}} />
              </colgroup>

              <thead>
                {/* Row 1: Section headers */}
                <tr>
                  <th className="col-room" rowSpan={3} style={{verticalAlign:"middle",fontSize:11,fontWeight:700,background:"#f2f2f2"}}>
                    Room<br/>No
                  </th>
                  <th className="hdr-section" colSpan={11}>UG REGULAR</th>
                  <th className="hdr-section" colSpan={11}>UG BACKLOG</th>
                </tr>

                {/* Row 2: Venue */}
                <tr>
                  <th className="hdr-venue" colSpan={11}>(Venue: C Block – Formerly known as CMS Building)</th>
                  <th className="hdr-venue" colSpan={11}>(Venue: C Block – Formerly known as CMS Building)</th>
                </tr>

                {/* Row 3: Branch headers */}
                <tr>
                  {BRANCHES.map(b => <th key={b} className="hdr-col">{b}</th>)}
                  <th className="hdr-col" style={{background:"#9dc3e6",fontWeight:800}}>Total</th>
                  {BRANCHES.map(b => <th key={b+"b"} className="hdr-col">{b}</th>)}
                  <th className="hdr-col" style={{background:"#9dc3e6",fontWeight:800}}>Total</th>
                </tr>
              </thead>

              <tbody>
                {/* Summary row 1 */}
                <SumRow label="" reg={sum1Reg} blk={sum1Blk} cls="row-sum1" />
                {/* Summary row 2 */}
                <SumRow label="" reg={sum2Reg} blk={sum2Blk} cls="row-sum2" />

                {/* C-Block rooms */}
                {cBlockRooms.map(r => (
                  <DataRow key={r.room} room={r.room} reg={r.reg} blk={r.blk} isMB={false} />
                ))}

                {/* Venue divider - Main Building */}
                <tr className="row-venue">
                  <td className="col-room" />
                  <td colSpan={11} style={{textAlign:"center"}}>(Venue: Main Building)</td>
                  <td colSpan={11} style={{textAlign:"center"}}>(Venue: Main Building)</td>
                </tr>

                {/* MB rooms */}
                {mbRooms.map(r => (
                  <DataRow key={r.room} room={r.room} reg={r.reg} blk={r.blk} isMB={true} />
                ))}

                {/* Footer zero row */}
                <tr className="row-footer">
                  <td className="col-room" />
                  {footerRow.reg.slice(0,10).map((_,i) => <td key={i} className="col-data">0</td>)}
                  <td className="col-total">0</td>
                  {footerRow.blk.slice(0,10).map((_,i) => <td key={i} className="col-data">0</td>)}
                  <td className="col-total">0</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
