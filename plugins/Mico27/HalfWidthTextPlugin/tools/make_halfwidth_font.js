#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Half Width Text: font generator
//
// A narrow font asset for the HalfWidthTextPlugin: 96 ASCII characters in
// 8x8 cells, 128x48 pixels. Glyphs should be about 4px wide -- the plugin
// packs two of them into each 8px tile at runtime.
//
// Zero dependencies: PNGs are written with node's own zlib and .ttf files are
// parsed here. Embedded bitmap strikes are read directly when a font has them,
// which is what pixel fonts want; otherwise the glyphs are rasterised through
// GDI+ (Windows) using the font file itself, installed or not.
//
// Generated from GlyphTextPlugin's make_glyph_fonts.js by
// .maintenance/gen_text_plugin_font_tool.js -- edit that, not this.
// ---------------------------------------------------------------------------
const fs = require("fs");
const path = require("path");
const os = require("os");
const zlib = require("zlib");
const readline = require("readline");
const crypto = require("crypto");
const { execFileSync } = require("child_process");
const { openFont } = require("./lib/ttf");

// the cell this plugin reads its glyphs from -- not adjustable, the renderer
// derives every tile position from it arithmetically
const CELL_W = 8;
const CELL_H = 8;
// How wide a glyph may actually be. For tall text that is the whole cell; for
// half width it is half of one, because the renderer packs two glyphs into each
// 8px tile -- a glyph wider than this would run into its neighbour.
const GLYPH_W = 4;
const COLS = 16;                 // characters per row of the image
const FIRST = 0x20, LAST = 0x7f; // the 96 printable ASCII characters

const HELP = `
Usage: node make_halfwidth_font.js [options]

Glyph source (one required):
  --font <file>           a .ttf/.otf/.ttc file. Embedded bitmap strikes are
                          read directly; otherwise the outlines are rasterised
  --system-font <name>    an installed font, by family name (Windows)
  --hex <file>            a GNU Unifont style .hex file

Output:
  --out <dir>             GB Studio project folder (default: the project this
                          plugin is installed in)
  --name <prefix>         asset base name (default: halfwidth)
  --font-name <text>      display name of the font in GB Studio (default: --name)
  --size <n>              pixel size / bitmap strike to use (default: 8)
  --offset-x <n>          nudge rasterised glyphs horizontally, after the fit
  --offset-y <n>          nudge rasterised glyphs vertically, likewise
  --no-fit                keep whatever the rasteriser puts at the origin
  --bold                  smear every glyph a pixel right, for a bitmap bold
  --wizard                ask for anything not given on the command line
  --help
`;

const parseArgs = (argv) => {
  const opts = { name: "halfwidth", size: 8, offsetY: 0, wizard: false, loose: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => {
      const v = argv[++i];
      if (v === undefined) throw new Error(`${a} needs a value`);
      return v;
    };
    switch (a) {
      case "--font": opts.font = next(); break;
      case "--system-font": opts.systemFont = next(); break;
      case "--hex": opts.hex = next(); break;
      case "--out": opts.out = next(); break;
      case "--name": opts.name = next(); break;
      case "--font-name": opts.fontName = next(); break;
      case "--size": opts.size = parseInt(next(), 10); break;
      case "--offset-x": opts.offsetX = parseInt(next(), 10); break;
      case "--offset-y": opts.offsetY = parseInt(next(), 10); break;
      case "--no-fit": opts.noFit = true; break;
      case "--bold": opts.bold = true; break;
      case "--wizard": opts.wizard = true; break;
      case "--help": case "-h": console.log(HELP); process.exit(0); break;
      default:
        if (a.startsWith("--")) throw new Error(`unknown option ${a}`);
        opts.loose.push(a);   // bare paths, e.g. files dropped onto the .bat
    }
  }
  return opts;
};

