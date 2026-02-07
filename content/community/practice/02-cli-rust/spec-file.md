+++
title = "Создание SPEC-файла"
weight = 2
+++

Создайте `~/rpmbuild/SPECS/ripgrep.spec`:

```spec
# ============================================================
# Условная сборка: поддержка PCRE2
# ============================================================
# %bcond_with означает "по умолчанию ВЫКЛЮЧЕНО".
# Чтобы включить: rpmbuild -ba ripgrep.spec --with pcre2
# Если хотите включить по умолчанию, замените на %bcond_without pcre2
%bcond_with pcre2

Name:           ripgrep
Version:        14.1.1
Release:        1%{?dist}
Summary:        Recursively searches directories for a regex pattern

License:        MIT OR Unlicense
URL:            https://github.com/BurntSushi/ripgrep

# Source0 — основные исходники с GitHub.
# rpmbuild не скачивает по URL, но он нужен для документации и spectool.
Source0:        https://github.com/BurntSushi/ripgrep/archive/refs/tags/%{version}.tar.gz

# Source1 — вендоренные зависимости Cargo.
# Это наш второй «ингредиент», без которого офлайн-сборка невозможна.
Source1:        %{name}-%{version}-vendor.tar.xz

BuildRequires:  rust
BuildRequires:  cargo

# PCRE2 нужна, только если собираем с --with pcre2.
# %if ... %endif — условная секция.
%if %{with pcre2}
BuildRequires:  pkgconfig(libpcre2-8)
%endif

%description
ripgrep is a fast line-oriented search tool that recursively searches
your current directory for a regex pattern. By default, ripgrep respects
gitignore rules and skips hidden files/directories and binary files.

# ============================================================
# %prep — распаковка и настройка
# ============================================================
%prep
# Распаковываем Source0 (основные исходники).
# Каталог после распаковки: ~/rpmbuild/BUILD/ripgrep-14.1.1/
%autosetup -n %{name}-%{version}

# Распаковываем Source1 (vendor). %{SOURCE1} — макрос, указывающий
# на полный путь к файлу Source1 в ~/rpmbuild/SOURCES/.
# После этого внутри каталога с исходниками появляется vendor/
tar -xf %{SOURCE1}

# Создаем конфигурацию Cargo для офлайн-сборки.
# Этот файл говорит Cargo: "Не ходи в crates.io, бери все из vendor/"
mkdir -p .cargo
cat > .cargo/config.toml <<'EOF'
[source.crates-io]
replace-with = "vendored-sources"

[source.vendored-sources]
directory = "vendor"
EOF

# После %prep структура каталога выглядит так:
#
# ~/rpmbuild/BUILD/ripgrep-14.1.1/
# ├── .cargo/
# │   └── config.toml      ← перенаправление на vendor
# ├── Cargo.lock
# ├── Cargo.toml
# ├── crates/               ← исходный код ripgrep
# ├── vendor/               ← все зависимости
# │   ├── aho-corasick/
# │   ├── anyhow/
# │   └── ...
# └── ...

# ============================================================
# %build — компиляция
# ============================================================
%build
# --release — оптимизированная сборка (без debug-символов, с оптимизациями).
#             Без этого флага Cargo собирает debug-версию (медленную и большую).
#
# --frozen — КРИТИЧЕСКИ ВАЖНЫЙ флаг. Он запрещает Cargo:
#   1. Обновлять Cargo.lock
#   2. Скачивать что-либо из сети
#   Если зависимость не найдена в vendor/ — сборка упадет с ошибкой,
#   а не попытается тихо скачать что-то.
%if %{with pcre2}
cargo build --release --frozen --features pcre2
%else
cargo build --release --frozen
%endif

# ============================================================
# %install — установка в buildroot
# ============================================================
%install
# Устанавливаем бинарник rg.
# install -D — создает промежуточные каталоги при необходимости.
# install -m0755 — устанавливает права rwxr-xr-x (исполняемый файл).
# target/release/rg — путь к скомпилированному бинарнику.
# Cargo кладет результат сборки в target/release/ (для --release).
install -Dm0755 target/release/rg %{buildroot}%{_bindir}/rg

# Установка man-страницы, если она есть в проекте.
# ripgrep генерирует man-страницу при сборке.
if [ -f target/release/build/ripgrep-*/out/rg.1 ]; then
    install -Dm0644 target/release/build/ripgrep-*/out/rg.1 \
        %{buildroot}%{_mandir}/man1/rg.1
fi

# Установка shell completions, если они есть.
# Автодополнения делают работу с утилитой удобнее.
if [ -f target/release/build/ripgrep-*/out/rg.bash ]; then
    install -Dm0644 target/release/build/ripgrep-*/out/rg.bash \
        %{buildroot}%{_datadir}/bash-completion/completions/rg
fi

if [ -f target/release/build/ripgrep-*/out/rg.fish ]; then
    install -Dm0644 target/release/build/ripgrep-*/out/rg.fish \
        %{buildroot}%{_datadir}/fish/vendor_completions.d/rg.fish
fi

if [ -f target/release/build/ripgrep-*/out/_rg ]; then
    install -Dm0644 target/release/build/ripgrep-*/out/_rg \
        %{buildroot}%{_datadir}/zsh/site-functions/_rg
fi

# ============================================================
# %files — список файлов в пакете
# ============================================================
%files
%license LICENSE-MIT UNLICENSE
%doc README.md FAQ.md CHANGELOG.md
%{_bindir}/rg
# Man-страница и completions — включаем, только если были установлены.
# Если файлов нет — эти строки можно убрать.
%{_mandir}/man1/rg.1*
%{_datadir}/bash-completion/completions/rg
%{_datadir}/fish/vendor_completions.d/rg.fish
%{_datadir}/zsh/site-functions/_rg

%changelog
* Mon Feb 02 2026 Your Name <your@email.com> - 14.1.1-1
- Initial package for ROSA Linux
```

> **Важно:** проверьте имена файлов лицензии и документации в реальных исходниках.
> Они могут отличаться от указанных в примере. Посмотрите:
> ```bash
> tar tzf ~/rpmbuild/SOURCES/ripgrep-14.1.1.tar.gz | grep -iE '(license|readme|faq|changelog)' | head
> ```
> Также проверьте, генерирует ли конкретная версия ripgrep man-страницы и completions.
> Если нет — уберите соответствующие строки из `%install` и `%files`.

## Паттерн Source0 + Source1: подробное объяснение

Этот паттерн (два источника) типичен для Rust-пакетов, поэтому разберем его:

```spec
Source0:  https://github.com/.../ripgrep-14.1.1.tar.gz    # код проекта
Source1:  ripgrep-14.1.1-vendor.tar.xz                     # зависимости
```

**Source0** — основной исходный код. URL используется для документации; реальный файл
rpmbuild ищет в `~/rpmbuild/SOURCES/`.

**Source1** — вендоренные зависимости. У этого файла **нет URL** — он создается вручную
(шаг 3). Это нормально: rpmbuild ищет `ripgrep-14.1.1-vendor.tar.xz` в SOURCES.

В `%prep` мы распаковываем оба:
- `%autosetup` распаковывает Source0
- `tar -xf %{SOURCE1}` распаковывает Source1 внутрь уже распакованного Source0
