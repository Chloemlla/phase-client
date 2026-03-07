import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Card,
  Input,
  Button,
  Title1,
  Title2,
  Body2,
  Caption1,
  makeStyles,
  tokens,
  Divider,
  Spinner,
  MessageBar,
  MessageBarBody,
} from "@fluentui/react-components";
import {
  ShieldKeyhole24Regular,
  Globe24Regular,
  QrCode24Regular,
  ChevronLeft24Regular,
  Mail24Regular,
  LockClosed24Regular,
  ArrowRight24Regular,
  Link24Regular,
  Key24Regular,
} from "@fluentui/react-icons";
import { useAppStore } from "../../store/appStore";
import {
  cmdHealth,
  cmdShSetup,
  cmdShOpen,
  cmdOfflineUnlock,
  type RestoreResult,
} from "../../lib/tauri";
import type { Token } from "../../types";
import { normalizeServerUrl } from "../../lib/url";
import { QrScanner, type QrScanResult } from "./QrScanner";

type SetupView =
  | "home"
  | "cloud-login"
  | "cloud-register"
  | "selfhosted-url"
  | "qr";

const useStyles = makeStyles({
  page: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100dvh",
    overflowY: "auto",
    padding: "24px",
    backgroundColor: tokens.colorNeutralBackground2,
  },
  card: {
    width: "100%",
    maxWidth: "440px",
    padding: "40px 36px",
  },

  brand: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    marginBottom: "36px",
  },
  brandIcon: {
    width: "56px",
    height: "56px",
    borderRadius: "14px",
    background: `linear-gradient(135deg, ${tokens.colorBrandBackground} 0%, ${tokens.colorBrandBackgroundHover} 100%)`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: tokens.colorNeutralForegroundOnBrand,
    boxShadow: tokens.shadow8,
  },
  tagline: {
    color: tokens.colorNeutralForeground3,
    textAlign: "center" as const,
  },

  backButton: {
    marginBottom: "20px",
    marginLeft: "-8px",
  },

  actions: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  primaryBtn: {
    height: "52px",
    fontSize: "15px",
    fontWeight: 600,
  },
  secondaryBtn: {
    height: "44px",
  },
  qrBtn: {
    height: "40px",
    color: tokens.colorNeutralForeground3,
  },
  orDivider: {
    marginTop: "4px",
    marginBottom: "4px",
  },

  viewTitle: {
    marginBottom: "24px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  formFooter: {
    textAlign: "center" as const,
    marginTop: "8px",
  },
  switchLink: {
    cursor: "pointer",
    color: tokens.colorBrandForeground1,
    textDecoration: "underline",
    background: "none",
    border: "none",
    padding: 0,
    fontSize: "inherit",
    fontFamily: "inherit",
  },

  qrPlaceholder: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
    paddingTop: "16px",
    paddingBottom: "8px",
  },
  qrFrame: {
    width: "200px",
    height: "200px",
    border: `2px dashed ${tokens.colorNeutralStroke1}`,
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  loadingRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    height: "52px",
  },
});

