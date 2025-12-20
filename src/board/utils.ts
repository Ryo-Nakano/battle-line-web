import type { LocationInfo } from '../types';

/**
 * Droppable/Draggable ID文字列を解析し、LocationInfoオブジェクトに変換する。
 * 
 * ID形式:
 * - hand-{playerId} (例: hand-0)
 * - flag-{index}-{slotType} (例: flag-0-p0_slots, flag-8-tactic_zone)
 * - deck-{deckType} (例: deck-troop)
 * - discard
 * 
 * @param id 解析対象のID文字列
 * @returns LocationInfoオブジェクト、または解析失敗時はnull
 */
export function parseLocationId(id: string): LocationInfo | null {
  if (!id) return null;

  const parts = id.split('-');
  const type = parts[0];

  if (type === 'hand') {
    // id: hand-{playerId}
    // 例: hand-0
    if (parts.length < 2) return null;
    return { area: 'hand', playerId: parts[1] };
  }
  
  if (type === 'flag') {
    // id: flag-{index}-{slotType}
    if (parts.length < 3) return null;
    
    const index = parseInt(parts[1], 10);
    if (isNaN(index)) return null;

    // parts[2] 以降があれば結合しておく（念のため）
    const slotType = parts.slice(2).join('-'); 
    
    return { area: 'board', flagIndex: index, slotType: slotType as any };
  }

  if (type === 'deck') {
    // id: deck-{deckType}
    if (parts.length < 2) return null;
    return { area: 'deck', deckType: parts[1] as 'troop' | 'tactic' };
  }

  if (type === 'discard') {
    // id: discard
    return { area: 'discard' };
  }

  if (type === 'field') {
      // id: field-{playerId}
      if (parts.length < 2) return null;
      return { area: 'field', playerId: parts[1] };
  }

  return null;
}