const applyLoose = (opts) => {
  for (const value of opts.loose) {
    const ext = path.extname(value).toLowerCase();
    if (!opts.font && [".ttf", ".otf", ".ttc"].includes(ext)) opts.font = value;
    else if (!opts.hex && ext === ".hex") opts.hex = value;
    else if (!opts.out && fs.existsSync(value) && fs.statSync(value).isDirectory()) opts.out = value;
  }
};

const validate = (opts) => {
  if (!opts.font && !opts.systemFont && !opts.hex) {
    throw new Error("a glyph source is required (--font, --system-font or --hex)");
  }
  if (!opts.out) throw new Error("no output project (--out)");
  if (!Number.isInteger(opts.size) || opts.size < 4 || opts.size > 32) {
    throw new Error("--size must be a whole number of pixels, 4 to 32");
  }
};

const RENDER_MARGIN = 8;

const PALETTE = [
  [7, 24, 33],      // 0 Dark   -- ink
  [48, 104, 80],    // 1 Mid
  [134, 192, 108],  // 2 Light
  [224, 248, 207],  // 3 White  -- paper
  [255, 0, 255],    // 4 magenta -- transparent, the cull colour
];

const INK = 0;

const PAPER = 3;

const detectProject = () => {
  const guess = path.resolve(__dirname, "..", "..", "..");
  try {
    const entries = fs.readdirSync(guess);
    const looksLikeProject =
      entries.some((e) => e.endsWith(".gbsproj")) &&
      entries.includes("assets") &&
      entries.includes("project");
    if (looksLikeProject) return guess;
  } catch { /* not installed in a project */ }
  return null;
};

const glyphPixel = (g, x, y) => x < g.w && y < g.h && (g.rows[y] >> (g.w - 1 - x)) & 1;

const inkWidth = (g) => {
  let w = 0;
  for (let y = 0; y < g.rows.length; y++) {
    for (let x = g.w - 1; x >= w; x--) {
      if ((g.rows[y] >> (g.w - 1 - x)) & 1) { w = x + 1; break; }
    }
  }
  return w;
};

const embolden = (glyphs) => {
  for (const g of glyphs.values()) {
    for (let y = 0; y < g.rows.length; y++) g.rows[y] |= g.rows[y] >> 1;
  }
  return glyphs;
};

const readHexGlyphs = (file) => {
  const out = new Map();
  const text = fs.readFileSync(file, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const m = /^([0-9A-Fa-f]+):([0-9A-Fa-f]+)$/.exec(line.trim());
    if (!m) continue;
    const data = m[2];
    // 4 hex digits per row -> 16 wide, 2 -> 8 wide
    const perRow = data.length / 16;
    if (perRow !== 2 && perRow !== 4) continue;
    const rows = [];
    for (let y = 0; y < 16; y++) rows.push(parseInt(data.substr(y * perRow, perRow), 16));
    out.set(parseInt(m[1], 16), { w: perRow * 4, h: 16, rows });
  }
  return out;
};

