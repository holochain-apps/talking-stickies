import type { WorkspaceStore, DocumentStore,  SessionStore, SynStore } from "@holochain-syn/core";
import { get, type Readable } from "svelte/store";
import { v1 as uuidv1 } from "uuid";
import { type AgentPubKey, type EntryHash, type EntryHashB64, encodeHashToBase64, type AgentPubKeyB64 } from "@holochain/client";
import { BoardType } from "./boardList";
import { toPromise } from "@holochain-open-dev/stores";
import type { HrlB64WithContext } from "@theweave/api";
import { cloneDeep } from "lodash";

export const UngroupedId = "_"
export class Group {
      id: uuidv1
      constructor(public name: string) {
          this.id =  uuidv1()
      }
}
export type BoardProps = {
  bgUrl: string,
  description: string,
  attachments: Array<HrlB64WithContext>
}

export class VoteType {
  type: uuidv1
  constructor(public emoji: string, public toolTip: string, public maxVotes: number){
      this.type = uuidv1()
  }
}

export type StickyProps = {
  text: string,
  color: string,
  votes: Object,
  attachments: Array<HrlB64WithContext>
}

export type Sticky = {
  id: uuidv1;
  props: StickyProps;
};

export type BoardEphemeralState = { [key: string]: string };

export interface BoardState {
  status: string;
  name: string;
  groups: Group[];
  grouping: { [key:string]: Array<uuidv1> };
  stickies: Sticky[];
  voteTypes: VoteType[];
  props: BoardProps;
  boundTo: Array<HrlB64WithContext>
}
  
export type BoardDelta =

| {
    type: "set-state";
    state: Partial<BoardState>;
  }
| {
    type: "set-status";
    status: string;
  }
| {
    type: "add-sticky";
    group: uuidv1;
    value: Sticky;
  }
| {
    type: "set-name";
    name: string;
  }
| {
    type: "set-groups";
    groups: Group[];
  }
| {
    type: "set-props";
    props: BoardProps;
  }
| {
    type: "set-vote-types";
    voteTypes: VoteType[];
  }
| {
    type: "set-group-order";
    id: uuidv1;
    order: Array<uuidv1>;
  }
| {
    type: "update-sticky-group";
    id: uuidv1;
    group: uuidv1;
    index: undefined | number
  }
| {
    type: "update-sticky-props";
    id: uuidv1;
    props: StickyProps;
  }
| {
    type: "update-sticky-votes";
    id: uuidv1;
    voteType: string;
    voter: AgentPubKeyB64;
    count: number
  }
| {
    type: "merge-stickies";
    srcId: uuidv1;
    dstId: uuidv1;
}
| {
    type: "delete-sticky";
    id: string;
  };

  const _removeStickyFromGroups = (state: BoardState, stickyId: uuidv1) => {
    _initGrouping(state)
    // remove the item from the group it's in
    Object.entries(state.grouping).forEach(([groupId, itemIds]) =>{
      const index = itemIds.findIndex((id) => id === stickyId)
      if (index >= 0) {
        state.grouping[groupId].splice(index,1)
      }
    })
  }
  const _addStickyToGroup = (state: BoardState, groupId: uuidv1, stickyId: uuidv1, index: undefined|number) => {
    _initGrouping(state)
    // add it to the new group
    if (state.grouping[groupId] !== undefined) {
      if (index === undefined || index >= state.grouping[groupId].length) {
        state.grouping[groupId].push(stickyId)
      } else {
        state.grouping[groupId].splice(index, 0, stickyId)
      }
    }
    else {
      state.grouping[groupId] = [stickyId]
    }
  }
  const _initGrouping = (state) => {
    if (state.grouping === undefined) {
      state.grouping = {}
      const ungrouped = []
      state.stickies.forEach((sticky)=>ungrouped.push(sticky.id))
      state.grouping[UngroupedId] = ungrouped
    }
    const groupingIds = Object.keys(state.grouping)
    for (const group of state.groups) {
      if (!groupingIds.includes(group.id)) {
        state.grouping[group.id] = []
      }
    }
  }
  const _setGroups = (newGroups, state) => {
    state.groups = newGroups
    if (state.groups === undefined) state.groups = []
    const idx = newGroups.findIndex((group) => group.id === UngroupedId)
    if (idx == -1) {
      state.groups.unshift({id:UngroupedId, name:""})
    }
    const idList = {}
    newGroups.forEach(group => {
      idList[group.id] = true
      // add an entry to the groupings for any new groups
      if (state.grouping[group.id] === undefined) {
        state.grouping[group.id] = []
      }
    })

    // remove any non-existent grouping lists
    Object.entries(state.grouping).forEach(([groupId, itemIds]) => {
      if (groupId != UngroupedId) {
        if (!idList[groupId]) {
          delete state.grouping[groupId]
          // move items from deleted groups to the ungrouped group
          state.grouping[UngroupedId] = state.grouping[UngroupedId].concat(itemIds)
        }
      }
    })
  }

  export const boardGrammar = {
    initialState(init: Partial<BoardState>|undefined = undefined)  {
      const state: BoardState = {
        status: "",
        name: "untitled",
        groups: [{id:UngroupedId, name: ""}],
        grouping: undefined,
        stickies: [],
        voteTypes: [],
        props: {bgUrl:"", description: "", attachments: []},
        boundTo: [],
      }
      if (init) {
        Object.assign(state, init);
      }
      _initGrouping(state)
      return state
    },
    applyDelta( 
      delta: BoardDelta,
      state: BoardState,
      _ephemeralState: any,
      _author: AgentPubKey
    ) {
      switch (delta.type) {
        case "set-state":
          if (delta.state.status !== undefined) state.status = delta.state.status
          if (delta.state.name !== undefined) state.name = delta.state.name
          if (delta.state.groups !== undefined) state.groups = delta.state.groups
          _setGroups(delta.state.groups, state)
          if (delta.state.stickies !== undefined) state.stickies = delta.state.stickies
          if (delta.state.voteTypes !== undefined) state.voteTypes = delta.state.voteTypes
          if (delta.state.props !== undefined) state.props = delta.state.props
          if (delta.state.boundTo !== undefined) state.boundTo = delta.state.boundTo
          if (delta.state.grouping !== undefined) {
            state.grouping = delta.state.grouping
          } else {
            _initGrouping(state)
          }
          break;
        case "set-name":
          state.name = delta.name
          break;
        case "set-props":
          state.props = delta.props
          break;
        case "set-groups":
          _initGrouping(state)
          _setGroups(delta.groups, state)
          break;
        case "set-group-order":
          _initGrouping(state)
          state.grouping[delta.id] = delta.order
          break;
        case "set-vote-types":
          state.voteTypes = delta.voteTypes
          break;
        case "add-sticky":
          _initGrouping(state)    
          state.stickies.push(delta.value)
          if (state.grouping[delta.group] !== undefined) {
            state.grouping[delta.group].push(delta.value.id)
          }
          else {
            state.grouping[delta.group] = [delta.value.id]
          }
          break;
        case "update-sticky-group":
          _removeStickyFromGroups(state, delta.id)
          _addStickyToGroup(state, delta.group, delta.id, delta.index)
          break;
        case "update-sticky-props":
          state.stickies.forEach((sticky, i) => {
            if (sticky.id === delta.id) {
              state.stickies[i].props = delta.props;
            }
          });
          break;
        case "update-sticky-votes":
          state.stickies.forEach((sticky, i) => {
            if (sticky.id === delta.id) {
              if (!state.stickies[i].props.votes[delta.voteType]) {
                state.stickies[i].props.votes[delta.voteType] = {}
              }
              state.stickies[i].props.votes[delta.voteType][delta.voter] = delta.count;
            }
          });
          break;
        case "merge-stickies":
          const srcIdx = state.stickies.findIndex((sticky) => sticky.id === delta.srcId)
          const dstIdx = state.stickies.findIndex((sticky) => sticky.id === delta.dstId)
          if (srcIdx >= 0 && dstIdx >= 0) {
            _removeStickyFromGroups(state, delta.srcId)
            const src = state.stickies[srcIdx]
            const dst = state.stickies[dstIdx]
            dst.props.text = `${dst.props.text}\n\n-----------\n\n${src.props.text}`
            dst.props.attachments = cloneDeep(dst.props.attachments.concat(src.props.attachments))
            state.stickies.splice(srcIdx,1)
          }
          break;
        case "delete-sticky":
          const index = state.stickies.findIndex((sticky) => sticky.id === delta.id)
          state.stickies.splice(index,1)
          _removeStickyFromGroups(state, delta.id)
          break;
      }
    },
  };
  
  export type BoardStateData = {
    hash: EntryHash,
    state: BoardState,
  }
  
