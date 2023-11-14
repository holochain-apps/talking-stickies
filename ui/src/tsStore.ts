import {
    type AppAgentClient,
    type EntryHash,
    type AgentPubKeyB64,
    type AppAgentCallZomeRequest,
    type RoleName,
    encodeHashToBase64,
    type EntryHashB64,
    type AgentPubKey,
  } from '@holochain/client';
import { SynStore,  SynClient, type Commit } from '@holochain-syn/core';
import { BoardList } from './boardList';
import TimeAgo from "javascript-time-ago"
import en from 'javascript-time-ago/locale/en'

import { writable, type Writable } from "svelte/store";
import type { ProfilesStore } from '@holochain-open-dev/profiles';

TimeAgo.addDefaultLocale(en)

const ZOME_NAME = 'syn'

export class TalkingStickiesService {
    constructor(public client: AppAgentClient, public roleName, public zomeName = ZOME_NAME) {}

    private callZome(fnName: string, payload: any) {
        const req: AppAgentCallZomeRequest = {
            role_name: this.roleName,
            zome_name: this.zomeName,
            fn_name: fnName,
            payload
          }
        return this.client.callZome(req);
    }
}

export interface UIProps {
    showArchived: {[key: string]: boolean},
    showMenu: boolean,
    recent: Array<EntryHashB64>
    bgUrl: string
  }
  
export class TalkingStickiesStore {
    myAgentPubKeyB64: AgentPubKeyB64
    timeAgo = new TimeAgo('en-US')
    service: TalkingStickiesService;
    boardList: BoardList;
    createdBoards: Array<EntryHash> = []
    updating = false
    synStore: SynStore;
    client: AppAgentClient;
    uiProps: Writable<UIProps> = writable({
        showArchived: {},
        showMenu: true,
        recent: [],
        bgUrl: ""
    })

    setUIprops(props:{}) {
        this.uiProps.update((n) => {
            Object.keys(props).forEach(key=>n[key] = props[key])
            return n
        })
    }

    get myAgentPubKey(): AgentPubKey {
        return this.client.myPubKey;
    }

    constructor(
        public profilesStore: ProfilesStore,
        protected clientIn: AppAgentClient,
        protected roleName: RoleName,
        protected zomeName: string = ZOME_NAME
    ) {
        this.client = clientIn
        this.myAgentPubKeyB64 = encodeHashToBase64(this.client.myPubKey);
        this.service = new TalkingStickiesService(
          this.client,
          this.roleName,
          this.zomeName
        );
        this.synStore = new SynStore(new SynClient(this.client,this.roleName,this.zomeName))
        this.boardList = new BoardList(profilesStore, this.synStore) 
    }
}