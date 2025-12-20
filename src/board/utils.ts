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
    // slotType は '_' を含む可能性があるため (p0_slots など)、
    // parts[2] 以降を結合する必要があるが、現状の命名規則では '-' 区切りで分割されている。
    // 定義上: p0_slots -> parts: ['flag', '0', 'p0_slots'] となるはずだが、
    // もしハイフン区切りの場合 (p0-slots) は結合が必要。
    // 今回の計画では "p0_slots" という文字列をそのままIDの一部として使う想定 (例: flag-0-p0_slots)
    // なので split('-') すると: ['flag', '0', 'p0_slots'] となる。
    
    if (parts.length < 3) return null;
    
    const index = parseInt(parts[1], 10);
    if (isNaN(index)) return null;

    // parts[2] 以降があれば結合しておく（念のため）
    const slotType = parts.slice(2).join('-'); 
    
    if (slotType !== 'p0_slots' && slotType !== 'p1_slots' && slotType !== 'p0_tactic_slots' && slotType !== 'p1_tactic_slots') {
        // もしかするとアンダースコアではなくハイフンで繋がれている可能性を考慮？
        // 現状は厳密に型定義通り判定する
        return null;
    }

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
