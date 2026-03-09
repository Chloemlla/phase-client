import { useState, useEffect } from "react";
import {
  Card,
  Button,
  Body1,
  Caption1,
  Divider,
  Spinner,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Input,
  MessageBar,
  MessageBarBody,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import {
  Key24Regular,
  Add24Regular,
  Delete24Regular,
  Shield24Regular,
} from "@fluentui/react-icons";
import {
  isWebAuthnSupported,
  registerHardwareKey,
  getStoredCredentials,
  removeCredential,
  type WebAuthnCredential,
  type WebAuthnRegistrationOptions,
} from "../../lib/webauthn";

const useStyles = makeStyles({
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
  keyList: {
    display: "flex",
    flexDirection: "column",
    gap: "0",
  },
  keyItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
  },
  keyInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  dialogContent: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  warningBox: {
    padding: "12px",
    backgroundColor: tokens.colorPaletteYellowBackground2,
    borderRadius: "8px",
    border: `1px solid ${tokens.colorPaletteYellowBorder2}`,
  },
});

interface HardwareKeyManagerProps {
  serverUrl: string;
  jwt: string;
  instanceToken?: string;
}

export function HardwareKeyManager({ serverUrl, jwt, instanceToken }: HardwareKeyManagerProps) {
  const styles = useStyles();
  const [credentials, setCredentials] = useState<WebAuthnCredential[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = () => {
    setCredentials(getStoredCredentials());
  };

  const handleAddKey = async () => {
    if (!keyName.trim()) {
      setError("Please enter a name for your hardware key");
      return;
    }

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      // Request registration options from server
      const response = await fetch(`${serverUrl}/api/v1/webauthn/register/begin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
          ...(instanceToken ? { "X-Instance-Token": instanceToken } : {}),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to start registration");
      }

      const options: WebAuthnRegistrationOptions = await response.json();

      // Register with hardware key
      const { credentialId, attestation } = await registerHardwareKey(options, keyName);

      // Send attestation to server
      const verifyResponse = await fetch(`${serverUrl}/api/v1/webauthn/register/finish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
          ...(instanceToken ? { "X-Instance-Token": instanceToken } : {}),
        },
        body: JSON.stringify({
          credentialId,
          attestation,
          name: keyName,
        }),
      });

      if (!verifyResponse.ok) {
        throw new Error("Failed to verify registration");
      }

      setSuccess("Hardware key registered successfully!");
      setKeyName("");
      setIsAddDialogOpen(false);
      loadCredentials();
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: any) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const handleRemoveKey = async (credentialId: string) => {
    setBusy(true);
    setError("");

    try {
      // Remove from server
      const response = await fetch(`${serverUrl}/api/v1/webauthn/credentials/${credentialId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${jwt}`,
          ...(instanceToken ? { "X-Instance-Token": instanceToken } : {}),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to remove hardware key");
      }

      // Remove from local storage
      removeCredential(credentialId);
      loadCredentials();
      setSuccess("Hardware key removed successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: any) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  if (!isWebAuthnSupported()) {
    return (
      <Card>
        <div className={styles.row}>
          <div className={styles.rowLeft}>
            <Shield24Regular className={styles.rowIcon} />
            <div className={styles.rowText}>
              <Body1 className={styles.rowLabel}>Hardware Keys</Body1>
              <Caption1 className={styles.rowDesc}>
                WebAuthn is not supported in this browser
              </Caption1>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <div className={styles.row}>
          <div className={styles.rowLeft}>
            <Key24Regular className={styles.rowIcon} />
            <div className={styles.rowText}>
              <Body1 className={styles.rowLabel}>Hardware Keys (YubiKey)</Body1>
              <Caption1 className={styles.rowDesc}>
                Use hardware security keys for two-factor authentication
              </Caption1>
            </div>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={(_, data) => setIsAddDialogOpen(data.open)}>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="subtle" size="small" icon={<Add24Regular />}>
                Add Key
              </Button>
            </DialogTrigger>
            <DialogSurface>
              <DialogBody>
                <DialogTitle>Add Hardware Key</DialogTitle>
                <DialogContent className={styles.dialogContent}>
                  <div className={styles.warningBox}>
                    <Caption1>
                      <Shield24Regular style={{ verticalAlign: "middle", marginRight: "4px" }} />
                      Insert your hardware key (YubiKey, etc.) and follow the prompts
                    </Caption1>
                  </div>
                  {error && (
                    <MessageBar intent="error">
                      <MessageBarBody>{error}</MessageBarBody>
                    </MessageBar>
                  )}
                  <Input
                    placeholder="Key name (e.g., YubiKey 5C)"
                    value={keyName}
                    onChange={(_, d) => setKeyName(d.value)}
                    disabled={busy}
                  />
                </DialogContent>
                <DialogActions>
                  <Button appearance="secondary" onClick={() => setIsAddDialogOpen(false)} disabled={busy}>
                    Cancel
                  </Button>
                  <Button appearance="primary" onClick={handleAddKey} disabled={busy || !keyName.trim()}>
                    {busy ? <Spinner size="tiny" /> : "Register Key"}
                  </Button>
                </DialogActions>
              </DialogBody>
            </DialogSurface>
          </Dialog>
        </div>

        {success && (
          <>
            <Divider />
            <div style={{ padding: "12px 16px" }}>
              <MessageBar intent="success">
                <MessageBarBody>{success}</MessageBarBody>
              </MessageBar>
            </div>
          </>
        )}

        {credentials.length > 0 && (
          <>
            <Divider />
            <div className={styles.keyList}>
              {credentials.map((cred, idx) => (
                <div key={cred.id}>
                  {idx > 0 && <Divider />}
                  <div className={styles.keyItem}>
                    <div className={styles.keyInfo}>
                      <Key24Regular className={styles.rowIcon} />
                      <div className={styles.rowText}>
                        <Body1 className={styles.rowLabel}>{cred.name}</Body1>
                        <Caption1 className={styles.rowDesc}>
                          Added {new Date(cred.createdAt).toLocaleDateString()}
                        </Caption1>
                      </div>
                    </div>
                    <Button
                      appearance="subtle"
                      size="small"
                      icon={<Delete24Regular />}
                      onClick={() => handleRemoveKey(cred.id)}
                      disabled={busy}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
    </>
  );
}
