import { getDashboardCountsRepository } from "./dashboard.repository";

const getDashboardCountsService = async (tenantId: string) => {
  const [
    // Projects
    totalProjects,
    activeProjects,
    completedProjects,
    onHoldProjects,

    // Tasks
    totalTasks,
    todoTasks,
    inProgressTasks,
    reviewTasks,
    completedTasks,
    blockedTasks,

    // Bugs
    totalBugs,
    openBugs,
    inProgressBugs,
    fixedBugs,
    verifiedBugs,
    closedBugs,

    // Orders
    totalOrders,
    pendingOrders,
    processingOrders,
    completedOrders,
    failedOrders,
    cancelledOrders,

    // Users
    totalUsers,
  ] = await getDashboardCountsRepository(tenantId);

  return {
    projects: {
      total: totalProjects,
      active: activeProjects,
      completed: completedProjects,
      onHold: onHoldProjects,
    },

    tasks: {
      total: totalTasks,
      todo: todoTasks,
      inProgress: inProgressTasks,
      inReview: reviewTasks,
      completed: completedTasks,
      blocked: blockedTasks,
    },

    bugs: {
      total: totalBugs,
      open: openBugs,
      inProgress: inProgressBugs,
      fixed: fixedBugs,
      verified: verifiedBugs,
      closed: closedBugs,
    },

    orders: {
      total: totalOrders,
      pending: pendingOrders,
      processing: processingOrders,
      completed: completedOrders,
      failed: failedOrders,
      cancelled: cancelledOrders,
    },

    users: {
      total: totalUsers,
    },
  };
};

export { getDashboardCountsService };
