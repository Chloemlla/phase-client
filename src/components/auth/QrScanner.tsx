import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";
import {
    makeStyles,
    tokens,
    Body2,
    Caption1,
    Spinner,
    MessageBar,
    MessageBarBody,
} from "@fluentui/react-components";

export interface QrScanResult {
    url: string;
    token: string;
}

interface QrScannerProps {
    onScan: (result: QrScanResult) => void;
    onError?: (error: string) => void;
}

const useStyles = makeStyles({
    container: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
    },
    viewfinder: {
        width: "280px",
        height: "280px",
        borderRadius: "16px",
        overflow: "hidden",
        position: "relative" as const,
        backgroundColor: tokens.colorNeutralBackground4,
    },
    hint: {
        color: tokens.colorNeutralForeground3,
        textAlign: "center" as const,
    },
    loading: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "280px",
        width: "280px",
    },
});

/**
 * Parses a Phase QR code value.
 * Supported formats:
 *   phase://connect?url=<encoded_url>&token=<token>
 *   https://...?url=<encoded_url>&token=<token>
 *   JSON: {"url":"...","token":"..."}
 */
function parseQrValue(raw: string): QrScanResult | null {
    // Try JSON format
    try {
        const obj = JSON.parse(raw);
        if (obj.url && obj.token) {
            return { url: obj.url, token: obj.token };
        }
    } catch {
        // Not JSON, continue
    }

    // Try URL/URI format (phase://connect?url=...&token=... or https://...?url=...&token=...)
    try {
        // Replace phase:// with https:// for URL parsing
        const urlStr = raw.replace(/^phase:\/\//, "https://phase.local/");
        const url = new URL(urlStr);
        const serverUrl = url.searchParams.get("url");
        const token = url.searchParams.get("token");
        if (serverUrl && token) {
            return { url: decodeURIComponent(serverUrl), token };
        }
    } catch {
        // Not a valid URL, continue
    }

    return null;
}

export function QrScanner({ onScan, onError }: QrScannerProps) {
    const styles = useStyles();
    const viewfinderRef = useRef<HTMLDivElement>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [loading, setLoading] = useState(true);
    const [cameraError, setCameraError] = useState("");

    useEffect(() => {
        const elementId = "phase-qr-reader";
        let mounted = true;

        const startScanner = async () => {
            try {
                const scanner = new Html5Qrcode(elementId);
                scannerRef.current = scanner;

                await scanner.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: { width: 220, height: 220 },
                        aspectRatio: 1.0,
                    },
                    (decodedText) => {
                        const result = parseQrValue(decodedText);
                        if (result) {
                            // Stop scanner before calling onScan to avoid double-fire
                            scanner.stop().catch(() => { /* ignore */ });
                            onScan(result);
                        } else {
                            onError?.("Unrecognized QR code format. Please scan a Phase server QR code.");
                        }
                    },
                    () => { /* ignore per-frame errors */ }
                );

                if (mounted) setLoading(false);
            } catch (err) {
                if (mounted) {
                    setLoading(false);
                    const msg = String(err);
                    if (msg.includes("NotAllowedError") || msg.includes("Permission")) {
                        setCameraError("Camera permission denied. Please allow camera access in your system settings.");
                    } else if (msg.includes("NotFoundError") || msg.includes("no camera")) {
                        setCameraError("No camera found on this device.");
                    } else {
                        setCameraError(`Camera error: ${msg}`);
                    }
                }
            }
        };

        startScanner();

        return () => {
            mounted = false;
            const scanner = scannerRef.current;
            if (scanner) {
                try {
                    const state = scanner.getState();
                    if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
                        scanner.stop().catch(() => { /* ignore */ });
                    }
                } catch {
                    // Scanner may already be stopped
                }
                scannerRef.current = null;
            }
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className={styles.container}>
            {cameraError ? (
                <>
                    <MessageBar intent="error" style={{ maxWidth: 280 }}>
                        <MessageBarBody>{cameraError}</MessageBarBody>
                    </MessageBar>
                    <Caption1 className={styles.hint}>
                        You can manually enter the server URL and Instance Token instead.
                    </Caption1>
                </>
            ) : (
                <>
                    <div className={styles.viewfinder}>
                        {loading && (
                            <div className={styles.loading}>
                                <Spinner size="small" label="Starting camera..." />
                            </div>
                        )}
                        <div id="phase-qr-reader" ref={viewfinderRef} style={{ width: "100%", height: "100%" }} />
                    </div>
                    <Body2 className={styles.hint}>
                        Point your camera at the QR code shown on your Phase server dashboard.
                    </Body2>
                </>
            )}
        </div>
    );
}
