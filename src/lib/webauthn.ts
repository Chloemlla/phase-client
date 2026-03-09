// WebAuthn / Hardware Key (YubiKey) Support
import { invoke } from "@tauri-apps/api/core";

export interface WebAuthnCredential {
  id: string;
  name: string;
  createdAt: number;
}

export interface WebAuthnRegistrationOptions {
  challenge: string;
  rp: {
    name: string;
    id: string;
  };
  user: {
    id: string;
    name: string;
    displayName: string;
  };
  pubKeyCredParams: Array<{
    type: string;
    alg: number;
  }>;
  timeout: number;
  attestation: string;
  authenticatorSelection?: {
    authenticatorAttachment?: string;
    requireResidentKey?: boolean;
    userVerification?: string;
  };
}

export interface WebAuthnAuthenticationOptions {
  challenge: string;
  timeout: number;
  rpId: string;
  allowCredentials: Array<{
    type: string;
    id: string;
  }>;
  userVerification: string;
}

// Register a new hardware key
export async function registerHardwareKey(
  options: WebAuthnRegistrationOptions,
  keyName: string
): Promise<{ credentialId: string; attestation: string }> {
  try {
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: base64ToArrayBuffer(options.challenge),
        rp: options.rp,
        user: {
          id: base64ToArrayBuffer(options.user.id),
          name: options.user.name,
          displayName: options.user.displayName,
        },
        pubKeyCredParams: options.pubKeyCredParams.map((p) => ({
          type: p.type as PublicKeyCredentialType,
          alg: p.alg,
        })),
        timeout: options.timeout,
        attestation: options.attestation as AttestationConveyancePreference,
        authenticatorSelection: options.authenticatorSelection
          ? {
              authenticatorAttachment: options.authenticatorSelection
                .authenticatorAttachment as AuthenticatorAttachment,
              requireResidentKey: options.authenticatorSelection.requireResidentKey,
              userVerification: options.authenticatorSelection
                .userVerification as UserVerificationRequirement,
            }
          : undefined,
      },
    });

    if (!credential || !(credential instanceof PublicKeyCredential)) {
      throw new Error("Failed to create credential");
    }

    const response = credential.response as AuthenticatorAttestationResponse;
    const credentialId = arrayBufferToBase64(credential.rawId);
    const attestation = arrayBufferToBase64(response.attestationObject);

    // Store credential metadata locally
    const stored = getStoredCredentials();
    stored.push({
      id: credentialId,
      name: keyName,
      createdAt: Date.now(),
    });
    localStorage.setItem("webauthn_credentials", JSON.stringify(stored));

    return { credentialId, attestation };
  } catch (error) {
    console.error("Hardware key registration failed:", error);
    throw new Error(`Failed to register hardware key: ${error}`);
  }
}

// Authenticate with hardware key
export async function authenticateWithHardwareKey(
  options: WebAuthnAuthenticationOptions
): Promise<{ credentialId: string; signature: string; authenticatorData: string; clientDataJSON: string }> {
  try {
    const credential = await navigator.credentials.get({
      publicKey: {
        challenge: base64ToArrayBuffer(options.challenge),
        timeout: options.timeout,
        rpId: options.rpId,
        allowCredentials: options.allowCredentials.map((c) => ({
          type: c.type as PublicKeyCredentialType,
          id: base64ToArrayBuffer(c.id),
        })),
        userVerification: options.userVerification as UserVerificationRequirement,
      },
    });

    if (!credential || !(credential instanceof PublicKeyCredential)) {
      throw new Error("Failed to get credential");
    }

    const response = credential.response as AuthenticatorAssertionResponse;
    const credentialId = arrayBufferToBase64(credential.rawId);
    const signature = arrayBufferToBase64(response.signature);
    const authenticatorData = arrayBufferToBase64(response.authenticatorData);
    const clientDataJSON = arrayBufferToBase64(response.clientDataJSON);

    return { credentialId, signature, authenticatorData, clientDataJSON };
  } catch (error) {
    console.error("Hardware key authentication failed:", error);
    throw new Error(`Failed to authenticate with hardware key: ${error}`);
  }
}

// Check if WebAuthn is supported
export function isWebAuthnSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    window.PublicKeyCredential !== undefined &&
    navigator.credentials !== undefined
  );
}

// Get stored credentials
export function getStoredCredentials(): WebAuthnCredential[] {
  try {
    const stored = localStorage.getItem("webauthn_credentials");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Remove a credential
export function removeCredential(credentialId: string): void {
  const stored = getStoredCredentials();
  const filtered = stored.filter((c) => c.id !== credentialId);
  localStorage.setItem("webauthn_credentials", JSON.stringify(filtered));
}

// Helper functions
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
