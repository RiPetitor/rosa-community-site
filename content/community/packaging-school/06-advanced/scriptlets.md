+++
title = "Скриптлеты и триггеры"
weight = 3
description = "%pre/%post/%preun/%postun и триггеры для корректной установки."
+++

Скриптлеты — это команды, которые выполняются при установке и удалении пакета. Используйте их только при необходимости.

## Когда нужны скриптлеты

- Обновление кэшей (icon cache, desktop cache, ldconfig)
- Регистрация сервисов systemd
- Создание системного пользователя/группы
- Перезапуск или reload сервисов

## Пример: systemd-сервис

```spec
%post
%systemd_post myservice.service

%preun
%systemd_preun myservice.service

%postun
%systemd_postun_with_restart myservice.service
```

## Пример: обновление ldconfig

```spec
%post -p /sbin/ldconfig
%postun -p /sbin/ldconfig
```

## Важные правила

- Скриптлеты должны быть **идемпотентными**
- Никаких сетевых операций
- Не требуйте пользовательского ввода
- Не ломайте установку при ошибке

## Триггеры

Триггеры полезны, когда нужно реагировать на изменение файлов других пакетов.
Используйте их аккуратно и только при необходимости:

```spec
%transfiletriggerin -- %{_datadir}/icons/hicolor
/usr/bin/gtk-update-icon-cache %{_datadir}/icons/hicolor || :
```
