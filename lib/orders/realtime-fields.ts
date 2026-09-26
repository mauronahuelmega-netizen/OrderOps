export function hasRealtimeField<Row extends object, Key extends keyof Row>(
  row: Partial<Row>,
  key: Key
) {
  return Object.prototype.hasOwnProperty.call(row, key);
}

export function mergeRealtimeField<Row extends object, Key extends keyof Row>(
  row: Partial<Row>,
  key: Key,
  previousValue: Row[Key]
): Row[Key] {
  return hasRealtimeField(row, key) ? (row[key] as Row[Key]) : previousValue;
}
