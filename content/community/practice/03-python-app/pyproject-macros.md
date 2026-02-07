+++
title = "Что делают %pyproject_* макросы за кулисами"
weight = 4
+++

Понимание внутренней работы макросов поможет при отладке.

## %pyproject_buildrequires

1. Читает `pyproject.toml` (или `setup.cfg`, `setup.py`)
2. Находит `[build-system] requires` — зависимости для сборки
3. Находит runtime-зависимости проекта
4. Выводит их в формате, понятном rpmbuild
5. rpmbuild проверяет, что все установлены, и при необходимости запрашивает доустановку

## %pyproject_wheel

1. Вызывает `python3 -m build --wheel --no-isolation`
2. Создает файл вроде `httpie-3.2.4-py3-none-any.whl` в текущем каталоге
3. Wheel — это ZIP-архив с расширением `.whl`, внутри — Python-файлы и метаданные

Имя wheel-файла `httpie-3.2.4-py3-none-any.whl` расшифровывается так:
- `py3` — для Python 3
- `none` — нет ABI-зависимости (нет C-расширений)
- `any` — для любой платформы

## %pyproject_install

1. Берет созданный `.whl` файл
2. Устанавливает его в `%{buildroot}` с помощью pip
3. Создает CLI-скрипты в `%{buildroot}%{_bindir}/` из entry_points

## %pyproject_save_files httpie

1. Находит в `%{buildroot}` все файлы, принадлежащие Python-пакету `httpie`
2. Записывает их пути в файл `%{_builddir}/pyproject-files-httpie.txt`
3. Включает каталог `httpie/` и `httpie-*.dist-info/` из site-packages
4. **Не включает** файлы из `%{_bindir}/` — их нужно указать в `%files` вручную

Чтобы посмотреть сгенерированный список (для отладки):

```bash
# После неудачной сборки или после rpmbuild -bi:
cat ~/rpmbuild/BUILD/httpie-3.2.4/pyproject-files-httpie.txt
```
