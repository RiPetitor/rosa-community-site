+++
title = "Rust и Cargo"
weight = 5
description = "Упаковка Rust-программ, vendoring зависимостей."
+++

**Rust** — современный системный язык программирования. Его система сборки **Cargo** управляет зависимостями через crates.io.

## Особенности упаковки Rust

1. **Зависимости** скачиваются из crates.io
2. **Vendoring** — включение зависимостей в исходники
3. **Статическая линковка** по умолчанию
4. **Медленная компиляция** (особенно в Release)

## Признаки Rust-проекта

- `Cargo.toml` в корне
- `Cargo.lock` (фиксированные версии зависимостей)
- `src/main.rs` или `src/lib.rs`

## Два подхода к упаковке

### 1. Vendoring (рекомендуется)

Все зависимости включаются в архив исходников:

```spec
Source0:        %{name}-%{version}.tar.gz
Source1:        %{name}-%{version}-vendor.tar.xz
```

### 2. Скачивание при сборке (проще, но хуже)

Cargo скачивает зависимости во время сборки. Не работает в изолированном окружении.

## Подготовка исходников с vendoring

### Шаг 1: Скачать исходники

```bash
git clone https://github.com/user/project
cd project
git checkout v1.0.0
```

### Шаг 2: Vendor зависимости

```bash
cargo vendor
tar cJf ../project-1.0.0-vendor.tar.xz vendor/
```

### Шаг 3: Создать конфиг для Cargo

Файл `.cargo/config.toml`:

```toml
[source.crates-io]
replace-with = "vendored-sources"

[source.vendored-sources]
directory = "vendor"
```

## Полный пример SPEC

```spec
%global crate bat

Name:           %{crate}
Version:        0.24.0
Release:        1%{?dist}
Summary:        Cat clone with syntax highlighting and Git integration

License:        MIT OR Apache-2.0
URL:            https://github.com/sharkdp/bat
Source0:        %{url}/archive/v%{version}/%{crate}-%{version}.tar.gz
Source1:        %{crate}-%{version}-vendor.tar.xz

BuildRequires:  rust >= 1.70
BuildRequires:  cargo
BuildRequires:  pkgconfig(libgit2)
BuildRequires:  pkgconfig(libssh2)
BuildRequires:  pkgconfig(openssl)
BuildRequires:  pkgconfig(zlib)

%description
A cat(1) clone with wings. bat supports syntax highlighting
for a large number of programming and markup languages.

%prep
%autosetup -n %{crate}-%{version}

# Распаковать vendor
tar xf %{SOURCE1}

# Настроить Cargo на использование vendor
mkdir -p .cargo
cat > .cargo/config.toml << EOF
[source.crates-io]
replace-with = "vendored-sources"

[source.vendored-sources]
directory = "vendor"
EOF

%build
export CARGO_HOME="$PWD/.cargo"
cargo build --release --locked

%install
install -Dm 755 target/release/%{crate} %{buildroot}%{_bindir}/%{crate}

# Man-страница
install -Dm 644 doc/%{crate}.1 %{buildroot}%{_mandir}/man1/%{crate}.1

# Автодополнение
install -Dm 644 target/release/build/%{crate}-*/out/assets/completions/%{crate}.bash \
    %{buildroot}%{_datadir}/bash-completion/completions/%{crate}
install -Dm 644 target/release/build/%{crate}-*/out/assets/completions/%{crate}.zsh \
    %{buildroot}%{_datadir}/zsh/site-functions/_%{crate}
install -Dm 644 target/release/build/%{crate}-*/out/assets/completions/%{crate}.fish \
    %{buildroot}%{_datadir}/fish/vendor_completions.d/%{crate}.fish

%files
%license LICENSE-MIT LICENSE-APACHE
%doc README.md CHANGELOG.md
%{_bindir}/%{crate}
%{_mandir}/man1/%{crate}.1*
%{_datadir}/bash-completion/completions/%{crate}
%{_datadir}/zsh/site-functions/_%{crate}
%{_datadir}/fish/vendor_completions.d/%{crate}.fish

%changelog
* Mon Feb 03 2025 Your Name <your@email.com> - 0.24.0-1
- Initial package
```

## Макросы Rust (Fedora)

В Fedora/ROSA есть специальные макросы:

```spec
BuildRequires:  rust-packaging

%build
%cargo_build

%install
%cargo_install

%check
%cargo_test
```

Но они могут быть недоступны, поэтому ручной вариант надёжнее.

## Использование системных библиотек

Rust-программы часто статически линкуют библиотеки. Для использования системных:

```spec
%build
export LIBGIT2_SYS_USE_PKG_CONFIG=1
export LIBSSH2_SYS_USE_PKG_CONFIG=1
export OPENSSL_NO_VENDOR=1
cargo build --release --locked
```

## Флаги сборки

```spec
%build
export CARGO_HOME="$PWD/.cargo"
export RUSTFLAGS="%{build_rustflags}"

# Release-сборка (оптимизированная)
cargo build --release --locked

# Или с указанием профиля
cargo build --profile release-lto --locked
```

### Профили в Cargo.toml

```toml
[profile.release]
lto = true
codegen-units = 1
strip = true
```

## Тестирование

```spec
%check
cargo test --release --locked
```

Или пропустить тесты, требующие сеть:

```spec
%check
cargo test --release --locked -- --skip network_test
```

## Workspace и несколько бинарников

Если проект содержит несколько программ:

```spec
%build
cargo build --release --locked --workspace

%install
for bin in foo bar baz; do
    install -Dm 755 target/release/$bin %{buildroot}%{_bindir}/$bin
done
```

## Типичные проблемы

### «Unable to update crates.io index»

Сборка пытается обратиться к сети. Проверьте vendoring:

```bash
ls vendor/
cat .cargo/config.toml
```

### «Couldn't find X in the vendor directory»

Зависимость не была vendor'ена. Пересоздайте vendor:

```bash
cargo vendor
```

### «Package X was not found in the pkg-config search path»

Нужна системная библиотека:

```spec
BuildRequires:  pkgconfig(libgit2)
```

### Очень долгая сборка

Rust компилируется медленно. Попробуйте:

```spec
%build
# Использовать больше потоков
export CARGO_BUILD_JOBS=%{_smp_build_ncpus}
cargo build --release --locked
```

### «version X does not match`

Cargo.lock не соответствует Cargo.toml. Обновите lock:

```bash
cargo update
```

## Лицензии зависимостей

При vendoring важно учесть лицензии всех зависимостей:

```spec
License:        MIT AND Apache-2.0 AND BSD-3-Clause
```

Проверить можно через:

```bash
cargo license
# или
cargo deny check licenses
```

## Обновление версии

1. Скачать новые исходники
2. Обновить Cargo.lock: `cargo update`
3. Пересоздать vendor: `cargo vendor`
4. Обновить SPEC (версия, changelog)
5. Пересобрать

## Проверьте понимание

1. Зачем нужен vendoring для Rust-пакетов?
2. Как создать vendor-архив?
3. Что делает флаг `--locked`?
4. Как использовать системную libgit2 вместо встроенной?
5. Почему в License указываются лицензии зависимостей?

---

**Далее:** [Go modules](golang.md)
