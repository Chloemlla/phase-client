import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  makeStyles,
  tokens,
  Tooltip,
  Button,
} from "@fluentui/react-components";
import {
  ShieldKeyhole24Regular,
  Key24Regular,
  Settings24Regular,
} from "@fluentui/react-icons";

const SIDEBAR_BREAKPOINT = "640px";

const useStyles = makeStyles({
  shell: {
    display: "flex",
    height: "100dvh",
    overflow: "hidden",
    // Mobile: column layout with bottom bar
    flexDirection: "column",
    [`@media (min-width: ${SIDEBAR_BREAKPOINT})`]: {
      flexDirection: "row",
    },
  },

  // Desktop sidebar
  sidebar: {
    display: "none",
    [`@media (min-width: ${SIDEBAR_BREAKPOINT})`]: {
      display: "flex",
      width: "56px",
      flexDirection: "column",
      alignItems: "center",
      paddingTop: "16px",
      gap: "4px",
      backgroundColor: tokens.colorNeutralBackground3,
      borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
      flexShrink: 0,
    },
  },

  // Mobile bottom bar
  bottomBar: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingBottom: "env(safe-area-inset-bottom, 0px)",
    backgroundColor: tokens.colorNeutralBackground3,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    flexShrink: 0,
    [`@media (min-width: ${SIDEBAR_BREAKPOINT})`]: {
      display: "none",
    },
  },

  logo: {
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    backgroundColor: tokens.colorBrandBackground,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: tokens.colorNeutralForegroundOnBrand,
    marginBottom: "16px",
    flexShrink: 0,
  },

  navButton: {
    minWidth: "unset",
    width: "40px",
    height: "40px",
    borderRadius: "8px",
  },
  navButtonActive: {
    minWidth: "unset",
    width: "40px",
    height: "40px",
    borderRadius: "8px",
    backgroundColor: tokens.colorNeutralBackground1Selected,
  },

  // Mobile nav button — taller tap target
  mobileNavButton: {
    flex: 1,
    height: "52px",
    borderRadius: "0",
    minWidth: "unset",
  },
  mobileNavButtonActive: {
    flex: 1,
    height: "52px",
    borderRadius: "0",
    minWidth: "unset",
    backgroundColor: tokens.colorNeutralBackground1Selected,
  },

  spacer: {
    flex: 1,
  },

  bottomNav: {
    marginBottom: "16px",
  },

  content: {
    flex: 1,
    overflowY: "auto",
    overflowX: "hidden",
    backgroundColor: tokens.colorNeutralBackground1,
    // Account for safe area on mobile
    paddingBottom: "env(safe-area-inset-bottom, 0px)",
    [`@media (min-width: ${SIDEBAR_BREAKPOINT})`]: {
      paddingBottom: "0",
    },
  },
});

export function AppShell() {
  const styles = useStyles();
  const navigate = useNavigate();
  const location = useLocation();

  const isTokens = location.pathname === "/" || location.pathname === "";
  const isSettings = location.pathname === "/settings";

  return (
    <div className={styles.shell}>
      {/* Desktop sidebar */}
      <nav className={styles.sidebar}>
        <div className={styles.logo}>
          <ShieldKeyhole24Regular />
        </div>

        <Tooltip content="Tokens" relationship="label" positioning="after">
          <Button
            className={isTokens ? styles.navButtonActive : styles.navButton}
            appearance="subtle"
            icon={<Key24Regular />}
            onClick={() => navigate("/")}
          />
        </Tooltip>

        <div className={styles.spacer} />

        <div className={styles.bottomNav}>
          <Tooltip content="Settings" relationship="label" positioning="after">
            <Button
              className={isSettings ? styles.navButtonActive : styles.navButton}
              appearance="subtle"
              icon={<Settings24Regular />}
              onClick={() => navigate("/settings")}
            />
          </Tooltip>
        </div>
      </nav>

      {/* Main content */}
      <main className={styles.content}>
        <Outlet />
      </main>

      {/* Mobile bottom tab bar */}
      <nav className={styles.bottomBar}>
        <Button
          className={isTokens ? styles.mobileNavButtonActive : styles.mobileNavButton}
          appearance="subtle"
          icon={<Key24Regular />}
          onClick={() => navigate("/")}
        >
          Tokens
        </Button>
        <Button
          className={isSettings ? styles.mobileNavButtonActive : styles.mobileNavButton}
          appearance="subtle"
          icon={<Settings24Regular />}
          onClick={() => navigate("/settings")}
        >
          Settings
        </Button>
      </nav>
    </div>
  );
}
