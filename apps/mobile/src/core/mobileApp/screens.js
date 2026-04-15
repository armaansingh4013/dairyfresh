import React, { useEffect, useMemo, useState } from "react";
import {
  Linking,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View
} from "react-native";
import ActionButton from "../../components/ActionButton";
import Badge from "../../components/Badge";
import Card from "../../components/Card";
import { colors } from "../../theme";
import {
  subscriptionOrderTabs,
  subscriptionTabs
} from "./constants";
import {
  AddressFormModal,
  AnimatedScreen,
  CalendarField,
  EmptyCard,
  Field,
  SmallPillButton,
  TabRow
} from "./shared";
import { styles } from "./styles";
import {
  buildDateKeys,
  computeOrderTotal,
  filterPlanOrdersByTab,
  formatAddress,
  formatCoordinates,
  formatDate
} from "./utils";

export function ShopScreen({
  appLoading,
  cartCount,
  cartItems,
  onOpenSubscriptions,
  onOpenWizard,
  onUpdateCart,
  products,
  session
}) {
  return (
    <AnimatedScreen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.screenContent}>
        <Card style={styles.heroCard}>
          <Badge>Welcome</Badge>
          <Text style={styles.heroTitle}>{session?.user?.name || session?.user?.phone || "Customer"}</Text>
          <Text style={styles.heroBody}>
            Shop daily dairy products, build a cart, and start subscriptions with the same core flow as the web app.
          </Text>
          <View style={styles.heroActions}>
            <ActionButton onPress={onOpenWizard}>Start Subscription</ActionButton>
            <ActionButton tone="ghost" onPress={onOpenSubscriptions}>
              View Subscriptions
            </ActionButton>
          </View>
          {cartCount ? (
            <Text style={styles.heroCaption}>{cartCount} items are already in your cart.</Text>
          ) : null}
        </Card>

        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionEyebrow}>Products</Text>
            <Text style={styles.sectionTitle}>Browse catalog</Text>
          </View>
          {appLoading ? <ActivityIndicator color={colors.accentStrong} /> : null}
        </View>

        <View style={styles.stack}>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              quantity={cartItems.find((item) => item.productId === product.id)?.quantity || 0}
              onUpdateCart={onUpdateCart}
            />
          ))}
        </View>
      </ScrollView>
    </AnimatedScreen>
  );
}

function ProductCard({ product, quantity, onUpdateCart }) {
  return (
    <Card style={styles.productCard}>
      <View style={styles.summaryRow}>
        <View style={styles.flexOne}>
          <Text style={styles.cardTitle}>{product.name}</Text>
          <Text style={styles.cardBody}>{product.description || "Farm-fresh dairy item."}</Text>
        </View>
        <Badge>{product.unit}</Badge>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.priceLabel}>INR {Number(product.price || 0).toFixed(0)}</Text>
        {quantity > 0 ? (
          <View style={styles.inlineStepper}>
            <SmallPillButton label="-" onPress={() => onUpdateCart(product, -1)} />
            <Text style={styles.stepperValue}>{quantity}</Text>
            <SmallPillButton label="+" onPress={() => onUpdateCart(product, 1)} />
          </View>
        ) : (
          <ActionButton onPress={() => onUpdateCart(product, 1)}>Add</ActionButton>
        )}
      </View>
    </Card>
  );
}

