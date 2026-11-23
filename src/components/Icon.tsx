import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useColors } from '../theme/useTheme';

export type IconName =
  | 'bluetooth'
  | 'clock'
  | 'user'
  | 'calendar'
  | 'back'
  | 'check'
  | 'alert'
  | 'qr'
  | 'users'
  | 'plus'
  | 'logout'
  | 'download'
  | 'wifi-off'
  | 'lock'
  | 'flask';

type Props = { name: IconName; size?: number; color?: string };

// Stroke icons drawn on a 24x24 grid (Lucide-style geometry).
export default function Icon({ name, size = 24, color }: Props) {
  const palette = useColors();
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? palette.text}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {render(name)}
    </Svg>
  );
}

function render(name: IconName) {
  switch (name) {
    case 'bluetooth':
      return <Path d="m7 7 10 10-5 5V2l5 5L7 17" />;
    case 'clock':
      return (
        <>
          <Circle cx={12} cy={12} r={10} />
          <Path d="M12 6v6l4 2" />
        </>
      );
    case 'user':
      return (
        <>
          <Path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <Circle cx={12} cy={7} r={4} />
        </>
      );
    case 'users':
      return (
        <>
          <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <Circle cx={9} cy={7} r={4} />
          <Path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <Path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </>
      );
    case 'calendar':
      return (
        <>
          <Rect x={3} y={4} width={18} height={18} rx={2} />
          <Path d="M16 2v4M8 2v4M3 10h18" />
        </>
      );
    case 'back':
      return <Path d="m12 19-7-7 7-7M19 12H5" />;
    case 'check':
      return <Path d="M20 6 9 17l-5-5" />;
    case 'alert':
      return (
        <>
          <Path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
          <Path d="M12 9v4M12 17h.01" />
        </>
      );
    case 'qr':
      return (
        <>
          <Rect x={3} y={3} width={7} height={7} rx={1} />
          <Rect x={14} y={3} width={7} height={7} rx={1} />
          <Rect x={3} y={14} width={7} height={7} rx={1} />
          <Path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M20 20h.01M17 20v-3" />
        </>
      );
    case 'plus':
      return <Path d="M12 5v14M5 12h14" />;
    case 'logout':
      return <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />;
    case 'download':
      return <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />;
    case 'wifi-off':
      return <Path d="M12 20h.01M8.5 16.43a5 5 0 0 1 7 0M5 12.86a10 10 0 0 1 5.17-2.69M2 8.82a15 15 0 0 1 4.17-2.65M22 8.82a15 15 0 0 0-11.29-3.76M2 2l20 20" />;
    case 'lock':
      return (
        <>
          <Rect x={3} y={11} width={18} height={11} rx={2} />
          <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </>
      );
    case 'flask':
      return <Path d="M10 2v7.31L4.5 19a2 2 0 0 0 1.7 3h11.6a2 2 0 0 0 1.7-3L14 9.31V2M8.5 2h7M7 16h10" />;
  }
}
