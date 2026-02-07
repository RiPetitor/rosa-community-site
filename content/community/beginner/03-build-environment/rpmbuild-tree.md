+++
title = "Структура ~/rpmbuild"
weight = 2
description = "Каталоги BUILD, RPMS, SOURCES, SPECS, SRPMS и их назначение."
+++

Сборка RPM происходит в стандартной структуре каталогов. Понимание назначения каждого каталога важно для эффективной работы.

## Общая структура

```
~/rpmbuild/
├── BUILD/          # Распакованные исходники, здесь происходит компиляция
├── BUILDROOT/      # Временный корень ФС для установки
├── RPMS/           # Готовые бинарные пакеты
│   ├── x86_64/
│   ├── noarch/
│   └── ...
├── SOURCES/        # Архивы исходников, патчи, дополнительные файлы
├── SPECS/          # SPEC-файлы
└── SRPMS/          # Исходные пакеты (SRPM)
```

## Каталоги подробно

### SOURCES — исходные материалы

Здесь хранятся:
- Архивы с исходным кодом (`*.tar.gz`, `*.tar.xz`, `*.zip`)
- Патчи (`*.patch`)
- Дополнительные файлы (конфиги, unit-файлы, скрипты)

```bash
ls ~/rpmbuild/SOURCES/
# hello-2.12.1.tar.gz
# hello-fix-typo.patch
# hello.service
```

**Наполнение:**
```bash
# Вручную
cp hello-2.12.1.tar.gz ~/rpmbuild/SOURCES/

# Через spectool
spectool -g -C ~/rpmbuild/SOURCES/ hello.spec

# Скачать напрямую
cd ~/rpmbuild/SOURCES/
curl -LO https://ftp.gnu.org/gnu/hello/hello-2.12.1.tar.gz
```

### SPECS — рецепты пакетов

SPEC-файлы с инструкциями по сборке:

```bash
ls ~/rpmbuild/SPECS/
# hello.spec
# htop.spec
```

### BUILD — рабочая область

Сюда распаковываются исходники, здесь происходит компиляция:

```bash
ls ~/rpmbuild/BUILD/
# hello-2.12.1/        # Распакованные исходники после %prep
```

После `%prep`:
```
BUILD/
└── hello-2.12.1/
    ├── configure
    ├── Makefile.in
    ├── src/
    │   └── hello.c
    └── ...
```

После `%build`:
```
BUILD/
└── hello-2.12.1/
    ├── Makefile       # Сгенерирован configure
    ├── src/
    │   ├── hello.c
    │   └── hello.o    # Скомпилированный объектный файл
    └── hello          # Готовый бинарник
```

### BUILDROOT — виртуальный корень

Временная файловая система, куда устанавливаются файлы в `%install`:

```bash
ls ~/rpmbuild/BUILDROOT/
# hello-2.12.1-1.rosa13.1.x86_64/
```

Структура внутри:
```
BUILDROOT/hello-2.12.1-1.rosa13.1.x86_64/
├── usr/
│   ├── bin/
│   │   └── hello
│   └── share/
│       ├── man/
│       │   └── man1/
│       │       └── hello.1.gz
│       └── info/
│           └── hello.info.gz
└── ...
```

Это «фейковый корень» — файлы устанавливаются сюда, а не в реальную систему.

### RPMS — готовые пакеты

Результат сборки — бинарные RPM-пакеты:

```bash
ls ~/rpmbuild/RPMS/x86_64/
# hello-2.12.1-1.rosa13.1.x86_64.rpm

ls ~/rpmbuild/RPMS/noarch/
# python3-mylib-1.0-1.rosa13.1.noarch.rpm
```

Структура по архитектурам:
```
RPMS/
├── x86_64/         # 64-битные пакеты
├── i686/           # 32-битные пакеты
├── aarch64/        # ARM 64-bit
└── noarch/         # Архитектурно-независимые
```

### SRPMS — исходные пакеты

Source RPM содержит SPEC + исходники:

```bash
ls ~/rpmbuild/SRPMS/
# hello-2.12.1-1.rosa13.1.src.rpm
```

SRPM можно:
- Пересобрать на другой системе
- Отправить на сборочную ферму
- Распаковать и изучить

```bash
# Установить SRPM (распакует в SOURCES и SPECS)
rpm -ivh hello-2.12.1-1.src.rpm

# Или извлечь без установки
rpm2cpio hello-2.12.1-1.src.rpm | cpio -idmv
```

## Процесс сборки по каталогам

```
                    SPECS/hello.spec
                           │
                           ▼
    SOURCES/hello-2.12.1.tar.gz ───► BUILD/hello-2.12.1/
    SOURCES/fix.patch                      │
                                          │ %prep: распаковка, патчи
                                          │ %build: компиляция
                                          │ %install: установка
                                          ▼
                              BUILDROOT/.../usr/bin/hello
                                          │
                                          │ упаковка
                                          ▼
                    ┌─────────────────────┴─────────────────────┐
                    ▼                                           ▼
    RPMS/x86_64/hello-2.12.1-1.x86_64.rpm    SRPMS/hello-2.12.1-1.src.rpm
```

## Изменение расположения

По умолчанию `~/rpmbuild`, но можно изменить:

### Через ~/.rpmmacros

```
%_topdir /home/user/my-packages
```

### Через переменную окружения

```bash
rpmbuild --define "_topdir /tmp/build" -ba package.spec
```

### Через командную строку

```bash
rpmbuild -D "_topdir $PWD/rpmbuild" -ba package.spec
```

## Очистка

### Удалить BUILD и BUILDROOT после сборки

По умолчанию rpmbuild очищает их. Чтобы сохранить для отладки:

```bash
rpmbuild -ba --noclean package.spec
```

Или в `~/.rpmmacros`:
```
%_auto_clean 0
```

### Ручная очистка

```bash
# Очистить всё
rm -rf ~/rpmbuild/BUILD/* ~/rpmbuild/BUILDROOT/*

# Очистить конкретный пакет
rm -rf ~/rpmbuild/BUILD/hello-*
rm -rf ~/rpmbuild/BUILDROOT/hello-*
```

## Права доступа

Сборка должна выполняться от **обычного пользователя**, не от root:

```bash
# Проверить владельца
ls -la ~/rpmbuild

# Исправить, если нужно
sudo chown -R $USER:$USER ~/rpmbuild
```

<div class="warning">
  <div class="title">Важно</div>
  Никогда не собирайте пакеты от root. Ошибка в <code>%install</code> может повредить систему.
</div>

## Работа с несколькими проектами

Для изоляции проектов можно использовать разные `_topdir`:

```bash
# Проект 1
mkdir -p ~/projects/hello/rpmbuild/{BUILD,RPMS,SOURCES,SPECS,SRPMS}
rpmbuild -D "_topdir $HOME/projects/hello/rpmbuild" -ba hello.spec

# Проект 2
mkdir -p ~/projects/htop/rpmbuild/{BUILD,RPMS,SOURCES,SPECS,SRPMS}
rpmbuild -D "_topdir $HOME/projects/htop/rpmbuild" -ba htop.spec
```

## Проверьте понимание

1. В каком каталоге хранятся архивы исходников?
2. Где происходит компиляция?
3. Что такое BUILDROOT и зачем он нужен?
4. Куда попадают готовые RPM-пакеты?
5. Как изменить расположение `_topdir`?

---

**Далее:** [Первая сборка: GNU Hello](@/community/beginner/03-build-environment/first-build.md)
