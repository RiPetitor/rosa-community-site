+++
title = "Установка инструментов"
weight = 1
description = "Какие пакеты нужны для сборки RPM, настройка окружения."
+++

Перед началом работы нужно установить необходимые инструменты и настроить окружение.

## Базовые инструменты

### Минимальный набор

```bash
sudo dnf install rpm-build rpmdevtools rpmlint
```

| Пакет | Назначение |
|-------|------------|
| `rpm-build` | Основная система сборки RPM (`rpmbuild`) |
| `rpmdevtools` | Утилиты для разработчиков (`rpmdev-setuptree`, `spectool`, `rpmdev-bumpspec`) |
| `rpmlint` | Проверка пакетов и SPEC-файлов на ошибки |

### Расширенный набор

```bash
sudo dnf install rpm-build rpmdevtools rpmlint \
    mock \
    gcc gcc-c++ make cmake meson \
    git curl wget
```

| Пакет | Назначение |
|-------|------------|
| `mock` | Сборка в изолированном окружении (chroot) |
| `gcc`, `gcc-c++` | Компиляторы C и C++ |
| `make`, `cmake`, `meson` | Системы сборки |
| `git` | Система контроля версий |
| `curl`, `wget` | Скачивание файлов |

## Утилиты rpmdevtools

### rpmdev-setuptree

Создаёт стандартную структуру каталогов:

```bash
rpmdev-setuptree
```

Создаёт:
```
~/rpmbuild/
├── BUILD/
├── RPMS/
├── SOURCES/
├── SPECS/
└── SRPMS/
```

### spectool

Скачивает Source и Patch из SPEC-файла:

```bash
# Скачать все Source
spectool -g package.spec

# Скачать в определённый каталог
spectool -g -C ~/rpmbuild/SOURCES/ package.spec

# Показать URL без скачивания
spectool -l package.spec
```

### rpmdev-bumpspec

Обновляет версию и changelog:

```bash
# Увеличить Release
rpmdev-bumpspec -c "Rebuild for new libfoo" package.spec

# Установить новую Version
rpmdev-bumpspec -n 2.0.0 -c "Update to 2.0.0" package.spec
```

### rpmdev-newspec

Создаёт шаблон SPEC-файла:

```bash
rpmdev-newspec mypackage
# Создаст mypackage.spec с базовым шаблоном
```

## Настройка ~/.rpmmacros

Персональные настройки для rpmbuild:

```bash
cat > ~/.rpmmacros << 'EOF'
%_topdir        %(echo $HOME)/rpmbuild
%packager       Your Name <your@email.com>
%vendor         ROSA Linux

# Сохранять buildroot после сборки (для отладки)
# %_auto_clean   0

# Параллельная сборка
%_smp_mflags    -j%(nproc)

# Отключить создание debuginfo (для тестов)
# %debug_package %{nil}
EOF
```

### Основные макросы

| Макрос | Описание |
|--------|----------|
| `%_topdir` | Корневой каталог сборки |
| `%packager` | Имя и email сборщика |
| `%vendor` | Поставщик пакетов |
| `%_smp_mflags` | Флаги параллельной сборки |
| `%dist` | Суффикс дистрибутива |

## Установка групп разработки

Для сборки многих пакетов нужны базовые инструменты:

```bash
# Группа для сборки C/C++
sudo dnf group install "Development Tools"

# Или по отдельности
sudo dnf install gcc gcc-c++ make automake autoconf libtool pkgconfig
```

## Mock: изолированная сборка

Mock создаёт чистое окружение для сборки:

```bash
# Установка
sudo dnf install mock

# Добавить пользователя в группу mock
sudo usermod -aG mock $USER
# Перелогиньтесь для применения

# Сборка в mock (имя профиля смотрите в /etc/mock)
mock -r rosa-13.1-x86_64 package.src.rpm

# Или из SPEC
mock -r rosa-13.1-x86_64 --spec package.spec --sources ~/rpmbuild/SOURCES/
```

**Преимущества mock:**
- Чистое окружение — только указанные BuildRequires
- Воспроизводимость — сборка как на сборочной ферме
- Безопасность — не загрязняет систему

## Настройка редактора

### Vim

Установите плагин для подсветки SPEC:

```bash
# Vim обычно уже поддерживает spec-файлы
vim ~/.vim/ftdetect/spec.vim
```

```vim
au BufRead,BufNewFile *.spec set filetype=spec
```

### VS Code

Установите расширение:
- **RPM Spec** — подсветка синтаксиса
- **RPM Spec Language** — автодополнение

## Проверка настройки

```bash
# Проверить, что rpmbuild работает
rpmbuild --version

# Проверить макросы
rpm --eval '%{_topdir}'
rpm --eval '%{packager}'

# Проверить структуру каталогов
ls ~/rpmbuild/
```

## Типичные проблемы при настройке

### «Command not found: rpmbuild»

```bash
sudo dnf install rpm-build
```

### «error: Bad owner/group»

Каталоги `~/rpmbuild` принадлежат другому пользователю:

```bash
sudo chown -R $USER:$USER ~/rpmbuild
```

### Mock: «You need to be in the mock group»

```bash
sudo usermod -aG mock $USER
# Перелогиньтесь
```

### Нет каталога ~/rpmbuild

```bash
rpmdev-setuptree
```

## Проверьте понимание

1. Какие три пакета составляют минимальный набор для сборки?
2. Что делает команда `rpmdev-setuptree`?
3. Как скачать исходники из SPEC-файла?
4. Зачем нужен файл `~/.rpmmacros`?
5. В чём преимущество сборки в mock?

---

**Далее:** [Структура ~/rpmbuild](@/community/beginner/03-build-environment/rpmbuild-tree.md)
