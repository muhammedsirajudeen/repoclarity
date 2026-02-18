/**
 * Mongoose schema parser utility.
 * Extracts model definitions from JavaScript/TypeScript source files
 * by parsing schema patterns using regex-based analysis.
 *
 * Supports:
 *  - new Schema({...})
 *  - new mongoose.Schema({...})
 *  - Multiple schemas per file
 *  - mongoose.model('Name', schema)
 *  - model('Name', schema) (destructured import)
 *  - export default mongoose.model(...)
 */

export interface ParsedField {
    name: string;
    type: string;
    required: boolean;
    ref?: string;
    isArray: boolean;
    defaultValue?: string;
    enumValues?: string[];
}

export interface ParsedModel {
    name: string;
    filePath: string;
    fields: ParsedField[];
}

/** Well-known Mongoose schema types */
const MONGOOSE_TYPES = new Set([
    'String', 'Number', 'Boolean', 'Date', 'Buffer',
    'ObjectId', 'Mixed', 'Map', 'Decimal128', 'UUID', 'BigInt',
]);

/** Normalise raw type strings like Schema.Types.ObjectId → ObjectId */
function normalizeType(raw: string): string {
    return raw
        .replace(/Schema\.Types\./g, '')
        .replace(/Schema\./g, '')
        .replace(/mongoose\./g, '');
}

/**
 * Expand Schema.Types prefix variants so we can match them as known types.
 */
function isKnownType(raw: string): boolean {
    return MONGOOSE_TYPES.has(normalizeType(raw));
}

// ── Model-name detection ────────────────────────────────────

/**
 * Find ALL model names declared in a file.
 * Returns a map of variable/schema name → model name.
 */
