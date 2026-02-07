+++
title = "Подготовка окружения и vendoring зависимостей"
weight = 1
+++

## Подготовка окружения

```bash
sudo dnf install rpm-build rpmdevtools rust cargo git
rpmdev-setuptree
```

Что устанавливается:
- **rust** — компилятор Rust (`rustc`)
- **cargo** — менеджер пакетов и система сборки Rust
- **git** — нужен некоторым зависимостям Cargo для скачивания

Если вы хотите включить поддержку PCRE2 (альтернативный движок регулярных выражений):

```bash
sudo dnf install pkgconfig pcre2-devel
```

## Скачивание исходников

```bash
cd ~/rpmbuild/SOURCES

# Задаем версию (обновите под актуальный релиз upstream)
export VER=14.1.1

# Скачиваем исходники с GitHub
curl -L -o ripgrep-${VER}.tar.gz \
  https://github.com/BurntSushi/ripgrep/archive/refs/tags/${VER}.tar.gz
```

### Проверяем архив

```bash
tar tzf ripgrep-${VER}.tar.gz | head -5
```

Ожидаемый вывод:

```
ripgrep-14.1.1/
ripgrep-14.1.1/.github/
ripgrep-14.1.1/.github/ISSUE_TEMPLATE/
ripgrep-14.1.1/.github/workflows/
ripgrep-14.1.1/.gitignore
```

> **Внимание к именованию:** GitHub автоматически создает архивы из тегов. Корневой каталог
> имеет формат `имя-проекта-версия/`. Если upstream использует теги вида `v14.1.1`
> (с префиксом `v`), URL будет `refs/tags/v${VER}.tar.gz`, но корневой каталог
> все равно будет `ripgrep-14.1.1/` (без `v`). Проверяйте это с `tar tzf`, чтобы
> правильно указать `-n` в `%autosetup`.

## Vendoring зависимостей

Это главный шаг, отличающий Rust-пакеты от обычных.

```bash
# Распаковываем исходники во временный каталог
cd /tmp
tar xzf ~/rpmbuild/SOURCES/ripgrep-${VER}.tar.gz
cd ripgrep-${VER}
```

### Смотрим, какой бинарник создает проект

Прежде чем собирать, давайте выясним, что именно мы получим:

```bash
# Ищем секцию [[bin]] в Cargo.toml
grep -A5 '^\[\[bin\]\]' Cargo.toml
```

Ожидаемый вывод:

```toml
[[bin]]
bench = false
path = "crates/core/main.rs"
name = "rg"
```

Это значит, что проект создает один бинарник с именем `rg`. Именно его мы будем
устанавливать в `%{_bindir}`.

### Выполняем vendoring

```bash
# Скачиваем все зависимости в каталог vendor/
cargo vendor --locked vendor
```

Флаг `--locked` гарантирует, что Cargo использует **именно те версии**, которые
указаны в `Cargo.lock`. Без этого флага Cargo может попытаться обновить зависимости.

Команда выведет подсказку — как настроить `.cargo/config.toml` для офлайн-сборки.
Сохраните ее — мы будем использовать эту конфигурацию в SPEC.

### Что появилось в vendor/

```bash
ls vendor/ | head -10
```

Вы увидите десятки каталогов — по одному на каждую зависимость:

```
aho-corasick/
anyhow/
bstr/
cfg-if/
crossbeam-channel/
crossbeam-deque/
crossbeam-epoch/
crossbeam-utils/
encoding_rs/
encoding_rs_io/
```

Каждый каталог содержит полный исходный код зависимости. Это и есть «вендоринг» —
мы буквально несем все зависимости с собой.

### Упаковываем vendor

```bash
# Создаем сжатый архив с зависимостями
tar -cJf ~/rpmbuild/SOURCES/ripgrep-${VER}-vendor.tar.xz vendor
```

Флаг `-cJ` создает архив со сжатием xz (хорошая степень сжатия). Файл `vendor.tar.xz`
обычно весит 10-50 МБ в зависимости от количества зависимостей.

```bash
# Проверяем размер
ls -lh ~/rpmbuild/SOURCES/ripgrep-${VER}-vendor.tar.xz
```

### Убираем за собой

```bash
cd ~
rm -rf /tmp/ripgrep-${VER}
```

Теперь в `~/rpmbuild/SOURCES/` должны быть два файла:

```bash
ls ~/rpmbuild/SOURCES/ripgrep-*
# ripgrep-14.1.1.tar.gz           ← исходный код проекта
# ripgrep-14.1.1-vendor.tar.xz    ← зависимости Cargo
```