export function CartScreen({
  addresses,
  cartItems,
  cartTotal,
  onAddAddress,
  onPlaceOrder,
  placingOrder,
  savingAddress
}) {
  const [addressId, setAddressId] = useState(addresses[0]?.id || "");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [showAddressModal, setShowAddressModal] = useState(false);

  useEffect(() => {
    if (!addressId && addresses[0]?.id) {
      setAddressId(addresses[0].id);
    }
  }, [addressId, addresses]);

  return (
    <AnimatedScreen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.screenContent}>
        <Card>
          <Text style={styles.sectionTitle}>Your cart</Text>
          <View style={styles.stack}>
            {cartItems.length ? (
              cartItems.map((item) => (
                <View key={item.productId} style={styles.listRow}>
                  <View style={styles.flexOne}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <Text style={styles.cardBody}>
                      {item.quantity} x INR {Number(item.price).toFixed(0)} / {item.unit}
                    </Text>
                  </View>
                  <Text style={styles.priceLabel}>
                    INR {(Number(item.quantity) * Number(item.price)).toFixed(0)}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.cardBody}>Your cart is empty.</Text>
            )}
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Checkout</Text>
          <Text style={styles.cardBody}>Delivery date</Text>
          <CalendarField label="Delivery date" value={date} onChange={setDate} />
          <Text style={styles.cardBody}>Select address</Text>
          <View style={styles.stack}>
            {addresses.map((address) => (
              <Pressable
                key={address.id}
                style={[styles.selectCard, addressId === address.id && styles.selectCardActive]}
                onPress={() => setAddressId(address.id)}
              >
                <Text style={styles.cardTitle}>{address.title}</Text>
                {address.recipientName ? (
                  <Text style={styles.cardBody}>
                    {address.recipientName}
                    {address.recipientPhone ? ` • ${address.recipientPhone}` : ""}
                  </Text>
                ) : null}
                <Text style={styles.cardBody}>{formatAddress(address)}</Text>
                <Text style={styles.cardBody}>Pin: {formatCoordinates(address)}</Text>
              </Pressable>
            ))}
          </View>
          <ActionButton tone="ghost" onPress={() => setShowAddressModal(true)} disabled={savingAddress}>
            Add New Address
          </ActionButton>
          <Text style={styles.cardBody}>Note</Text>
          <Field value={note} onChangeText={setNote} placeholder="Deliver before 7 AM" />
          <View style={styles.summaryBox}>
            <Text style={styles.cardTitle}>Total</Text>
            <Text style={styles.priceLabel}>INR {cartTotal.toFixed(0)}</Text>
          </View>
          <ActionButton
            onPress={() => {
              if (!cartItems.length) {
                Alert.alert("Empty cart", "Add items before placing an order.");
                return;
              }
              if (!addressId) {
                Alert.alert("Select address", "Choose an address before checkout.");
                return;
              }
              onPlaceOrder({ addressId, date, note });
            }}
            loading={placingOrder}
            loadingLabel="Placing order..."
          >
            Place Order
          </ActionButton>
        </Card>
        <AddressFormModal
          visible={showAddressModal}
          onClose={() => setShowAddressModal(false)}
          saving={savingAddress}
          onSubmit={async (form) => {
            const saved = await onAddAddress(form, { selectAfterSave: true });
            if (saved?.id) {
              setAddressId(saved.id);
              setShowAddressModal(false);
            }
          }}
        />
      </ScrollView>
    </AnimatedScreen>
  );
}

export function SubscriptionsScreen({ groups, onOpenSubscription, onOpenWizard }) {
  const [activeTab, setActiveTab] = useState("active");
  const visible = groups[activeTab] || [];

  return (
    <AnimatedScreen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.screenContent}>
        <Card style={styles.heroCard}>
          <Text style={styles.sectionEyebrow}>Subscriptions</Text>
          <Text style={styles.heroTitle}>Manage every plan from one place</Text>
          <Text style={styles.heroBody}>
            The mobile app now follows the same subscription flow as the web app, including grouped tabs and plan detail views.
          </Text>
          <ActionButton onPress={onOpenWizard}>Start New Subscription</ActionButton>
        </Card>

        <TabRow tabs={subscriptionTabs} activeTab={activeTab} onChange={setActiveTab} />
        <View style={styles.stack}>
          {visible.length ? (
            visible.map((plan) => (
              <Pressable key={plan.id} onPress={() => onOpenSubscription(plan)}>
                <Card>
                  <View style={styles.summaryRow}>
                    <View style={styles.flexOne}>
                      <Text style={styles.cardTitle}>{plan.product?.name || "Product"}</Text>
                      <Text style={styles.cardBody}>
                        {formatDate(plan.startDate)} to {formatDate(plan.endDate)}
                      </Text>
                    </View>
                    <Badge>{plan.status}</Badge>
                  </View>
                  <Text style={styles.cardBody}>Mode: {plan.mode}</Text>
                  <Text style={styles.cardBody}>
                    Delivered orders: {(plan.deliveries || []).filter((delivery) => delivery.status === "DELIVERED").length}
                  </Text>
                </Card>
              </Pressable>
            ))
          ) : (
            <EmptyCard message={`No ${activeTab} subscriptions.`} />
          )}
        </View>
      </ScrollView>
    </AnimatedScreen>
  );
}

