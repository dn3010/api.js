// Copyright 2017-2018 @polkadot/api authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import {MethodFunction} from '@polkadot/types/Method';
import {StorageFunction} from '@polkadot/types/StorageKey';
import {Codec} from '@polkadot/types/types';
import {EventRecord, ExtrinsicStatus, Hash} from '@polkadot/types';
import SubmittableExtrinsic from './SubmittableExtrinsic';

export type ApiInterface$Events = 'ready' | 'disconnected' | 'connected' | 'error';

export interface QueryableStorageFunction extends StorageFunction {
    (arg?: any): Promise<Codec | null | undefined>;
    (cb: (value: any) => any): Promise<number>;
    (arg: any, cb: (value: any) => any): Promise<number>;
    at: (hash: Hash, arg?: any) => Promise<Codec | null | undefined>;
    unsubscribe: (subscriptionId: number) => Promise<any>;
}

export interface QueryableModuleStorage {
    [index: string]: QueryableStorageFunction;
}

export interface QueryableStorage {
    [index: string]: QueryableModuleStorage;
}

export interface SubmittableExtrinsicFunction extends MethodFunction {
    (...args: any[]): SubmittableExtrinsic;
}

export interface SubmittableModuleExtrinsics {
    [index: string]: SubmittableExtrinsicFunction;
}

export interface SubmittableExtrinsics {
    [index: string]: SubmittableModuleExtrinsics;
}

export type SubmittableSendResult = {
    events?: Array<EventRecord>;
    status: ExtrinsicStatus;
    type: string;
};