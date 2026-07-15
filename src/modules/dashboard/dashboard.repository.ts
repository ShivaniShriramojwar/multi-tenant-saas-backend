import { Bug } from "../bug/bug.model";
import { Order } from "../order/order.model";
import { Project } from "../project/project.model";
import { Task } from "../task/task.model";
import { User } from "../user/user.model";

import { PROJECT_STATUS } from "../../common/constants/project-status";
import { TASK_STATUS } from "../../common/constants/task-status";
import { BUG_STATUS } from "../../common/constants/bug-status";
import { ORDER_STATUS } from "../../common/constants/order-status";

const getDashboardCountsRepository = async (tenantId: string) => {
  return Promise.all([
    // Projects
    Project.countDocuments({ tenantId }),
    Project.countDocuments({ tenantId, status: PROJECT_STATUS.ACTIVE }),
    Project.countDocuments({ tenantId, status: PROJECT_STATUS.COMPLETED }),
    Project.countDocuments({ tenantId, status: PROJECT_STATUS.ON_HOLD }),

    // Tasks
    Task.countDocuments({ tenantId }),
    Task.countDocuments({ tenantId, status: TASK_STATUS.TODO }),
    Task.countDocuments({ tenantId, status: TASK_STATUS.IN_PROGRESS }),
    Task.countDocuments({ tenantId, status: TASK_STATUS.IN_REVIEW }),
    Task.countDocuments({ tenantId, status: TASK_STATUS.DONE }),
    Task.countDocuments({ tenantId, status: TASK_STATUS.BLOCKED }),

    // Bugs
    Bug.countDocuments({ tenantId }),
    Bug.countDocuments({ tenantId, status: BUG_STATUS.OPEN }),
    Bug.countDocuments({ tenantId, status: BUG_STATUS.IN_PROGRESS }),
    Bug.countDocuments({ tenantId, status: BUG_STATUS.FIXED }),
    Bug.countDocuments({ tenantId, status: BUG_STATUS.VERIFIED }),
    Bug.countDocuments({ tenantId, status: BUG_STATUS.CLOSED }),

    // Orders
    Order.countDocuments({ tenantId }),
    Order.countDocuments({ tenantId, status: ORDER_STATUS.PENDING }),
    Order.countDocuments({ tenantId, status: ORDER_STATUS.PROCESSING }),
    Order.countDocuments({ tenantId, status: ORDER_STATUS.COMPLETED }),
    Order.countDocuments({ tenantId, status: ORDER_STATUS.FAILED }),
    Order.countDocuments({ tenantId, status: ORDER_STATUS.CANCELLED }),

    // Users
    User.countDocuments({ tenantId }),
  ]);
};

export { getDashboardCountsRepository };
