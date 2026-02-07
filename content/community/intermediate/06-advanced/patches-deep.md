+++
title = "Патчи: создание, применение, backport"
weight = 1
description = "Когда нужны патчи, как их создавать и поддерживать в SPEC-файле."
+++

Патчи — это нормальная часть жизни пакетного мейнтейнера. Важно уметь делать их аккуратно и поддерживать при обновлениях.

## Когда нужны патчи

- Ошибка в upstream, мешающая сборке или работе
- Адаптация под ROSA (пути, зависимости, флаги компиляции)
- Backport исправления безопасности (CVE) из новой версии
- Временное отключение нестабильной функции
- Исправление совместимости с новой версией компилятора или библиотеки

**Когда патчи НЕ нужны:**
- Если можно решить задачу флагами `%configure` / `%cmake`
- Если достаточно правильно указать BuildRequires
- Если upstream уже выпустил новую версию с исправлением — обновите пакет

## Как создавать патчи

### Вариант 1: Через git (рекомендуется)

```bash
# Распаковать и инициализировать
tar xf mypackage-1.0.0.tar.gz
cd mypackage-1.0.0
git init
git add .
git commit -m "Import upstream 1.0.0"

# Внести правки
vim src/main.c

# Зафиксировать и создать патч
git add -A
git commit -m "Fix build with GCC 14 on ROSA"
git format-patch -1
```

Получится файл `0001-Fix-build-with-GCC-14-on-ROSA.patch`.

Для нескольких патчей:

```bash
# Первое исправление
git commit -am "Fix -Werror with GCC 14"
# Второе исправление
git commit -am "Use system libfoo instead of bundled"

# Создать все патчи от начального коммита
git format-patch HEAD~2
# 0001-Fix-Werror-with-GCC-14.patch
# 0002-Use-system-libfoo-instead-of-bundled.patch
```

### Вариант 2: Через diff

Для простых случаев или когда git недоступен:

```bash
cp -a mypackage-1.0.0 mypackage-1.0.0.orig
cd mypackage-1.0.0

# Внести правки
vim src/main.c

# Создать патч
cd ..
diff -urN mypackage-1.0.0.orig mypackage-1.0.0 > fix-rosa.patch
```

Флаги `diff`:
- `-u` — unified формат (читаемый)
- `-r` — рекурсивный (для каталогов)
- `-N` — новые файлы включаются в патч

### Вариант 3: Из upstream git-репозитория

Если исправление уже есть в upstream (например, в ветке `main`):

```bash
git clone https://github.com/upstream/project.git
cd project

# Найти коммит с фиксом
git log --oneline --grep="Fix crash"

# Создать патч из конкретного коммита
git format-patch -1 abc123def
```

## Подключение в SPEC

### Объявление патчей

```spec
# В преамбуле
Patch0:        0001-Fix-build-with-GCC-14.patch
Patch1:        0002-Use-system-libfoo.patch
Patch2:        backport-CVE-2025-1234.patch
```

### Применение патчей

```spec
%prep
# Вариант 1: autosetup — распаковывает и применяет все патчи
%autosetup -p1

# Вариант 2: ручное применение (если нужен контроль)
%setup -q
%patch0 -p1
%patch1 -p1
%patch2 -p1

# Вариант 3: применить патч с другим уровнем -p
%setup -q
%patch0 -p1
%patch1 -p0    # Патч без префикса a/b
```

### Уровни `-p` (strip)

Патч содержит пути вида `a/src/main.c` или `mypackage-1.0.0/src/main.c`:

| Уровень | Что убирает | Пример |
|---------|-------------|--------|
| `-p0` | Ничего | `src/main.c` → `src/main.c` |
| `-p1` | Один уровень | `a/src/main.c` → `src/main.c` |
| `-p2` | Два уровня | `a/src/main.c` → `main.c` |

Патчи из `git format-patch` используют `-p1` (убирает `a/` и `b/`).

## Backport исправлений

### Из новой версии upstream

```bash
# Клонировать upstream
git clone https://github.com/upstream/project.git
cd project

# Перейти на ветку стабильной версии
git checkout v1.0.0

# Cherry-pick коммита из main
git cherry-pick abc123def

# Если есть конфликты — разрешить вручную
git mergetool
git cherry-pick --continue

# Создать патч
git format-patch -1
```

### Backport исправления CVE

При критической уязвимости:

```bash
# Найти коммит, исправляющий CVE
git log --all --grep="CVE-2025-1234"

# Создать backport-патч
git cherry-pick <commit-hash>
git format-patch -1 --stdout > backport-CVE-2025-1234.patch
```

В SPEC добавьте комментарий:

```spec
# Security fix for CVE-2025-1234
# https://nvd.nist.gov/vuln/detail/CVE-2025-1234
Patch10:       backport-CVE-2025-1234.patch
```

