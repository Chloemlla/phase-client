import { isMobile } from "./platform";

const BIOMETRIC_KEY = "phase.biometric.enabled";

export function hasBiometricCredential(): boolean {
  return localStorage.getItem(BIOMETRIC_KEY) === "true";
}

export function clearBiometricCredential(): void {
  localStorage.removeItem(BIOMETRIC_KEY);
}

export async function registerBiometricCredential(): Promise<void> {
  if (!isMobile) {
    throw new Error("当前平台不支持生物识别解锁");
  }

  const { checkStatus, authenticate } = await import(
    "@tauri-apps/plugin-biometric"
  );
  const status = await checkStatus();
  if (!status.isAvailable) {
    throw new Error("当前设备不支持生物识别解锁");
  }

  // Verify biometric works before marking as enabled
  await authenticate("验证生物识别以启用解锁功能", {
    allowDeviceCredential: false,
  });
  localStorage.setItem(BIOMETRIC_KEY, "true");
}

export async function verifyBiometricUnlock(): Promise<void> {
  if (!hasBiometricCredential()) {
    throw new Error("未找到生物识别凭据，请在设置中重新开启");
  }

  if (!isMobile) {
    throw new Error("当前平台不支持生物识别解锁");
  }

  const { authenticate } = await import("@tauri-apps/plugin-biometric");
  await authenticate("验证身份以解锁 Phase", {
    allowDeviceCredential: false,
  });
}
