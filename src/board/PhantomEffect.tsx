import { useEffect, useRef, useState } from 'react';

interface PhantomEffectProps {
  isActive?: boolean;
}

/**
 * カード配置時のパーティクルエフェクト
 * 光の粒子がカードの枠線を周回する演出
 */
export function PhantomEffect({ isActive }: PhantomEffectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldRender, setShouldRender] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    if (isActive) {
      setShouldRender(true);
      setIsFadingOut(false);
    } else if (shouldRender) {
      // フェードアウト開始
      setIsFadingOut(true);
      // フェードアウト完了後にアンマウント
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsFadingOut(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isActive, shouldRender]);

  // パーティクル生成
  useEffect(() => {
    if (!shouldRender || !containerRef.current) return;

    const container = containerRef.current;
    const fragment = document.createDocumentFragment();
    const count = 32;
    const delayStep = 0.03;

    for (let i = 0; i < count; i++) {
      const orb = document.createElement('div');
      orb.className = 'phantom-orb';
      orb.style.animationDelay = `-${i * delayStep}s`;

      const ratio = i / count;
      orb.style.opacity = String((1 - ratio) * 0.8);
      orb.style.transform = `scale(${1 - ratio * 0.6})`;

      fragment.appendChild(orb);
    }

    container.appendChild(fragment);

    return () => {
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    };
  }, [shouldRender]);

  if (!shouldRender) return null;

  return (
    <div
      ref={containerRef}
      className={`phantom-container ${isFadingOut ? 'fading-out' : ''}`}
    />
  );
}

