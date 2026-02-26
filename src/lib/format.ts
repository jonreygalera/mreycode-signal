/**
 * Abbreviates numbers into human-readable strings (e.g., 1K, 1M, 1B)
 */
export function abbreviateNumber(value: number): string {
  if (value === 0) return "0";
  
  const absValue = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  
  const units = [
    { value: 1e18, symbol: "Qi" },
    { value: 1e15, symbol: "Q" },
    { value: 1e12, symbol: "T" },
    { value: 1e9, symbol: "B" },
    { value: 1e6, symbol: "M" },
    { value: 1e3, symbol: "K" },
  ];
  
  const unit = units.find(u => absValue >= u.value);
  
  if (!unit) return sign + absValue.toLocaleString();
  
  const abbreviated = absValue / unit.value;
  
  // Format to 1 decimal place if it's not a whole number, otherwise keep it clean
  const formatted = abbreviated % 1 === 0 
    ? abbreviated.toString() 
    : abbreviated.toFixed(1).replace(/\.0$/, "");
    
  return sign + formatted + unit.symbol;
}