export function SubscriptionDetailScreen({ orders, plan }) {
  const [tab, setTab] = useState("today");
  const visibleOrders = useMemo(() => filterPlanOrdersByTab(orders, tab), [orders, tab]);

  if (!plan) {
    return <EmptyCard message="Subscription not found." />;
  }

  return (
    <AnimatedScreen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.screenContent}>
        <Card>
          <View style={styles.summaryRow}>
            <View style={styles.flexOne}>
              <Text style={styles.cardTitle}>{plan.product?.name || "Product"}</Text>
              <Text style={styles.cardBody}>
                {formatDate(plan.startDate)} to {formatDate(plan.endDate)}
              </Text>
            </View>
            <Badge>{plan.status}</Badge>
          </View>
          <Text style={styles.cardBody}>
            {plan.address ? formatAddress(plan.address) : "No delivery address set"}
          </Text>
          <Text style={styles.cardBody}>Default quantity: {plan.defaultQuantity}</Text>
          <Text style={styles.cardBody}>Mode: {plan.mode}</Text>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Subscription orders</Text>
          <TabRow tabs={subscriptionOrderTabs} activeTab={tab} onChange={setTab} />
          <View style={styles.stack}>
            {visibleOrders.length ? (
              visibleOrders.map((order) => (
                <Card key={order.id} style={styles.innerCard}>
                  <View style={styles.summaryRow}>
                    <View style={styles.flexOne}>
                      <Text style={styles.cardTitle}>Order #{order.id.slice(-6).toUpperCase()}</Text>
                      <Text style={styles.cardBody}>{formatDate(order.date)}</Text>
                    </View>
                    <Badge>{order.status}</Badge>
                  </View>
                  <Text style={styles.cardBody}>
                    {order.items?.[0]?.quantity || 0} x {order.items?.[0]?.product?.name || plan.product?.name}
                  </Text>
                </Card>
              ))
            ) : (
              <EmptyCard message={`No ${tab} orders for this subscription.`} />
            )}
          </View>
        </Card>
      </ScrollView>
    </AnimatedScreen>
  );
}

