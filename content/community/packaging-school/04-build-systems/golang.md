+++
title = "Go modules"
weight = 6
description = "Упаковка Go-программ."
+++

**Go** — язык программирования от Google. Система модулей Go управляет зависимостями и версиями.

## Особенности упаковки Go

1. **Статическая линковка** — бинарник самодостаточен
2. **Go modules** — управление зависимостями
3. **Vendoring** — включение зависимостей в репозиторий
4. **Быстрая компиляция** (быстрее Rust)

## Признаки Go-проекта

- `go.mod` — описание модуля и зависимостей
- `go.sum` — контрольные суммы зависимостей
- `main.go` или `cmd/` — точки входа
- `vendor/` — vendor'ные зависимости (опционально)

## Подходы к упаковке

### 1. Vendoring (рекомендуется)

```bash
# В исходниках проекта
go mod vendor
```

### 2. Скачивание при сборке

Работает с `GOPROXY`, но не подходит для изолированной сборки.

## Полный пример SPEC

```spec
%global goipath         github.com/junegunn/fzf
%global forgeurl        https://github.com/junegunn/fzf
%global commit          abc123def
%global shortcommit     %(c=%{commit}; echo ${c:0:7})

Name:           fzf
Version:        0.46.0
Release:        1%{?dist}
Summary:        Command-line fuzzy finder

License:        MIT
URL:            %{forgeurl}
Source0:        %{forgeurl}/archive/v%{version}/%{name}-%{version}.tar.gz

BuildRequires:  golang >= 1.21
BuildRequires:  git

%description
fzf is a general-purpose command-line fuzzy finder.

%prep
%autosetup -n %{name}-%{version}

%build
export GOPATH=%{_builddir}/go
export GOCACHE=%{_builddir}/go-cache
export GOFLAGS="-mod=vendor"

go build -ldflags "-X main.version=%{version}" -o %{name}

%install
install -Dm 755 %{name} %{buildroot}%{_bindir}/%{name}

# Man-страница
install -Dm 644 man/man1/%{name}.1 %{buildroot}%{_mandir}/man1/%{name}.1

# Автодополнение
install -Dm 644 shell/completion.bash \
    %{buildroot}%{_datadir}/bash-completion/completions/%{name}
install -Dm 644 shell/completion.zsh \
    %{buildroot}%{_datadir}/zsh/site-functions/_%{name}
install -Dm 644 shell/completion.fish \
    %{buildroot}%{_datadir}/fish/vendor_completions.d/%{name}.fish

# Key bindings для bash/zsh
install -Dm 644 shell/key-bindings.bash \
    %{buildroot}%{_datadir}/%{name}/key-bindings.bash
install -Dm 644 shell/key-bindings.zsh \
    %{buildroot}%{_datadir}/%{name}/key-bindings.zsh
install -Dm 644 shell/key-bindings.fish \
    %{buildroot}%{_datadir}/%{name}/key-bindings.fish

%files
%license LICENSE
%doc README.md CHANGELOG.md
%{_bindir}/%{name}
%{_mandir}/man1/%{name}.1*
%{_datadir}/bash-completion/completions/%{name}
%{_datadir}/zsh/site-functions/_%{name}
%{_datadir}/fish/vendor_completions.d/%{name}.fish
%{_datadir}/%{name}/

%changelog
* Mon Feb 03 2025 Your Name <your@email.com> - 0.46.0-1
- Initial package
```

## Подготовка исходников с vendoring

### Шаг 1: Клонировать и vendor

```bash
git clone https://github.com/user/project
cd project
git checkout v1.0.0

# Создать vendor/
go mod vendor

# Архивировать
cd ..
tar czf project-1.0.0.tar.gz project/
```

### Шаг 2: Или скачать vendor отдельно

```bash
# Скачать и создать отдельный vendor-архив
go mod download
go mod vendor
tar cJf project-1.0.0-vendor.tar.xz vendor/
```

В SPEC:

```spec
Source0:        %{name}-%{version}.tar.gz
Source1:        %{name}-%{version}-vendor.tar.xz

%prep
%autosetup
tar xf %{SOURCE1}
```

## Переменные окружения Go

```spec
%build
# Каталог для скачанных модулей
export GOPATH=%{_builddir}/go

# Кеш сборки
export GOCACHE=%{_builddir}/go-cache

# Использовать vendor/
export GOFLAGS="-mod=vendor"

# Отключить скачивание
export GOPROXY=off

go build -o myapp ./cmd/myapp
```

## Флаги сборки

```spec
%build
export CGO_ENABLED=0
export GOFLAGS="-mod=vendor -trimpath"

go build \
    -ldflags "-s -w -X main.version=%{version}" \
    -o %{name} \
    ./cmd/%{name}
```

| Флаг | Назначение |
|------|------------|
| `-mod=vendor` | Использовать vendor/ |
| `-trimpath` | Удалить пути сборки из бинарника |
| `-ldflags "-s -w"` | Удалить отладочную информацию |
| `-ldflags "-X main.version=..."` | Встроить версию |

## CGO

По умолчанию Go использует **CGO** для некоторых функций. Для полностью статического бинарника:

```spec
%build
export CGO_ENABLED=0
go build -o myapp
```

Если нужен CGO:

```spec
BuildRequires:  gcc

%build
export CGO_ENABLED=1
export CGO_CFLAGS="%{optflags}"
go build -o myapp
```

## Проекты с несколькими бинарниками

```spec
%build
export GOFLAGS="-mod=vendor -trimpath"

for cmd in cmd/*; do
    name=$(basename $cmd)
    go build -o $name ./$cmd
done

%install
for cmd in cmd/*; do
    name=$(basename $cmd)
    install -Dm 755 $name %{buildroot}%{_bindir}/$name
done
```

## Макросы Go (Fedora)

В Fedora есть специальные макросы:

```spec
BuildRequires:  go-rpm-macros

%build
%gobuild -o %{gobuilddir}/bin/myapp ./cmd/myapp

%install
%goinstall
```

## Типичные проблемы

### «go: cannot find module»

Проверьте наличие vendor/ или настройку GOFLAGS:

```spec
export GOFLAGS="-mod=vendor"
```

### «cannot find package»

Зависимость отсутствует в vendor:

```bash
go mod tidy
go mod vendor
```

### «cgo: C compiler not found»

```spec
BuildRequires:  gcc

# Или отключить CGO
export CGO_ENABLED=0
```

### Бинарник требует GLIBC

Для полностью статического бинарника:

```spec
export CGO_ENABLED=0
export GOFLAGS="-mod=vendor"
go build -ldflags "-extldflags '-static'" -o myapp
```

## Тестирование

```spec
%check
export GOFLAGS="-mod=vendor"
go test -v ./...
```

Пропустить определённые тесты:

```spec
%check
go test -v ./... -skip TestNetwork
```

## Обновление версии

1. Скачать новые исходники
2. Обновить зависимости: `go mod tidy`
3. Пересоздать vendor: `go mod vendor`
4. Обновить SPEC
5. Пересобрать

## Проверьте понимание

1. Зачем нужен vendoring для Go-пакетов?
2. Что делает флаг `-mod=vendor`?
3. Как отключить CGO?
4. Как встроить версию в бинарник?
5. Как собрать проект с несколькими командами в `cmd/`?

---

**Следующий модуль:** [ABF и рабочий процесс](@/community/packaging-school/05-abf-workflow/_index.md)
