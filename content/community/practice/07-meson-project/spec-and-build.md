+++
title = "SPEC-файл и сборка"
weight = 1
+++

## Подготовка окружения

```bash
sudo dnf install rpm-build rpmdevtools rpmlint \
    meson ninja-build gcc gcc-c++ \
    pkgconfig systemd-devel dbus-devel \
    pkgconfig(libsystemd) pkgconfig(dbus-1) \
    inih-devel

rpmdev-setuptree
```

**Что здесь устанавливается и зачем:**

- `meson`, `ninja-build` — система сборки и её бэкенд
- `systemd-devel` — заголовки и pkg-config для sd-bus (D-Bus-клиент в составе systemd)
- `dbus-devel` — заголовки D-Bus (gamemode может использовать и libdbus, и sd-bus)
- `inih-devel` — библиотека для парсинга INI-файлов (gamemode читает конфиг из `~/.config/gamemode.ini`)

> **Почему ninja-build, а не просто ninja?** В ROSA и Fedora-подобных дистрибутивах пакет называется
> `ninja-build`, а бинарник — `ninja-build` или `ninja`. Meson находит его автоматически.

## Скачивание исходников

```bash
cd ~/rpmbuild/SOURCES

# Укажите актуальную версию
export VER=1.8.2

curl -L -o gamemode-${VER}.tar.gz \
  https://github.com/FeralInteractive/gamemode/archive/refs/tags/${VER}.tar.gz
```

Проверьте, что архив скачался корректно:

```bash
tar tzf gamemode-${VER}.tar.gz | head -10
```

Ожидаемый вывод:

```
gamemode-1.8.2/
gamemode-1.8.2/.github/
gamemode-1.8.2/.github/workflows/
gamemode-1.8.2/LICENSE.txt
gamemode-1.8.2/README.md
gamemode-1.8.2/meson.build
...
```

Обратите внимание: корневая директория в архиве — `gamemode-1.8.2`. Это важно для `%autosetup`.

## Изучение опций сборки Meson

Прежде чем писать SPEC, нужно понять, какие опции предлагает проект. В Meson опции описываются
в файле `meson_options.txt` (старый стиль) или `meson.options` (новый стиль, Meson >= 1.1).

```bash
tar xzf gamemode-${VER}.tar.gz
cat gamemode-${VER}/meson_options.txt 2>/dev/null || cat gamemode-${VER}/meson.options 2>/dev/null
```

Вы увидите что-то вроде:

```
option('with-sd-bus-provider', type: 'combo', choices: ['systemd', 'elogind', 'no-daemon'], value: 'systemd')
option('with-pam-group', type: 'string', value: 'gamemode')
option('with-systemd-user-unit-dir', type: 'string', value: '')
option('with-dbus-service-dir', type: 'string', value: '')
option('with-examples', type: 'boolean', value: true)
```

Также можно посмотреть все опции интерактивно (после конфигурации):

```bash
cd gamemode-${VER}
meson setup builddir
meson configure builddir
```

Эта команда покажет и встроенные опции Meson (prefix, libdir...), и пользовательские опции проекта.

**Ключевые опции для RPM:**

| Опция | Зачем | Значение для RPM |
|-------|-------|------------------|
| `with-sd-bus-provider` | Какой D-Bus-транспорт использовать | `systemd` (ROSA использует systemd) |
| `with-examples` | Собирать ли примеры | `false` (не нужны в пакете) |

## Создание SPEC-файла

Создайте `~/rpmbuild/SPECS/gamemode.spec`:

