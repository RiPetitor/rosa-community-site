+++
title = "SPDX и указание в SPEC"
weight = 2
description = "Формат SPDX, операторы AND/OR/WITH, указание лицензии в SPEC-файле."
+++

SPDX (Software Package Data Exchange) — стандартный формат записи лицензий. Используйте его в теге `License:` вместо произвольных строк.

## Формат SPDX

### Простая лицензия

```spec
License:        MIT
License:        GPL-3.0-or-later
License:        Apache-2.0
```

### Операторы

| Оператор | Значение | Пример |
|----------|----------|--------|
| `AND` | Обе лицензии применяются одновременно | `MIT AND BSD-3-Clause` |
| `OR` | Пользователь выбирает одну из | `MIT OR Apache-2.0` |
| `WITH` | Лицензия с исключением | `GPL-2.0-or-later WITH Classpath-exception-2.0` |

### Примеры реальных пакетов

```spec
# Проект полностью под MIT
License:        MIT

# Основной код — GPL, один файл — BSD
License:        GPL-3.0-or-later AND BSD-2-Clause

# Двойная лицензия (Rust crates часто так)
License:        MIT OR Apache-2.0

# GCC runtime library
License:        GPL-3.0-or-later WITH GCC-exception-3.1

# Сложный проект с bundled-зависимостями
License:        Apache-2.0 AND MIT AND BSD-3-Clause AND ISC
```

### Скобки

Для сложных выражений используйте скобки:

```spec
License:        (MIT OR Apache-2.0) AND GPL-3.0-or-later
```

## Как определить лицензию

### Шаг 1: Найти файлы лицензий

```bash
tar xf myproject-1.0.tar.gz
find myproject-1.0 -iname 'LICENSE*' -o -iname 'COPYING*' -o -iname 'NOTICE*'
```

### Шаг 2: Прочитать и определить тип

```bash
cat myproject-1.0/LICENSE
# Если видите "MIT License" → MIT
# Если "GNU General Public License" → GPL
# Если "Apache License, Version 2.0" → Apache-2.0
```

### Шаг 3: Проверить все компоненты

В больших проектах разные файлы могут быть под разными лицензиями:

```bash
# Поиск лицензионных заголовков в исходниках
grep -rn "Copyright\|License\|SPDX-License-Identifier" myproject-1.0/src/ | head -20
```

Современные проекты часто содержат SPDX-идентификаторы прямо в файлах:

```c
// SPDX-License-Identifier: MIT
```

### Шаг 4: Проверить bundled-зависимости

```bash
# Лицензии в каталогах third_party/vendor
find myproject-1.0/vendor -name 'LICENSE*' -exec echo {} \; -exec head -1 {} \;
```

## SPDX License List

Полный список идентификаторов: [spdx.org/licenses](https://spdx.org/licenses/)

Частые идентификаторы:

| SPDX | Лицензия |
|------|----------|
| `MIT` | MIT License |
| `BSD-2-Clause` | BSD 2-Clause |
| `BSD-3-Clause` | BSD 3-Clause |
| `Apache-2.0` | Apache License 2.0 |
| `GPL-2.0-only` | GNU GPL v2 only |
| `GPL-2.0-or-later` | GNU GPL v2 or later |
| `GPL-3.0-only` | GNU GPL v3 only |
| `GPL-3.0-or-later` | GNU GPL v3 or later |
| `LGPL-2.1-only` | GNU LGPL v2.1 only |
| `LGPL-2.1-or-later` | GNU LGPL v2.1 or later |
| `LGPL-3.0-only` | GNU LGPL v3 only |
| `MPL-2.0` | Mozilla Public License 2.0 |
| `ISC` | ISC License |
| `Zlib` | zlib License |
| `Unlicense` | The Unlicense |

## %license в %files

Всегда указывайте файлы лицензий:

```spec
%files
%license LICENSE
%license COPYING
%license NOTICE
```

Для подпакетов — каждый подпакет должен содержать лицензию:

```spec
%files
%license LICENSE

%files devel
%license LICENSE

%files doc
%license LICENSE
```

## Типичные ошибки

### Неправильный SPDX-идентификатор

```spec
# НЕПРАВИЛЬНО
License:        GPLv3+
License:        GPL
License:        BSD

# ПРАВИЛЬНО
License:        GPL-3.0-or-later
License:        GPL-3.0-only
License:        BSD-3-Clause
```

### Лицензия не соответствует исходникам

```spec
# В SPEC
License:        MIT

# В исходниках — файл COPYING с текстом GPL-2.0
```

Всегда проверяйте реальное содержимое файлов лицензий.

### Забыли bundled-зависимости

Если проект bundled zlib (BSD-подобная) и json-c (MIT):

```spec
# НЕПРАВИЛЬНО — указана только лицензия основного кода
License:        GPL-3.0-or-later

# ПРАВИЛЬНО — учтены все компоненты
License:        GPL-3.0-or-later AND Zlib AND MIT
```

## Проверьте понимание

1. Чем `AND` отличается от `OR` в SPDX?
2. Как определить лицензию проекта по его исходникам?
3. Зачем `%license` вместо `%doc` для файлов лицензий?
4. Почему нужно учитывать лицензии bundled-зависимостей?

---

**Далее:** [Аудит лицензий проекта](@/community/advanced/09-licensing/license-audit.md)
