+++
title = "Steam"
description = "Установка игровой платформы Steam"
weight = 5
+++

Steam — крупнейшая платформа цифровой дистрибуции игр.

## Способ 1: Репозитории ROSA

Проверьте наличие:

```bash
dnf search steam
sudo dnf install steam
```

## Способ 2: Flatpak

```bash
flatpak install flathub com.valvesoftware.Steam
```

Запуск:

```bash
flatpak run com.valvesoftware.Steam
```

## Способ 3: Официальный RPM

1. Откройте [store.steampowered.com/about/](https://store.steampowered.com/about/).
2. Скачайте «Install Steam».
3. Установите:

```bash
sudo dnf install ./steam-*.rpm
```

## Настройка для игр

### Steam Play (Proton)

Proton позволяет запускать Windows-игры на Linux.

1. Откройте Steam → Настройки → Совместимость.
2. Включите «Включить Steam Play для всех продуктов».
3. Выберите версию Proton.

### Драйверы видеокарты

Для игр критически важны актуальные драйверы:

```bash
# NVIDIA
sudo dnf install nvidia-driver

# AMD — драйверы в ядре, установите Vulkan
sudo dnf install mesa-vulkan-drivers vulkan-tools

# Проверка Vulkan
vulkaninfo
```

### 32-битные библиотеки

Некоторые игры требуют 32-битные библиотеки:

```bash
sudo dnf install mesa-dri-drivers.i686 mesa-libGL.i686
```

## Проверка совместимости игр

Перед покупкой проверьте совместимость:

- [ProtonDB](https://www.protondb.com/) — база данных совместимости
- Оценки: Platinum, Gold, Silver, Bronze, Borked

## Оптимизация

### Gamemode

Автоматическая оптимизация системы во время игры:

```bash
sudo dnf install gamemode
```

Steam автоматически использует Gamemode, если он установлен.

### MangoHud

Оверлей с информацией о FPS и нагрузке:

```bash
sudo dnf install mangohud
```

Запуск игры с оверлеем: добавьте `mangohud %command%` в параметры запуска игры.

## Проблемы и решения

### Игра не запускается

1. Проверьте ProtonDB для конкретной игры.
2. Попробуйте другую версию Proton.
3. Проверьте логи: `~/.steam/steam/logs/`

### Низкий FPS

1. Убедитесь, что используется дискретная видеокарта.
2. Обновите драйверы.
3. Включите Gamemode.

## Удаление

```bash
sudo dnf remove steam
# или
flatpak uninstall com.valvesoftware.Steam
```

<div class="warning">
  <div class="title">Внимание</div>
  При удалении Steam игры остаются на диске. Удалите их отдельно из <code>~/.steam/steam/steamapps/</code>.
</div>
