import { SafeAreaView } from "react-native-safe-area-context";
import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
 
  TextInput,
} from "react-native";
import Animated, { FadeInDown, FadeIn, Layout } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

import { useAppStore } from "@/store/useAppStore";
import { DARK_THEME } from "@/constants/theme";
import { GlowCard } from "@/components/GlowCard";
import { GroceryItem } from "@/types";
import { PHASE_INFO } from "@/constants/cycle";

const CATEGORIES = ["Protein", "Vegetables", "Fruits", "Grains", "Dairy", "Seeds & Nuts", "Treats", "Pantry", "Other"];

const CATEGORY_EMOJIS: Record<string, string> = {
  Protein: "🥩", Vegetables: "🥦", Fruits: "🍓", Grains: "🌾",
  Dairy: "🥛", "Seeds & Nuts": "🥜", Treats: "🍫", Pantry: "🫙", Other: "🛒",
};

function ProgressBar({ checked, total, accentColor }: { checked: number; total: number; accentColor: string }) {
  const pct = total > 0 ? checked / total : 0;
  return (
    <GlowCard glowColor={pct === 1 ? accentColor : undefined} style={styles.progressCard}>
      <View style={styles.progressHeader}>
        <View>
          <Text style={styles.progressTitle}>
            {pct === 1 ? "All done! 🎉" : `${checked} of ${total} items`}
          </Text>
          <Text style={styles.progressSub}>
            {pct === 1 ? "Your basket is full" : `${total - checked} items remaining`}
          </Text>
        </View>
        <Text style={[styles.progressPct, { color: accentColor }]}>
          {Math.round(pct * 100)}%
        </Text>
      </View>
      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressFill,
            { width: `${pct * 100}%` as any, backgroundColor: accentColor },
          ]}
        />
      </View>
    </GlowCard>
  );
}

function AddItemRow({ accentColor }: { accentColor: string }) {
  const addGroceryItem = useAppStore((s) => s.addGroceryItem);
  const groceryItems = useAppStore((s) => s.groceryItems);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Other");
  const [showCatPicker, setShowCatPicker] = useState(false);

  const handleAdd = () => {
    if (!name.trim()) return;
    addGroceryItem({
      id: Date.now().toString(),
      name: name.trim(),
      category,
      checked: false,
    });
    setName("");
  };

  return (
    <GlowCard style={styles.addCard}>
      <View style={styles.addRow}>
        <TextInput
          style={styles.addInput}
          value={name}
          onChangeText={setName}
          placeholder="Add an item..."
          placeholderTextColor={DARK_THEME.textMuted}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
        />
        <Pressable
          onPress={() => setShowCatPicker((v) => !v)}
          style={styles.catBtn}
        >
          <Text style={styles.catBtnEmoji}>{CATEGORY_EMOJIS[category]}</Text>
          <Ionicons name="chevron-down" size={12} color={DARK_THEME.textMuted} />
        </Pressable>
        <Pressable
          onPress={handleAdd}
          style={[styles.addBtn, { backgroundColor: name.trim() ? accentColor : "rgba(255,255,255,0.06)" }]}
        >
          <Ionicons name="add" size={20} color={name.trim() ? "#0a0e1a" : DARK_THEME.textMuted} />
        </Pressable>
      </View>

      {showCatPicker && (
        <Animated.View entering={FadeIn.duration(200)} style={styles.catPicker}>
          {CATEGORIES.map((c) => (
            <Pressable
              key={c}
              onPress={() => { setCategory(c); setShowCatPicker(false); }}
              style={[
                styles.catOption,
                category === c && { backgroundColor: `${accentColor}15` },
              ]}
            >
              <Text style={styles.catOptionEmoji}>{CATEGORY_EMOJIS[c]}</Text>
              <Text style={[styles.catOptionText, category === c && { color: accentColor }]}>{c}</Text>
              {category === c && <Ionicons name="checkmark" size={14} color={accentColor} />}
            </Pressable>
          ))}
        </Animated.View>
      )}
    </GlowCard>
  );
}

