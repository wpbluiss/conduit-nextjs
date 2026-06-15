export interface Household {
  id: string;
  name: string;
  savings_goal: number;
  monthly_savings_target: number;
  goal_start_date: string;
  goal_target_date: string | null;
  expected_next_deposit: number;
  expected_deposit_date: string | null;
  expected_deposit_note: string | null;
  join_code: string | null;
  plan: string;
  plan_status: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_end: string | null;
  created_at: string;
}

export interface Person {
  id: string;
  household_id: string;
  name: string;
  role: string;
  color: string;
}

export interface Account {
  id: string;
  household_id: string;
  name: string;
  type: string;
  balance: number;
  credit_limit: number | null;
  apr: number | null;
  owner_tag: string;
  institution: string | null;
  notes: string | null;
  updated_at: string;
}

export interface Paycheck {
  id: string;
  household_id: string;
  person_id: string | null;
  person_tag: string;
  job: string | null;
  pay_date: string;
  gross: number;
  take_home: number;
  mileage_reimbursement: number;
  notes: string | null;
}

export interface Inflow {
  id: string;
  household_id: string;
  person_tag: string;
  date: string;
  amount: number;
  source: string | null;
  notes: string | null;
}

export interface Expense {
  id: string;
  household_id: string;
  name: string;
  category: string;
  amount: number;
  person_tag: string;
  date: string;
  recurring: boolean;
  recurrence: string;
  due_day: number | null;
  due_date: string | null;
  paid: boolean;
  paid_date: string | null;
  notes: string | null;
}

export interface Debt {
  id: string;
  household_id: string;
  name: string;
  balance: number;
  original_balance: number;
  apr: number;
  min_payment: number;
  due_day: number | null;
  status: string;
  settle_amount: number | null;
  person_tag: string;
  notes: string | null;
}

export interface ChildSupport {
  id: string;
  household_id: string;
  person_id: string | null;
  monthly_amount: number;
  remaining_balance: number;
  pay_window: string;
  notes: string | null;
}

export interface Payment {
  id: string;
  household_id: string;
  kind: string;
  ref_id: string | null;
  label: string | null;
  amount: number;
  date: string;
  on_time: boolean | null;
  notes: string | null;
}

export interface SavingsLog {
  id: string;
  household_id: string;
  date: string;
  amount: number;
  note: string | null;
}

export interface Investment {
  id: string;
  household_id: string;
  bucket: string;
  ticker: string;
  shares: number;
  cost_basis: number;
  current_price: number;
  last_price_update: string | null;
  notes: string | null;
}

export interface CreditScore {
  id: string;
  household_id: string;
  person_id: string | null;
  person_tag: string;
  date: string;
  score: number;
  bureau: string | null;
  notes: string | null;
}

export interface AiMessage {
  id: string;
  household_id: string;
  role: string;
  content: string;
  created_at: string;
}

export interface Vault {
  id: string;
  household_id: string;
  name: string;
  emoji: string;
  category: string;
  target_amount: number;
  saved_amount: number;
  status: string;
  color: string;
  sort: number;
}

export interface Snapshot {
  household: Household;
  people: Person[];
  accounts: Account[];
  paychecks: Paycheck[];
  inflows: Inflow[];
  expenses: Expense[];
  debts: Debt[];
  childSupport: ChildSupport | null;
  payments: Payment[];
  savingsLog: SavingsLog[];
  investments: Investment[];
  creditScores: CreditScore[];
  vaults: Vault[];
}
