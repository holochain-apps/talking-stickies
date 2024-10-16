import { type SynStore,  WorkspaceStore } from "@holochain-syn/core";
import { Board } from "./board";
import { LazyHoloHashMap } from "@holochain-open-dev/utils";
import { derived, get, writable, type Readable, type Writable } from "svelte/store";
import type { BoardDelta, BoardState } from "./board";
import { type AgentPubKey, type EntryHash, type EntryHashB64, encodeHashToBase64 } from "@holochain/client";
import { type AsyncReadable, asyncDerived, joinAsync, pipe, sliceAndJoin, toPromise, alwaysSubscribed} from '@holochain-open-dev/stores'
import type { ProfilesStore } from "@holochain-open-dev/profiles";
import { cloneDeep } from "lodash";

export enum BoardType {
    active = "active",
    archived = "archived"
}

export interface TypedHash {
    hash: EntryHash
    type: BoardType
}

export interface BoardAndLatestState {
    board: Board,
    latestState: BoardState,
}

export class BoardList {
    activeBoardHashes: AsyncReadable<EntryHash[]>
    archivedBoardHashes: AsyncReadable<EntryHash[]>
 //   typedHashes: AsyncReadable<Array<TypedHash>>
    activeBoard: Writable<Board| undefined> = writable(undefined)
    allBoards: AsyncReadable<ReadonlyMap<Uint8Array, BoardAndLatestState>>
    activeBoardHash: Writable<EntryHash| undefined> = writable(undefined)
    activeBoardHashB64: Readable<string| undefined> = derived(this.activeBoardHash, s=> s ? encodeHashToBase64(s): undefined)
    boardCount: AsyncReadable<number>

    boardData2 = new LazyHoloHashMap( documentHash => {
        const docStore = this.synStore.documents.get(documentHash)

        const board = pipe(docStore.allWorkspaces,
            workspaces => {
                return new Board(docStore,  new WorkspaceStore(docStore, Array.from(workspaces.keys())[0]))
            }
        ) 
        const latestState = pipe(board, 
            board => board.workspace.latestState
            )
        return alwaysSubscribed(pipe(joinAsync([board, latestState]), ([board, latestState]) => {return {board,latestState}}))
    })

        
    allAgentBoards: AsyncReadable<ReadonlyMap<AgentPubKey, Array<BoardAndLatestState>>>
   

    constructor(public profilseStore: ProfilesStore, public synStore: SynStore) {   

        const boardHashes = asyncDerived(this.synStore.documentsByTag.get(BoardType.active),x=>Array.from(x.keys()))
        this.activeBoardHashes = boardHashes
        const archivedHashes = asyncDerived(this.synStore.documentsByTag.get(BoardType.archived),x=>Array.from(x.keys()))
        this.archivedBoardHashes = archivedHashes

        // const activeTypedHashes = asyncDerived(boardHashes, hashes=>hashes.map(hash=>{const h:TypedHash = {hash, type:BoardType.active}; return h}))
        // const archivedTypedHashes = asyncDerived(archivedHashes, hashes=>hashes.map(hash=>{const h:TypedHash = {hash,type:BoardType.archived}; return h}))

        // const joinedTyped = joinAsync([activeTypedHashes, archivedTypedHashes])
        // this.typedHashes = asyncDerived(joinedTyped, 
        //     ([active,archived]) => [...active, ...archived]
        //     )

        const joined = joinAsync([boardHashes, archivedHashes])

        const asyncJoined = asyncDerived(joined, 
            ([boards,archived]) => [...boards, ...archived]
            )
        this.allBoards = pipe(asyncJoined,
            docHashes => sliceAndJoin(this.boardData2, docHashes)
        )
        this.boardCount =  asyncDerived(joined,
            ([boards,archived]) => boards.length + archived.length
        )
    }
    
    async getBoard(documentHash: EntryHash) : Promise<Board | undefined> {
        if (!documentHash) return undefined
        const board = await toPromise(this.boardData2.get(documentHash))
        return board.board
    }

    async setActiveBoard(hash: EntryHash | undefined) : Promise<Board | undefined> {
        let board: Board | undefined = undefined
        if (hash) {
            board = (await toPromise(this.boardData2.get(hash))).board
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

        return board
    }

    async archiveBoard(documentHash: EntryHash) : Promise<boolean> {
        let wasActive = false
        await this.synStore.client.removeDocumentTag(documentHash, BoardType.active)
        await this.synStore.client.tagDocument(documentHash, BoardType.archived)
        if (encodeHashToBase64(get(this.activeBoardHash)) == encodeHashToBase64(documentHash)) {
            await this.setActiveBoard(undefined)
            wasActive = true
        }
        return wasActive
    }

    async unarchiveBoard(documentHash: EntryHash) {
        await this.synStore.client.removeDocumentTag(documentHash, BoardType.archived)
        await this.synStore.client.tagDocument(documentHash, BoardType.active)
    }

    async closeActiveBoard(leave: boolean) {
        const hash = get(this.activeBoardHash)
        if (hash) {
            if (leave) {
                const board = await this.getBoard(hash)
                if (board) await board.leave()
                else console.log("Board Not Found!")
            }
            this.setActiveBoard(undefined)
        }
    }

    async cloneBoard(board: BoardState) : Promise<Board>  {
        const newBoard = cloneDeep(board) as BoardState
        newBoard.stickies = []
        newBoard.props.description = ""
        Object.keys(newBoard.grouping).forEach(key=>newBoard.grouping[key] = [])
        newBoard.name = `copy of ${newBoard.name}`
        return this.makeBoard(newBoard)
    }

    async makeBoard(options: Partial<BoardState>) : Promise<Board> {
        if (!options.name) {
            options.name = "untitled"
        }
        const board = await Board.Create(this.synStore, options)
        return board
    }
}
