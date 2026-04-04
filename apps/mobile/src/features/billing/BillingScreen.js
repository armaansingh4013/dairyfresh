import React from "react";
import { StyleSheet, Text, View } from "react-native";
import ActionButton from "../../components/ActionButton";
import Badge from "../../components/Badge";
import Card from "../../components/Card";
import RowItem from "../../components/RowItem";
import Screen from "../../components/Screen";
import SectionHeader from "../../components/SectionHeader";
import { colors, radii } from "../../theme";
import { formatCurrency } from "../../utils/currency";

export default function BillingScreen({ billing, onPayCurrentDue }) {
  return (
    <Screen>
      <SectionHeader
        eyebrow="Billing"
        title="Transparent monthly charges"
        caption="The payment section is designed like a compact ledger so recurring dairy plans remain easy to trust."
      />

      <Card style={styles.heroCard}>
        <Badge tone="warning">Due now</Badge>
        <Text style={styles.amount}>{formatCurrency(billing.currentDue)}</Text>
        <RowItem label="Next debit" value={billing.nextDebit} />
        <RowItem label="Payment method" value={billing.paymentMethod} subtle />
        {billing.currentDue > 0 ? (
          <ActionButton onPress={onPayCurrentDue}>Pay current invoice</ActionButton>
        ) : null}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Invoices</Text>
        <View style={styles.invoiceList}>
          {billing.invoices.map((invoice) => (
            <View key={invoice.id} style={styles.invoiceRow}>
              <View>
                <Text style={styles.invoiceMonth}>{invoice.month}</Text>
                <Text style={styles.invoiceStatus}>{invoice.status}</Text>
              </View>
              <Text style={styles.invoiceTotal}>{formatCurrency(invoice.total)}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Included in app structure</Text>
        <View style={styles.featureList}>
          <Text style={styles.featureItem}>Separate feature folders for billing, plans, deliveries, home, and profile.</Text>
          <Text style={styles.featureItem}>Reusable cards, badges, quantity controls, and layout wrappers.</Text>
          <Text style={styles.featureItem}>Shared theme tokens so iOS and Android render consistently.</Text>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    gap: 12
  },
  amount: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "900",
    color: colors.ink
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.ink,
    marginBottom: 14
  },
  invoiceList: {
    gap: 12
  },
  invoiceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
    padding: 14
  },
  invoiceMonth: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.ink
  },
  invoiceStatus: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 4
  },
  invoiceTotal: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.ink
  },
  featureList: {
    gap: 10
  },
  featureItem: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted
  }
});
