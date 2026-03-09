# Phase Client

[English](./README.md)

一个使用 Tauri、React 和 TypeScript 构建的现代跨平台桌面和移动应用程序。

## 特性

- 🚀 跨平台支持（Windows、macOS、Linux、Android、iOS）
- ⚡ 使用 Tauri 构建轻量级高性能原生应用
- 🎨 采用 Fluent Design System 的现代化 UI
- 🔒 安全且注重隐私的架构
- 📱 适配桌面和移动端的响应式设计

## 技术栈

- **前端**: React 19 + TypeScript + Vite
- **UI 框架**: Fluent UI (React Components)
- **桌面运行时**: Tauri 2.x
- **状态管理**: Zustand
- **路由**: React Router v7
- **动画**: Framer Motion

## 前置要求

- Node.js 22+
- pnpm 9+
- Rust（最新稳定版）
- 平台特定依赖：
  - **Windows**: Visual Studio Build Tools
  - **macOS**: Xcode Command Line Tools
  - **Linux**: WebKit2GTK、librsvg2、patchelf、libssl、libgtk-3
  - **Android**: JDK 17、Android SDK、NDK
  - **iOS**: Xcode

## 开发

```bash
# 安装依赖
pnpm install

# 在开发模式下运行桌面应用
pnpm tauri dev

# 初始化 Android 项目
pnpm tauri android init

# 运行 Android 应用
pnpm tauri android dev

# 初始化 iOS 项目
pnpm tauri ios init

# 运行 iOS 应用
pnpm tauri ios dev
```

## 构建

### 桌面端

```bash
# 为当前平台构建
pnpm tauri build

# 为特定目标构建
pnpm tauri build --target <target>
```

### Android

```bash
# 构建 APK（调试版）
pnpm tauri android build

# 构建 APK（发布版）
pnpm tauri android build --release
```

### iOS

```bash
# 为模拟器构建
pnpm tauri ios build --target aarch64-sim

# 为设备构建（需要签名）
pnpm tauri ios build
```

## 项目结构

```
phase-client/
├── src/                  # React 前端源码
├── src-tauri/           # Tauri 后端（Rust）
├── scripts/             # 构建和设置脚本
├── .github/workflows/   # CI/CD 工作流
└── public/              # 静态资源
```

## CI/CD

项目使用 GitHub Actions 进行自动化构建：
- Windows、macOS 和 Linux 的桌面构建
- 带签名的 Android APK 构建
- iOS 模拟器构建

## 贡献者

**主要贡献者**: [@Chloemlla](https://github.com/Chloemlla)

## 许可证

本项目为私有和专有项目。

## 推荐的 IDE 设置

- [VS Code](https://code.visualstudio.com/)
- 扩展：
  - [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
  - [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
  - [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
