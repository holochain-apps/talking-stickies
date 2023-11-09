import { DocumentStore,  type SynGrammar, type SynStore,  WorkspaceStore, SessionStore } from "@holochain-syn/core";
import { Board, type BoardStateData } from "./board";
import { HoloHashMap, LazyHoloHashMap } from "@holochain-open-dev/utils";
import { derived, get, writable, type Readable, type Writable } from "svelte/store";
import { boardGrammar, type BoardDelta, type BoardGrammar, type BoardState } from "./board";
import { type AgentPubKey, type EntryHash, type EntryHashB64, type AgentPubKeyB64, encodeHashToBase64 } from "@holochain/client";
import {toPromise, type AsyncReadable, type Derived, asyncDerived, joinAsync, pipe, sliceAndJoin} from '@holochain-open-dev/stores'
import type { ProfilesStore } from "@holochain-open-dev/profiles";

export const CommitTypeBoardList :string = "board-list"

export interface BoardRecord {
    hash: EntryHashB64
    name: string
    status: string
}

export interface Avatar {
    name: string
    url: string
}

export interface BoardListState {
    avatars:  { [key:string]: Avatar};
    boards: BoardRecord[];
    agentBoards:  { [key:string]: Array<EntryHashB64>};
}


export type BoardListDelta =
  | {
    type: "add-board";
    hash: EntryHashB64;
    name: string;
    status?: string;
  }
  | {
    type: "set-avatar";
    pubKey: AgentPubKeyB64;
    avatar: Avatar;
  }
  | {
    type: "set-name";
    hash: EntryHashB64;
    name: string;
  }
  | {
    type: "set-status";
    hash: EntryHashB64;
    status: string;
  }
  | {
    type: "set-index";
    hash: EntryHashB64;
    index: number;
  }
//   | {
//     type: "set-agent-board";
//     hash: EntryHashB64;
//     agent: AgentPubKeyB64;
//     state: boolean;
//   }
  ;

export type BoardListGrammar = SynGrammar<
BoardListDelta,
BoardListState
>;

export const boardListGrammar: BoardListGrammar = {
    initState(state)  {
        state.avatars = {}
        state.boards = []
        state.agentBoards = {}
    },
    applyDelta( 
        delta: BoardListDelta,
        state: BoardListState,
        _ephemeralState: any,
        _author: AgentPubKey
      ) {
        if (delta.type == "add-board") {
            const record: BoardRecord = {
                name: delta.name,
                hash: delta.hash,
                status: delta.status,
            }
            state.boards.unshift(record)
        }
        if (delta.type == "set-name") {
            state.boards.forEach((board, i) => {
                if (board.hash === delta.hash) {
                  state.boards[i].name = delta.name;
                }
            });
        }
        if (delta.type == "set-avatar") {
            state.avatars[delta.pubKey] = delta.avatar
        }
        if (delta.type == "set-status") {
            state.boards.forEach((board, i) => {
                if (board.hash === delta.hash) {
                  state.boards[i].status = delta.status;
                }
            });
        }
        if (delta.type == "set-index") {
            const index = state.boards.findIndex((board) => board.hash == delta.hash)
            if (index >= 0) {
              const c = state.boards[index]
              state.boards.splice(index,1)
              state.boards.splice(index, 0, c)
            }
        }
      }
    }


export class BoardList {
    public workspace: WorkspaceStore<BoardListGrammar>
    public session: SessionStore<BoardListGrammar>

    activeBoards: AsyncReadable<ReadonlyMap<Uint8Array, BoardState>>
    archivedBoards: AsyncReadable<ReadonlyMap<Uint8Array, BoardState>>
    allBoards: AsyncReadable<ReadonlyMap<Uint8Array, BoardState>>
    activeBoardHash: Writable<EntryHash| undefined> = writable(undefined)
    activeBoardHashB64: Derived<string| undefined> = derived(this.activeBoardHash, s=> s ? encodeHashToBase64(s): undefined)
    boardCount: AsyncReadable<number>
    boards: HoloHashMap<EntryHash, Board> = new HoloHashMap()
    boardParticipants: HoloHashMap<EntryHash, AsyncReadable<AgentPubKey[]>> = new HoloHashMap()
    boardParticipantsAsync: AsyncReadable<ReadonlyMap<EntryHash, AgentPubKey[]>> 