```spec
Name:           gamemode
Version:        1.8.2
Release:        1%{?dist}
Summary:        Daemon for optimizing Linux system performance for games

License:        BSD-3-Clause
URL:            https://github.com/FeralInteractive/gamemode
Source0:        %{url}/archive/refs/tags/%{version}.tar.gz#/%{name}-%{version}.tar.gz

BuildRequires:  meson >= 0.53.0
BuildRequires:  ninja-build
BuildRequires:  gcc
BuildRequires:  gcc-c++
BuildRequires:  pkgconfig(systemd)
BuildRequires:  pkgconfig(libsystemd)
BuildRequires:  pkgconfig(dbus-1)
BuildRequires:  pkgconfig(inih)
BuildRequires:  systemd-rpm-macros

# Демон и CLI-инструменты
Requires:       %{name}-libs%{?_isa} = %{version}-%{release}
Requires:       systemd

%description
GameMode is a daemon/lib combo for Linux that allows games to request a set
of optimisations be temporarily applied to the host OS and/or a game process.
It was designed primarily as a stop-gap solution to problems with the gaming
experience on Linux.

# ---------------------------------------------------------------------------
# Подпакет -libs: разделяемые библиотеки для приложений
# ---------------------------------------------------------------------------
%package libs
Summary:        Shared libraries for gamemode
# ldconfig нужен для обновления кэша динамического линковщика

%description libs
Shared libraries for gamemode. Applications that use gamemode link against
libgamemode.so and libgamemodeauto.so from this package.

# ---------------------------------------------------------------------------
# Подпакет -devel: заголовки, .so-симлинки, pkgconfig
# ---------------------------------------------------------------------------
%package devel
Summary:        Development files for gamemode
Requires:       %{name}-libs%{?_isa} = %{version}-%{release}

%description devel
Header files and pkg-config file for developing applications that use gamemode.

# ---------------------------------------------------------------------------
# Сборка
# ---------------------------------------------------------------------------
%prep
%autosetup -n %{name}-%{version}

%build
%meson \
    -Dwith-sd-bus-provider=systemd \
    -Dwith-examples=false
%meson_build

%install
%meson_install

# ---------------------------------------------------------------------------
# Скриптлеты systemd
# ---------------------------------------------------------------------------
%post
%systemd_user_post gamemoded.service

%preun
%systemd_user_preun gamemoded.service

%postun
%systemd_user_postun_with_restart gamemoded.service

# ---------------------------------------------------------------------------
# ldconfig для разделяемых библиотек
# ---------------------------------------------------------------------------
%post libs -p /sbin/ldconfig
%postun libs -p /sbin/ldconfig

# ---------------------------------------------------------------------------
# Секции %files
# ---------------------------------------------------------------------------
%files
%license LICENSE.txt
%doc README.md
%{_bindir}/gamemoded
%{_bindir}/gamemoderun
%{_bindir}/gamemode-simulate-game
%{_libexecdir}/cpugovctl
%{_libexecdir}/gpuclockctl
%{_libexecdir}/procsysctl
# Пользовательский юнит systemd
%{_userunitdir}/gamemoded.service
# D-Bus
%{_datadir}/dbus-1/services/com.feralinteractive.GameMode.service
%{_sysconfdir}/dbus-1/system.d/com.feralinteractive.GameMode.conf
# Polkit (если есть)
%{_datadir}/polkit-1/actions/com.feralinteractive.GameMode.policy
# Метаинформация
%{_datadir}/metainfo/io.github.feralinteractive.gamemode.metainfo.xml

%files libs
%license LICENSE.txt
%{_libdir}/libgamemode.so.*
%{_libdir}/libgamemodeauto.so.*

%files devel
%{_includedir}/gamemode_client.h
%{_libdir}/libgamemode.so
%{_libdir}/libgamemodeauto.so
%{_libdir}/pkgconfig/gamemode.pc
%{_libdir}/pkgconfig/gamemodeauto.pc
%{_libdir}/pkgconfig/libgamemodeauto.pc

%changelog
* Sat Feb 08 2026 Your Name <your@email.com> - 1.8.2-1
- Initial package for ROSA Linux
```

### Разбор: какой файл в какой подпакет и почему

Это критически важная часть. Разложим все установленные файлы по подпакетам:

| Путь | Подпакет | Почему |
|------|----------|--------|
| `/usr/bin/gamemoded` | **gamemode** | Демон — основной компонент |
| `/usr/bin/gamemoderun` | **gamemode** | CLI для запуска игр |
| `/usr/bin/gamemode-simulate-game` | **gamemode** | Утилита для тестирования |
| `/usr/libexec/cpugovctl` | **gamemode** | Вспомогательная утилита демона |
| `/usr/libexec/gpuclockctl` | **gamemode** | Вспомогательная утилита демона |
| `/usr/libexec/procsysctl` | **gamemode** | Вспомогательная утилита демона |
| `/usr/lib/systemd/user/gamemoded.service` | **gamemode** | Юнит-файл пользовательского сервиса |
| `/usr/share/dbus-1/services/...` | **gamemode** | D-Bus-описание сервиса |
| `/etc/dbus-1/system.d/...` | **gamemode** | D-Bus-политика доступа |
| `/usr/share/polkit-1/actions/...` | **gamemode** | Polkit-политика для привилегий |
| `/usr/lib64/libgamemode.so.0` | **gamemode-libs** | Runtime-библиотека (версионированная) |
| `/usr/lib64/libgamemode.so.0.0.0` | **gamemode-libs** | Runtime-библиотека (полная версия) |
| `/usr/lib64/libgamemodeauto.so.0` | **gamemode-libs** | Runtime-библиотека (LD_PRELOAD) |
| `/usr/lib64/libgamemode.so` | **gamemode-devel** | Симлинк для линковки при сборке |
| `/usr/lib64/libgamemodeauto.so` | **gamemode-devel** | Симлинк для линковки при сборке |
| `/usr/include/gamemode_client.h` | **gamemode-devel** | Заголовочный файл |
| `/usr/lib64/pkgconfig/gamemode.pc` | **gamemode-devel** | Файл pkg-config |

**Почему выделяется -libs?** Потому что другие приложения (например, игры) могут зависеть
от `libgamemode.so.0`, не устанавливая демон. Это стандартная практика: runtime-библиотеки
в отдельном пакете, чтобы не тянуть лишние зависимости.

**Почему .so (без версии) в -devel?** Файл `libgamemode.so` — это симлинк на `libgamemode.so.0`.
Он нужен только на этапе компиляции, когда компилятор ищет `-lgamemode`. Обычные пользователи
его не используют, поэтому он уходит в `-devel`.

## Сборка пакета

```bash
cd ~/rpmbuild/SPECS
rpmbuild -ba gamemode.spec
```

**Ожидаемый вывод (в конце):**

```
Wrote: /home/user/rpmbuild/SRPMS/gamemode-1.8.2-1.rosa13.1.src.rpm
Wrote: /home/user/rpmbuild/RPMS/x86_64/gamemode-1.8.2-1.rosa13.1.x86_64.rpm
Wrote: /home/user/rpmbuild/RPMS/x86_64/gamemode-libs-1.8.2-1.rosa13.1.x86_64.rpm
Wrote: /home/user/rpmbuild/RPMS/x86_64/gamemode-devel-1.8.2-1.rosa13.1.x86_64.rpm
```

Если вы видите три RPM-файла (основной, -libs, -devel) — всё правильно.
