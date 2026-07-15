interface DashboardResponse {
  projects: {
    total: number;
  };

  tasks: {
    total: number;
    pending: number;
    completed: number;
  };

  bugs: {
    total: number;
    open: number;
    resolved: number;
  };

  orders: {
    total: number;
    pending: number;
    completed: number;
  };

  users: {
    total: number;
  };
}

export { DashboardResponse };