    documents: LazyHoloHashMap<EntryHash, DocumentStore<BoardGrammar>> = new LazyHoloHashMap( documentHash =>
         new DocumentStore(this.synStore, boardGrammar, documentHash))

    agentBoards: LazyHoloHashMap<AgentPubKey, AsyncReadable<Array<BoardStateData>>> = new LazyHoloHashMap(agent =>
        pipe(this.synStore.documentHashesByTag.get("board"),
            documentHashes => joinAsync(documentHashes.map(documentHash=>this.documents.get(documentHash).allAuthors)),
            (documentsAuthors, documentHashes) => {
                const agentDocuments = []
                const b64 = encodeHashToBase64(agent)
                for (let i = 0; i< documentsAuthors.length; i+=1) {
                    if (documentsAuthors[i].find(a=>encodeHashToBase64(a) == b64)) {
                        const hash = documentHashes[i]
                        const state = this.boards.get(hash).workspace.latestSnapshot
                        agentDocuments.push(asyncDerived(state, state=>{return {hash, state}}))
                    }
                }
                return joinAsync(agentDocuments)
            }
        )
    )

    allAgentBoards: AsyncReadable<ReadonlyMap<AgentPubKey, Array<BoardStateData>>>
   
    boardData = new LazyHoloHashMap( documentHash => {
        const docStore = this.documents.get(documentHash)

        return pipe(docStore.allWorkspacesHashes,
            workspaces => {
                let board = this.boards.get(documentHash)
                let workspace: WorkspaceStore<BoardGrammar>
                if (!board) {
                    workspace = new WorkspaceStore(docStore, workspaces[0])
                    board = new Board(docStore, workspace)
                    this.boards.set(documentHash, board)
                    this.boardParticipants.set(documentHash, board.sessionParticipants())
                } else {
                    workspace = new WorkspaceStore(docStore, workspaces[0])
                }
                return workspace.latestSnapshot
            },
        )
    })

    constructor(public profilseStore: ProfilesStore, public synStore: SynStore, public documentStore: DocumentStore<BoardListGrammar>) {
        this.allAgentBoards = pipe(this.profilseStore.agentsWithProfile,
            agents=>sliceAndJoin(this.agentBoards, agents)
        )
        const boardHashes = this.synStore.documentHashesByTag.get("board")
        const archivedHashes = this.synStore.documentHashesByTag.get("archived")
        this.activeBoards = pipe(boardHashes,
            docHashes => sliceAndJoin(this.boardData, docHashes)
        )
        this.archivedBoards = pipe(archivedHashes,
            docHashes => sliceAndJoin(this.boardData, docHashes)
        )

        const joined = joinAsync([boardHashes, archivedHashes])


        const asyncJoined = asyncDerived(joined, 
            ([boards,archived]) => [...boards, ...archived]
            )
        this.allBoards = pipe(asyncJoined,
            docHashes => sliceAndJoin(this.boardData, docHashes)
        )
        this.boardCount =  asyncDerived(joined,
            ([boards,archived]) => boards.length + archived.length
        )
        this.boardParticipantsAsync =  pipe(asyncJoined,
            docHashes => sliceAndJoin(this.boardParticipants, docHashes)
        )

    }

    requestBoardChanges(boardHash:EntryHash, changes) {
        const board = this.boards.get(boardHash)
        if (board) {
            board.requestChanges(changes)
        }
    }

    public static async Create(profilesStore: ProfilesStore, synStore: SynStore) {
        const {documentHash, firstCommitHash} = await synStore.createDeterministicDocument(boardListGrammar, {type: CommitTypeBoardList})
        await synStore.client.tagDocument(documentHash, "boardList")
        const documentStore = new DocumentStore(synStore, boardListGrammar, documentHash)
        const me = new BoardList(profilesStore, synStore, documentStore);
        const workspaceHash = await documentStore.createWorkspace(
            'main',
            firstCommitHash
           );
        // TODO remove the "auto-join"
        me.workspace = new WorkspaceStore(documentStore, workspaceHash)
        me.session = await me.workspace.joinSession()
        return me
    }