export function SetupPage() {
  const styles = useStyles();
  const navigate = useNavigate();
  const {
    serverUrl,
    instanceToken: storedInstanceToken,
    deviceId: storedDeviceId,
    setServerUrl,
    setConnectionMode,
    setSession,
    setVaultData,
  } = useAppStore();
  const location = useLocation();

  const [view, setView] = useState<SetupView>("home");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Cloud fields
  const [cloudEmail, setCloudEmail] = useState("");
  const [cloudPassword, setCloudPassword] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");

  // Self-hosted fields
  const [shUrl, setShUrl] = useState(serverUrl === "https://cloud.phase.app" ? "" : serverUrl);
  const [instanceToken, setInstanceToken] = useState(storedInstanceToken ?? "");

  const goHome = () => {
    setView("home");
    setError("");
    setBusy(false);
  };

  // ── Session restore: auto-connect on startup if cached session exists ──
  useEffect(() => {
    const state = location.state as { restoreData?: RestoreResult } | null;
    if (!state?.restoreData) return;
    const restoreData = state.restoreData;

    setShUrl(normalizeServerUrl(restoreData.serverUrl));
    setInstanceToken(restoreData.instanceToken ?? "");

    setBusy(true);
    setError("");
    (async () => {
      try {
        // Try online first: health check → create session → fetch vault
        const normalizedUrl = normalizeServerUrl(restoreData.serverUrl);
        const health = await cmdHealth(normalizedUrl, restoreData.instanceToken ?? undefined);
        const result = await cmdShOpen(
          normalizedUrl,
          restoreData.instanceToken ?? "",
          health.instanceSalt,
          "",
          restoreData.deviceId ?? storedDeviceId ?? undefined
        );
        setServerUrl(normalizedUrl);
        setConnectionMode(
          restoreData.connectionMode === "self-hosted" || restoreData.connectionMode === "selfhosted"
            ? "selfhosted"
            : "cloud"
        );
        setSession(
          result.handle,
          result.jwt,
          restoreData.instanceToken,
          result.deviceId ?? restoreData.deviceId ?? storedDeviceId,
          result.vaultVersion
        );
        setVaultData(parseVaultTokens(result.vaultJson), result.vaultVersion);
        navigate("/");
      } catch {
        // Online failed — try offline unlock using cached instanceSalt
        if (restoreData.instanceToken && restoreData.instanceSalt) {
          try {
            const result = await cmdOfflineUnlock(
              restoreData.instanceToken,
              restoreData.instanceSalt
            );
            const normalizedUrl = normalizeServerUrl(restoreData.serverUrl);
            setServerUrl(normalizedUrl);
            setConnectionMode(
              restoreData.connectionMode === "self-hosted" || restoreData.connectionMode === "selfhosted"
                ? "selfhosted"
                : "cloud"
            );
            setSession(
              result.handle,
              result.jwt, // empty string in offline mode
              restoreData.instanceToken,
              restoreData.deviceId ?? storedDeviceId,
              result.vaultVersion
            );
            setVaultData(parseVaultTokens(result.vaultJson), result.vaultVersion);
            navigate("/");
            return;
          } catch (offlineErr) {
            setError(`Server unreachable and offline unlock failed: ${offlineErr}`);
            setView("selfhosted-url");
            return;
          }
        }
        setError("Server unreachable. Please check your connection.");
        setView("selfhosted-url");
      } finally {
        setBusy(false);
      }
    })();
  }, [location.state]); // eslint-disable-line react-hooks/exhaustive-deps

  function parseVaultTokens(vaultJson: string): Token[] {
    try {
      const vault = JSON.parse(vaultJson);
      return Array.isArray(vault?.tokens) ? vault.tokens : [];
    } catch {
      return [];
    }
  }

  // ── Cloud login (stub) ────────────────────────────────────────
  const handleCloudLogin = async () => {
    setError("Phase Cloud is not available in this build.");
  };

  // ── Cloud register (stub) ─────────────────────────────────────
  const handleCloudRegister = async () => {
    setError("Phase Cloud is not available in this build.");
  };

  // ── Self-hosted: verify URL + Instance Token, then auto-connect ──
  const handleConnect = async () => {
    const normalizedUrl = normalizeServerUrl(shUrl);
    if (!normalizedUrl || !instanceToken.trim()) return;
    setBusy(true);
    setError("");
    try {
      const health = await cmdHealth(normalizedUrl, instanceToken);

      const result = health.initialized
        ? await cmdShOpen(normalizedUrl, instanceToken, health.instanceSalt, "", storedDeviceId ?? undefined)
        : await cmdShSetup(normalizedUrl, instanceToken, health.instanceSalt, "");

      setServerUrl(normalizedUrl);
      setConnectionMode("selfhosted");
      setSession(result.handle, result.jwt, instanceToken, result.deviceId ?? storedDeviceId, result.vaultVersion);
      setVaultData(parseVaultTokens(result.vaultJson), result.vaultVersion);
      navigate("/");
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const BackButton = () => (
    <Button
      className={styles.backButton}
      appearance="subtle"
      icon={<ChevronLeft24Regular />}
      onClick={goHome}
    >
      Back
    </Button>
  );

  const BrandHeader = () => (
    <div className={styles.brand}>
      <div className={styles.brandIcon}>
        <ShieldKeyhole24Regular fontSize={28} />
      </div>
      <Title1>Phase</Title1>
      <Caption1 className={styles.tagline}>
        End-to-end encrypted 2FA vault
      </Caption1>
    </div>
  );

  const ErrorBar = () =>
    error ? (
      <MessageBar intent="error">
        <MessageBarBody>{error}</MessageBarBody>
      </MessageBar>
    ) : null;

  // ── Home ───────────────────────────────────────────────────
  if (view === "home") {
    return (
      <div className={styles.page}>
        <Card className={styles.card}>
          <BrandHeader />
          <div className={styles.actions}>
            <Button
              className={styles.primaryBtn}
              appearance="primary"
              size="large"
              icon={<ArrowRight24Regular />}
              iconPosition="after"
              onClick={() => setView("cloud-login")}
            >
              Connect to Phase
            </Button>

            <Divider className={styles.orDivider}>or</Divider>

            <Button
              className={styles.secondaryBtn}
              appearance="outline"
              icon={<Link24Regular />}
              onClick={() => setView("selfhosted-url")}
            >
              Connect to other server
            </Button>

            <Button
              className={styles.qrBtn}
              appearance="subtle"
              icon={<QrCode24Regular />}
              onClick={() => setView("qr")}
            >
              Scan QR code
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ── Cloud: login ───────────────────────────────────────────
  if (view === "cloud-login") {
    const canSubmit = cloudEmail.trim() && cloudPassword;
    return (
      <div className={styles.page}>
        <Card className={styles.card}>
          <BackButton />
          <Title2 className={styles.viewTitle}>Sign in to Phase</Title2>
          <div className={styles.form}>
            <ErrorBar />
            <Input
              placeholder="Email"
              type="email"
              value={cloudEmail}
              onChange={(_, d) => setCloudEmail(d.value)}
              contentBefore={<Mail24Regular />}
              size="large"
            />
            <Input
              placeholder="Password"
              type="password"
              value={cloudPassword}
              onChange={(_, d) => setCloudPassword(d.value)}
              contentBefore={<LockClosed24Regular />}
              size="large"
            />
            {busy ? (
              <div className={styles.loadingRow}>
                <Spinner size="small" label="Signing in..." />
              </div>
            ) : (
              <Button
                appearance="primary"
                size="large"
                onClick={handleCloudLogin}
                disabled={!canSubmit}
              >
                Sign in
              </Button>
            )}
            <Body2 className={styles.formFooter}>
              Don&apos;t have an account?{" "}
              <button
                className={styles.switchLink}
                onClick={() => setView("cloud-register")}
              >
                Create one
              </button>
            </Body2>
          </div>
        </Card>
      </div>
    );
  }

  // ── Cloud: register ────────────────────────────────────────
  if (view === "cloud-register") {
    const canSubmit =
      regEmail.trim() &&
      regPassword.length >= 8 &&
      regPassword === regConfirm;
    return (
      <div className={styles.page}>
        <Card className={styles.card}>
          <BackButton />
          <Title2 className={styles.viewTitle}>Create Phase account</Title2>
          <div className={styles.form}>
            <ErrorBar />
            <Input
              placeholder="Email"
              type="email"
              value={regEmail}
              onChange={(_, d) => setRegEmail(d.value)}
              contentBefore={<Mail24Regular />}
              size="large"
            />
            <Input
              placeholder="Master password (min 8 chars)"
              type="password"
              value={regPassword}
              onChange={(_, d) => setRegPassword(d.value)}
              contentBefore={<LockClosed24Regular />}
              size="large"
            />
            <Input
              placeholder="Confirm master password"
              type="password"
              value={regConfirm}
              onChange={(_, d) => setRegConfirm(d.value)}
              contentBefore={<LockClosed24Regular />}
              size="large"
            />
            {busy ? (
              <div className={styles.loadingRow}>
                <Spinner size="small" label="Creating account..." />
              </div>
            ) : (
              <Button
                appearance="primary"
                size="large"
                onClick={handleCloudRegister}
                disabled={!canSubmit}
              >
                Create account
              </Button>
            )}
            <Body2 className={styles.formFooter}>
              Already have an account?{" "}
              <button
                className={styles.switchLink}
                onClick={() => setView("cloud-login")}
              >
                Sign in
              </button>
            </Body2>
          </div>
        </Card>
      </div>
    );
  }

  // ── Self-hosted: URL + Instance Token → auto-connect ──────
  if (view === "selfhosted-url") {
    const canSubmit = Boolean(normalizeServerUrl(shUrl) && instanceToken.trim());
    return (
      <div className={styles.page}>
        <Card className={styles.card}>
          <BackButton />
          <Title2 className={styles.viewTitle}>Connect to server</Title2>
          <div className={styles.form}>
            <ErrorBar />
            <Input
              placeholder="https://phase.yourdomain.com"
              value={shUrl}
              onChange={(_, d) => setShUrl(d.value)}
              contentBefore={<Globe24Regular />}
              size="large"
            />
            <Input
              placeholder="Instance Token (from /api/v1/setup-token)"
              type="password"
              value={instanceToken}
              onChange={(_, d) => setInstanceToken(d.value)}
              contentBefore={<Key24Regular />}
              size="large"
            />
            {busy ? (
              <div className={styles.loadingRow}>
                <Spinner size="small" label="Connecting..." />
              </div>
            ) : (
              <Button
                appearance="primary"
                size="large"
                onClick={handleConnect}
                disabled={!canSubmit}
              >
                Connect
              </Button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // ── QR scan ────────────────────────────────────────────────
  if (view === "qr") {
    const handleQrScan = async (result: QrScanResult) => {
      // Auto-fill and connect
      setShUrl(result.url);
      setInstanceToken(result.token);

      const normalizedUrl = normalizeServerUrl(result.url);
      if (!normalizedUrl || !result.token.trim()) return;

      setBusy(true);
      setError("");
      try {
        const health = await cmdHealth(normalizedUrl, result.token);
        const sessionResult = health.initialized
          ? await cmdShOpen(normalizedUrl, result.token, health.instanceSalt, "", storedDeviceId ?? undefined)
          : await cmdShSetup(normalizedUrl, result.token, health.instanceSalt, "");

        setServerUrl(normalizedUrl);
        setConnectionMode("selfhosted");
        setSession(sessionResult.handle, sessionResult.jwt, result.token, sessionResult.deviceId ?? storedDeviceId, sessionResult.vaultVersion);
        setVaultData(parseVaultTokens(sessionResult.vaultJson), sessionResult.vaultVersion);
        navigate("/");
      } catch (e) {
        setError(String(e));
        setView("selfhosted-url");
      } finally {
        setBusy(false);
      }
    };

    return (
      <div className={styles.page}>
        <Card className={styles.card}>
          <BackButton />
          <Title2 className={styles.viewTitle}>Scan QR code</Title2>
          <ErrorBar />
          {busy ? (
            <div className={styles.loadingRow}>
              <Spinner size="small" label="Connecting..." />
            </div>
          ) : (
            <QrScanner
              onScan={handleQrScan}
              onError={(msg) => setError(msg)}
            />
          )}
        </Card>
      </div>
    );
  }

  return null;
}