const PS_RENDER = `
param([string]$ListFile,[string]$FontName,[string]$FontFile,[int]$CellW,[int]$CellH,[int]$Size,[int]$Margin)
Add-Type -AssemblyName System.Drawing
$codes = [System.IO.File]::ReadAllLines($ListFile)
if ($FontFile) {
  $pfc = New-Object System.Drawing.Text.PrivateFontCollection
  $pfc.AddFontFile($FontFile)
  if ($pfc.Families.Length -eq 0) { throw "no font family in $FontFile" }
  $font = New-Object System.Drawing.Font($pfc.Families[0],$Size,[System.Drawing.FontStyle]::Regular,[System.Drawing.GraphicsUnit]::Pixel)
} else {
  $font = New-Object System.Drawing.Font($FontName,$Size,[System.Drawing.GraphicsUnit]::Pixel)
}
$fmt = [System.Drawing.StringFormat]::GenericTypographic
$W = $CellW + 2 * $Margin
$H = $CellH + 2 * $Margin
$bmp = New-Object System.Drawing.Bitmap $W,$H
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::SingleBitPerPixelGridFit
$sb = New-Object System.Text.StringBuilder
foreach ($line in $codes) {
  if ([string]::IsNullOrWhiteSpace($line)) { continue }
  $cp = [Convert]::ToInt32($line,16)
  $g.Clear([System.Drawing.Color]::White)
  try {
    $g.DrawString([char]::ConvertFromUtf32($cp), $font, [System.Drawing.Brushes]::Black, $Margin, $Margin, $fmt)
  } catch { continue }
  $null = $sb.Append($line.PadLeft(4,'0')).Append(':')
  for ($y=0; $y -lt $H; $y++) {
    $row = [bigint]::Zero
    for ($x=0; $x -lt $W; $x++) {
      $row = $row * 2
      if ($bmp.GetPixel($x,$y).R -lt 128) { $row = $row + 1 }
    }
    $null = $sb.Append($row.ToString('X').PadLeft([math]::Ceiling($W/4),'0'))
  }
  $null = $sb.AppendLine()
}
$g.Dispose(); $bmp.Dispose(); $font.Dispose()
[Console]::Out.Write($sb.ToString())
`;

const renderWithGdiPlus = ({ fontName, fontFile, codes, cellW, cellH, size, offsetX = 0, offsetY = 0 }) => {
  if (process.platform !== "win32") {
    throw new Error(
      "outline fonts are rasterised with .NET System.Drawing, which needs Windows.\n" +
      "       Use a bitmap font (--font with embedded strikes) or --hex instead."
    );
  }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "t16-"));
  const listFile = path.join(tmp, "codes.txt");
  const psFile = path.join(tmp, "render.ps1");
  fs.writeFileSync(listFile, codes.map((c) => c.toString(16)).join("\n"), "utf8");
  fs.writeFileSync(psFile, PS_RENDER, "utf8");
  let stdout;
  try {
    stdout = execFileSync(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", psFile,
       "-ListFile", listFile, "-FontName", fontName ?? "", "-FontFile", fontFile ?? "",
       "-CellW", String(cellW), "-CellH", String(cellH), "-Size", String(size),
       "-Margin", String(RENDER_MARGIN)],
      { encoding: "utf8", maxBuffer: 1 << 28 }
    );
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  // the padded canvas, still holding whatever the font drew outside the cell
  const padW = cellW + 2 * RENDER_MARGIN;
  const padH = cellH + 2 * RENDER_MARGIN;
  const digits = Math.ceil(padW / 4);
  const raw = new Map();
  for (const line of stdout.split(/\r?\n/)) {
    const m = /^([0-9A-Fa-f]+):([0-9A-Fa-f]+)$/.exec(line.trim());
    if (!m) continue;
    const data = m[2];
    const rows = [];
    for (let y = 0; y < padH; y++) rows.push(BigInt("0x" + (data.substr(y * digits, digits) || "0")));
    raw.set(parseInt(m[1], 16), rows);
  }
  return fitToCell(raw, cellW, cellH, padW, padH, offsetX, offsetY);
};

