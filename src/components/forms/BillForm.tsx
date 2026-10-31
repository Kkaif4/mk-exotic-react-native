import React, { useState, useMemo, useCallback, useRef } from "react";
import { View, Text, StyleSheet, Pressable, TextInput } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Card } from "../common/Card";
import { Input } from "../common/Input";
import { Button } from "../common/Button";
import { BillType, Vendor } from "../../core/types";
import { isValidMoneyAmount } from "../../core/math";
import { colors } from "../../core/theme";

interface BillFormProps {
  existingNames: { customers: string[]; vendors: string[] };
  registeredVendors: Vendor[];
  onAddBill: (bill: {
    type: BillType;
    entityName: string;
    billNumber: string;
    date: string;
    amount: number;
    vendorId?: string;
  }) => void;
}

export const BillForm = React.memo(function BillForm({
  existingNames,
  registeredVendors,
  onAddBill,
}: BillFormProps) {
  const [type, setType] = useState<BillType>("sale");
  const [entityName, setEntityName] = useState("");
  const [billNumber, setBillNumber] = useState("");
  const [date, setDate] = useState(() =>
    new Date().toISOString().substring(0, 10),
  );
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const nameInputRef = useRef<TextInput>(null);
  const billNumberInputRef = useRef<TextInput>(null);
  const dateInputRef = useRef<TextInput>(null);
  const amountInputRef = useRef<TextInput>(null);

  const suggestions = useMemo(() => {
    const list =
      type === "sale" ? existingNames.customers : existingNames.vendors;
    if (!entityName.trim()) return [];
    return list.filter((n) =>
      n.toLowerCase().includes(entityName.toLowerCase()),
    );
  }, [type, existingNames, entityName]);

  const handleSubmit = useCallback(() => {
    setError("");
    const cleanName = entityName.trim();
    if (!cleanName) {
      setError("Please enter a customer or vendor name.");
      nameInputRef.current?.focus();
      return;
    }
    if (!isValidMoneyAmount(amount)) {
      setError("Please enter a valid positive bill amount.");
      amountInputRef.current?.focus();
      return;
    }

    let vendorId: string | undefined;
    if (type === "purchase") {
      const match = registeredVendors.find(
        (v) => v.name.toLowerCase() === cleanName.toLowerCase(),
      );
      if (match) vendorId = match.id;
    }

    onAddBill({
      type,
      entityName: cleanName,
      billNumber: billNumber.trim(),
      date,
      amount: parseFloat(amount),
      vendorId,
    });

    setEntityName("");
    setBillNumber("");
    setAmount("");
    setShowDropdown(false);

    // On bill save, focus back on top field (name)
    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 50);
  }, [
    type,
    entityName,
    billNumber,
    date,
    amount,
    registeredVendors,
    onAddBill,
  ]);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Feather
            name="edit-3"
            size={17}
            color={colors.information}
            style={styles.headerIcon}
          />
          <Text style={styles.title}>Record New Bill</Text>
        </View>
        <Text style={styles.badgeLabel}>Quick Entry</Text>
      </View>

      {/* Bill Type Selector with Clean Icons */}
      <View style={styles.typeSelector}>
        <Pressable
          onPress={() => {
            setType("sale");
            setEntityName("");
          }}
          style={[styles.typeButton, type === "sale" && styles.saleActive]}
        >
          <Feather
            name="shopping-bag"
            size={14}
            color={type === "sale" ? colors.textPrimary : colors.textSecondary}
            style={styles.btnIcon}
          />
          <Text
            style={[styles.typeText, type === "sale" && styles.typeTextActive]}
          >
            Customer Sale
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            setType("purchase");
            setEntityName("");
          }}
          style={[
            styles.typeButton,
            type === "purchase" && styles.purchaseActive,
          ]}
        >
          <Feather
            name="truck"
            size={14}
            color={
              type === "purchase" ? colors.textPrimary : colors.textSecondary
            }
            style={styles.btnIcon}
          />
          <Text
            style={[
              styles.typeText,
              type === "purchase" && styles.typeTextActive,
            ]}
          >
            Vendor Purchase
          </Text>
        </Pressable>
      </View>

      {/* Name Input with Autocomplete */}
      <View style={styles.inputContainer}>
        <Input
          ref={nameInputRef}
          label={type === "sale" ? "Customer Name *" : "Vendor Name *"}
          placeholder={type === "sale" ? "Customer Name" : "Vendor Name"}
          value={entityName}
          onChangeText={(txt) => {
            setEntityName(txt);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          returnKeyType="next"
          onSubmitEditing={() => {
            if (suggestions.length > 0 && !suggestions.includes(entityName)) {
              setEntityName(suggestions[0]);
            }
            setShowDropdown(false);
            billNumberInputRef.current?.focus();
          }}
        />
        {showDropdown && suggestions.length > 0 && (
          <View style={styles.dropdown}>
            {suggestions.slice(0, 4).map((sugg) => (
              <Pressable
                key={sugg}
                onPress={() => {
                  setEntityName(sugg);
                  setShowDropdown(false);
                  billNumberInputRef.current?.focus();
                }}
                style={styles.dropdownItem}
              >
                <Text style={styles.dropdownText}>{sugg}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <View style={styles.rowInputs}>
        <View style={styles.flex1}>
          <Input
            ref={billNumberInputRef}
            label="Bill # (Optional)"
            placeholder="e.g. 1042"
            value={billNumber}
            onChangeText={setBillNumber}
            returnKeyType="next"
            onSubmitEditing={() => {
              dateInputRef.current?.focus();
            }}
          />
        </View>
        <View style={styles.flex1}>
          <Input
            ref={dateInputRef}
            label="Date"
            placeholder="YYYY-MM-DD"
            value={date}
            onChangeText={setDate}
            returnKeyType="next"
            onSubmitEditing={() => {
              amountInputRef.current?.focus();
            }}
          />
        </View>
      </View>

      <Input
        ref={amountInputRef}
        label="Total Amount (INR) *"
        placeholder="e.g. 20000"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
        error={error}
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
      />

      <Button
        title={`Save ${type === "sale" ? "Sale Bill" : "Purchase Bill"}`}
        variant={type === "sale" ? "success" : "primary"}
        onPress={handleSubmit}
        icon={<Feather name="check" size={15} color={colors.textPrimary} />}
        style={styles.submitBtn}
      />
    </Card>
  );
});

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIcon: {
    marginRight: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: 0.2,
  },
  badgeLabel: {
    fontSize: 11,
    color: colors.textMuted,
    backgroundColor: colors.appBackground,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    fontWeight: "600",
  },
  typeSelector: {
    flexDirection: "row",
    backgroundColor: colors.appBackground,
    borderRadius: 10,
    padding: 3,
    marginBottom: 14,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeButton: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  btnIcon: {
    marginRight: 6,
  },
  saleActive: {
    backgroundColor: colors.success, // #26945B
  },
  purchaseActive: {
    backgroundColor: colors.brandSecondary, // #1455A0
  },
  typeText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  typeTextActive: {
    color: colors.textPrimary,
    fontWeight: "700",
  },
  inputContainer: {
    position: "relative",
    zIndex: 10,
  },
  rowInputs: {
    flexDirection: "row",
    gap: 10,
  },
  flex1: {
    flex: 1,
  },
  dropdown: {
    position: "absolute",
    top: 64,
    left: 0,
    right: 0,
    backgroundColor: colors.elevatedSurface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    zIndex: 20,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownText: {
    color: colors.textPrimary,
    fontSize: 13,
  },
  submitBtn: {
    marginTop: 4,
  },
});
