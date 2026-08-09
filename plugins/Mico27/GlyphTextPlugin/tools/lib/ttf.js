// Minimal TrueType/OpenType reader: character map plus embedded bitmap strikes.
//
// Pixel fonts ship in two shapes and this handles both by reading the file
// directly, with no font engine involved:
//
//   * BITMAP fonts (EBLC/EBDT, or CBLC/CBDT) store the actual pixels for one or
//     more pixel sizes. Reading them gives exactly the glyph the designer drew.
//     Some of these fonts have no outlines at all -- ark-pixel's ".bitmap.ttf"
//     builds have an empty `glyf` table -- and GDI+/DirectWrite refuse to render
//     them, so this is the only way to get at them.
//
//   * OUTLINE fonts have to be rasterised; make_glyph_fonts.js hands those to
//     GDI+ instead (see renderWithGdiPlus).
//
// Only what the generator needs is parsed: cmap formats 4/6/12, EBLC index
// formats 1-5 and image formats 1/2/5/6/7 (monochrome, 1 bit per pixel).

const fs = require("fs");

const readTables = (buf) => {
  let base = 0;
  const tag = buf.readUInt32BE(0);
  if (tag === 0x74746366) {
    // 'ttcf': font collection, take the first font
    base = buf.readUInt32BE(12);
  }
  const numTables = buf.readUInt16BE(base + 4);
  const tables = {};
  for (let i = 0; i < numTables; i++) {
    const o = base + 12 + i * 16;
    tables[buf.toString("ascii", o, o + 4).trim()] = {
      off: buf.readUInt32BE(o + 8),
      len: buf.readUInt32BE(o + 12),
    };
  }
  return tables;
};

// ------------------------------------------------------------------- cmap

const readCmapSubtable = (buf, off, map) => {
  const format = buf.readUInt16BE(off);
  if (format === 4) {
    const segX2 = buf.readUInt16BE(off + 6);
    const endO = off + 14;
    const startO = endO + segX2 + 2;
    const deltaO = startO + segX2;
    const rangeO = deltaO + segX2;
    for (let s = 0; s < segX2 / 2; s++) {
      const end = buf.readUInt16BE(endO + s * 2);
      const start = buf.readUInt16BE(startO + s * 2);
      const delta = buf.readInt16BE(deltaO + s * 2);
      const rangeOffset = buf.readUInt16BE(rangeO + s * 2);
      if (start > end) continue;
      for (let c = start; c <= end; c++) {
        let g;
        if (rangeOffset === 0) {
          g = (c + delta) & 0xffff;
        } else {
          const gi = rangeO + s * 2 + rangeOffset + (c - start) * 2;
          if (gi + 1 >= buf.length) continue;
          g = buf.readUInt16BE(gi);
          if (g) g = (g + delta) & 0xffff;
        }
        if (g) map.set(c, g);
        if (c === 0xffff) break;
      }
    }
  } else if (format === 6) {
    const first = buf.readUInt16BE(off + 6);
    const count = buf.readUInt16BE(off + 8);
    for (let i = 0; i < count; i++) {
      const g = buf.readUInt16BE(off + 10 + i * 2);
      if (g) map.set(first + i, g);
    }
  } else if (format === 12) {
    const nGroups = buf.readUInt32BE(off + 12);
    for (let i = 0; i < nGroups; i++) {
      const o = off + 16 + i * 12;
      const startChar = buf.readUInt32BE(o);
      const endChar = buf.readUInt32BE(o + 4);
      const startGlyph = buf.readUInt32BE(o + 8);
      for (let c = startChar; c <= endChar; c++) map.set(c, startGlyph + (c - startChar));
    }
  }
};

