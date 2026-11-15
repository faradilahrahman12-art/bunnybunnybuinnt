# Interactive Seat Map: Production rollout and rollback

Each step marked **[APPROVAL]** changes Production and must be approved separately.

## Safety model
- Off by default: `event_seat_maps.enabled` defaults to `false`, and the seat map only loads when a visible Resale event has an enabled map. Every other event keeps the current checkout.
- Help-to-Buy is blocked by a database check that rejects seat maps and listings on HTB events.
- Test event: `SEAT_MAP_TEST_EVENT_IDS` is a list of event IDs. Only verified accounts listed in `SEAT_MAP_TESTER_EMAILS` can open these events or reserve and submit on them. Everyone else gets a 404.
- Orders on a test event get no payment QR codes. Both order emails (submission and status change) are suppressed for them.
- Seat inventory is stored per event, so a test event can't touch another event's tickets.

## Deployment steps
1. **[APPROVAL] Back up the database:** create a Neon branch of Production, for example `pre-seat-map-<date>`.
2. **[APPROVAL] Migrate:** `node scripts/seat-map/run-migration.mjs` with `DATABASE_URL_PRODUCTION`, applying `001_seat_map.sql`. The migration only adds new tables; it doesn't change existing ones.
3. **[APPROVAL] Set Production environment variables:** `SEAT_MAP_TEST_EVENT_IDS` (leave empty until step 5) and `SEAT_MAP_TESTER_EMAILS`.
4. **[APPROVAL] Merge** `feature/interactive-seat-map` into `production-dc-repair` (fast-forward), which triggers the Production deploy.
5. **[APPROVAL] Create the test event:**
   1. In the admin dashboard, create a Resale event and set it to hidden.
   2. Put its ID in `SEAT_MAP_TEST_EVENT_IDS` and redeploy.
   3. Assign it a map with test listings and enable it.

   The event stays hidden, so it never appears in public listings. Only listed testers can open it directly at `/resale/<id>/seats`.
6. **Test:** a listed tester reserves, submits and uses admin confirm/cancel. Check that no emails go out and that other events show no change.
7. **Clean up:** disable the map, cancel or delete the test orders, and remove the test event ID.

## Rollback
- **Turn the feature off:** in the admin dashboard, disable the map for the event. This needs no deploy, and checkout falls back immediately.
- **Code:** use Vercel Instant Rollback to the previous Production deployment, or revert the merge on `production-dc-repair`. The old code ignores the new tables.
- **Database:** run `scripts/seat-map/001_seat_map_down.sql`. It drops only the seat-map tables. As a last resort, restore from the step 1 Neon branch.
