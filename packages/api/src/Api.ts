import {Storage} from '@polkadot/storage/types';
import {Hash} from '@polkadot/types';
import {MethodFunction, ModulesWithMethods} from '@polkadot/types/Method';
import {StorageFunction} from '@polkadot/types/StorageKey';
import {Codec} from '@polkadot/types/types';
import {isFunction, logger} from '@polkadot/util';
import {ApiOptions} from 'cennznet-types';
import ApiBase from './Base';
import SubmittableExtrinsic from './SubmittableExtrinsic';
import {
    QueryableModuleStorage,
    QueryableStorage,
    QueryableStorageFunction,
    SubmittableExtrinsicFunction,
    SubmittableExtrinsics,
    SubmittableModuleExtrinsics,
} from './types';

const l = logger('api/promise');

export class Api extends ApiBase {
    private readonly _isReady: Promise<Api>;

    static create(option?: ApiOptions): Promise<Api> {
        return new Api(option).isReady;
    }

    constructor(option?: ApiOptions) {
        super(option);

        this._isReady = new Promise((resolveReady, rejectReady) =>
            super.once('ready', () => resolveReady(this)).once('error', () => rejectReady(this))
        );
    }

    get isReady(): Promise<Api> {
        return this._isReady;
    }

    protected decorateExtrinsics(extrinsics: ModulesWithMethods): SubmittableExtrinsics {
        return Object.keys(extrinsics).reduce(
            (result, sectionName) => {
                const section = extrinsics[sectionName];

                result[sectionName] = Object.keys(section).reduce(
                    (result, methodName) => {
                        result[methodName] = this.decorateExtrinsicEntry(section[methodName]);

                        return result;
                    },
                    {} as SubmittableModuleExtrinsics
                );

                return result;
            },
            {} as SubmittableExtrinsics
        );
    }

    private decorateExtrinsicEntry(method: MethodFunction): SubmittableExtrinsicFunction {
        const decorated: any = (...args: Array<any>): SubmittableExtrinsic =>
            new SubmittableExtrinsic(this, method(...args));

        return this.decorateFunctionMeta(method, decorated) as SubmittableExtrinsicFunction;
    }

    protected decorateStorage(storage: Storage): QueryableStorage {
        return Object.keys(storage).reduce(
            (result, sectionName) => {
                const section = storage[sectionName];

                result[sectionName] = Object.keys(section).reduce(
                    (result, methodName) => {
                        result[methodName] = this.decorateStorageEntry(section[methodName]);

                        return result;
                    },
                    {} as QueryableModuleStorage
                );

                return result;
            },
            {} as QueryableStorage
        );
    }

    private decorateStorageEntry(method: StorageFunction): QueryableStorageFunction {
        const decorated: any = (...args: Array<any>): Promise<Codec | null | undefined | Promise<number>> => {
            if (args.length === 0 || !isFunction(args[args.length - 1])) {
                return this.rpc.state.getStorage([method, args[0]]);
            } else if (!this.hasSubscriptions && isFunction(args[args.length - 1])) {
                l.warn(
                    `Storage subscription to ${method.section}.${
                        method.name
                    } ignored, provider does not support subscriptions`
                );

                return this.rpc.state.getStorage([method, args.length === 1 ? undefined : args[0]]);
            }

            return this.rpc.state.subscribeStorage(
                [[method, args.length === 1 ? undefined : args[0]]],
                (result: Array<Codec | null | undefined> = []) => args[args.length - 1](result[0])
            );
        };

        decorated.at = (hash: Hash, arg?: any): Promise<Codec | null | undefined> =>
            this.rpc.state.getStorage([method, arg], hash);
        decorated.unsubscribe = (subscriptionId: number): Promise<any> =>
            this.rpc.state.subscribeStorage.unsubscribe(subscriptionId);

        return this.decorateFunctionMeta(method, decorated) as QueryableStorageFunction;
    }
}