import { StyleSheet } from "react-native";
import { colors, radii, shadows, spacing } from "../../theme";

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  shell: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm
  },
  loaderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  header: {
    marginBottom: spacing.md
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
    alignItems: "center"
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1
  },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted
  },
  backLabel: {
    fontWeight: "800",
    color: colors.ink
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.ink
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.muted
  },
  headerCart: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...shadows.card
  },
  headerCartLabel: {
    fontWeight: "800",
    color: colors.ink
  },
  status: {
    color: colors.muted,
    marginBottom: spacing.sm
  },
  loadingBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: spacing.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted
  },
  loadingBannerText: {
    color: colors.ink,
    fontWeight: "700"
  },
  content: {
    flex: 1
  },
  screenContent: {
    gap: spacing.md,
    paddingBottom: 28
  },
  heroCard: {
    gap: 12,
    backgroundColor: colors.surface
  },
  heroTitle: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "900",
    color: colors.ink
  },
  heroBody: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted
  },
  heroActions: {
    gap: 10
  },
  heroCaption: {
    color: colors.accentStrong,
    fontWeight: "700"
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  sectionEyebrow: {
    textTransform: "uppercase",
    letterSpacing: 1.6,
    fontSize: 11,
    fontWeight: "700",
    color: colors.muted
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.ink
  },
  stack: {
    gap: 12
  },
  productCard: {
    gap: 12
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
    alignItems: "center"
  },
  flexOne: {
    flex: 1
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.ink
  },
  cardBody: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted
  },
  linkText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.accentStrong,
    fontWeight: "700"
  },
  cardBodyCentered: {
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted
  },
  priceLabel: {
    fontSize: 16,
    fontWeight: "900",
    color: colors.ink
  },
  inlineStepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  stepperValue: {
    minWidth: 24,
    textAlign: "center",
    fontWeight: "800",
    color: colors.ink
  },
  smallPillButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted
  },
  smallPillLabel: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.ink
  },
  fieldWrap: {
    gap: 6
  },
  compactFieldWrap: {
    gap: 4
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.ink
  },
  compactFieldLabel: {
    fontSize: 12
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: colors.surface
  },
  compactFieldInput: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13
  },
  calendarFieldInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: colors.surface,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  calendarFieldValue: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700"
  },
  calendarFieldHint: {
    color: colors.accentStrong,
    fontSize: 12,
    fontWeight: "800"
  },
  selectCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: 14,
    backgroundColor: colors.card,
    gap: 6
  },
  selectCardActive: {
    borderColor: colors.accentStrong,
    backgroundColor: colors.accentSoft
  },
  inlineGhost: {
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 10,
    marginBottom: 10
  },
  inlineGhostLabel: {
    color: colors.ink,
    fontWeight: "800"
  },
  summaryBox: {
    marginTop: 12,
    marginBottom: 12,
    padding: 14,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
    flexDirection: "row",
    justifyContent: "space-between"
  },
  tabRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  tabButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted
  },
  tabButtonActive: {
    backgroundColor: colors.accent
  },
  tabLabel: {
    fontWeight: "800",
    color: colors.ink
  },
  tabLabelActive: {
    color: "#FFFFFF"
  },
  listRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10
  },
  innerCard: {
    backgroundColor: colors.surfaceMuted
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
    marginBottom: 12
  },
  calendarWeekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 10
  },
  calendarWeekLabel: {
    width: `${100 / 7}%`,
    textAlign: "center",
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700"
  },
  calendarMonthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16
  },
  calendarPickerDay: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14
  },
  calendarPickerDayActive: {
    backgroundColor: colors.accent
  },
  calendarPickerDayLabel: {
    color: colors.ink,
    fontWeight: "700"
  },
  calendarPickerDayLabelActive: {
    color: "#FFFFFF"
  },
  calendarPickerEmpty: {
    width: `${100 / 7}%`,
    aspectRatio: 1
  },
  calendarDay: {
    width: "22%",
    minWidth: 68,
    borderRadius: radii.md,
    paddingVertical: 14,
    paddingHorizontal: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    gap: 4
  },
  calendarDayMuted: {
    opacity: 0.55
  },
  calendarDate: {
    fontSize: 16,
    fontWeight: "900",
    color: colors.ink
  },
  calendarMeta: {
    fontSize: 12,
    color: colors.muted
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(33,22,15,0.3)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "88%",
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: 20,
    gap: 14
  },
  modalScroll: {
    flexGrow: 0
  },
  locationPickerWrap: {
    gap: 10
  },
  mapCard: {
    height: 130,
    borderRadius: radii.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border
  },
  mapView: {
    flex: 1
  },
  mapHint: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted
  },
  mapRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center"
  },
  successCard: {
    width: "100%",
    maxWidth: 360,
    maxHeight: "80%",
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: 24,
    gap: 10,
    alignItems: "center",
    ...shadows.card
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.successSoft,
    alignItems: "center",
    justifyContent: "center"
  },
  successCheck: {
    fontSize: 34,
    fontWeight: "900",
    color: colors.success
  },
  toastLayer: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.xl
  },
  toastCard: {
    borderRadius: radii.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...shadows.card
  },
  toastInfo: {
    backgroundColor: colors.surface
  },
  toastSuccess: {
    backgroundColor: colors.successSoft
  },
  toastError: {
    backgroundColor: colors.accentSoft
  },
  toastText: {
    color: colors.ink,
    fontWeight: "700"
  }
});