const fitToCell = (raw, cellW, cellH, padW, padH, offsetX = 0, offsetY = 0) => {
  let x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1;
  for (const rows of raw.values()) {
    for (let y = 0; y < padH; y++) {
      if (!rows[y]) continue;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
      for (let x = 0; x < padW; x++) {
        if ((rows[y] >> BigInt(padW - 1 - x)) & 1n) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          break;
        }
      }
      for (let x = padW - 1; x >= 0; x--) {
        if ((rows[y] >> BigInt(padW - 1 - x)) & 1n) {
          if (x > x1) x1 = x;
          break;
        }
      }
    }
  }
  const out = new Map();
  if (x1 < 0) {
    for (const cp of raw.keys()) out.set(cp, { w: cellW, h: cellH, rows: new Array(cellH).fill(0) });
    return out;
  }
  // Nudge only as far as the ink demands. A font that already sits inside the
  // cell keeps the placement it was designed with -- pulling everything to the
  // top left would strip the leading it deliberately leaves above its capitals.
  // When the ink is simply too big for the cell no shift helps, so leave it where
  // the font put it and let the warning say so.
  const nudge = (lo, hi, extent) => {
    const inkLo = lo - RENDER_MARGIN;          // relative to the cell's own origin
    const inkHi = hi - RENDER_MARGIN;
    let shift = 0;
    if (inkHi - inkLo + 1 > extent) shift = 0;
    else if (inkLo < 0) shift = inkLo;                       // hanging off the left
    else if (inkHi > extent - 1) shift = inkHi - extent + 1;  // hanging off the bottom or right
    return RENDER_MARGIN + shift;
  };
  const dx = (fitToCell.noFit ? RENDER_MARGIN : nudge(x0, x1, cellW)) - offsetX;
  const dy = (fitToCell.noFit ? RENDER_MARGIN : nudge(y0, y1, cellH)) - offsetY;
  const overW = x1 - dx + 1 - cellW;
  const overH = y1 - dy + 1 - cellH;
  if (overW > 0 || overH > 0) {
    fitToCell.overflow = { overW: Math.max(0, overW), overH: Math.max(0, overH) };
  }
  // FONT_DEBUG=1 prints where the ink landed and how far it was moved
  if (process.env.FONT_DEBUG) console.error("[fit] cellW="+cellW+" padW="+padW+" bbox x"+x0+"-"+x1+" y"+y0+"-"+y1+" dx="+dx+" dy="+dy);
  for (const [cp, rows] of raw) {
    const fitted = new Array(cellH).fill(0);
    for (let y = 0; y < cellH; y++) {
      const sy = y + dy;
      if (sy < 0 || sy >= padH || !rows[sy]) continue;
      let v = 0;
      for (let x = 0; x < cellW; x++) {
        const sx = x + dx;
        if (sx < 0 || sx >= padW) continue;
        if ((rows[sy] >> BigInt(padW - 1 - sx)) & 1n) v |= (1 << (cellW - 1 - x));
      }
      fitted[y] = v;
    }
    out.set(cp, { w: cellW, h: cellH, rows: fitted });
  }
  return out;
};

const crcTable = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

const crc32 = (buf) => {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
};

const chunk = (type, data) => {
  const out = Buffer.alloc(data.length + 12);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
};

const writePng = (file, width, height, pixels) => {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;    // bit depth
  ihdr[9] = 3;    // colour type: indexed, so the palette travels with the file
  const raw = Buffer.alloc((width + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width + 1)] = 0;   // filter: none
    pixels.copy(raw, y * (width + 1) + 1, y * width, (y + 1) * width);
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(
    file,
    Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk("IHDR", ihdr),
      chunk("PLTE", Buffer.from(PALETTE.flat())),
      chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
      chunk("IEND", Buffer.alloc(0)),
    ])
  );
};

const writeResource = (pngFile, fields, renameTo) => {
  const file = `${pngFile}.gbsres`;
  let existing = {};
  if (fs.existsSync(file)) {
    try { existing = JSON.parse(fs.readFileSync(file, "utf8")); } catch { /* rewrite */ }
  }
  const out = {
    ...fields,
    id: existing.id ?? crypto.randomUUID(),
    // --font-name renames an existing asset; the id is what references use, so
    // changing the display name is safe
    name: renameTo ?? existing.name ?? fields.name,
    symbol: existing.symbol ?? fields.symbol,
  };
  // keep GB Studio's own key order
  const ordered = {
    _resourceType: out._resourceType,
    id: out.id,
    name: out.name,
    symbol: out.symbol,
    ...(out._resourceType === "tileset"
      ? { width: out.width, height: out.height, imageWidth: out.imageWidth, imageHeight: out.imageHeight }
      : { width: out.width, height: out.height }),
    filename: out.filename,
  };
  fs.writeFileSync(file, JSON.stringify(ordered, null, 2) + "\n", "utf8");
};

