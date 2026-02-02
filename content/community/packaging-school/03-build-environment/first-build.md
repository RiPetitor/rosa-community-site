+++
title = "Первая сборка: GNU Hello"
weight = 3
description = "Пошаговая сборка простого пакета от скачивания исходников до установки."
+++

Соберём классический пакет GNU Hello — это идеальный учебный пример: простой, но содержит все типичные элементы.

## Шаг 1: Подготовка окружения

```bash
# Установить инструменты (если ещё не установлены)
sudo dnf install rpm-build rpmdevtools rpmlint gcc make

# Создать структуру каталогов
rpmdev-setuptree

# Проверить
ls ~/rpmbuild
# BUILD  RPMS  SOURCES  SPECS  SRPMS
```

## Шаг 2: Скачать исходники

```bash
cd ~/rpmbuild/SOURCES

# Скачать архив
curl -LO https://ftp.gnu.org/gnu/hello/hello-2.12.1.tar.gz

# Проверить
ls -la hello-2.12.1.tar.gz
# -rw-r--r-- 1 user user 1033297 ... hello-2.12.1.tar.gz

# Посмотреть содержимое
tar tzf hello-2.12.1.tar.gz | head -10
# hello-2.12.1/
# hello-2.12.1/COPYING
# hello-2.12.1/README
# ...
```

## Шаг 3: Создать SPEC-файл

```bash
cd ~/rpmbuild/SPECS
```

Создайте файл `hello.spec`:

```spec
Name:           hello
Version:        2.12.1
Release:        1%{?dist}
Summary:        The classic greeting program from GNU

License:        GPL-3.0-or-later
URL:            https://www.gnu.org/software/hello/
Source0:        https://ftp.gnu.org/gnu/hello/hello-%{version}.tar.gz

BuildRequires:  gcc
BuildRequires:  make
BuildRequires:  gettext

%description
The GNU Hello program produces a familiar, friendly greeting.
It allows non-programmers to use a classic computer science tool
which would otherwise be unavailable to them.

Seriously, though: this is an example package demonstrating
the GNU coding standards and RPM packaging for ROSA Linux.

%prep
%autosetup

%build
%configure
%make_build

%install
%make_install
%find_lang %{name}

%files -f %{name}.lang
%license COPYING
%doc README NEWS AUTHORS ChangeLog
%{_bindir}/hello
%{_mandir}/man1/hello.1*
%{_infodir}/hello.info*

%changelog
* Mon Feb 03 2025 Your Name <your@email.com> - 2.12.1-1
- Initial package for ROSA Linux
```

## Шаг 4: Проверить SPEC-файл

```bash
# Синтаксическая проверка
rpmlint hello.spec
```

Возможные предупреждения на этом этапе — это нормально, исправим после сборки.

## Шаг 5: Собрать пакет

```bash
# Собрать бинарный и исходный пакет
rpmbuild -ba hello.spec
```

**Ожидаемый вывод:**

```
Executing(%prep): /bin/sh -e /var/tmp/rpm-tmp.XXXXX
+ tar -xof /home/user/rpmbuild/SOURCES/hello-2.12.1.tar.gz
...
Executing(%build): /bin/sh -e /var/tmp/rpm-tmp.XXXXX
+ ./configure --prefix=/usr ...
...
Executing(%install): /bin/sh -e /var/tmp/rpm-tmp.XXXXX
+ make install DESTDIR=/home/user/rpmbuild/BUILDROOT/hello-2.12.1-1...
...
Wrote: /home/user/rpmbuild/SRPMS/hello-2.12.1-1.rosa13.1.src.rpm
Wrote: /home/user/rpmbuild/RPMS/x86_64/hello-2.12.1-1.rosa13.1.x86_64.rpm
```
Суффикс `.rosa13.1` зависит от `%{?dist}` и может отличаться на другой платформе.

## Шаг 6: Проверить результат

```bash
# Посмотреть созданные пакеты
ls -la ~/rpmbuild/RPMS/x86_64/hello-*
ls -la ~/rpmbuild/SRPMS/hello-*

# Информация о пакете
rpm -qip ~/rpmbuild/RPMS/x86_64/hello-2.12.1-1.*.x86_64.rpm

# Список файлов
rpm -qlp ~/rpmbuild/RPMS/x86_64/hello-2.12.1-1.*.x86_64.rpm

# Зависимости
rpm -qRp ~/rpmbuild/RPMS/x86_64/hello-2.12.1-1.*.x86_64.rpm
```

