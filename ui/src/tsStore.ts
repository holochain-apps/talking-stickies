import {
    type AppAgentClient,
    type EntryHash,
    type AgentPubKeyB64,
    type AppAgentCallZomeRequest,
    type RoleName,
    encodeHashToBase64,
    type EntryHashB64,
  } from '@holochain/client';
import { EntryRecord, HoloHashMap, LazyHoloHashMap, RecordBag } from '@holochain-open-dev/utils';
import { SynStore,  SynClient, type Commit, DocumentStore, type Workspace, WorkspaceStore } from '@holochain-syn/core';
import { CommitTypeBoard, boardGrammar, type BoardGrammar, type BoardState, Board } from './board';
import { BoardList, CommitTypeBoardList } from './boardList';
import { decode } from '@msgpack/msgpack';
import {deriveStore, derived, pipe, sliceAndJoin, toPromise, type Derived} from '@holochain-open-dev/stores'
import TimeAgo from "javascript-time-ago"
import en from 'javascript-time-ago/locale/en'
import { type AsyncReadable, asyncDerived, joinAsync} from '@holochain-open-dev/stores'

import { get, writable, type Readable, type Writable } from "svelte/store";
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

    myAgentPubKey(): AgentPubKeyB64 {
        return encodeHashToBase64(this.client.myPubKey);
    }

    constructor(
        public profilesStore: ProfilesStore,
        protected clientIn: AppAgentClient,
        protected roleName: RoleName,
        protected zomeName: string = ZOME_NAME
    ) {
        this.client = clientIn
        this.service = new TalkingStickiesService(
          this.client,
          this.roleName,
          this.zomeName
        );
        //@ts-ignore
        this.synStore = new SynStore(new SynClient(this.client,this.roleName,this.zomeName))      
    }

    commitType(commit: Commit) : string {
        const meta:any = decode(commit.meta)
        return meta.type
    }

    async findOrMakeRoots(): Promise<any> {
        const documentsHashes: Array<EntryHash> = await this.synStore.client.getDocumentsWithTag("boardList");
        if (documentsHashes.length == 0) { 
            console.log(`Found no board list document, creating`)
            this.boardList = await BoardList.Create(this.synStore);
        } else {
            if (documentsHashes.length != 1) {
                console.log(`Note: found more than one board list document!`)
            }
            this.boardList = await BoardList.Join(this.synStore, documentsHashes[0])
        }
    }

    async loadBoards() : Promise<any> {
        console.log("fetching all roots...")
        try {
            await this.findOrMakeRoots()
        } catch (e) {
            console.log("Error Fetching Roots:", e)
        }
    }
}