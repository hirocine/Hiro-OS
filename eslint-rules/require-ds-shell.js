/**
 * ESLint rule — enforce `ds-shell` on portal-rendered DS containers.
 *
 * Radix Dialog/Sheet/Drawer render their content via React Portal, *outside*
 * the app's <div className="ds-shell"> root. CSS rules scoped to the shell
 * (e.g. `.ds-shell .btn { ... }`) therefore don't apply, and any `<button
 * className="btn">` inside a dialog renders as an unstyled UA button.
 *
 * This rule catches new <DialogContent> / <ResponsiveDialogContent> /
 * <SheetContent> / <DrawerContent> usages that forget to carry `ds-shell` in
 * their className. Migrated commit history: 3a229b56, b964ed53.
 */

const PORTAL_COMPONENTS = new Set([
  'DialogContent',
  'ResponsiveDialogContent',
  'SheetContent',
  'DrawerContent',
]);

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        "Portal-rendered DS containers must include the 'ds-shell' class so DS scoped styles apply.",
    },
    schema: [],
    messages: {
      missing:
        "<{{name}}> renders in a React portal — add 'ds-shell' to its className so .btn/.ds-card/etc styles cascade inside the dialog.",
    },
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        const elName = node.name && node.name.type === 'JSXIdentifier' ? node.name.name : null;
        if (!elName || !PORTAL_COMPONENTS.has(elName)) return;

        const classAttr = node.attributes.find(
          (a) =>
            a.type === 'JSXAttribute' &&
            a.name &&
            a.name.type === 'JSXIdentifier' &&
            a.name.name === 'className'
        );

        const hasShell = (() => {
          if (!classAttr || !classAttr.value) return false;
          // <X className="…ds-shell…">
          if (classAttr.value.type === 'Literal' && typeof classAttr.value.value === 'string') {
            return classAttr.value.value.includes('ds-shell');
          }
          // <X className={…}> — rough check on source text covers template
          // literals, cn(...) calls, and ternary expressions.
          if (classAttr.value.type === 'JSXExpressionContainer') {
            const src = context.sourceCode.getText(classAttr.value);
            return src.includes('ds-shell');
          }
          return false;
        })();

        if (!hasShell) {
          context.report({ node, messageId: 'missing', data: { name: elName } });
        }
      },
    };
  },
};
