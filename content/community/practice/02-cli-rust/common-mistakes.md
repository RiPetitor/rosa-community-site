+++
title = "Ошибки новичков и советы по отладке"
weight = 4
+++

## Ошибки новичков

### 1. Vendoring с неактуальным Cargo.lock

**Симптом:**

```
error: failed to select a version for the requirement `aho-corasick = "^1.1.2"`
candidate versions found which didn't match: 1.0.5
```

**Причина:** вы сделали vendoring из одной версии исходников, а SPEC указывает на другую.
`Cargo.lock` в исходниках требует зависимость версии 1.1.2, но в вашем vendor/ лежит 1.0.5.

**Решение:** всегда делайте vendoring из **тех же самых** исходников, которые указаны в Source0.
Если обновляете версию ripgrep, пересоздайте vendor-архив.

### 2. Забыли --frozen — Cargo лезет в сеть

**Симптом:**

```
    Updating crates.io index
error: failed to get `aho-corasick` as a dependency of package `ripgrep`
...
caused by: failed to query replaced source registry `crates-io`
```

Или, если интернет доступен, Cargo может тихо скачать обновленные зависимости,
и сборка окажется невоспроизводимой.

**Причина:** без флага `--frozen` Cargo пытается обновить индекс crates.io.

**Решение:** всегда используйте `cargo build --release --frozen`.

### 3. Неправильный путь к бинарнику в %install

**Симптом:**

```
install: cannot stat 'target/release/ripgrep': No such file or directory
```

**Причина:** бинарник называется `rg`, а не `ripgrep`. Имя определяется в `Cargo.toml`
(секция `[[bin]]`, поле `name`).

**Решение:** всегда проверяйте `Cargo.toml` перед написанием `%install`:

```bash
grep -A5 '^\[\[bin\]\]' Cargo.toml
```

Или посмотрите, что появилось после сборки:

```bash
ls target/release/
```

### 4. Отсутствие системных библиотек для фич

**Симптом (при сборке с --with pcre2):**

```
error: failed to run custom build command for `pcre2-sys`
...
pkg-config exited with status code 1
--- stderr
Package libpcre2-8 was not found in the pkg-config search path.
```

**Причина:** не установлена библиотека `pcre2-devel`.

**Решение:** добавьте `BuildRequires: pkgconfig(libpcre2-8)` и установите:

```bash
sudo dnf install pcre2-devel
```

### 5. Имя корневого каталога в архиве не совпадает с ожидаемым

**Симптом:**

```
error: Bad source: /home/user/rpmbuild/SOURCES/ripgrep-14.1.1.tar.gz: No such directory: ripgrep-14.1.1
```

**Причина:** GitHub иногда создает архивы с другим именем каталога. Например,
если тег содержит `v` (`v14.1.1`), каталог может быть `ripgrep-v14.1.1` или
просто `ripgrep-14.1.1`.

**Решение:** проверьте реальное имя:

```bash
tar tzf ripgrep-14.1.1.tar.gz | head -1
```

И укажите его в `%autosetup`:

```spec
%autosetup -n ripgrep-14.1.1
```

### 6. Забыли создать .cargo/config.toml

**Симптом:** Cargo игнорирует vendor/ и пытается скачивать из crates.io:

```
    Updating crates.io index
warning: spurious network error (3 tries remaining): ...
```

**Причина:** без `.cargo/config.toml` Cargo не знает, что нужно использовать
каталог vendor/ вместо crates.io.

**Решение:** убедитесь, что в `%prep` есть создание конфигурации:

```bash
mkdir -p .cargo
cat > .cargo/config.toml <<'EOF'
[source.crates-io]
replace-with = "vendored-sources"

[source.vendored-sources]
directory = "vendor"
EOF
```

### 7. SRPM слишком большой для ABF

**Симптом:** загрузка SRPM на ABF отклоняется из-за размера.

**Причина:** vendor-архив может быть очень большим (десятки МБ).

**Решение:** используйте максимальное сжатие xz:

```bash
tar -cJf --options='compression-level=9' ripgrep-${VER}-vendor.tar.xz vendor
```

Или рассмотрите возможность загрузить vendor-архив отдельно и указать его как
дополнительный источник в ABF.

## Советы по отладке Rust-пакетов

### Пошаговая сборка

```bash
# Только распаковка — проверить, что vendor на месте
rpmbuild -bp ripgrep.spec
ls ~/rpmbuild/BUILD/ripgrep-14.1.1/vendor/ | wc -l
# Должно показать десятки каталогов

# Проверить .cargo/config.toml
cat ~/rpmbuild/BUILD/ripgrep-14.1.1/.cargo/config.toml
```

### Поиск артефактов сборки

После `rpmbuild -bc` (компиляция) полезно посмотреть, что создал Cargo:

```bash
ls ~/rpmbuild/BUILD/ripgrep-14.1.1/target/release/
```

Здесь будет бинарник `rg`, а также каталог `build/` с артефактами
(man-страницы, completions и т.д.).

### Просмотр сгенерированных файлов

Некоторые Rust-проекты генерируют man-страницы и shell-completions во время сборки.
Поищите их:

```bash
find ~/rpmbuild/BUILD/ripgrep-14.1.1/target/release/build/ -name '*.1' -o -name '*.bash' -o -name '*.fish' -o -name '_*'
```

## Что дальше

- Загрузите пакет на ABF
- Попробуйте упаковать другую Rust-утилиту: `fd`, `bat`, `exa`
- Добавьте `%check` секцию с запуском тестов (если они не требуют сети)
- Создайте подпакет `ripgrep-bash-completion`, `ripgrep-zsh-completion`

---

**Следующий практикум:** [Python-приложение (httpie)](../03-python-app/)
