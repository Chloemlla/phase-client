import { useState } from "react";
import {
  Card,
  Button,
  Body1,
  Caption1,
  Spinner,
  MessageBar,
  MessageBarBody,
  makeStyles,
  tokens,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Input,
} from "@fluentui/react-components";
import {
  ShieldError24Regular,
  ShieldCheckmark24Regular,
  Warning24Regular,
} from "@fluentui/react-icons";

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
  dialogContent: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  resultBox: {
    padding: "16px",
    borderRadius: "8px",
    border: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  breachedBox: {
    backgroundColor: tokens.colorPaletteRedBackground2,
  },
  safeBox: {
    backgroundColor: tokens.colorPaletteGreenBackground2,
  },
  resultIcon: {
    fontSize: "32px",
    marginBottom: "8px",
  },
  breachedIcon: {
    color: tokens.colorPaletteRedForeground1,
  },
  safeIcon: {
    color: tokens.colorPaletteGreenForeground1,
  },
});

// Check password against Have I Been Pwned API
async function checkPasswordBreach(password: string): Promise<{ breached: boolean; count: number }> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-1", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
    const prefix = hashHex.substring(0, 5);
    const suffix = hashHex.substring(5);

    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    if (!res.ok) {
      throw new Error("Failed to check password");
    }

    const text = await res.text();
    const lines = text.split("\n");

    for (const line of lines) {
      const [hash, countStr] = line.split(":");
      if (hash === suffix) {
        return { breached: true, count: parseInt(countStr.trim(), 10) };
      }
    }

    return { breached: false, count: 0 };
  } catch (error) {
    console.error("HIBP check failed:", error);
    throw error;
  }
}

export function PasswordBreachMonitor() {
  const styles = useStyles();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ breached: boolean; count: number } | null>(null);

  const handleCheck = async () => {
    if (!password) {
      setError("Please enter a password to check");
      return;
    }

    setBusy(true);
    setError("");
    setResult(null);

    try {
      const checkResult = await checkPasswordBreach(password);
      setResult(checkResult);
      setPassword(""); // Clear password for security
    } catch (e: any) {
      setError("Failed to check password. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleClose = () => {
    setIsDialogOpen(false);
    setPassword("");
    setError("");
    setResult(null);
  };

  return (
    <Card>
      <div className={styles.row}>
        <div className={styles.rowLeft}>
          <ShieldError24Regular className={styles.rowIcon} />
          <div className={styles.rowText}>
            <Body1 className={styles.rowLabel}>Password Breach Monitor</Body1>
            <Caption1 className={styles.rowDesc}>
              Check if your passwords have been exposed in data breaches (Have I Been Pwned)
            </Caption1>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(_, data) => setIsDialogOpen(data.open)}>
          <DialogTrigger disableButtonEnhancement>
            <Button appearance="subtle" size="small">
              Check Password
            </Button>
          </DialogTrigger>
          <DialogSurface>
            <DialogBody>
              <DialogTitle>Check Password Breach</DialogTitle>
              <DialogContent className={styles.dialogContent}>
                <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
                  <Warning24Regular style={{ verticalAlign: "middle", marginRight: "4px" }} />
                  Your password is checked securely using k-Anonymity. Only the first 5 characters of
                  the hash are sent to the API.
                </Caption1>

                {error && (
                  <MessageBar intent="error">
                    <MessageBarBody>{error}</MessageBarBody>
                  </MessageBar>
                )}

                {result && (
                  <div
                    className={`${styles.resultBox} ${
                      result.breached ? styles.breachedBox : styles.safeBox
                    }`}
                  >
                    <div style={{ textAlign: "center" }}>
                      {result.breached ? (
                        <>
                          <ShieldError24Regular
                            className={`${styles.resultIcon} ${styles.breachedIcon}`}
                          />
                          <Body1 style={{ fontWeight: 600, marginBottom: "4px" }}>
                            Password Compromised
                          </Body1>
                          <Caption1>
                            This password has been seen {result.count.toLocaleString()} times in data
                            breaches. Change it immediately!
                          </Caption1>
                        </>
                      ) : (
                        <>
                          <ShieldCheckmark24Regular
                            className={`${styles.resultIcon} ${styles.safeIcon}`}
                          />
                          <Body1 style={{ fontWeight: 600, marginBottom: "4px" }}>Password Safe</Body1>
                          <Caption1>
                            This password has not been found in any known data breaches.
                          </Caption1>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {!result && (
                  <Input
                    type="password"
                    placeholder="Enter password to check"
                    value={password}
                    onChange={(_, d) => setPassword(d.value)}
                    disabled={busy}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && password) {
                        handleCheck();
                      }
                    }}
                  />
                )}
              </DialogContent>
              <DialogActions>
                <Button appearance="secondary" onClick={handleClose}>
                  {result ? "Close" : "Cancel"}
                </Button>
                {!result && (
                  <Button
                    appearance="primary"
                    onClick={handleCheck}
                    disabled={busy || !password}
                  >
                    {busy ? <Spinner size="tiny" /> : "Check"}
                  </Button>
                )}
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      </div>
    </Card>
  );
}
