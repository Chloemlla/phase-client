# Phase Client

[简体中文](./README.zh-Hans.md)

A modern cross-platform desktop and mobile application built with Tauri, React, and TypeScript.

## Features

- 🚀 Cross-platform support (Windows, macOS, Linux, Android, iOS)
- ⚡ Built with Tauri for lightweight and performant native apps
- 🎨 Modern UI with Fluent Design System
- 🔒 Secure and privacy-focused architecture
- 📱 Responsive design for desktop and mobile

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **UI Framework**: Fluent UI (React Components)
- **Desktop Runtime**: Tauri 2.x
- **State Management**: Zustand
- **Routing**: React Router v7
- **Animation**: Framer Motion

## Prerequisites

- Node.js 22+
- pnpm 9+
- Rust (latest stable)
- Platform-specific dependencies:
  - **Windows**: Visual Studio Build Tools
  - **macOS**: Xcode Command Line Tools
  - **Linux**: WebKit2GTK, librsvg2, patchelf, libssl, libgtk-3
  - **Android**: JDK 17, Android SDK, NDK
  - **iOS**: Xcode

## Development

```bash
# Install dependencies
pnpm install

# Run desktop app in development mode
pnpm tauri dev

# Initialize Android project
pnpm tauri android init

# Run Android app
pnpm tauri android dev

# Initialize iOS project
pnpm tauri ios init

# Run iOS app
pnpm tauri ios dev
```

## Building

### Desktop

```bash
# Build for current platform
pnpm tauri build

# Build for specific target
pnpm tauri build --target <target>
```

### Android

```bash
# Build APK (debug)
pnpm tauri android build

# Build APK (release)
pnpm tauri android build --release
```

### iOS

```bash
# Build for simulator
pnpm tauri ios build --target aarch64-sim

# Build for device (requires signing)
pnpm tauri ios build
```

## Project Structure

```
phase-client/
├── src/                  # React frontend source
├── src-tauri/           # Tauri backend (Rust)
├── scripts/             # Build and setup scripts
├── .github/workflows/   # CI/CD workflows
└── public/              # Static assets
```

## CI/CD

The project uses GitHub Actions for automated builds:
- Desktop builds for Windows, macOS, and Linux
- Android APK builds with signing
- iOS simulator builds

## Contributors

**Main Contributor**: [@Chloemlla](https://github.com/Chloemlla)

## License

This project is private and proprietary.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/)
- Extensions:
  - [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
  - [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
  - [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
