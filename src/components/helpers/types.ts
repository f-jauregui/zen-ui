// Props:
export type Align = 'left' | 'right' | 'center';

export type Position = 'top' | 'right' | 'bottom' | 'left';

export type TooltipVariant = 'dark' | 'light' | 'error';

export type TextVariant = null | 'heading' | 'label' | 'support';

export type NotificationVariant = 'success' | 'info' | 'warning' | 'error';

export type TextSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export type IconSizes = 'sm' | 'md' | 'lg';

export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type Spacings = Size | null | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';

export type PaddingShorthand = Spacings | None | string;

export type None = 'none';

export type TriggerEvent = 'click' | 'hover';

export type Resize = 'none' | 'both' | 'horizontal' | 'vertical' | 'initial' | 'inherit';

export type PositionVariant = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface AvatarData {
  userName?: string;
  email?: string;
  imageUrl?: string;
  background?: string;
  color?: string;
  size?: string;
}

export interface AvatarColor {
  background?: string;
  color?: string;
}

export interface Notification {
  heading: string;
  content: string;
  variant: NotificationVariant;
  position: PositionVariant;
}
