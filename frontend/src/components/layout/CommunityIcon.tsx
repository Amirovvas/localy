import { Building, Building2, Landmark, MapPin, School } from "lucide-react";
import type { CommunityCategory } from "@/lib/mockData";

const ICONS: Record<CommunityCategory, typeof Building2> = {
  university: Building2,
  school: School,
  district: MapPin,
  residential: Building,
  city: Landmark,
};

interface IProps {
  category: CommunityCategory;
  size?: number;
}

export const CommunityIcon = ({ category, size = 16 }: IProps) => {
  const Icon = ICONS[category];
  return <Icon size={size} />;
};

export default CommunityIcon;
