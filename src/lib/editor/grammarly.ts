/**
 * The attributes that stop the Grammarly extension attaching to a field.
 * Grammarly is blocked in the cell editor unless the user allows it.
 */
export function grammarlyAttributes(allowed: boolean): Record<string, string> {
    return allowed
        ? {}
        : {
              'data-gramm': 'false',
              'data-gramm_editor': 'false',
              'data-enable-grammarly': 'false'
          };
}
