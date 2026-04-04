import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Badge from "../../components/Badge";
import Card from "../../components/Card";
import QuantityEditor from "../../components/QuantityEditor";
import RowItem from "../../components/RowItem";
import Screen from "../../components/Screen";
import SectionHeader from "../../components/SectionHeader";
import { colors, radii } from "../../theme";
import { formatCurrency } from "../../utils/currency";

export default function PlansScreen({
  monthlyEstimate,
  planPaused,
  setPlanPaused,
  totalLiters,
  weeklyPlan,
  onAdjustQuantity,
  onToggleDay
}) {
  return (
    <Screen>
      <SectionHeader
        eyebrow="Plan studio"
        title="Control each day in seconds"
        caption="The app works on both iOS and Android without depending on a navigation library for the core flow."
      />

      <Card style={styles.summaryCard}>
        <Badge tone={planPaused ? "warning" : "success"}>
          {planPaused ? "Plan paused" : "Plan active"}
        </Badge>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryValue}>{totalLiters.toFixed(1)} L</Text>
          <Text style={styles.summaryLabel}>weekly quantity</Text>
        </View>
        <RowItem label="Estimated month" value={formatCurrency(monthlyEstimate)} />
        <Pressable onPress={() => setPlanPaused((value) => !value)} style={styles.pauseButton}>
          <Text style={styles.pauseButtonLabel}>
            {planPaused ? "Resume subscription" : "Pause for 3 days"}
          </Text>
        </Pressable>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Weekly schedule</Text>
        <View style={styles.dayList}>
          {weeklyPlan.map((day) => (
            <View key={day.key} style={styles.dayRow}>
              <Pressable onPress={() => onToggleDay(day.key)} style={styles.dayToggle}>
                <View style={[styles.dayDot, day.active && styles.dayDotActive]} />
                <View>
                  <Text style={styles.dayLabel}>{day.label}</Text>
                  <Text style={styles.dayStatus}>{day.active ? "Scheduled" : "Skipped"}</Text>
                </View>
              </Pressable>
              <QuantityEditor
                disabled={!day.active}
                quantity={day.quantity}
                onDecrease={() => onAdjustQuantity(day.key, -0.5)}
                onIncrease={() => onAdjustQuantity(day.key, 0.5)}
              />
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Plan notes</Text>
        <View style={styles.noteList}>
          <View style={styles.noteCard}>
            <Text style={styles.noteTitle}>Festival mode</Text>
            <Text style={styles.noteBody}>Double Friday and Saturday quantity when guests are over.</Text>
          </View>
          <View style={styles.noteCard}>
            <Text style={styles.noteTitle}>Delivery override</Text>
            <Text style={styles.noteBody}>Route Sunday milk to your parents’ address with one tap.</Text>
          </View>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    gap: 14
  },
  summaryRow: {
    gap: 4
  },
  summaryValue: {
    fontSize: 36,
    lineHeight: 40,
    fontWeight: "900",
    color: colors.ink
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.muted
  },
  pauseButton: {
    backgroundColor: colors.accentSoft,
    borderRadius: radii.pill,
    alignItems: "center",
    paddingVertical: 14
  },
  pauseButtonLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.accentStrong
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.ink,
    marginBottom: 14
  },
  dayList: {
    gap: 14
  },
  dayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center"
  },
  dayToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1
  },
  dayDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.overlay
  },
  dayDotActive: {
    backgroundColor: colors.success
  },
  dayLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.ink
  },
  dayStatus: {
    fontSize: 12,
    color: colors.muted
  },
  noteList: {
    gap: 12
  },
  noteCard: {
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
    padding: 14,
    gap: 6
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.ink
  },
  noteBody: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted
  }
});
