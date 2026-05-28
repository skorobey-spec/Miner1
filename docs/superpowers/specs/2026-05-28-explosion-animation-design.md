# Explosion Animation Design

## Overview
Добавить анимацию взрыва при потере последней жизни. Включает вспышку огня, разлёт окружающих ячеек и финальный взрыв всех неотмеченных мин.

## Trigger
В `loseLife()` когда `lives === 1` (то есть после уменьшения `lives—` стало 0):
1. Запускается цепочка анимаций вместо `setTimeout(() => endGame(false), 1000)`
2. Игровое поле блокируется (клики не работают)

## 1. Fire Flash
- К взорванной ячейке добавляется абсолютно позиционированный псевдоэлемент (или дочерний div) с `radial-gradient(circle, rgba(255,200,50,0.9), rgba(255,50,0,0.5), transparent)`
- Анимация: появляется за 100ms, держится 200ms, затухает за 300ms (~600ms общая)
- После завершения элемент удаляется

## 2. Cell Fly-Away (Radius 2)
Через ~200ms после вспышки:
- Собираются все неоткрытые клетки, где `max(|dx|, |dy|) ≤ 2` (квадрат 5×5) от взорвавшейся мины (не включая саму мину)
- Для каждой вычисляется направление от центра: `dx = col - centerCol`, `dy = row - centerRow`
- На каждую ячейку устанавливаются inline CSS custom properties:
  - `--tx`: итоговый сдвиг X = `dx * (80 + random(0, 40))` px
  - `--ty`: итоговый сдвиг Y = `dy * (80 + random(0, 40))` px
  - `--rot`: случайный угол `random(-720, 720)` deg
  - `--duration`: `600 + random(0, 400)` ms
  - `--delay`: `distance * 30` ms (внутренние летят раньше)
- Ячейки получают класс `cell-flying` с анимацией `fly-away`
- После завершения анимации ячейки скрываются (`opacity: 0`)

### CSS @keyframes fly-away
```css
@keyframes fly-away {
    0% {
        transform: translate(0, 0) rotate(0deg);
        opacity: 1;
    }
    100% {
        transform: translate(var(--tx), var(--ty)) rotate(var(--rot));
        opacity: 0;
    }
}
```

## 3. Final Mine Explosion
Через ~300ms после начала разлёта:
- Все неотмеченные флагом мины на поле получают класс `mine-final-explode`
- Анимация: scale(0) → scale(1.5) с яркой вспышкой
- После завершения анимации (~500ms) вызывается `endGame(false)`

### CSS @keyframes mine-final-explosion
```css
@keyframes mine-final-explosion {
    0% { transform: scale(0); opacity: 0; }
    20% { transform: scale(1.8); opacity: 1; filter: brightness(3); }
    40% { transform: scale(0.8); filter: brightness(2); }
    60% { transform: scale(1.2); filter: brightness(1.5); }
    100% { transform: scale(1); filter: brightness(1); }
}
```

## Implementation Changes

### script.js
- `loseLife()`: при `lives === 0` запускать `triggerExplosionChain(row, col)` вместо `setTimeout(endGame, 1000)`
- Новый метод `triggerExplosionChain(row, col)` — управляет таймингами всей цепочки
- Новый метод `flyAwayCells(centerRow, centerCol)` — собирает ячейки, устанавливает CSS-переменные, добавляет класс
- Новый метод `explodeAllMines()` — взрывает все неотмеченные мины, затем вызывает `endGame(false)`
- Флаг `explosionInProgress` блокирует клики

### style.css
- `@keyframes fly-away` с использованием `var(--tx)`, `var(--ty)`, `var(--rot)`
- `@keyframes fire-flash` для вспышки
- `@keyframes mine-final-explosion` для финального взрыва
- Классы: `.fire-flash`, `.cell-flying`, `.mine-final-explode`
- `.cell-flying` с `animation: fly-away var(--duration) ease-in var(--delay) forwards`
- `.mine-final-explode` с соответствующей анимацией
