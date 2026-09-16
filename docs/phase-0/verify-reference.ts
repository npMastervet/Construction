/** Design reference checker; no application services, network, or database access. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

type MoneyTotals = { net: string; vat: string; gross: string; paid: string; outstanding: string };
interface Line { quantity: string; unitPrice: string }
interface Cost {
  id: string;
  status: "DRAFT" | "POSTED" | "VOID";
  documentDate: string;
  dueDate: string | null;
  mode: "VAT_EXCLUDED" | "VAT_INCLUDED" | "NON_VAT";
  rate: string;
  items: Line[];
  payments: { amount: string; status: "POSTED" | "REVERSED"; paidDate: string }[];
  expected: MoneyTotals & { paymentStatus: "UNPAID" | "PARTIALLY_PAID" | "PAID"; overdue: boolean };
}
interface Reference {
  kind: string;
  asOfDate: string;
  projects: {
    id: string;
    contractNet: string;
    boqItems: (Line & { expectedAmount: string })[];
    expectedBaseline: string;
    costs: Cost[];
    expected: MoneyTotals & { baselineRemaining: string; contractLessActual: string };
  }[];
  pricing: { cost: string; rate: string; markupPrice: string; marginPrice: string };
  allocation: { rate: string; enteredAmounts: string[]; expectedNet: string[]; expectedVat: string[] };
}

const reference: Reference = JSON.parse(readFileSync(join(__dirname, "reference-cases.json"), "utf8"));
assert.equal(reference.kind, "synthetic-design-reference");
assert.equal(reference.projects.length, 2);

function scaled(value: string, digits: number): bigint {
  assert.match(value, /^\d+(?:\.\d+)?$/, `Invalid decimal: ${value}`);
  const [whole = "0", fraction = ""] = value.split(".");
  assert.ok(fraction.length <= digits, `Too many decimal places: ${value}`);
  return BigInt(whole) * 10n ** BigInt(digits) + BigInt(fraction.padEnd(digits, "0") || "0");
}
function roundHalfUp(numerator: bigint, denominator: bigint): bigint {
  assert.ok(numerator >= 0n && denominator > 0n);
  return (2n * numerator + denominator) / (2n * denominator);
}
function format(cents: bigint): string {
  const negative = cents < 0n;
  const absolute = negative ? -cents : cents;
  return `${negative ? "-" : ""}${absolute / 100n}.${String(absolute % 100n).padStart(2, "0")}`;
}
function lineAmount(line: Line): bigint {
  return roundHalfUp(scaled(line.quantity, 4) * scaled(line.unitPrice, 4), 1_000_000n);
}
function tax(entered: bigint, mode: Cost["mode"], rate: bigint) {
  assert.ok(rate >= 0n && rate <= 1_000_000n);
  if (mode === "NON_VAT") {
    assert.equal(rate, 0n);
    return { net: entered, vat: 0n, gross: entered };
  }
  if (mode === "VAT_EXCLUDED") {
    const vat = roundHalfUp(entered * rate, 1_000_000n);
    return { net: entered, vat, gross: entered + vat };
  }
  assert.equal(mode, "VAT_INCLUDED");
  const net = roundHalfUp(entered * 1_000_000n, 1_000_000n + rate);
  return { net, vat: entered - net, gross: entered };
}

let checkedCosts = 0;
for (const project of reference.projects) {
  let baseline = 0n;
  for (const item of project.boqItems) {
    const amount = lineAmount(item);
    assert.equal(format(amount), item.expectedAmount, `${project.id}: BOQ item`);
    baseline += amount;
  }
  assert.equal(format(baseline), project.expectedBaseline, `${project.id}: baseline`);
  const total = { net: 0n, vat: 0n, gross: 0n, paid: 0n, outstanding: 0n };
  for (const cost of project.costs) {
    assert.ok(cost.documentDate <= reference.asOfDate);
    const entered = cost.items.reduce((sum, item) => sum + lineAmount(item), 0n);
    const amounts = tax(entered, cost.mode, scaled(cost.rate, 6));
    const paid = cost.payments.filter((payment) => payment.status === "POSTED" && payment.paidDate <= reference.asOfDate)
      .reduce((sum, payment) => sum + scaled(payment.amount, 2), 0n);
    const outstanding = amounts.gross - paid;
    assert.ok(outstanding >= 0n, `${cost.id}: overpayment`);
    const actual = {
      net: format(amounts.net), vat: format(amounts.vat), gross: format(amounts.gross),
      paid: format(paid), outstanding: format(outstanding),
      paymentStatus: paid === 0n ? "UNPAID" : outstanding === 0n ? "PAID" : "PARTIALLY_PAID",
      overdue: cost.dueDate !== null && cost.dueDate < reference.asOfDate && outstanding > 0n,
    };
    assert.deepEqual(actual, cost.expected, `${cost.id}: totals`);
    if (cost.status === "POSTED") {
      total.net += amounts.net;
      total.vat += amounts.vat;
      total.gross += amounts.gross;
      total.paid += paid;
      total.outstanding += outstanding;
    }
    checkedCosts += 1;
  }
  const actual = {
    net: format(total.net), vat: format(total.vat), gross: format(total.gross),
    paid: format(total.paid), outstanding: format(total.outstanding),
    baselineRemaining: format(baseline - total.net),
    contractLessActual: format(scaled(project.contractNet, 2) - total.net),
  };
  assert.deepEqual(actual, project.expected, `${project.id}: project aggregate`);
  console.log(`PASS ${project.id}: net=${actual.net}, outstanding=${actual.outstanding}, baselineRemaining=${actual.baselineRemaining}`);
}

const priceCost = scaled(reference.pricing.cost, 2);
const priceRate = scaled(reference.pricing.rate, 6);
assert.ok(priceRate < 1_000_000n);
assert.equal(format(roundHalfUp(priceCost * (1_000_000n + priceRate), 1_000_000n)), reference.pricing.markupPrice);
assert.equal(format(roundHalfUp(priceCost * 1_000_000n, 1_000_000n - priceRate)), reference.pricing.marginPrice);

const weights = reference.allocation.enteredAmounts.map((value) => scaled(value, 2));
const totalWeight = weights.reduce((sum, value) => sum + value, 0n);
const allocationTax = tax(totalWeight, "VAT_INCLUDED", scaled(reference.allocation.rate, 6));
const rows = weights.map((weight, position) => ({
  position, net: allocationTax.net * weight / totalWeight,
  remainder: allocationTax.net * weight % totalWeight,
}));
let remaining = allocationTax.net - rows.reduce((sum, row) => sum + row.net, 0n);
for (const row of [...rows].sort((a, b) => a.remainder === b.remainder ? a.position - b.position : a.remainder > b.remainder ? -1 : 1)) {
  if (remaining === 0n) break;
  row.net += 1n;
  remaining -= 1n;
}
assert.equal(remaining, 0n);
assert.deepEqual(rows.map((row) => format(row.net)), reference.allocation.expectedNet);
assert.deepEqual(rows.map((row) => format(weights[row.position]! - row.net)), reference.allocation.expectedVat);
assert.equal(rows.reduce((sum, row) => sum + row.net, 0n), allocationTax.net);
console.log(`PASS ${checkedCosts} cost documents, 2 BOQ baselines, pricing and line allocation. No application code or database was used.`);
