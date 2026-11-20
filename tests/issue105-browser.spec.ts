import { expect, test, type Page } from '@playwright/test';

type Probe = { held: FrameRequestCallback[]; submits: number; release: () => void; unlock?: () => void };
async function instrumentation(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { probe: Probe };
    w.probe = { held: [], submits: 0, release: () => {
      // Deliberately invoke even cancelled callbacks to challenge epoch/unmount guards.
      for (const cb of w.probe.held.splice(0)) cb(performance.now());
    } };
    document.addEventListener('submit', e => {
      if ((e.target as HTMLElement).closest('.practice-room')) w.probe.submits++;
    }, true);
    const raf = requestAnimationFrame.bind(window);
    window.requestAnimationFrame = cb => {
      if (String(cb).includes('.practice-room h2')) { w.probe.held.push(cb); return 999999; }
      return raf(cb);
    };
  });
}
async function start(page: Page) {
  await page.goto('/simulate');
  await page.getByLabel('Startup name').fill('Focus regression');
  await page.getByLabel('Your pitch').fill('We sell energy monitoring subscriptions to local retail shops.');
  await page.getByLabel('Investment', { exact: true }).fill('100000');
  await page.getByLabel('Equity (%)').fill('10');
  await page.getByRole('button', { name: 'Review pitch' }).click();
  await page.getByLabel('Save this session in this browser').check();
  await page.getByRole('button', { name: 'Start practice', exact: true }).click();
}
async function remove(page: Page) {
  await page.getByRole('button', { name: 'Remove saved information' }).click();
  await page.getByRole('button', { name: 'Confirm removal' }).click();
}
async function release(page: Page) {
  await page.evaluate(() => (window as unknown as { probe: Probe }).probe.release());
}
const answer = 'Revenue: EUR9000; Runway: 8 months.';
for (const keyboard of [false, true]) {
  test(`issue105: deferred recovery focus preserves actual input and ${keyboard ? 'keyboard' : 'pointer'} submission`, async ({ page }) => {
    await instrumentation(page); await start(page); await remove(page);
    await expect(page.getByText('Saved information removed. This run will not be saved again.')).toBeVisible();
    await page.getByLabel('Your answer').evaluate(el => el.addEventListener('focus', () => queueMicrotask(() =>
      (window as unknown as { probe: Probe }).probe.release()), { once: true }));
    await page.getByLabel('Your answer').fill(answer);
    await expect(page.getByLabel('Your answer')).toHaveValue(answer);
    const submit = page.getByRole('button', { name: 'Submit answer' });
    if (keyboard) { await page.keyboard.press('Tab'); await expect(submit).toBeFocused(); await page.keyboard.press('Enter'); }
    else await submit.click();
    await expect(page.getByRole('heading', { name: 'Adrian Vale', exact: true })).toBeFocused();
    await expect(page.getByText('Question 2 of 3', { exact: true })).toBeVisible();
    expect(await page.evaluate(() => (window as unknown as { probe: Probe }).probe.submits)).toBe(1);
    expect(await page.evaluate(() => localStorage.getItem('shark-tank-ai.session'))).toBeNull();
  });
}
test('issue105: delayed removal and repeated confirmations preserve typing and one action', async ({ page }) => {
  await instrumentation(page); await start(page);
  await page.evaluate(() => new Promise<void>(ready => {
    void navigator.locks.request('shark-tank-ai.session.write', async () => {
      await new Promise<void>(unlock => { (window as unknown as { probe: Probe }).probe.unlock = unlock; ready(); });
    });
  }));
  await page.getByRole('button', { name: 'Remove saved information' }).click();
  await page.getByRole('button', { name: 'Confirm removal' }).evaluate(el => { (el as HTMLButtonElement).click(); (el as HTMLButtonElement).click(); });
  await page.getByLabel('Your answer').fill(answer);
  await page.evaluate(() => (window as unknown as { probe: Probe }).probe.unlock!());
  await expect(page.getByText('Saved information removed. This run will not be saved again.')).toBeVisible();
  await release(page); await expect(page.getByLabel('Your answer')).toBeFocused();
  await expect(page.getByLabel('Your answer')).toHaveValue(answer);
  await page.locator('.practice-room form').evaluate(el => { (el as HTMLFormElement).requestSubmit(); (el as HTMLFormElement).requestSubmit(); });
  await expect(page.getByRole('heading', { name: 'Adrian Vale', exact: true })).toBeFocused();
  await expect(page.getByText('Question 2 of 3', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('shark-tank-ai.session'))).toBeNull();
});
test('issue105: obsolete callback cannot focus a restarted scene', async ({ page }) => {
  await instrumentation(page); await start(page); await remove(page);
  await expect(page.getByText('Saved information removed. This run will not be saved again.')).toBeVisible();
  for (let turn = 0; turn < 3; turn++) { await page.getByLabel('Your answer').fill('I have no available evidence today.'); await page.getByRole('button', { name: 'Submit answer' }).click(); }
  await page.getByRole('button', { name: 'Practice again' }).click();
  await expect(page.getByRole('button', { name: 'Start practice', exact: true })).toBeVisible();
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
  const focus = await page.evaluate(() => document.activeElement?.textContent);
  await release(page);
  expect(await page.evaluate(() => document.activeElement?.textContent)).toBe(focus);
  expect(await page.evaluate(() => localStorage.getItem('shark-tank-ai.session'))).toBeNull();
});
test('issue105: unmounted recovery callback cannot focus another route', async ({ page }) => {
  await instrumentation(page); await start(page); await remove(page);
  await expect(page.getByText('Saved information removed. This run will not be saved again.')).toBeVisible();
  await page.getByRole('link', { name: 'Shark Tank AI', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Make your');
  await page.getByRole('link', { name: 'Enter the pitch room' }).click();
  await expect(page.getByLabel('Startup name')).toBeVisible();
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
  const focus = await page.evaluate(() => document.activeElement?.tagName);
  await release(page); expect(await page.evaluate(() => document.activeElement?.tagName)).toBe(focus);
});

test('issue105: restart attempted during pending removal cannot replace the live run', async ({ page }) => {
  await instrumentation(page); await start(page);
  const id = await page.locator('.practice-room').getAttribute('data-session-id');
  await page.evaluate(() => new Promise<void>(ready => {
    void navigator.locks.request('shark-tank-ai.session.write', async () => {
      await new Promise<void>(unlock => { (window as unknown as { probe: Probe }).probe.unlock = unlock; ready(); });
    });
  }));
  await remove(page);
  for (let turn = 0; turn < 3; turn++) {
    await page.getByLabel('Your answer').fill('I have no available evidence today.');
    await page.getByRole('button', { name: 'Submit answer' }).click();
  }
  await page.getByRole('button', { name: 'Practice again' }).click();
  await expect(page.locator('.practice-room')).toHaveAttribute('data-session-id', id!);
  await page.evaluate(() => (window as unknown as { probe: Probe }).probe.unlock!());
  await expect(page.getByText('Saved information removed. This run will not be saved again.')).toBeVisible();
  await page.getByRole('button', { name: 'Practice again' }).click();
  await expect(page.getByRole('button', { name: 'Start practice', exact: true })).toBeVisible();
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
  await release(page);
  expect(await page.evaluate(() => document.activeElement?.tagName)).toBe('BODY');
  expect(await page.evaluate(() => localStorage.getItem('shark-tank-ai.session'))).toBeNull();
});
