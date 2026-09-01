/** Demo payloads for Part 3 agents when API is offline */

export const guidanceMock = [
  {
    category: 'procedural',
    title: 'Verify continuous chain of custody',
    description:
      'Ensure every transfer of physical or digital evidence is logged with two-person confirmation and seal / hash numbers.',
    legal_reference: 'Chain of Custody principles (Evidence Act + judicial precedents)',
    priority: 'high',
  },
  {
    category: 'gap',
    title: 'Resolve open AI-flagged contradiction(s)',
    description:
      'Each AI-flagged contradiction must be confirmed or dismissed by an officer with a short note.',
    legal_reference: null,
    priority: 'high',
  },
  {
    category: 'next_step',
    title: 'Cross-reference autopsy with timeline and weapon',
    description:
      'Injury pattern must be consistent with recovered weapon and witness accounts. Forensic medical officer review required.',
    legal_reference: 'CrPC provisions on inquest & post-mortem',
    priority: 'high',
  },
  {
    category: 'procedural',
    title: 'Record / review statements under CrPC 161 formalities',
    description:
      'Witness statements should be recorded promptly, read over to the witness, and any later improvements noted.',
    legal_reference: 'CrPC / BNSS Section 161',
    priority: 'medium',
  },
  {
    category: 'next_step',
    title: 'Review applicability of BNS Section 103 — Murder',
    description:
      'Whoever commits murder shall be punished with death or imprisonment for life, and shall also be liable to fine.',
    legal_reference: 'BNS Section 103',
    priority: 'medium',
  },
]

export const autopsyMock = {
  label: 'AI-generated investigative hypothesis — requires forensic medical officer review',
  status: 'analyzed',
  hypotheses: [
    {
      type: 'injury_pattern',
      text: 'Injury indicators extracted: wound, injury, sharp-force.',
      confidence: 0.7,
    },
    {
      type: 'weapon_link',
      text: "Autopsy weapon-related language: ['blade']. Other evidence weapon mentions: ['knife'].",
      confidence: 0.6,
    },
    {
      type: 'time_of_death',
      text: 'Estimated time-of-death language found: “Estimated time of death between 20:00 and 22:00”.',
      confidence: 0.65,
    },
    {
      type: 'negative_finding',
      text: 'Autopsy language indicates absence of gunshot / firearm injuries.',
      confidence: 0.75,
    },
  ],
  warnings: [
    'Compare estimated TOD against verified CCTV / witness times on the case timeline.',
    'Forensic medical officer should compare injury morphology with recovered object.',
  ],
  consistency_checks: [
    {
      check: 'weapon_injury_alignment',
      result: 'partial_overlap',
      detail: 'Shared blade/knife family terms — morphological match still required.',
    },
    {
      check: 'tod_vs_timeline',
      result: 'requires_manual_comparison',
      detail: 'TOD language present; align with timeline events.',
    },
  ],
  disclaimer:
    'This agent does not determine cause or manner of death. All outputs are investigative hypotheses for human medical review only.',
}

export const chargesheetMock = {
  label: 'AI-generated pre-filing QA checklist — requires human legal reviewer',
  overall_risk_level: 'medium',
  findings: [
    'All evidence items carry hash-chain metadata.',
    'Autopsy / post-mortem evidence is present in the file.',
  ],
  risks: [
    {
      severity: 'high',
      issue: 'Unresolved contradiction flag(s)',
      recommendation:
        'Confirm or dismiss every open flag with a short note before filing.',
    },
    {
      severity: 'medium',
      issue: 'Timeline events still marked AI-extracted / unverified',
      recommendation:
        'Promote key events to verified status after officer review, or exclude them from the chargesheet narrative.',
    },
  ],
  checklist: [
    'Resolve all open AI contradiction flags and record officer notes.',
    'Review and verify (or exclude) AI-extracted timeline events.',
    'Re-run chain integrity verification and attach result to the file.',
    'Ensure autopsy hypotheses reviewed by forensic medical officer.',
    'Review witness statements for CrPC 161 formalities.',
    'List of witnesses complete and contactable',
    'List of documents / material objects attached',
    'Copies prepared for supply to accused',
  ],
  disclaimer:
    'This is a pre-filing quality-assurance checklist. It is not a verdict on case strength. A human legal reviewer must sign off before filing.',
}

export const chainMock = {
  valid: true,
  entries: 3,
  message: 'Chain of 3 entries is intact',
  hashes: [
    {
      id: 1,
      file_hash: 'd617d25f281ef616…',
      chain_hash: 'd0a5db5b1a3bfd4c…',
    },
    {
      id: 2,
      file_hash: 'a2ecf46ea21ebcd5…',
      chain_hash: '7841dfa88c1f0bc5…',
    },
    {
      id: 3,
      file_hash: '4e3df4e68e045e9b…',
      chain_hash: '01e19d37791aea89…',
    },
  ],
}
