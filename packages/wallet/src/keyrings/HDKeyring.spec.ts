import {cryptoWaitReady} from '@cennznet/util';
import {HDKeyring} from './HDKeyring';
import {IKeyring} from '../types';
import {KeyringPair} from '@cennznet/util/types';

describe('HDKeyring', () => {
    beforeAll(async () => {
        await cryptoWaitReady();
    });

    describe('happy path', () => {
        const times = 10;
        let keyring: IKeyring<any>;
        let keyPairs: KeyringPair[];
        beforeEach(async () => {
            keyring = await HDKeyring.generate();
            keyPairs = [];
            for (let i = 0; i < times; i++) {
                const keyPair = await keyring.addPair();
                keyPairs.push(keyPair);
            }
            expect(keyPairs).toHaveLength(times);
        });

        it('removePair(address) not support', async () => {
            const kp = keyPairs[0];
            await expect(keyring.removePair(kp.address())).rejects.toThrow("doesn't support removePair");
        });
    });

    it('throw error if not initialized', async () => {
        const keyring = new HDKeyring(undefined);
        await expect(keyring.addPair()).rejects.toThrow('hd wallet not initialized');
    });

    it('recover from mnemonic', async () => {
        const keyring = new HDKeyring({
            mnemonic: 'urban tuna work fiber excuse gown adult grab winner rigid lamp appear',
        });
        await expect(keyring.getAddresses()).resolves.toHaveLength(0);
        const kp = await keyring.addPair();
        expect(kp.address()).toBe('5HTkvBrPpfrSZCoHE9qBMyNmV2JVJcKLNswwXvWdZjizCMHj');
    });
});
