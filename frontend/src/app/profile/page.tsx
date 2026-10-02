import type { Metadata } from "next";
import Profile from "@/components/pages/profile/Profile";

export const metadata: Metadata = {
  title: "Профиль — Localy",
};

const page = () => {
  return <Profile />;
};

export default page;
