import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Badge from "../../components/Badge";
import Card from "../../components/Card";
import Screen from "../../components/Screen";
import SectionHeader from "../../components/SectionHeader";
import { colors, radii } from "../../theme";

export default function DeliveriesScreen({ deliveries }) {
  return (
    <Screen>
      <SectionHeader
        eyebrow="Drop tracker"
        title="Morning route visibility"
        caption="Customers can check what is arriving, when it is arriving, and whether a day is skipped."
      />

      <View style={styles.list}>
        {deliveries.map((delivery) => (
          <Card key={delivery.id}>
            <View style={styles.topRow}>
              <View>
                <Text style={styles.title}>{delivery.title}</Text>
                <Text style={styles.time}>{delivery.time}</Text>
              </View>
              <Badge
                tone={
                  delivery.status === "On route"
                    ? "success"
                    : delivery.status === "Skipped"
                      ? "warning"
                      : "default"
                }
              >
                {delivery.status}
              </Badge>
            </View>
            <View style={styles.meta}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Items</Text>
                <Text style={styles.metaValue}>{delivery.items}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Address</Text>
                <Text style={styles.metaValue}>{delivery.address}</Text>
              </View>
            </View>
          </Card>
        ))}
      </View>

      <Card style={styles.tipCard}>
        <Text style={styles.tipTitle}>Suggested add-on</Text>
        <Text style={styles.tipBody}>
          Bundle curd on Saturdays when demand trends higher. It keeps the delivery basket compact and improves average order value.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 14
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.ink
  },
  time: {
    marginTop: 4,
    fontSize: 13,
    color: colors.muted
  },
  meta: {
    gap: 12
  },
  metaRow: {
    gap: 6,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
    padding: 14
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    color: colors.muted
  },
  metaValue: {
    fontSize: 14,
    lineHeight: 19,
    color: colors.ink
  },
  tipCard: {
    backgroundColor: colors.surface
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.ink,
    marginBottom: 8
  },
  tipBody: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.muted
  }
});
