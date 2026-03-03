import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Input,
  Button,
  Dropdown,
  Option,
  Label,
  makeStyles,
} from "@fluentui/react-components";
import {
  Globe24Regular,
  Person24Regular,
} from "@fluentui/react-icons";
import { useAppStore } from "../../store/appStore";
import type { Token } from "../../types";

const useStyles = makeStyles({
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    paddingTop: "8px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  dangerZone: {
    marginTop: "8px",
  },
});

interface EditTokenDialogProps {
  token: Token | null;
  open: boolean;
  onClose: () => void;
}

export function EditTokenDialog({ token, open, onClose }: EditTokenDialogProps) {
  const styles = useStyles();
  const { updateToken, deleteToken, groups } = useAppStore();
  const [issuer, setIssuer] = useState("");
  const [account, setAccount] = useState("");
  const [group, setGroup] = useState("Personal");

  useEffect(() => {
    if (token) {
      setIssuer(token.issuer);
      setAccount(token.account);
      setGroup(token.group || "Personal");
    }
  }, [token]);

  const handleSave = () => {
    if (!token) return;
    updateToken(token.id, {
      issuer: issuer.trim(),
      account: account.trim(),
      group,
    });
    onClose();
  };

  const handleDelete = () => {
    if (!token) return;
    deleteToken(token.id);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Edit Token</DialogTitle>
          <DialogContent>
            <div className={styles.form}>
              <div className={styles.field}>
                <Label htmlFor="edit-issuer">Service name</Label>
                <Input
                  id="edit-issuer"
                  value={issuer}
                  onChange={(_, data) => setIssuer(data.value)}
                  contentBefore={<Globe24Regular />}
                />
              </div>
              <div className={styles.field}>
                <Label htmlFor="edit-account">Account</Label>
                <Input
                  id="edit-account"
                  value={account}
                  onChange={(_, data) => setAccount(data.value)}
                  contentBefore={<Person24Regular />}
                />
              </div>
              <div className={styles.field}>
                <Label>Group</Label>
                <Dropdown
                  value={group}
                  onOptionSelect={(_, data) =>
                    data.optionValue && setGroup(data.optionValue)
                  }
                >
                  {groups
                    .filter((g) => g !== "All")
                    .map((g) => (
                      <Option key={g} value={g}>
                        {g}
                      </Option>
                    ))}
                </Dropdown>
              </div>
              <div className={styles.dangerZone}>
                <Button
                  appearance="secondary"
                  onClick={handleDelete}
                  style={{ color: "var(--colorPaletteRedForeground1)" }}
                >
                  Delete token
                </Button>
              </div>
            </div>
          </DialogContent>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary">Cancel</Button>
            </DialogTrigger>
            <Button
              appearance="primary"
              onClick={handleSave}
              disabled={!issuer.trim() || !account.trim()}
            >
              Save
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