## Шаг 7: Проверить rpmlint

```bash
rpmlint ~/rpmbuild/RPMS/x86_64/hello-2.12.1-1.*.x86_64.rpm
```

Типичные предупреждения и их значение:

| Предупреждение | Значение | Действие |
|----------------|----------|----------|
| `spelling-error` | Орфографическая ошибка в описании | Исправить или игнорировать |
| `no-documentation` | Нет документации | Добавить `%doc` |
| `no-manual-page-for-binary` | Нет man-страницы | Добавить или создать |

## Шаг 8: Установить и проверить

```bash
# Установить
sudo dnf install ~/rpmbuild/RPMS/x86_64/hello-2.12.1-1.*.x86_64.rpm

# Проверить работу
hello
# Hello, world!

hello --version
# hello (GNU Hello) 2.12.1
# ...

# Проверить man-страницу
man hello

# Проверить, какому пакету принадлежит
rpm -qf /usr/bin/hello
# hello-2.12.1-1.rosa13.1.x86_64

# Удалить (если нужно)
sudo dnf remove hello
```

## Разбор SPEC-файла

### Преамбула

```spec
Name:           hello
Version:        2.12.1
Release:        1%{?dist}
```

- `Name` — имя пакета, совпадает с upstream
- `Version` — версия из релиза GNU
- `Release` — первая сборка, `%{?dist}` добавит `.rosa13.1`

### Источники и зависимости

```spec
Source0:        https://ftp.gnu.org/gnu/hello/hello-%{version}.tar.gz

BuildRequires:  gcc
BuildRequires:  make
BuildRequires:  gettext
```

- `Source0` — URL архива (можно скачать через `spectool`)
- `BuildRequires` — что нужно для сборки

### Секция %prep

```spec
%prep
%autosetup
```

`%autosetup` распаковывает `Source0` и применяет патчи (если есть).

### Секция %build

```spec
%build
%configure
%make_build
```

- `%configure` — запускает `./configure` с правильными путями
- `%make_build` — запускает `make` с параллельной сборкой

### Секция %install

```spec
%install
%make_install
%find_lang %{name}
```

- `%make_install` — `make install DESTDIR=%{buildroot}`
- `%find_lang` — находит файлы переводов

### Секция %files

```spec
%files -f %{name}.lang
%license COPYING
%doc README NEWS AUTHORS ChangeLog
%{_bindir}/hello
%{_mandir}/man1/hello.1*
%{_infodir}/hello.info*
```

- `-f %{name}.lang` — включить файл со списком переводов
- `%license` — файлы лицензии
- `%doc` — документация
- Макросы путей для бинарника и документации

## Отладка проблем

### Сборка падает на %build

```bash
# Посмотреть, что в BUILD
ls ~/rpmbuild/BUILD/

# Зайти и попробовать вручную
cd ~/rpmbuild/BUILD/hello-2.12.1
./configure
make
```

### Не хватает BuildRequires

```
configure: error: Package requirements (libfoo) were not met
```

Решение:
```bash
# Найти пакет
dnf provides 'pkgconfig(libfoo)'

# Добавить в SPEC
BuildRequires: pkgconfig(libfoo)
```

### Файлы не попали в пакет

```
Installed (but unpackaged) file(s) found:
   /usr/share/locale/ru/LC_MESSAGES/hello.mo
```

Решение: добавить `%find_lang %{name}` и `-f %{name}.lang` в `%files`.

## Альтернативные способы сборки

### Только SRPM

```bash
rpmbuild -bs hello.spec
# Создаст только SRPMS/hello-...src.rpm
```

### Только бинарный пакет

```bash
rpmbuild -bb hello.spec
# Создаст только RPMS/.../hello-...rpm
```

### Выполнить только определённые этапы

```bash
# Только %prep
rpmbuild -bp hello.spec

# До %build (включительно)
rpmbuild -bc hello.spec

# До %install (включительно)
rpmbuild -bi hello.spec
```

Полезно для отладки — можно остановиться на нужном этапе и проверить результат.

## Проверьте понимание

1. Какую команду использовать для скачивания Source из SPEC?
2. Что делает `%autosetup`?
3. Как собрать только SRPM без бинарного пакета?
4. Как установить собранный локально пакет?
5. Что означает `-f %{name}.lang` в секции `%files`?

---

**Далее:** [Что такое buildroot](buildroot.md)