const drawGlyph = (pixels, imgW, x0, y0, glyph, cellW, cellH) => {
  for (let y = 0; y < cellH; y++) {
    for (let x = 0; x < cellW; x++) {
      if (glyphPixel(glyph, x, y)) pixels[(y0 + y) * imgW + x0 + x] = INK;
    }
  }
};

// ASCII only: this plugin draws every character from the font asset, so there
// are no glyph sheets and no two-byte encoding to arrange.
const collectGlyphs = (opts, codes) => {
  if (opts.hex) {
    const glyphs = readHexGlyphs(opts.hex);
    console.log(`read ${glyphs.size} glyphs from ${path.basename(opts.hex)}`);
    return glyphs;
  }
  if (opts.font) {
    const font = openFont(opts.font);
    const strike = font.pickStrike(opts.size);
    if (strike && strike.bitDepth === 1) {
      if (strike.ppemY !== opts.size) {
        console.warn(`warning: no ${opts.size}px bitmap strike; using the ${strike.ppemY}px one`);
      }
      console.log(
        `reading embedded ${strike.ppemY}px bitmaps from ${path.basename(opts.font)}`
      );
      const glyphs = new Map();
      const missing = [];
      for (const cp of codes) {
        const g = font.glyphFor(strike, cp);
        if (g) glyphs.set(cp, g); else missing.push(cp);
      }
      // a font can carry strikes for only part of its repertoire; rasterise the rest
      if (missing.length && font.hasOutlines) {
        console.log(`  ${missing.length} character(s) have no bitmap; rasterising those`);
        for (const [k, v] of renderWithGdiPlus({
          fontFile: path.resolve(opts.font), codes: missing,
          cellW: GLYPH_W, cellH: CELL_H, size: opts.size, offsetY: opts.offsetY,
        })) glyphs.set(k, v);
      }
      return glyphs;
    }
    if (!font.hasOutlines) {
      throw new Error(`${path.basename(opts.font)} has neither usable bitmap strikes nor outlines`);
    }
    console.log(`rasterising ${path.basename(opts.font)} at ${opts.size}px...`);
    return renderWithGdiPlus({
      fontFile: path.resolve(opts.font), codes,
      cellW: GLYPH_W, cellH: CELL_H, size: opts.size, offsetY: opts.offsetY,
    });
  }
  console.log(`rendering with the installed font "${opts.systemFont}"...`);
  return renderWithGdiPlus({
    fontName: opts.systemFont, codes,
    cellW: GLYPH_W, cellH: CELL_H, size: opts.size, offsetY: opts.offsetY,
  });
};

const ask = async (rl, question, fallback) =>
  new Promise((resolve) =>
    rl.question(`${question}${fallback ? ` [${fallback}]` : ""}: `, (a) =>
      resolve(a.trim() || fallback || "")
    )
  );

const runWizard = async (opts) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  console.log("");
  if (!opts.font && !opts.systemFont && !opts.hex) {
    const f = await ask(rl, "Path to a .ttf/.otf font file");
    if (f) opts.font = f.replace(/^"|"$/g, "");
  }
  if (!opts.out) {
    const d = await ask(rl, "GB Studio project folder", detectProject() || "");
    if (d) opts.out = d.replace(/^"|"$/g, "");
  }
  const s = await ask(rl, "Pixel size", String(opts.size));
  opts.size = parseInt(s, 10) || opts.size;
  const n = await ask(rl, "Asset name", opts.name);
  opts.name = n || opts.name;
  rl.close();
  console.log("");
};

