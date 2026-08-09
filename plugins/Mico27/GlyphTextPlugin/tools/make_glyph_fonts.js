#!/usr/bin/env node
//
// make_glyph_fonts.js -- build the assets the GlyphTextPlugin needs from a
// font and a list of characters:
//
//   * one or more GLYPH SHEETS (GB Studio tileset assets) holding the 16x16
//     bitmaps of every wide character, in glyph index order;
//   * a FONT asset (PNG + JSON) whose `mapping` block encodes those characters
//     as the plugin's two-byte codes, and whose image supplies the single-byte
//     (ASCII) glyphs.
//
// Run it with no arguments (or through "Make Glyph Fonts.bat") for a guided
// prompt; everything is available as a flag as well -- see HELP below.
//
// No dependencies: PNGs are written with node's own zlib, and .ttf/.otf files
// are read directly (lib/ttf.js). Rasterising OUTLINE fonts is the one thing
// that needs help from the system, and that goes through .NET System.Drawing.

const fs = require("fs");
const path = require("path");
const os = require("os");
const zlib = require("zlib");
const readline = require("readline");
const crypto = require("crypto");
const { execFileSync } = require("child_process");
const { openFont } = require("./lib/ttf");

// ---------------------------------------------------------------- arguments

const HELP = `
Usage: node make_glyph_fonts.js [options]

Glyph source (one required):
  --font <file>           a .ttf/.otf/.ttc file. Embedded bitmap strikes are
                          read straight out of the file; outline fonts are
                          rasterised with .NET System.Drawing (Windows).
  --system-font <name>    an installed font, by family name (Windows)
  --hex <file>            a GNU Unifont style .hex file

Characters (one required):
  --project <dir>         a GB Studio project folder; every character used by a
                          text event anywhere in it is collected. Defaults to the
                          project this plugin is installed in, when run from
                          <project>/plugins/GlyphTextPlugin/tools/.
  --chars <file>          a text file
  --text "<string>"       characters given inline

Output:
  --out <dir>             GB Studio project folder (default: --project, else .)
  --name <prefix>         asset base name, and the name of this font set
                          (default: cjk). Give a second set a different name to
                          add an ALTERNATE FONT to the same project -- glyph
                          indices and sheet slots are then allocated after the
                          sets already there, so the two never collide.
  --font-name <text>      display name of the font in GB Studio (default: --name)
  --size <n>              pixel size / bitmap strike to use (default: 16)
  --offset-x <n>          nudge rasterised glyphs horizontally, on top of the
                          automatic fit
  --offset-y <n>          nudge rasterised glyphs vertically, likewise
  --no-fit                do not measure and shift the glyphs to fit their cell;
                          take whatever the rasteriser puts at the origin
  --full-width-ascii      ASCII font uses 16x16 cells instead of 8x16
                          (match the "Half-width single-byte characters"
                          engine setting: on -> 8x16, off -> 16x16)
  --bold                  smear every glyph one pixel right, the bitmap way of
                          faking a bold weight. Handy for building a bold
                          alternate set out of the same font.
  --vwf                   build for VARIABLE-WIDTH rendering: glyphs are packed
                          to the left of their cell and a width table is written
                          alongside them. Match the "Variable width glyphs (VWF)"
                          engine setting, and register the table with the
                          Set Width Table event.
  --space-width <n>       how far the pen moves for a space, in pixels (default
                          4, range 1-16). Variable-width mode only, and only for
                          the font set that owns glyph 0 -- the width table
                          takes its whole ASCII block from that one set.
                          A blank glyph has no ink to measure, so without this
                          a space is guessed from the cell size.
  --no-font               keep your own font PNG; only rewrite <name>.json
  --wizard                ask for anything that was not given on the command line
  --help
`;

