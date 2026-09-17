"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase, isSupabaseEnabled } from "@/lib/supabase/client";
import { useSession } from "@/components/session-provider";

export type WorkspaceRole = "OWNER" | "ADMIN" | "MANAGER" | "ACCOUNTANT" | "TEAM_LEAD" | "WORKER" | "DELIVERY" | "VIEWER" | "CUSTOMER";
export type DataScope = "SELF" | "ASSIGNED" | "TEAM" | "ORGANIZATION" | "SYSTEM";

export interface OrganizationWorkspace {
  id: string;
  code: string;
  name: string;
  organizationType: "SYSTEM" | "COMPANY" | "HOUSEHOLD_BUSINESS" | "WORKSHOP" | "SUPPLIER" | "CUSTOMER";
  workspaceRole: WorkspaceRole;
  dataScope: DataScope;
  teamCode?: string;
}

interface WorkspaceContextValue {
  workspaces: OrganizationWorkspace[];
  activeWorkspace: OrganizationWorkspace | null;
  loading: boolean;
  selectWorkspace: (organizationId: string) => void;
  canSeeOrganization: (organizationId: string) => boolean;
}

const Context = createContext<WorkspaceContextValue | null>(null);
const ACTIVE_WORKSPACE_KEY = "mimin_active_workspace_v1";

type MembershipRow = { organization_id: string; workspace_role: WorkspaceRole; data_scope: DataScope; team_code: string | null };
type OrganizationRow = { id: string; code: string; name: string; organization_type: OrganizationWorkspace["organizationType"] };

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useSession();
  const [workspaces, setWorkspaces] = useState<OrganizationWorkspace[]>([]);
  const [activeId, setActiveId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!user) { setWorkspaces([]); setLoading(false); return; }
      const savedId = localStorage.getItem(ACTIVE_WORKSPACE_KEY) || "";
      if (!isSupabaseEnabled || !supabase) {
        const fallbackOrganizationId = user.organizationId
          || ((user.role === "supplier" || user.role === "partner") && user.maNV ? `ncc:${user.maNV}` : "")
          || (user.role.includes("customer") && user.maNV ? `kh:${user.maNV}` : "")
          || "mimin";
        const fallback: OrganizationWorkspace = {
          id: fallbackOrganizationId, code: user.organizationCode || user.maNV || "MIMIN", name: user.organizationName || user.name || "MIMIN",
          organizationType: user.role === "supplier" ? "SUPPLIER" : user.role === "partner" ? "WORKSHOP" : user.role.includes("customer") ? "CUSTOMER" : "SYSTEM",
          workspaceRole: (user.workspaceRole as WorkspaceRole | undefined) || (user.role === "admin" ? "ADMIN" : "WORKER"),
          dataScope: (user.dataScope as DataScope | undefined) || (user.role === "admin" ? "SYSTEM" : "SELF"),
        };
        setWorkspaces([fallback]); setActiveId(savedId || fallback.id); setLoading(false); return;
      }
      const { data: memberData } = await supabase.from("erp_organization_members").select("organization_id,workspace_role,data_scope,team_code").eq("user_id", user.id).eq("is_active", true);
      const members = (memberData || []) as MembershipRow[];
      const ids = members.map((member) => member.organization_id);
      const { data: organizationData } = ids.length ? await supabase.from("erp_organizations").select("id,code,name,organization_type").in("id", ids) : { data: [] };
      if (cancelled) return;
      const organizations = (organizationData || []) as OrganizationRow[];
      const list = members.flatMap((member) => {
        const organization = organizations.find((item) => item.id === member.organization_id);
        return organization ? [{ id: organization.id, code: organization.code, name: organization.name, organizationType: organization.organization_type, workspaceRole: member.workspace_role, dataScope: member.data_scope, teamCode: member.team_code || undefined }] : [];
      });
      setWorkspaces(list);
      setActiveId(list.some((item) => item.id === savedId) ? savedId : list[0]?.id || "");
      setLoading(false);
    };
    void load();
    return () => { cancelled = true; };
  }, [user]);

  const activeWorkspace = useMemo(() => workspaces.find((item) => item.id === activeId) || workspaces[0] || null, [activeId, workspaces]);
  const selectWorkspace = (organizationId: string) => {
    if (!workspaces.some((item) => item.id === organizationId)) return;
    localStorage.setItem(ACTIVE_WORKSPACE_KEY, organizationId);
    setActiveId(organizationId);
  };
  const canSeeOrganization = (organizationId: string) => Boolean(workspaces.some((item) => item.id === organizationId) || activeWorkspace?.dataScope === "SYSTEM");

  return <Context.Provider value={{ workspaces, activeWorkspace, loading, selectWorkspace, canSeeOrganization }}>{children}</Context.Provider>;
}

export function useWorkspace() {
  const context = useContext(Context);
  if (!context) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return context;
}
