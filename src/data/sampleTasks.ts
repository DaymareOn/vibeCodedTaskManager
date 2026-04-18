import type { Task } from '../types/Task';

// Seed date for computing relative dates
const SEED_DATE = new Date('2026-01-01T00:00:00Z');

// Helper function to compute dates relative to SEED_DATE
const offsetDate = (baseDate: Date, days: number, hours: number = 0, minutes: number = 0): string => {
  const milliseconds = days * 24 * 60 * 60 * 1000 + hours * 60 * 60 * 1000 + minutes * 60 * 1000;
  const result = new Date(baseDate.getTime() + milliseconds);
  return result.toISOString();
};

// Helper to format date as YYYY-MM-DD
const offsetDateOnly = (baseDate: Date, days: number): string => {
  const milliseconds = days * 24 * 60 * 60 * 1000;
  const result = new Date(baseDate.getTime() + milliseconds);
  return result.toISOString().slice(0, 10);
};

// Sample tasks for testing and as examples for new users
export const sampleTasks: Task[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    title: 'File income tax return',
    description:
      'Complete and submit the annual income tax return before the April 1st deadline. Gather all W-2s, 1099s, and deductible expense receipts.',
    status: 'todo',
    dueDate: offsetDateOnly(SEED_DATE, 90), // 2026-04-01
    tags: ['finance', 'admin', 'annual'],
    createdAt: offsetDate(SEED_DATE, 9, 9, 0), // 2026-01-10T09:00:00.000Z
    updatedAt: offsetDate(SEED_DATE, 9, 9, 0),
    taskValue: { type: 'direct', amount: { amount: 2000, currency: 'EUR' } },
    targetDelivery: offsetDateOnly(SEED_DATE, 90),
    remainingEstimate: { iso: 'P2D' },
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    title: 'Schedule roof cleaning appointment',
    description:
      'Call the roof maintenance company to schedule a cleaning and inspection. Last done 18 months ago — check for moss and blocked gutters.',
    status: 'todo',
    dueDate: offsetDateOnly(SEED_DATE, 134), // 2026-05-15
    tags: ['home', 'maintenance'],
    createdAt: offsetDate(SEED_DATE, 33, 11, 30), // 2026-02-03T11:30:00.000Z
    updatedAt: offsetDate(SEED_DATE, 33, 11, 30),
    taskValue: { type: 'direct', amount: { amount: 300, currency: 'EUR' } },
    targetDelivery: offsetDateOnly(SEED_DATE, 134),
    remainingEstimate: { iso: 'PT1H' },
  },
  {
    // Sub-task of "File income tax return" (001)
    id: '00000000-0000-0000-0000-000000000003',
    title: 'Declare child carer salary slips',
    description:
      "Submit the nanny's monthly salary slips to the social security office. Include hours worked, gross pay, and any reimbursed expenses.",
    status: 'in-progress',
    dueDate: offsetDateOnly(SEED_DATE, 119), // 2026-04-30
    tags: ['finance', 'admin', 'childcare'],
    createdAt: offsetDate(SEED_DATE, 59, 8, 0), // 2026-03-01T08:00:00.000Z
    updatedAt: offsetDate(SEED_DATE, 90, 14, 20), // 2026-04-01T14:20:00.000Z
    taskValue: { type: 'direct', amount: { amount: 800, currency: 'EUR' } },
    targetDelivery: offsetDateOnly(SEED_DATE, 119),
    remainingEstimate: { iso: 'PT2H' },
    parentId: '00000000-0000-0000-0000-000000000001',
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    title: 'Renew home insurance policy',
    description:
      "Home insurance expires at the end of the month. Compare quotes from at least three providers before renewing. Check that coverage includes the new garden shed.",
    status: 'todo',
    dueDate: offsetDateOnly(SEED_DATE, 117), // 2026-04-28
    tags: ['finance', 'home', 'insurance'],
    createdAt: offsetDate(SEED_DATE, 73, 10, 0), // 2026-03-15T10:00:00.000Z
    updatedAt: offsetDate(SEED_DATE, 73, 10, 0),
    taskValue: {
      type: 'event',
      unitCost: { amount: 15000, currency: 'EUR' },
      probability: 0.05,
      period: { iso: 'P1Y' },
    },
    targetDelivery: offsetDateOnly(SEED_DATE, 117),
    remainingEstimate: { iso: 'PT1H' },
  },
  {
    id: '00000000-0000-0000-0000-000000000005',
    title: 'Book annual dentist check-up',
    description:
      "Schedule a 6-month check-up and hygienist appointment for the whole family. Last visit was October — don't forget to check school schedules before booking.",
    status: 'todo',
    dueDate: offsetDateOnly(SEED_DATE, 120), // 2026-05-01
    tags: ['health', 'family'],
    createdAt: offsetDate(SEED_DATE, 78, 9, 15), // 2026-03-20T09:15:00.000Z
    updatedAt: offsetDate(SEED_DATE, 78, 9, 15),
    taskValue: { type: 'direct', amount: { amount: 200, currency: 'EUR' } },
    targetDelivery: offsetDateOnly(SEED_DATE, 120),
    remainingEstimate: { iso: 'PT30M' },
  },
  {
    id: '00000000-0000-0000-0000-000000000006',
    title: 'Car annual service and MOT',
    description:
      'Book the car in for its annual service and MOT test. Due by end of April. Request brake pad check and tyre rotation as well.',
    status: 'in-progress',
    dueDate: offsetDateOnly(SEED_DATE, 114), // 2026-04-25
    tags: ['auto', 'maintenance'],
    createdAt: offsetDate(SEED_DATE, 86, 8, 45), // 2026-03-28T08:45:00.000Z
    updatedAt: offsetDate(SEED_DATE, 99, 16, 0), // 2026-04-10T16:00:00.000Z
    taskValue: { type: 'direct', amount: { amount: 500, currency: 'EUR' } },
    targetDelivery: offsetDateOnly(SEED_DATE, 114),
    remainingEstimate: { iso: 'P1D' },
  },
  {
    id: '00000000-0000-0000-0000-000000000007',
    title: 'Pay quarterly electricity bill',
    description:
      'Electricity bill for Q1 is due. Submit meter reading online and pay via bank transfer. Check if direct debit needs to be updated.',
    status: 'done',
    dueDate: offsetDateOnly(SEED_DATE, 89), // 2026-03-31
    tags: ['finance', 'utilities'],
    createdAt: offsetDate(SEED_DATE, 59, 7, 30), // 2026-03-01T07:30:00.000Z
    updatedAt: offsetDate(SEED_DATE, 86, 10, 10), // 2026-03-28T10:10:00.000Z
    taskValue: { type: 'direct', amount: { amount: 180, currency: 'EUR' } },
    targetDelivery: offsetDateOnly(SEED_DATE, 89),
    remainingEstimate: { iso: 'PT30M' },
  },
  {
    id: '00000000-0000-0000-0000-000000000008',
    title: "Buy school supplies for new term",
    description:
      "Purchase the stationery items on the school's supply list for the new term: notebooks, coloured pencils, ruler, glue sticks, and a new backpack.",
    status: 'done',
    dueDate: offsetDateOnly(SEED_DATE, 63), // 2026-03-05
    tags: ['family', 'school', 'shopping'],
    createdAt: offsetDate(SEED_DATE, 50, 12, 0), // 2026-02-20T12:00:00.000Z
    updatedAt: offsetDate(SEED_DATE, 62, 18, 0), // 2026-03-04T18:00:00.000Z
    taskValue: { type: 'direct', amount: { amount: 80, currency: 'EUR' } },
    targetDelivery: offsetDateOnly(SEED_DATE, 63),
    remainingEstimate: { iso: 'PT2H' },
  },
  {
    id: '00000000-0000-0000-0000-000000000009',
    title: 'Plan summer family holiday',
    description:
      'Research destinations for a 2-week summer holiday in July or August. Compare flight and accommodation packages. Check passport expiry dates for all family members.',
    status: 'in-progress',
    dueDate: offsetDateOnly(SEED_DATE, 151), // 2026-06-01
    tags: ['family', 'travel', 'leisure'],
    createdAt: offsetDate(SEED_DATE, 44, 20, 0), // 2026-02-14T20:00:00.000Z
    updatedAt: offsetDate(SEED_DATE, 68, 21, 30), // 2026-03-10T21:30:00.000Z
    taskValue: { type: 'direct', amount: { amount: 3000, currency: 'EUR' } },
    targetDelivery: offsetDateOnly(SEED_DATE, 151),
    remainingEstimate: { iso: 'P3D' },
  },
  {
    id: '00000000-0000-0000-0000-000000000010',
    title: 'Fix leaky bathroom faucet',
    description:
      'The cold tap in the bathroom has been dripping for a week. Replace the washer or call a plumber if the cartridge is worn. Turn off water supply before starting.',
    status: 'todo',
    tags: ['home', 'repairs'],
    createdAt: offsetDate(SEED_DATE, 94, 17, 0), // 2026-04-05T17:00:00.000Z
    updatedAt: offsetDate(SEED_DATE, 94, 17, 0),
    taskValue: { type: 'direct', amount: { amount: 150, currency: 'EUR' } },
    targetDelivery: offsetDateOnly(SEED_DATE, 180),
    remainingEstimate: { iso: 'PT3H' },
  },
  {
    // Sub-task of "Renew home insurance policy" (004)
    id: '00000000-0000-0000-0000-000000000011',
    title: 'Organise home contents inventory',
    description:
      'Create a written and photographic inventory of home contents for insurance purposes. Store a copy in cloud storage and share with the insurance provider.',
    status: 'todo',
    tags: ['home', 'admin', 'insurance'],
    createdAt: offsetDate(SEED_DATE, 76, 14, 0), // 2026-03-18T14:00:00.000Z
    updatedAt: offsetDate(SEED_DATE, 76, 14, 0),
    taskValue: { type: 'direct', amount: { amount: 100, currency: 'EUR' } },
    targetDelivery: offsetDateOnly(SEED_DATE, 270),
    remainingEstimate: { iso: 'P1D' },
    parentId: '00000000-0000-0000-0000-000000000004',
  },
  {
    id: '00000000-0000-0000-0000-000000000012',
    title: 'Renew driving licence',
    description:
      'Driving licence expires in June. Complete the DVLA online renewal form, upload a recent photo, and pay the renewal fee.',
    status: 'todo',
    dueDate: offsetDateOnly(SEED_DATE, 139), // 2026-05-20
    tags: ['admin', 'legal'],
    createdAt: offsetDate(SEED_DATE, 91, 9, 0), // 2026-04-02T09:00:00.000Z
    updatedAt: offsetDate(SEED_DATE, 91, 9, 0),
    taskValue: { type: 'direct', amount: { amount: 500, currency: 'EUR' } },
    targetDelivery: offsetDateOnly(SEED_DATE, 139),
    remainingEstimate: { iso: 'PT1H' },
  },
  {
    id: '00000000-0000-0000-0000-000000000013',
    title: 'Set up emergency savings fund',
    description:
      'Open a dedicated high-interest savings account and automate a monthly transfer to build a 3-month emergency fund. Research ISA vs regular savings account options.',
    status: 'in-progress',
    tags: ['finance', 'savings'],
    createdAt: offsetDate(SEED_DATE, 0, 0, 0), // 2026-01-01T00:00:00.000Z
    updatedAt: offsetDate(SEED_DATE, 45, 11, 0), // 2026-02-15T11:00:00.000Z
    taskValue: { type: 'direct', amount: { amount: 5000, currency: 'EUR' } },
    targetDelivery: offsetDateOnly(SEED_DATE, 365),
    remainingEstimate: { iso: 'P2D' },
  },
  {
    id: '00000000-0000-0000-0000-000000000014',
    title: 'Donate old clothes and toys',
    description:
      "Sort through the kids' outgrown clothes, unused toys, and old books. Bag items in good condition for the local charity shop and arrange a drop-off.",
    status: 'done',
    tags: ['home', 'family', 'charity'],
    createdAt: offsetDate(SEED_DATE, 31, 10, 0), // 2026-02-01T10:00:00.000Z
    updatedAt: offsetDate(SEED_DATE, 52, 15, 45), // 2026-02-22T15:45:00.000Z
    taskValue: { type: 'direct', amount: { amount: 50, currency: 'EUR' } },
    targetDelivery: offsetDateOnly(SEED_DATE, 60),
    remainingEstimate: { iso: 'PT3H' },
  },
  {
    id: '00000000-0000-0000-0000-000000000015',
    title: 'Review and update will',
    description:
      "Review the existing will with a solicitor following the birth of a second child. Update beneficiaries, guardianship clauses, and the executor's contact details.",
    status: 'todo',
    dueDate: offsetDateOnly(SEED_DATE, 181), // 2026-07-01
    tags: ['legal', 'admin', 'finance'],
    createdAt: offsetDate(SEED_DATE, 83, 10, 30), // 2026-03-25T10:30:00.000Z
    updatedAt: offsetDate(SEED_DATE, 83, 10, 30),
    taskValue: { type: 'direct', amount: { amount: 50000, currency: 'EUR' } },
    targetDelivery: offsetDateOnly(SEED_DATE, 181),
    remainingEstimate: { iso: 'P3D' },
  },
  {
    // Sub-task of "Plan summer family holiday" (009)
    id: '00000000-0000-0000-0000-000000000016',
    title: 'Check passport expiry dates for all family members',
    description:
      'Verify that all passports are valid for at least 6 months beyond the return date. Renew any that are due to expire before or during the trip.',
    status: 'todo',
    tags: ['family', 'travel', 'admin'],
    createdAt: offsetDate(SEED_DATE, 44, 20, 30), // 2026-02-14T20:30:00.000Z
    updatedAt: offsetDate(SEED_DATE, 44, 20, 30),
    taskValue: { type: 'direct', amount: { amount: 300, currency: 'EUR' } },
    targetDelivery: offsetDateOnly(SEED_DATE, 120),
    remainingEstimate: { iso: 'PT1H' },
    parentId: '00000000-0000-0000-0000-000000000009',
  },
  {
    // Sub-task of "Plan summer family holiday" (009)
    id: '00000000-0000-0000-0000-000000000017',
    title: 'Compare and book flights and accommodation',
    description:
      'Research flight options and accommodation packages for the destination shortlist. Book once the best option is identified.',
    status: 'todo',
    tags: ['family', 'travel', 'leisure'],
    createdAt: offsetDate(SEED_DATE, 44, 21, 0), // 2026-02-14T21:00:00.000Z
    updatedAt: offsetDate(SEED_DATE, 44, 21, 0),
    taskValue: { type: 'direct', amount: { amount: 2500, currency: 'EUR' } },
    targetDelivery: offsetDateOnly(SEED_DATE, 151),
    remainingEstimate: { iso: 'P1D' },
    parentId: '00000000-0000-0000-0000-000000000009',
  },
];
