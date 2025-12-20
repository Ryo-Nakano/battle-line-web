/** 
 * @type {{ P0: '0', P1: '1' }} 
 */
export const PLAYER_IDS = {
  P0: '0',
  P1: '1',
};

/** 
 * @type {{ TROOP: 'troop', TACTIC: 'tactic' }} 
 */
export const CARD_TYPES = {
  TROOP: 'troop',
  TACTIC: 'tactic',
};

/** 
 * @type {{ TROOP: 'troop', TACTIC: 'tactic' }} 
 */
export const DECK_TYPES = {
  TROOP: 'troop',
  TACTIC: 'tactic',
};

/**
 * @type {{ RED: 'red', ORANGE: 'orange', YELLOW: 'yellow', GREEN: 'green', BLUE: 'blue', PURPLE: 'purple' }}
 */
export const COLORS = {
  RED: 'red',
  ORANGE: 'orange',
  YELLOW: 'yellow',
  GREEN: 'green',
  BLUE: 'blue',
  PURPLE: 'purple',
};

export const TROOP_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/**
 * @type {{ HAND: 'hand', BOARD: 'board', DECK: 'deck', DISCARD: 'discard', FIELD: 'field' }}
 */
export const AREAS = {
  HAND: 'hand',
  BOARD: 'board',
  DECK: 'deck',
  DISCARD: 'discard',
  FIELD: 'field',
};

/**
 * @type {{ P0: 'p0_slots', P1: 'p1_slots', P0_TACTIC: 'p0_tactic_slots', P1_TACTIC: 'p1_tactic_slots' }}
 */
export const SLOTS = {
  P0: 'p0_slots',
  P1: 'p1_slots',
  P0_TACTIC: 'p0_tactic_slots',
  P1_TACTIC: 'p1_tactic_slots',
};

export const GAME_CONFIG = {
  HAND_SIZE: 7,
  FLAG_COUNT: 9,
  SCOUT_DRAW_LIMIT: 3,
  MUD_CARD_REQUIREMENT: 4,
  SCOUT_RETURN_LIMIT: 2,
};

/**
 * @type {{ ALEXANDER: 'Alexander', DARIUS: 'Darius', COMPANION: 'Companion', SHIELDBEARER: 'ShieldBearer', FOG: 'Fog', MUD: 'Mud', SCOUT: 'Scout', REDEPLOY: 'Redeploy', DESERTER: 'Deserter', TRAITOR: 'Traitor' }}
 */
export const TACTIC_IDS = {
  ALEXANDER: 'Alexander',
  DARIUS: 'Darius',
  COMPANION: 'Companion',
  SHIELDBEARER: 'ShieldBearer',
  FOG: 'Fog',
  MUD: 'Mud',
  SCOUT: 'Scout',
  REDEPLOY: 'Redeploy',
  DESERTER: 'Deserter',
  TRAITOR: 'Traitor',
};

export const TACTIC_CATEGORIES = {
  MORALE: '士気高揚戦術',
  ENVIRONMENT: '地形戦術',
  GUILE: '謀略戦術',
};
