# Village Test Scenarios

Scenarios for instrumenting the village hub end-to-end. Each scenario sets a specific local DynamoDB state, then verifies the expected village UI via Playwright/chrome-devtools MCP.

> **Note (2026-05-13):** the streak (`daily-ready`, `weekly-ready`, `weekly-phantom`) and expedition (`expedition-active`, `expedition-claimable`) scenarios were removed from the CLI script because their seed shapes did not match the API's read paths (`lastClaimAt` vs `lastClaimTimestamp`, `EXPEDITION#${id}` vs `EXPEDITION#ACTIVE#${totemId}`). To exercise those flows, start from `clean-slate` and drive the action through the UI (open Shrine modal → Claim, open Trailhead modal → Send, etc). The script keeps the scenarios that seed totems + currencies cleanly.

## How to run a scenario

1. Start the local stack: `start totembound` (Docker + DynamoDB + API server).
2. Apply the scenario seed (see snippets below) — paste into a `node -e '…'` from the `totem-api/` directory or wrap into a `scripts/village-scenarios.js` runner.
3. Refresh `http://localhost:3000/keepers-village` in the browser.
4. Run the **Verify** steps via MCP browser tools (`take_snapshot`, `take_screenshot`).

All scenarios target the dev test user `usr_a1b2c3d4-e5f6-7890-abcd-ef1234567890` (TestPlayer1 / `testplayer1@example.com` / `TestPassword123!`).

## Shared seed helper

Each scenario starts with `resetUserState(userId)` to wipe per-user game state without dropping the user record itself. Drop into `totem-api/scripts/village-scenarios.js`:

```javascript
// totem-api/scripts/village-scenarios.js
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, DeleteCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const client = DynamoDBDocumentClient.from(
  new DynamoDBClient({ endpoint: 'http://localhost:8000', region: 'us-west-2' })
);
const USER_ID = 'usr_a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const PK = `USER#${USER_ID}`;

async function wipePartition(table) {
  const out = await client.send(new QueryCommand({
    TableName: table,
    KeyConditionExpression: 'pk = :pk',
    ExpressionAttributeValues: { ':pk': PK },
  }));
  for (const item of out.Items ?? []) {
    await client.send(new DeleteCommand({ TableName: table, Key: { pk: item.pk, sk: item.sk } }));
  }
}

async function resetUserState() {
  await Promise.all([
    wipePartition('TotemBound-Totems'),
    wipePartition('TotemBound-RewardsClaims'),
    wipePartition('TotemBound-ExpeditionState'),
    wipePartition('TotemBound-ChallengeProgress'),
  ]);
}