## Именование и организация патчей

### Рекомендуемые конвенции

```
# Патчи, специфичные для ROSA
mypackage-rosa-default-config.patch

# Backport-исправления
backport-CVE-2025-1234.patch
backport-fix-crash-on-empty-input.patch

# Из git format-patch (оставляйте как есть)
0001-Fix-build-with-GCC-14.patch
0002-Use-system-libfoo.patch
```

### Группировка патчей по назначению

```spec
# Исправления сборки (0-99)
Patch0:        0001-Fix-Werror-with-GCC-14.patch
Patch1:        0002-Fix-linkage-order.patch

# Адаптация для ROSA (100-199)
Patch100:      mypackage-rosa-default-paths.patch
Patch101:      mypackage-rosa-systemd-unit.patch

# Backport-фиксы из upstream (200-299)
Patch200:      backport-fix-crash.patch

# Исправления безопасности (300+)
Patch300:      backport-CVE-2025-1234.patch
```

Нумерация не обязательна, но помогает поддерживать порядок при большом количестве патчей.

## Работа с конфликтами при обновлении

При обновлении версии upstream патчи часто перестают применяться:

```
error: patch failed: src/main.c:42
error: src/main.c: patch does not apply
```

### Алгоритм исправления

1. **Проверить, нужен ли ещё патч:**
   ```bash
   # Если исправление вошло в новую версию — удалите патч
   grep -r "исправленная строка" mypackage-2.0.0/src/
   ```

2. **Если патч ещё нужен — пересоздать:**
   ```bash
   tar xf mypackage-2.0.0.tar.gz
   cd mypackage-2.0.0
   git init && git add . && git commit -m "Import 2.0.0"

   # Применить старый патч вручную
   patch -p1 < ../old-fix.patch
   # Исправить конфликты, если есть

   git add -A
   git commit -m "Regenerated: Fix build for ROSA"
   git format-patch -1
   ```

3. **Отладка:**
   ```bash
   # Попробовать применить, не меняя файлы
   patch -p1 --dry-run < fix.patch

   # Применить с fuzz (допуском сдвига строк)
   patch -p1 --fuzz=3 < fix.patch
   ```

### Стратегии для долгоживущих патчей

Если вы поддерживаете патч через несколько обновлений upstream:

- Держите **git-ветку** с вашими изменениями поверх upstream
- При обновлении: `git rebase` на новый тег upstream
- Пересоздавайте патчи из обновлённой ветки

```bash
# Начальная настройка
git clone https://github.com/upstream/project.git
cd project
git checkout -b rosa-patches v1.0.0
# ... внести изменения, закоммитить ...

# При обновлении до v2.0.0
git fetch origin
git rebase v2.0.0
# Разрешить конфликты
git format-patch v2.0.0
```

## Хорошие практики

- Держите патчи **минимальными** — только суть изменения
- Не правьте **форматирование** рядом с изменением — это усложняет ребейз
- Каждый патч — **одна логическая задача** (не мешайте в одном патче два фикса)
- Добавляйте **описание** в заголовок патча (git format-patch делает это автоматически)
- **Документируйте** каждый патч в changelog
- **Отправляйте** исправления upstream, если они не ROSA-специфичны
- Регулярно проверяйте — не вошёл ли ваш патч в новый релиз upstream

## Типичные ошибки

### «Hunk FAILED»

```
patching file src/main.c
Hunk #1 FAILED at 42.
1 out of 1 hunk FAILED -- saving rejects to file src/main.c.rej
```

**Причины:** контекст патча не совпадает (код изменился в новой версии).

**Решение:** откройте `.rej`-файл, найдите, что изменилось, и пересоздайте патч.

### Патч ломает другие платформы

Изменения, специфичные для ROSA, могут сломать сборку на другой архитектуре.

**Решение:** оборачивайте ROSA-специфичные правки в условия:

```c
/* Если правите C-код */
#ifdef __rosa__
  /* ROSA-специфичный код */
#endif
```

Или делайте патч через `configure`-опции, а не правку кода.

### Патч содержит лишние изменения

Патч из `git diff` может захватить случайные изменения (права файлов, пробелы).

**Решение:** всегда проверяйте содержимое патча перед добавлением:

```bash
# Прочитать патч глазами
less 0001-fix.patch

# Проверить, что меняется только нужное
filterdiff --files='*/main.c' 0001-fix.patch
```

## Проверьте понимание

1. Когда лучше обновить версию вместо создания патча?
2. Чем отличается `git format-patch` от `diff -u`?
3. Что означает уровень `-p1` при применении патча?
4. Как пересоздать патч после обновления версии upstream?
5. Зачем отправлять патчи upstream?

---

**Далее:** [Подпакеты: -devel, -doc, -libs](@/community/intermediate/06-advanced/subpackages.md)