    public static async Join(profilesStore: ProfilesStore, synStore: SynStore, documentHash: EntryHash) {
        const documentStore = new DocumentStore(
            synStore,
            boardListGrammar,
            documentHash
          );
        const me = new BoardList(profilesStore, synStore, documentStore);
        console.log("BoardList", me)
        
        const workspaces = await toPromise(documentStore.allWorkspaces);
        console.log("Workspaces", workspaces)

        // if there is no workspace then we have a problem!!
        for (let i=0;i<workspaces.length;i+=1) {
            try {
                me.workspace = new WorkspaceStore(documentStore, workspaces[i].entryHash)
                me.session = await me.workspace.joinSession()
                return me
            } catch(e) {
                console.log("failed to join workspace ",i, "with error",e, " trying next")
            }
        }
        throw("failed to join any workspace")
    }
    hash() : EntryHash {
        return this.documentStore.documentHash
    }
    async close() {
        await this.session.leaveSession()
    }
    stateStore() {
        return this.session.state
    }
    state() {
        return get(this.session.state)
    }
    requestChanges(deltas: Array<BoardListDelta>) {
        console.log("REQUESTING BOARDLIST CHANGES: ", deltas)
        this.session.requestChanges(deltas)
    }
    participants()  {
        return this.session.participants
    }
    avatars() {
        console.log("AVATARS: ",get(this.session.state))
        return derived(this.session.state, state => state.avatars)
    }
    async commitChanges() {
        this.session.commitChanges()
    }

    getReadableBoardState(documentHash: EntryHash | undefined)  : Readable<BoardState> | undefined {
        if (!documentHash) return undefined
        const board = this.boards.get(documentHash)
        if (board)
            return board.readableState()
        return undefined
    }
    
    getBoard(documentHash: EntryHash) : Board | undefined {
        if (!documentHash) return undefined
        const board = this.boards.get(documentHash)
        return board
    }

    async setActiveBoard(hash: EntryHash | undefined) {
        if (hash) {
            const board = this.boards.get(hash)
            if (board) {
                await board.join()
                console.log("joined")
            } else {
                console.log("NO BOARD")
            }
        } 
        this.activeBoardHash.update((n) => {return hash} )
    }

    async archiveBoard(documentHash: EntryHash) {
        await this.synStore.client.removeDocumentTag(documentHash, "board")
        await this.synStore.client.tagDocument(documentHash, "archived")
        if (encodeHashToBase64(get(this.activeBoardHash)) == encodeHashToBase64(documentHash)) {
            await this.setActiveBoard(undefined)
        }
    }

    async unarchiveBoard(documentHash: EntryHash) {
        await this.synStore.client.removeDocumentTag(documentHash, "archived")
        await this.synStore.client.tagDocument(documentHash, "board")
    }

    async closeActiveBoard() {
        const hash = get(this.activeBoardHash)
        if (hash) {
            const board = this.getBoard(hash)
            if (board) await board.leave()
            this.setActiveBoard(undefined)
        }
    }

    async makeBoard(options: BoardState, fromHash?: EntryHashB64) : Promise<Board> {
        const board = await Board.Create(this.synStore)
        this.boards.set(board.hash(), board)
        const sessionStore = board.session
        const boardHash = board.hashB64
        this.boards[boardHash] = board 
        if (!options.name) {
            options.name = "untitled"
        }
        if (options !== undefined) {
            let changes : BoardDelta[] = [{
                type: "set-state",
                state: options
                },
            ]
            if (changes.length > 0) {
                board.requestChanges(changes)
                await sessionStore.commitChanges()
            }

            this.requestChanges([{
                type: 'add-board',
                name: board.state().name,
                hash: boardHash,
                status: ""
                },
            ])
        
        }
        return board
    }
}
