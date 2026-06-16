export type AdminOrderAssignment = {
  assigned_to: string | null;
  assigned_at: string | null;
};

type OnlineOperatorLike = {
  userId: string;
  name: string;
};

type AssignmentLabelInput = {
  assignedTo: string | null;
  currentUserId: string;
  onlineOperators?: OnlineOperatorLike[];
};

export function patchOrderAssignment<T extends AdminOrderAssignment>(
  order: T,
  assignment: AdminOrderAssignment
) {
  return {
    ...order,
    assigned_to: assignment.assigned_to,
    assigned_at: assignment.assigned_at
  };
}

export function buildOrderAssignmentLabel({
  assignedTo,
  currentUserId,
  onlineOperators = []
}: AssignmentLabelInput) {
  if (!assignedTo) {
    return null;
  }

  if (assignedTo === currentUserId) {
    return "A tu cargo";
  }

  const matchingOperator = onlineOperators.find((operator) => operator.userId === assignedTo);

  return matchingOperator?.name ? `A cargo de ${matchingOperator.name}` : "A cargo de Operador";
}

export function buildOrderAssignmentOwnerLabel({
  assignedTo,
  currentUserId,
  onlineOperators = []
}: AssignmentLabelInput) {
  if (!assignedTo) {
    return "Sin responsable";
  }

  if (assignedTo === currentUserId) {
    return "A tu cargo";
  }

  const matchingOperator = onlineOperators.find((operator) => operator.userId === assignedTo);

  return matchingOperator?.name ? `A cargo de ${matchingOperator.name}` : "A cargo de Operador";
}

export function buildOrderAssignmentActionLabel(input: {
  assignedTo: string | null;
  currentUserId: string;
}) {
  if (!input.assignedTo) {
    return "Tomar pedido";
  }

  if (input.assignedTo === input.currentUserId) {
    return "Liberar";
  }

  return "Tomar igual";
}

export function buildOrderContextualPresenceLabel(input: {
  viewingNames: string[];
  assignedTo: string | null;
  onlineOperators?: OnlineOperatorLike[];
}) {
  const { viewingNames, assignedTo, onlineOperators = [] } = input;

  if (viewingNames.length === 0) {
    return null;
  }

  const assignedName = assignedTo
    ? onlineOperators.find((operator) => operator.userId === assignedTo)?.name ?? null
    : null;

  if (viewingNames.length === 1) {
    if (assignedName && viewingNames[0] === assignedName) {
      return `${viewingNames[0]} también está viendo`;
    }

    return `${viewingNames[0]} viendo`;
  }

  return `${viewingNames.length} viendo este pedido`;
}
