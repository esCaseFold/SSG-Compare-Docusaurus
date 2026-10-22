import React from 'react';
import Playground from '@theme-original/Playground';

// This wrapper is used to support the `export default` syntax in the Playground component.
// Use Docusaurus commands to get rid of this

const HAS_EXPORT_DEFAULT = /^[ \t]*export\s+default\b/m;
const HAS_RENDER_CALL = /\brender\s*\(/;

function transformCode(code) {
  let name = null;

  let out = code
    // strip imports (single and multi-line); names must be in the live scope
    .replace(/^[ \t]*import\s[\s\S]*?from\s+['"][^'"]+['"];?[ \t]*$/gm, '')
    .replace(/^[ \t]*import\s+['"][^'"]+['"];?[ \t]*$/gm, '')
    // named exports: just drop the `export` keyword
    .replace(/^([ \t]*)export\s+(?=(?:const|let|var|function|class|async)\b)/gm, '$1');

  // export default function Foo / class Foo / async function Foo
  out = out.replace(
    /^([ \t]*)export\s+default\s+(async\s+)?(function|class)\s+(\w+)/m,
    (_, ws, asyncKw, kw, n) => {
      name = n;
      return `${ws}${asyncKw || ''}${kw} ${n}`;
    },
  );

  // export default Foo;
  if (!name) {
    out = out.replace(
      /^[ \t]*export\s+default\s+(\w+)\s*;?[ \t]*$/m,
      (_, n) => {
        name = n;
        return '';
      },
    );
  }

  // anything else: arrow functions, anonymous functions/classes, memo(...), etc.
  if (!name) {
    out = out.replace(/^([ \t]*)export\s+default\s+/m, (_, ws) => {
      name = 'DefaultExport';
      return `${ws}const DefaultExport = `;
    });
  }

  if (name && !HAS_RENDER_CALL.test(out)) {
    out += `\n;render(<${name} />);`;
  }
  return out;
}

export default function PlaygroundWrapper(props) {
  const code = props.children;

  if (typeof code !== 'string' || !HAS_EXPORT_DEFAULT.test(code)) {
    return <Playground {...props} />;
  }

  // Rewrite the code ourselves and hand the result to Playground as children,
  // instead of relying on the transformCode prop being honored.
  return (
    <Playground {...props} noInline>
      {transformCode(code)}
    </Playground>
  );
}