const parseArgs = (argv) => {
  const opts = {
    name: "cjk",
    size: 16,
    offsetY: 0,
    spaceWidth: 4,
    fullWidthAscii: false,
    writeFont: true,
    wizard: false,
    loose: [],
  };
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
      case "--project": opts.project = next(); break;
      case "--chars": opts.chars = next(); break;
      case "--text": opts.text = next(); break;
      case "--out": opts.out = next(); break;
      case "--name": opts.name = next(); break;
      case "--size": opts.size = parseInt(next(), 10); break;
      case "--offset-y": opts.offsetY = parseInt(next(), 10); break;
      case "--offset-x": opts.offsetX = parseInt(next(), 10); break;
      case "--no-fit": opts.noFit = true; break;
      case "--font-name": opts.fontName = next(); break;
      case "--full-width-ascii": opts.fullWidthAscii = true; break;
      case "--bold": opts.bold = true; break;
      case "--vwf": opts.vwf = true; break;
      case "--space-width":
        opts.spaceWidth = parseInt(next(), 10);
        opts.spaceWidthGiven = true;
        break;
      case "--no-font": opts.writeFont = false; break;
      case "--wizard": opts.wizard = true; break;
      case "--help": case "-h": console.log(HELP); process.exit(0); break;
      default:
        if (a.startsWith("--")) throw new Error(`unknown option ${a}`);
        // bare paths, e.g. files dropped onto the .bat launcher
        opts.loose.push(a);
    }
  }
  return opts;
};

const validate = (opts) => {
  if (!opts.font && !opts.systemFont && !opts.hex) {
    throw new Error("a glyph source is required (--font, --system-font or --hex)");
  }
  if (!opts.project && !opts.chars && !opts.text) {
    throw new Error("a character source is required (--project, --chars or --text)");
  }
  if (!opts.out) opts.out = opts.project ?? ".";
  // 0 is not expressible: the engine reads a 0 in the width table as "no entry"
  // and falls back to its own default, so it would not give a zero-width space
  if (!Number.isInteger(opts.spaceWidth) || opts.spaceWidth < 1 || opts.spaceWidth > 16) {
    throw new Error("--space-width must be a whole number of pixels, 1 to 16");
  }
};

// This tool ships inside the plugin, so once the plugin is installed it sits at
// <project>/plugins/GlyphTextPlugin/tools/ -- three levels below the project it
// almost certainly belongs to. Find that project so a double-click needs nothing
// but a font.
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

// classify a bare path so dropped files land on the right option
const applyLoose = (opts) => {
  for (const raw of opts.loose) {
    const p = raw.replace(/^"|"$/g, "");
    const ext = path.extname(p).toLowerCase();
    let stat = null;
    try { stat = fs.statSync(p); } catch { /* ignore */ }
    if (ext === ".ttf" || ext === ".otf" || ext === ".ttc") opts.font ??= p;
    else if (ext === ".hex") opts.hex ??= p;
    else if (ext === ".gbsproj") opts.project ??= path.dirname(p);
    else if (stat && stat.isDirectory()) opts.project ??= p;
    else if (stat && stat.isFile()) opts.chars ??= p;
  }
};

// ------------------------------------------------------------------- pixels
//
// a glyph is a { w, h, rows } bitmap where rows[y] is a bit mask, bit (w-1-x)
// set meaning ink at x.

const glyphPixel = (g, x, y) => x < g.w && y < g.h && (g.rows[y] >> (g.w - 1 - x)) & 1;

// Rightmost inked column of a glyph, +1 for the pixel itself.
const inkWidth = (g) => {
  let w = 0;
  for (let y = 0; y < g.rows.length; y++) {
    for (let x = g.w - 1; x >= w; x--) {
      if ((g.rows[y] >> (g.w - 1 - x)) & 1) { w = x + 1; break; }
    }
  }
  return w;
};

// How far the pen moves after drawing this glyph. A bitmap strike states it
// outright; a rasterised glyph does not, so measure the ink and leave a pixel
// of air -- except when the ink already fills the design size, which is how CJK
// is drawn, and where a spacing pixel would only push the characters apart.
// Blank glyphs (space) fall back to a third of the cell.
const advanceOf = (g, cell, designSize) => {
  if (g.measured) return Math.min(g.w, cell);
  const ink = inkWidth(g);
  if (ink === 0) return Math.max(2, cell / 3) | 0;
  if (designSize && ink >= designSize) return Math.min(designSize, cell);
  return Math.min(ink + 1, cell);
};

