/**
 * Shared HTML sanitizer for text-md (after markdown→HTML) and custom-html.
 * These atoms never execute JavaScript: scripts, event handlers, javascript:
 * URLs, and high-risk embeds are stripped before dangerouslySetInnerHTML.
 */
import DOMPurify from 'dompurify'

/** Tags that must never appear in atom HTML. */
const FORBID_TAGS = [
  'script',
  'iframe',
  'object',
  'embed',
  'form',
  'input',
  'button',
  'textarea',
  'select',
  'link',
  'meta',
  'base',
  'applet',
  'template',
  'noscript',
]

/**
 * Sanitize untrusted HTML for safe rendering in the canvas / play / thumbs.
 * Prefer default DOMPurify allow-list; only forbid known-dangerous tags.
 * Style *attributes* remain (DOMPurify CSS-sanitizes them); style *elements*
 * are forbidden so no raw CSS blocks sneak in.
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty) return ''
  return DOMPurify.sanitize(dirty, {
    FORBID_TAGS,
    FORBID_CONTENTS: ['script', 'style'],
    ALLOW_UNKNOWN_PROTOCOLS: false,
    // Do not ADD_ATTR / ADD_TAGS — keep the default safe subset.
  })
}
