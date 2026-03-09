import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  makeStyles,
  tokens,
  Card,
  Title3,
  Body1,
  Body2,
  Caption1,
  Button,
  Switch,
  Dropdown,
  Option,
  Divider,
  Spinner,
  Input,
  type InputOnChangeData,
} from "@fluentui/react-components";
import type { ChangeEvent, KeyboardEvent } from "react";
import {
  Person24Regular,
  ShieldLock24Regular,
  ArrowDownload24Regular,
  Laptop24Regular,
  Info24Regular,
  SignOut24Regular,
  Fingerprint24Regular,
  Timer24Regular,
  ArrowUpload24Regular,
  Globe24Regular,
  Delete24Regular,
  WeatherSunny24Regular,
  WeatherMoon24Regular,
  Desktop24Regular,
  Keyboard24Regular,
  Save24Regular,
  Trophy24Regular,
  Key24Regular,
} from "@fluentui/react-icons";
import { useAppStore } from "../../store/appStore";
import type { ThemePreference } from "../../types";
import {
  cmdLogout,
  cmdGetSessions,
  cmdDeleteSession,
  cmdTotpStopTicker,
  cmdSetSpotlightShortcut,
  cmdGetMembership,
  cmdRedeemActivationCode,
  type DeviceSession,
} from "../../lib/tauri";
import {
  registerBiometricCredential,
  clearBiometricCredential,
  hasBiometricCredential,
} from "../../lib/biometric";
import { isMobile } from "../../lib/platform";

const useStyles = makeStyles({
  container: {
    padding: "24px",
    maxWidth: "640px",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    paddingBottom: "40px",
    height: "100%",
    overflowY: "auto",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  sectionTitle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "8px",
    color: tokens.colorBrandForeground1,
  },
  card: {
    padding: "4px 0",
  },
  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    gap: "16px",
  },
  rowLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flex: 1,
    minWidth: 0,
  },
  rowIcon: {
    color: tokens.colorNeutralForeground3,
    flexShrink: 0,
  },
  rowText: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },
  rowLabel: {
    fontWeight: 600,
  },
  rowDesc: {
    color: tokens.colorNeutralForeground3,
  },
  deviceList: {
    display: "flex",
    flexDirection: "column",
    gap: "0",
  },
  deviceRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
  },
  deviceInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  currentBadge: {
    fontSize: "11px",
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    padding: "2px 8px",
    borderRadius: "4px",
    marginLeft: "8px",
  },
  dangerButton: {
    color: tokens.colorPaletteRedForeground1,
  },
  version: {
    textAlign: "center" as const,
    color: tokens.colorNeutralForeground3,
    padding: "8px",
  },
  sessionsLoading: {
    display: "flex",
    justifyContent: "center",
    padding: "16px",
  },
  redeemRow: {
    display: "flex",
    gap: "8px",
    marginTop: "12px",
    padding: "0 16px 16px 16px"
  },
});

