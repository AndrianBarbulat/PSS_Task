import raw from './assessment.json';
import { calculatePSG } from '../lib/calculatePSG.js';

// Fixed assessment evidence, not a live operational feed. UTC is used only as a
// common arithmetic frame; the workbook does not specify the source timezone.
export const report = calculatePSG(raw);
export const capacity = calculatePSG(raw, { restoreShare: 1 });
export const number = value => value.toLocaleString('en-GB');
export const percent = value => `${(value * 100).toFixed(1)}%`;
export const source = {
  filename: 'Analyst_PSS_Assessment_Data_v2.xlsx',
  snapshot: '5 October 2026, 09:00',
  sha256: '62AFBCB5E519FFF63F84DF8D368A9604223D2E86BB95FBBB1883ECBAD2FEFD5D',
};
