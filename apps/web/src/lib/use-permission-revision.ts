"use client";

import { useEffect, useState } from "react";
import { PERMISSION_MATRIX_CHANGED_EVENT } from "./permissions";

/** Buộc các guard/menu tính lại quyền ngay sau khi ma trận thay đổi. */
export function usePermissionRevision(): number {
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1);
    window.addEventListener(PERMISSION_MATRIX_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(PERMISSION_MATRIX_CHANGED_EVENT, refresh);
  }, []);
  return revision;
}
