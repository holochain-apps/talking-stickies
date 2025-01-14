import {
    type AppClient,
    type EntryHash,
    type AgentPubKeyB64,
    type AppCallZomeRequest,
    type RoleName,
    encodeHashToBase64,
    type EntryHashB64,
    type AgentPubKey,
    type DnaHash,
  } from '@holochain/client';
import { SynStore,  SynClient, type Commit } from '@holochain-syn/core';
import { BoardList } from './boardList';
import TimeAgo from "javascript-time-ago"
import en from 'javascript-time-ago/locale/en'

import { writable, type Writable } from "svelte/store";
import type { ProfilesStore } from '@holochain-open-dev/profiles';
import type { WeaveClient } from '@theweave/api';
import { getMyDna } from './util';

TimeAgo.addDefaultLocale(en)

const ZOME_NAME = 'syn'

export class TalkingStickiesService {
    constructor(public client: AppClient, public roleName, public zomeName = ZOME_NAME) {}

    private callZome(fnName: string, payload: any) {
        const req: AppCallZomeRequest = {
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
    updating = false
    synStore: SynStore;
    client: AppClient;
    uiProps: Writable<UIProps> = writable({
        showArchived: {},
        showMenu: true,
        recent: [],
        bgUrl: ""
    })
    dnaHash: DnaHash

    setUIprops(props:{}) {
        this.uiProps.update((n) => {
            Object.keys(props).forEach(key=>n[key] = props[key])
            return n
        })
    }

    async setActiveBoard(hash: EntryHash | undefined) {
        const board = await this.boardList.setActiveBoard(hash)
        let bgUrl = ""
        if (board) {
            const state = board.state()
            if (state) {
                bgUrl = state.props.bgUrl
            }
        }
        this.setUIprops({showMenu:false, bgUrl})
    }

    async closeActiveBoard(leave: boolean) {
        await this.boardList.closeActiveBoard(leave)
        this.setUIprops({showMenu:true, bgUrl:""})
    }


    async archiveBoard(documentHash: EntryHash) {
        const wasActive = this.boardList.archiveBoard(documentHash)
        if (wasActive ) {
            this.setUIprops({showMenu:true, bgUrl:""})
        }
    }

    async unarchiveBoard(documentHash: EntryHash) {
        this.boardList.unarchiveBoard(documentHash)
    }

    get myAgentPubKey(): AgentPubKey {
        return this.client.myPubKey;
    }

    constructor(
        public weaveClient : WeaveClient,
        public profilesStore: ProfilesStore,
        protected clientIn: AppClient,
        protected roleName: RoleName,
        protected zomeName: string = ZOME_NAME
    ) {
        this.client = clientIn
        getMyDna(roleName, clientIn).then(res=>{
            this.dnaHash = res
          })

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