const run = (opts) => {
  validate(opts);

  const codes = [];
  for (let c = FIRST; c <= LAST; c++) codes.push(c);

  fitToCell.noFit = !!opts.noFit;
  fitToCell.overflow = null;
  const glyphs = collectGlyphs(opts, codes);
  if (fitToCell.overflow) {
    const o = fitToCell.overflow;
    console.warn(
      "warning: this font is bigger than the cell at --size " + opts.size + " -- " +
      (o.overW ? o.overW + "px too wide " : "") + (o.overH ? o.overH + "px too tall " : "") +
      "after fitting, so the edges are clipped. Lower --size, or accept it if only a " +
      "few glyphs reach that far."
    );
  }
  if (opts.bold) embolden(glyphs);

  const missing = codes.filter((cp) => !glyphs.has(cp));
  if (missing.length) {
    console.warn(
      `warning: ${missing.length} character(s) have no glyph in this font and will be ` +
      `blank:\n         ` + missing.map((c) => String.fromCharCode(c)).join("")
    );
  }

  const width = COLS * CELL_W;
  const height = Math.ceil(codes.length / COLS) * CELL_H;
  const pixels = Buffer.alloc(width * height, PAPER);
  codes.forEach((cp, i) => {
    const g = glyphs.get(cp);
    if (!g) return;
    drawGlyph(
      pixels, width,
      (i % COLS) * CELL_W, Math.floor(i / COLS) * CELL_H,
      g, Math.min(g.w, GLYPH_W), CELL_H
    );
  });

  const outRoot = path.resolve(opts.out);
  const fontDir = path.join(outRoot, "assets", "fonts");
  fs.mkdirSync(fontDir, { recursive: true });
  const file = path.join(fontDir, `${opts.name}.png`);
  writePng(file, width, height, pixels);
  writeResource(file, {
    _resourceType: "font",
    name: opts.fontName || opts.name,
    symbol: `font_${opts.name.replace(/[^a-z0-9]+/gi, "_").toLowerCase()}`,
    width,
    height,
    filename: `${opts.name}.png`,
  });

  // The plugin's .json "table" addresses glyphs by position, and GB Studio's
  // font compiler deduplicates identical tiles -- two characters drawn the same
  // would collapse into one entry and shift everything after it. Say so rather
  // than letting the table quietly point at the wrong glyph.
  const seen = new Map();
  const dupes = [];
  codes.forEach((cp, i) => {
    const g = glyphs.get(cp);
    const key = g ? g.rows.slice(0, CELL_H).join(",") : "blank";
    if (seen.has(key)) dupes.push([cp, seen.get(key)]);
    else seen.set(key, cp);
  });
  if (dupes.length) {
    console.warn(
      `warning: ${dupes.length} character(s) are drawn identically to another and ` +
      `will be deduplicated by the font compiler:\n         ` +
      dupes.map(([a, b]) => `'${String.fromCharCode(a)}' == '${String.fromCharCode(b)}'`).join(", ") +
      `\n         That shifts every later tile index, so a .json "table" built on ` +
      `positions will address the wrong glyphs.`
    );
  } else {
    console.log(`  all ${codes.length} glyphs are distinct`);
  }

  const rel = (f) => path.relative(outRoot, f).replace(/\\/g, "/");
  console.log("");
  console.log(`${codes.length} characters -> ${rel(file)}  (${width}x${height}, ${CELL_W}x${CELL_H} cells)`);
  console.log("");
  console.log("Next steps in GB Studio:");
  console.log(`  1. The font appears as "${opts.fontName || opts.name}". Select it with the`);
  console.log("     Set Font event, or make it Settings -> Default Font.");
  console.log("  2. Draw with this plugin's own text events.");
};

const main = async () => {
  const opts = parseArgs(process.argv.slice(2));
  applyLoose(opts);
  if (!opts.out) {
    const detected = detectProject();
    if (detected) {
      opts.out = detected;
      console.log("using the project this plugin is installed in: " + detected);
    }
  }
  const needsInput = (!opts.font && !opts.systemFont && !opts.hex) || !opts.out;
  if (opts.wizard || (needsInput && process.stdin.isTTY)) await runWizard(opts);
  run(opts);
};

main().catch((e) => {
  console.error(`\nerror: ${e.message}\n`);
  process.exit(1);
});
