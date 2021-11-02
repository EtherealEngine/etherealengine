import { client } from '../../feathers'
import { store, useDispatch } from '../../store'
import { createState, DevTools, useState, none, Downgraded } from '@hookstate/core'
import { AdminAnalyticsResult } from '@xrengine/common/src/interfaces/AdminAnalyticsData'

//State
export const ANALYTICS_PAGE_LIMIT = 100

const state = createState({
  activeInstances: [],
  activeParties: [],
  instanceUsers: [],
  channelUsers: [],
  activeLocations: [],
  activeScenes: [],
  dailyUsers: [],
  dailyNewUsers: []
})

store.receptors.push((action: AnalyticsActionType): any => {
  let result: any, updateMap: any, date: Date
  state.batch((s) => {
    switch (action.type) {
      case 'ACTIVE_INSTANCES_FETCHED':
        result = action.analytics
        return s.merge({
          activeInstances: result.data
            .map((item) => {
              return [new Date(item.createdAt).getTime(), item.count]
            })
            .reverse()
        })
      case 'ACTIVE_PARTIES_FETCHED':
        result = action.analytics
        return s.merge({
          activeParties: result.data
            .map((item) => {
              return [new Date(item.createdAt).getTime(), item.count]
            })
            .reverse()
        })
      case 'ACTIVE_LOCATIONS_FETCHED':
        result = action.analytics
        return s.merge({
          activeLocations: result.data
            .map((item) => {
              return [new Date(item.createdAt).getTime(), item.count]
            })
            .reverse()
        })
      case 'ACTIVE_SCENES_FETCHED':
        result = action.analytics
        return s.merge({
          activeScenes: result.data
            .map((item) => {
              return [new Date(item.createdAt).getTime(), item.count]
            })
            .reverse()
        })
      case 'CHANNEL_USERS_FETCHED':
        result = action.analytics
        return s.merge({
          channelUsers: result.data
            .map((item) => {
              return [new Date(item.createdAt).getTime(), item.count]
            })
            .reverse()
        })
      case 'INSTANCE_USERS_FETCHED':
        result = action.analytics
        return s.merge({
          instanceUsers: result.data
            .map((item) => {
              return [new Date(item.createdAt).getTime(), item.count]
            })
            .reverse()
        })
      case 'DAILY_NEW_USERS_FETCHED':
        result = action.analytics
        return s.merge({
          dailyNewUsers: result.data
            .map((item) => {
              return [new Date(item.createdAt).getTime(), item.count]
            })
            .reverse()
        })
      case 'DAILY_USERS_FETCHED':
        result = action.analytics
        return s.merge({
          dailyUsers: result.data
            .map((item) => {
              return [new Date(item.createdAt).getTime(), item.count]
            })
            .reverse()
        })
    }
  }, action.type)
})

export const accessAnalyticsState = () => state

export const useAnalyticsState = () => useState(state) as any as typeof state

