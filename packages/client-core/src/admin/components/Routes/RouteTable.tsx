import React from 'react'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableContainer from '@material-ui/core/TableContainer'
import TableHead from '@material-ui/core/TableHead'
import TablePagination from '@material-ui/core/TablePagination'
import TableRow from '@material-ui/core/TableRow'
import { useDispatch } from 'react-redux'
import { useAuthState } from '../../../user/reducers/auth/AuthState'
import { useRouteStyles, useRouteStyle } from './styles'
import { useRouteState } from '../../reducers/admin/routes/RouteState'
import { RouteService } from '../../reducers/admin/routes/RouteService'
import { Checkbox } from '@material-ui/core'

export interface RoutePropsTable {}

export interface RouteData {
  id: string
  project: string
  route: string
  active: any
}

export interface RouteColumn {
  id: 'project' | 'route' | 'active'
  label: string
  minWidth?: number
  align?: 'right'
}

export const routeColumns: RouteColumn[] = [
  { id: 'project', label: 'Project', minWidth: 65 },
  { id: 'route', label: 'Route', minWidth: 65 },
  {
    id: 'active',
    label: 'Active',
    minWidth: 65,
    align: 'right'
  }
]

/**
 * Temporary
 */
const ROUTE_PAGE_LIMIT = 10

/**
 *
 * @param props
 * @returns
 */

const RouteTable = (props: RoutePropsTable) => {
  const classes = useRouteStyle()
  const classex = useRouteStyles()

  const [page, setPage] = React.useState(0)
  const [rowsPerPage, setRowsPerPage] = React.useState(ROUTE_PAGE_LIMIT)

  const authState = useAuthState()
  const user = authState.user
  const adminRouteState = useRouteState()
  const adminRoute = adminRouteState.routes || []
  const activeRouteData = adminRoute.activeRoutes || []
  const installedRouteData = adminRoute.routes || []
  const adminRouteCount = adminRoute.total

  const handlePageChange = (event: unknown, newPage: number) => {
    const incDec = page < newPage ? 'increment' : 'decrement'
    RouteService.fetchActiveRoutes(incDec)
    RouteService.fetchInstalledRoutes(incDec)
    setPage(newPage)
  }

  React.useEffect(() => {
    if (user?.id?.value && adminRoute.updateNeeded.value === true) {
      RouteService.fetchActiveRoutes()
      RouteService.fetchInstalledRoutes()
    }
  }, [authState.user?.id?.value, adminRouteState.routes.updateNeeded.value])

  React.useEffect(() => {
    RouteService.fetchActiveRoutes()
    RouteService.fetchInstalledRoutes()
  }, [])

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(+event.target.value)
    setPage(0)
  }

  const isRouteActive = (project, route) => {
    return (
      activeRouteData.findIndex((a) => {
        return a.project.value === project && a.route.value === route
      }) !== -1
    )
  }

  const installedRoutes = installedRouteData
    .map((el) =>
      el.routes.map((route) => {
        return {
          id: el.project.value + route.value,
          project: el.project.value,
          route: route.value,
          active: <Checkbox checked={isRouteActive(el.project.value, route.value)} />
        }
      })
    )
    .flat() as RouteData[]

  return (
    <div className={classes.root}>
      <TableContainer className={classes.container}>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              {routeColumns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  style={{ minWidth: column.minWidth }}
                  className={classex.tableCellHeader}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {installedRoutes.map((row) => {
              return (
                <TableRow hover role="checkbox" tabIndex={-1} key={row.id}>
                  {routeColumns.map((column) => {
                    const value = row[column.id]
                    return (
                      <TableCell key={column.id} align={column.align} className={classex.tableCellBody}>
                        {value}
                      </TableCell>
                    )
                  })}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[ROUTE_PAGE_LIMIT]}
        component="div"
        count={adminRouteCount.value}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        className={classex.tableFooter}
      />
    </div>
  )
}

export default RouteTable
