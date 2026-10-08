import type { Metadata } from "next";
import Direct from "@/components/pages/direct/Direct";

export const metadata: Metadata = {
  title: "Личные сообщения — Localy",
};

const page = () => {
  return <Direct />;
};

export default page;
