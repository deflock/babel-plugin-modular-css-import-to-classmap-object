import {stripExtension} from '@deflock/path';

/**
 * @param {Object} t
 * @returns {Object}
 */
export default function visitor({types: t}) {
    return {
        visitor: {
            ImportDeclaration(path, state) {
                if (state.opts.import_regex) {
                    const r = new RegExp(state.opts.import_regex);
                    if (!r.test(path.node.source.value)) {
                        return;
                    }
                }

                const sheet = stripExtension(path.node.source.value, '.mcss');
                const sheetName = state.opts.pathResolver.relativeToBasedir(sheet, state.file.opts.filename, {
                    aliasType: 'css',
                    isFromDir: false,
                });

                let classes;

                if (typeof state.opts.classes === 'function') {
                    classes = state.opts.classes();
                } else {
                    classes = state.opts.classes;
                }

                const obj = classes[sheetName];

                const properties = Object.keys(obj).map(k => {
                    return t.objectProperty(t.stringLiteral(k), t.stringLiteral(obj[k]));
                });

                const variableName = path.node.specifiers[0].local.name;

                const variable = t.variableDeclarator(t.identifier(variableName), t.objectExpression(properties));

                path.replaceWith({
                    type: 'VariableDeclaration',
                    kind: 'const',
                    declarations: [variable],
                });
            },
        },
    };
}
