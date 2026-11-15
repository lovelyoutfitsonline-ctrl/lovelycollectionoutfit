/**
 * Calculates the cart total, applying combo offers where applicable.
 * 
 * Combo Group: "COMBO300" -> 4 items for ₹1000 (Individual price ₹300)
 * Combo Group: "COMBO200" -> 3 items for ₹500 (Individual price ₹200)
 */
export const calculateCartTotals = (cart) => {
  if (!cart || cart.length === 0) {
    return {
      subtotal: 0,
      total: 0,
      savings: 0,
      comboDetails: null,
      shipping: 0
    };
  }

  // 1. COMBO300 Offer (4 items for ₹1000, individual price ₹300)
  const COMBO300_PRICE = 300;
  const COMBO300_BUNDLE = 1000;
  const COMBO300_QTY = 4;

  const combo300Items = cart.filter(item => item.combo_group === "COMBO300" || (item.combo_group === null && item.price === 300));
  const totalCombo300Qty = combo300Items.reduce((sum, item) => sum + item.quantity, 0);
  const combo300Sets = Math.floor(totalCombo300Qty / COMBO300_QTY);
  const combo300ActualSum = combo300Items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // A bundle offer provides discount only when full sets of required quantity exist.
  // Remaining items are ALWAYS charged at their actual item price!
  const combo300PotentialSavings = combo300Sets * ((COMBO300_QTY * COMBO300_PRICE) - COMBO300_BUNDLE);
  const combo300Savings = Math.max(0, Math.min(combo300PotentialSavings, combo300ActualSum - (combo300Sets * COMBO300_BUNDLE)));
  const combo300AppliedPrice = combo300ActualSum - combo300Savings;

  // 2. COMBO200 Offer (3 items for ₹500, individual price ₹200)
  const COMBO200_PRICE = 200;
  const COMBO200_BUNDLE = 500;
  const COMBO200_QTY = 3;

  const combo200Items = cart.filter(item => item.combo_group === "COMBO200" || (item.combo_group === null && item.price === 200));
  const totalCombo200Qty = combo200Items.reduce((sum, item) => sum + item.quantity, 0);
  const combo200Sets = Math.floor(totalCombo200Qty / COMBO200_QTY);
  const combo200ActualSum = combo200Items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const combo200PotentialSavings = combo200Sets * ((COMBO200_QTY * COMBO200_PRICE) - COMBO200_BUNDLE);
  const combo200Savings = Math.max(0, Math.min(combo200PotentialSavings, combo200ActualSum - (combo200Sets * COMBO200_BUNDLE)));
  const combo200AppliedPrice = combo200ActualSum - combo200Savings;

  // Non-combo items
  const nonComboItems = cart.filter(item => 
    !(item.combo_group === "COMBO300" || (item.combo_group === null && item.price === 300)) &&
    !(item.combo_group === "COMBO200" || (item.combo_group === null && item.price === 200))
  );
  const nonComboPrice = nonComboItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const subtotal = combo300ActualSum + combo200ActualSum + nonComboPrice;
  const total = combo300AppliedPrice + combo200AppliedPrice + nonComboPrice;
  const totalSavings = combo300Savings + combo200Savings;

  // Create combined comboDetails for display
  let comboDetails = null;
  if (combo300Sets > 0 || combo200Sets > 0) {
    comboDetails = {
      groupName: combo300Sets > 0 && combo200Sets > 0 ? "COMBOS" : (combo300Sets > 0 ? "COMBO300" : "COMBO200"),
      totalItems: (combo300Sets > 0 ? totalCombo300Qty : 0) + (combo200Sets > 0 ? totalCombo200Qty : 0),
      sets: (combo300Sets > 0 ? combo300Sets : 0) + (combo200Sets > 0 ? combo200Sets : 0),
      appliedPrice: combo300AppliedPrice + combo200AppliedPrice,
      savings: totalSavings
    };
  }

  // Calculate Shipping Charges based on user rules
  const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
  const hasComboItem = cart.some(item => 
    item.combo_group === "COMBO300" || 
    item.combo_group === "COMBO200" || 
    item.price === 300 || 
    item.price === 200
  );

  let shipping = 0;
  if (total > 1500) {
    shipping = 0; // Free shipping for orders above 1500
  } else if (hasComboItem) {
    shipping = 50; // Special 50 shipping for offer products
  } else {
    // Tiered standard shipping based on total clothes quantity
    if (totalQty === 1 || totalQty === 2) {
      shipping = 50;
    } else if (totalQty === 3 || totalQty === 4) {
      shipping = 100;
    } else if (totalQty === 5 || totalQty === 6) {
      shipping = 120;
    } else if (totalQty >= 7) {
      shipping = 140;
    }
  }

  return {
    subtotal,
    total,
    savings: totalSavings,
    comboDetails,
    shipping
  };
};