export function SettingsPage() {
  const styles = useStyles();
  const navigate = useNavigate();
  const {
    theme,
    setTheme,
    biometricLockEnabled,
    setBiometricLockEnabled,
    serverUrl,
    sessionHandle,
    jwt,
    instanceToken,
    clearSession,
    spotlightShortcut,
    setSpotlightShortcut,
  } = useAppStore();

  const [localShortcut, setLocalShortcut] = useState(spotlightShortcut);
  const [shortcutSaved, setShortcutSaved] = useState(false);
  const [isRecordingShortcut, setIsRecordingShortcut] = useState(false);
  const [liveModifiers, setLiveModifiers] = useState("");

  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [biometricBusy, setBiometricBusy] = useState(false);

  // Membership / Activation Code
  const [membership, setMembership] = useState<{ active: boolean; expiresAt: number | null }>({ active: false, expiresAt: null });
  const [membershipLoading, setMembershipLoading] = useState(false);
  const [activationCode, setActivationCode] = useState("");
  const [redeemBusy, setRedeemBusy] = useState(false);
  const [redeemError, setRedeemError] = useState("");
  const [redeemSuccess, setRedeemSuccess] = useState("");

  // Load device list when page mounts
  useEffect(() => {
    if (!jwt) return;
    setSessionsLoading(true);
    cmdGetSessions(serverUrl, jwt, instanceToken ?? undefined)
      .then((resp) => setSessions(resp.sessions))
      .catch(console.error)
      .finally(() => setSessionsLoading(false));

    fetchMembership();
  }, [jwt, serverUrl, instanceToken]);

  const fetchMembership = async () => {
    if (!jwt) return;
    setMembershipLoading(true);
    try {
      const data = await cmdGetMembership(serverUrl, jwt, instanceToken ?? undefined);
      setMembership({ active: data.active, expiresAt: data.expiresAt });
    } catch (e) {
      console.error("Failed to fetch membership:", e);
    } finally {
      setMembershipLoading(false);
    }
  };

  const handleRedeemCode = async () => {
    if (!activationCode.trim() || !jwt) return;
    setRedeemBusy(true);
    setRedeemError("");
    setRedeemSuccess("");
    try {
      const data = await cmdRedeemActivationCode(serverUrl, jwt, instanceToken ?? undefined, activationCode);
      setRedeemSuccess(`Success! Added ${data.membershipDaysAdded} days.`);
      setActivationCode("");
      fetchMembership();
      setTimeout(() => setRedeemSuccess(""), 5000);
    } catch (e: any) {
      setRedeemError(String(e));
    } finally {
      setRedeemBusy(false);
    }
  };

  const handleLogout = async () => {
    setLogoutBusy(true);
    try {
      await cmdTotpStopTicker();
      if (sessionHandle && jwt) {
        await cmdLogout(serverUrl, jwt, instanceToken ?? undefined, sessionHandle);
      }
    } catch (e) {
      console.error("Logout error:", e);
    } finally {
      clearSession();
      setLogoutBusy(false);
      navigate("/setup", { replace: true });
    }
  };

  const handleBiometricToggle = async (_ev: unknown, data: { checked: boolean }) => {
    const enabled = Boolean(data.checked);
    setBiometricBusy(true);
    try {
      if (enabled) {
        await registerBiometricCredential();
        setBiometricLockEnabled(true);
      } else {
        clearBiometricCredential();
        setBiometricLockEnabled(false);
      }
    } catch (e) {
      console.error("Biometric setup error:", e);
      if (!enabled) {
        clearBiometricCredential();
      }
      setBiometricLockEnabled(false);
    } finally {
      setBiometricBusy(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!jwt) return;
    try {
      await cmdDeleteSession(serverUrl, jwt, instanceToken ?? undefined, sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (e) {
      console.error("Revoke session error:", e);
    }
  };

  const handleShortcutSave = async () => {
    try {
      if (localShortcut.trim() !== "") {
        await cmdSetSpotlightShortcut(spotlightShortcut, localShortcut.trim());
        setSpotlightShortcut(localShortcut.trim());
        setShortcutSaved(true);
        setTimeout(() => setShortcutSaved(false), 2000);
      }
    } catch (e) {
      console.error("Failed to set shortcut:", e);
      // Revert if invalid
      setLocalShortcut(spotlightShortcut);
    }
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className={styles.container}
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
    >
      <motion.div variants={sectionVariants} transition={{ duration: 0.18 }}>
        <Title3>Settings</Title3>
      </motion.div>

      {/* Account */}
      <motion.div className={styles.section} variants={sectionVariants} transition={{ duration: 0.18 }}>
        <div className={styles.sectionTitle}>
          <Person24Regular />
          <Body2>Account</Body2>
        </div>
        <Card className={styles.card}>
          <div className={styles.row}>
            <div className={styles.rowLeft}>
              <Globe24Regular className={styles.rowIcon} />
              <div className={styles.rowText}>
                <Body1 className={styles.rowLabel}>Server</Body1>
                <Caption1 className={styles.rowDesc}>
                  {serverUrl}
                </Caption1>
              </div>
            </div>
          </div>
          <Divider />
          <div className={styles.row}>
            <div className={styles.rowLeft}>
              <Trophy24Regular className={styles.rowIcon} />
              <div className={styles.rowText}>
                <Body1 className={styles.rowLabel}>Membership</Body1>
                <Caption1 className={styles.rowDesc} style={{ color: membership.active ? tokens.colorPaletteGreenForeground1 : tokens.colorNeutralForeground3 }}>
                  {membershipLoading ? "Loading..." : (membership.active ? `Active until ${new Date(membership.expiresAt! * 1000).toLocaleDateString()}` : "Inactive")}
                </Caption1>
              </div>
            </div>
          </div>
          <div className={styles.redeemRow}>
            <Input
              placeholder="Enter activation code"
              value={activationCode}
              onChange={(_e: ChangeEvent<HTMLInputElement>, d: InputOnChangeData) => setActivationCode(d.value)}
              contentBefore={<Key24Regular />}
              style={{ flex: 1 }}
            />
            <Button
              appearance="primary"
              onClick={handleRedeemCode}
              disabled={redeemBusy || !activationCode.trim()}
            >
              {redeemBusy ? <Spinner size="tiny" /> : "Redeem"}
            </Button>
          </div>
          {(redeemError || redeemSuccess) && (
            <div style={{ padding: "0 16px 16px 16px" }}>
              <Caption1 style={{ color: redeemError ? tokens.colorPaletteRedForeground1 : tokens.colorPaletteGreenForeground1 }}>
                {redeemError || redeemSuccess}
              </Caption1>
            </div>
          )}
          <Divider />
          <div className={styles.row}>
            <div className={styles.rowLeft}>
              <SignOut24Regular className={styles.rowIcon} />
              <div className={styles.rowText}>
                <Body1 className={styles.rowLabel}>Sign out</Body1>
                <Caption1 className={styles.rowDesc}>
                  Lock vault and return to setup
                </Caption1>
              </div>
            </div>
            <Button
              appearance="subtle"
              size="small"
              onClick={handleLogout}
              disabled={logoutBusy}
            >
              {logoutBusy ? <Spinner size="tiny" /> : "Sign out"}
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Preferences — desktop only */}
      {!isMobile && (
      <motion.div className={styles.section} variants={sectionVariants} transition={{ duration: 0.18 }}>
        <div className={styles.sectionTitle}>
          <Keyboard24Regular />
          <Body2>Preferences</Body2>
        </div>
        <Card className={styles.card}>
          <div className={styles.row}>
            <div className={styles.rowLeft}>
              <Keyboard24Regular className={styles.rowIcon} />
              <div className={styles.rowText}>
                <Body1 className={styles.rowLabel}>Spotlight shortcut</Body1>
                <Caption1 className={styles.rowDesc}>
                  Global shortcut to open 2FA quick search
                </Caption1>
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <Input
                value={isRecordingShortcut ? (liveModifiers || "Listening...") : localShortcut}
                onFocus={() => {
                  setIsRecordingShortcut(true);
                  setLiveModifiers("");
                  // Unregister the real global shortcut while recording to prevent it from firing.
                  // Register a harmless F24 placeholder so the command doesn't fail.
                  cmdSetSpotlightShortcut(spotlightShortcut, "F24").catch(() => { });
                }}
                onBlur={() => {
                  setIsRecordingShortcut(false);
                  setLiveModifiers("");
                  // Re-register the current shortcut when leaving recording mode
                  cmdSetSpotlightShortcut("F24", spotlightShortcut).catch(console.error);
                }}
                onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                  if (!isRecordingShortcut) return;
                  e.preventDefault();
                  e.stopPropagation();

                  if (e.key === "Escape") {
                    setIsRecordingShortcut(false);
                    setLiveModifiers("");
                    (e.target as HTMLInputElement).blur();
                    return;
                  }

                  // Show live modifiers as they're pressed
                  if (["Shift", "Control", "Alt", "Meta"].includes(e.key)) {
                    const parts = [];
                    if (e.metaKey || e.ctrlKey) parts.push("Ctrl");
                    if (e.altKey) parts.push("Alt");
                    if (e.shiftKey) parts.push("Shift");
                    setLiveModifiers(parts.length > 0 ? parts.join("+") + "+" : "");
                    return;
                  }

                  let keys = [];
                  if (e.metaKey || e.ctrlKey) keys.push("Ctrl"); // Tauri uses Ctrl for both win/cmd
                  if (e.altKey) keys.push("Alt");
                  if (e.shiftKey) keys.push("Shift");

                  // Convert key to uppercase letter or named keys
                  const rawKey = e.key.toUpperCase();
                  keys.push(rawKey);

                  const generated = keys.join("+");
                  setLocalShortcut(generated);
                  setShortcutSaved(false);
                  setIsRecordingShortcut(false);
                  setLiveModifiers("");

                  // Blurring the input after listening completes
                  (e.target as HTMLInputElement).blur();
                }}
                onKeyUp={(e: KeyboardEvent<HTMLInputElement>) => {
                  if (!isRecordingShortcut) return;
                  // Update live modifiers when a modifier is released
                  const parts = [];
                  if (e.metaKey || e.ctrlKey) parts.push("Ctrl");
                  if (e.altKey) parts.push("Alt");
                  if (e.shiftKey) parts.push("Shift");
                  setLiveModifiers(parts.length > 0 ? parts.join("+") + "+" : "");
                }}
                readOnly // Block normal typing
                placeholder="Click to set"
                style={{ width: "140px" }}
              />
              <Button
                appearance="subtle"
                icon={<Save24Regular />}
                onClick={handleShortcutSave}
                disabled={localShortcut === spotlightShortcut || shortcutSaved || isRecordingShortcut}
              >
                {shortcutSaved ? "Saved" : "Save"}
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
      )}

      {/* Appearance */}
      <motion.div className={styles.section} variants={sectionVariants} transition={{ duration: 0.18 }}>
        <div className={styles.sectionTitle}>
          <WeatherSunny24Regular />
          <Body2>Appearance</Body2>
        </div>
        <Card className={styles.card}>
          <div className={styles.row}>
            <div className={styles.rowLeft}>
              {theme === "dark" ? (
                <WeatherMoon24Regular className={styles.rowIcon} />
              ) : theme === "light" ? (
                <WeatherSunny24Regular className={styles.rowIcon} />
              ) : (
                <Desktop24Regular className={styles.rowIcon} />
              )}
              <div className={styles.rowText}>
                <Body1 className={styles.rowLabel}>Theme</Body1>
                <Caption1 className={styles.rowDesc}>
                  Choose light, dark, or follow system setting
                </Caption1>
              </div>
            </div>
            <Dropdown
              value={
                theme === "system"
                  ? "Follow system"
                  : theme === "light"
                    ? "Light"
                    : "Dark"
              }
              onOptionSelect={(_: any, data: any) =>
                setTheme((data.optionValue as ThemePreference) ?? "system")
              }
              style={{ minWidth: "130px" }}
            >
              <Option value="system">Follow system</Option>
              <Option value="light">Light</Option>
              <Option value="dark">Dark</Option>
            </Dropdown>
          </div>
        </Card>
      </motion.div>

      {/* Security */}
      <motion.div className={styles.section} variants={sectionVariants} transition={{ duration: 0.18 }}>
        <div className={styles.sectionTitle}>
          <ShieldLock24Regular />
          <Body2>Security</Body2>
        </div>
        <Card className={styles.card}>
          {isMobile && (<>
          <div className={styles.row}>
            <div className={styles.rowLeft}>
              <Fingerprint24Regular className={styles.rowIcon} />
              <div className={styles.rowText}>
                <Body1 className={styles.rowLabel}>Biometric unlock</Body1>
                <Caption1 className={styles.rowDesc}>
                  Use device biometrics to unlock when app returns to foreground
                </Caption1>
              </div>
            </div>
            <Switch
              checked={biometricLockEnabled && hasBiometricCredential()}
              onChange={handleBiometricToggle}
              disabled={biometricBusy}
            />
          </div>
          <Divider />
          </>)}
          <div className={styles.row}>
            <div className={styles.rowLeft}>
              <Timer24Regular className={styles.rowIcon} />
              <div className={styles.rowText}>
                <Body1 className={styles.rowLabel}>Auto-lock timeout</Body1>
                <Caption1 className={styles.rowDesc}>
                  Automatically lock vault after inactivity
                </Caption1>
              </div>
            </div>
            <Dropdown
              defaultValue="5 minutes"
              style={{ minWidth: "120px" }}
            >
              <Option>1 minute</Option>
              <Option>5 minutes</Option>
              <Option>15 minutes</Option>
              <Option>30 minutes</Option>
              <Option>Never</Option>
            </Dropdown>
          </div>
        </Card>
      </motion.div>

      {/* Data */}
      <motion.div className={styles.section} variants={sectionVariants} transition={{ duration: 0.18 }}>
        <div className={styles.sectionTitle}>
          <ArrowDownload24Regular />
          <Body2>Data</Body2>
        </div>
        <Card className={styles.card}>
          <div className={styles.row}>
            <div className={styles.rowLeft}>
              <ArrowUpload24Regular className={styles.rowIcon} />
              <div className={styles.rowText}>
                <Body1 className={styles.rowLabel}>Import tokens</Body1>
                <Caption1 className={styles.rowDesc}>
                  Import from Google Authenticator, Aegis, 2FAS, or otpauth://
                </Caption1>
              </div>
            </div>
            <Button appearance="subtle" size="small">
              Import
            </Button>
          </div>
          <Divider />
          <div className={styles.row}>
            <div className={styles.rowLeft}>
              <ArrowDownload24Regular className={styles.rowIcon} />
              <div className={styles.rowText}>
                <Body1 className={styles.rowLabel}>Export backup</Body1>
                <Caption1 className={styles.rowDesc}>
                  Export encrypted .phase backup file
                </Caption1>
              </div>
            </div>
            <Button appearance="subtle" size="small">
              Export
            </Button>
          </div>
          <Divider />
          <div className={styles.row}>
            <div className={styles.rowLeft}>
              <Delete24Regular className={styles.rowIcon} />
              <div className={styles.rowText}>
                <Body1 className={styles.rowLabel}>Delete all data</Body1>
                <Caption1 className={styles.rowDesc}>
                  Permanently delete your vault and account
                </Caption1>
              </div>
            </div>
            <Button
              appearance="subtle"
              size="small"
              className={styles.dangerButton}
            >
              Delete
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Device Management */}
      <motion.div className={styles.section} variants={sectionVariants} transition={{ duration: 0.18 }}>
        <div className={styles.sectionTitle}>
          <Laptop24Regular />
          <Body2>Device Management</Body2>
        </div>
        <Card className={styles.card}>
          <div className={styles.row}>
            <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
              Core UX uses device-based security. Session data below is advanced/debug information.
            </Caption1>
          </div>
          <Divider />
          {sessionsLoading ? (
            <div className={styles.sessionsLoading}>
              <Spinner size="small" label="Loading devices..." />
            </div>
          ) : sessions.length === 0 ? (
            <div className={styles.row}>
              <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
                No devices found
              </Caption1>
            </div>
          ) : (
            <div className={styles.deviceList}>
              {sessions.map((session, idx) => (
                <div key={session.id}>
                  {idx > 0 && <Divider />}
                  <div className={styles.deviceRow}>
                    <div className={styles.deviceInfo}>
                      <Laptop24Regular className={styles.rowIcon} />
                      <div className={styles.rowText}>
                        <Body1 className={styles.rowLabel}>
                          {session.deviceName}
                          {session.isCurrent && (
                            <span className={styles.currentBadge}>Current</span>
                          )}
                        </Body1>
                        <Caption1 className={styles.rowDesc}>
                          {new Date(session.lastUsedAt * 1000).toLocaleString()}
                        </Caption1>
                      </div>
                    </div>
                    {!session.isCurrent && (
                      <Button
                        appearance="subtle"
                        size="small"
                        onClick={() => handleRevokeSession(session.id)}
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </motion.div>

      {/* About */}
      <motion.div className={styles.section} variants={sectionVariants} transition={{ duration: 0.18 }}>
        <div className={styles.sectionTitle}>
          <Info24Regular />
          <Body2>About</Body2>
        </div>
        <Card className={styles.card}>
          <div className={styles.row}>
            <div className={styles.rowLeft}>
              <div className={styles.rowText}>
                <Body1 className={styles.rowLabel}>Phase</Body1>
                <Caption1 className={styles.rowDesc}>
                  Version 0.1.0 &middot; Self-hosted E2E encrypted 2FA manager
                </Caption1>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div variants={sectionVariants} transition={{ duration: 0.18 }}>
        <Caption1 className={styles.version}>Phase v0.1.0</Caption1>
      </motion.div>
    </motion.div>
  );
}
