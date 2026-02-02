+++
title = "Source и Patch: источники и патчи"
weight = 2
description = "Откуда брать исходники, как называть архивы, как применять патчи."
+++

Теги `Source` и `Patch` указывают, откуда брать исходный код и какие модификации к нему применять.

## Тег Source

### Формат

```spec
Source0:        https://example.com/project/project-%{version}.tar.gz
Source1:        project.conf
Source2:        project.service
```

Нумерация начинается с 0. `Source` без номера эквивалентен `Source0`.

### URL vs локальный файл

**URL (рекомендуется):**
```spec
Source0:        https://github.com/user/project/archive/v%{version}/project-%{version}.tar.gz
```

Преимущества:
- `spectool -g project.spec` автоматически скачает архив
- Очевидно происхождение исходников
- Воспроизводимость сборки

**Локальный файл:**
```spec
Source1:        project-rosa.conf
```

Файл должен лежать рядом со SPEC в каталоге `SOURCES/`.

### Распространённые паттерны URL

**GitHub релизы:**
```spec
Source0:        https://github.com/%{github_user}/%{github_repo}/archive/v%{version}/%{name}-%{version}.tar.gz

# Или через releases
Source0:        https://github.com/%{github_user}/%{github_repo}/releases/download/v%{version}/%{name}-%{version}.tar.gz
```

**GitLab:**
```spec
Source0:        https://gitlab.com/user/project/-/archive/v%{version}/project-v%{version}.tar.bz2
```

**PyPI:**
```spec
Source0:        %{pypi_source}
# Раскрывается в https://files.pythonhosted.org/packages/source/p/project/project-%{version}.tar.gz
```

**GNU FTP:**
```spec
Source0:        https://ftp.gnu.org/gnu/%{name}/%{name}-%{version}.tar.xz
```

### Снапшоты из Git

Когда нужна версия, которой нет в релизах:

```spec
%global commit          abc123def456...
%global shortcommit     %(c=%{commit}; echo ${c:0:7})
%global commit_date     20250203

Name:           project
Version:        1.0
Release:        0.1.%{commit_date}git%{shortcommit}%{?dist}

Source0:        https://github.com/user/project/archive/%{commit}/project-%{shortcommit}.tar.gz
```

### Дополнительные Source

Часто нужны дополнительные файлы:

```spec
Source0:        https://example.com/project-%{version}.tar.gz
Source1:        project.sysconfig        # Конфиг для /etc/sysconfig
Source2:        project.service          # Systemd unit
Source3:        project.logrotate        # Конфиг logrotate
Source10:       project-README.rosa.md   # Дополнительная документация
```

Нумерация может быть не последовательной для логической группировки.

## Тег Patch

Патчи модифицируют исходники. Применяйте их, когда нужно:
- Исправить баг, не исправленный в upstream
- Адаптировать под особенности дистрибутива
- Backport-исправления из новых версий

### Формат

```spec
Patch0:         project-fix-build.patch
Patch1:         project-rosa-defaults.patch
Patch100:       project-CVE-2025-1234.patch
```

### Создание патча

**Из двух каталогов:**
```bash
# Распаковать оригинал
tar xf project-1.0.tar.gz
cp -a project-1.0 project-1.0.orig

# Внести изменения в project-1.0/
vim project-1.0/src/main.c

# Создать патч
diff -Naur project-1.0.orig project-1.0 > fix-crash.patch
```

**Из git:**
```bash
cd project
# Внести изменения и закоммитить
git add .
git commit -m "Fix crash on startup"

# Создать патч
git format-patch -1 HEAD
# Создаст файл 0001-Fix-crash-on-startup.patch
```

### Применение патчей

**Старый способ (в %prep):**
```spec
%prep
%setup -q
%patch0 -p1
%patch1 -p1 -b .rosa
```

`-p1` — убрать один уровень каталога из путей в патче (обычно `a/` и `b/`).
`-b .rosa` — создать backup-файлы с суффиксом `.rosa`.