function CategorySection({
  category,
  items,
  accentColor,
  onToggle,
  onDelete,
}: {
  category: string;
  items: GroceryItem[];
  accentColor: string;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const checkedCount = items.filter((i) => i.checked).length;

  return (
    <Animated.View entering={FadeInDown.duration(350)} style={styles.categorySection}>
      <View style={styles.categoryHeader}>
        <Text style={styles.categoryEmoji}>{CATEGORY_EMOJIS[category] ?? "🛒"}</Text>
        <Text style={styles.categoryTitle}>{category}</Text>
        <Text style={styles.categoryCount}>
          {checkedCount}/{items.length}
        </Text>
      </View>
      <View style={styles.itemList}>
        {items.map((item, i) => (
          <Animated.View
            key={item.id}
            layout={Layout.springify()}
            style={[
              styles.itemRow,
              i < items.length - 1 && styles.itemRowBorder,
            ]}
          >
            <Pressable
              onPress={() => onToggle(item.id)}
              style={styles.itemPressable}
            >
              <View
                style={[
                  styles.checkbox,
                  item.checked && { backgroundColor: `${accentColor}30`, borderColor: `${accentColor}60` },
                ]}
              >
                {item.checked && (
                  <Ionicons name="checkmark" size={12} color={accentColor} />
                )}
              </View>
              <Text
                style={[
                  styles.itemName,
                  item.checked && styles.itemNameChecked,
                ]}
              >
                {item.name}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => onDelete(item.id)}
              style={styles.deleteBtn}
              hitSlop={8}
            >
              <Ionicons name="close" size={14} color={DARK_THEME.textMuted} />
            </Pressable>
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );
}


export default function GroceryScreen() {
  const groceryItems = useAppStore((s) => s.groceryItems);
  const toggleGroceryItem = useAppStore((s) => s.toggleGroceryItem);
  const removeGroceryItem = useAppStore((s) => s.removeGroceryItem);
  const planGroceryItems = useAppStore((s) => s.planGroceryItems);
  const togglePlanGroceryItem = useAppStore((s) => s.togglePlanGroceryItem);
  const removePlanGroceryItem = useAppStore((s) => s.removePlanGroceryItem);
  const addGroceryItem = useAppStore((s) => s.addGroceryItem);
  const currentPhase = useAppStore((s) => s.currentPhase);
  const accentColor = useAppStore((s) => s.accentColor());

  const phase = PHASE_INFO[currentPhase];

  const handleAddPhaseFoods = () => {
    const existing = new Set([...groceryItems, ...planGroceryItems].map((i) => i.name.toLowerCase()));
    phase.easyWins.forEach((win) => {
      if (!existing.has(win.toLowerCase())) {
        addGroceryItem({ id: Date.now().toString() + Math.random(), name: win, category: "Other", checked: false });
      }
    });
  };

  const [showChecked, setShowChecked] = useState(true);
  const [planExpanded, setPlanExpanded] = useState(true);

  const allItems = [...planGroceryItems, ...groceryItems];
  const checked = allItems.filter((i) => i.checked).length;
  const total = allItems.length;

  const visibleItems = showChecked
    ? groceryItems
    : groceryItems.filter((i) => !i.checked);
  const visiblePlanItems = showChecked
    ? planGroceryItems
    : planGroceryItems.filter((i) => !i.checked);

  // Group by category, preserving order
  const categories = [...new Set(visibleItems.map((i) => i.category))];
  const planCategories = [...new Set(visiblePlanItems.map((i) => i.category))];

  const handleClearChecked = () => {
    groceryItems.filter((i) => i.checked).forEach((i) => removeGroceryItem(i.id));
    planGroceryItems.filter((i) => i.checked).forEach((i) => removePlanGroceryItem(i.id));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Grocery List</Text>
            <Text style={styles.subtitle}>
              Want to stock up on {phase.label.toLowerCase()} foods this week? Here's a simple list
            </Text>
          </View>
          <Ionicons name="cart" size={22} color={accentColor} />
        </Animated.View>

        {/* Phase foods shortcut */}
        <Animated.View entering={FadeInDown.delay(50).duration(400)}>
          <Pressable
            onPress={handleAddPhaseFoods}
            style={[styles.phaseFoodsBtn, { backgroundColor: `${accentColor}10`, borderColor: `${accentColor}25` }]}
          >
            <Text style={styles.phaseFoodsEmoji}>{phase.emoji}</Text>
            <Text style={[styles.phaseFoodsBtnText, { color: accentColor }]}>
              Add {phase.label.split(" ")[0].toLowerCase()} phase foods to list
            </Text>
            <Ionicons name="add-circle-outline" size={18} color={accentColor} />
          </Pressable>
        </Animated.View>

        {/* Progress */}
        <ProgressBar checked={checked} total={total} accentColor={accentColor} />

        {/* Add item */}
        <AddItemRow accentColor={accentColor} />

        {/* Filter row */}
        <View style={styles.filterRow}>
          <Pressable
            onPress={() => setShowChecked((v) => !v)}
            style={[
              styles.filterBtn,
              !showChecked && { backgroundColor: `${accentColor}15`, borderColor: `${accentColor}30` },
            ]}
          >
            <Ionicons
              name={showChecked ? "eye-outline" : "eye-off-outline"}
              size={14}
              color={!showChecked ? accentColor : DARK_THEME.textMuted}
            />
            <Text style={[styles.filterBtnText, !showChecked && { color: accentColor }]}>
              {showChecked ? "Hide checked" : "Show all"}
            </Text>
          </Pressable>

          {checked > 0 && (
            <Pressable onPress={handleClearChecked} style={styles.clearBtn}>
              <Ionicons name="trash-outline" size={14} color="#f87171" />
              <Text style={styles.clearBtnText}>Clear {checked} done</Text>
            </Pressable>
          )}

        </View>

        {/* Plan section */}
        {planGroceryItems.length > 0 && (
          <Animated.View entering={FadeInDown.duration(350)} style={styles.planSection}>
            <Pressable onPress={() => setPlanExpanded((v) => !v)} style={styles.planHeader}>
              <Ionicons name="calendar-outline" size={15} color={accentColor} />
              <Text style={[styles.planHeaderTitle, { color: accentColor }]}>Next Week's Plan</Text>
              <Text style={styles.planHeaderCount}>{planGroceryItems.length} ingredients</Text>
              <Ionicons
                name={planExpanded ? "chevron-up" : "chevron-down"}
                size={14} color={accentColor}
                style={{ marginLeft: "auto" as any }}
              />
            </Pressable>
            {planExpanded && (
              <>
                {planCategories.map((cat) => (
                  <GlowCard key={`plan-${cat}`} style={styles.categoryCard} noPadding>
                    <CategorySection
                      category={cat}
                      items={visiblePlanItems.filter((i) => i.category === cat)}
                      accentColor={accentColor}
                      onToggle={togglePlanGroceryItem}
                      onDelete={removePlanGroceryItem}
                    />
                  </GlowCard>
                ))}
              </>
            )}
          </Animated.View>
        )}

        {/* My items */}
        {(groceryItems.length > 0 || planGroceryItems.length === 0) && (
          <>
            {planGroceryItems.length > 0 && (
              <View style={styles.myItemsHeader}>
                <Text style={styles.myItemsLabel}>My Items</Text>
              </View>
            )}
            {total === 0 ? (
              <Animated.View entering={FadeIn.duration(400)} style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🛒</Text>
                <Text style={styles.emptyTitle}>Your list is empty</Text>
                <Text style={styles.emptySub}>Add items above or go to Weekly → Next Week to generate from your meal plan</Text>
              </Animated.View>
            ) : (
              categories.map((cat) => (
                <GlowCard key={cat} style={styles.categoryCard} noPadding>
                  <CategorySection
                    category={cat}
                    items={visibleItems.filter((i) => i.category === cat)}
                    accentColor={accentColor}
                    onToggle={toggleGroceryItem}
                    onDelete={removeGroceryItem}
                  />
                </GlowCard>
              ))
            )}
          </>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: DARK_THEME.bg },
  scrollContent: { padding: 16, paddingTop: 12 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  title: { fontFamily: "Georgia", fontSize: 26, color: DARK_THEME.textPrimary, fontWeight: "600" },
  subtitle: { fontSize: 12, color: DARK_THEME.textSecondary, marginTop: 4, lineHeight: 17, paddingRight: 8 },
  phaseFoodsBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 14, paddingVertical: 11,
    borderRadius: 14, borderWidth: 1, marginBottom: 12,
  },
  phaseFoodsEmoji: { fontSize: 16 },
  phaseFoodsBtnText: { flex: 1, fontSize: 13, fontWeight: "600" },

  // Progress
  progressCard: { marginBottom: 12 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  progressTitle: { fontSize: 15, color: DARK_THEME.textPrimary, fontWeight: "600" },
  progressSub: { fontSize: 12, color: DARK_THEME.textMuted, marginTop: 2 },
  progressPct: { fontSize: 22, fontWeight: "700" },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },

  // Add item
  addCard: { marginBottom: 12 },
  addRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  addInput: {
    flex: 1, backgroundColor: DARK_THEME.inputBg, borderRadius: 12,
    borderWidth: 1, borderColor: DARK_THEME.borderColor,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: DARK_THEME.textPrimary,
  },
  catBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: DARK_THEME.inputBg, borderRadius: 12, borderWidth: 1,
    borderColor: DARK_THEME.borderColor, paddingHorizontal: 10, paddingVertical: 11,
  },
  catBtnEmoji: { fontSize: 16 },
  addBtn: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  catPicker: {
    marginTop: 10, borderRadius: 12, overflow: "hidden",
    borderWidth: 1, borderColor: DARK_THEME.borderColor,
  },
  catOption: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 14, paddingVertical: 11,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.04)",
  },
  catOptionEmoji: { fontSize: 16 },
  catOptionText: { flex: 1, fontSize: 13, color: DARK_THEME.textSecondary },

  // Filter row
  filterRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  filterBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    backgroundColor: DARK_THEME.cardBg, borderWidth: 1, borderColor: DARK_THEME.borderColor,
  },
  filterBtnText: { fontSize: 12, color: DARK_THEME.textMuted },
  clearBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    backgroundColor: "rgba(248,113,113,0.08)", borderWidth: 1, borderColor: "rgba(248,113,113,0.2)",
  },
  clearBtnText: { fontSize: 12, color: "#f87171" },

  // Categories
  categoryCard: { marginBottom: 10 },
  categorySection: { padding: 14 },
  categoryHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  categoryEmoji: { fontSize: 16 },
  categoryTitle: { flex: 1, fontSize: 12, color: DARK_THEME.textSecondary, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8 },
  categoryCount: { fontSize: 11, color: DARK_THEME.textMuted },

  // Items
  itemList: {},
  itemRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  itemRowBorder: { borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.04)" },
  itemPressable: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  checkbox: {
    width: 22, height: 22, borderRadius: 7,
    borderWidth: 1.5, borderColor: DARK_THEME.textMuted,
    alignItems: "center", justifyContent: "center",
  },
  itemName: { fontSize: 14, color: DARK_THEME.textPrimary, flex: 1 },
  itemNameChecked: { color: DARK_THEME.textMuted, textDecorationLine: "line-through" },
  deleteBtn: { padding: 4 },

  // Empty
  emptyState: { alignItems: "center", paddingVertical: 48 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, color: DARK_THEME.textPrimary, fontWeight: "600", marginBottom: 6 },
  emptySub: { fontSize: 13, color: DARK_THEME.textMuted, textAlign: "center", lineHeight: 19 },

  // Plan section
  planSection: { marginBottom: 8 },
  planHeader: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingVertical: 10, paddingHorizontal: 4, marginBottom: 8,
  },
  planHeaderTitle: { fontSize: 13, fontWeight: "700" },
  planHeaderCount: { fontSize: 11, color: DARK_THEME.textMuted },
  myItemsHeader: { paddingVertical: 8, paddingHorizontal: 4, marginBottom: 4 },
  myItemsLabel: { fontSize: 12, color: DARK_THEME.textMuted, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8 },
});
