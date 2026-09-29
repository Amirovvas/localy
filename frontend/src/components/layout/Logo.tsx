import { MessageCircle } from "lucide-react";
import css from "./logo.module.css";

interface IProps {
  size?: number;
}

export const LogoMark = ({ size = 18 }: IProps) => (
  <span className={css.mark} style={{ width: size + 14, height: size + 14 }}>
    <MessageCircle size={size} strokeWidth={2.4} />
  </span>
);

export default LogoMark;
