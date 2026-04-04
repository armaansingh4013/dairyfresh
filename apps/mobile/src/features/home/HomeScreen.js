import React from "react";
import { StyleSheet, Text, View } from "react-native";
import ActionButton from "../../components/ActionButton";
import Badge from "../../components/Badge";
import Card from "../../components/Card";
import MetricCard from "../../components/MetricCard";
import RowItem from "../../components/RowItem";
import Screen from "../../components/Screen";
import SectionHeader from "../../components/SectionHeader";
import { colors, radii } from "../../theme";
import { formatCurrency } from "../../utils/currency";

export default function HomeScreen({ products, stats, totalLiters, monthlyEstimate, nextDelivery }) {
  return (
    <Screen>
      <Card style={styles.hero}>
        <Badge>Farm fresh</Badge>
        <Text style={styles.heroTitle}>Daily milk subscriptions that feel premium, not manual.</Text>
        <Text style={styles.heroCopy}>
          Built around the same warm product language as the web app, but optimized for quick mobile actions.
        </Text>
        <View style={styles.metricRow}>
          <MetricCard label="Weekly plan" value={`${totalLiters.toFixed(1)} L`} />
          <MetricCard label="Monthly spend" value={formatCurrency(monthlyEstimate)} />
        </View>
        <View style={styles.actionRow}>
          <ActionButton>Manage tomorrow</ActionButton>
          <ActionButton tone="ghost">Add weekend paneer</ActionButton>
        </View>
      </Card>

      <SectionHeader
        eyebrow="Overview"
        title="Delivery dashboard"
        caption="Quick visibility into product quality, drop timing, and active plan performance."
      />

      <View style={styles.statsRow}>
        {stats.map((item) => (
          <View key={item.label} style={styles.statPill}>
            <Badge tone={item.tone}>{item.label}</Badge>
            <Text style={styles.statValue}>{item.value}</Text>
          </View>
        ))}
      </View>

      <Card>
        <View style={styles.sectionTopRow}>
          <Text style={styles.sectionTitle}>Next delivery</Text>
          <Badge tone="success">{nextDelivery.status}</Badge>
        </View>
        <View style={styles.stack}>
          <RowItem label="Window" value={`${nextDelivery.title}, ${nextDelivery.time}`} />
          <RowItem label="Items" value={nextDelivery.items} subtle />
          <RowItem label="Address" value={nextDelivery.address} subtle />
        </View>
      </Card>

      <Card>
        <View style={styles.sectionTopRow}>
          <Text style={styles.sectionTitle}>Popular products</Text>
          <Text style={styles.link}>See all</Text>
        </View>
        <View style={styles.stack}>
          {products.map((product) => (
            <View key={product.id} style={styles.productRow}>
              <View style={styles.productMedia}>
                <Text style={styles.productMediaText}>{product.name.charAt(0)}</Text>
              </View>
              <View style={styles.productBody}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productDescription}>{product.description}</Text>
                <View style={styles.productFooter}>
                  <Badge>{product.tag}</Badge>
                  <Text style={styles.productPrice}>
                    {formatCurrency(product.price)} / {product.unit}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.surface,
    gap: 14
  },
  heroTitle: {
    fontSize: 31,
    lineHeight: 34,
    fontWeight: "900",
    color: colors.ink,
    maxWidth: 290
  },
  heroCopy: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.muted
  },
  metricRow: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap"
  },
  actionRow: {
    gap: 10
  },
  statsRow: {
    gap: 12
  },
  statPill: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 16,
    gap: 10
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.ink
  },
  sectionTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 14
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.ink
  },
  link: {
    fontSize: 13,
    color: colors.accentStrong,
    fontWeight: "700"
  },
  stack: {
    gap: 12
  },
  productRow: {
    flexDirection: "row",
    gap: 12
  },
  productMedia: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center"
  },
  productMediaText: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.accentStrong
  },
  productBody: {
    flex: 1,
    gap: 5
  },
  productName: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.ink
  },
  productDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted
  },
  productFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    alignItems: "center"
  },
  productPrice: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.ink
  }
});
