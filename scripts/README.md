# 图标生成脚本

这个脚本可以从一个 1024x1024 的源图标自动生成所有 Tauri 应用需要的图标文件。

## 使用方法

1. 安装依赖：
```bash
pnpm install
```

2. 准备源图标：
   - 将你的 1024x1024 PNG 图标文件命名为 `icon-source.png`
   - 放置在 `src-tauri/icons/` 目录下

3. 运行脚本：
```bash
pnpm run generate-icons
```

## 生成的文件

脚本会自动生成以下文件：

### PNG 图标
- `32x32.png` - 32x32 像素
- `128x128.png` - 128x128 像素
- `128x128@2x.png` - 256x256 像素（高分辨率）
- `icon.png` - 512x512 像素（主图标）

### Windows Store Logos
- `Square30x30Logo.png`
- `Square44x44Logo.png`
- `Square71x71Logo.png`
- `Square89x89Logo.png`
- `Square107x107Logo.png`
- `Square142x142Logo.png`
- `Square150x150Logo.png`
- `Square284x284Logo.png`
- `Square310x310Logo.png`
- `StoreLogo.png`

### 平台特定格式
- `icon.ico` - Windows 图标（包含多个尺寸）
- `icon.icns` - macOS 图标（包含多个尺寸）

## 注意事项

- 源图标必须是 1024x1024 像素的 PNG 格式
- 建议使用透明背景的图标
- 脚本会自动保持图标的宽高比
