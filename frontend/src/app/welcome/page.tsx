import type { Metadata } from "next";
import Landing from "@/components/pages/landing/Landing";

export const metadata: Metadata = {
  title: "Localy — анонимный чат твоего района, вуза и школы",
  description:
    "Общайся с соседями, однокурсниками и одноклассниками анонимно: имя и почта никому не видны, в чате ты — Аноним #N.",
};

const page = () => {
  return <Landing />;
};

export default page;
