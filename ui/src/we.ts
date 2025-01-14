import { DocumentStore, SynClient, SynStore, WorkspaceStore } from '@holochain-syn/core';
import type { BoardEphemeralState, BoardState } from './board';
import { asyncDerived, pipe, sliceAndJoin, toPromise } from '@holochain-open-dev/stores';
import { BoardType } from './boardList';
import { LazyHoloHashMap } from '@holochain-open-dev/utils';
import type { AppletHash, AppletServices, AssetInfo, RecordInfo, WAL, WeaveServices } from '@theweave/api';
import { getMyDna } from './util';
import type { AppClient, RoleName, ZomeName } from '@holochain/client';

const ROLE_NAME = "talking-stickies"
const ZOME_NAME = "syn"

const BOARD_ICON_SRC = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="16" width="14" viewBox="0 0 448 512"><!--!Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M64 80c-8.8 0-16 7.2-16 16V416c0 8.8 7.2 16 16 16H288V352c0-17.7 14.3-32 32-32h80V96c0-8.8-7.2-16-16-16H64zM288 480H64c-35.3 0-64-28.7-64-64V96C0 60.7 28.7 32 64 32H384c35.3 0 64 28.7 64 64V320v5.5c0 17-6.7 33.3-18.7 45.3l-90.5 90.5c-12 12-28.3 18.7-45.3 18.7H288z"/></svg>`

export const appletServices: AppletServices = {
    // Types of attachment that this Applet offers for other Applets to be created
    creatables: {
      'board': {
        label: "Board",
        icon_src: BOARD_ICON_SRC,
      }
    },

    // Types of UI widgets/blocks that this Applet supports
    blockTypes: {},

    bindAsset: async (appletClient: AppClient,
      srcWal: WAL, dstWal: WAL): Promise<void> => {
      console.log("Bind requested.  Src:", srcWal, "  Dst:", dstWal)
    },

    getAssetInfo: async (
      appletClient: AppClient,
      wal: WAL,
      recordInfo: RecordInfo,
    ): Promise<AssetInfo | undefined> => {
      if (recordInfo) {
        const roleName: RoleName = recordInfo.roleName
        // const integrityZomeName: ZomeName = recordInfo.integrityZomeName
        const entryType: string = recordInfo.entryType

        const synClient = new SynClient(appletClient, roleName, ZOME_NAME);
        const synStore = new SynStore(synClient);
        const documentHash = wal.hrl[1]
        const docStore = new DocumentStore<BoardState, BoardEphemeralState> (synStore, documentHash)
        const workspaces = await toPromise(docStore.allWorkspaces)
        const workspace = new WorkspaceStore(docStore, Array.from(workspaces.keys())[0])
        const latestState = await toPromise(workspace.latestState)

        return {
          icon_src: BOARD_ICON_SRC,
          name: latestState.name,
        };
      } else {
        throw new Error("Null WAL not supported, must supply a recordInfo")
      }
    },
    search: async (
      appletClient: AppClient,
      appletHash: AppletHash,
      weServices: WeaveServices,
      searchFilter: string
    ): Promise<Array<WAL>> => {
        const synClient = new SynClient(appletClient, ROLE_NAME, ZOME_NAME);
        const synStore = new SynStore(synClient);
        const boardHashes = asyncDerived(synStore.documentsByTag.get(BoardType.active),x=>Array.from(x.keys()))
            
        const boardData = new LazyHoloHashMap( documentHash => {
            const docStore = synStore.documents.get(documentHash)
    
            const workspace = pipe(docStore.allWorkspaces,
                workspaces => {
                    return new WorkspaceStore(docStore, Array.from(workspaces.keys())[0])
                }
            ) 
            const latestState = pipe(workspace, 
                w => w.latestState
                )
            return latestState
        })
    
        const allBoardsAsync = pipe(boardHashes,
            docHashes => sliceAndJoin(boardData, docHashes)
        )

        const allBoards = Array.from((await toPromise(allBoardsAsync)).entries())
        const dnaHash = await getMyDna(ROLE_NAME, appletClient)

        return allBoards
            .filter((r) => !!r)
            .filter((r) => {
                const state = r[1]
                return state.name.toLowerCase().includes(searchFilter.toLowerCase())
            })
            .map((r) => ({ hrl: [dnaHash, r![0]], context: {} }));
    },
};