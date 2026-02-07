+++
title = "Подготовка окружения и скачивание исходников"
weight = 1
+++

## Подготовка окружения

```bash
sudo dnf install rpm-build rpmdevtools \
  python3-devel python3-pip python3-setuptools python3-wheel \
  pyproject-rpm-macros
rpmdev-setuptree
```

Что устанавливается:
- **python3-devel** — заголовочные файлы Python, нужны для сборки
- **python3-pip** — менеджер пакетов pip (используется внутри макросов)
- **python3-setuptools** — классическая система сборки Python
- **python3-wheel** — поддержка формата wheel
- **pyproject-rpm-macros** — макросы `%pyproject_*` для RPM-сборки

> **Важно:** пакет `pyproject-rpm-macros` — это то, что предоставляет все `%pyproject_*`
> макросы. Без него rpmbuild не поймет эти макросы и выдаст ошибку.

## Скачивание исходников

```bash
cd ~/rpmbuild/SOURCES

# Скачиваем исходный код с PyPI
curl -LO https://files.pythonhosted.org/packages/source/h/httpie/httpie-3.2.4.tar.gz
```

### Проверяем архив

```bash
tar tzf httpie-3.2.4.tar.gz | head -10
```

Ожидаемый вывод:

```
httpie-3.2.4/
httpie-3.2.4/LICENSE
httpie-3.2.4/MANIFEST.in
httpie-3.2.4/README.md
httpie-3.2.4/httpie/
httpie-3.2.4/httpie/__init__.py
...
```

### Как найти entry_points (CLI-скрипты)

Прежде чем писать SPEC, нужно узнать, какие CLI-команды устанавливает httpie.
Эта информация в `pyproject.toml` или `setup.cfg`:

```bash
# Распакуем во временный каталог и посмотрим
cd /tmp
tar xzf ~/rpmbuild/SOURCES/httpie-3.2.4.tar.gz
```

```bash
# Ищем console_scripts — это CLI-команды
grep -A10 'console_scripts' httpie-3.2.4/setup.cfg 2>/dev/null
grep -A10 'scripts' httpie-3.2.4/pyproject.toml 2>/dev/null
```

Ожидаемый вывод (из `setup.cfg` или `pyproject.toml`):

```
[options.entry_points]
console_scripts =
    http = httpie.__main__:main
    https = httpie.__main__:main
    httpie = httpie.manager.__main__:main
```

Это значит, что при установке пакета будут созданы три исполняемых скрипта:
- `/usr/bin/http` — основная команда для HTTP-запросов
- `/usr/bin/https` — то же, но с HTTPS по умолчанию
- `/usr/bin/httpie` — менеджер плагинов и настроек

Эти скрипты нужно будет перечислить в `%files`.

```bash
# Убираем за собой
rm -rf /tmp/httpie-3.2.4
cd ~
```