// Bitmap emboldening: smear every row one pixel to the right, the way bitmap
// fonts have always faked a bold weight. Shifting the mask right by one moves
// ink from x to x+1, so anything already touching the right edge of the cell is
// dropped rather than bleeding into the next character.
const embolden = (glyphs) => {
  for (const g of glyphs.values()) {
    for (let y = 0; y < g.rows.length; y++) g.rows[y] |= g.rows[y] >> 1;
  }
  return glyphs;
};

// ------------------------------------------------------------ .hex glyph source

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

// ------------------------------------------- outline rasteriser (.NET, Windows)

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

const RENDER_MARGIN = 8;

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

// Where did the font actually put the ink? Shift the whole set by one amount so
// the answer lands in the cell -- one shift, not one per glyph, or the baseline
// would wander from character to character.
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
  // GTX_DEBUG=1 prints where the ink landed and how far it was moved
  if (process.env.GTX_DEBUG) console.error("[fit] cellW="+cellW+" padW="+padW+" bbox x"+x0+"-"+x1+" y"+y0+"-"+y1+" dx="+dx+" dy="+dy);
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

// --------------------------------------------------------------- PNG writing

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

// ------------------------------------------------------------- asset plumbing
//
// A project can hold several main fonts side by side -- a normal one and, say,
// a bold alternate that text switches to with a font token. Each carries its
// own group of extended fonts and numbers its glyph codes from zero, so two
// main fonts can never collide and there is nothing to allocate between them.

// GB Studio's sidecar for an asset. Regenerating a sheet usually changes its
// size, so these are rewritten too -- but the id/name/symbol of an existing one
// is kept, or every scene reference and the Default Font setting would break.
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

// 8-bit greyscale PNG; `pixels` is one byte per pixel, row major
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

// GB Studio's own font palette, matching the assets it ships (gbs-var.png):
// the DMG four-shade ramp plus magenta for transparency. The font compiler
// classifies a pixel by its GREEN channel --
//
//   g > 249, or r and b both > 249  ->  TRANSPARENT   (trimmed; sets the width)
//   g <  65                         ->  Dark          (ink)
//   g < 130                         ->  Mid
//   g < 205                         ->  Light
//   otherwise                       ->  White         (paper)
//
// Writing an indexed PNG with these exact colours means the images open in an
// editor looking like every other GB Studio font, and the cull colour is
// unmistakable -- plain white would sit one step away from paper and could be
// nudged into transparency by accident.
const PALETTE = [
  [7, 24, 33],      // 0 Dark   -- ink
  [48, 104, 80],    // 1 Mid
  [134, 192, 108],  // 2 Light
  [224, 248, 207],  // 3 White  -- paper
  [255, 0, 255],    // 4 magenta -- transparent, the cull colour
];
const INK = 0;
const PAPER = 3;

// A glyph cell is always 2x2 tiles, whatever size the font is drawn at: that is
// the shape the renderer reads, and tiles cannot be subdivided. A 12px font just
// leaves 4px of air on the right and bottom, and the width table stops the pen
// from crossing it.
const CELL_W = 16;
const CELL_H = 16;

// the width table reserves one slot per printable ASCII code before the glyphs
const GTX_ASCII_SLOTS = 96;

const drawGlyph = (pixels, imgW, x0, y0, glyph, cellW, cellH) => {
  for (let y = 0; y < cellH; y++) {
    for (let x = 0; x < cellW; x++) {
      if (glyphPixel(glyph, x, y)) pixels[(y0 + y) * imgW + x0 + x] = INK;
    }
  }
};

// ------------------------------------------------------- character collection

