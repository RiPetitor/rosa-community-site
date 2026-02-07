+++
title = "SPEC-файл и сборка"
weight = 2
+++

## Создание SPEC-файла

Создайте `~/rpmbuild/SPECS/lazygit.spec`:

```spec
%global goipath     github.com/jesseduffield/lazygit
%global gomajor     0

Name:           lazygit
Version:        0.44.1
Release:        1%{?dist}
Summary:        Simple terminal UI for Git commands

License:        MIT
URL:            https://%{goipath}
Source0:        https://%{goipath}/archive/refs/tags/v%{version}.tar.gz#/%{name}-%{version}.tar.gz
Source1:        %{name}-%{version}-vendor.tar.xz

# Go требует архитектурно-зависимой сборки
ExclusiveArch:  %{go_arches}

BuildRequires:  golang >= 1.21
BuildRequires:  git

%description
Lazygit is a simple terminal UI for git commands, written in Go.
It provides an interactive interface for staging, committing,
branching, merging, rebasing and more.

%prep
%autosetup -n %{name}-%{version}

# Распаковать вендоренные зависимости
tar -xf %{SOURCE1}

%build
# Отключить доступ к сети для воспроизводимости
export GOFLAGS="-mod=vendor"
export GOPROXY=off
export GOPATH=%{_builddir}/gopath
export CGO_ENABLED=0

# Дата сборки для воспроизводимости (фиксированная)
BUILD_DATE=$(date -u -d @${SOURCE_DATE_EPOCH:-$(date +%%s)} +%%Y-%%m-%%dT%%H:%%M:%%SZ)

go build -o lazygit \
    -ldflags "-s -w \
        -X main.version=%{version} \
        -X main.date=${BUILD_DATE} \
        -X main.buildSource=rpm" \
    .

%install
# Бинарник
install -Dm0755 lazygit %{buildroot}%{_bindir}/lazygit

# Shell-completions (если lazygit умеет их генерировать)
# lazygit поддерживает генерацию completions через свою команду
# Некоторые версии не имеют встроенной генерации — проверяйте
# ./lazygit completion bash > lazygit.bash 2>/dev/null && \
#     install -Dm0644 lazygit.bash \
#     %{buildroot}%{_datadir}/bash-completion/completions/lazygit || :

%check
# Проверить, что бинарник работает
./lazygit --version

%files
%license LICENSE
%doc README.md docs/
%{_bindir}/lazygit

%changelog
* Sat Feb 08 2026 Your Name <your@email.com> - 0.44.1-1
- Initial package for ROSA Linux
```

### Разбор ключевых моментов SPEC-файла

#### GOFLAGS и GOPROXY

```spec
export GOFLAGS="-mod=vendor"
export GOPROXY=off
```

- `GOFLAGS="-mod=vendor"` -- говорит Go: «Используй зависимости из директории `vendor/`,
  а не из кэша модулей или из сети». Без этого флага Go проигнорирует vendor/ и попытается
  скачать модули из интернета.
- `GOPROXY=off` -- полностью запрещает обращение к прокси-серверам модулей. Это гарантирует
  воспроизводимость: если чего-то не хватает в vendor/, сборка упадёт с ошибкой, а не тихо
  скачает другую версию.

#### CGO_ENABLED=0

```spec
export CGO_ENABLED=0
```

Это говорит Go: «Не используй C-библиотеки, собери полностью статический бинарник».
Для lazygit это безопасно -- он не использует cgo. Если бы проекту нужен был cgo
(например, для SQLite), пришлось бы поставить `CGO_ENABLED=1` и добавить `BuildRequires: gcc`.

#### Флаги линковки (-ldflags)

```spec
go build -ldflags "-s -w -X main.version=%{version} ..."
```

| Флаг | Что делает |
|------|-----------|
| `-s` | Убирает таблицу символов (symbol table) -- уменьшает размер |
| `-w` | Убирает отладочную информацию DWARF -- ещё уменьшает размер |
| `-X main.version=%{version}` | Устанавливает значение Go-переменной `version` в пакете `main` |

Без `-s -w` бинарник lazygit ~30 МБ, с ними ~20 МБ. Разница существенная.

#### ExclusiveArch

```spec
ExclusiveArch:  %{go_arches}
```

Хотя Go-бинарник не зависит от `.so`-файлов, он скомпилирован под конкретную архитектуру
процессора. Поэтому Go-пакеты **не** бывают `noarch`. Макрос `%{go_arches}` раскрывается
в список поддерживаемых архитектур (обычно x86_64, aarch64, и т.д.).

Если макрос `%{go_arches}` не определён в вашей системе, замените на явный список:

```spec
ExclusiveArch:  x86_64 aarch64
```

## Сборка пакета

```bash
cd ~/rpmbuild/SPECS
rpmbuild -ba lazygit.spec
```

**Ожидаемый вывод (в конце):**

```
Wrote: /home/user/rpmbuild/SRPMS/lazygit-0.44.1-1.rosa13.1.src.rpm
Wrote: /home/user/rpmbuild/RPMS/x86_64/lazygit-0.44.1-1.rosa13.1.x86_64.rpm
```

Обратите внимание: в отличие от C/C++ проектов, здесь только один RPM (не считая src.rpm).
Go-приложения обычно не создают подпакетов -- нет библиотек, нет заголовков.

Сборка может занять несколько минут. Go компилирует все зависимости из vendor/ с нуля.

## Проверка результатов

### Проверка бинарника

```bash
# Тип файла
file ~/rpmbuild/BUILD/lazygit-0.44.1/lazygit
```

Ожидаемый вывод:

```
lazygit: ELF 64-bit LSB executable, x86-64, version 1 (SYSV), statically linked, ...
```

Ключевое слово -- **statically linked**. Это значит, что бинарник самодостаточен
и не зависит от внешних `.so`-файлов. Именно поэтому Go-пакетам не нужен ldconfig.

### Проверка версии

```bash
sudo dnf install ~/rpmbuild/RPMS/x86_64/lazygit-*.rpm
lazygit --version
```

Ожидаемый вывод:

```
version=0.44.1, build date=2026-02-08T12:00:00Z, build source=rpm, ...
```

Если вместо этого вы видите:

```
version=unversioned, ...
```

Значит, `-ldflags -X` не сработали. Проверьте точный путь к переменной версии в исходниках
(может быть `main.version` или другой путь).

### rpmlint

```bash
rpmlint ~/rpmbuild/RPMS/x86_64/lazygit-*.rpm
```

Вы, вероятно, увидите предупреждение о размере бинарника:

```
lazygit.x86_64: W: file-size-too-large /usr/bin/lazygit 21000000
```

Это нормально для Go-приложений. Статическая линковка включает весь runtime в один файл.

### Проверка содержимого пакета

```bash
rpm -qpl ~/rpmbuild/RPMS/x86_64/lazygit-*.rpm
```

Ожидаемый вывод:

```
/usr/bin/lazygit
/usr/share/doc/lazygit/README.md
/usr/share/doc/lazygit/docs/...
/usr/share/licenses/lazygit/LICENSE
```

Всё просто: один бинарник + документация + лицензия.
