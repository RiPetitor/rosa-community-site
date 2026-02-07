+++
title = "Bundled-зависимости и supply chain"
weight = 4
description = "Почему bundled-библиотеки опасны и как с ними работать."
+++

Многие проекты включают копии сторонних библиотек прямо в свои исходники (bundling). Это создаёт серьёзные проблемы безопасности.

## Что такое bundling

Bundled-зависимость — это копия сторонней библиотеки, включённая в исходники проекта:

```
myproject/
├── src/
│   └── main.c
├── third_party/          ← Bundled!
│   ├── zlib/
│   ├── openssl/
│   └── json-c/
└── Makefile
```

## Почему это плохо

### Проблема безопасности

Если в `zlib` найдена CVE:
- **Системный zlib** — обновляется одним пакетом, сразу для всех
- **Bundled zlib** — нужно пересобрать **каждый пакет**, который его bundled

На практике bundled-копии часто забывают обновить → уязвимости остаются.

### Проблема обновлений

```
Системная libfoo:  1.5.0 (с исправлениями CVE)
Bundled libfoo:    1.2.0 (старая, уязвимая)
```

### Проблема дублирования

Одна и та же библиотека в 10 пакетах — это 10 копий в памяти и на диске.

## Как определить bundled-зависимости

```bash
# Распаковать и поискать типичные паттерны
tar xf myproject-1.0.tar.gz
find myproject-1.0 -name "*.c" -path "*/third_party/*" | head
find myproject-1.0 -name "*.c" -path "*/vendor/*" | head
find myproject-1.0 -name "*.c" -path "*/external/*" | head

# Для Python
grep -r "bundled" myproject-1.0/setup.py
ls myproject-1.0/vendor/

# Для Rust
ls myproject-1.0/vendor/
```

## Стратегии работы с bundling

### Стратегия 1: Использовать системную библиотеку (предпочтительно)

```spec
BuildRequires:  pkgconfig(zlib)
BuildRequires:  pkgconfig(json-c)

%build
%cmake -DUSE_SYSTEM_ZLIB=ON \
       -DUSE_SYSTEM_JSON=ON
%cmake_build

%install
%cmake_install
# Удалить bundled-копии, если они всё ещё устанавливаются
rm -rf %{buildroot}%{_libdir}/myproject/third_party/
```

### Стратегия 2: Если системная библиотека недоступна

Иногда bundling неизбежен (например, форк с несовместимыми изменениями):

```spec
# Явно укажите, что библиотека bundled
Provides:       bundled(libfoo) = 1.2.0
```

`Provides: bundled(...)` — это документация для аудита. Она показывает, что пакет содержит встроенную копию библиотеки определённой версии.

### Стратегия 3: Vendoring (Rust, Go)

Для Rust и Go vendoring — стандартная практика, потому что эти языки не используют системные библиотеки для своих зависимостей:

```spec
# Rust: vendor-архив
Source1:        %{name}-%{version}-vendor.tar.xz

# Указать bundled-зависимости
Provides:       bundled(crate(serde)) = 1.0.195
Provides:       bundled(crate(tokio)) = 1.35.1
```

Для Rust/Go vendoring допустим, но для C/C++ — используйте системные библиотеки.

## Аудит bundled-зависимостей

```bash
# Для Rust
cargo license
cargo deny check

# Для Python
pip show mypackage | grep -i requires

# Для Go
go list -m all
```

## Рекомендации

1. **Предпочитайте** системные библиотеки всегда, когда возможно
2. **Документируйте** bundled-зависимости через `Provides: bundled(...)`
3. **Отслеживайте** CVE не только для основного проекта, но и для bundled-библиотек
4. **Сообщайте** upstream о необходимости использования системных библиотек
5. Для **Rust/Go** vendoring допустим, но лицензии зависимостей должны быть учтены

## Проверьте понимание

1. Почему bundled-библиотеки — проблема безопасности?
2. Как найти bundled-зависимости в проекте?
3. Когда vendoring допустим?
4. Зачем указывать `Provides: bundled(...)`?

---

**Следующий модуль:** [Лицензирование](@/community/advanced/09-licensing/_index.md)
