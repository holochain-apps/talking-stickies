<script lang="ts">
    import { getContext } from "svelte";
    import type { EntryHashB64 } from '@holochain/client';
    import {faSearch } from '@fortawesome/free-solid-svg-icons';
    import Fa from 'svelte-fa';
    import '@shoelace-style/shoelace/dist/components/select/select.js';
    import '@shoelace-style/shoelace/dist/components/option/option.js';
    import '@shoelace-style/shoelace/dist/components/input/input.js';
    import '@shoelace-style/shoelace/dist/components/icon/icon.js';
    import '@shoelace-style/shoelace/dist/components/menu/menu.js';
    import '@shoelace-style/shoelace/dist/components/menu-item/menu-item.js';
    import '@shoelace-style/shoelace/dist/components/menu-label/menu-label.js';
    import type { v1 as uuidv1 } from "uuid";
    import type { BoardRecord } from './boardList';
    import { get } from 'svelte/store';
    import type { TalkingStickiesStore } from "./tsStore";

    type FoundSticky = {
        board: BoardRecord,
        sticky: uuidv1,
        text: string,
    }
    let foundStickies: Array<FoundSticky> = []
    let foundBoards: Array<BoardRecord> = []

    const { getStore } :any = getContext('tsStore');

    const store:TalkingStickiesStore = getStore();
    $: boardList = store.boardList.stateStore()
    $: activeHash = store.boardList.activeBoardHash;
    $: state = store.boardList.getReadableBoardState($activeHash);

    const selectBoard = (hash: EntryHashB64) => {
        store.boardList.setActiveBoard(hash)
    }

    const doSearch = (text:string) => {
        foundBoards = []
        foundStickies = []
        showSearchResults = true
        if (text == "") return
        const searchText = text.toLocaleLowerCase()
        $boardList.boards.forEach(b=> {
            if (b.name.toLocaleLowerCase().includes(searchText)) foundBoards.push(b)
            const board = store.boardList.getReadableBoardState(b.hash)
            const boardState = get(board)
            boardState.stickies.forEach((c)=>{
                if (c.props.text.toLocaleLowerCase().includes(searchText)) {
                    foundStickies.push({
                        board: b,
                        sticky: c.id,
                        text: c.props.text,
                    })
                }
            })
        })

    }
    const clearSearch = () => {
        searchInput.value = ""
        showSearchResults = false
    }

    const getStickyGroup = (stickyId: uuidv1) : string => {
        console.log("GROUPING", $state.grouping)
        const [gId, cId] = Object.entries($state.grouping).find(([gId, cId])=>cId==stickyId)
        const g = ($state.groups.find((g)=>g.id == gId))
        if (g) {
            return g.name
        }
        return "Archived"
    }

    let searchInput
    let showSearchResults = false

</script>

<div class="search">

<div style="position:relative; margin-left:10px;">
    <sl-input
        bind:this={searchInput}
        placeholder="Search"
        pill
        on:sl-input={(e)=>doSearch(e.target.value)}
        on:sl-blur={(e)=>showSearchResults=false}
        on:sl-focus={(e)=>doSearch(e.target.value)}
    >
    <span slot="prefix"style="margin-left:10px;"><Fa icon={faSearch}></Fa></span>
    </sl-input>
    {#if showSearchResults && (foundBoards.length>0 || foundStickies.length>0)}
    <sl-menu class="search-results"
    >
        {#if foundStickies.length>0}
            <sl-menu-label>Stickies</sl-menu-label>
            {#each foundStickies as found}
                <sl-menu-item
                    on:mousedown={(e)=>{
                        if (found.board.hash != $activeHash) {
                            selectBoard(found.board.hash)
                        }
                        //store.boardList.setActiveSticky(found.card)
                        clearSearch()
                    }}
                >
                <div style="margin-left:10px;display:flex;flex-direction: column;">
                    <span>{found.text} in {getStickyGroup(found.sticky)}</span>
                    <span style="font-size:70%;color:gray;line-heigth:50%;">Board: {found.board.name}</span>
                </div>
                </sl-menu-item>
            {/each}
        {/if}
        {#if foundBoards.length>0}
            {#if foundStickies.length> 0}<sl-divider></sl-divider>{/if}
            <sl-menu-label>Boards</sl-menu-label>
            {#each foundBoards as found}
                <sl-menu-item
                    on:mousedown={(e)=>{
                        if (found.hash != $activeHash) {
                            selectBoard(found.hash)
                        }
                        clearSearch()
                    }}
                >
                <div style="margin-left:10px;">
                    {found.name} 
                </div>
                </sl-menu-item>
            {/each}
        {/if}
    </sl-menu>
    {/if}
</div>

</div>
<style>
.search {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
}
.search-results {
    position: absolute;
    z-index: 10;
    box-shadow: 0px 0px 20px rgba(0, 0, 0, .15);
}
sl-input::part(base) {
    color: #fff;
    background-color: rgb(10 17 76);
    border: 1px solid rgba(71, 76, 154, 1.0);
}

sl-input::part(input) {
    color: #fff;
}
</style>