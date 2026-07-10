import SettingsNavigation, {
  type SettingsNavigationProps
} from "@/components/admin/settings/settings-navigation";

/** @deprecated Use SettingsNavigation directly. Kept for backward compatibility. */
export default function PublicSettingsNav(props: SettingsNavigationProps) {
  return <SettingsNavigation {...props} />;
}
