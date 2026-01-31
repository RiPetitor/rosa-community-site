+++
title = "Сеть и интернет"
description = "Настройка сетевых подключений в ROSA Linux"
weight = 4
+++

ROSA Linux использует NetworkManager для управления сетевыми подключениями.

## Проводное подключение

Обычно настраивается автоматически. Подключите кабель — и сеть заработает.

### Ручная настройка IP

1. Откройте настройки сети (значок в трее или «Параметры системы»).
2. Выберите подключение → «Настроить».
3. Во вкладке IPv4 выберите «Вручную».
4. Укажите IP-адрес, маску, шлюз и DNS.

## Wi-Fi

### Подключение

1. Нажмите на значок сети в трее.
2. Выберите сеть из списка.
3. Введите пароль.

### Скрытая сеть

1. Откройте настройки сети.
2. «Добавить подключение» → Wi-Fi.
3. Введите SSID вручную.

## Через терминал

### Статус сети

```bash
nmcli general status
```

### Список подключений

```bash
nmcli connection show
```

### Список Wi-Fi сетей

```bash
nmcli device wifi list
```

### Подключение к Wi-Fi

```bash
nmcli device wifi connect "Имя_сети" password "пароль"
```

### Отключение

```bash
nmcli connection down "Имя_подключения"
```

## VPN

### OpenVPN

```bash
sudo dnf install NetworkManager-openvpn NetworkManager-openvpn-gnome
```

Затем импортируйте конфигурацию через настройки сети.

### WireGuard

```bash
sudo dnf install wireguard-tools
```

Конфигурация размещается в `/etc/wireguard/`.

## Диагностика

### Проверка подключения

```bash
ping -c 4 ya.ru
```

### Информация об интерфейсах

```bash
ip addr
```

### DNS-запрос

```bash
nslookup ya.ru
```

### Маршруты

```bash
ip route
```

## Файрвол

ROSA Linux использует firewalld.

### Статус

```bash
sudo firewall-cmd --state
```

### Открыть порт

```bash
sudo firewall-cmd --add-port=8080/tcp --permanent
sudo firewall-cmd --reload
```

### Графический интерфейс

```bash
sudo dnf install firewall-config
```

<div class="warning">
  <div class="title">Безопасность</div>
  Открывайте только необходимые порты. Закрывайте то, что не используется.
</div>

## Следующий шаг

- [Оборудование и драйверы](@/docs/02-daily-use/05-hardware.md)
