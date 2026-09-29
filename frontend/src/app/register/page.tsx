import type { Metadata } from "next";
import Register from "@/components/pages/register/Register";

export const metadata: Metadata = {
  title: "Регистрация — Localy",
};

const page = () => {
  return <Register />;
};

export default page;