const readCmap = (buf, tables) => {
  const map = new Map();
  if (!tables.cmap) return map;
  const C = tables.cmap.off;
  const n = buf.readUInt16BE(C + 2);
  let best = null;
  let bestScore = -1;
  for (let i = 0; i < n; i++) {
    const o = C + 4 + i * 8;
    const pid = buf.readUInt16BE(o);
    const eid = buf.readUInt16BE(o + 2);
    const sub = C + buf.readUInt32BE(o + 4);
    const format = buf.readUInt16BE(sub);
    // prefer full-Unicode subtables over BMP-only ones
    let score = -1;
    if (format === 12) score = pid === 3 && eid === 10 ? 5 : 4;
    else if (format === 4) score = pid === 3 && eid === 1 ? 3 : 2;
    else if (format === 6) score = 1;
    if (score > bestScore) {
      bestScore = score;
      best = sub;
    }
  }
  if (best !== null) readCmapSubtable(buf, best, map);
  return map;
};

// ----------------------------------------------------------- bitmap strikes

// sbitLineMetrics is 12 bytes; only the ascender matters for placing a glyph
const readStrikes = (buf, tables) => {
  const loc = tables.EBLC ? "EBLC" : tables.CBLC ? "CBLC" : null;
  const dat = tables.EBDT ? "EBDT" : tables.CBDT ? "CBDT" : null;
  if (!loc || !dat) return [];
  const L = tables[loc].off;
  const D = tables[dat].off;
  const numSizes = buf.readUInt32BE(L + 4);
  const strikes = [];
  for (let s = 0; s < numSizes; s++) {
    const o = L + 8 + s * 48;
    const strike = {
      dataOffset: D,
      indexArray: L + buf.readUInt32BE(o),
      numSubTables: buf.readUInt32BE(o + 8),
      ascender: buf.readInt8(o + 16),
      descender: buf.readInt8(o + 17),
      startGlyph: buf.readUInt16BE(o + 40),
      endGlyph: buf.readUInt16BE(o + 42),
      ppemX: buf[o + 44],
      ppemY: buf[o + 45],
      bitDepth: buf[o + 46],
      base: L,
    };
    strikes.push(strike);
  }
  return strikes;
};

// read `count` bits starting at bit position `bit` of buf, MSB first
const bitAt = (buf, byteBase, bit) =>
  (buf[byteBase + (bit >> 3)] >> (7 - (bit & 7))) & 1;

// decode one glyph of a strike into { w, h, rows } where rows[y] has bit
// (w - 1 - x) set for ink at x. w is the glyph's advance, so half-width ASCII
// in a 16px CJK font comes back as w = 8.
const strikeGlyph = (buf, strike, gid) => {
  if (gid < strike.startGlyph || gid > strike.endGlyph) return null;
  for (let k = 0; k < strike.numSubTables; k++) {
    const a = strike.indexArray + k * 8;
    const first = buf.readUInt16BE(a);
    const last = buf.readUInt16BE(a + 2);
    if (gid < first || gid > last) continue;
    const t = strike.indexArray + buf.readUInt32BE(a + 4);
    const indexFormat = buf.readUInt16BE(t);
    const imageFormat = buf.readUInt16BE(t + 2);
    const imageDataOffset = buf.readUInt32BE(t + 4);

    let dataStart = null;
    let dataEnd = null;
    let metrics = null;

    if (indexFormat === 1) {
      const p = t + 8 + (gid - first) * 4;
      dataStart = buf.readUInt32BE(p);
      dataEnd = buf.readUInt32BE(p + 4);
    } else if (indexFormat === 2) {
      const imageSize = buf.readUInt32BE(t + 8);
      metrics = readBigMetrics(buf, t + 12);
      dataStart = (gid - first) * imageSize;
      dataEnd = dataStart + imageSize;
    } else if (indexFormat === 3) {
      const p = t + 8 + (gid - first) * 2;
      dataStart = buf.readUInt16BE(p);
      dataEnd = buf.readUInt16BE(p + 2);
    } else if (indexFormat === 4) {
      const numGlyphs = buf.readUInt32BE(t + 8);
      for (let i = 0; i < numGlyphs; i++) {
        const p = t + 12 + i * 4;
        if (buf.readUInt16BE(p) === gid) {
          dataStart = buf.readUInt16BE(p + 2);
          dataEnd = buf.readUInt16BE(p + 6);
          break;
        }
      }
      if (dataStart === null) return null;
    } else if (indexFormat === 5) {
      const imageSize = buf.readUInt32BE(t + 8);
      metrics = readBigMetrics(buf, t + 12);
      const numGlyphs = buf.readUInt32BE(t + 20);
      let idx = -1;
      for (let i = 0; i < numGlyphs; i++) {
        if (buf.readUInt16BE(t + 24 + i * 2) === gid) {
          idx = i;
          break;
        }
      }
      if (idx < 0) return null;
      dataStart = idx * imageSize;
      dataEnd = dataStart + imageSize;
    } else {
      return null;
    }
    if (dataEnd <= dataStart) return null;   // empty glyph (space)

    let p = strike.dataOffset + imageDataOffset + dataStart;
    let bitAligned = false;
    if (imageFormat === 1) {
      metrics = readSmallMetrics(buf, p);
      p += 5;
    } else if (imageFormat === 2) {
      metrics = readSmallMetrics(buf, p);
      p += 5;
      bitAligned = true;
    } else if (imageFormat === 5) {
      bitAligned = true;             // metrics came from the index subtable
    } else if (imageFormat === 6) {
      metrics = readBigMetrics(buf, p);
      p += 8;
    } else if (imageFormat === 7) {
      metrics = readBigMetrics(buf, p);
      p += 8;
      bitAligned = true;
    } else {
      return null;                   // 8/9 are composites, 17-19 are PNG colour
    }
    if (!metrics) return null;
    return renderStrikeBitmap(buf, p, metrics, strike, bitAligned);
  }
  return null;
};

