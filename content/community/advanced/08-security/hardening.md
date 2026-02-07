+++
title = "Hardening: флаги безопасности"
weight = 2
description = "FORTIFY_SOURCE, PIE, RELRO, stack protector и их применение в RPM."
+++

Современные компиляторы и линковщики предлагают механизмы защиты от типичных уязвимостей. RPM-макросы автоматически включают многие из них, но мейнтейнер должен понимать, что происходит.

## Зачем нужен hardening

Даже если в коде нет явных ошибок, уязвимости находят регулярно. Hardening-флаги — это дополнительный уровень защиты:

- **Stack protector** — обнаруживает переполнение буфера в стеке
- **FORTIFY_SOURCE** — проверяет границы буферов в стандартных функциях
- **PIE (Position Independent Executable)** — затрудняет эксплуатацию через ASLR
- **RELRO (Relocation Read-Only)** — защищает GOT от перезаписи
- **NX (No Execute)** — запрещает исполнение кода в стеке

## Что RPM включает автоматически

При использовании стандартных макросов (`%configure`, `%cmake`, `%meson`) RPM автоматически передаёт hardening-флаги через `%{optflags}` и `%{build_ldflags}`.

```bash
# Посмотреть текущие флаги
rpm --eval '%{optflags}'
# -O2 -g -Wall -Wp,-D_FORTIFY_SOURCE=2 -fstack-protector-strong ...

rpm --eval '%{build_ldflags}'
# -Wl,-z,relro -Wl,--as-needed -Wl,-z,now ...
```

### Что означают эти флаги

| Флаг | Защита от | Описание |
|------|-----------|----------|
| `-fstack-protector-strong` | Переполнение стека | Канарейка на стеке обнаруживает перезапись |
| `-D_FORTIFY_SOURCE=2` | Переполнение буфера | Проверки границ в `memcpy`, `strcpy` и др. |
| `-fPIE` + `-pie` | Предсказуемые адреса | Позволяет ASLR рандомизировать адрес программы |
| `-Wl,-z,relro` | Перезапись GOT | Делает секции перемещений read-only |
| `-Wl,-z,now` | Lazy binding атаки | Разрешает все символы при загрузке (Full RELRO) |
| `-Wl,--as-needed` | Лишние зависимости | Линкует только реально используемые библиотеки |

## Когда флаги НЕ применяются автоматически

Если проект использует нестандартную систему сборки, флаги могут не передаваться:

```spec
%build
# НЕПРАВИЛЬНО — флаги не передаются
make

# ПРАВИЛЬНО — явная передача флагов
make CFLAGS="%{optflags}" LDFLAGS="%{build_ldflags}"
```

Для Rust и Go hardening-флаги работают иначе:

```spec
# Rust
%build
export RUSTFLAGS="%{build_rustflags}"
cargo build --release --locked

# Go
%build
export GOFLAGS="-buildmode=pie -trimpath"
go build -ldflags "-linkmode=external"
```

## Проверка hardening

### Через `hardening-check`

```bash
# Установить
sudo dnf install hardening-check

# Проверить бинарник
hardening-check /usr/bin/myapp
```

Вывод:

```
/usr/bin/myapp:
 Position Independent Executable: yes
 Stack protected: yes
 Fortify Source functions: yes
 Read-only relocations: yes
 Immediate binding: yes
```

### Через `checksec`

```bash
checksec --file=/usr/bin/myapp
```

### Через `readelf`

```bash
# Проверить PIE
readelf -h /usr/bin/myapp | grep Type
# Type: DYN (Position-Independent Executable)  ← PIE включён

# Проверить RELRO
readelf -l /usr/bin/myapp | grep GNU_RELRO
# GNU_RELRO      ← RELRO включён

# Проверить stack protector
readelf -s /usr/bin/myapp | grep __stack_chk
# __stack_chk_fail  ← stack protector включён
```

## Типичные проблемы

### Проект отключает флаги

Некоторые проекты явно переопределяют `CFLAGS`:

```cmake
# В CMakeLists.txt upstream
set(CMAKE_C_FLAGS "-O3 -Wall")
```

Это затирает флаги RPM. Решение — патч или правильная передача:

```spec
%build
%cmake -DCMAKE_C_FLAGS_RELEASE="%{optflags}" \
       -DCMAKE_EXE_LINKER_FLAGS="%{build_ldflags}"
%cmake_build
```

### `-Werror конфликтует с hardening-флагами

Флаг `-Werror` превращает предупреждения в ошибки. Hardening-флаги могут генерировать дополнительные предупреждения:

```spec
%build
%configure --disable-werror
# или
%cmake -DENABLE_WERROR=OFF
```

## Проверьте понимание

1. Какие основные hardening-флаги включаются автоматически?
2. Как проверить, что бинарник собран с PIE?
3. Что делать, если проект переопределяет CFLAGS?
4. Зачем нужен Full RELRO (`-Wl,-z,now`)?

---

**Далее:** [Реагирование на CVE](@/community/advanced/08-security/cve-response.md)
