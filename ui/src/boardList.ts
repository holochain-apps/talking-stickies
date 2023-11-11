import { DocumentStore,  type SynStore,  WorkspaceStore, SessionStore } from "@holochain-syn/core";
import { Board, type BoardStateData } from "./board";
import { HoloHashMap, LazyHoloHashMap } from "@holochain-open-dev/utils";
import { derived, get, writable, type Readable, type Writable } from "svelte/store";
import { boardGrammar, type BoardDelta, type BoardGrammar, type BoardState } from "./board";
import { type AgentPubKey, type EntryHash, type EntryHashB64, encodeHashToBase64 } from "@holochain/client";
import { type AsyncReadable, asyncDerived, joinAsync, pipe, sliceAndJoin} from '@holochain-open-dev/stores'
import type { ProfilesStore } from "@holochain-open-dev/profiles";

export interface BoardRecord {
    hash: EntryHashB64
    name: string
    status: string
}

export class BoardList {
    activeBoard: Writable<Board| undefined> = writable(undefined)
    activeBoards: AsyncReadable<ReadonlyMap<Uint8Array, BoardState>>
    archivedBoards: AsyncReadable<ReadonlyMap<Uint8Array, BoardState>>
    allBoards: AsyncReadable<ReadonlyMap<Uint8Array, BoardState>>
    activeBoardHash: Writable<EntryHash| undefined> = writable(undefined)
    activeBoardHashB64: Readable<string| undefined> = derived(this.activeBoardHash, s=> s ? encodeHashToBase64(s): undefined)
    boardCount: AsyncReadable<number>
    boards: HoloHashMap<EntryHash, Board> = new HoloHashMap()

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
                } else {
                    workspace = new WorkspaceStore(docStore, workspaces[0])
                }
                return workspace.latestSnapshot
            },
        )
    })

    constructor(public profilseStore: ProfilesStore, public synStore: SynStore) {
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
    }

    requestBoardChanges(boardHash:EntryHash, changes) {
        const board = this.boards.get(boardHash)
        if (board) {
            board.requestChanges(changes)
        }
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
                this.activeBoard.update((n) => {return board} )
            } else {
                console.log("NO BOARD")
            }
        } else {
            this.activeBoard.update((n) => {return undefined} )
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
        this.boards.set(board.hash, board)
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
        }
        return board
    }
}
