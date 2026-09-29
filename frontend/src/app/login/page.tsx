import type { Metadata } from "next";
import Login from "@/components/pages/login/Login";

export const metadata: Metadata = {
  title: "Вход — Localy",
};

const page = () => {
  return <Login />;
};

export default page;
