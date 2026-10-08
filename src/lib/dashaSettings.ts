import { DEFAULT_DASHA_SETTINGS, type DashaSettings } from '@/types';
import { isVariantChoice } from '@/lib/vimshottariVariants';

// Handles both the new { dashas: {...} } format and the old
// { showBcp, showVimshottari, dashaSystem } format from localStorage / saved charts.
//
// Two properties matter here:
// - Every key still present in DashaSettings survives a reload. The previous
//   version rebuilt the object from bcp/vimshottari/vds only, so the toggles
//   for all other systems — and charaOptions/rasiOptions entirely — silently
//   reverted to defaults every time the app started.
// - Keys removed from DashaSettings (the v2.15 placeholder cleanup) are
//   dropped, because the copy iterates the default's own keys.
export function migrateDashaSettings(raw: unknown): DashaSettings {
  if (!raw || typeof raw !== 'object') return DEFAULT_DASHA_SETTINGS;
  const obj = raw as Record<string, unknown>;

  if (obj.dashas && typeof obj.dashas === 'object') {
    const stored = obj.dashas as Record<string, unknown>;
    const dashas = { ...DEFAULT_DASHA_SETTINGS.dashas };
    for (const key of Object.keys(dashas) as (keyof DashaSettings['dashas'])[]) {
      const value = stored[key];
      if (typeof value === 'boolean') dashas[key] = value;
    }
    return {
      dashas,
      charaOptions: obj.charaOptions && typeof obj.charaOptions === 'object'
        ? { ...DEFAULT_DASHA_SETTINGS.charaOptions, ...(obj.charaOptions as DashaSettings['charaOptions']) }
        : DEFAULT_DASHA_SETTINGS.charaOptions,
      rasiOptions: obj.rasiOptions && typeof obj.rasiOptions === 'object'
        ? { ...DEFAULT_DASHA_SETTINGS.rasiOptions, ...(obj.rasiOptions as DashaSettings['rasiOptions']) }
        : DEFAULT_DASHA_SETTINGS.rasiOptions,
      variantChoice: isVariantChoice(obj.variantChoice) ? obj.variantChoice : DEFAULT_DASHA_SETTINGS.variantChoice,
    };
  }

  // Old format: showBcp / showVimshottari / dashaSystem
  return {
    ...DEFAULT_DASHA_SETTINGS,
    dashas: {
      ...DEFAULT_DASHA_SETTINGS.dashas,
      bcp:         obj.showBcp !== false,
      vimshottari: obj.showVimshottari !== false,
      vds:         obj.dashaSystem === 'vds',
    },
  };
}
