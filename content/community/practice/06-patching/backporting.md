+++
title = "Backport из upstream"
weight = 4
+++

## Сценарий

Допустим, в upstream-репозитории htop есть коммит, который исправляет
ошибку отображения. Мы хотим забрать этот коммит в наш пакет версии 3.3.0,
не обновляясь до следующей версии.

## Полный рабочий процесс

```bash
# Шаг 1: Клонируем upstream-репозиторий
cd /tmp
git clone https://github.com/htop-dev/htop.git
cd htop

# Шаг 2: Находим нужный коммит
# Можно искать по описанию:
git log --oneline --all | grep -i "fix"

# Или по файлу:
git log --oneline -- Process.c

# Допустим, нашли коммит abc1234
```

```bash
# Шаг 3: Переключаемся на ветку нашей версии
git checkout 3.3.0

# Шаг 4: Пробуем cherry-pick
git cherry-pick abc1234
```

Если cherry-pick прошёл без конфликтов:

```bash
# Шаг 5: Создаём патч
git format-patch -1 --stdout > ~/rpmbuild/SOURCES/0002-Backport-fix-display-bug.patch
```

### Если возник конфликт

При cherry-pick git может сообщить:

```
error: could not apply abc1234... Fix display bug
hint: After resolving the conflicts, mark the corrected paths
hint: with 'git add <paths>', then run 'git cherry-pick --continue'.
```

Что делать:

```bash
# Шаг 1: Посмотрите, какие файлы конфликтуют
git status
```

Вывод:

```
Unmerged paths:
  both modified:   Process.c
```

```bash
# Шаг 2: Откройте файл и найдите конфликтные маркеры
grep -n '<<<<<<' Process.c
```

Вы увидите что-то вроде:

```c
<<<<<<< HEAD
    // код из версии 3.3.0
    old_function(arg);
=======
    // код из коммита abc1234
    new_function(arg);
>>>>>>> abc1234
```

```bash
# Шаг 3: Отредактируйте файл — оставьте правильный вариант,
# удалите маркеры <<<<<<<, =======, >>>>>>>

# Шаг 4: Отметьте конфликт как разрешённый
git add Process.c
git cherry-pick --continue
```

### .rej-файлы при использовании patch

Если вы применяете патч не через git, а через `patch`, конфликтные куски
сохраняются в файлы `.rej`:

```
Process.c.rej
```

Содержимое `.rej` показывает, какие изменения не удалось применить.
Вам нужно вручную внести эти изменения и пересоздать патч.

## Добавление backport-патча в SPEC

```spec
Patch0:  0001-Disable-Werror-for-distribution-builds.patch
Patch1:  0002-Backport-fix-display-bug.patch

%prep
%autosetup -p1
autoreconf -fi
```

`%autosetup -p1` применит оба патча по порядку.

Не забудьте обновить `%changelog`:

```spec
%changelog
* Sat Feb 08 2026 Your Name <your@email.com> - 3.3.0-3
- Backport fix for display bug from upstream (abc1234)

* Sat Feb 08 2026 Your Name <your@email.com> - 3.3.0-2
- Disable -Werror to fix build with GCC 14
```

## Обслуживание патчей при обновлении версии

Когда upstream выпускает новую версию (например, 3.4.0), ваши патчи
могут перестать применяться. Рабочий процесс обновления:

```bash
# 1. Обновите Source0 и Version в SPEC
# 2. Попробуйте собрать
rpmbuild -bp htop.spec   # только %prep — проверяем, применяются ли патчи

# 3. Если патч не применился — нужно адаптировать:
cd ~/rpmbuild/BUILD/htop-3.4.0/
# Примените патч вручную:
patch -p1 < ~/rpmbuild/SOURCES/0001-Disable-Werror-for-distribution-builds.patch
# Если есть .rej файлы — исправьте вручную

# 4. Проверьте, не вошёл ли фикс в новую версию
# Если вошёл — удалите патч из SPEC (и файл из SOURCES)

# 5. Пересоздайте патч, если нужно:
git init && git add . && git commit -m "Import 3.4.0"
# ... внесите изменения ...
git format-patch -1 --stdout > ~/rpmbuild/SOURCES/0001-Disable-Werror-for-distribution-builds.patch
```

**Совет:** при каждом обновлении проверяйте, не были ли ваши патчи приняты
в upstream. Если да — удалите патч. Чем меньше патчей, тем проще жизнь.
