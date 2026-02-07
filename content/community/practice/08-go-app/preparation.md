+++
title = "Подготовка и vendoring"
weight = 1
+++

## Подготовка окружения

```bash
sudo dnf install rpm-build rpmdevtools rpmlint golang git

rpmdev-setuptree
```

**Что здесь важно:**

- `golang` -- компилятор Go. Убедитесь, что версия >= 1.21 (проверьте `go version`)
- `git` -- нужен не только для работы с репозиторием, но и для самой сборки: многие Go-проекты
  используют `git describe` для определения версии

Проверьте версию Go:

```bash
go version
```

Ожидаемый вывод:

```
go version go1.22.5 linux/amd64
```

Если версия слишком старая, сборка может упасть с ошибкой вида:

```
package requires Go >= 1.21
```

## Скачивание исходников

```bash
cd ~/rpmbuild/SOURCES

# Укажите актуальную версию
export VER=0.44.1

curl -L -o lazygit-${VER}.tar.gz \
  https://github.com/jesseduffield/lazygit/archive/refs/tags/v${VER}.tar.gz
```

> **Обратите внимание:** тег на GitHub имеет префикс `v` (`v0.44.1`), но директория
> в архиве -- `lazygit-0.44.1` (без `v`). Это типичная ситуация для Go-проектов.

Проверьте архив:

```bash
tar tzf lazygit-${VER}.tar.gz | head -5
```

Ожидаемый вывод:

```
lazygit-0.44.1/
lazygit-0.44.1/.github/
lazygit-0.44.1/.gitignore
lazygit-0.44.1/LICENSE
lazygit-0.44.1/Makefile
```

## Vendoring зависимостей

Это ключевой шаг. Мы скачиваем все Go-модули локально и упаковываем их в архив.

```bash
cd ~/rpmbuild/SOURCES
tar xzf lazygit-${VER}.tar.gz
cd lazygit-${VER}

# Скачать все зависимости в директорию vendor/
go mod vendor
```

**Что делает `go mod vendor`:**

1. Читает файл `go.sum` -- список всех зависимостей с контрольными суммами
2. Скачивает каждый модуль из Go-прокси (или из кэша `~/go/pkg/mod/`)
3. Копирует нужные файлы в директорию `vendor/`
4. Создаёт `vendor/modules.txt` -- манифест всех вендоренных модулей

Проверьте, что vendor создан:

```bash
ls vendor/ | head -10
du -sh vendor/
```

Ожидаемый вывод (примерный):

```
github.com
golang.org
gopkg.in
modules.txt
...
42M    vendor/
```

Теперь создайте архив:

```bash
tar -cJf ~/rpmbuild/SOURCES/lazygit-${VER}-vendor.tar.xz vendor
```

> **Почему tar.xz?** Vendor-директории бывают большими (десятки МБ). Формат xz даёт
> лучшее сжатие, чем gzip. Для lazygit vendor ~42 МБ превращается в ~8 МБ xz-архив.

Вернитесь в директорию SOURCES:

```bash
cd ~/rpmbuild/SOURCES
```

## Изучение встраивания версии

Прежде чем писать SPEC, нужно понять, как lazygit определяет свою версию. Go-проекты
обычно используют переменные, значения которых задаются при компиляции через `-ldflags -X`.

```bash
grep -r "version" lazygit-${VER}/main.go lazygit-${VER}/pkg/config/ 2>/dev/null | head -10
```

Или поищите в Makefile:

```bash
grep -i "ldflags\|version\|buildDate\|commit" lazygit-${VER}/Makefile 2>/dev/null
```

Как правило, lazygit использует что-то вроде:

```go
// В main.go или pkg/config/
var (
    version   = "unversioned"
    commit    = ""
    date      = ""
    buildSource = "unknown"
)
```

Эти переменные заполняются при компиляции:

```bash
go build -ldflags "-X main.version=0.44.1 -X main.commit=abc123 -X main.date=2026-02-08 -X main.buildSource=rpm"
```

Если вы этого не сделаете, `lazygit --version` покажет `unversioned` -- верный признак того,
что версия не была встроена.

Изучите точные пути к переменным:

```bash
grep -rn 'version.*=.*"' lazygit-${VER}/pkg/config/app_config.go 2>/dev/null
```

Путь к переменной может быть `main.version` или `github.com/jesseduffield/lazygit/pkg/config.Version` --
это зависит от того, в каком пакете Go она объявлена. Проверяйте исходники.
