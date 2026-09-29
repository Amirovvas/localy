import { User } from "lucide-react";
import css from "./avatar.module.css";

interface IProps {
  size?: number;
  online?: boolean;
  className?: string;
}

export const Avatar = ({ size = 34, online, className }: IProps) => (
  <span
    className={`${css.avatar} ${className ?? ""}`}
    style={{ width: size, height: size }}
  >
    <User size={Math.round(size * 0.55)} strokeWidth={2} />
    {online && <span className={css.status} />}
  </span>
);

export default Avatar;