// pull every string a text event holds out of a GB Studio project
const charsFromProject = (dir) => {
  const root = fs.existsSync(path.join(dir, "project")) ? path.join(dir, "project") : dir;
  let text = "";
  const collect = (node) => {
    if (typeof node === "string") { text += node; return; }
    if (Array.isArray(node)) { node.forEach(collect); return; }
    if (node && typeof node === "object") {
      for (const [k, v] of Object.entries(node)) {
        // menu options are option1..option8, not text -- both the stock Menu
        // event and this plugin's use those field names, and missing them
        // leaves every menu entry drawn as a blank square
        if (k === "text" || k === "paragraph" || /^option\d+$/.test(k)) collect(v);
        else if (typeof v === "object") collect(v);
      }
    }
  };
  const walk = (d) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (entry.name.endsWith(".gbsres")) {
        try { collect(JSON.parse(fs.readFileSync(p, "utf8"))); } catch { /* skip */ }
      }
    }
  };
  if (!fs.existsSync(root)) throw new Error(`no such folder: ${root}`);
  walk(root);
  return text;
};

// ------------------------------------------------------------------- wizard

const ask = async (rl, question, fallback) => {
  const suffix = fallback ? ` [${fallback}]` : "";
  const answer = (await rl.question(`${question}${suffix}: `)).trim();
  const value = (answer || fallback || "").replace(/^"|"$/g, "");
  return value;
};

const runWizard = async (opts) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    console.log("\n  Glyph Text Plugin - font generator");
    console.log("  ----------------------------------------");
    console.log("  Tip: you can drag a file from Explorer into this window.\n");

    if (!opts.font && !opts.systemFont && !opts.hex) {
      const f = await ask(rl, "Font file (.ttf / .otf), or an installed font name");
      if (!f) throw new Error("a font is required");
      if (/\.(ttf|otf|ttc)$/i.test(f)) opts.font = f;
      else if (/\.hex$/i.test(f)) opts.hex = f;
      else opts.systemFont = f;
    }
    if (!opts.project && !opts.chars && !opts.text) {
      const detected = detectProject();
      const c = await ask(
        rl,
        "GB Studio project folder, or a .txt of the characters",
        detected ?? undefined
      );
      if (!c) throw new Error("a character source is required");
      let isDir = false;
      try { isDir = fs.statSync(c).isDirectory(); } catch { /* ignore */ }
      if (isDir) opts.project = c;
      else if (/\.gbsproj$/i.test(c)) opts.project = path.dirname(c);
      else opts.chars = c;
    }
    if (!opts.out) {
      opts.out = await ask(rl, "Write the assets into which project folder", opts.project ?? ".");
    }
    opts.name = await ask(
      rl,
      "Asset name (a new one adds an alternate font to the project)",
      opts.name
    );
    if (!opts.fontName) {
      const shown = await ask(rl, "Name to show in GB Studio", opts.name);
      if (shown !== opts.name) opts.fontName = shown;
    }
    const hw = await ask(rl, "Single-byte characters half width (8x16)? y/n", opts.fullWidthAscii ? "n" : "y");
    opts.fullWidthAscii = /^n/i.test(hw);
  } finally {
    rl.close();
  }
};

// --------------------------------------------------------------------- main

