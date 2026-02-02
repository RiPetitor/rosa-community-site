+++
title = "Практикум 2: Rust CLI-утилита (ripgrep)"
weight = 2
description = "Упаковка ripgrep (rg): Rust CLI с vendoring зависимостей."
template = "community.html"
+++

В этом практикуме упакуем **ripgrep (rg)** — быстрый поиск по файлам на Rust.

## Что вы узнаете

- Как подготовить vendoring зависимостей Cargo
- Как собрать Rust-проект офлайн (важно для ABF)
- Как описать опциональные фичи через bcond

## О проекте

**ripgrep** — популярная утилита для поиска по файлам с поддержкой регулярных выражений.

## Шаг 1: Подготовка окружения

```bash
sudo dnf install rpm-build rpmdevtools rust cargo git
# Если хотите включить поддержку PCRE2, добавьте:
# sudo dnf install pkgconfig pcre2-devel
rpmdev-setuptree
```

## Шаг 2: Скачивание исходников

```bash
cd ~/rpmbuild/SOURCES

# Пример версии — обновите под актуальный релиз upstream
export VER=13.0.0

curl -L -o ripgrep-${VER}.tar.gz \
  https://github.com/BurntSushi/ripgrep/archive/refs/tags/${VER}.tar.gz
```

Если upstream использует теги с префиксом `v`, замените `${VER}` на `v${VER}`.

## Шаг 3: Vendoring зависимостей

```bash
tar xzf ripgrep-${VER}.tar.gz
cd ripgrep-${VER}

# Вендорим зависимости (без сети при сборке)
cargo vendor --locked vendor

# Архивируем vendor
mkdir -p ~/rpmbuild/SOURCES
tar -cJf ~/rpmbuild/SOURCES/ripgrep-${VER}-vendor.tar.xz vendor
```

## Шаг 4: Создание SPEC-файла

Создайте `~/rpmbuild/SPECS/ripgrep.spec`:

```spec
%bcond_with pcre2

Name:           ripgrep
Version:        13.0.0
Release:        1%{?dist}
Summary:        Recursively searches directories for a regex pattern

License:        MIT OR Unlicense
URL:            https://github.com/BurntSushi/ripgrep
Source0:        https://github.com/BurntSushi/ripgrep/archive/refs/tags/%{version}.tar.gz
Source1:        %{name}-%{version}-vendor.tar.xz

BuildRequires:  rust
BuildRequires:  cargo
BuildRequires:  git
%if %{with pcre2}
BuildRequires:  pkgconfig(libpcre2-8)
%endif

%description
ripgrep is a fast line-oriented search tool that recursively searches
your current directory for a regex pattern.

%prep
%autosetup -n %{name}-%{version}
tar -xf %{SOURCE1}

mkdir -p .cargo
cat > .cargo/config.toml <<'EOF'
[source.crates-io]
replace-with = "vendored-sources"

[source.vendored-sources]
directory = "vendor"
EOF

%build
%if %{with pcre2}
cargo build --release --frozen --features pcre2
%else
cargo build --release --frozen
%endif

%install
install -Dm0755 target/release/rg %{buildroot}%{_bindir}/rg

%files
%license LICENSE-MIT UNLICENSE
%doc README.md FAQ.md
%{_bindir}/rg

%changelog
* Mon Feb 02 2026 Your Name <your@email.com> - 13.0.0-1
- Initial package for ROSA Linux
```

Проверьте имена файлов лицензии/документации в исходниках и при необходимости поправьте `%license` и `%doc`.

## Шаг 5: Сборка

```bash
cd ~/rpmbuild/SPECS
rpmbuild -ba ripgrep.spec
```

Сборка с поддержкой PCRE2:

```bash
rpmbuild -ba ripgrep.spec --with pcre2
```

## Шаг 6: Проверка

```bash
rpmlint ~/rpmbuild/RPMS/x86_64/ripgrep-*.rpm

sudo dnf install ~/rpmbuild/RPMS/x86_64/ripgrep-*.rpm
rg --version
rg "root" /etc/passwd
```

## Типичные проблемы

- **Сборка лезет в сеть** — проверьте `.cargo/config.toml` и наличие `vendor/`
- **Нужна PCRE2** — соберите с `--with pcre2` и добавьте `pkgconfig(libpcre2-8)`
- **Нет бинарника** — убедитесь, что `target/release/rg` существует

---

**Следующий практикум:** [Python-приложение (httpie)](../03-python-app/_index.md)
