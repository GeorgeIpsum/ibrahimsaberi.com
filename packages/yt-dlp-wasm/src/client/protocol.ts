// SAB control-region layout (Int32 slots) and opcodes, shared by all three contexts.

/** Number of Int32 slots in the control region. */
export const CTRL_SLOTS = 4;
/** Control-region size in bytes (Int32Array prefix of the SharedArrayBuffer). */
export const CTRL_BYTES = CTRL_SLOTS * 4; // 16

/** Indices into the control-region Int32Array view. */
export const SLOT = {
  STATE: 0,
  OP: 1,
  LEN: 2,
  REQ_ID: 3,
} as const;

/** Channel states stored in `SLOT.STATE`. */
export const STATE = {
  IDLE: 0,
  REQUEST: 1,
  RESPONSE: 2,
  ERROR: 3,
} as const;

/** Bridge opcodes. */
export const OP = {
  ECHO: 1,
  FS_PUT: 2,
  FS_GET: 3,
  FS_STAT: 4,
  FS_DELETE: 5,
  FFMPEG_EXEC: 6,
} as const;

export type Op = (typeof OP)[keyof typeof OP];