**Современный способ (рекомендуется):**
```spec
%prep
%autosetup -p1
```

`%autosetup` автоматически применяет все патчи в порядке номеров.

### Условные патчи

```spec
# Патч только для определённой архитектуры
%ifarch aarch64
Patch10:        project-aarch64-fix.patch
%endif

# Или через применение
%prep
%autosetup -p1 -N  # -N = не применять патчи автоматически
%patch0 -p1
%ifarch aarch64
%patch10 -p1
%endif
```

### Соглашения по именованию

Хорошая практика — давать патчам понятные имена:

```spec
# Формат: имя-пакета-описание.patch
Patch0:         htop-fix-memory-leak.patch
Patch1:         htop-default-config.patch
Patch100:       htop-CVE-2025-1234.patch  # Безопасность — высокие номера
```

### Группировка патчей

```spec
# 0-99: Исправления багов
Patch0:         project-fix-segfault.patch
Patch1:         project-fix-memory-leak.patch

# 100-199: Адаптация под дистрибутив
Patch100:       project-rosa-paths.patch
Patch101:       project-rosa-defaults.patch

# 200-299: Backports
Patch200:       project-backport-feature-x.patch

# 900-999: Безопасность
Patch900:       project-CVE-2025-0001.patch
```

## Верификация исходников

### Подписи и хеши

Для критичных пакетов проверяйте подлинность:

```spec
Source0:        https://example.com/project-%{version}.tar.gz
Source1:        https://example.com/project-%{version}.tar.gz.asc

# В %prep перед распаковкой
%prep
gpgv2 --keyring %{SOURCE2} %{SOURCE1} %{SOURCE0}
%autosetup -p1
```

### Указание хешей (не стандартно для RPM)

В комментариях для документации:

```spec
# SHA256: abc123...
Source0:        https://example.com/project-%{version}.tar.gz
```

## Типичные проблемы

### «Patch does not apply»

```
patch: **** Can't find file to patch at input line 5
```

**Причины:**
1. Неправильный `-p` уровень
2. Патч создан для другой версии
3. Патч уже применён в новой версии (удалите его)

**Решение:**
```bash
# Посмотреть, что внутри патча
head -20 fix.patch

# Попробовать разные уровни
cd BUILD/project-1.0
patch -p0 --dry-run < ../../SOURCES/fix.patch
patch -p1 --dry-run < ../../SOURCES/fix.patch
```

### «Hunk FAILED»

```
Hunk #1 FAILED at 42.
```

Контекст патча не совпадает. Код изменился.

**Решение:**
1. Проверить, не исправлено ли уже в upstream
2. Создать патч заново для новой версии
3. Использовать `--fuzz=3` (не рекомендуется — скрывает проблемы)

### Архив распаковывается в неожиданный каталог

```bash
# Ожидали project-1.0/, получили project/
```

**Решение — указать имя каталога:**
```spec
%prep
%setup -q -n project
# или
%autosetup -n project
```

## Практика

Создайте патч для учебного проекта:

```bash
# Скачать исходники
spectool -g ~/rpmbuild/SPECS/hello.spec

# Распаковать
cd ~/rpmbuild/BUILD
tar xf ../SOURCES/hello-2.12.1.tar.gz
cp -a hello-2.12.1 hello-2.12.1.orig

# Внести изменение
echo "/* ROSA Linux */" >> hello-2.12.1/src/hello.c

# Создать патч
diff -Naur hello-2.12.1.orig hello-2.12.1 > ../SOURCES/hello-rosa-comment.patch

# Добавить в SPEC
# Patch0: hello-rosa-comment.patch
```

## Проверьте понимание

1. Чем отличается `Source0` от `Source1`?
2. Как скачать все Source-файлы из SPEC?
3. Что означает `-p1` при применении патча?
4. Когда нужно использовать `%autosetup -n`?
5. Как создать патч из git-коммита?

---

**Далее:** [Зависимости: BuildRequires и Requires](dependencies.md)
