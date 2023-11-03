import {
    type AppAgentClient,
    type EntryHash,
    type AgentPubKeyB64,
    type AppAgentCallZomeRequest,
    type RoleName,
    encodeHashToBase64,
    type EntryHashB64,
  } from '@holochain/client';
import { EntryRecord, RecordBag } from '@holochain-open-dev/utils';
import { SynStore,  SynClient, type Commit, DocumentStore, type Workspace } from '@holochain-syn/core';
import { CommitTypeBoard, boardGrammar, type BoardGrammar } from './board';
import { BoardList, CommitTypeBoardList } from './boardList';
import { decode } from '@msgpack/msgpack';
import {pipe, sliceAndJoin, toPromise} from '@holochain-open-dev/stores'
import TimeAgo from "javascript-time-ago"
import en from 'javascript-time-ago/locale/en'
import { type AsyncReadable, asyncDerived, joinAsync} from '@holochain-open-dev/stores'

import { get, writable, type Readable, type Writable } from "svelte/store";

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
        recent: []
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
        // this.synStore.knownRoots.subscribe( async (roots) => {
        //     if (this.updating) {
        //         console.log(`${roots.entryActions.keys().length} ROOTS UPDATE CALLED but allready updating`, roots)
        //         return
        //     }
        //     this.updating = true
        //     try {
        //         await this.findOrMakeRoots(roots)
        //     } catch (e) {
        //         console.log("Error while updating board list: ",e)
        //     }
        //     this.updating = false
        // })
    }

    boards()  {
        const x = this.synStore.documentHashesByTag
        return pipe(x.get("boards"),
            docHashes => sliceAndJoin(this.synStore.documents, docHashes)
        )
        // const docs: AsyncReadable<Array<DocumentStore<BoardGrammar>>> = asyncDerived(this.synStore.allRoots,
        //     roots => roots.map(root=>[decode(root.entry.meta), root.entryHash])
        //     .filter(([meta,])=>meta["type"] == CommitTypeBoard)
        //     .map(([,hash])=>{
        //         return hash
        //     })
        //     .map(rootHash=> (new DocumentStore(this.synStore, boardGrammar, rootHash as EntryHash)) )
        //     )
        // const x = pipe(docs,
        //     (d) => d.map(doc=>doc.allWorkspacesHashes)
        //     )
        
        // const ws : AsyncReadable<Array<AsyncReadable<Array<EntryHash>>>> = asyncDerived(docs,
        //      docs => docs.map(doc=>doc.allWorkspacesHashes))
        // const wsd : AsyncReadable<Array<Array<EntryHash>>> = asyncDerived(ws,
        //     ws => joinAsync(ws)
          
        // const x = pipe(ws,
        //     (hashes)=>join(hashes),
        //     (hashes)=>hashes[0]
        //     )


        // const w:AsyncReadable<Array<EntryRecord<Workspace>[]>> = pipe(workspaces, asyncDerived(workspaces,
        //     workspaces => workspaces.map(workspace=)
        //     ))
        //return w
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