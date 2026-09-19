/**
 * Shared tool filtering logic used across both runtime (ToolsEngine)
 * and display layer (selectors)
 *
 * SPRINT-M 2026-05-19: LocalSystemManifest eliminado — bodasdehoy es web puro,
 * el tool local-system desktop-only ya no existe. Mantenemos el helper para
 * añadir filtros platform-specific futuros sin tocar consumidores.
 */

/**
 * Check if a tool should be enabled based on platform-specific constraints
 * @param toolId - The tool identifier to check
 * @returns true if the tool should be enabled, false otherwise
 */
export const shouldEnableTool = (_toolId: string): boolean => {
  // Add platform-specific filters here as needed
  // if (toolId === SomeOtherPlatformSpecificTool.identifier) {
  //   return someCondition;
  // }

  return true;
};

/**
 * Filter tool IDs based on platform constraints
 * @param toolIds - Array of tool identifiers to filter
 * @returns Filtered array of tool identifiers
 */
export const filterToolIds = (toolIds: string[]): string[] => {
  return toolIds.filter(shouldEnableTool);
};
