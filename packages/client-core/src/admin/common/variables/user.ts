export interface UserColumn {
  id: 'id' | 'name' | 'avatarId' | 'accountIdentifier' | 'isGuest' | 'location' | 'inviteCode' | 'instanceId' | 'action'
  label: string
  minWidth?: number
  align?: 'right'
}

export const userColumns: UserColumn[] = [
  { id: 'id', label: 'User Id', minWidth: 65 },
  { id: 'name', label: 'Name', minWidth: 65 },
  { id: 'avatarId', label: 'Avatar', minWidth: 65 },
  { id: 'accountIdentifier', label: 'Linked Accounts', minWidth: 65 },
  {
    id: 'isGuest',
    label: 'Is Guest',
    minWidth: 65,
    align: 'right'
  },
  /** @todo replace this with a list of locations */
  // {
  //   id: 'location',
  //   label: 'Location',
  //   minWidth: 65,
  //   align: 'right'
  // },
  {
    id: 'inviteCode',
    label: 'Invite code',
    minWidth: 65,
    align: 'right'
  },
  // {
  //   id: 'instanceId',
  //   label: 'Instance',
  //   minWidth: 65,
  //   align: 'right'
  // },
  {
    id: 'action',
    label: 'Action',
    minWidth: 65,
    align: 'right'
  }
]

export interface UserData {
  id: string
  el: any
  name: string
  avatarId: string | JSX.Element
  accountIdentifier: string | JSX.Element
  isGuest: string
  inviteCode: string | JSX.Element
  action: any
}
export interface UserProps {
  className?: string
  removeUserAdmin?: any
  authState?: any
  adminUserState?: any
  fetchUsersAsAdmin?: any
  search: string
}

export interface UserTabPanelProps {
  children?: React.ReactNode
  index: any
  value: any
}
