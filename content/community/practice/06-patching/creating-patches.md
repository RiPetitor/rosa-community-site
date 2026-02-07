+++
title = "Создание патчей"
weight = 2
+++

## Шаг 1: Подготовка окружения

```bash
sudo dnf install rpm-build rpmdevtools rpmlint gcc make \
    autoconf automake libtool git \
    ncurses-devel libsensors-devel
rpmdev-setuptree
```

Пакеты `ncurses-devel` и `libsensors-devel` — зависимости htop для сборки.
`git` нужен для создания патчей. `autoconf`, `automake`, `libtool` — для
перегенерации Autotools-файлов, если мы правим `configure.ac`.

## Шаг 2: Скачивание исходников

```bash
cd ~/rpmbuild/SOURCES

export VER=3.3.0

curl -L -o htop-${VER}.tar.gz \
  https://github.com/htop-dev/htop/archive/refs/tags/${VER}.tar.gz
```

Проверьте:

```bash
tar tzf htop-${VER}.tar.gz | head -10
```

Ожидаемый вывод:

```
htop-3.3.0/
htop-3.3.0/.github/
htop-3.3.0/AUTHORS
htop-3.3.0/COPYING
htop-3.3.0/ChangeLog
htop-3.3.0/Makefile.am
htop-3.3.0/README
htop-3.3.0/configure.ac
htop-3.3.0/htop.c
...
```

## Шаг 3: Воспроизведение проблемы

Допустим, наша задача: htop использует `-Werror`, и на новой версии
GCC сборка падает из-за нового предупреждения. Найдём `-Werror`:

```bash
cd /tmp
tar xzf ~/rpmbuild/SOURCES/htop-${VER}.tar.gz
cd htop-${VER}

grep -rn '\-Werror' .
```

Возможный вывод:

```
./configure.ac:52:  [AC_DEFINE(...)]
./Makefile.am:15:AM_CFLAGS = -Werror
```

Или `-Werror` может быть в `configure.ac` внутри `AC_CHECK`-макросов.
Если `-Werror` не найден в данной версии, мы создадим учебный патч
с другим полезным изменением (например, изменим дефолтный файл конфигурации).

## Шаг 4: Создание патча через git

Это **рекомендуемый** рабочий процесс создания патча:

```bash
cd /tmp/htop-${VER}

# Шаг 4.1: Инициализируем git-репозиторий с «чистыми» исходниками
git init
git add .
git commit -m "Import htop ${VER} pristine sources"
```

Ожидаемый вывод:

```
Initialized empty Git repository in /tmp/htop-3.3.0/.git/
[master (root-commit) abc1234] Import htop 3.3.0 pristine sources
 185 files changed, 52431 insertions(+)
```

Теперь у нас есть «точка отсчёта» — чистые исходники, как в архиве.

```bash
# Шаг 4.2: Вносим изменения
# Например, убираем -Werror из Makefile.am (если он есть):
sed -i 's/-Werror//g' Makefile.am

# Или правим configure.ac:
sed -i 's/-Werror//g' configure.ac
```

**Важное правило:** правьте **исходные** файлы (`configure.ac`, `Makefile.am`),
а не **сгенерированные** (`configure`, `Makefile.in`). Сгенерированные файлы
будут пересозданы через `autoreconf`.

```bash
# Шаг 4.3: Просмотрите изменения перед коммитом
git diff
```

Ожидаемый вывод (примерный):

```diff
diff --git a/configure.ac b/configure.ac
index a1b2c3d..e4f5g6h 100644
--- a/configure.ac
+++ b/configure.ac
@@ -50,7 +50,7 @@
-AM_CFLAGS="$AM_CFLAGS -Werror"
+AM_CFLAGS="$AM_CFLAGS"
```

Убедитесь, что изменения минимальны и правильны.

```bash
# Шаг 4.4: Коммитим изменение
git add -A
git commit -m "Disable -Werror for distribution builds

-Werror causes build failures with newer GCC versions due to
new warnings. This is not appropriate for distribution packages
where compiler versions may vary."
```

Описание коммита войдёт в патч-файл — пишите понятно.

```bash
# Шаг 4.5: Генерируем патч
git format-patch -1 --stdout > ~/rpmbuild/SOURCES/0001-Disable-Werror-for-distribution-builds.patch
```

Проверьте содержимое патча:

```bash
cat ~/rpmbuild/SOURCES/0001-Disable-Werror-for-distribution-builds.patch
```

Ожидаемый вывод:

```
From abc1234def5678 Mon Sep 17 00:00:00 2001
From: Your Name <your@email.com>
Date: Sat, 8 Feb 2026 12:00:00 +0300
Subject: [PATCH] Disable -Werror for distribution builds

-Werror causes build failures with newer GCC versions due to
new warnings. This is not appropriate for distribution packages
where compiler versions may vary.
---
 configure.ac | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)

diff --git a/configure.ac b/configure.ac
index a1b2c3d..e4f5g6h 100644
--- a/configure.ac
+++ b/configure.ac
@@ -50,7 +50,7 @@
...
```

Обратите внимание на структуру:
- Метаданные (From, Date, Subject)
- Описание
- Статистика изменений
- Собственно diff

## Шаг 5: Именование патчей

### Соглашения об именовании

```
0001-Disable-Werror-for-distribution-builds.patch    ← git format-patch стиль
0002-Fix-build-with-gcc14.patch                       ← следующий патч
0003-Backport-fix-for-CVE-2025-12345.patch           ← бэкпорт безопасности
```

**Нумерация важна:** патчи применяются в порядке номеров `Patch0`, `Patch1`, ...
Совпадение нумерации в имени файла и тегах SPEC упрощает навигацию.

Другие распространённые стили именования:

```
htop-3.3.0-disable-werror.patch          ← с именем пакета и версией
htop-rosa-default-config.patch           ← дистрибутив-специфичный
htop-backport-abc1234.patch              ← с хешом коммита upstream
```