const collectGlyphs = (opts, wide, ascii, asciiCells) => {
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
        console.warn(
          `warning: no ${opts.size}px bitmap strike; using the ${strike.ppemY}px one`
        );
      }
      console.log(
        `reading embedded ${strike.ppemY}px bitmaps from ${path.basename(opts.font)}` +
        ` (${font.cmap.size} characters mapped)`
      );
      const glyphs = new Map();
      const unbitmapped = [];
      for (const cp of [...wide, ...ascii]) {
        const g = font.glyphFor(strike, cp);
        if (g) glyphs.set(cp, g); else unbitmapped.push(cp);
      }
      // a font can carry strikes for only part of its repertoire -- SimSun has
      // 12px CJK bitmaps but leaves Latin to the outlines. Rasterise the rest.
      if (unbitmapped.length && font.hasOutlines) {
        console.log(`  ${unbitmapped.length} character(s) have no bitmap; rasterising those`);
        const wideMissing = unbitmapped.filter((cp) => cp > 0x7f);
      // rendered at --size but stored in a full cell, like the strike glyphs
        const asciiMissing = unbitmapped.filter((cp) => cp <= 0x7f);
        if (wideMissing.length) {
          for (const [k, v] of renderWithGdiPlus({
            fontFile: path.resolve(opts.font), codes: wideMissing,
            cellW: CELL_W, cellH: CELL_H, size: opts.size, offsetY: opts.offsetY,
          })) glyphs.set(k, v);
        }
        if (asciiMissing.length) {
          for (const [k, v] of renderWithGdiPlus({
            fontFile: path.resolve(opts.font), codes: asciiMissing,
            cellW: asciiCells, cellH: CELL_H, size: opts.size, offsetY: opts.offsetY,
          })) glyphs.set(k, v);
        }
      }
      return glyphs;
    }
    if (!font.hasOutlines) {
      throw new Error(
        `${path.basename(opts.font)} has neither usable bitmap strikes nor outlines`
      );
    }
    console.log(`rasterising ${path.basename(opts.font)} at ${opts.size}px...`);
    const glyphs = renderWithGdiPlus({
      fontFile: path.resolve(opts.font), codes: wide,
      cellW: CELL_W, cellH: CELL_H, size: opts.size, offsetY: opts.offsetY,
    });
    for (const [k, v] of renderWithGdiPlus({
      fontFile: path.resolve(opts.font), codes: ascii,
      cellW: asciiCells, cellH: CELL_H, size: opts.size, offsetY: opts.offsetY,
    })) glyphs.set(k, v);
    return glyphs;
  }

  console.log(`rendering with the installed font "${opts.systemFont}"...`);
  const glyphs = renderWithGdiPlus({
    fontName: opts.systemFont, codes: wide,
    cellW: CELL_W, cellH: CELL_H, size: opts.size, offsetY: opts.offsetY,
  });
  for (const [k, v] of renderWithGdiPlus({
    fontName: opts.systemFont, codes: ascii,
    cellW: asciiCells, cellH: CELL_H, size: opts.size, offsetY: opts.offsetY,
  })) glyphs.set(k, v);
  return glyphs;
};

// Each extended font holds this many full-square glyphs. A font asset's recode
// table stores one byte per image tile, so it addresses at most 256
// deduplicated tiles, and a 16x16 glyph is four of them. 16 glyphs per row over
// 4 rows keeps the image under 16 tile rows tall, which is what makes the font
// compiler prefix its table with the 32 blanks the renderer indexes past.
const GLYPHS_PER_FONT = 64;
const GLYPH_COLS = 16;

// GB Studio's font compiler treats bright green (G > 249) as transparent and
// trims it off the right of every 8x8 tile, recording what is left as that
// tile's width. Painting the cull region is therefore the whole of variable
// width support -- no separate width table, and the artist can adjust spacing
// by editing the green in the PNG.
const CULL = 4;   // magenta: what the font compiler trims away

const drawCull = (pixels, imgW, x0, y0, from, cellW, cellH) => {
  for (let y = 0; y < cellH; y++) {
    for (let x = from; x < cellW; x++) pixels[(y0 + y) * imgW + x0 + x] = CULL;
  }
};

