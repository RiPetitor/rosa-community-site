+++
title = "Практикум 6: Патчи и backport (htop)"
weight = 6
description = "Патчирование реального проекта и подключение патчей в SPEC."
template = "community.html"
+++

В этом практикуме разберём жизненный кейс: **пакет не собирается**, и нужно сделать патч.

## Сценарий

Предположим, в **htop** включён `-Werror`, и на новой версии компилятора сборка падает. Мы отключим `-Werror` патчем.

## Шаг 1: Скачать исходники

```bash
cd ~/rpmbuild/SOURCES

# Пример версии — обновите при необходимости
export VER=3.3.0

curl -L -o htop-${VER}.tar.gz \
  https://github.com/htop-dev/htop/archive/refs/tags/${VER}.tar.gz
```

## Шаг 2: Найти `-Werror` и воспроизвести проблему

```bash
tar xzf htop-${VER}.tar.gz
cd htop-${VER}

# Ищем -Werror в исходниках
grep -R -n "-Werror" .
```

Если `-Werror` есть, удаляем его в найденном файле (обычно `configure.ac` или `Makefile.am`).

```bash
sed -i 's/-Werror//g' configure.ac
```

Если `-Werror` не найден, выберите другой небольшой фикс (например, исправление пути по умолчанию в конфиге)
и сделайте патч по тому же сценарию.

Если вы правите `configure.ac` или `Makefile.am`, пересоздайте скрипты:

```bash
autoreconf -fi
```

## Шаг 3: Создать патч

```bash
git init
git add .
git commit -m "Import htop ${VER}"

# Удаляем -Werror и фиксируем
sed -i 's/-Werror//g' configure.ac
autoreconf -fi

git add configure.ac configure Makefile.in

git commit -m "Disable -Werror for ROSA"
git format-patch -1 --stdout > htop-disable-werror.patch
```

Переместите патч в `~/rpmbuild/SOURCES`.

## Шаг 4: Подключить патч в SPEC

```spec
Patch0:        htop-disable-werror.patch

BuildRequires: autoconf
BuildRequires: automake
BuildRequires: libtool

%prep
%autosetup -p1
autoreconf -fi
```

Увеличьте `Release` и добавьте запись в `%changelog` (удобно через `rpmdev-bumpspec`).

## Шаг 5: Сборка и проверка

```bash
rpmbuild -ba htop.spec
rpmlint ~/rpmbuild/RPMS/x86_64/htop-*.rpm
```

## Backport из upstream

Если фикс уже есть в upstream:

```bash
git cherry-pick <commit>
git format-patch -1 --stdout > htop-backport.patch
```

Патч прикладывается аналогично через `Patch0` и `%autosetup`.

---

**Конец практикумов:** возвращайтесь к теории и улучшайте пакеты.
