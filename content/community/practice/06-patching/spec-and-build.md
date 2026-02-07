+++
title = "SPEC-файл с патчем и сборка"
weight = 3
+++

## Шаг 6: Создание SPEC-файла с патчем

Создайте `~/rpmbuild/SPECS/htop.spec`:

```spec
Name:           htop
Version:        3.3.0
Release:        2%{?dist}
Summary:        Interactive process viewer

License:        GPL-2.0-or-later
URL:            https://htop.dev
Source0:        https://github.com/htop-dev/htop/archive/refs/tags/%{version}.tar.gz

# Патчи перечисляются после Source-тегов.
# Нумерация начинается с 0 (или 1 — главное, чтобы совпадала с Patch-тегами).
Patch0:         0001-Disable-Werror-for-distribution-builds.patch

BuildRequires:  gcc
BuildRequires:  make
BuildRequires:  autoconf
BuildRequires:  automake
BuildRequires:  libtool
BuildRequires:  ncurses-devel
BuildRequires:  libsensors-devel

%description
htop is an interactive text-mode process viewer for Unix systems.
It aims to be a better 'top'.

%prep
# %autosetup -p1 делает три вещи:
# 1. Распаковывает Source0 (tar xzf htop-3.3.0.tar.gz)
# 2. Переходит в каталог htop-3.3.0/
# 3. Применяет все Patch-теги с уровнем -p1
#
# После %autosetup мы находимся в ~/rpmbuild/BUILD/htop-3.3.0/
# и все патчи уже применены.
%autosetup -p1

# Перегенерируем Autotools-файлы, потому что мы правили configure.ac.
# autoreconf -fi пересоздаёт configure, Makefile.in и другие сгенерированные файлы.
# Флаги: -f = force (пересоздать даже если не изменились), -i = install (скопировать
# вспомогательные скрипты вроде install-sh, missing).
autoreconf -fi

%build
%configure \
    --enable-sensors \
    --enable-unicode
%make_build

%install
%make_install

%files
%license COPYING
%doc README AUTHORS ChangeLog
%{_bindir}/htop
%{_mandir}/man1/htop.1*
%{_datadir}/applications/htop.desktop
%{_datadir}/icons/hicolor/scalable/apps/htop.svg
%{_datadir}/pixmaps/htop.png

%changelog
* Sat Feb 08 2026 Your Name <your@email.com> - 3.3.0-2
- Disable -Werror to fix build with GCC 14

* Mon Jan 15 2026 Your Name <your@email.com> - 3.3.0-1
- Initial package for ROSA Linux
```

### Разбор ключевых моментов

#### Release: 2%{?dist}

Заметьте: `Release` стал `2`, а не `1`. При добавлении патча к существующей
версии пакета **всегда** увеличивайте Release. Версия остаётся `3.3.0`,
но сборка — вторая. Это говорит пользователям: «та же версия, но с исправлениями».

#### autoreconf -fi после патча configure.ac

Если вы правите `configure.ac` или `Makefile.am`, нужно пересоздать
сгенерированные файлы (`configure`, `Makefile.in`). Для этого:

```spec
BuildRequires: autoconf automake libtool

%prep
%autosetup -p1
autoreconf -fi
```

**Когда НЕ нужен autoreconf:** если вы патчите только `.c`, `.h` или другие
исходные файлы, не затрагивая систему сборки.

## Шаг 7: Сборка

```bash
cd ~/rpmbuild/SPECS
rpmbuild -ba htop.spec
```

**Ожидаемый успешный вывод (последние строки):**

```
Wrote: /home/user/rpmbuild/SRPMS/htop-3.3.0-2.rosa13.1.src.rpm
Wrote: /home/user/rpmbuild/RPMS/x86_64/htop-3.3.0-2.rosa13.1.x86_64.rpm
```

Если патч не применился, вы увидите ошибку на этапе `%prep` (см. раздел ошибок ниже).

## Шаг 8: Проверка

```bash
rpmlint ~/rpmbuild/RPMS/x86_64/htop-3.3.0-*.rpm

# Установка и тест
sudo dnf install ~/rpmbuild/RPMS/x86_64/htop-3.3.0-*.rpm
htop --version
# Ожидаемый вывод: htop 3.3.0

# Запустите htop, убедитесь что работает
htop
# (выход — клавиша q)

sudo dnf remove htop
```
