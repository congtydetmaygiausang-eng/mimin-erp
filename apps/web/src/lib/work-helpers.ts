// ============================================
// MIMIN ERP - Work Helpers (v89.6.9.3)
// Processing logic for Subcontracting & Operations
// ============================================

import { formatVND } from "./master-schema";

export interface WorkTask {
  id: string;
  code: string;
  title: string;
  quantity: number;
  unitPrice: number;
  assignedTo: string;
  status: string;
  createdAt: string;
}

export function calculateTotalWage(tasks: WorkTask[]): number {
  return tasks.reduce((sum, task) => sum + task.quantity * task.unitPrice, 0);
}

export function formatWorkSummary(tasks: WorkTask[]): string {
  const total = calculateTotalWage(tasks);
  return `Tổng số ${tasks.length} công việc - Thành tiền: ${formatVND(total)}`;
}
