import type {
  Project,
  ProjectChallenge,
  ProjectFuturePlan,
  ProjectLinks,
  ProjectTechnology,
} from "@prisma/client";

import type { LegacyProject, LegacyProjectLinks, LegacyProjectTechnology } from "../../types";

/**
 * Project serializer (README §3.5).
 *
 * Transforms a Prisma `Project` (with nested relations included) into the
 * [`LegacyProject`](src/types/index.ts:42) shape expected by the frontend.
 *
 * The frontend expects `challengesFaced` and `futurePlans` as plain string
 * arrays, while the DB stores them as ordered rows (`{ text, order }`).
 */

/** Prisma payload type for a project with all nested relations included. */
export type ProjectWithRelations = Project & {
  technologies: ProjectTechnology[];
  links: ProjectLinks | null;
  challenges: ProjectChallenge[];
  futurePlans: ProjectFuturePlan[];
};

export function serializeProject(project: ProjectWithRelations): LegacyProject {
  const technologies: LegacyProjectTechnology[] = project.technologies.map((t) => ({
    name: t.name,
    fullWidth: t.fullWidth,
  }));

  const links: LegacyProjectLinks = {
    live: project.links?.live ?? "#",
    clientRepo: project.links?.clientRepo ?? "",
    serverRepo: project.links?.serverRepo ?? "",
  };

  // Challenges and future plans are stored as ordered rows; emit as string[].
  const challengesFaced: string[] = [...project.challenges]
    .sort((a, b) => a.order - b.order)
    .map((c) => c.text);

  const futurePlans: string[] = [...project.futurePlans]
    .sort((a, b) => a.order - b.order)
    .map((f) => f.text);

  return {
    id: project.id,
    slug: project.slug,
    title: project.title,
    subtitle: project.subtitle,
    image: project.image,
    briefDescription: project.briefDescription,
    content: project.content,
    published: project.published,
    order: project.order,
    technologies,
    links,
    challengesFaced,
    futurePlans,
  };
}

export function serializeProjects(projects: ProjectWithRelations[]): LegacyProject[] {
  return projects.map(serializeProject);
}
