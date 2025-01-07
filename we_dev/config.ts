import { defineConfig } from '@theweave/cli';

export default defineConfig({
  toolCurations: [
    {
      url: 'https://raw.githubusercontent.com/lightningrodlabs/weave-tool-curation/refs/heads/test-0.13/0.13/lists/curations-0.13.json',
      useLists: ['default'],
    },
  ],  groups: [
    {
      name: 'Lightning Rod Labs',
      networkSeed: '098rc1m-09384u-crm-29384u-cmkj',
      icon: {
        type: 'filesystem',
        path: './we_dev/lrl-icon.png',
      },
      creatingAgent: {
        agentIdx: 1,
        agentProfile: {
          nickname: 'Zippy',
          avatar: {
            type: 'filesystem',
            path: './we_dev/zippy.jpg',
          },
        },
      },
      joiningAgents: [
        {
          agentIdx: 2,
          agentProfile: {
            nickname: 'Zerbina',
            avatar: {
              type: 'filesystem',
              path: './we_dev/zerbina.jpg',
            },
          },
        },
      ],
      applets: [
        {
          name: 'TalkingStickies Hot Reload',
          instanceName: 'TalkingStickies Hot Reload',
          registeringAgent: 1,
          joiningAgents: [2],
        },
        {
          name: 'kando',
          instanceName: 'kando',
          registeringAgent: 1,
          joiningAgents: [2,3],
        },
        // {
        //   name: 'gamez',
        //   instanceName: 'gamez',
        //   registeringAgent: 1,
        //   joiningAgents: [2],
        // },
        // {
        //   name: 'notebooks',
        //   instanceName: 'notebooks',
        //   registeringAgent: 1,
        //   joiningAgents: [2],
        // },
      ],
    },
  ],
  applets: [
    {
      name: 'TalkingStickies Hot Reload',
      subtitle: 'TalkingStickies',
      description: 'talk it!',
      icon: {
        type: 'filesystem',
        path: './we_dev/talking-stickies_icon.png',
      },
      source: {
        type: 'localhost',
        happPath: './workdir/talking-stickies.happ',
        uiPort: 8888,
      },
    },
    {
      name: 'kando',
      subtitle: 'kanban boards',
      description: 'Real-time kanban boards based on syn',
      icon: {
        type: "https",
        url: "https://raw.githubusercontent.com/holochain-apps/kando/main/we_dev/kando_icon.png"
      },
      source: {
        type: "https",
        url: "https://github.com/holochain-apps/kando/releases/download/v0.12.0-rc.1/kando.webhapp"
      },
    },
    // {
    //   name: 'gamez',
    //   subtitle: 'play!',
    //   description: 'Real-time games based on syn',
    //   icon: {
    //     type: "https",
    //     url: "https://raw.githubusercontent.com/holochain-apps/gamez/main/we_dev/gamez_icon.svg"
    //   },
    //   source: {
    //     type: "https",
    //     url: "https://github.com/holochain-apps/gamez/releases/download/v0.5.0/gamez.webhapp"
    //   },
    // },
    //   {
    //   name: 'notebooks',
    //   subtitle: 'Collaborative note taking',
    //   description: 'Real-time notetaking based on syn',
    //   icon: {
    //     type: 'https',
    //     url: 'https://lightningrodlabs.org/projects/notebooks_logo.svg',
    //   },
    //   source: {
    //     type: 'https',
    //     url: 'https://github.com/lightningrodlabs/notebooks/releases/download/v0.2.10/notebooks.webhapp',
    //   },
    // },
  ],
});