import captions from './captions.json';
import course from './course.json';
import media from './media-manifest.json';
import roles from './roles.json';
import ui from './ui.json';
import values from './values.json';
import { buildContent } from './loader';

const fileName = (path: string) => path.split('/').pop() ?? path;
const byFileName = (modules: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(modules).map(([path, data]) => [fileName(path), data]));

/** All course content, validated once at start-up. Throws ContentValidationError on bad content. */
export const content = buildContent({
  course,
  media,
  captions,
  roles,
  values,
  screens: byFileName(import.meta.glob<unknown>('./screens/*.json', { eager: true, import: 'default' })),
  scenarios: byFileName(import.meta.glob<unknown>('./scenarios/*.json', { eager: true, import: 'default' })),
  questions: byFileName(import.meta.glob<unknown>('./questions/*.json', { eager: true, import: 'default' })),
});

/** Interface microcopy. Kept with the content so wording is editable outside components. */
export { ui };
