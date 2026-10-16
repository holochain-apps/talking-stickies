import { assert, test } from 'vitest';
import { randomBytes } from 'node:crypto';
import { dhtSync, runScenario } from '@holochain-open-dev/tryorama';
import {
  AppBundleSource,
  Record as HcRecord,
  Signal,
  SignalType,
  encodeHashToBase64,
} from '@holochain/client';
import { decode } from '@msgpack/msgpack';

const happ = process.cwd() + '/../workdir/talking-stickies.happ';
const ROLE = 'talking-stickies';

// Two agents on the talking-stickies DNA. The first zome call of each agent
// runs syn's init, which creates the recv_remote_signal cap grant in the
// Holochain 0.7.1 grant format. A then writes a syn document, B reads it back
// after dhtSync, and A sends B a remote signal, which only arrives if B's
// grant exists and works.
test('two agents: create and read a syn document, remote signal via init grant', async () => {
  await runScenario(async scenario => {
    const appSource = {
      appBundleSource: { type: 'path', value: happ } as AppBundleSource,
    };
    const [alice, bob] = await scenario.addPlayersWithApps([appSource, appSource]);
    await scenario.shareAllAgents();

    const aliceCell = alice.namedCells.get(ROLE)!;
    const bobCell = bob.namedCells.get(ROLE)!;

    const document = {
      initial_state: new Uint8Array([1, 2, 3, 4]),
      meta: undefined,
      nonce: new Uint8Array(randomBytes(16)),
    };
    const created: HcRecord = await aliceCell.callZome({
      zome_name: 'syn',
      fn_name: 'create_document',
      payload: document,
    });
    const documentHash = (created.signed_action.hashed.content.data as any).entry_hash;
    assert.ok(documentHash, 'create_document returned an entry hash');

    await dhtSync([alice, bob], aliceCell.cell_id[0]);

    const fetched: HcRecord | undefined = await bobCell.callZome({
      zome_name: 'syn',
      fn_name: 'get_document',
      payload: documentHash,
    });
    assert.ok(fetched, 'bob found the document');
    assert.deepEqual(
      encodeHashToBase64((fetched!.signed_action.hashed.content.data as any).entry_hash),
      encodeHashToBase64(documentHash)
    );
    assert.deepEqual(
      encodeHashToBase64(fetched!.signed_action.hashed.content.header.author),
      encodeHashToBase64(alice.agentPubKey)
    );
    const entry = decode(
      (fetched!.entry as any).Present.entry as Uint8Array
    ) as any;
    assert.deepEqual(
      Array.from(entry.initial_state as Uint8Array),
      Array.from(document.initial_state)
    );
    assert.deepEqual(
      Array.from(entry.nonce as Uint8Array),
      Array.from(document.nonce)
    );

    // Remote signal A -> B. B's init ran on the get_document call above.
    const received = new Promise<any>((resolve, reject) => {
      const t = setTimeout(
        () => reject(new Error('bob got no remote signal within 30 s')),
        30_000
      );
      bob.appWs.on('signal', (signal: Signal) => {
        if (signal.type !== SignalType.App) return;
        const payload = signal.value.payload as any;
        if (payload?.type === 'SessionMessage') {
          clearTimeout(t);
          resolve(payload);
        }
      });
    });
    await aliceCell.callZome({
      zome_name: 'syn',
      fn_name: 'send_message',
      payload: {
        recipients: [bob.agentPubKey],
        message: { workspace_hash: documentHash, payload: { type: 'JoinSession' } },
      },
    });
    const signal = await received;
    assert.equal(signal.message.payload.type, 'JoinSession');
    assert.deepEqual(
      encodeHashToBase64(signal.provenance),
      encodeHashToBase64(alice.agentPubKey)
    );
  });
});
