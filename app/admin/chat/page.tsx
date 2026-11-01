import { AdminChatClient } from "./AdminChatClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "แชทกับลูกค้า (Live Customer Chat)",
  description: "ระบบสนทนาและตอบข้อความลูกค้า onlineshop",
};

export default function AdminChatPage() {
  return <AdminChatClient />;
}