//Service
export const AnalyticsService = {
  fetchActiveParties: async () => {
    const dispatch = useDispatch()
    {
      try {
        const activeParties = await client.service('analytics').find({
          query: {
            type: 'activeParties',
            $limit: 30,
            $sort: {
              createdAt: -1
            }
          }
        })
        dispatch(AnalyticsAction.activePartiesFetched(activeParties))
      } catch (err) {
        console.log(err)
      }
    }
  },
  fetchActiveInstances: async () => {
    const dispatch = useDispatch()
    {
      try {
        const activeInstances = await client.service('analytics').find({
          query: {
            type: 'activeInstances',
            $limit: 30,
            $sort: {
              createdAt: -1
            }
          }
        })
        dispatch(AnalyticsAction.activeInstancesFetched(activeInstances))
      } catch (err) {
        console.log(err)
      }
    }
  },
  fetchActiveLocations: async () => {
    const dispatch = useDispatch()
    {
      try {
        const activeLocations = await client.service('analytics').find({
          query: {
            type: 'activeLocations',
            $limit: 30,
            $sort: {
              createdAt: -1
            }
          }
        })
        dispatch(AnalyticsAction.activeLocationsFetched(activeLocations))
      } catch (err) {
        console.log(err)
      }
    }
  },
  fetchActiveScenes: async () => {
    const dispatch = useDispatch()
    {
      try {
        const activeScenes = await client.service('analytics').find({
          query: {
            type: 'activeScenes',
            $limit: 30,
            $sort: {
              createdAt: -1
            }
          }
        })
        dispatch(AnalyticsAction.activeScenesFetched(activeScenes))
      } catch (err) {
        console.log(err)
      }
    }
  },
  fetchChannelUsers: async () => {
    const dispatch = useDispatch()
    {
      try {
        const channelUsers = await client.service('analytics').find({
          query: {
            type: 'channelUsers',
            $limit: 30,
            $sort: {
              createdAt: -1
            }
          }
        })
        dispatch(AnalyticsAction.channelUsersFetched(channelUsers))
      } catch (err) {
        console.log(err)
      }
    }
  },
  fetchInstanceUsers: async () => {
    const dispatch = useDispatch()
    {
      try {
        const instanceUsers = await client.service('analytics').find({
          query: {
            type: 'instanceUsers',
            $limit: 30,
            $sort: {
              createdAt: -1
            }
          }
        })
        dispatch(AnalyticsAction.instanceUsersFetched(instanceUsers))
      } catch (err) {
        console.log(err)
      }
    }
  },
  fetchDailyUsers: async () => {
    const dispatch = useDispatch()
    {
      try {
        const dailyUsers = await client.service('analytics').find({
          query: {
            $limit: 30,
            action: 'dailyUsers'
          }
        })
        dispatch(AnalyticsAction.dailyUsersFetched(dailyUsers))
      } catch (error) {
        console.log(error)
      }
    }
  },
  fetchDailyNewUsers: async () => {
    const dispatch = useDispatch()
    {
      try {
        const dailyNewUsers = await client.service('analytics').find({
          query: {
            $limit: 30,
            action: 'dailyNewUsers'
          }
        })
        dispatch(AnalyticsAction.dailyNewUsersFetched(dailyNewUsers))
      } catch (err) {
        console.log(err)
      }
    }
  }
}

//Action
export const AnalyticsAction = {
  activePartiesFetched: (analytics: AdminAnalyticsResult) => {
    return {
      type: 'ACTIVE_PARTIES_FETCHED' as const,
      analytics: analytics
    }
  },
  activeInstancesFetched: (analytics: AdminAnalyticsResult) => {
    return {
      type: 'ACTIVE_INSTANCES_FETCHED' as const,
      analytics: analytics
    }
  },
  channelUsersFetched: (analytics: AdminAnalyticsResult) => {
    return {
      type: 'CHANNEL_USERS_FETCHED' as const,
      analytics: analytics
    }
  },
  instanceUsersFetched: (analytics: AdminAnalyticsResult) => {
    return {
      type: 'INSTANCE_USERS_FETCHED' as const,
      analytics: analytics
    }
  },
  activeLocationsFetched: (analytics: AdminAnalyticsResult) => {
    return {
      type: 'ACTIVE_LOCATIONS_FETCHED' as const,
      analytics: analytics
    }
  },
  activeScenesFetched: (analytics: AdminAnalyticsResult) => {
    return {
      type: 'ACTIVE_SCENES_FETCHED' as const,
      analytics: analytics
    }
  },
  dailyUsersFetched: (analytics: AdminAnalyticsResult) => {
    return {
      type: 'DAILY_USERS_FETCHED' as const,
      analytics: analytics
    }
  },
  dailyNewUsersFetched: (analytics: AdminAnalyticsResult) => {
    return {
      type: 'DAILY_NEW_USERS_FETCHED' as const,
      analytics: analytics
    }
  }
}
export type AnalyticsActionType = ReturnType<typeof AnalyticsAction[keyof typeof AnalyticsAction]>
