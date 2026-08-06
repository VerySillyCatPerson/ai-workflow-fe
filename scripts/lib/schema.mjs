export function validateValue(value, rule, at, errors) {
  const types = Array.isArray(rule.type) ? rule.type : rule.type ? [rule.type] : [];
  const actual = value === null ? 'null' : Array.isArray(value) ? 'array' : Number.isInteger(value) ? 'integer' : typeof value === 'number' ? 'number' : typeof value;
  if (types.length && !types.includes(actual) && !(actual === 'integer' && types.includes('number'))) errors.push(`${at}: expected ${types.join('|')}, got ${actual}`);
  if ('const' in rule && value !== rule.const) errors.push(`${at}: must equal ${rule.const}`);
  if (rule.enum && !rule.enum.includes(value)) errors.push(`${at}: invalid value ${JSON.stringify(value)}`);
  if (typeof value === 'number') {
    if (rule.minimum !== undefined && value < rule.minimum) errors.push(`${at}: below minimum ${rule.minimum}`);
    if (rule.maximum !== undefined && value > rule.maximum) errors.push(`${at}: above maximum ${rule.maximum}`);
    if (rule.exclusiveMinimum !== undefined && value <= rule.exclusiveMinimum) errors.push(`${at}: must be greater than ${rule.exclusiveMinimum}`);
  }
  if (typeof value === 'string') {
    if (rule.pattern && !new RegExp(rule.pattern).test(value)) errors.push(`${at}: does not match ${rule.pattern}`);
    if (rule.minLength !== undefined && value.length < rule.minLength) errors.push(`${at}: shorter than ${rule.minLength}`);
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const key of rule.required ?? []) if (!(key in value)) errors.push(`${at}: missing ${key}`);
    if (rule.additionalProperties === false) for (const key of Object.keys(value)) if (!(key in (rule.properties ?? {}))) errors.push(`${at}: unknown property ${key}`);
    for (const [key, child] of Object.entries(value)) {
      const childRule = rule.properties?.[key] ?? (typeof rule.additionalProperties === 'object' ? rule.additionalProperties : null);
      if (childRule) validateValue(child, childRule, `${at}.${key}`, errors);
    }
  }
  if (Array.isArray(value) && rule.items) value.forEach((item, index) => validateValue(item, rule.items, `${at}[${index}]`, errors));
}
