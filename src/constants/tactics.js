export const TACTICS_DATA = {
  'alexander': {
    title: 'アレキサンダー',
    category: '士気高揚戦術',
    description: 'ワイルドカード。あらゆる色・数字として扱える。制限：1回のゲームで1人どちらか1枚しか使えない（ダリウス含む）。'
  },
  'darius': {
    title: 'ダリウス',
    category: '士気高揚戦術',
    description: 'ワイルドカード。あらゆる色・数字として扱える。制限：1回のゲームで1人どちらか1枚しか使えない（アレキサンダー含む）。'
  },
  'companion': {
    title: '援軍騎兵',
    category: '士気高揚戦術',
    description: '「数字の8」として扱う。色はワイルド（任意）。'
  },
  'shieldbearer': {
    title: '盾',
    category: '士気高揚戦術',
    description: '「数字の1, 2, 3」のいずれかとして扱う。色はワイルド（任意）。'
  },
  'fog': {
    title: '霧',
    category: '地形戦術',
    description: 'そのフラッグでは役が無効になり、単純な数字の合計値のみで勝負する。'
  },
  'mud': {
    title: '泥沼',
    category: '地形戦術',
    description: 'そのフラッグの完成に必要な枚数が4枚になる。'
  },
  'scout': {
    title: '偵察',
    category: '謀略戦術',
    description: '山札（部隊・戦術の組み合わせ自由）から合計3枚引く。その後、手札から不要な2枚を山札の上に（好きな順で）戻す。'
  },
  'redeploy': {
    title: '配置転換',
    category: '謀略戦術',
    description: '自分の配置済みのカード（未確保フラッグにあるもの）を1枚選び、別の場所に移動するか、捨て札にする。'
  },
  'deserter': {
    title: '脱走',
    category: '謀略戦術',
    description: '相手の配置済みのカード（未確保フラッグにあるもの）を1枚選び、捨て札にする。'
  },
  'traitor': {
    title: '裏切り',
    category: '謀略戦術',
    description: '相手の配置済みの部隊カード（未確保フラッグにあるもの）を1枚選び、自分の空きスロットに移動する。'
  }
};

export const isEnvironmentTactic = (cardName) => {
  if (!cardName) return false;
  const data = TACTICS_DATA[cardName.toLowerCase()];
  return data?.category === '地形戦術';
};
