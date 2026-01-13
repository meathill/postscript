import {
  HomeIcon,
  SendIcon,
  SettingsIcon,
  LockIcon,
  ArrowRightLeftIcon,
  MailIcon,
  UsersIcon,
  CodeXmlIcon,
  ChevronRightIcon,
} from 'lucide-react-native';
import { SymbolWeight } from 'expo-symbols';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

// Mapping from SF Symbols to Lucide Icons
const MAPPING = {
  'house.fill': HomeIcon,
  'paperplane.fill': SendIcon,
  'chevron.left.forwardslash.chevron.right': CodeXmlIcon,
  'chevron.right': ChevronRightIcon,
  gear: SettingsIcon,
  'lock.fill': LockIcon,
  'arrow.right.arrow.left': ArrowRightLeftIcon,
  'envelope.fill': MailIcon,
  'person.2.fill': UsersIcon,
};

export type IconSymbolName = keyof typeof MAPPING;

/**
 * An icon component that uses native SF Symbols on iOS, and Lucide Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Lucide Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  const Icon = MAPPING[name];

  // Lucide icons don't support "style" prop directly for layout usually, but they do accept it in some versions for SVG props.
  // Ideally we pass color and size. If style contains color, we might miss it.
  // But IconSymbol usage passes color explicitly.

  if (!Icon) {
    return null;
  }

  return (
    <Icon
      color={color as string}
      size={size}
      style={style}
    />
  );
}