export class Board {
    public session: SessionStore<BoardState, BoardEphemeralState> | undefined
    public hashB64: EntryHashB64

    constructor(public document: DocumentStore<BoardState, BoardEphemeralState>, public workspace: WorkspaceStore<BoardState, BoardEphemeralState>) {
      this.hashB64 = encodeHashToBase64(this.document.documentHash)
    }

    public static async Create(synStore: SynStore, init: Partial<BoardState>|undefined = undefined) {
      const initState = boardGrammar.initialState(init)
  
      const documentStore = await synStore.createDocument(initState,{})
  
      await synStore.client.tagDocument(documentStore.documentHash, BoardType.active)
  
      const workspaceStore = await documentStore.createWorkspace(
          `${new Date}`,
          undefined
         );
  
      const me = new Board(documentStore, workspaceStore);
      await me.join()
  
      if (initState !== undefined) {
        let changes : BoardDelta[] = [{
            type: "set-state",
            state: initState
            },
        ]
        if (changes.length > 0) {
            me.requestChanges(changes)
            await me.session.commitChanges()
        }
      }
  
      return me
    }

    get hash() : EntryHash {
        return this.document.documentHash
    }
   
    async join() {
      if (! this.session) 
        this.session = await this.workspace.joinSession()
      console.log("JOINED", this.session)
    }
    
    async leave() {
      if (this.session) {
        this.session.leaveSession()
        this.session = undefined
        console.log("LEFT SESSION")
      }
    }

    async forceLeave() {
      if (!this.session) {
        await this.join()
      }
      this.leave()
    }

    state(): BoardState | undefined {
        if (!this.session) {
          return undefined
        } else {
          return get(this.session.state)
        }
    }

    readableState(): Readable<BoardState> | undefined {
      if (!this.session) {
        return undefined
      } else {
        return this.session.state
      }
    }

    requestChanges(deltas: Array<BoardDelta>) {
        console.log("REQUESTING BOARD CHANGES: ", deltas)
      this.session.change((state,_eph)=>{
        for (const delta of deltas) {
          boardGrammar.applyDelta(delta, state,_eph, undefined)
        }
      })
    }

    sessionParticipants() {
      return this.workspace.sessionParticipants
    }

    async isParticipant(agent: AgentPubKey) : Promise<boolean> {
      const agentB64= encodeHashToBase64(agent)
      const participants = await toPromise(this.sessionParticipants())
      return participants.find(h=>encodeHashToBase64(h)==agentB64) ? true : false
    }

    participants()  {
      if (!this.session) {
        return undefined
      } else {
        return this.session._participants
      }
    }
    async commitChanges() {
        this.session.commitChanges()
    }
}