export function SubscriptionWizardScreen({
  addresses,
  onAddAddress,
  onCreateSubscription,
  products,
  creatingSubscription,
  savingAddress
}) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    productId: "",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    quantity: "1",
    mode: "EVERYDAY",
    addressId: addresses[0]?.id || ""
  });
  const [selectedDates, setSelectedDates] = useState({});
  const [showAddressModal, setShowAddressModal] = useState(false);

  useEffect(() => {
    if (!form.addressId && addresses[0]?.id) {
      setForm((current) => ({ ...current, addressId: addresses[0].id }));
    }
  }, [addresses, form.addressId]);

  const selectedProduct = products.find((product) => product.id === form.productId) || null;
  const dateKeys = buildDateKeys(form.startDate, form.endDate);
  const totalDays =
    form.mode === "CUSTOM"
      ? dateKeys.filter((key) => selectedDates[key]).length
      : dateKeys.length;

  return (
    <AnimatedScreen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.screenContent}>
        <Card>
          <Text style={styles.sectionEyebrow}>Start Subscription</Text>
          <Text style={styles.sectionTitle}>Step {step} of 4</Text>
        </Card>

        {step === 1 ? (
          <Card>
            <Text style={styles.sectionTitle}>Select product</Text>
            <View style={styles.stack}>
              {products.map((product) => (
                <Pressable
                  key={product.id}
                  style={[
                    styles.selectCard,
                    form.productId === product.id && styles.selectCardActive
                  ]}
                  onPress={() => setForm((current) => ({ ...current, productId: product.id }))}
                >
                  <Text style={styles.cardTitle}>{product.name}</Text>
                  <Text style={styles.cardBody}>
                    INR {Number(product.price || 0).toFixed(0)} / {product.unit}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Card>
        ) : null}

        {step === 2 ? (
          <Card>
            <Text style={styles.sectionTitle}>Choose dates and quantity</Text>
            <CalendarField
              label="Start date"
              value={form.startDate}
              onChange={(value) => setForm((current) => ({ ...current, startDate: value }))}
            />
            <CalendarField
              label="End date"
              value={form.endDate}
              onChange={(value) => setForm((current) => ({ ...current, endDate: value }))}
            />
            <Text style={styles.cardBody}>Quantity</Text>
            <Field
              value={form.quantity}
              onChangeText={(value) => setForm((current) => ({ ...current, quantity: value }))}
            />
            <Text style={styles.cardBody}>Mode</Text>
            <View style={styles.heroActions}>
              <ActionButton
                tone={form.mode === "EVERYDAY" ? "primary" : "ghost"}
                onPress={() => setForm((current) => ({ ...current, mode: "EVERYDAY" }))}
              >
                Everyday
              </ActionButton>
              <ActionButton
                tone={form.mode === "CUSTOM" ? "primary" : "ghost"}
                onPress={() => setForm((current) => ({ ...current, mode: "CUSTOM" }))}
              >
                Custom
              </ActionButton>
            </View>
            {form.mode === "CUSTOM" ? (
              <View style={styles.calendarGrid}>
                {dateKeys.map((key) => (
                  <Pressable
                    key={key}
                    style={[styles.calendarDay, !selectedDates[key] && styles.calendarDayMuted]}
                    onPress={() =>
                      setSelectedDates((current) => ({
                        ...current,
                        [key]: !current[key]
                      }))
                    }
                  >
                    <Text style={styles.calendarDate}>{new Date(key).getDate()}</Text>
                    <Text style={styles.calendarMeta}>{selectedDates[key] ? "On" : "Off"}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </Card>
        ) : null}

        {step === 3 ? (
          <Card>
            <Text style={styles.sectionTitle}>Select address</Text>
            <View style={styles.stack}>
              {addresses.map((address) => (
                <Pressable
                  key={address.id}
                  style={[
                    styles.selectCard,
                    form.addressId === address.id && styles.selectCardActive
                  ]}
                  onPress={() => setForm((current) => ({ ...current, addressId: address.id }))}
                >
                  <Text style={styles.cardTitle}>{address.title}</Text>
                  {address.recipientName ? (
                    <Text style={styles.cardBody}>
                      {address.recipientName}
                      {address.recipientPhone ? ` • ${address.recipientPhone}` : ""}
                    </Text>
                  ) : null}
                  <Text style={styles.cardBody}>{formatAddress(address)}</Text>
                  <Text style={styles.cardBody}>Pin: {formatCoordinates(address)}</Text>
                </Pressable>
              ))}
            </View>
            <ActionButton tone="ghost" onPress={() => setShowAddressModal(true)} disabled={savingAddress}>
              Add Address
            </ActionButton>
          </Card>
        ) : null}

        {step === 4 ? (
          <Card>
            <Text style={styles.sectionTitle}>Confirm</Text>
            <Text style={styles.cardBody}>Product: {selectedProduct?.name || "-"}</Text>
            <Text style={styles.cardBody}>Dates: {form.startDate} to {form.endDate}</Text>
            <Text style={styles.cardBody}>Days: {totalDays}</Text>
            <Text style={styles.cardBody}>Quantity per day: {form.quantity}</Text>
            <Text style={styles.priceLabel}>
              Estimated total: INR {((selectedProduct?.price || 0) * totalDays * Number(form.quantity || 0)).toFixed(0)}
            </Text>
            <ActionButton
              onPress={() => {
                if (!form.productId || !form.addressId) {
                  Alert.alert("Missing details", "Select product and address first.");
                  return;
                }
                const payload = {
                  productId: form.productId,
                  startDate: form.startDate,
                  endDate: form.endDate,
                  mode: form.mode,
                  addressId: form.addressId,
                  defaultQuantity: Number(form.quantity || 1)
                };

                if (form.mode === "CUSTOM") {
                  const days = dateKeys
                    .filter((key) => selectedDates[key])
                    .map((key) => ({
                      date: key,
                      quantity: Number(form.quantity || 1),
                      addressId: form.addressId
                    }));

                  if (!days.length) {
                    Alert.alert("Select dates", "Choose at least one custom date.");
                    return;
                  }
                  payload.days = days;
                }

                onCreateSubscription(payload, selectedProduct?.name);
              }}
              loading={creatingSubscription}
              loadingLabel="Creating subscription..."
            >
              Cash On Delivery & Place Order
            </ActionButton>
          </Card>
        ) : null}

        <View style={styles.heroActions}>
          <ActionButton tone="ghost" onPress={() => setStep((current) => Math.max(1, current - 1))}>
            Back
          </ActionButton>
          {step < 4 ? (
            <ActionButton onPress={() => setStep((current) => Math.min(4, current + 1))}>
              Next
            </ActionButton>
          ) : null}
        </View>
        <AddressFormModal
          visible={showAddressModal}
          onClose={() => setShowAddressModal(false)}
          saving={savingAddress}
          onSubmit={async (formValue) => {
            const saved = await onAddAddress(formValue, { selectAfterSave: true });
            if (saved?.id) {
              setForm((current) => ({ ...current, addressId: saved.id }));
              setShowAddressModal(false);
            }
          }}
        />
      </ScrollView>
    </AnimatedScreen>
  );
}

export function OrdersScreen({ onOpenSubscription, orders }) {
  const [selectedOrder, setSelectedOrder] = useState(null);

  return (
    <AnimatedScreen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.screenContent}>
        <Card>
          <Text style={styles.sectionEyebrow}>Orders</Text>
          <Text style={styles.sectionTitle}>Your orders</Text>
        </Card>
        <View style={styles.stack}>
          {orders.length ? (
            orders.map((order) => (
              <Pressable key={order.id} onPress={() => setSelectedOrder(order)}>
                <Card>
                  <View style={styles.summaryRow}>
                    <View style={styles.flexOne}>
                      <Text style={styles.cardTitle}>Order #{order.id.slice(-6).toUpperCase()}</Text>
                      <Text style={styles.cardBody}>{formatDate(order.date)}</Text>
                    </View>
                    <Badge>{order.status}</Badge>
                  </View>
                  <Text style={styles.cardBody}>
                    {order.items?.length || 0} items • INR {computeOrderTotal(order).toFixed(0)}
                  </Text>
                  <Text style={styles.cardBody}>
                    {order.planId ? "Go to subscription" : "Tap to view details"}
                  </Text>
                </Card>
              </Pressable>
            ))
          ) : (
            <EmptyCard message="No orders yet." />
          )}
        </View>
      </ScrollView>
      <Modal animationType="slide" transparent visible={Boolean(selectedOrder)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {selectedOrder ? (
              <>
                <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                  <View style={styles.summaryRow}>
                    <View style={styles.flexOne}>
                      <Text style={styles.sectionTitle}>Order #{selectedOrder.id.slice(-6).toUpperCase()}</Text>
                      <Text style={styles.cardBody}>{formatDate(selectedOrder.date)}</Text>
                    </View>
                    <Badge>{selectedOrder.status}</Badge>
                  </View>
                  <View style={styles.stack}>
                    {selectedOrder.items.map((item) => (
                      <View key={item.productId || item.id} style={styles.listRow}>
                        <View style={styles.flexOne}>
                          <Text style={styles.cardTitle}>{item.product?.name || "Product"}</Text>
                          <Text style={styles.cardBody}>{item.quantity} x INR {Number(item.product?.price || 0).toFixed(0)}</Text>
                        </View>
                        <Text style={styles.priceLabel}>
                          INR {(Number(item.quantity || 0) * Number(item.product?.price || 0)).toFixed(0)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </ScrollView>
                {selectedOrder.planId ? (
                  <ActionButton
                    onPress={() => {
                      setSelectedOrder(null);
                      onOpenSubscription(selectedOrder.planId);
                    }}
                  >
                    Go to Subscription
                  </ActionButton>
                ) : null}
                <ActionButton tone="ghost" onPress={() => setSelectedOrder(null)}>
                  Close
                </ActionButton>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </AnimatedScreen>
  );
}

export function ProfileScreen({ addresses, onAddAddress, onLogout, savingAddress, session }) {
  const [showAddressModal, setShowAddressModal] = useState(false);

  return (
    <AnimatedScreen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.screenContent}>
        <Card style={styles.heroCard}>
          <Text style={styles.sectionEyebrow}>Profile</Text>
          <Text style={styles.heroTitle}>{session?.user?.name || session?.user?.phone || "Customer"}</Text>
          <Text style={styles.heroBody}>{session?.user?.email || session?.user?.phone || "No contact set"}</Text>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Saved addresses</Text>
          <View style={styles.stack}>
            {addresses.length ? (
              addresses.map((address) => (
                <View key={address.id} style={styles.selectCard}>
                  <Text style={styles.cardTitle}>{address.title}</Text>
                  {address.recipientName ? (
                    <Text style={styles.cardBody}>
                      {address.recipientName}
                      {address.recipientPhone ? ` • ${address.recipientPhone}` : ""}
                    </Text>
                  ) : null}
                  <Text style={styles.cardBody}>{formatAddress(address)}</Text>
                  <Text style={styles.cardBody}>Pin: {formatCoordinates(address)}</Text>
                  {typeof address.lat === "number" && typeof address.lng === "number" ? (
                    <Pressable
                      onPress={() =>
                        Linking.openURL(
                          `https://www.google.com/maps/search/?api=1&query=${address.lat},${address.lng}`
                        )
                      }
                    >
                      <Text style={styles.linkText}>Open in Maps</Text>
                    </Pressable>
                  ) : null}
                </View>
              ))
            ) : (
              <Text style={styles.cardBody}>No addresses saved yet.</Text>
            )}
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Add address</Text>
          <Text style={styles.cardBody}>Open the address form and save another delivery location.</Text>
          <ActionButton onPress={() => setShowAddressModal(true)} disabled={savingAddress}>
            Add Address
          </ActionButton>
        </Card>

        <ActionButton tone="ghost" onPress={onLogout}>
          Logout
        </ActionButton>
        <AddressFormModal
          visible={showAddressModal}
          onClose={() => setShowAddressModal(false)}
          saving={savingAddress}
          onSubmit={async (formValue) => {
            const saved = await onAddAddress(formValue, { selectAfterSave: false });
            if (saved?.id) {
              setShowAddressModal(false);
            }
          }}
        />
      </ScrollView>
    </AnimatedScreen>
  );
}