const run = (opts) => {
  validate(opts);

  // --- character set: every non-ASCII, non-control character, sorted
  let source = opts.text ?? "";
  if (opts.chars) source += fs.readFileSync(opts.chars, "utf8");
  if (opts.project) source += charsFromProject(opts.project);
  const wideSet = new Set();
  for (const ch of source) {
    const cp = ch.codePointAt(0);
    if (cp > 0x7f && cp !== 0xfeff && !/\s/.test(ch)) wideSet.add(cp);
  }

  const wide = [...wideSet].sort((a, b) => a - b);
  if (!wide.length) throw new Error("no wide characters found in the input");

  const cellH = CELL_H;
  // the variable width renderer always reads single-byte characters from an
  // 8x16 grid, whatever the half-width setting says
  const asciiCells = (opts.fullWidthAscii && !opts.vwf) ? CELL_W : CELL_W >> 1;
  const ascii = [];
  for (let c = 0x20; c <= 0x7f; c++) ascii.push(c);

  fitToCell.noFit = !!opts.noFit;
  fitToCell.overflow = null;
  const glyphs = collectGlyphs(opts, wide, ascii, asciiCells);
  if (fitToCell.overflow) {
    const o = fitToCell.overflow;
    console.warn(
      "warning: this font is bigger than the cell at --size " + opts.size + " -- " +
      (o.overW ? o.overW + "px too wide " : "") + (o.overH ? o.overH + "px too tall " : "") +
      "after fitting, so the edges are clipped. " +
      "Lower --size, or accept it if only a few glyphs reach that far."
    );
  }
  if (opts.bold) embolden(glyphs);

  const missing = wide.filter((cp) => !glyphs.has(cp));
  if (missing.length) {
    console.warn(
      `warning: ${missing.length} character(s) have no glyph in this font and ` +
      `will be blank:\n         ` + missing.map((c) => String.fromCodePoint(c)).join("")
    );
  }

  const outRoot = path.resolve(opts.out);
  const fontDir = path.join(outRoot, "assets", "fonts");
  fs.mkdirSync(fontDir, { recursive: true });

  // --- extended fonts: the wide characters, 64 to a font
  // Glyph codes are numbered per main font now, so they always start at 0 and
  // two main fonts in one project cannot collide -- there is nothing to
  // allocate and no manifest to keep.
  const extFonts = [];
  const mapping = {};
  const imgW = GLYPH_COLS * CELL_W;

  for (let start = 0; start < wide.length; start += GLYPHS_PER_FONT) {
    const slice = wide.slice(start, start + GLYPHS_PER_FONT);
    const rows = Math.ceil(slice.length / GLYPH_COLS);
    const imgH = rows * cellH;
    const pixels = Buffer.alloc(imgW * imgH, PAPER);

    slice.forEach((cp, i) => {
      const x0 = (i % GLYPH_COLS) * CELL_W;
      const y0 = Math.floor(i / GLYPH_COLS) * cellH;
      const g = glyphs.get(cp);
      if (g) {
        // never centre under VWF: the advance is measured from the left edge,
        // and leading transparency would shift the glyph rather than pad it
        const pad = (!opts.vwf && g.w < CELL_W) ? (CELL_W - g.w) >> 1 : 0;
        drawGlyph(pixels, imgW, x0 + pad, y0, g, Math.min(g.w, CELL_W), cellH);
        if (opts.vwf) {
          const adv = Math.max(1, Math.min(CELL_W, advanceOf(g, CELL_W, opts.size)));
          if (adv < CELL_W) drawCull(pixels, imgW, x0, y0, adv, CELL_W, cellH);
        }
      } else if (opts.vwf) {
        // no glyph: cull the whole cell so it advances as a narrow blank
        drawCull(pixels, imgW, x0, y0, 1, CELL_W, cellH);
      }
      const code = start + i;
      mapping[String.fromCodePoint(cp)] = [0x80 + (code >> 7), 0x80 + (code & 0x7f)];
    });

    const index = extFonts.length;
    const name = `${opts.name}_ext${index}`;
    const file = path.join(fontDir, `${name}.png`);
    writePng(file, imgW, imgH, pixels);
    writeResource(file, {
      _resourceType: "font",
      name,
      symbol: `font_${name.replace(/[^a-z0-9]+/gi, "_").toLowerCase()}`,
      width: imgW,
      height: imgH,
      filename: `${name}.png`,
    });
    extFonts.push({ index, name, file, count: slice.length, first: start });
  }

  if (extFonts.length > 16) {
    throw new Error(
      `${wide.length} characters need ${extFonts.length} extended fonts, and the ` +
      `Assign Extended Fonts event takes at most 16. Split the script across more ` +
      `than one main font.`
    );
  }

  // --- main font: the ASCII image, and the mapping that encodes the wide codes
  let fontId = null;
  let fontLabel = opts.fontName || opts.name;
  if (opts.writeFont) {
    const cols = 16;
    const fontW = cols * asciiCells;
    const fontH = Math.ceil(ascii.length / cols) * cellH;
    const pixels = Buffer.alloc(fontW * fontH, PAPER);
    ascii.forEach((cp, i) => {
      const g = glyphs.get(cp);
      const x0 = (i % cols) * asciiCells;
      const y0 = Math.floor(i / cols) * cellH;
      if (g) {
        const pad = (!opts.vwf && g.w < asciiCells) ? (asciiCells - g.w) >> 1 : 0;
        drawGlyph(pixels, fontW, x0 + pad, y0, g, Math.min(g.w, asciiCells), cellH);
      }
      if (opts.vwf) {
        const adv = g
          ? Math.max(1, Math.min(asciiCells, advanceOf(g, asciiCells)))
          : Math.max(1, opts.spaceWidth);
        if (adv < asciiCells) drawCull(pixels, fontW, x0, y0, adv, asciiCells, cellH);
      }
    });
    const file = path.join(fontDir, `${opts.name}.png`);
    writePng(file, fontW, fontH, pixels);
    writeResource(file, {
      _resourceType: "font",
      name: fontLabel,
      symbol: `font_${opts.name.replace(/[^a-z0-9]+/gi, "_").toLowerCase()}`,
      width: fontW,
      height: fontH,
      filename: `${opts.name}.png`,
    });
  }
  try {
    const res = JSON.parse(fs.readFileSync(path.join(fontDir, `${opts.name}.png.gbsres`), "utf8"));
    fontId = res.id;
    fontLabel = res.name;
  } catch { /* --no-font, or the sidecar is managed by hand */ }

  const jsonFile = path.join(fontDir, `${opts.name}.json`);
  let json = {};
  if (fs.existsSync(jsonFile)) {
    try { json = JSON.parse(fs.readFileSync(jsonFile, "utf8")); } catch { /* replace */ }
  }
  // REPLACED, not merged: this run renumbered every glyph, so a leftover entry
  // from a previous run would quietly point at some other character's bitmap.
  json.mapping = mapping;
  fs.writeFileSync(jsonFile, JSON.stringify(json, null, 2) + "\n", "utf8");

  // --- report
  const rel = (p) => path.relative(outRoot, p).replace(/\\/g, "/");
  console.log("");
  console.log(`${wide.length} wide characters -> ${extFonts.length} extended font(s)`);
  for (const f of extFonts) {
    console.log(`  ${rel(f.file)}  ${f.count} glyphs (codes ${f.first}-${f.first + f.count - 1})`);
  }
  if (opts.writeFont) console.log(`  ${rel(path.join(fontDir, opts.name + ".png"))}  main font (ASCII)`);
  console.log(`  ${rel(jsonFile)}  character mapping`);
  console.log("");
  console.log("Next steps in GB Studio:");
  console.log(`  1. Settings -> Default Font: "${fontLabel}"   <- required, the`);
  console.log("     mapping is only applied to text compiled with the DEFAULT font.");
  console.log("  2. Add to the first scene's On Init:");
  console.log(`       Glyph Text: Assign Extended Fonts   main font "${fontLabel}",`);
  console.log(`       ${extFonts.length} extended font(s):`);
  extFonts.forEach((f, i) => console.log(`         ${i + 1}. "${f.name}"`));
  console.log("  3. Add Glyph Text: Reset Tile Cache to every scene's On Init.");
  console.log("  4. Settings -> Glyph Text:");
  console.log(`       half-width single-byte characters = ${opts.fullWidthAscii ? "off" : "on"}`);
  if (opts.vwf) {
    console.log("       variable width glyphs (VWF)       = on");
    console.log("       ...and widen the reserved tile range: VWF spends a tile pair");
    console.log("       per screen column, about 72 tiles for a two-line dialogue.");
    console.log("");
    console.log("     Advances come from the green cull margins in the font images.");
    console.log("     Repaint the green to respace a character; no table to rebuild.");
  }
};

const main = async () => {
  const opts = parseArgs(process.argv.slice(2));
  applyLoose(opts);
  if (!opts.project && !opts.chars && !opts.text) {
    const detected = detectProject();
    if (detected) {
      opts.project = detected;
      console.log("using the project this plugin is installed in: " + detected);
    }
  }
  const needsInput =
    (!opts.font && !opts.systemFont && !opts.hex) ||
    (!opts.project && !opts.chars && !opts.text);
  if (opts.wizard || (needsInput && process.stdin.isTTY)) await runWizard(opts);
  run(opts);
};

main().catch((e) => {
  console.error(`\nerror: ${e.message}\n`);
  process.exit(1);
});