function findModelDeclarations(content: string): Map<string, string> {
    const models = new Map<string, string>();

    // mongoose.model('Name', schema)  or  model('Name', schema)
    const modelRegex =
        /(?:mongoose\.)?model\s*(?:<[^>]+>)?\s*\(\s*['"]([^'"]+)['"]\s*,\s*(\w+)/g;
    let m: RegExpExecArray | null;
    while ((m = modelRegex.exec(content)) !== null) {
        models.set(m[2], m[1]); // schemaVar → ModelName
    }

    // const Name = mongoose.model('Name', ...)  — capture both sides
    const assignRegex =
        /(?:const|let|var|export)\s+(\w+)\s*=\s*(?:mongoose\.)?model\s*(?:<[^>]+>)?\s*\(\s*['"]([^'"]+)['"]/g;
    while ((m = assignRegex.exec(content)) !== null) {
        models.set(m[1], m[2]);
    }

    return models;
}

/**
 * Find the schema variable name associated with a schema block that
 * starts at `blockStart` index in the content.
 * e.g. `const userSchema = new Schema({...})`  → "userSchema"
 */
function findSchemaVarName(
    content: string,
    blockStart: number
): string | null {
    // Look backwards from blockStart to find `const someVar =`
    const before = content.slice(
        Math.max(0, blockStart - 200),
        blockStart
    );
    const varMatch = before.match(
        /(?:const|let|var|export\s+(?:const|let|var)?)\s+(\w+)\s*=\s*$/
    );
    return varMatch ? varMatch[1] : null;
}

/**
 * Determine the model name for a schema block.
 */
function resolveModelName(
    content: string,
    blockStart: number,
    models: Map<string, string>,
    filePath: string
): string {
    const schemaVar = findSchemaVarName(content, blockStart);

    // If we know the model name from a model() call, use it
    if (schemaVar && models.has(schemaVar)) {
        return models.get(schemaVar)!;
    }

    // Try to infer from variable name: userSchema → User
    if (schemaVar) {
        const cleaned = schemaVar
            .replace(/Schema$/i, '')
            .replace(/schema$/i, '');
        if (cleaned.length > 0) {
            return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
        }
    }

    // Fallback: filename
    const fileName = filePath.split('/').pop() || '';
    const baseName = fileName.replace(/\.(ts|js|tsx|jsx|mjs|cjs)$/, '');
    return baseName.charAt(0).toUpperCase() + baseName.slice(1);
}

// ── Schema block extraction ──────────────────────────────────

/**
 * Find ALL `new Schema({...})` or `new mongoose.Schema({...})` blocks.
 * Returns array of {start, block} where start is the index
 * of the `new` keyword.
 */
function extractAllSchemaBlocks(
    content: string
): { start: number; block: string }[] {
    const results: { start: number; block: string }[] = [];
    const pattern = /new\s+(?:mongoose\.)?Schema\s*(?:<[^>]*>)?\s*\(\s*\{/g;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(content)) !== null) {
        const braceStart = content.indexOf('{', match.index);
        if (braceStart === -1) continue;

        // Match braces to find closing '}'
        let depth = 0;
        let i = braceStart;
        for (; i < content.length; i++) {
            if (content[i] === '{') depth++;
            else if (content[i] === '}') {
                depth--;
                if (depth === 0) break;
            }
        }
        if (depth !== 0) continue;

        results.push({
            start: match.index,
            block: content.slice(braceStart, i + 1),
        });
    }

    return results;
}

// ── Field parsing ────────────────────────────────────────────

function parseFieldValue(value: string): ParsedField | null {
    const field: ParsedField = {
        name: '',
        type: 'Mixed',
        required: false,
        isArray: false,
    };

    const trimmed = value.trim();

    // Simple type:  fieldName: String
    if (isKnownType(trimmed)) {
        field.type = normalizeType(trimmed);
        return field;
    }

    // Array shorthand: [String]  or  [{ type: ... }]
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        field.isArray = true;
        const inner = trimmed.slice(1, -1).trim();
        if (isKnownType(inner)) {
            field.type = normalizeType(inner);
            return field;
        }
        if (inner.startsWith('{')) {
            const innerParsed = parseFieldObject(inner);
            Object.assign(field, innerParsed, { isArray: true, name: '' });
        }
        return field;
    }

    // Object definition: { type: String, required: true, ... }
    if (trimmed.startsWith('{')) {
        return parseFieldObject(trimmed);
    }

    return field;
}

function parseFieldObject(objStr: string): ParsedField {
    const field: ParsedField = {
        name: '',
        type: 'Mixed',
        required: false,
        isArray: false,
    };

    // type
    const typeMatch = objStr.match(
        /type\s*:\s*(?:\[\s*)?(\w+(?:\.\w+(?:\.\w+)?)?)\s*(?:\])?/
    );
    if (typeMatch) {
        field.type = normalizeType(typeMatch[1]);
    }

    // array via type: [X]
    if (/type\s*:\s*\[/.test(objStr)) {
        field.isArray = true;
    }

    // ref
    const refMatch = objStr.match(/ref\s*:\s*['"]([^'"]+)['"]/);
    if (refMatch) {
        field.ref = refMatch[1];
        if (field.type === 'Mixed') field.type = 'ObjectId';
    }

    // required  (supports `required: true` and `required: [true, 'msg']`)
    if (/required\s*:\s*(\[?\s*true)/.test(objStr)) {
        field.required = true;
    }

    // default
    const defaultMatch = objStr.match(
        /default\s*:\s*(?:['"]([^'"]*)['"]\s*|(\w[\w.]*)\s*)/
    );
    if (defaultMatch) {
        field.defaultValue = defaultMatch[1] ?? defaultMatch[2];
    }

    // enum
    const enumMatch = objStr.match(/enum\s*:\s*\[([^\]]+)\]/);
    if (enumMatch) {
        field.enumValues = enumMatch[1]
            .split(',')
            .map((v) => v.trim().replace(/['"]/g, ''))
            .filter(Boolean);
    }

    return field;
}

/**
 * Parse top-level fields from a schema block string.
 */
function parseTopLevelFields(schemaBlock: string): ParsedField[] {
    const fields: ParsedField[] = [];
    const inner = schemaBlock.slice(1, -1).trim();
    if (!inner) return fields;

    // Split by top-level commas (respecting nesting depth)
    const entries: string[] = [];
    let depth = 0;
    let current = '';
    for (let i = 0; i < inner.length; i++) {
        const ch = inner[i];
        if (ch === '{' || ch === '[' || ch === '(') depth++;
        else if (ch === '}' || ch === ']' || ch === ')') depth--;
        else if (ch === ',' && depth === 0) {
            entries.push(current.trim());
            current = '';
            continue;
        }
        current += ch;
    }
    if (current.trim()) entries.push(current.trim());

    for (const entry of entries) {
        const keyMatch = entry.match(/^['"]?(\w+)['"]?\s*:\s*([\s\S]+)$/);
        if (!keyMatch) continue;

        const fieldName = keyMatch[1];
        const fieldValueStr = keyMatch[2].trim();

        const parsed = parseFieldValue(fieldValueStr);
        if (parsed) {
            parsed.name = fieldName;
            fields.push(parsed);
        }
    }

    return fields;
}

// ── Public API ───────────────────────────────────────────────

/**
 * Parse all Mongoose schemas from a set of files.
 * Supports multiple schemas per file.
 */
export function parseMongooseSchemas(
    files: { path: string; content: string }[]
): ParsedModel[] {
    const models: ParsedModel[] = [];
    const seenNames = new Set<string>();

    for (const file of files) {
        // Quick guard — must contain 'Schema' somewhere
        if (!file.content.includes('Schema')) continue;

        const modelDecls = findModelDeclarations(file.content);
        const blocks = extractAllSchemaBlocks(file.content);

        for (const { start, block } of blocks) {
            const name = resolveModelName(
                file.content, start, modelDecls, file.path
            );
            const fields = parseTopLevelFields(block);

            if (fields.length === 0) continue;

            // Deduplicate by name
            const uniqueName = seenNames.has(name)
                ? `${name}_${file.path.split('/').pop()}`
                : name;
            seenNames.add(uniqueName);

            models.push({
                name: uniqueName,
                filePath: file.path,
                fields,
            });
        }
    }

    return models;
}

/**
 * Check if a file path could contain Mongoose model definitions.
 * Broadened to catch more patterns.
 */
export function isModelFile(filePath: string): boolean {
    const lower = filePath.toLowerCase();

    // Skip test files, node_modules, config, etc.
    const skipPatterns = [
        'node_modules', '.test.', '.spec.', '__tests__',
        '__mocks__', '.d.ts', 'migrations', 'seeders',
        'dist/', 'build/', '.next/', '.git/',
    ];
    if (skipPatterns.some((p) => lower.includes(p))) return false;

    // Common model directories
    const modelDirs = [
        '/models/', '/model/', '/schemas/', '/schema/',
        '/entities/', '/entity/', '/collections/',
        '/db/', '/database/',
    ];
    if (modelDirs.some((d) => lower.includes(d))) return true;

    // Files named like models
    const fileName = lower.split('/').pop() || '';
    if (
        fileName.includes('model') ||
        fileName.includes('schema') ||
        fileName.includes('entity')
    ) {
        return true;
    }

    return false;
}

/**
 * Check if file content contains any Mongoose schema patterns.
 * Use this as a secondary filter for files outside model directories.
 */
export function hasSchemaContent(content: string): boolean {
    if (!content.includes('Schema')) return false;
    return /new\s+(?:mongoose\.)?Schema\s*(?:<[^>]*>)?\s*\(/.test(content);
}