const readSmallMetrics = (buf, o) => ({
  height: buf[o],
  width: buf[o + 1],
  bearingX: buf.readInt8(o + 2),
  bearingY: buf.readInt8(o + 3),
  advance: buf[o + 4],
});

const readBigMetrics = (buf, o) => ({
  height: buf[o],
  width: buf[o + 1],
  bearingX: buf.readInt8(o + 2),
  bearingY: buf.readInt8(o + 3),
  advance: buf[o + 4],
});

const renderStrikeBitmap = (buf, p, m, strike, bitAligned) => {
  const cellW = m.advance > 0 ? m.advance : m.width;
  // a 16px cell whatever the strike's own size, so a glyph placed low by its
  // metrics is never cut off at the bottom
  const cellH = Math.max(16, strike.ppemY);
  const rows = new Array(cellH).fill(0);
  const bytesPerRow = Math.ceil(m.width / 8);
  for (let y = 0; y < m.height; y++) {
    const oy = strike.ascender - m.bearingY + y;
    if (oy < 0 || oy >= cellH) continue;
    let row = 0;
    for (let x = 0; x < m.width; x++) {
      const bit = bitAligned
        ? bitAt(buf, p, y * m.width + x)
        : bitAt(buf, p + y * bytesPerRow, x);
      const ox = m.bearingX + x;
      if (bit && ox >= 0 && ox < cellW) row |= 1 << (cellW - 1 - ox);
    }
    rows[oy] |= row;
  }
  return { w: cellW, h: cellH, rows, measured: true };
};

// --------------------------------------------------------------------- api

const openFont = (file) => {
  const buf = fs.readFileSync(file);
  const tables = readTables(buf);
  const cmap = readCmap(buf, tables);
  const strikes = readStrikes(buf, tables);
  const hasOutlines = (tables.glyf && tables.glyf.len > 16) || !!tables["CFF"];
  return {
    file,
    buf,
    tables,
    cmap,
    strikes,
    hasOutlines,
    // the strike whose vertical size matches `ppem`, else the closest one
    pickStrike(ppem) {
      if (!strikes.length) return null;
      let best = strikes[0];
      for (const s of strikes) {
        if (Math.abs(s.ppemY - ppem) < Math.abs(best.ppemY - ppem)) best = s;
      }
      return best;
    },
    glyphFor(strike, codepoint) {
      const gid = cmap.get(codepoint);
      if (gid === undefined) return null;
      return strikeGlyph(buf, strike, gid);
    },
    has(codepoint) {
      return cmap.has(codepoint);
    },
  };
};

module.exports = { openFont };
