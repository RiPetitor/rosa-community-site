+++
title = "Ошибки и отладка"
weight = 4
+++

## Ошибки новичков

### 1. Забыли сделать vendoring

```
go: github.com/jesseduffield/gocui@v0.3.0: missing go.sum entry for module providing package
```

или

```
no required module provides package github.com/jesseduffield/gocui: go.mod file not found
```

**Решение:** Выполните `go mod vendor` в распакованных исходниках и создайте vendor-архив.
Не забудьте добавить его как `Source1` в SPEC.

### 2. Забыли флаг -mod=vendor

```
go: downloading github.com/jesseduffield/gocui v0.3.0
go: github.com/jesseduffield/gocui@v0.3.0: Get "https://proxy.golang.org/...": dial tcp: i/o timeout
```

Go игнорирует директорию `vendor/` если не указан `-mod=vendor` (в Go >= 1.14 vendor
используется автоматически только если есть `vendor/modules.txt`, но лучше указывать
явно через `GOFLAGS`).

**Решение:** Добавьте `export GOFLAGS="-mod=vendor"` перед `go build`.

### 3. Версия не встроена

```bash
$ lazygit --version
version=unversioned, commit=, build date=, build source=unknown
```

**Причина:** Не указаны `-ldflags -X` при сборке, или указан неправильный путь к переменной.

**Решение:** Найдите, где объявлена переменная версии:

```bash
grep -rn 'version\s*=' main.go pkg/config/
```

Если переменная в пакете `main`:

```bash
go build -ldflags "-X main.version=0.44.1" .
```

Если в другом пакете (например, `pkg/config`):

```bash
go build -ldflags "-X github.com/jesseduffield/lazygit/pkg/config.Version=0.44.1" .
```

### 4. Путаница с GOPATH

GOPATH -- это директория, куда Go по умолчанию скачивает модули. При vendoring она
не нужна, но некоторые скрипты сборки могут её использовать.

По умолчанию `GOPATH=~/go`. В RPM-сборке лучше переопределить:

```spec
export GOPATH=%{_builddir}/gopath
```

Это гарантирует, что сборка не полезет в домашнюю директорию пользователя.

### 5. Использование go install вместо go build

```spec
# НЕПРАВИЛЬНО
go install ./...

# ПРАВИЛЬНО
go build -o lazygit .
```

`go install` устанавливает бинарник в `$GOPATH/bin`, что бесполезно для RPM.
Нам нужен `go build`, который создаёт бинарник в текущей директории, а затем
мы его копируем через `install -Dm0755` в `%{buildroot}`.

### 6. Бинарник слишком большой

Go-бинарники больше, чем аналоги на C. Типичные размеры lazygit:

| Сборка | Размер |
|--------|--------|
| Без флагов оптимизации | ~35 МБ |
| С `-ldflags "-s -w"` | ~22 МБ |
| С UPX-сжатием (не рекомендуется) | ~8 МБ |

Флаги `-s` (no symbol table) и `-w` (no DWARF) обязательны для production-сборки.
UPX-сжатие не рекомендуется: оно ломает отладку и может вызвать проблемы с антивирусами.

> **Не пытайтесь `strip`** Go-бинарник командой `strip` -- это может его сломать.
> Go имеет собственный формат метаданных. Используйте `-ldflags "-s -w"` вместо этого.

### 7. Забыли CGO_ENABLED

Если не задать `CGO_ENABLED=0`, Go может попытаться использовать C-библиотеки
(например, для DNS-резолвинга). Это приведёт к динамической линковке:

```bash
$ file lazygit
lazygit: ELF 64-bit LSB executable, x86-64, dynamically linked, interpreter /lib64/ld-linux-x86-64.so.2, ...
```

Для lazygit это не критично, но для чистоты лучше задать `CGO_ENABLED=0`.
Если же проекту **нужен** cgo (например, для sqlite3), оставьте `CGO_ENABLED=1`
и добавьте `BuildRequires: gcc`.

### 8. Отсутствие git при сборке

Многие Go-проекты определяют версию через `git describe`. Если git не установлен:

```
fatal: not a git repository (or any of the parent directories): .git
```

Это не всегда фатально (зависит от проекта), но лучше добавить `BuildRequires: git`.

### 9. Пакет помечен как noarch

```spec
# НЕПРАВИЛЬНО
BuildArch:  noarch
```

Go компилирует в машинный код. Бинарник x86_64 не запустится на aarch64.
Никогда не ставьте `noarch` для Go-пакетов.

## Полезные команды для отладки Go-сборки

```bash
# Посмотреть версию Go и переменные окружения
go env

# Проверить, что все зависимости в vendor
go mod verify

# Посмотреть дерево зависимостей
go mod graph | head -20

# Собрать с подробным выводом
go build -v -o lazygit .

# Узнать, какие ldflags используются в проекте (из Makefile)
grep -i ldflags Makefile

# Проверить тип бинарника
file lazygit
ldd lazygit   # должен показать "not a dynamic executable"
```

Команда `ldd lazygit` на статически слинкованном бинарнике покажет:

```
        not a dynamic executable
```

Это подтверждает, что бинарник полностью самодостаточен.

## Итого

В этом практикуме вы научились:

1. Выполнять vendoring Go-зависимостей и создавать vendor-архив
2. Настраивать сборку Go с `GOFLAGS`, `GOPROXY`, `CGO_ENABLED`
3. Встраивать информацию о версии через `-ldflags -X`
4. Понимать, почему Go-бинарники статические и архитектурно-зависимые
5. Уменьшать размер бинарника флагами `-s -w`
6. Обрабатывать shell-completions
7. Обеспечивать воспроизводимость сборки с `-trimpath` и `GOPROXY=off`

---

**Предыдущий практикум:** [Meson-проект (gamemode)](@/community/practice/07-meson-project/_index.md)
