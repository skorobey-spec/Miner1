# Блок-схема логики игры "Сапёр"

## Основная схема

```mermaid
flowchart TD
    START([Запуск игры]) --> LOAD{Есть сохранение?}
    LOAD -->|Да| RESTORE[Восстановить сохранение]
    LOAD -->|Нет| NEWGAME[Новая игра]
    
    RESTORE --> DISPLAY[Отобразить поле]
    NEWGAME --> DISPLAY
    
    DISPLAY --> WAIT{Ожидание клика}
    
    WAIT -->|ПКМ| FLAG[Поставить/снять флаг]
    FLAG --> WAIT
    
    WAIT -->|ЛКМ| FIRST{Первый клик?}
    FIRST -->|Да| MINES[Расставить мины<br>исключая соседей]
    MINES --> TIMER[Запустить таймер]
    FIRST -->|Нет| CHECKCELL{Есть флаг<br>или открыта?}
    
    TIMER --> WAIT
    
    CHECKCELL -->|Да| WAIT
    CHECKCELL -->|Нет| ISMINE{Это мина?}
    
    ISMINE -->|Нет| REVEAL[Открыть клетку]
    REVEAL --> EMPTY{Пустая<br>0 соседей?}
    EMPTY -->|Да| FLOOD[Рекурсивно открыть соседей]
    EMPTY -->|Нет| WINCHECK
    FLOOD --> WINCHECK{Все безопасные<br>открыты?}
    
    ISMINE -->|Да| LIFE{Есть жизни?}
    LIFE -->|Да| LOSE[Потерять жизнь]
    LOSE --> AUTOFLAG[Автофлаг на мину]
    AUTOFLAG --> WAIT
    LIFE -->|Нет| GAMEOVER[Поражение]
    
    WINCHECK -->|Да| WIN[Победа!]
    WINCHECK -->|Нет| WAIT
    WIN --> END([Конец])
    GAMEOVER --> END
    
    WAIT -->|Обе кнопки| CHORD{Число = флагов?}
    CHORD -->|Нет| HIGHLIGHT[Подсветить пустые]
    CHORD -->|Да| OPENNEIGH[Открыть соседей]
    HIGHLIGHT --> WAIT
    OPENNEIGH --> HIT{Есть мина?}
    HIT -->|Да| LIFE
    HIT -->|Нет| WINCHECK
    
    CLICKSAVE[Автосохранение] -.-> WAIT
```

## Система жизней

```mermaid
flowchart TD
    HIT[Наступил на мину] --> CHECK{Защита уже стоит?}
    CHECK -->|Нет| SAVE1[Добавить мину в protectedMines]
    CHECK -->|Да| LOSE[Потереть жизнь]
    
    SAVE1 --> LOSE
    LOSE --> DEC{Жизни > 0?}
    DEC -->|Да| ANGEL[Показать 👼]
    DEC -->|Нет| EXPLOSION[Взрыв 💥]
    
    ANGEL --> FLAG2[Поставить флаг на мину]
    FLAG2 --> CONTINUE[Продолжить игру]
    EXPLOSION --> END([Поражение])
```

## Автосохранение

```mermaid
flowchart TD
    EVENT[Действие в игре] --> STATE{Игра активна?}
    STATE -->|Да| SAVE[Сохранить в localStorage]
    STATE -->|Нет| CLEAR[Удалить сохранение]
    
    CLOSE[Закрытие/скрытие вкладки] --> SAVE
```

## Расшифровка действий

| Действие | Описание |
|----------|----------|
| ЛКМ | Открыть клетку |
| ПКМ | Поставить/снять флаг |
| Обе кнопки | Открыть соседей (chord) |
| `protectedMines` | Мины, на которые игрок уже наступал (защита от повтора) |
