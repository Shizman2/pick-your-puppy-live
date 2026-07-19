import AdminSidebar from "../../../components/admin/layout/AdminSidebar";
import TasksListClient from "../../../components/admin/tasks/TasksListClient";
import { getTasksPageData } from "../../../lib/activities";
import type { TasksPageData } from "../../../lib/activities";
import { getAdminUserEmail } from "../../../lib/getAdminUser";
import { getUnreadMessageCount } from "../../../lib/unreadCount";
import "../../../components/admin/layout/adminShell.css";
import "../../../components/admin/contacts/contacts.css";
import "../../../components/admin/tasks/tasks.css";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  let data: TasksPageData = { overdue: [], today: [], upcoming: [], noDueDate: [] };
  let loadError: string | null = null;

  try {
    data = await getTasksPageData();
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Unknown error loading tasks.";
  }

  const userEmail = await getAdminUserEmail();
  const unreadMessageCount = await getUnreadMessageCount();

  return (
    <AdminSidebar active="tasks" unreadMessageCount={unreadMessageCount} userEmail={userEmail}>
      {loadError ? (
        <div className="contacts-page">
          <div className="contacts-empty" style={{ textAlign: "left" }}>
            <strong>Couldn&apos;t load tasks.</strong>
            <p style={{ marginTop: 8 }}>
              <code>{loadError}</code>
            </p>
          </div>
        </div>
      ) : (
        <TasksListClient data={data} />
      )}
    </AdminSidebar>
  );
}
