+++
title = "Тестирование пакета"
weight = 2
description = "Как проверять пакет до публикации: от smoke-теста до mock."
+++

Тестирование гарантирует, что пакет работает корректно и не ломает систему. Перед публикацией нужно пройти несколько уровней проверки.

## Уровни тестирования

```
1. rpmlint           ← Статический анализ SPEC и RPM
2. %check            ← Unit-тесты upstream
3. Установка         ← Пакет ставится без ошибок
4. Smoke-тест        ← Приложение запускается и работает
5. Зависимости       ← Корректные Requires, нет лишних
6. mock              ← Чистое окружение (как на ABF)
```

## Уровень 1: rpmlint

```bash
rpmlint mypackage.spec
rpmlint ~/rpmbuild/RPMS/x86_64/mypackage-*.rpm
```

Подробности в разделе [rpmlint](@/community/intermediate/07-quality/rpmlint.md).

## Уровень 2: Unit-тесты (%check)

Секция `%check` запускает тесты, предоставляемые upstream:

```spec
%check
# C/C++ (CTest)
%ctest

# Python
%pytest -q

# Rust
cargo test --release --locked

# Go
go test ./...

# Make-based
make check
```

### Когда тесты нужно делать опциональными

```spec
%bcond_with tests

%if %{with tests}
BuildRequires:  python3-pytest
BuildRequires:  python3-mock
%endif

%check
%if %{with tests}
%pytest -q -k "not network"
%endif
```

Причины:
- Тесты требуют **сеть** (на ABF обычно недоступна)
- Тесты требуют **специальное оборудование** (GPU, звуковую карту)
- Тесты **нестабильны** (flaky) и ломают сборку случайно
- Тесты требуют **запущенные сервисы** (БД, X11)

### Пропуск отдельных тестов

```spec
%check
# Пропустить сетевые тесты
%pytest -k "not (test_download or test_upload)"

# Пропустить по маркеру
%pytest -m "not network"

# CTest: исключить по имени
%ctest --exclude-regex "test_network|test_integration"
```

## Уровень 3: Тест на установку

```bash
# Установить собранный пакет
sudo dnf install ~/rpmbuild/RPMS/x86_64/mypackage-*.rpm

# Проверить, что установилось
rpm -q mypackage
rpm -ql mypackage

# Проверить зависимости
rpm -qR mypackage
```

### Установка в чистом окружении (через mock)

```bash
# Создать чистое окружение
mock -r rosa-13.1-x86_64 --init

# Установить пакет в него
mock -r rosa-13.1-x86_64 --install ~/rpmbuild/RPMS/x86_64/mypackage-*.rpm
```

## Уровень 4: Smoke-тест

Проверьте, что приложение **реально работает**:

```bash
# CLI-утилита
myapp --version
myapp --help
echo "test" | myapp process

# Библиотека — проверить, что линкуется
ldconfig -p | grep libfoo
pkg-config --libs foo

# Systemd-сервис
sudo systemctl start myservice
sudo systemctl status myservice
journalctl -u myservice --no-pager | tail -20
sudo systemctl stop myservice

# GUI-приложение
myapp &    # Запускается ли?
# Проверить основные действия вручную
```

## Уровень 5: Проверка зависимостей

```bash
# Что требует пакет
rpm -qR mypackage

# Нет ли лишних зависимостей
# (например, зависимость от конкретной версии библиотеки,
#  которая есть только на вашей системе)

# Проверить, что все зависимости разрешаются
dnf repoquery --requires --resolve mypackage

# Проверить обратные зависимости (для библиотек)
dnf repoquery --whatrequires libfoo
```

### Типичные проблемы с зависимостями

- **Не указан BuildRequires** — пакет собрался локально (зависимость уже стояла), но упадёт на ABF
- **Лишний Requires** — указана явная зависимость, которая определяется автоматически
- **Пропущенный Requires** — программа требует утилиту (например, `curl`), не определяемую автоматически

## Уровень 6: Сборка в mock

Mock эмулирует чистое окружение ABF:

```bash
# Установить mock
sudo dnf install mock
sudo usermod -aG mock $USER
# Перелогиниться!

# Собрать SRPM
rpmbuild -bs mypackage.spec

# Собрать в чистом окружении (имя профиля смотрите в /etc/mock)
mock -r rosa-13.1-x86_64 --rebuild ~/rpmbuild/SRPMS/mypackage-*.src.rpm
```

### Анализ результатов mock

```bash
# Результаты
ls /var/lib/mock/rosa-13.1-x86_64/result/

# Лог сборки
less /var/lib/mock/rosa-13.1-x86_64/result/build.log

# Лог инициализации (ошибки зависимостей)
less /var/lib/mock/rosa-13.1-x86_64/result/root.log

# Интерактивная отладка внутри chroot
mock -r rosa-13.1-x86_64 --shell
```

### Почему mock важен

| Что проверяет | Без mock | С mock |
|---------------|----------|--------|
| Все BuildRequires указаны | Не видно (пакеты уже стоят) | Видно сразу |
| Чистая среда | Нет | Да |
| Воспроизводимость | Не гарантирована | Гарантирована |
| Близость к ABF | Далеко | Почти идентично |

## Чеклист тестирования

Перед отправкой на ABF убедитесь:

- [ ] `rpmlint` — нет ошибок (E:)
- [ ] `rpmbuild -ba` — сборка проходит
- [ ] Пакет устанавливается через `dnf install`
- [ ] Приложение запускается и выдаёт ожидаемый результат
- [ ] `rpm -qR` — зависимости выглядят разумно
- [ ] mock-сборка проходит (если mock доступен)
- [ ] При удалении пакета система остаётся чистой

## Проверьте понимание

1. Почему mock-сборка важнее локальной?
2. Как пропустить сетевые тесты в %check?
3. Что такое smoke-тест?
4. Как проверить, что все BuildRequires указаны?
5. Что делать, если тесты нестабильны?

---

**Далее:** [Чеклист перед релизом](@/community/intermediate/07-quality/checklist.md)
