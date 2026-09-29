// The site's one icon system is Lucide (@lucide/astro): outline strokes on a
// 24px grid with round caps, the closest open match to the SF Symbols Flow
// draws in the Mac app. Icons render to inline SVG at build time, so a page
// ships only the paths it uses and no script. This map names Flow's own
// primitives once, so every mock and diagram picks the same glyph for the
// same idea. Vendors are never drawn with their logo.
import Aperture from '@lucide/astro/icons/aperture';
import Asterisk from '@lucide/astro/icons/asterisk';
import BookOpen from '@lucide/astro/icons/book-open';
import ChartColumn from '@lucide/astro/icons/chart-column';
import Check from '@lucide/astro/icons/check';
import CodeXml from '@lucide/astro/icons/code-xml';
import Cpu from '@lucide/astro/icons/cpu';
import Folder from '@lucide/astro/icons/folder';
import Globe from '@lucide/astro/icons/globe';
import Image from '@lucide/astro/icons/image';
import MessageCircleQuestionMark from '@lucide/astro/icons/message-circle-question-mark';
import Mic from '@lucide/astro/icons/mic';
import MoonStar from '@lucide/astro/icons/moon-star';
import Play from '@lucide/astro/icons/play';
import RotateCcwClock from '@lucide/astro/icons/rotate-ccw-clock';
import Route from '@lucide/astro/icons/route';
import Send from '@lucide/astro/icons/send';
import SquareTerminal from '@lucide/astro/icons/square-terminal';
import Quote from '@lucide/astro/icons/quote';

export { default as FileIcon } from '@lucide/astro/icons/file';
export { default as ChevronRightIcon } from '@lucide/astro/icons/chevron-right';
export { default as ArrowRightIcon } from '@lucide/astro/icons/arrow-right';
export { default as PlayIcon } from '@lucide/astro/icons/play';

/** Sources, apps and destinations a path starts from or ends in. */
export const MARK_ICON = {
  folder: Folder,
  web: Globe,
  code: CodeXml,
  terminal: SquareTerminal,
  claude: Asterisk,
  openai: Aperture,
  model: Cpu,
  dictation: Mic,
  history: RotateCcwClock,
  chart: ChartColumn,
  epub: BookOpen,
} as const;

/** Flow capabilities: what happens to the document along the way. */
export const CAPABILITY_ICON = {
  sources: Quote,
  jobs: Play,
  review: Check,
  publish: Send,
  ask: MessageCircleQuestionMark,
  night: MoonStar,
  picture: Image,
  router: Route,
} as const;

/** Shared stroke weights, so every size reads as the same family. */
export const STROKE = { mark: 1.75, cap: 2.25, file: 1.5 } as const;