async function setUserCurrencies(essence, gems) {
  // PROFILE record exists from init-tables.js — patch currency fields.
  await client.send(new PutCommand({
    TableName: 'TotemBound-Users',
    Item: {
      pk: PK, sk: 'PROFILE',
      userId: USER_ID,
      email: 'testplayer1@example.com',
      displayName: 'TestPlayer1',
      tier: 'free',
      currencies: { essence, gems },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  }));
}

function makeTotem(idx, { speciesId, colorId, rarityId, stage = 0, experience = 0 }) {
  const now = new Date().toISOString();
  return {
    pk: PK, sk: `TOTEM#ttm_test${String(idx).padStart(3, '0')}`,
    id: `ttm_test${String(idx).padStart(3, '0')}`,
    userId: USER_ID,
    speciesId, colorId, rarityId,
    nickname: null, stage, experience, prestigeLevel: 0,
    stats: { strength: 5, agility: 5, wisdom: 5, happiness: 80, hunger: 100 },
    cooldowns: { feed: null, train: null, treat: null },
    createdAt: now, updatedAt: now,
  };
}

async function seedTotems(totems) {
  for (const t of totems) {
    await client.send(new PutCommand({ TableName: 'TotemBound-Totems', Item: t }));
  }
}

async function seedStreak({ type, lastClaimAt, currentStreak, bestStreak }) {
  // TotemBound-RewardsClaims uses sk=STREAK#{daily|weekly} per rewards-service.js
  await client.send(new PutCommand({
    TableName: 'TotemBound-RewardsClaims',
    Item: {
      pk: PK, sk: `STREAK#${type}`,
      type, currentStreak, bestStreak,
      lastClaimAt, // ISO string; null/undefined = never claimed
      protectionCharges: 0,
    },
  }));
}

async function seedExpedition({ expeditionId, captainId, totemIds, endTime }) {
  await client.send(new PutCommand({
    TableName: 'TotemBound-ExpeditionState',
    Item: {
      pk: PK, sk: `EXPEDITION#${expeditionId}`,
      expeditionId, captainId, totemIds,
      endTime, // unix ms; in past = completed
      claimed: false,
      createdAt: new Date().toISOString(),
    },
  }));
}

const SCENARIOS = {
  'clean-slate':         () => resetUserState().then(() => setUserCurrencies(0, 0)),
  'daily-ready':         scenario_dailyReady,
  'weekly-ready':        scenario_weeklyReady,
  'weekly-phantom':      scenario_weeklyPhantom,
  'forge-ready':         scenario_forgeReady,
  'elder-ready':         scenario_elderReady,
  'expedition-active':   scenario_expeditionActive,
  'expedition-claimable':scenario_expeditionClaimable,
  'sanctuary-rich':      scenario_sanctuaryRich,
  'bazaar-flush':        scenario_bazaarFlush,
};

const name = process.argv[2];
if (!name || !SCENARIOS[name]) {
  console.error(`Usage: node scripts/village-scenarios.js <scenario>`);
  console.error(`Scenarios: ${Object.keys(SCENARIOS).join(', ')}`);
  process.exit(1);
}
SCENARIOS[name]().then(() => console.log(`✅ ${name} applied`)).catch((e) => { console.error(e); process.exit(1); });
```

The 10 scenario functions are below — each wipes state, then seeds the specific scenario.

---

## Scenario 1 — `clean-slate`

**Purpose:** Brand-new user with nothing. Validates default lock states and "no badges" baseline.

```javascript
// (handled by SCENARIOS['clean-slate'] above — just reset + zero currencies)
```

**Verify (MCP):**
- `take_snapshot` → village page
- Sanctuary strip: `"No totems yet — claim your starter"`
- Forge label includes `(locked: Own 3 totems of the same rarity)`; strip lock reason: `"Need 3 totems of the same rarity. Collect more totems to unlock."`
- Elder Tower label includes `(locked: Raise an Ascended totem)`
- No `, X ready` suffix on any building label.

---

## Scenario 2 — `daily-ready`

**Purpose:** Daily reward claimable but weekly tier not yet unlocked. Validates Shrine badge counts daily only.

```javascript
async function scenario_dailyReady() {
  await resetUserState();
  await setUserCurrencies(2000, 0);
  // Last claimed yesterday — current-streak preserved, claim resets allowed
  const yesterday = new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString();
  await seedStreak({ type: 'daily', lastClaimAt: yesterday, currentStreak: 1, bestStreak: 1 });
}
```

**Verify:** Shrine label aria includes `Shrine, 1 ready`; strip summary `"Day 1 streak · Daily reward ready"`; CTA reads `Claim`.

---

## Scenario 3 — `weekly-ready`

**Purpose:** Both daily + weekly claimable AND weekly unlocked (Week Warrior achievement = bestStreak ≥ 7). Validates badge `2`.

```javascript
async function scenario_weeklyReady() {
  await resetUserState();
  await setUserCurrencies(2000, 0);
  const yesterday = new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString();
  await seedStreak({ type: 'daily', lastClaimAt: yesterday, currentStreak: 8, bestStreak: 8 });
  // Weekly: never claimed (so canClaim true) and bestStreak≥7 unlocks the tier.
  await seedStreak({ type: 'weekly', lastClaimAt: null, currentStreak: 0, bestStreak: 0 });
}
```

**Verify:** Shrine label `Shrine, 2 ready`; strip `"Day 8 streak · Daily + weekly ready"`.

---

## Scenario 4 — `weekly-phantom` (regression test)

**Purpose:** Weekly `canClaim: true` but `isUnlocked: false` — the bug that initially showed phantom "1 ready" badge. Must show **no** Shrine badge.

```javascript
async function scenario_weeklyPhantom() {
  await resetUserState();
  await setUserCurrencies(2000, 0);
  // Daily already claimed today (canClaim false), weekly never claimed but bestStreak < 7
  // (so isUnlocked stays false). API will return weekly.canClaim=true + isUnlocked=false.
  const todayMorning = new Date(new Date().setUTCHours(2, 0, 0, 0)).toISOString();
  await seedStreak({ type: 'daily', lastClaimAt: todayMorning, currentStreak: 1, bestStreak: 1 });
}
```

**Verify:** Shrine label is plain `Shrine` (NO `, X ready` suffix). Strip: `"Day 1 streak · Next reward tomorrow"`.

---

## Scenario 5 — `forge-ready`

**Purpose:** 3 same-rarity totems → Totem Forge unlocks, badge shows `1` (one eligible fusion group).

```javascript
async function scenario_forgeReady() {
  await resetUserState();
  await setUserCurrencies(500, 0);
  await seedTotems([
    makeTotem(1, { speciesId: 0, colorId: 0, rarityId: 0 }),  // 3× Common
    makeTotem(2, { speciesId: 1, colorId: 1, rarityId: 0 }),
    makeTotem(3, { speciesId: 2, colorId: 2, rarityId: 0 }),
  ]);
}
```

**Verify:** Forge label has no `(locked)` suffix; strip summary `"1 fusion eligible"`; CTA reads `Forge`.

---

## Scenario 6 — `elder-ready`

**Purpose:** 1 Ascended (stage 4) totem → Elder Tower unlocks.

```javascript
async function scenario_elderReady() {
  await resetUserState();
  await setUserCurrencies(500, 0);
  await seedTotems([
    makeTotem(1, { speciesId: 0, colorId: 8, rarityId: 2, stage: 4, experience: 8000 }),
  ]);
}
```

**Verify:** Elder Tower label has no `(locked)` suffix; strip `"0/3 elder seats filled"`; CTA reads `Enter`.

---

## Scenario 7 — `expedition-active`

**Purpose:** Expedition in progress (endTime in future). Trailhead strip should show "1 active".

```javascript
async function scenario_expeditionActive() {
  await resetUserState();
  await setUserCurrencies(500, 0);
  await seedTotems([
    makeTotem(1, { speciesId: 0, colorId: 0, rarityId: 0, stage: 2, experience: 1500 }),
  ]);
  await seedExpedition({
    expeditionId: 'exp_test_active',
    captainId: 'ttm_test001',
    totemIds: ['ttm_test001'],
    endTime: Date.now() + 60 * 60 * 1000, // ends in 1 hour
  });
}
```

**Verify:** Trailhead strip summary contains `1 active`; no badge on Trailhead label.

---

## Scenario 8 — `expedition-claimable`

**Purpose:** Completed expedition awaiting claim. Trailhead label badge `1`; strip says "1 ready to claim".

```javascript
async function scenario_expeditionClaimable() {
  await resetUserState();
  await setUserCurrencies(500, 0);
  await seedTotems([
    makeTotem(1, { speciesId: 0, colorId: 0, rarityId: 0, stage: 2, experience: 1500 }),
  ]);
  await seedExpedition({
    expeditionId: 'exp_test_claim',
    captainId: 'ttm_test001',
    totemIds: ['ttm_test001'],
    endTime: Date.now() - 60 * 60 * 1000, // ended 1 hour ago
  });
}
```

**Verify:** Trailhead label `Trailhead, 1 ready`; strip `"1 ready to claim"`; CTA reads `Send`.

---

## Scenario 9 — `sanctuary-rich`

**Purpose:** 5 totems of varying species/stages. Sanctuary strip shows count + highest.

```javascript
async function scenario_sanctuaryRich() {
  await resetUserState();
  await setUserCurrencies(2000, 0);
  await seedTotems([
    makeTotem(1, { speciesId: 0, colorId: 0, rarityId: 0, stage: 0 }),
    makeTotem(2, { speciesId: 1, colorId: 1, rarityId: 0, stage: 1, experience: 600 }),
    makeTotem(3, { speciesId: 2, colorId: 2, rarityId: 1, stage: 2, experience: 1700 }),
    makeTotem(4, { speciesId: 3, colorId: 4, rarityId: 1, stage: 3, experience: 4000 }),
    makeTotem(5, { speciesId: 4, colorId: 8, rarityId: 2, stage: 4, experience: 8000 }),
  ]);
}
```

**Verify:** Sanctuary strip `"5 totems · Highest: <name> (Ascended)"`; no badge on Sanctuary label (count is a stat, by design).

---

## Scenario 10 — `bazaar-flush`

**Purpose:** Sets high essence + gem balances. Bazaar strip shows the values.

```javascript
async function scenario_bazaarFlush() {
  await resetUserState();
  await setUserCurrencies(99999, 500);
}
```

**Verify:** Bazaar strip `"99999 Essence · 500 Gems"`; no badge on Bazaar label (specials wiring deferred).

---

## Cross-cutting checks (run for any scenario)

After applying any scenario, verify these invariants:

- Standalone `/guides/codex/totems/owl` still loads outside village trunk (top nav visible, no modal chrome).
- `/keepers-village/guides/codex/totems/owl` deep-link cold loads inside the modal with sidebar nav links pointing back to `/keepers-village/...`.
- Pressing **Esc** in any modal closes back to `/keepers-village` cleanly.
- Anonymous user (logged out) hitting `/keepers-village` redirects to `/login`.
- Console shows zero errors on every navigation.

## Resetting

`scripts/init-tables.js` is safe to re-run and will re-seed the test user from scratch — use it to return to the canonical baseline between exploratory sessions.
