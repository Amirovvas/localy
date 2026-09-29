import type { Metadata } from "next";
import Admin from "@/components/pages/admin/Admin";

export const metadata: Metadata = {
  title: "Админ-панель — Localy",
};

const page = () => {
  return <Admin />;
};

export default page;
