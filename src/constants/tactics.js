import { TACTIC_IDS, TACTIC_CATEGORIES } from '../constants.js';

export const TACTICS_DATA = {
  [TACTIC_IDS.ALEXANDER]: {
    title: 'アレキサンダー',
    category: TACTIC_CATEGORIES.MORALE,
    description: 'ワイルドカード。あらゆる色・数字として扱える。制限：1回のゲームで1人どちらか1枚しか使えない（ダリウス含む）。'
  },
  [TACTIC_IDS.DARIUS]: {
    title: 'ダリウス',
    category: TACTIC_CATEGORIES.MORALE,
    description: 'ワイルドカード。あらゆる色・数字として扱える。制限：1回のゲームで1人どちらか1枚しか使えない（アレキサンダー含む）。'
  },
  [TACTIC_IDS.COMPANION]: {
    title: '援軍騎兵',
    category: TACTIC_CATEGORIES.MORALE,
    description: '「数字の8」として扱う。色はワイルド（任意）。'
  },
  [TACTIC_IDS.SHIELDBEARER]: {
    title: '盾',
    category: TACTIC_CATEGORIES.MORALE,
    description: '「数字の1, 2, 3」のいずれかとして扱う。色はワイルド（任意）。'
  },
  [TACTIC_IDS.FOG]: {
    title: '霧',
    category: TACTIC_CATEGORIES.ENVIRONMENT,
    description: 'そのフラッグでは役が無効になり、単純な数字の合計値のみで勝負する。'
  },
  [TACTIC_IDS.MUD]: {
    title: '泥沼',
    category: TACTIC_CATEGORIES.ENVIRONMENT,
    description: 'そのフラッグの完成に必要な枚数が4枚になる。'
  },
  [TACTIC_IDS.SCOUT]: {
    title: '偵察',
    category: TACTIC_CATEGORIES.GUILE,
    description: '山札（部隊・戦術の組み合わせ自由）から合計3枚引く。その後、手札から不要な2枚を山札の上に（好きな順で）戻す。'
  },
  [TACTIC_IDS.REDEPLOY]: {
    title: '配置転換',
    category: TACTIC_CATEGORIES.GUILE,
    description: '自分の配置済みのカード（未確保フラッグにあるもの）を1枚選び、別の場所に移動するか、捨て札にする。'
  },
  [TACTIC_IDS.DESERTER]: {
    title: '脱走',
    category: TACTIC_CATEGORIES.GUILE,
    description: '相手の配置済みのカード（未確保フラッグにあるもの）を1枚選び、捨て札にする。'
  },
  [TACTIC_IDS.TRAITOR]: {
    title: '裏切り',
    category: TACTIC_CATEGORIES.GUILE,
    description: '相手の配置済みの部隊カード（未確保フラッグにあるもの）を1枚選び、自分の空きスロットに移動する。'
  }
};

export const isEnvironmentTactic = (cardName) => {
  if (!cardName) return false;
  // cardName is expected to be Capitalized (e.g., 'Fog') matching TACTIC_IDS values
  const data = TACTICS_DATA[cardName];
  // Fallback for case-insensitive lookup if needed, though we aim for strictness
  if (!data) {
      // Try finding by lowercase key if strict lookup fails (compatibility)
      const key = Object.keys(TACTICS_DATA).find(k => k.toLowerCase() === cardName.toLowerCase());
      if (key) return TACTICS_DATA[key].category === TACTIC_CATEGORIES.ENVIRONMENT;
  }
  return data?.category === TACTIC_CATEGORIES.ENVIRONMENT;
};