type OrderWithCreatedAt = {
  id: string;
  created_at: string;
};

export function sortOrdersByNewest<T extends OrderWithCreatedAt>(orders: readonly T[]) {
  return [...orders].sort((left, right) => {
    const createdAtCompare = right.created_at.localeCompare(left.created_at);

    if (createdAtCompare !== 0) {
      return createdAtCompare;
    }

    return right.id.localeCompare(left.id);
  });
}

export function sortOrdersForOperationalBoard<T extends OrderWithCreatedAt>(
  orders: readonly T[]
) {
  return sortOrdersByNewest(orders);
}
