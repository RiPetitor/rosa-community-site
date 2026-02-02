+++
title = "Патчи: создание, применение, backport"
weight = 1
description = "Когда нужны патчи, как их создавать и поддерживать в SPEC-файле."
+++

Патчи — это нормальная часть жизни пакетного мейнтейнера. Важно уметь делать их аккуратно и поддерживать при обновлениях.

## Когда нужны патчи

- Ошибка в upstream, мешающая сборке
- Требуется адаптация под ROSA (пути, зависимости, флаги)
- Backport исправления из новой версии
- Временное отключение нестабильной функции

## Как создавать патчи

### Вариант 1: Через git (рекомендуется)

```bash
git init
git add .
git commit -m "Import upstream"

# Внесли правки
git commit -am "Fix build for ROSA"
git format-patch -1
```

Получится файл `0001-Fix-build-for-ROSA.patch`.

### Вариант 2: Через diff

```bash
diff -u original/file.c modified/file.c > fix-rosa.patch
```

## Подключение в SPEC

```spec
Patch0:        fix-rosa.patch
Patch1:        backport-1234.patch

%prep
%autosetup -p1
# или:
# %patch0 -p1
# %patch1 -p1
```

**Важно:** корректно выбрать уровень `-p` (чаще всего `-p1`).

## Backport исправлений

Если фикс уже в upstream, делайте backport через `git cherry-pick`:

```bash
git cherry-pick <commit>
git format-patch -1
```

Нумеруйте патчи последовательно: `Patch0`, `Patch1`, `Patch2`.

## Хорошие практики

- Держите патчи минимальными
- Добавляйте краткое описание в changelog
- Проверяйте, что патч применим после обновления версии
- Удаляйте патчи, когда они больше не нужны

## Типичные ошибки

- Неправильный `-p` и «Hunk FAILED»
- Патч правит форматирование вместо сути
- Патч без объяснения в changelog
