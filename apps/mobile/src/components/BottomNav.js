import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii, shadows } from "../theme";

export default function BottomNav({ activeTab, onChange, tabs }) {
  return (
    <View style={styles.wrap}>
      {tabs.map((tab) => {
        const selected = tab.key === activeTab;

        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={[styles.item, selected && styles.itemSelected]}
          >
            <Text style={[styles.icon, selected && styles.iconSelected]}>{tab.icon}</Text>
            <Text style={[styles.label, selected && styles.labelSelected]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: 8,
    marginHorizontal: 14,
    marginBottom: 12,
    ...shadows.card
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: radii.lg
  },
  itemSelected: {
    backgroundColor: colors.accentSoft
  },
  icon: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.muted,
    marginBottom: 4
  },
  iconSelected: {
    color: colors.accentStrong
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.muted
  },
  labelSelected: {
    color: colors.ink
  }
});
