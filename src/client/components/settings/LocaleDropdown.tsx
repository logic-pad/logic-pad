import { memo } from 'react';
import { useLingui } from '@lingui/react/macro';
import { SUPPORTED_LOCALES, type Locale } from '../../locales/i18n';
import { useLocale } from '../../router/useLocale.ts';
import { tip } from '../Tooltip.tsx';

// Do not translate the language labels below
const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  ja: '日本語',
};

export default memo(function LocaleDropdown() {
  const { t } = useLingui();
  const [locale, setLocale] = useLocale();
  return (
    <div {...tip(t`Choose the language of the interface`, 'bottom')}>
      <fieldset className="fieldset">
        <label className="label w-full justify-between cursor-pointer">
          <span className="label-text">{t`Language`}</span>
          <select
            className="select select-md w-fit select-bordered"
            value={locale}
            onChange={e => {
              void setLocale(e.currentTarget.value as Locale);
            }}
          >
            {SUPPORTED_LOCALES.map(code => (
              <option key={code} value={code}>
                {LOCALE_LABELS[code]}
              </option>
            ))}
          </select>
        </label>
      </fieldset>
    </div>
  );
});
