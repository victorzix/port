import {
  siDocker,
  siDotnet,
  siExpress,
  siFlutter,
  siGithubactions,
  siJest,
  siLangchain,
  siMongodb,
  siNestjs,
  siNextdotjs,
  siNodedotjs,
  siPostgresql,
  siPrisma,
  siPython,
  siReact,
  siRedis,
  siRedux,
  siSocketdotio,
  siTypescript,
} from "simple-icons";

interface StackIconData {
  title: string;
  /** 24×24 SVG path, monochrome. */
  path: string;
}

/**
 * Stack label → Simple Icons glyph. Labels come straight from
 * `Experience.roles[].stack` in the message files, so they are locale-independent.
 * A label without an entry here simply renders without an icon.
 */
export const STACK_ICONS: Record<string, StackIconData> = {
  ".NET": siDotnet,
  "ASP.NET Core": siDotnet,
  Docker: siDocker,
  Express: siExpress,
  Flutter: siFlutter,
  "GitHub Actions": siGithubactions,
  Jest: siJest,
  LangChain: siLangchain,
  MongoDB: siMongodb,
  NestJS: siNestjs,
  "Next.js": siNextdotjs,
  "Node.js": siNodedotjs,
  PostgreSQL: siPostgresql,
  Prisma: siPrisma,
  Python: siPython,
  React: siReact,
  Redis: siRedis,
  Redux: siRedux,
  TypeScript: siTypescript,
  WebSockets: siSocketdotio,
};
